// 目标组件库「能力目录」+ 语义匹配器。
// 目的：名字精确匹配不上时，用「名字模糊度 + 功能描述关键词重合」找功能相近的组件。
// 组件清单来自 target-components.mjs（由 extract-components.mjs 从你的库生成；仓库内是通用示例）。
import { config } from './migrate.config.mjs';
import { TARGET_TAGS } from './target-components.mjs';

const PREFIX = config.targetPrefix;
// 从 ui-button / y-button 这类 tag 剥出 base（button）：去掉第一个「前缀-」段。
const stripPrefix = (tag) =>
  tag.startsWith(PREFIX + '-') ? tag.slice(PREFIX.length + 1) : tag.replace(/^[a-z]+-/, '');

// 目标库现有组件的 base 名集合（button/input/tree...），语义匹配的搜索空间。
export const TARGET_BASES = new Set([...TARGET_TAGS].map(stripPrefix));

export const ALIAS = { option: 'select-option', 'option-group': 'select-group' };

export function exactTarget(base) {
  const b = ALIAS[base] || base;
  return TARGET_BASES.has(b) ? `${PREFIX}-${base}` : null;
}

// 通用 UI 组件中文名（用于语义匹配的关键词侧；与具体库无关，可按需扩充）。
export const TARGET_CN = {
  'advanced-search': '高级搜索', alert: '提示框', anchor: '锚点', autocomplete: '自动补全', avatar: '头像',
  badge: '徽标', breadcrumb: '面包屑', button: '按钮', calendar: '日历', carousel: '走马灯', cascader: '级联选择器',
  checkbox: '复选框', collapse: '折叠面板', 'config-provider': '配置提供者', container: '布局容器',
  'date-picker': '日期选择器', descriptions: '描述列表', dialog: '对话框', divider: '分割线', drawer: '抽屉',
  dropdown: '下拉菜单', form: '表单', icon: '图标', image: '图片', input: '输入框', 'input-number': '数字输入框',
  link: '链接', menu: '菜单', message: '消息提示', 'message-box': '消息确认框', notification: '通知提醒',
  pagination: '分页', popover: '弹出框', radio: '单选框', rate: '评分', scroll: '滚动条', search: '搜索输入框',
  select: '选择器', slider: '滑块', space: '间距', step: '步骤条', switch: '开关', table: '表格', tabs: '标签页',
  'time-picker': '时间选择器', timeline: '时间线', tooltip: '文字提示', transfer: '穿梭框', tree: '树形控件',
  'tree-select': '树形选择', upload: '上传组件',
};

// 源组件(Element Plus 等)功能说明提示（curated，用于关键词侧匹配）。
export const SOURCE_HINT = {
  scrollbar: { cn: '滚动条', kw: ['scroll', '滚动', 'scrollbar'] },
  card: { cn: '卡片', kw: ['卡片', 'card'] },
  empty: { cn: '空状态', kw: ['空', '缺省', 'nodata', 'empty'] },
  'button-group': { cn: '按钮组', kw: ['button', '按钮', 'group', '组'] },
  'select-v2': { cn: '虚拟化选择器', kw: ['select', '选择', 'virtual', '虚拟'] },
  tag: { cn: '标签', kw: ['标签', 'label', 'tag'] },
  affix: { cn: '固钉', kw: ['固钉', 'affix', 'fixed'] },
  'page-header': { cn: '页头', kw: ['页头', 'header'] },
  skeleton: { cn: '骨架屏', kw: ['骨架', 'skeleton'] },
  result: { cn: '结果页', kw: ['结果', 'result'] },
  statistic: { cn: '统计数值', kw: ['统计', 'statistic'] },
};

const tokens = (s) => (s || '').toLowerCase().split(/[-_\s]+/).filter(Boolean);
function lev(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
const ratio = (a, b) => (Math.max(a.length, b.length) ? 1 - lev(a, b) / Math.max(a.length, b.length) : 0);

// 给一个「精确匹配不上」的源 base，返回功能最相近的目标组件候选 + 置信度 + 依据 + 分级。
export function suggest(base) {
  const hint = SOURCE_HINT[base] || { cn: '', kw: [] };
  const srcKw = new Set([...tokens(base), ...hint.kw.map((k) => k.toLowerCase()), ...tokens(hint.cn)]);
  let best = { base: null, score: 0, reason: '', hits: [] };
  const srcHead = tokens(base)[0];
  for (const b of TARGET_BASES) {
    const cand = new Set([...tokens(b), ...tokens(TARGET_CN[b] || '')]);
    const hits = [...srcKw].filter((k) => cand.has(k));
    const kwScore = srcKw.size ? hits.length / srcKw.size : 0;
    const nameSim = base.length >= 4 && b.length >= 3 ? ratio(base, b) : 0; // 短名不靠纯字面，避免 tag↔tabs 误配
    // 包含关系是最干净的信号：scrollbar⊃scroll、button-group⊃button、select-v2⊃select
    let contain = 0, reason = '';
    if (b.length >= 3 && (base.startsWith(b) || base.replace(/-v\d+$/, '').startsWith(b))) { contain = 0.75; reason = `包含: ${base} ⊃ ${b}`; }
    else if (srcHead === b) { contain = 0.7; reason = `同首词: ${b}`; }
    // 名字相近降权，避免共享后缀(如 -group)把同族兄弟顶上来
    const score = Math.max(contain, kwScore, nameSim * 0.6);
    if (score > best.score) {
      best = { base: b, score: Number(score.toFixed(2)), hits, reason: reason || (hits.length ? `功能词命中: ${hits.join('/')}` : `名字相近 ${nameSim.toFixed(2)}`) };
    }
  }
  const tier = best.score >= 0.6 ? '语义候选' : best.score >= 0.45 ? '弱候选' : '真缺';
  const basis = best.reason || '无近义';
  return { candidate: best.base && tier !== '真缺' ? `${PREFIX}-` + best.base : null, score: best.score, tier, basis };
}
