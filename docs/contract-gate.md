# 组件契约闸门（静态）

## 它解决什么

换组件库时最常见的坑不是"漏换"，而是**"名字换对了，用法/数据约束没对上，没人在改之前拦住"**——
比如树组件节点空白（没配 `:props`）、分类搜索被错配成高级搜索、必填 prop 漏了。

契约闸门把「每个源组件应该换成谁、必须满足什么用法」写成**契约**（`contracts.mjs`），
然后**扫代码**把违反契约的地方挑出来——在改代码/自测之前就报警，不用等跑起来才发现坏。

分工：
- `scan.mjs` = 有没有换干净（残留 / 覆盖率）。
- **`gate.mjs` = 换得对不对**（用法是否满足契约）。← 专治「错换」。
- 语义差异对比 = 运行时兜底（跑起来行为对不对）。

## 契约自检（target 合法性守卫）

闸门**启动时**会先校验：`contracts.mjs` 里每条契约的 `target` 必须是目标库**真实存在**的组件。
- 依据 `target-components.mjs`（合法标签清单），它由 `extract-components.mjs` 从目标库**自动生成**（组件注册名是权威来源）。
- 一旦有人把 target 写错（指向不存在的组件），**当场报错、中止、不扫描**，并列出问题契约。

先用你自己的目标库生成清单（仓库自带的是通用示例，前缀 `ui-`）：

```bash
node extract-components.mjs "node_modules/@scope/your-ui"
```
库升级后重跑一次即可刷新。前缀不是 `ui-` 的话，改 `migrate.config.mjs` 的 `targetPrefix`。

## 怎么跑

```bash
# 只依赖 @vue/compiler-sfc，无需浏览器
npm i

# 先自测（应先打印“契约自检 ✓ …”，再报 2 错 2 警）
node gate.mjs __selftest__

# 扫你的真实源码（建议用绝对路径；不要用 npm run gate -- 路径，某些 shell 下 -- 常传不进去）
node gate.mjs "/path/to/your/src"
```
输出：控制台分级清单 + 当前目录生成 `report-gate.md`。

自测预期（示例契约下）：
- 顶部 `契约自检 ✓ …`
- ✗ `ui-advanced-search` 缺 `:fields`
- ✗ `el-card` 真缺（forbidden）
- ⚠ `ui-tree` 缺 `:props`（节点会空白）
- ⚠ `d-button` 残留未换 → 应换 `ui-button`

## 报告怎么读

- **✗ 错误**：很可能已经坏或一定坏，必须处理。
  - `xxx 缺 :fields / :props` → 按契约补必填 prop。
  - `xxx 残留且无目标库对应` → 真缺，别硬换，保留原库 / 改容器 / 自定义。
- **⚠ 警告**：需人确认。
  - `xxx 残留未替换` → 按契约换成目标组件。
  - `缺 :props` 类：若数据字段本来就是默认字段，是误报，忽略。

## 怎么加契约（库会越用越准）

编辑 `contracts.mjs`，往数组加一条：

```js
{
  source: ['d-xxx', 'el-xxx'],  // 源组件 tag（kebab 小写）
  target: 'ui-xxx',             // 目标 tag；null = 真缺（禁止换）。会被“契约自检”校验合法性
  risk: 'high',                 // safe 可自动 | high 必须按约束改 | forbidden 禁止硬换
  requiredProps: [              // 用法必须带的属性；缺了就报
    { names: ['fields'], level: 'error', message: '为什么必须有 + 怎么改' }
  ],
  notes: '给人看的说明'
}
```

**判定原则（红线）：只写你从目标库源码 / 类型定义确认过的约束。** 不确定就先别写 `requiredProps`；宁可漏报，也不要凭空造约束（造错了会误导改代码）。

## 下一层（可选，先不做也能用）

现在是**静态**契约。更强的一层是「**契约即测试**」：给每条契约配最小 fixture，真渲染目标组件、抓无障碍树断言，验证「这个映射在当前库版本下确实成立」。成本更高，建议等静态闸门跑顺、契约积累到一定量后再上。
