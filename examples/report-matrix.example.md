# 状态矩阵差异清单（三法官分类版）

- 覆盖：2 个路由 · 23 个交互态
- **回归 0 · 待确认 2 · 预期(符合目标库) 18**
- token 表：CSS 变量(vendor/target-ui.css) + 目标库自渲染自洽值(matrix-after.json)。

| 分类 | 路由 | 元素 · 状态 | 归类 | 差异 |
|---|---|---|---|---|
| 待确认 | 表单页 | Reset 按钮(default) · 静止 | 按钮视觉漂移 | 位置：(202,277) → (192,279)<br>backgroundColor：rgb(255, 255, 255) → rgb(25, 102, 255)<br>color：rgb(96, 98, 102) → rgb(255, 255, 255)<br>borderTopColor：rgb(220, 223, 230) → rgba(0, 0, 0, 0)<br>fontWeight：500 → 400 |
| 待确认 | 表单页 | Reset 按钮(default) · hover | 按钮视觉漂移 | 位置：(202,277) → (192,279)<br>backgroundColor：rgb(236, 245, 255) → rgb(66, 135, 255)<br>color：rgb(64, 158, 255) → rgb(255, 255, 255)<br>borderTopColor：rgb(198, 226, 255) → rgba(0, 0, 0, 0)<br>fontWeight：500 → 400 |
| 预期 | 表格页 | Title 输入框 · 静止 | 输入框样式漂移 | color：rgb(96, 98, 102) → rgb(2, 10, 25) |
| 预期 | 表格页 | Title 输入框 · focus | 输入框样式漂移 | color：rgb(96, 98, 102) → rgb(2, 10, 25) |
| 预期 | 表格页 | Search 按钮 · 静止 | 按钮视觉漂移 | backgroundColor：rgb(64, 158, 255) → rgb(25, 102, 255)<br>borderTopColor：rgb(64, 158, 255) → rgba(0, 0, 0, 0)<br>fontWeight：500 → 400 |
| 预期 | 表格页 | Search 按钮 · hover | 按钮视觉漂移 | backgroundColor：rgb(121, 187, 255) → rgb(66, 135, 255)<br>borderTopColor：rgb(121, 187, 255) → rgba(0, 0, 0, 0)<br>fontWeight：500 → 400 |
| 预期 | 表格页 | 行内 Edit 按钮 · 静止 | 尺寸/视觉漂移 | 位置：(1194,116) → (1203,118)<br>高度：24px → 28px（尺寸 token）<br>backgroundColor：rgb(64, 158, 255) → rgb(25, 102, 255)<br>borderTopColor：rgb(64, 158, 255) → rgba(0, 0, 0, 0)<br>borderTopLeftRadius：3px → 4px<br>fontWeight：500 → 400 |
| 预期 | 表格页 | 行内 Edit 按钮 · hover | 尺寸/视觉漂移 | 位置：(1194,116) → (1203,118)<br>高度：24px → 28px（尺寸 token）<br>backgroundColor：rgb(121, 187, 255) → rgb(66, 135, 255)<br>borderTopColor：rgb(121, 187, 255) → rgba(0, 0, 0, 0)<br>borderTopLeftRadius：3px → 4px<br>fontWeight：500 → 400 |
| 预期 | 表格页 | Imp 下拉 · 静止 | 选择器样式漂移 | 宽度：76px → 72px<br>color：rgb(96, 98, 102) → rgb(2, 10, 25) |
| 预期 | 表格页 | Imp 下拉 · 展开 | 选择器样式漂移 | 位置：(229,65) → (229,58)<br>高度：114px → 128px（尺寸 token） |
| 预期 | 表格页 | Type 下拉 · 静止 | 选择器样式漂移 | 宽度：106px → 102px<br>color：rgb(96, 98, 102) → rgb(2, 10, 25) |
| 预期 | 表格页 | Type 下拉 · 展开 | 选择器样式漂移 | 位置：(357,65) → (357,58)<br>高度：148px → 168px（尺寸 token） |
| 预期 | 表单页 | Name 输入框 · 静止 | 输入框样式漂移 | color：rgb(96, 98, 102) → rgb(2, 10, 25) |
| 预期 | 表单页 | Name 输入框 · focus | 输入框样式漂移 | color：rgb(96, 98, 102) → rgb(2, 10, 25) |
| 预期 | 表单页 | Type 下拉 · 静止 | 选择器样式漂移 | 位置：(126,128) → (126,133)<br>color：rgb(96, 98, 102) → rgb(2, 10, 25) |
| 预期 | 表单页 | Type 下拉 · 展开 | 选择器样式漂移 | 高度：114px → 128px（尺寸 token） |
| 预期 | 表单页 | Date 日期选择器 · 静止 | 日期选择器/弹层(teleport) | 位置：(147,176) → (125,179)<br>宽度：176px → 182px<br>color：rgb(96, 98, 102) → rgb(2, 10, 25) |
| 预期 | 表单页 | Switch 开关(on) · 静止 | 开关颜色 token / 类名重命名 | backgroundColor：rgb(64, 158, 255) → rgb(25, 102, 255)<br>fontSize：14px → 12px |
| 预期 | 表单页 | Submit 按钮(primary) · 静止 | 按钮视觉漂移 | backgroundColor：rgb(64, 158, 255) → rgb(25, 102, 255)<br>borderTopColor：rgb(64, 158, 255) → rgba(0, 0, 0, 0)<br>fontWeight：500 → 400 |
| 预期 | 表单页 | Submit 按钮(primary) · hover | 按钮视觉漂移 | backgroundColor：rgb(121, 187, 255) → rgb(66, 135, 255)<br>borderTopColor：rgb(121, 187, 255) → rgba(0, 0, 0, 0)<br>fontWeight：500 → 400 |
