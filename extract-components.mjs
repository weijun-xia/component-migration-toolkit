// 从目标组件库生成「合法标签清单」target-components.mjs，供 gate 启动时校验契约 target。
// 组件注册名是权威来源（不是文档、不是拍脑袋）。库升级后重跑即可刷新。
//
// 组件导出名的大驼峰前缀取自 migrate.config.mjs 的 targetPrefix（如 'ui' → 匹配 UiButton → ui-button）。
//
// 用法: node extract-components.mjs <路径>
//   <路径> 推荐给库安装根目录（脚本会自己读 package.json 找入口文件）:
//     node extract-components.mjs "node_modules/@scope/your-ui"
//   也可直接给某个文件（global.d.ts / es/index.d.ts / es/index.js 均可）。
//
// 多策略识别，任一命中即可拼出清单：
//   A. global.d.ts:   UiButton: typeof import('@scope/your-ui')['UiButton']
//   B. es/index.d.ts: export { default as UiButton } from './components/button'
//   C. es/index.js:   ...ma as UiTreeSelect, c as UiUpload...   ← JS 主入口，任何安装都有
//   D. d.ts 常量:     export declare const UiButton: ...
//   E. 目录扫描兜底:  数 es/components/<name>/（含 index.js 的才算），不依赖任何导出语法
//      —— 当 A~D 几乎没识别到时自动启用，专治「构建布局不同 / 入口写法不认」。
// 失败时会把诊断信息直接打屏（入口是否存在、components 目录、样例行），无需回传即可自判。
import fs from 'node:fs';
import path from 'node:path';
import { config } from './migrate.config.mjs';

const PFX = config.targetPrefix;                              // 'ui'
const PASCAL = PFX.charAt(0).toUpperCase() + PFX.slice(1);    // 'Ui'
const reA = new RegExp('\\b(' + PASCAL + '[A-Za-z0-9]+)\\s*:\\s*typeof\\s+import\\(', 'g');
const reC = new RegExp('\\bas\\s+(' + PASCAL + '[A-Z][A-Za-z0-9]*)\\b', 'g');
const reD = new RegExp('export\\s+declare\\s+const\\s+(' + PASCAL + '[A-Z][A-Za-z0-9]*)', 'g');
const reB = new RegExp('\\b' + PASCAL + '[A-Z][A-Za-z0-9]*\\b', 'g');

const input = process.argv[2];
if (!input || !fs.existsSync(input)) {
  console.error('用法: node extract-components.mjs <目标库安装目录 或 入口文件路径>');
  console.error('推荐: node extract-components.mjs "node_modules/@scope/your-ui"');
  process.exit(1);
}

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const sizeOf = (p) => { try { return fs.statSync(p).size; } catch { return -1; } };

function collectDts(dir, acc = [], depth = 0) {
  if (depth > 6) return acc;
  let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') collectDts(p, acc, depth + 1); }
    else if (e.name.endsWith('.d.ts')) acc.push(p);
  }
  return acc;
}

// —— 目录扫描兜底：递归找名为 components 的目录（跳过 node_modules），取其“真实组件子目录” ——
const NON_COMP = new Set(['node_modules', 'src', 'style', 'styles', 'common', 'commons', 'utils', 'util', 'hooks', 'hook', 'constants', 'locale', 'locales', 'directives', 'svgicons', 'svg', 'types']);
function findComponentsDirs(dir, acc = [], depth = 0) {
  if (depth > 6) return acc;
  let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (!e.isDirectory() || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.name === 'components') acc.push(p);
    findComponentsDirs(p, acc, depth + 1);
  }
  return acc;
}
function scanComponentDirs(root) {
  const found = new Set();
  for (const cdir of findComponentsDirs(root)) {
    let subs; try { subs = fs.readdirSync(cdir, { withFileTypes: true }); } catch { continue; }
    for (const s of subs) {
      if (!s.isDirectory() || NON_COMP.has(s.name.toLowerCase())) continue;
      const hasIndex = ['index.js', 'index.mjs', 'index.cjs'].some((f) => fs.existsSync(path.join(cdir, s.name, f)));
      if (hasIndex) found.add(s.name);
    }
  }
  return found;
}

