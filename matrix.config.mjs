// 状态矩阵配置：多个路由，每个路由下每个元素要走哪些交互态。
// state.kind: default(静止) | hover | focus | disabled(直接测禁用元素) | open(点trigger后测panel浮层)
export const VIEWPORT = { width: 1440, height: 900 };

export const STYLE_PROPS = [
  'backgroundColor',
  'color',
  'borderTopColor',
  'borderTopWidth',
  'borderTopLeftRadius',
  'fontSize',
  'fontWeight',
  'height',
  'textAlign',
  'display',
  'visibility',
  'paddingLeft'
];

export const ROUTES = [
  {
    id: 'table',
    name: '表格页',
    before: 'before-ep.html',
    after: 'after-ui.html',
    ready: 'tbody tr',
    targets: [
      { id: 'inp-title',   label: 'Title 输入框',      selector: '#inp-title',   category: '输入框样式漂移',
        states: [{ kind: 'default' }, { kind: 'focus' }] },
      { id: 'btn-search',  label: 'Search 按钮',       selector: '#btn-search',  category: '按钮视觉漂移',
        states: [{ kind: 'default' }, { kind: 'hover' }] },
      { id: 'action-edit', label: '行内 Edit 按钮',    selector: 'tbody button', category: '尺寸/视觉漂移',
        states: [{ kind: 'default' }, { kind: 'hover' }] },
      { id: 'tbl-header',  label: '表头单元格',        selector: 'thead th',     category: '表头样式漂移',
        states: [{ kind: 'default' }] },
      { id: 'sel-imp',     label: 'Imp 下拉',          selector: '#sel-imp',     category: '选择器样式漂移',
        states: [{ kind: 'default' }, { kind: 'open', trigger: '#sel-imp', panel: '.el-select-dropdown' }] },
      { id: 'sel-type',    label: 'Type 下拉',         selector: '#sel-type',    category: '选择器样式漂移',
        states: [{ kind: 'default' }, { kind: 'open', trigger: '#sel-type', panel: '.el-select-dropdown' }] }
    ]
  },
  {
    id: 'form',
    name: '表单页',
    before: 'before-ep-form.html',
    after: 'after-ui-form.html',
    ready: '#f-submit',
    targets: [
      { id: 'f-name',   label: 'Name 输入框',        selector: '#f-name',                    category: '输入框样式漂移',
        states: [{ kind: 'default' }, { kind: 'focus' }] },
      { id: 'f-locked', label: 'Locked 输入框(禁用)', selector: '#f-locked',                 category: '禁用态样式漂移',
        states: [{ kind: 'disabled' }] },
      { id: 'f-type',   label: 'Type 下拉',          selector: '#f-type',                    category: '选择器样式漂移',
        states: [{ kind: 'default' }, { kind: 'open', trigger: '#f-type', panel: '.el-select-dropdown' }] },
      { id: 'f-date',   label: 'Date 日期选择器',    selector: '#w-date .el-input__inner',   category: '日期选择器/弹层(teleport)',
        states: [{ kind: 'default' }, { kind: 'open', trigger: '#w-date .el-input__inner', panel: '.el-picker-panel' }] },
      { id: 'f-switch', label: 'Switch 开关(on)',    selector: '#w-switch .el-switch__core, #w-switch .ui-switch__core', category: '开关颜色 token / 类名重命名',
        states: [{ kind: 'default' }] },
      { id: 'f-submit', label: 'Submit 按钮(primary)', selector: '#f-submit',                category: '按钮视觉漂移',
        states: [{ kind: 'default' }, { kind: 'hover' }] },
      { id: 'f-reset',  label: 'Reset 按钮(default)',  selector: '#f-reset',                 category: '按钮视觉漂移',
        states: [{ kind: 'default' }, { kind: 'hover' }] }
    ]
  }
];
