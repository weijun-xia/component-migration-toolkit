# 语义差异测试（旧版当 oracle · 跨框架等价校验）

## 解决什么

跨框架重写（如 Angular+DevUI → Vue3+目标库）时，新旧两版**DOM/类名完全不同**，没法用选择器配对。
本工具比的是 **语义层（a11y 树：role + 名称）+ 行为（网络请求 / 交互成败 / 控制台错误）**——天然跨框架；
把**旧版当"标准答案（oracle）"**，新版哪里行为/语义变了就报出来。

## 已验证（模拟环境，见 examples/semantic-sim/）

在两个 DOM/类名完全不同、语义相同的页面上跑，结果正确：

- 忽略 DOM 差异，把两版语义自动对上（零误报）；
- 抓到注入的 4 类缺陷：**列名漂移、缺按钮、漏发接口请求、控制台报错**。

样例报告：`examples/report-semantic.example.md`。

## 怎么用（以「登录 + 列表 + 详情弹窗」为例）

1. **两版各自 serve**，拿到两个 http 地址（旧版、新版）。
2. **编辑 `journey.mjs`**：用「角色/名称」写你的流程，含登录步骤（参考 `journey.template.mjs`）。
   不会写就先 `node explore.mjs http://旧版/页面` 把 a11y 树打出来照抄。
   ```js
   export const journey = [
     { type: 'fill',  by: 'label', name: '用户名', value: '你的账号' },
     { type: 'fill',  by: 'label', name: '密码',   value: '你的密码' },
     { type: 'click', by: 'role',  role: 'button', name: '登录' },
     { type: 'expect',by: 'role',  role: 'heading',name: '文章管理' },
     { type: 'snapshot', label: '主页面' },
     { type: 'click', by: 'role',  role: 'button', name: '查看', nth: 0 },
     { type: 'expect',by: 'role',  role: 'dialog', name: '文章详情' },
     { type: 'snapshot', label: '详情弹窗' }
   ]
   ```
3. **采集**（旧版当 oracle）：
   ```bash
   node capture-semantic.mjs http://旧版地址/页面 old
   node capture-semantic.mjs http://新版地址/页面 new
   ```
4. **对比**：
   ```bash
   node diff-semantic.mjs old.json new.json
   ```
   → `report-semantic.md`：**回归 / 待确认**。

## 浏览器

默认用 Playwright 内置 chromium：先 `npx playwright install chromium`。
想用系统已装浏览器：设环境变量 `PW_CHANNEL=chrome`（或 `msedge`）。

## 注意 / 边界

- **网络维度需 http**（同后端天然可比）；`file://` 抓不到 `/api` 请求。
- a11y 表格**整行文本**会因一个单元格变化而整行 diff（噪声）——可加"良性差异白名单"过滤。
- 不同库的 a11y 可能有小的良性差异：首次跑完，把确认无害的差异加进白名单，之后就只剩真回归。
- 旅程目前是**手写**（一份驱动两版）；进阶可从旧版 e2e 测试导入或录制真实会话生成。
