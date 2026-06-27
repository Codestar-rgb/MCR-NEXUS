/**
 * NexCube i18n 国际化系统
 *
 * 支持中文（zh）和英文（en）
 * 通过 useI18n hook 在组件中使用
 *
 * 用法：
 *   const { t } = useI18n()
 *   <span>{t('home.welcome')}</span>
 *
 * 切换语言：
 *   const { setLocale } = useI18n()
 *   setLocale('en')
 */

export type Locale = 'zh' | 'en'

/** 翻译键 → { zh, en } */
const translations: Record<string, { zh: string; en: string }> = {
  // === 主页 ===
  'home.welcome': { zh: '欢迎使用 NexCube', en: 'Welcome to NexCube' },
  'home.subtitle': { zh: '下一代 Minecraft 模组开发 IDE', en: 'Next-generation Minecraft Mod IDE' },
  'home.desc': { zh: '节点可视化与代码 IDE 双轨协同，从零到构建仅需几分钟。', en: 'Dual-track node canvas + code IDE, from zero to build in minutes.' },
  'home.create': { zh: '新建项目', en: 'New Project' },
  'home.createDesc': { zh: '引导式创建模组项目', en: 'Guided project creation' },
  'home.open': { zh: '打开项目', en: 'Open Project' },
  'home.openDesc': { zh: '从本地目录打开', en: 'Open from local directory' },
  'home.import': { zh: '导入项目', en: 'Import Project' },
  'home.importDesc': { zh: '从 GitHub / Gitee / ZIP 导入', en: 'From GitHub / Gitee / ZIP' },
  'home.recent': { zh: '最近项目', en: 'Recent Projects' },
  'home.noProjects': { zh: '暂无项目', en: 'No projects yet' },
  'home.noProjectsDesc': { zh: '创建或导入项目开始开发', en: 'Create or import a project to start' },
  'home.newProject': { zh: '新建项目', en: 'New Project' },

  // === 工作区 ===
  'workspace.title': { zh: '工作区', en: 'Workspaces' },
  'workspace.create': { zh: '新建工作区', en: 'New Workspace' },
  'workspace.empty': { zh: '点击 + 创建工作区', en: 'Click + to create workspace' },
  'workspace.rename': { zh: '重命名', en: 'Rename' },
  'workspace.delete': { zh: '删除', en: 'Delete' },
  'workspace.nodes': { zh: '节点', en: 'nodes' },
  'workspace.edges': { zh: '连线', en: 'edges' },
  'workspace.count': { zh: '个工作区 · 右键管理', en: 'workspaces · right-click to manage' },

  // === 模板 ===
  'template.title': { zh: '新建工作区', en: 'New Workspace' },
  'template.desc': { zh: '选择模板快速创建', en: 'Select a template' },
  'template.namePlaceholder': { zh: '工作区名称（留空使用模板名）', en: 'Workspace name (leave empty for template name)' },
  'template.cancel': { zh: '取消', en: 'Cancel' },
  'template.create': { zh: '创建', en: 'Create' },
  'template.blank': { zh: '空白工作区', en: 'Blank' },
  'template.blankDesc': { zh: '从零开始，不含任何节点', en: 'Start from scratch' },

  // === 属性面板 ===
  'property.title': { zh: '属性面板', en: 'Properties' },
  'property.basic': { zh: '基础属性', en: 'Basic' },
  'property.behavior': { zh: '行为逻辑', en: 'Behavior' },
  'property.selectNode': { zh: '选中节点查看属性', en: 'Select a node to view properties' },
  'property.clickHint': { zh: '在画布上点击任意节点', en: 'Click any node on the canvas' },

  // === 终端 ===
  'terminal.build': { zh: '构建 JAR', en: 'Build JAR' },
  'terminal.run': { zh: '启动测试', en: 'Run Test' },
  'terminal.stop': { zh: '停止', en: 'Stop' },
  'terminal.history': { zh: '构建历史', en: 'Build History' },
  'terminal.clear': { zh: '清空', en: 'Clear' },
  'terminal.close': { zh: '关闭', en: 'Close' },
  'terminal.welcome': { zh: '输入 help 查看可用命令', en: 'Type help for available commands' },

  // === 设置 ===
  'settings.title': { zh: '设置', en: 'Settings' },
  'settings.mirror': { zh: '镜像源', en: 'Mirror' },
  'settings.theme': { zh: '主题', en: 'Theme' },
  'settings.shortcuts': { zh: '快捷键', en: 'Shortcuts' },
  'settings.plugins': { zh: '插件', en: 'Plugins' },
  'settings.environment': { zh: '环境', en: 'Environment' },
  'settings.save': { zh: '保存', en: 'Save' },
  'settings.cancel': { zh: '取消', en: 'Cancel' },
  'settings.dark': { zh: '深色', en: 'Dark' },
  'settings.light': { zh: '浅色', en: 'Light' },

  // === 命令面板 ===
  'command.placeholder': { zh: '输入命令...', en: 'Type a command...' },
  'command.noResults': { zh: '未找到匹配的命令', en: 'No matching commands' },
  'command.category.node': { zh: '节点', en: 'Node' },
  'command.category.view': { zh: '视图', en: 'View' },
  'command.category.action': { zh: '操作', en: 'Action' },
  'command.createEntity': { zh: '创建实体节点', en: 'Create Entity Node' },
  'command.createEntityDesc': { zh: '添加一个新的实体节点', en: 'Add a new entity node' },
  'command.createBlock': { zh: '创建方块节点', en: 'Create Block Node' },
  'command.createBlockDesc': { zh: '添加一个新的方块节点', en: 'Add a new block node' },
  'command.createItem': { zh: '创建物品节点', en: 'Create Item Node' },
  'command.createItemDesc': { zh: '添加一个新的物品节点', en: 'Add a new item node' },
  'command.layoutGrid': { zh: '自动排列：网格', en: 'Auto Layout: Grid' },
  'command.layoutGridDesc': { zh: '将所有节点排列为网格', en: 'Arrange all nodes in a grid' },
  'command.layoutSpiral': { zh: '自动排列：螺旋', en: 'Auto Layout: Spiral' },
  'command.layoutSpiralDesc': { zh: '将所有节点排列为螺旋', en: 'Arrange all nodes in a spiral' },
  'command.layoutTree': { zh: '自动排列：树形', en: 'Auto Layout: Tree' },
  'command.layoutTreeDesc': { zh: '按连线关系分层排列', en: 'Hierarchical layout by connections' },
  'command.save': { zh: '保存项目', en: 'Save Project' },
  'command.saveDesc': { zh: '手动触发保存', en: 'Manually trigger save' },
  'command.export': { zh: '导出 Mod ZIP', en: 'Export Mod ZIP' },
  'command.exportDesc': { zh: '导出为可构建的 Forge 项目', en: 'Export as buildable Forge project' },
  'command.settings': { zh: '打开设置', en: 'Open Settings' },
  'command.settingsDesc': { zh: '镜像源/主题/快捷键/插件/环境', en: 'Mirror/Theme/Shortcuts/Plugins/Env' },

  // === 搜索 ===
  'search.placeholder': { zh: '搜索节点...', en: 'Search nodes...' },
  'search.noResults': { zh: '未找到匹配的节点', en: 'No matching nodes' },
  'search.empty': { zh: '输入关键词搜索节点', en: 'Type to search nodes' },

  // === 状态栏 ===
  'status.nodeMode': { zh: '节点模式', en: 'Node Mode' },
  'status.codeMode': { zh: '代码模式', en: 'Code Mode' },
  'status.search': { zh: '搜索', en: 'Search' },
  'status.command': { zh: '命令', en: 'Command' },
  'status.build': { zh: '构建', en: 'Build' },
  'status.undo': { zh: '撤销', en: 'Undo' },
  'status.copyPaste': { zh: '复制/粘贴', en: 'Copy/Paste' },

  // === 代码预览 ===
  'codePreview.title': { zh: '代码预览', en: 'Code Preview' },
  'codePreview.selectNode': { zh: '选中节点查看代码', en: 'Select a node to view code' },
  'codePreview.noCode': { zh: '该节点类型不支持代码生成', en: 'No code for this node type' },
  'codePreview.copied': { zh: '代码已复制', en: 'Code copied' },
  'codePreview.lines': { zh: '行', en: 'lines' },

  // === 通用 ===
  'common.confirm': { zh: '确认', en: 'Confirm' },
  'common.delete': { zh: '删除', en: 'Delete' },
  'common.rename': { zh: '重命名', en: 'Rename' },
  'common.cancel': { zh: '取消', en: 'Cancel' },
  'common.save': { zh: '保存', en: 'Save' },
  'common.loading': { zh: '加载中...', en: 'Loading...' },
  'common.search': { zh: '搜索', en: 'Search' },
}

export function t(key: string, locale: Locale): string {
  const entry = translations[key]
  if (!entry) return key
  return entry[locale] ?? entry.zh ?? key
}

export function getAvailableLocales(): Locale[] {
  return ['zh', 'en']
}
