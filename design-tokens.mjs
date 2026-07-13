// 设计 token 分类器（视觉法官③：把样式变化跟「目标库设计规范」比，而不是跟旧库一比一）。
// token 表由 extract-tokens.mjs 自动生成到 design-tokens.generated.json：
//   目标库 CSS 变量 ∪ 目标库自渲染自洽值(matrix-after.json)。
// 判定逻辑：按语义族(primary/text/neutral)。族内迁移=预期；跨族=待确认(如 default 按钮被改成主色)。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
let T;
try {
  T = JSON.parse(fs.readFileSync(path.join(__dir, 'design-tokens.generated.json'), 'utf8'));
} catch {
  T = { provenance: '未生成，请先运行 node extract-tokens.mjs', primary: [], primaryTarget: [], text: [], textTarget: [], neutral: [], radii: [], fontSizes: [], fontWeights: ['400', '500'] };
}

const norm = (s) => String(s).replace(/\s+/g, '').toLowerCase();
const toSet = (arr) => new Set((arr || []).map(norm));
const primary = toSet(T.primary), primaryTarget = toSet(T.primaryTarget);
const text = toSet(T.text), textTarget = toSet(T.textTarget);
const neutral = toSet(T.neutral);
const radii = toSet(T.radii), fontSizes = toSet(T.fontSizes), fontWeights = toSet(T.fontWeights);
const isTransparent = (v) => norm(v).startsWith('rgba(0,0,0,0');

// 返回 'expected'(符合目标库设计语言) | 'review'(跨族/未知值，需人工确认)
export function classifyToken(prop, before, after) {
  const b = norm(before), a = norm(after);
  if (prop === 'fontWeight') return fontWeights.has(a) ? 'expected' : 'review';
  if (prop === 'borderTopLeftRadius') return radii.has(a) ? 'expected' : 'review';
  if (prop === 'fontSize') return fontSizes.has(a) ? 'expected' : 'review';
  // 颜色：按语义族
  if (prop === 'borderTopColor' && isTransparent(a)) return 'expected';                  // 描边取消（如无边框按钮）
  if ((primary.has(b) || primaryTarget.has(b)) && primaryTarget.has(a)) return 'expected'; // 主色 → 目标库主色
  if ((text.has(b) || textTarget.has(b)) && textTarget.has(a)) return 'expected';          // 文字 → 目标库文字
  if (neutral.has(b) && (neutral.has(a) || isTransparent(a))) return 'expected';           // 中性 → 中性
  return 'review';
}

export const PROVENANCE = `token 表：${T.provenance}`;
export const TOKENS = T;
