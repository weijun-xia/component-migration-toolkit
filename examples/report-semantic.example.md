# 语义差异测试报告（旧版当 oracle）

- 旧(oracle): http://localhost:5199/sim-old.html
- 新: http://localhost:5199/sim-new.html

## 回归（7）

- **语义结构** @主页面：旧版有、新版无：- row "ID 标题 状态 操作":
- **语义结构** @主页面：旧版有、新版无：- columnheader "状态"
- **语义结构** @详情弹窗：旧版有、新版无：- row "ID 标题 状态 操作":
- **语义结构** @详情弹窗：旧版有、新版无：- columnheader "状态"
- **语义结构** @详情弹窗：旧版有、新版无：- button "取消"
- **网络请求** @-：旧版发了、新版没发：/api/detail
- **控制台** @-：新版新增报错：[bug] 详情数据未加载

## 待确认（4）

- 语义结构 @主页面：新版多出：- row "ID 标题 state 操作":
- 语义结构 @主页面：新版多出：- columnheader "state"
- 语义结构 @详情弹窗：新版多出：- row "ID 标题 state 操作":
- 语义结构 @详情弹窗：新版多出：- columnheader "state"