// —— 收集入口文本 ——
const isDir = fs.statSync(input).isDirectory();
const texts = [];
const usedFrom = [];
const candReport = [];
if (isDir) {
  let pkg = {}; try { pkg = JSON.parse(read(path.join(input, 'package.json')) || '{}'); } catch {}
  const cand = [...new Set([
    pkg.types, pkg.typings, pkg.module, pkg.main,
    'global.d.ts', 'es/index.d.ts', 'es/index.js', 'index.d.ts', 'index.js', 'dist/index.js',
  ].filter(Boolean))];
  for (const c of cand) {
    const abs = path.join(input, c);
    const t = read(abs);
    candReport.push({ name: c, size: sizeOf(abs) });
    if (t) { texts.push(t); usedFrom.push(c); }
  }
  for (const f of collectDts(input)) if (path.basename(f) === 'global.d.ts') { texts.push(read(f)); usedFrom.push(path.relative(input, f)); }
} else {
  texts.push(read(input)); usedFrom.push(path.basename(input));
}

// —— A~D 正则识别 ——
const names = new Set();
for (const text of texts) {
  for (const m of text.matchAll(reA)) names.add(m[1]);   // A
  for (const m of text.matchAll(reC)) names.add(m[1]);   // C
  for (const m of text.matchAll(reD)) names.add(m[1]);   // D
  for (const line of text.split('\n')) {                 // B
    if (line.includes('export') && !line.includes('export type') && line.includes('from')) {
      const brace = line.match(/\{([^}]*)\}/);
      if (brace) for (const m of brace[1].matchAll(reB)) names.add(m[0]);
    }
  }
}

const hyphenate = (s) => s.replace(/\B([A-Z])/g, '-$1').toLowerCase();       // UiAdvancedSearch → ui-advanced-search
const dirToTag = (s) => `${PFX}-` + s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(); // advanced-search / advancedSearch → ui-advanced-search

let tags = [...new Set([...names].map(hyphenate))];
let method = `导出识别(${tags.length})`;

// —— E. 正则几乎没识别到 → 目录扫描兜底 ——
if (tags.length < 10) {
  const dirTags = [...scanComponentDirs(isDir ? input : path.dirname(input))].map(dirToTag);
  if (dirTags.length > tags.length) {
    tags = [...new Set([...tags, ...dirTags])];
    method = `目录扫描兜底(${dirTags.length})` + (names.size ? ` + 导出识别(${names.size})` : '');
  }
}
tags = tags.sort();

if (!tags.length) {
  // 富诊断：判断依据直接打屏，无需回传也能自判
  console.error('\n✗ 没解析到任何组件。诊断信息如下（照最后建议做）：\n');
  console.error('解析路径: ' + path.resolve(input) + '  (是目录: ' + isDir + ')');
  if (isDir) {
    console.error('\n【入口文件存在情况】size=-1 表示不存在:');
    for (const c of candReport) console.error(`  ${c.size >= 0 ? '✓' : '✗'} ${c.name}  size=${c.size}`);
    const cdirs = findComponentsDirs(input);
    console.error('\ncomponents 目录: ' + (cdirs.length ? cdirs.join(' | ') : '未找到'));
    console.error('该路径顶层内容:');
    try { for (const e of fs.readdirSync(input, { withFileTypes: true })) console.error('  ' + (e.isDirectory() ? '[D] ' : '    ') + e.name); } catch {}
  }
  const sample = texts.find((t) => t) || '';
  const sampleLines = sample.split('\n').filter((l) => new RegExp('\\b' + PASCAL + '[A-Z]').test(l) || l.includes('export')).slice(0, 8);
  if (sampleLines.length) { console.error(`\n入口样例行(含 export/${PASCAL} 的前 8 行):`); for (const l of sampleLines) console.error('  ' + l.trim().slice(0, 120)); }
  console.error('\n建议:');
  console.error('  1) 入口全 ✗ 且顶层无 es/ → 路径指错，换成真正含 package.json 与 es/ 的库目录。');
  console.error(`  2) 有 components 目录但仍为 0 → 组件导出名前缀可能不是「${PASCAL}」，改 migrate.config.mjs 的 targetPrefix；或把上面「样例行」发出来定位导出写法。`);
  console.error('  3) 应急：直接用仓库内自带的 target-components.mjs 示例继续下一步。');
  process.exit(1);
}

const out =
  `// 自动生成，请勿手改。\n` +
  `// 来源: ${path.resolve(input)}\n` +
  `// 入口: ${usedFrom.join(', ') || '(目录扫描)'}\n` +
  `// 方式: ${method}\n` +
  `// 生成: ${new Date().toISOString()} · 合法组件 ${tags.length} 个\n` +
  `// 刷新: node extract-components.mjs <目标库安装目录 或 入口文件>\n` +
  `export const TARGET_TAGS = new Set(${JSON.stringify(tags, null, 2)})\n`;
fs.writeFileSync('target-components.mjs', out);
console.log(`已生成 target-components.mjs：${tags.length} 个合法 ${PFX}-* 标签（${method}；入口: ${usedFrom.join(', ') || '目录扫描'}）`);
