// AST 源码扫描层（替换前清单）：递归解析 .vue，枚举源库(el-/d-/aui- 等)用法（+props/events+文件行号），
// 名字精确匹配目标库；匹配不上再走"功能语义匹配"(target-catalog.suggest)，产出三级：精确/语义候选/真缺 + 第三方库。
// 源库前缀、第三方前缀均取自 migrate.config.mjs。
// 用法: node scan.mjs <目录>（默认 sample-src）
import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@vue/compiler-sfc';
import { exactTarget, suggest } from './target-catalog.mjs';
import { config } from './migrate.config.mjs';

const root = process.argv[2] || 'sample-src';
const SRC_LIB = config.sourceLibs;
const THIRD_PARTY_STRICT = new Set(config.thirdPartyPrefixes);
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();

const SRC_PREFIXES = Object.keys(SRC_LIB);
const PascalRe = new RegExp('^(' + SRC_PREFIXES.map((p) => p[0].toUpperCase() + p.slice(1)).join('|') + ')[A-Z]');
const KebabRe = new RegExp('^(' + SRC_PREFIXES.join('|') + ')-(.+)$');

function classifyTag(tag) {
  let t = tag;
  if (PascalRe.test(tag)) t = kebab(tag);
  const m = t.match(KebabRe);
  return m ? { lib: SRC_LIB[m[1]] || m[1], base: m[2], tag: t } : null;
}
function thirdPartyLib(tag) {
  const t = /^[A-Z]/.test(tag) ? kebab(tag) : tag;
  const m = t.match(/^([a-z]+)-/);
  return m && THIRD_PARTY_STRICT.has(m[1]) ? m[1] : null;
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
function readApi(node) {
  const props = [], events = [];
  for (const p of node.props || []) {
    if (p.type === 6) props.push(p.name);
    else if (p.type === 7) {
      const arg = p.arg && p.arg.content;
      if (p.name === 'bind' && arg) props.push(arg);
      else if (p.name === 'on' && arg) events.push(arg);
    }
  }
  return { props, events };
}

if (!fs.existsSync(root)) { console.error(`目录不存在: ${root}`); process.exit(1); }
const files = walkFiles(root);
const usages = [];
const thirdParty = {};
let parsed = 0;
for (const abs of files) {
  const rel = path.relative(root, abs).replace(/\\/g, '/');
  let ast;
  try { ast = parse(fs.readFileSync(abs, 'utf8')).descriptor.template?.ast; } catch { continue; }
  if (!ast) continue;
  parsed++;
  walkAst(ast, (node) => {
    const c = classifyTag(node.tag);
    if (c) { usages.push({ file: rel, line: node.loc?.start?.line || 0, lib: c.lib, tag: c.tag, base: c.base, target: exactTarget(c.base), ...readApi(node) }); return; }
    const lib = thirdPartyLib(node.tag);
    if (lib) { const t = /^[A-Z]/.test(node.tag) ? kebab(node.tag) : node.tag; (thirdParty[t] = thirdParty[t] || { tag: t, lib, count: 0, files: new Set() }); thirdParty[t].count++; thirdParty[t].files.add(rel); }
  });
}

const byComp = {};
for (const u of usages) {
  (byComp[u.tag] = byComp[u.tag] || { tag: u.tag, base: u.base, target: u.target, count: 0, props: new Set(), files: new Set() });
  const c = byComp[u.tag]; c.count++; u.props.forEach((p) => c.props.add(p)); c.files.add(u.file);
}
const comps = Object.values(byComp).sort((a, b) => b.count - a.count);
const mapped = comps.filter((c) => c.target);
const noExact = comps.filter((c) => !c.target).map((c) => ({ ...c, ...suggest(c.base) }));
const semantic = noExact.filter((c) => c.tier !== '真缺').sort((a, b) => b.score - a.score);
const missing = noExact.filter((c) => c.tier === '真缺').sort((a, b) => b.count - a.count);
const tpList = Object.values(thirdParty).sort((a, b) => b.count - a.count);
const u = (arr, sel) => arr.reduce((n, c) => n + sel(c), 0);

const bar = '─'.repeat(84);
console.log('\n' + bar);
console.log('  替换前清单（AST 扫描 + 语义匹配）· ' + root);
console.log(bar);
console.log(`  .vue ${files.length} · el/d/aui 用法 ${usages.length} 处 · 去重 ${comps.length} 种`);
console.log(`  ✔ 精确映射: ${mapped.length} 种 / ${u(mapped, (c) => c.count)} 处`);
console.log(`  ≈ 语义候选(名字不同,功能相近,需人工确认): ${semantic.length} 种 / ${u(semantic, (c) => c.count)} 处`);
  console.log(`  ✗ 真缺(无近义,必残留): ${missing.length} 种 / ${u(missing, (c) => c.count)} 处`);
if (tpList.length) console.log(`  ⚠ 第三方库(目标库不覆盖): ${u(tpList, (t) => t.count)} 处`);

if (semantic.length) {
  console.log('\n  #### ≈ 语义候选 —— 精确名匹配会误判为"缺失",实为功能相近，需人工确认');
  for (const c of semantic) console.log(`    ${c.tag} → ${c.candidate}  [${c.tier} ${c.score}]  ×${c.count}   依据: ${c.basis}`);
}
if (missing.length) {
  console.log('\n  #### ✗ 真缺 —— 目标库无近义组件，迁移必残留');
  for (const c of missing) console.log(`    ${c.tag}  ×${c.count}  (${[...c.files].slice(0, 3).join(', ')}${c.files.size > 3 ? ' …' : ''})`);
}
if (tpList.length) {
  console.log('\n  #### ⚠ 第三方 UI 库 —— 不在目标库范围，需单独评估');
  for (const t of tpList) console.log(`    ${t.tag} ×${t.count} [${t.lib}]`);
}
console.log('\n  #### ✔ 精确映射(Top 12)');
for (const c of mapped.slice(0, 12)) console.log(`    ${c.tag} → ${c.target}  ×${c.count}`);
console.log('\n' + bar + '\n');

const manifest = {
  scannedAt: new Date().toISOString(), root,
  summary: { vueFiles: files.length, totalUsages: usages.length, distinct: comps.length, mapped: mapped.length, semantic: semantic.length, missing: missing.length, thirdPartyUsages: u(tpList, (t) => t.count) },
  semanticCandidates: semantic.map((c) => ({ tag: c.tag, candidate: c.candidate, tier: c.tier, score: c.score, basis: c.basis, count: c.count, files: [...c.files] })),
  trulyMissing: missing.map((c) => ({ tag: c.tag, count: c.count, files: [...c.files] })),
  thirdParty: tpList.map((t) => ({ tag: t.tag, lib: t.lib, count: t.count, files: [...t.files] })),
  mapped: mapped.map((c) => ({ tag: c.tag, target: c.target, count: c.count, files: [...c.files], props: [...c.props] })),
  usages
};
fs.writeFileSync('scan-manifest.json', JSON.stringify(manifest, null, 2));

let md = `# 替换前清单（AST 扫描 + 语义匹配）\n\n- 目录: ${root} · .vue ${files.length} · 用法 ${usages.length} 处 · 去重 ${comps.length} 种\n`;
md += `- 精确映射 ${mapped.length} · 语义候选 ${semantic.length} · 真缺 ${missing.length} · 第三方 ${tpList.length}\n\n`;
md += `## ≈ 语义候选（名字不同、功能相近，需人工确认）\n\n| 源组件 | 目标候选 | 分级 | 置信度 | 依据 | 处数 |\n|---|---|---|---|---|---|\n`;
md += semantic.map((c) => `| ${c.tag} | ${c.candidate} | ${c.tier} | ${c.score} | ${c.basis} | ${c.count} |`).join('\n') || '| — | — | — | — | — | — |';
md += `\n\n## ✗ 真缺（无近义，迁移必残留）\n\n` + (missing.length ? missing.map((c) => `- \`${c.tag}\` ×${c.count} — ${[...c.files].join(', ')}`).join('\n') : '- 无');
md += `\n\n## ⚠ 第三方 UI 库\n\n` + (tpList.length ? tpList.map((t) => `- \`${t.tag}\` ×${t.count} [${t.lib}]`).join('\n') : '- 无');
md += `\n\n## ✔ 精确映射\n\n| 源组件 | 目标 | 处数 |\n|---|---|---|\n` + mapped.map((c) => `| ${c.tag} | ${c.target} | ${c.count} |`).join('\n');
fs.writeFileSync('scan-report.md', md);
console.log('  已写出 scan-manifest.json 和 scan-report.md');
