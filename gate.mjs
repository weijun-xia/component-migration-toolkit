// 组件契约闸门（静态）：扫 .vue，按 contracts.mjs 检查——
//  1) 已用的目标库组件是否满足契约约束（如 tree 是否配了 :props、advanced-search 是否有 :fields）
//  2) 是否还有源库残留（el-/d-/aui-*），残留该换成什么 / 是不是真缺
// 只需 @vue/compiler-sfc，不用浏览器，离线可直接跑。
// 用法: node gate.mjs <目录，默认当前>
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@vue/compiler-sfc';
import { CONTRACTS } from './contracts.mjs';

const root = process.argv[2] || '.';
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();
const norm = (t) => (/^[A-Z]/.test(t) ? kebab(t) : t);

const byTarget = new Map();
const bySource = new Map();
for (const c of CONTRACTS) {
  if (c.target) byTarget.set(c.target, c);
  for (const s of c.source || []) bySource.set(s, c);
}

// —— 契约自检：target 必须是目标库真实组件（清单来自 target-components.mjs，由 extract-components.mjs 生成）——
let TARGET_TAGS = null;
try { ({ TARGET_TAGS } = await import('./target-components.mjs')); } catch {}
if (TARGET_TAGS) {
  const bad = CONTRACTS.filter((c) => c.target && !TARGET_TAGS.has(c.target));
  if (bad.length) {
    console.error('\n✗ 契约自检失败：以下 target 不是目标库真实组件（对照 target-components.mjs）：');
    for (const c of bad) console.error(`    ${(c.source || []).join('/')} → ${c.target}`);
    console.error('  修正组件名，或用 extract-components.mjs 刷新清单后重试。闸门已中止。\n');
    process.exit(1);
  }
  console.log(`契约自检 ✓ ${CONTRACTS.filter((c) => c.target).length} 条 target 均为目标库真实组件`);
} else {
  console.warn('⚠ 未找到 target-components.mjs，已跳过契约 target 自检（建议先跑 extract-components.mjs）。');
}

function walkFiles(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, acc);
    else if (e.name.endsWith('.vue')) acc.push(p);
  }
  return acc;
}
function walkAst(node, cb) { if (!node) return; if (node.type === 1) cb(node); for (const k of node.children || []) walkAst(k, cb); }
function propNames(node) {
  const s = new Set();
  for (const p of node.props || []) {
    if (p.type === 6) s.add(p.name);
    else if (p.type === 7) {
      if (p.name === 'bind' && p.arg?.content) s.add(p.arg.content);
      else if (p.name === 'model') { s.add('modelValue'); s.add('model-value'); }
    }
  }
  return s;
}

if (!fs.existsSync(root)) { console.error(`目录不存在: ${root}`); process.exit(1); }
const issues = [];
let files = 0, targetUsages = 0;
for (const abs of walkFiles(root)) {
  const rel = path.relative(root, abs).replace(/\\/g, '/');
  let ast;
  try { ast = parse(fs.readFileSync(abs, 'utf8')).descriptor.template?.ast; } catch { continue; }
  if (!ast) continue;
  files++;
  walkAst(ast, (node) => {
    const tag = norm(node.tag);
    const line = node.loc?.start?.line || 0;

    // 1) 目标库组件用法约束
    const c = byTarget.get(tag);
    if (c) {
      targetUsages++;
      const names = propNames(node);
      for (const rp of c.requiredProps || []) {
        if (!rp.names.some((n) => names.has(n))) {
          issues.push({ rel, line, tag, level: rp.level || 'warn', msg: rp.message });
        }
      }
    }

    // 2) 源库残留
    const sc = bySource.get(tag);
    if (sc) {
      if (!sc.target || sc.risk === 'forbidden') {
        issues.push({ rel, line, tag, level: 'error', msg: `残留且无目标库对应（${sc.notes || '真缺'}）` });
      } else {
        issues.push({ rel, line, tag, level: sc.risk === 'high' ? 'error' : 'warn', msg: `残留未替换 → 应换 ${sc.target}${sc.risk === 'high' ? '（高风险，按契约改）' : ''}` });
      }
    }
  });
}

const err = issues.filter((i) => i.level === 'error');
const warn = issues.filter((i) => i.level === 'warn');
const bar = '─'.repeat(76);
console.log('\n' + bar);
console.log('  组件契约闸门 · ' + root);
console.log(bar);
console.log(`  扫描 .vue ${files} 个 · 检查目标组件用法 ${targetUsages} 处 · 契约 ${CONTRACTS.length} 条`);
console.log(`  ✗ 错误 ${err.length} · ⚠ 警告 ${warn.length}`);
if (err.length) { console.log('\n  #### ✗ 错误（很可能坏，必须处理）'); for (const i of err) console.log(`    [${i.tag}] ${i.rel}:${i.line}\n        ${i.msg}`); }
if (warn.length) { console.log('\n  #### ⚠ 警告（需确认）'); for (const i of warn) console.log(`    [${i.tag}] ${i.rel}:${i.line}\n        ${i.msg}`); }
if (!issues.length) console.log('\n  ✓ 未发现契约违规');
console.log('\n' + bar + '\n');

let md = `# 组件契约闸门报告\n\n- 目录: ${root} · .vue ${files} · 检查目标组件用法 ${targetUsages} 处\n- 错误 ${err.length} · 警告 ${warn.length}\n\n`;
md += `## 错误（必须处理）\n\n` + (err.length ? err.map((i) => `- \`${i.tag}\` ${i.rel}:${i.line} — ${i.msg}`).join('\n') : '- 无') + '\n\n';
md += `## 警告（需确认）\n\n` + (warn.length ? warn.map((i) => `- \`${i.tag}\` ${i.rel}:${i.line} — ${i.msg}`).join('\n') : '- 无') + '\n';
fs.writeFileSync('report-gate.md', md);
console.log('  已写出 report-gate.md');
