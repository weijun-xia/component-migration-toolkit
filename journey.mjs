// 语义旅程：用「角色/名称」描述，一份脚本驱动两版（跨框架通用）。真项目里这份改成按页配置。
export const journey = [
  { type: 'fill', by: 'label', name: '用户名', value: 'admin' },
  { type: 'fill', by: 'label', name: '密码', value: '123456' },
  { type: 'click', by: 'role', role: 'button', name: '登录' },
  { type: 'expect', by: 'role', role: 'heading', name: '文章管理' },
  { type: 'snapshot', label: '主页面' },
  { type: 'click', by: 'role', role: 'button', name: '查看', nth: 0 },
  { type: 'expect', by: 'role', role: 'dialog', name: '文章详情' },
  { type: 'snapshot', label: '详情弹窗' }
]
