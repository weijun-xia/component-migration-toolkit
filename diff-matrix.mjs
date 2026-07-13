// 状态矩阵对比 v2：三法官 + token 分类器。
// 每条差异被判为三类之一：
//   regression(回归)  —— 行为/存在性变了、或布局大幅漂移：跟 before 比，是真缺陷
//   review(待确认)    —— 既不是旧值、也不是已知目标库 token 的变化：需人工确认
//   expected(预期)    —— 符合目标库设计语言的 token/尺寸变化：不是缺陷
// 用法: node diff-matrix.mjs [config.mjs]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { classifyToken, PROVENANCE } from './design-tokens.mjs';

const configPath = process.argv[2] || './matrix.config.mjs';
const { ROUTES } = await import(pathToFileURL(path.resolve(configPath)).href);
const before = JSON.parse(fs.readFileSync('matrix-before.json', 'utf8'));
const after = JSON.parse(fs.readFileSync('matrix-after.json', 'utf8'));

const POS_TOL = 4;
const SIZE_TOL = 2;
const POS_BIG = 40; // 位置漂移超过这个像素，判为待确认(可能布局塌了)
const STATE_LABEL = { default: '静止', hover: 'hover', focus: 'focus', disabled: '禁用', open: '展开' };
const RANK = { regression: 0, review: 1, expected: 2 };
const CLASS_CN = { regression: '回归', review: '待确认', expected: '预期' };

const findings = [];

for (const route of ROUTES) {
  const rb = before.routes?.[route.id];
  const ra = after.routes?.[route.id];
  if (!rb || !ra) continue;

  for (const target of route.targets) {
    for (const state of target.states) {
      const b = rb.targets?.[target.id]?.states?.[state.kind];
      const a = ra.targets?.[target.id]?.states?.[state.kind];
      if (!b || !a) continue;

      const details = []; // { text, klass }

      // 法官1：交互行为（跟 before 比）
      if (state.kind === 'open') {
        if (b.opened && !a.opened) details.push({ text: `替换前点击可展开，替换后**点击无反应** (opened ${b.opened} → ${a.opened})`, klass: 'regression' });
        else if (!b.opened && a.opened) details.push({ text: `行为反向变化 (opened ${b.opened} → ${a.opened})`, klass: 'regression' });
      }

      const mb = b.measure;
      const ma = a.measure;
      if (mb && ma) {
        if (!mb.present || !ma.present) {
          if (mb.present !== ma.present) details.push({ text: `元素/浮层存在性变化：before=${mb.present} after=${ma.present}`, klass: 'regression' });
        } else {
          // 法官2：相对布局/几何（跟 before 比，带容差；大漂移才升级为待确认）
          const dx = Math.abs(mb.box.x - ma.box.x);
          const dy = Math.abs(mb.box.y - ma.box.y);
          if (dx > POS_TOL || dy > POS_TOL) {
            details.push({ text: `位置：(${mb.box.x},${mb.box.y}) → (${ma.box.x},${ma.box.y})`, klass: Math.max(dx, dy) > POS_BIG ? 'review' : 'expected' });
          }
          if (Math.abs(mb.box.w - ma.box.w) > SIZE_TOL) details.push({ text: `宽度：${mb.box.w}px → ${ma.box.w}px`, klass: 'expected' });
          if (Math.abs(mb.box.h - ma.box.h) > SIZE_TOL) details.push({ text: `高度：${mb.box.h}px → ${ma.box.h}px（尺寸 token）`, klass: 'expected' });

          // 法官3：设计 token（跟目标库 token 比，不是跟旧库）
          const borderInvisible = ma.style?.borderTopWidth === '0px'; // after 无可见上边框，其颜色不可见
          for (const k of ['backgroundColor', 'color', 'borderTopColor', 'borderTopLeftRadius', 'fontSize', 'fontWeight']) {
            if (k === 'borderTopColor' && borderInvisible) continue;
            const bv = mb.style?.[k];
            const av = ma.style?.[k];
            if (bv !== undefined && bv !== av) {
              details.push({ text: `${k}：${bv} → ${av}`, klass: classifyToken(k, bv, av) });
            }
          }
        }
      }

      if (details.length) {
        const klass = details.reduce((w, d) => (RANK[d.klass] < RANK[w] ? d.klass : w), 'expected');
        findings.push({ route: route.name, routeId: route.id, label: target.label, state: STATE_LABEL[state.kind] || state.kind, category: target.category, klass, details });
      }
    }
  }
}

// 新增控制台错误（回归）
for (const route of ROUTES) {
  const eb = before.routes?.[route.id]?.consoleErrors || [];
  const ea = after.routes?.[route.id]?.consoleErrors || [];
  const neu = ea.filter((e) => !eb.includes(e));
  if (neu.length) findings.push({ route: route.name, routeId: route.id, label: '控制台运行时错误', state: '-', category: 'console-runtime-error', klass: 'regression', details: neu.slice(0, 5).map((t) => ({ text: t, klass: 'regression' })) });
}

findings.sort((x, y) => RANK[x.klass] - RANK[y.klass]);

const nReg = findings.filter((f) => f.klass === 'regression').length;
const nRev = findings.filter((f) => f.klass === 'review').length;
const nExp = findings.filter((f) => f.klass === 'expected').length;
const totalStates = ROUTES.reduce((n, r) => n + r.targets.reduce((m, t) => m + t.states.length, 0), 0);

const bar = '─'.repeat(78);
console.log('\n' + bar);
console.log('  状态矩阵差异清单 · 三法官分类版');
console.log(bar);
for (const cls of ['regression', 'review', 'expected']) {
  const group = findings.filter((f) => f.klass === cls);
  if (!group.length) continue;
  console.log(`\n#### ${CLASS_CN[cls]}（${group.length}）`);
  for (const f of group) {
    console.log(`\n  [${CLASS_CN[cls]}] ${f.route} · ${f.label} · ${f.state}  (${f.category})`);
    for (const d of f.details) console.log(`        - ${d.text}${f.klass !== d.klass ? `  <${CLASS_CN[d.klass]}>` : ''}`);
  }
}
console.log(`\n${bar}`);
console.log(`  覆盖交互态: ${totalStates}    回归=${nReg}   待确认=${nRev}   预期(符合目标库)=${nExp}   无差异态=${totalStates - findings.length}`);
console.log(`  ${PROVENANCE}`);
console.log(bar + '\n');

let md = '# 状态矩阵差异清单（三法官分类版）\n\n';
md += `- 覆盖：${ROUTES.length} 个路由 · ${totalStates} 个交互态\n`;
md += `- **回归 ${nReg} · 待确认 ${nRev} · 预期(符合目标库) ${nExp}**\n`;
md += `- ${PROVENANCE}\n\n`;
md += `| 分类 | 路由 | 元素 · 状态 | 归类 | 差异 |\n|---|---|---|---|---|\n`;
for (const f of findings) md += `| ${CLASS_CN[f.klass]} | ${f.route} | ${f.label} · ${f.state} | ${f.category} | ${f.details.map((d) => d.text).join('<br>')} |\n`;
fs.writeFileSync('report-matrix.md', md);
fs.writeFileSync('report-matrix.json', JSON.stringify({ summary: { routes: ROUTES.length, totalStates, regression: nReg, review: nRev, expected: nExp }, findings }, null, 2));
console.log('  已写出 report-matrix.md 和 report-matrix.json\n');
