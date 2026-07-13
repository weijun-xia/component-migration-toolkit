// 组件迁移契约表：每条描述“源组件 → 目标组件、风险级别、必须满足的用法约束”。
// 增契约 = 往这个数组加一条。字段说明见文件末尾。
//
// ⚠ 下面是【通用示例】（目标前缀 ui-，源库 el-/d-/aui-）。请按你自己的「源库 → 目标库」映射改写。
//   目标 tag 会被 gate 用 target-components.mjs 做「真实组件」自检；写错组件名会当场拦下、不扫描。
export const CONTRACTS = [
  // —— 高风险：必须按约束改，否则会坏 ——
  {
    source: ['el-tree', 'd-tree', 'aui-tree'],
    target: 'ui-tree',
    risk: 'high',
    requiredProps: [
      { names: ['props'], level: 'warn', message: '树组件通常默认按 label/children 读数据；若数据字段不是这两个，必须配 :props="{ label, children }"（换成你的字段名），否则节点文字空白；本来就是 label/children 则为误报，忽略即可' }
    ],
    notes: '树形控件：显示字段默认 label，子节点默认 children（以你目标库实际 API 为准）'
  },
  {
    source: ['d-advanced-search', 'aui-advanced-search', 'el-advanced-search'],
    target: 'ui-advanced-search',
    risk: 'high',
    requiredProps: [
      { names: ['fields'], level: 'error', message: '高级搜索必须传 :fields（[{ key, label, type, options? }]）+ v-model（搜索事件如 @search）。缺 :fields 会渲染成空表单。' }
    ],
    notes: '高级搜索表单容器：核心 prop 是 :fields'
  },

  // —— 真缺：目标库无对应，禁止硬换（示例，按你目标库实际缺什么改）——
  { source: ['el-card', 'd-card', 'aui-card'], target: null, risk: 'forbidden', notes: '示例：目标库暂无 Card，保留原库 / 改容器 / 自定义' },
  { source: ['el-tag', 'd-tag'], target: null, risk: 'forbidden', notes: '示例：目标库暂无 Tag' },
  { source: ['el-empty', 'd-empty'], target: null, risk: 'forbidden', notes: '示例：目标库暂无 Empty 空状态' },

  // —— 安全：API 基本等价，可自动换（此处不做强校验，仅登记）——
  { source: ['el-button', 'd-button', 'aui-button'], target: 'ui-button', risk: 'safe' },
  { source: ['el-input', 'd-text-input', 'aui-input'], target: 'ui-input', risk: 'safe' },
  { source: ['el-select', 'd-select', 'aui-select'], target: 'ui-select', risk: 'safe' },
  { source: ['el-tooltip', 'd-tooltip'], target: 'ui-tooltip', risk: 'safe' }
]

// 字段说明：
// source: 源组件 tag 列表（如 Element Plus el-* / DevUI d-* / AUI aui-*），kebab 小写。
// target: 目标 tag；null 表示真缺（禁止替换）。会被 gate 用 target-components.mjs 做合法性自检。
// risk:   safe(可自动换) | high(必须按约束改) | forbidden(禁止硬换)。
// requiredProps: [{ names:['props'|'fields'...], level:'warn'|'error', message }]  用法必须带的属性；缺了就报。
// notes: 给人看的说明。
//
// 判定原则（红线）：只写你从目标库源码 / 类型定义确认过的约束。不确定就先别写 requiredProps；
// 宁可漏报，也不要凭空造约束（造错了会误导改代码）。
