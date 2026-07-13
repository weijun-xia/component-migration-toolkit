// 迁移工具集中配置：把「与具体组件库相关」的东西收在这里，工具引擎本身与库无关。
// 换成你自己的项目时，通常只改这个文件 + 用 extract-components / extract-tokens 生成对应数据。
export const config = {
  // 目标组件库的标签前缀（不含连字符）。
  // 例：库导出 <UiButton> → 模板里写 <ui-button> → 前缀就是 'ui'；换成你的库改这里（如 'y'、'a'、'n'）。
  targetPrefix: 'ui',

  // 源库标签前缀 → 库名（用于扫描识别「待替换的旧组件」）。按需增减。
  sourceLibs: { el: 'element', d: 'devui', aui: 'aui' },

  // 第三方 UI 库前缀（不在迁移范围，扫描时仅登记告知，不当作缺口）。
  thirdPartyPrefixes: ['vxe', 'van', 'arco', 'tiny', 'nut', 'wd'],
};

export default config;
