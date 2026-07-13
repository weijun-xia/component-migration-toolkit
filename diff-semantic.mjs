// 语义对比：旧版当 oracle。比 a11y 树 + 网络 + 交互 + 控制台，输出 回归/待确认。
// 用法: node diff-semantic.mjs [old.json] [new.json]
import fs from 'node:fs';

const before = JSON.parse(fs.readFileSync(process.argv[2] || 'old.json', 'utf8'));
const after = JSON.parse(fs.readFileSync(process.argv[3] || 'new.json', 'utf8'));

const lines = (s) => (s || '').split('\n').map((l) => l.trim()).filter(Boolean);
function multisetDiff(a, b) {
  const count = (arr) => arr.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {});
  const ca = count(a), cb = count(b), removed = [], added = [];
  for (const k in ca) for (let i = 0; i < ca[k] - (cb[k] || 0); i++) removed.push(k);
  for (const k in cb) for (let i = 0; i < cb[k] - (ca[k] || 0); i++) added.push(k);
  return { removed, added };
}

const findings = [];
const labels = new Set([...Object.keys(before.snapshots || {}), ...Object.keys(after.snapshots || {})]);
for (const lb of labels) {
  const d = multisetDiff(lines(before.snapshots?.[lb]), lines(after.snapshots?.[lb]));
  d.removed.forEach((x) => findings.push({ kind: '语义结构', where: lb, detail: `旧版有、新版无：${x}`, cls: '回归' }));
  d.added.forEach((x) => findings.push({ kind: '语义结构', where: lb, detail: `新版多出：${x}`, cls: '待确认' }));
}
const nd = multisetDiff(before.network || [], after.network || []);
nd.removed.forEach((x) => findings.push({ kind: '网络请求', where: '-', detail: `旧版发了、新版没发：${x}`, cls: '回归' }));
nd.added.forEach((x) => findings.push({ kind: '网络请求', where: '-', detail: `新版多发：${x}`, cls: '待确认' }));
(before.steps || []).forEach((bs, i) => { const as = (after.steps || [])[i]; if (bs.ok && as && !as.ok) findings.push({ kind: '交互', where: bs.step, detail: `旧版可用、新版失败：${as.err || ''}`, cls: '回归' }); });
const newErr = (after.consoleErrors || []).filter((e) => !(before.consoleErrors || []).includes(e));
newErr.forEach((e) => findings.push({ kind: '控制台', where: '-', detail: `新版新增报错：${e}`, cls: '回归' }));

const reg = findings.filter((f) => f.cls === '回归');
const rev = findings.filter((f) => f.cls === '待确认');
const bar = '─'.repeat(76);
console.log('\n' + bar);
console.log('  语义差异测试（旧版当 oracle）· 跨框架等价校验');
console.log(bar);
console.log(`  旧(oracle): ${before.url}\n  新:         ${after.url}`);
console.log(`\n#### 回归（${reg.length}）—— 新版行为/语义与旧版不一致`);
reg.forEach((f) => console.log(`  [回归] ${f.kind} @${f.where}: ${f.detail}`));
console.log(`\n#### 待确认（${rev.length}）—— 新版多出的东西，人工判断是否有意`);
rev.forEach((f) => console.log(`  [待确认] ${f.kind} @${f.where}: ${f.detail}`));
console.log('\n' + bar + '\n');

let md = `# 语义差异测试报告（旧版当 oracle）\n\n- 旧(oracle): ${before.url}\n- 新: ${after.url}\n\n## 回归（${reg.length}）\n\n`;
md += (reg.map((f) => `- **${f.kind}** @${f.where}：${f.detail}`).join('\n') || '- 无') + `\n\n## 待确认（${rev.length}）\n\n`;
md += (rev.map((f) => `- ${f.kind} @${f.where}：${f.detail}`).join('\n') || '- 无') + '\n';
fs.writeFileSync('report-semantic.md', md);
console.log('  已写出 report-semantic.md');
