// journey 模板：把 REPLACE_ 占位改成你页面真实的「角色/名称」（用 explore.mjs 查出来照抄）。
// 改好后另存为 journey.mjs 使用。
//
// 步骤类型：
//   fill     by:'label' name:'<aria-label 或 <label> 文本>' value:'...'   —— 填输入框
//   click    by:'role'  role:'button'|'link'|'tab'... name:'<可见文本>' [nth:0]
//   expect   by:'role'  role:'heading'|'dialog'|'alert'... name:'...'     —— 断言可见（做检查点边界）
//   snapshot label:'<检查点名>'                                            —— 此刻抓语义快照用于对比

export const journey = [
  // ========== 1) 登录 ==========
  // 【账号密码型】——最常见，按你的字段标签改：
  { type: 'fill',  by: 'label', name: 'REPLACE_用户名字段名', value: 'REPLACE_账号' },
  { type: 'fill',  by: 'label', name: 'REPLACE_密码字段名',   value: 'REPLACE_密码' },
  { type: 'click', by: 'role',  role: 'button', name: 'REPLACE_登录按钮文本' },
  // 【token / SSO 型】——通常不填表单：改成让 capture 直接 goto 一个已登录的 URL，
  //   或采用「登录态复用」(storageState，见文末) 跳过登录。需要的话让我给你加这个开关。

  { type: 'expect', by: 'role', role: 'heading', name: 'REPLACE_登录后能看到的标题' }, // 确认登录成功

  // ========== 2) 进入目标列表页（如果登录后不在该页）==========
  // 推荐做法：capture 的目标 URL 直接设成列表页地址，这样登录后自然就在该页；
  // 若需要点菜单进入，在这里加 click 步骤。
  { type: 'snapshot', label: '列表页' },

  // ========== 3) 详情 / 弹窗流程（你选的场景）==========
  { type: 'click',  by: 'role', role: 'button', name: 'REPLACE_打开详情的按钮(如 查看/详情/编辑)', nth: 0 },
  { type: 'expect', by: 'role', role: 'dialog', name: 'REPLACE_弹窗标题(如 文章详情)' },
  { type: 'snapshot', label: '详情弹窗' }
]

// ========== 登录态复用（可选，强烈建议给 SSO / 复杂登录）==========
// 每次都重放登录很脆。更稳的做法：
//   1) 人工在浏览器登录一次，用 Playwright 把会话存成 auth.json（storageState）；
//   2) capture 时加载 auth.json，直接跳过登录步骤。
// 需要我把这个开关加到 capture-semantic.mjs 就说一声。
