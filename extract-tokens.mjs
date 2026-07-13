// 自动抽取目标库设计 token，按语义族生成 design-tokens.generated.json。
// 来源：① 目标库 CSS 的全部 --var（若目标库继承 Element Plus 变量，会抓到中性色/圆角/字号）
//       ② matrix-after.json 的自渲染高频值（目标库通过组件 CSS 施加的品牌覆盖：主色/hover/正文色）
// 用法: node extract-tokens.mjs [目标库CSS路径]   （默认 vendor/target-ui.css）
import fs from 'node:fs';

const cssPath = process.argv[2] || 'vendor/target-ui.css';
if (!fs.existsSync(cssPath)) {
  console.error(`✗ 找不到目标库 CSS: ${cssPath}`);
  console.error('  用法: node extract-tokens.mjs <目标库CSS路径>');
  console.error('  提示: 把你目标库的完整样式(如 dist/index.css)放到 vendor/target-ui.css，或作为参数传入。');
  process.exit(1);
}
const css = fs.readFileSync(cssPath, 'utf8');

function hexToRgb(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return `rgb(${r},${g},${b})`;
}
function normColor(v) {
  const s = String(v).trim().toLowerCase();
  if (s.startsWith('#')) return hexToRgb(s) || s;
  if (s.startsWith('rgb')) return s.replace(/\s+/g, '');
  return s;
}
const parseRgb = (s) => { const m = s.match(/rgb\((\d+),(\d+),(\d+)/); return m ? [+m[1], +m[2], +m[3]] : null; };

// —— 抽 CSS 变量 ——
const varRe = /--([\w-]+)\s*:\s*([^;}{]+)/g;
const vars = {};
let m;
while ((m = varRe.exec(css))) {
  const name = '--' + m[1];
  const val = m[2].trim();
  if (val.startsWith('var(') || val.includes('(') && !val.startsWith('rgb') || val.length > 30) continue;
  (vars[name] = vars[name] || new Set()).add(val);
}
const collect = (re) => {
  const out = new Set();
  for (const [name, set] of Object.entries(vars)) {
    if (!re.test(name)) continue;
    for (const v of set) { const c = normColor(v); if (c.startsWith('rgb') || c.startsWith('#')) out.add(c); }
  }
  return [...out];
};

// 常见 EP 系变量名（很多中后台库继承自 Element Plus；若你的库变量命名不同，按需改这几个正则）。
const primaryVars = collect(/^--el-color-primary/);
const textVars = collect(/^--el-text-color/);
const neutral = collect(/^--el-(border-color|fill-color|bg-color)/);
const pxOk = (v) => /^\d+px$/.test(v) && parseInt(v, 10) <= 24;
const radii = [...new Set(Object.entries(vars).filter(([n]) => /border-radius/.test(n)).flatMap(([, s]) => [...s]))].filter(pxOk);
const fontSizes = [...new Set(Object.entries(vars).filter(([n]) => /font-size/.test(n)).flatMap(([, s]) => [...s]))].filter(pxOk);

// —— 自渲染高频值（目标库品牌覆盖）——
let recurring = [];
if (fs.existsSync('matrix-after.json')) {
  const after = JSON.parse(fs.readFileSync('matrix-after.json', 'utf8'));
  const freq = {};
  for (const r of Object.values(after.routes))
    for (const tg of Object.values(r.targets))
      for (const st of Object.values(tg.states)) {
        const s = st.measure && st.measure.style;
        if (!s) continue;
        for (const key of ['backgroundColor', 'color', 'borderTopColor']) {
          const v = s[key];
          if (!v || v.startsWith('rgba(0, 0, 0, 0')) continue;
          const nv = normColor(v);
          freq[nv] = (freq[nv] || 0) + 1;
        }
      }
  recurring = Object.entries(freq).filter(([, c]) => c >= 2).map(([v]) => v);
} else {
  console.warn('⚠ 未找到 matrix-after.json，跳过「自渲染品牌值」抽取（先跑一次 capture-matrix.mjs after 可补上）。');
}

// 把目标库高频值按色相归族
const primaryTarget = [], textTarget = [], neutralTarget = [];
for (const v of recurring) {
  const rgb = parseRgb(v);
  if (!rgb) continue;
  const [r, g, b] = rgb;
  const sum = r + g + b;
  if (b > 150 && b > r + 40 && b > g + 20) primaryTarget.push(v);       // 蓝 = 品牌主色族
  else if (Math.max(r, g, b) < 70 && sum > 10) textTarget.push(v);      // 深色(非纯黑) = 正文
  else if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && r >= 60 && r < 200) textTarget.push(v); // 中灰 = 次要文字
  else neutralTarget.push(v);                                            // 白/纯黑/浅 = 中性
}

const out = {
  provenance: `CSS 变量(${cssPath}) + 目标库自渲染自洽值(matrix-after.json)。`,
  generatedAt: new Date().toISOString(),
  primary: [...new Set([...primaryVars, ...primaryTarget])],
  primaryTarget,
  text: [...new Set([...textVars, ...textTarget])],
  textTarget,
  neutral: [...new Set([...neutral, ...neutralTarget])],
  radii,
  fontSizes,
  fontWeights: ['400', '500'],
};
fs.writeFileSync('design-tokens.generated.json', JSON.stringify(out, null, 2));
console.log('已生成 design-tokens.generated.json');
console.log(`  primary(${out.primary.length}): ${out.primary.join(' ')}`);
console.log(`  primaryTarget: ${primaryTarget.join(' ')}`);
console.log(`  text(${out.text.length}): ${out.text.join(' ')}`);
console.log(`  textTarget: ${textTarget.join(' ')}`);
console.log(`  neutral(${out.neutral.length})`);
console.log(`  radii: ${radii.join(' ')}`);
console.log(`  fontSizes: ${fontSizes.join(' ')}`);
