# 替换前清单（AST 扫描 + 语义匹配）

> 示例：对公开项目 v3-admin-vite（Vue 3 + Element Plus）做「Element Plus → 目标库(示例前缀 ui-)」迁移评估的产出。

- 目录: v3-admin-vite/src · .vue 47 · 用法 177 处 · 去重 46 种
- 精确映射 40 · 语义候选 3 · 真缺 3 · 第三方 4

## ≈ 语义候选（名字不同、功能相近，需人工确认）

| 源组件 | 目标候选 | 分级 | 置信度 | 依据 | 处数 |
|---|---|---|---|---|---|
| el-scrollbar | ui-scroll | 语义候选 | 0.75 | 包含: scrollbar ⊃ scroll | 4 |
| el-button-group | ui-button | 语义候选 | 0.75 | 包含: button-group ⊃ button | 2 |
| el-select-v2 | ui-select | 语义候选 | 0.75 | 包含: select-v2 ⊃ select | 1 |

## ✗ 真缺（无近义，迁移必残留）

- `el-card` ×13 — common/components/Notify/List.vue, pages/demo/composable-demo/use-fetch-select.vue, pages/demo/composable-demo/use-fullscreen-loading.vue, pages/demo/composable-demo/use-watermark.vue, pages/demo/element-plus/index.vue, pages/demo/level2/index.vue, pages/demo/level2/level3/index.vue, pages/demo/permission/button-level.vue, pages/demo/permission/components/SwitchUser.vue, pages/demo/permission/page-level.vue
- `el-tag` ×13 — common/components/Notify/List.vue, pages/demo/element-plus/index.vue, pages/demo/permission/button-level.vue, pages/demo/permission/components/SwitchUser.vue, pages/demo/vxe-table/index.vue
- `el-empty` ×2 — common/components/Notify/List.vue, common/components/SearchMenu/Modal.vue

## ⚠ 第三方 UI 库

- `vxe-button` ×2 [vxe]
- `vxe-grid` ×1 [vxe]
- `vxe-modal` ×1 [vxe]
- `vxe-form` ×1 [vxe]

## ✔ 精确映射

| 源组件 | 目标 | 处数 |
|---|---|---|
| el-button | ui-button | 28 |
| el-tooltip | ui-tooltip | 11 |
| el-icon | ui-icon | 9 |
| el-input | ui-input | 9 |
| el-form-item | ui-form-item | 8 |
| el-table-column | ui-table-column | 8 |
| el-dropdown-item | ui-dropdown-item | 7 |
| el-alert | ui-alert | 6 |
| el-tab-pane | ui-tab-pane | 5 |
| el-container | ui-container | 5 |
| el-dropdown | ui-dropdown | 3 |
| el-dropdown-menu | ui-dropdown-menu | 3 |
| el-header | ui-header | 3 |
| el-main | ui-main | 3 |
| el-form | ui-form | 3 |
| el-badge | ui-badge | 2 |
| el-tabs | ui-tabs | 2 |
| el-dialog | ui-dialog | 2 |
| el-aside | ui-aside | 2 |
| el-radio-group | ui-radio-group | 1 |
| el-select | ui-select | 1 |
| el-option | ui-option | 1 |
| el-table | ui-table | 1 |
| el-pagination | ui-pagination | 1 |
| el-link | ui-link | 1 |
| el-text | ui-text | 1 |
| el-image | ui-image | 1 |
| el-divider | ui-divider | 1 |
| el-switch | ui-switch | 1 |
| el-menu | ui-menu | 1 |
| el-menu-item | ui-menu-item | 1 |
| el-sub-menu | ui-sub-menu | 1 |
| el-breadcrumb | ui-breadcrumb | 1 |
| el-breadcrumb-item | ui-breadcrumb-item | 1 |
| el-avatar | ui-avatar | 1 |
| el-drawer | ui-drawer | 1 |
| el-popover | ui-popover | 1 |
| el-config-provider | ui-config-provider | 1 |
| el-radio-button | ui-radio-button | 2 |
| el-backtop | ui-backtop | 2 |
