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

  // === 碰撞箱 ===
  'hitbox.title': { zh: '碰撞箱预览', en: 'Collision Box Preview' },
  'hitbox.width': { zh: '宽度 (X)', en: 'Width (X)' },
  'hitbox.height': { zh: '高度 (Y)', en: 'Height (Y)' },
  'hitbox.depth': { zh: '深度 (Z)', en: 'Depth (Z)' },
  'hitbox.presetSmall': { zh: '小型', en: 'Small' },
  'hitbox.presetStandard': { zh: '标准', en: 'Standard' },
  'hitbox.presetLarge': { zh: '大型', en: 'Large' },
  'hitbox.presetBoss': { zh: 'Boss', en: 'Boss' },
  'hitbox.hint': { zh: '碰撞箱决定实体的物理碰撞体积。', en: 'Collision box determines entity physical volume.' },

  // === AI 行为 ===
  'ai.title': { zh: 'AI 行为模板', en: 'AI Behavior Template' },
  'ai.goals': { zh: 'AI 目标（按优先级排序）', en: 'AI Goals (by priority)' },
  'ai.hint': { zh: '优先级数字越小越高（0 最高）。', en: 'Lower priority number = higher priority.' },
  'ai.templateNone': { zh: '无 AI', en: 'No AI' },
  'ai.templateMelee': { zh: '近战攻击', en: 'Melee Attack' },
  'ai.templateRanged': { zh: '远程攻击', en: 'Ranged Attack' },
  'ai.templatePanic': { zh: '逃窜', en: 'Panic' },
  'ai.templateLook': { zh: '看玩家', en: 'Look at Player' },
  'ai.templateWander': { zh: '游走', en: 'Wander' },

  // === 成就树 ===
  'advancementTree.title': { zh: '成就树', en: 'Advancement Tree' },
  'advancementTree.setParent': { zh: '设为前置', en: 'Set as Prerequisite' },
  'advancementTree.parentSet': { zh: '已设为前置', en: 'Set as Prerequisite' },
  'advancementTree.removeParent': { zh: '移除', en: 'Remove' },
  'advancementTree.current': { zh: '当前', en: 'Current' },
  'advancementTree.empty': { zh: '尚无成就节点', en: 'No advancement nodes yet' },
  'advancementTree.frameTask': { zh: '普通', en: 'Task' },
  'advancementTree.frameChallenge': { zh: '挑战', en: 'Challenge' },
  'advancementTree.frameGoal': { zh: '目标', en: 'Goal' },

  // === 版本历史 ===
  'version.title': { zh: '版本历史', en: 'Version History' },
  'version.save': { zh: '保存版本快照', en: 'Save Version Snapshot' },
  'version.restore': { zh: '恢复', en: 'Restore' },
  'version.confirmRestore': { zh: '确认恢复？当前未保存的更改将丢失。', en: 'Confirm restore? Unsaved changes will be lost.' },
  'version.latest': { zh: '最新', en: 'Latest' },
  'version.empty': { zh: '暂无版本', en: 'No versions yet' },
  'version.namePlaceholder': { zh: '版本名称', en: 'Version name' },
  'version.maxRetained': { zh: '最多保留 20 个版本', en: 'Max 20 versions retained' },

  // === 配方预览 ===
  'recipe.craftingGrid': { zh: '合成网格', en: 'Crafting Grid' },
  'recipe.smeltingPreview': { zh: '烧炼预览', en: 'Smelting Preview' },
  'recipe.stonecuttingPreview': { zh: '切石预览', en: 'Stonecutting Preview' },
  'recipe.shaped': { zh: '有序', en: 'Shaped' },
  'recipe.shapeless': { zh: '无序', en: 'Shapeless' },
  'recipe.clear': { zh: '清空', en: 'Clear' },
  'recipe.example': { zh: '示例', en: 'Example' },
  'recipe.cookingTime': { zh: '烧制时间', en: 'Cooking Time' },
  'recipe.experience': { zh: '经验值', en: 'Experience' },

  // === 批量编辑 ===
  'batch.title': { zh: '批量编辑', en: 'Batch Edit' },
  'batch.typeDistribution': { zh: '类型分布', en: 'Type Distribution' },
  'batch.sharedProperties': { zh: '共享属性', en: 'Shared Properties' },
  'batch.clone': { zh: '克隆', en: 'Clone' },
  'batch.group': { zh: '分组', en: 'Group' },

  // === 项目统计 ===
  'stats.title': { zh: '项目统计', en: 'Project Stats' },
  'stats.nodes': { zh: '节点', en: 'Nodes' },
  'stats.edges': { zh: '连线', en: 'Edges' },
  'stats.types': { zh: '类型', en: 'Types' },
  'stats.typeDistribution': { zh: '类型分布', en: 'Type Distribution' },
  'stats.exportEstimate': { zh: '导出预估', en: 'Export Estimate' },
  'stats.javaFiles': { zh: 'Java 文件', en: 'Java Files' },
  'stats.jsonFiles': { zh: 'JSON 文件', en: 'JSON Files' },
  'stats.codeLines': { zh: '代码行数', en: 'Code Lines' },
  'stats.zipSize': { zh: 'ZIP 大小', en: 'ZIP Size' },

  // === 对齐工具栏 ===
  'align.left': { zh: '左对齐', en: 'Align Left' },
  'align.right': { zh: '右对齐', en: 'Align Right' },
  'align.top': { zh: '顶对齐', en: 'Align Top' },
  'align.bottom': { zh: '底对齐', en: 'Align Bottom' },
  'align.hCenter': { zh: '水平居中', en: 'Horizontal Center' },
  'align.vCenter': { zh: '垂直居中', en: 'Vertical Center' },
  'align.hDistribute': { zh: '水平等距', en: 'Horizontal Distribute' },
  'align.vDistribute': { zh: '垂直等距', en: 'Vertical Distribute' },

  // === 帮助 ===
  'help.title': { zh: '快速上手', en: 'Quick Start' },
  'help.coreFlow': { zh: '核心流程', en: 'Core Workflow' },
  'help.tips': { zh: '使用技巧', en: 'Tips' },

  // === 附魔兼容 ===
  'enchant.compatItems': { zh: '额外适用物品', en: 'Compatible Items' },
  'enchant.incompatible': { zh: '冲突附魔', en: 'Incompatible Enchantments' },
  'enchant.bookCompatible': { zh: '附魔书可用', en: 'Allowed on Books' },

  // === 节点组 ===
  'group.title': { zh: '节点组', en: 'Node Group' },
  'group.members': { zh: '组成员', en: 'Members' },
  'group.ungroup': { zh: '解散组', en: 'Ungroup' },
  'group.empty': { zh: '暂无子节点', en: 'No child nodes' },
  'group.dragHint': { zh: '拖拽节点到组内即可添加', en: 'Drag nodes into group to add' },
  'group.joined': { zh: '节点已加入组', en: 'Node joined group' },
  'group.removed': { zh: '节点已移出组', en: 'Node removed from group' },
  'group.ungrouped': { zh: '组已解散，节点已释放', en: 'Group dissolved, nodes released' },

  // === 碰撞箱预设 ===
  'hitbox.presetSmallDesc': { zh: '小型生物（蝙蝠）', en: 'Small creature (bat)' },
  'hitbox.presetStandardDesc': { zh: '标准生物（僵尸）', en: 'Standard creature (zombie)' },
  'hitbox.presetLargeDesc': { zh: '大型生物（末影龙）', en: 'Large creature (ender dragon)' },
  'hitbox.presetBossDesc': { zh: 'Boss 级（凋灵）', en: 'Boss level (wither)' },

  // === 连线 ===
  'edge.selected': { zh: '连线已选中', en: 'Edge selected' },
  'edge.deleteHint': { zh: '按 Delete 删除', en: 'Press Delete to remove' },
  'edge.deleted': { zh: '连线已删除', en: 'Edge deleted' },
  'edge.incompatible': { zh: '无法连接', en: 'Cannot connect' },

  // === 工程文件 ===
  'project.openFiles': { zh: '打开工程文件', en: 'Open Project Files' },
  'project.saved': { zh: '已保存', en: 'Saved' },
  'project.autoSync': { zh: '自动同步', en: 'Auto Sync' },

  // === 配方 ===
  'recipe.crafting': { zh: '合成台', en: 'Crafting Table' },
  'recipe.smelting': { zh: '熔炉', en: 'Furnace' },
  'recipe.blasting': { zh: '高炉', en: 'Blast Furnace' },
  'recipe.smoking': { zh: '烟熏炉', en: 'Smoker' },
  'recipe.stonecutting': { zh: '切石机', en: 'Stonecutter' },
  'recipe.input': { zh: '输入', en: 'Input' },
  'recipe.output': { zh: '产物', en: 'Output' },
  'recipe.count': { zh: '数量', en: 'Count' },

  // === 状态栏 ===
  'status.fps': { zh: '帧率', en: 'FPS' },
  'status.memory': { zh: '内存', en: 'Memory' },
  'status.renderTime': { zh: '渲染', en: 'Render' },
  'status.ready': { zh: '就绪', en: 'Ready' },

  // === FAQ ===
  'faq.title': { zh: '常见问题', en: 'FAQ' },
  'faq.createEntity': { zh: '如何创建自定义实体？', en: 'How to create a custom entity?' },
  'faq.connectNodes': { zh: '如何连接两个节点？', en: 'How to connect two nodes?' },
  'faq.exportMod': { zh: '如何导出模组？', en: 'How to export a mod?' },
  'faq.useGroup': { zh: '如何使用节点组？', en: 'How to use node groups?' },
  'faq.editRecipe': { zh: '如何编辑配方？', en: 'How to edit a recipe?' },

  // === 故障排除 ===
  'troubleshoot.title': { zh: '故障排除', en: 'Troubleshooting' },
  'troubleshoot.dragLag': { zh: '节点拖拽卡顿？', en: 'Node drag lag?' },
  'troubleshoot.connectFail': { zh: '连线无法创建？', en: 'Cannot create connection?' },
  'troubleshoot.exportFail': { zh: '导出 ZIP 编译失败？', en: 'Export ZIP compile failed?' },
  'troubleshoot.panelHidden': { zh: '属性面板不显示？', en: 'Property panel not visible?' },

  // === MC 图标 ===
  'mcIcon.title': { zh: 'MC 原版贴图', en: 'MC Vanilla Textures' },
  'mcIcon.search': { zh: '搜索物品...', en: 'Search items...' },
  'mcIcon.source': { zh: '图标来源 mcicons.ccleaf.com', en: 'Icons from mcicons.ccleaf.com' },
  'mcIcon.select': { zh: 'MC贴图', en: 'MC Textures' },

  // === 自定义属性 ===
  'customAttr.title': { zh: '自定义属性', en: 'Custom Attributes' },
  'customAttr.name': { zh: '属性名', en: 'Attribute Name' },
  'customAttr.value': { zh: '属性值', en: 'Attribute Value' },
  'customAttr.desc': { zh: '属性描述', en: 'Description' },

  // === 掉落 ===
  'drop.title': { zh: '掉落配置', en: 'Drop Configuration' },
  'drop.itemId': { zh: '掉落物品 ID', en: 'Drop Item ID' },
  'drop.count': { zh: '掉落数量', en: 'Drop Count' },
  'drop.chance': { zh: '掉落概率', en: 'Drop Chance' },

  // === BlockState ===
  'blockState.title': { zh: 'BlockState 属性', en: 'BlockState Properties' },
  'blockState.hint': { zh: '格式：facing=north,active=false', en: 'Format: facing=north,active=false' },

  // === 节点类型标签 ===
  'nodeType.entity': { zh: '实体', en: 'Entity' },
  'nodeType.block': { zh: '方块', en: 'Block' },
  'nodeType.item': { zh: '物品', en: 'Item' },
  'nodeType.equipment': { zh: '装备', en: 'Equipment' },
  'nodeType.weapon': { zh: '武器', en: 'Weapon' },
  'nodeType.food': { zh: '食物', en: 'Food' },
  'nodeType.biome': { zh: '群系', en: 'Biome' },
  'nodeType.structure': { zh: '结构', en: 'Structure' },
  'nodeType.dimension': { zh: '维度', en: 'Dimension' },
  'nodeType.potion': { zh: '药水', en: 'Potion' },
  'nodeType.enchantment': { zh: '附魔', en: 'Enchantment' },
  'nodeType.advancement': { zh: '成就', en: 'Advancement' },
  'nodeType.recipe': { zh: '配方', en: 'Recipe' },
  'nodeType.group': { zh: '节点组', en: 'Group' },
  'nodeType.blackbox': { zh: '黑盒代码', en: 'Blackbox' },
  'nodeType.function': { zh: '函数', en: 'Function' },
  'nodeType.spell': { zh: '法术', en: 'Spell' },

  // === AI 目标名称 ===
  'aiGoal.float': { zh: '防溺水', en: 'Float' },
  'aiGoal.melee': { zh: '近战攻击', en: 'Melee Attack' },
  'aiGoal.ranged': { zh: '远程攻击', en: 'Ranged Attack' },
  'aiGoal.chase': { zh: '追踪玩家', en: 'Chase Player' },
  'aiGoal.panic': { zh: '逃窜', en: 'Panic' },
  'aiGoal.stroll': { zh: '随机游走', en: 'Wander' },
  'aiGoal.lookPlayer': { zh: '看玩家', en: 'Look at Player' },
  'aiGoal.lookAround': { zh: '随机看', en: 'Look Around' },

  // === 端口数据类型 ===
  'portType.entity': { zh: '实体', en: 'Entity' },
  'portType.boolean': { zh: '布尔', en: 'Boolean' },
  'portType.number': { zh: '数值', en: 'Number' },
  'portType.string': { zh: '字符串', en: 'String' },
  'portType.itemstack': { zh: '物品堆', en: 'Item Stack' },
  'portType.any': { zh: '通用', en: 'Any' },
  'portType.block': { zh: '方块', en: 'Block' },
}

export function t(key: string, locale: Locale): string {
  const entry = translations[key]
  if (!entry) return key
  return entry[locale] ?? entry.zh ?? key
}

export function getAvailableLocales(): Locale[] {
  return ['zh', 'en']
}
