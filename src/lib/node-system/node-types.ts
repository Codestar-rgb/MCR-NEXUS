/**
 * 节点类型注册表
 *
 * NexCube 节点画布的核心：定义所有可创建的节点类型。
 *
 * 节点大类型（NodeKind）：
 *   - 核心：entity / block / item（首期支持的三类 MC 资源）
 *   - 高级：group / blackbox / function（节点组织与代码降级）
 *   - 逻辑：logic_event / logic_condition / logic_loop / logic_action / logic_variable（实体/方块/物品子节点）
 *
 * 每种节点类型定义包含：
 *   - 基本信息（label/icon/color/description）
 *   - 默认尺寸（defaultSize）
 *   - 输入/输出端口定义
 *   - 属性 schema（驱动属性面板动态表单）
 *   - 是否支持子节点逻辑
 */

import type { PortDefinition } from './port-types'

/** 节点大类型 */
export type NodeKind =
  | 'entity' // 实体
  | 'block' // 方块
  | 'item' // 物品
  | 'group' // 节点组
  | 'blackbox' // 黑盒代码节点
  | 'function' // 函数节点
  | 'logic_event' // 事件监听（子节点）
  | 'logic_condition' // 条件判断（子节点）
  | 'logic_loop' // 循环（子节点）
  | 'logic_action' // 执行动作（子节点）
  | 'logic_variable' // 变量（子节点）
  | 'debug_log' // 打印日志（调试）
  | 'debug_breakpoint' // 断点（调试）
  // 阶段 8 新增：
  | 'equipment' // 装备
  | 'weapon' // 武器
  | 'food' // 食物
  | 'biome' // 群系
  | 'structure' // 结构
  | 'dimension' // 维度
  | 'potion' // 药水效果

/** 节点类型分类 */
export type NodeCategory = 'core' | 'logic' | 'advanced'

/** 属性 schema 字段类型（驱动属性面板表单渲染） */
export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'color'
  | 'vec3'
  | 'texture'

/** 属性 schema（驱动属性面板动态生成表单） */
export interface PropertySchema {
  key: string
  label: string
  type: PropertyType
  defaultValue: unknown
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: string }[] // for select
  placeholder?: string
  description?: string
  group?: string // 属性分组，如 "基础"/"战斗"/"AI"
}

/** 节点类型定义 */
export interface NodeTypeDefinition {
  kind: NodeKind
  label: string // 中文名
  category: NodeCategory
  icon: string // lucide 图标名
  color: string // tailwind 颜色名
  description: string
  defaultSize: { width: number; height: number }
  /** 输入端口定义 */
  inputPorts: PortDefinition[]
  /** 输出端口定义 */
  outputPorts: PortDefinition[]
  /** 属性 schema（用于属性面板动态生成表单） */
  propertiesSchema: PropertySchema[]
  /** 是否支持子节点逻辑（实体/方块/物品支持） */
  supportsSubLogic: boolean
}

/** 节点类型注册表 */
export const NODE_TYPE_REGISTRY: Record<string, NodeTypeDefinition> = {
  // ============ 实体节点 ============
  entity: {
    kind: 'entity',
    label: '实体',
    category: 'core',
    icon: 'Boxes',
    color: 'rose',
    description: '自定义生物实体',
    defaultSize: { width: 240, height: 200 },
    inputPorts: [
      { id: 'trigger', label: '触发', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [
      { id: 'entity_out', label: '实体', dataType: 'entity', direction: 'output' },
    ],
    supportsSubLogic: true,
    propertiesSchema: [
      { key: 'name', label: '名称', type: 'string', defaultValue: 'New Entity', group: '基础', placeholder: '显示名称' },
      { key: 'registryId', label: '注册 ID', type: 'string', defaultValue: 'new_entity', group: '基础', placeholder: '小写下划线' },
      { key: 'health', label: '生命值', type: 'number', defaultValue: 20, min: 1, max: 1024, step: 1, group: '战斗' },
      { key: 'attack', label: '攻击力', type: 'number', defaultValue: 0, min: 0, max: 1000, step: 1, group: '战斗' },
      { key: 'armor', label: '护甲值', type: 'number', defaultValue: 0, min: 0, max: 30, step: 1, group: '战斗' },
      { key: 'armorToughness', label: '护甲韧性', type: 'number', defaultValue: 0, min: 0, max: 20, step: 0.5, group: '战斗' },
      { key: 'movementSpeed', label: '移动速度', type: 'number', defaultValue: 0.3, min: 0, max: 10, step: 0.05, group: '战斗' },
      {
        key: 'mobCategory',
        label: '生物类别',
        type: 'select',
        defaultValue: 'creature',
        group: '基础',
        options: [
          { label: '生物 (Creature)', value: 'creature' },
          { label: '怪物 (Monster)', value: 'monster' },
          { label: '环境 (Ambient)', value: 'ambient' },
          { label: '水域生物 (Water)', value: 'water_creature' },
          { label: '地下水域 (Underground)', value: 'underground_water_creature' },
        ],
      },
      { key: 'collisionBox', label: '碰撞箱', type: 'vec3', defaultValue: { x: 0.6, y: 1.8, z: 0.6 }, group: '基础' },
      {
        key: 'aiType',
        label: 'AI 类型',
        type: 'select',
        defaultValue: 'none',
        group: 'AI',
        options: [
          { label: '无 AI', value: 'none' },
          { label: '近战攻击', value: 'melee' },
          { label: '远程攻击', value: 'ranged' },
          { label: '逃窜', value: 'panic' },
          { label: '看玩家', value: 'look' },
          { label: '游走', value: 'wander' },
        ],
      },
      { key: 'texture', label: '贴图', type: 'texture', defaultValue: null, group: '基础' },
      // 自定义属性
      { key: 'customAttrName', label: '自定义属性名', type: 'string', defaultValue: '', group: '自定义属性', placeholder: '如 flight_speed' },
      { key: 'customAttrValue', label: '自定义属性值', type: 'number', defaultValue: 0, min: -1024, max: 1024, step: 0.1, group: '自定义属性' },
      { key: 'customAttrDesc', label: '属性描述', type: 'string', defaultValue: '', group: '自定义属性', placeholder: '玩家可见的属性说明' },
      // 掉落物配置
      { key: 'dropItemId', label: '掉落物品 ID', type: 'string', defaultValue: '', group: '掉落', placeholder: 'minecraft:diamond（留空掉落自身同名物品）' },
      { key: 'dropCount', label: '掉落数量', type: 'number', defaultValue: 1, min: 1, max: 64, step: 1, group: '掉落' },
      { key: 'dropChance', label: '掉落概率', type: 'number', defaultValue: 1, min: 0, max: 1, step: 0.05, group: '掉落', description: '0~1' },
    ],
  },

  // ============ 方块节点 ============
  block: {
    kind: 'block',
    label: '方块',
    category: 'core',
    icon: 'Box',
    color: 'amber',
    description: '自定义方块',
    defaultSize: { width: 240, height: 220 },
    inputPorts: [
      { id: 'trigger', label: '触发', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [
      { id: 'block_out', label: '方块', dataType: 'itemstack', direction: 'output' },
    ],
    supportsSubLogic: true,
    propertiesSchema: [
      { key: 'name', label: '名称', type: 'string', defaultValue: 'New Block', group: '基础' },
      { key: 'registryId', label: '注册 ID', type: 'string', defaultValue: 'new_block', group: '基础' },
      { key: 'hardness', label: '硬度', type: 'number', defaultValue: 3, min: -1, max: 100, step: 0.5, group: '物理' },
      { key: 'resistance', label: '抗爆度', type: 'number', defaultValue: 6, min: 0, max: 3600000, step: 1, group: '物理' },
      { key: 'lightLevel', label: '发光等级', type: 'number', defaultValue: 0, min: 0, max: 15, step: 1, group: '物理' },
      {
        key: 'harvestTool',
        label: '破坏工具',
        type: 'select',
        defaultValue: 'pickaxe',
        group: '物理',
        options: [
          { label: '镐 (Pickaxe)', value: 'pickaxe' },
          { label: '斧 (Axe)', value: 'axe' },
          { label: '锹 (Shovel)', value: 'shovel' },
          { label: '锄 (Hoe)', value: 'hoe' },
          { label: '剑 (Sword)', value: 'sword' },
          { label: '任意', value: 'any' },
        ],
      },
      { key: 'harvestLevel', label: '挖掘等级', type: 'number', defaultValue: 1, min: 0, max: 4, step: 1, group: '物理' },
      { key: 'isTransparent', label: '透明', type: 'boolean', defaultValue: false, group: '物理' },
      { key: 'isSolid', label: '固体', type: 'boolean', defaultValue: true, group: '物理' },
      {
        key: 'dropItem',
        label: '掉落物',
        type: 'select',
        defaultValue: 'self',
        group: '掉落',
        options: [
          { label: '自身', value: 'self' },
          { label: '无', value: 'none' },
        ],
      },
      { key: 'dropCount', label: '掉落数量', type: 'number', defaultValue: 1, min: 0, max: 64, step: 1, group: '掉落' },
      { key: 'texture', label: '贴图', type: 'texture', defaultValue: null, group: '基础' },
      // BlockState 属性
      { key: 'blockStateProps', label: '状态属性', type: 'string', defaultValue: '', group: 'BlockState', placeholder: 'facing=north,active=false' },
    ],
  },

  // ============ 物品节点 ============
  item: {
    kind: 'item',
    label: '物品',
    category: 'core',
    icon: 'Package',
    color: 'teal',
    description: '自定义物品',
    defaultSize: { width: 240, height: 200 },
    inputPorts: [
      { id: 'trigger', label: '触发', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [
      { id: 'item_out', label: '物品', dataType: 'itemstack', direction: 'output' },
    ],
    supportsSubLogic: true,
    propertiesSchema: [
      { key: 'name', label: '名称', type: 'string', defaultValue: 'New Item', group: '基础' },
      { key: 'registryId', label: '注册 ID', type: 'string', defaultValue: 'new_item', group: '基础' },
      { key: 'maxStackSize', label: '最大堆叠', type: 'number', defaultValue: 64, min: 1, max: 64, step: 1, group: '基础' },
      {
        key: 'rarity',
        label: '稀有度',
        type: 'select',
        defaultValue: 'common',
        group: '基础',
        options: [
          { label: '普通 (Common)', value: 'common' },
          { label: '罕见 (Uncommon)', value: 'uncommon' },
          { label: '稀有 (Rare)', value: 'rare' },
          { label: '史诗 (Epic)', value: 'epic' },
        ],
      },
      { key: 'useCooldown', label: '使用冷却 (tick)', type: 'number', defaultValue: 0, min: 0, max: 200, step: 1, group: '使用' },
      { key: 'isFood', label: '是食物', type: 'boolean', defaultValue: false, group: '食物' },
      { key: 'nutrition', label: '饱食度', type: 'number', defaultValue: 0, min: 0, max: 20, step: 1, group: '食物' },
      { key: 'saturation', label: '饱和度', type: 'number', defaultValue: 0, min: 0, max: 20, step: 0.1, group: '食物' },
      { key: 'texture', label: '贴图', type: 'texture', defaultValue: null, group: '基础' },
    ],
  },

  // ============ 节点组 ============
  group: {
    kind: 'group',
    label: '节点组',
    category: 'advanced',
    icon: 'Group',
    color: 'slate',
    description: '将多个节点打包为组',
    defaultSize: { width: 400, height: 300 },
    inputPorts: [],
    outputPorts: [],
    supportsSubLogic: false,
    propertiesSchema: [
      { key: 'name', label: '组名', type: 'string', defaultValue: '节点组', group: '基础' },
      { key: 'color', label: '颜色', type: 'color', defaultValue: 'emerald', group: '基础' },
    ],
  },

  // ============ 黑盒节点 ============
  blackbox: {
    kind: 'blackbox',
    label: '黑盒代码',
    category: 'advanced',
    icon: 'Code2',
    color: 'zinc',
    description: '无法用节点表达的代码片段，打包为黑盒',
    defaultSize: { width: 260, height: 160 },
    inputPorts: [
      { id: 'in_1', label: '输入 1', dataType: 'string', direction: 'input' },
    ],
    outputPorts: [
      { id: 'out_1', label: '输出 1', dataType: 'string', direction: 'output' },
    ],
    supportsSubLogic: false,
    propertiesSchema: [
      { key: 'name', label: '名称', type: 'string', defaultValue: '黑盒代码', group: '基础' },
      {
        key: 'sourceCode',
        label: 'Java 代码',
        type: 'string',
        defaultValue:
          '// 在此编写 Java 代码片段\n// NexCube 无法将其解析为节点，将以原样插入生成的代码中',
        group: '代码',
      },
    ],
  },

  // ============ 函数节点 ============
  function: {
    kind: 'function',
    label: '函数节点',
    category: 'advanced',
    icon: 'FunctionSquare',
    color: 'cyan',
    description: '封装的子节点逻辑，可复用',
    defaultSize: { width: 220, height: 140 },
    inputPorts: [
      { id: 'call', label: '调用', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [
      { id: 'return', label: '返回', dataType: 'string', direction: 'output' },
    ],
    supportsSubLogic: true,
    propertiesSchema: [
      { key: 'name', label: '函数名', type: 'string', defaultValue: 'myFunction', group: '基础' },
      { key: 'color', label: '颜色', type: 'color', defaultValue: 'cyan', group: '基础' },
      // functionName / inputPorts / outputPorts / encapsulatedNodeIds
      // 由"封装为函数"操作写入（不在属性面板表单显示）
    ],
  },

  // ============ 逻辑子节点：事件监听 ============
  logic_event: {
    kind: 'logic_event',
    label: '事件监听',
    category: 'logic',
    icon: 'Radio',
    color: 'amber',
    description: '监听游戏事件触发逻辑',
    defaultSize: { width: 200, height: 100 },
    inputPorts: [],
    outputPorts: [
      { id: 'trigger', label: '触发', dataType: 'boolean', direction: 'output' },
    ],
    supportsSubLogic: false,
    propertiesSchema: [
      {
        key: 'eventName',
        label: '事件类型',
        type: 'select',
        defaultValue: 'onTick',
        group: '事件',
        options: [
          { label: '每刻触发 (onTick)', value: 'onTick' },
          { label: '被攻击时 (onHurt)', value: 'onHurt' },
          { label: '死亡时 (onDeath)', value: 'onDeath' },
          { label: '被交互时 (onInteract)', value: 'onInteract' },
          { label: '生成时 (onSpawn)', value: 'onSpawn' },
          { label: '右键点击 (onRightClick)', value: 'onRightClick' },
        ],
      },
    ],
  },

  // ============ 逻辑子节点：条件判断 ============
  logic_condition: {
    kind: 'logic_condition',
    label: '条件判断',
    category: 'logic',
    icon: 'GitBranch',
    color: 'cyan',
    description: 'if/else 条件分支',
    defaultSize: { width: 200, height: 120 },
    inputPorts: [
      { id: 'in', label: '输入', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [
      { id: 'true', label: '真', dataType: 'boolean', direction: 'output' },
      { id: 'false', label: '假', dataType: 'boolean', direction: 'output' },
    ],
    supportsSubLogic: false,
    propertiesSchema: [
      {
        key: 'condition',
        label: '条件表达式',
        type: 'string',
        defaultValue: 'health < 10',
        group: '条件',
        placeholder: '如 health < 10',
      },
    ],
  },

  // ============ 逻辑子节点：循环 ============
  logic_loop: {
    kind: 'logic_loop',
    label: '循环',
    category: 'logic',
    icon: 'Repeat',
    color: 'teal',
    description: 'for/while 循环',
    defaultSize: { width: 200, height: 100 },
    inputPorts: [
      { id: 'in', label: '输入', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [
      { id: 'body', label: '循环体', dataType: 'boolean', direction: 'output' },
      { id: 'done', label: '完成', dataType: 'boolean', direction: 'output' },
    ],
    supportsSubLogic: false,
    propertiesSchema: [
      {
        key: 'loopType',
        label: '循环类型',
        type: 'select',
        defaultValue: 'for',
        group: '循环',
        options: [
          { label: 'for (固定次数)', value: 'for' },
          { label: 'while (条件)', value: 'while' },
          { label: 'forEach (遍历)', value: 'forEach' },
        ],
      },
      {
        key: 'count',
        label: '次数',
        type: 'number',
        defaultValue: 10,
        min: 1,
        max: 1000,
        group: '循环',
      },
    ],
  },

  // ============ 逻辑子节点：执行动作 ============
  logic_action: {
    kind: 'logic_action',
    label: '执行动作',
    category: 'logic',
    icon: 'Zap',
    color: 'violet',
    description: '执行游戏动作',
    defaultSize: { width: 200, height: 100 },
    inputPorts: [
      { id: 'in', label: '输入', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [],
    supportsSubLogic: false,
    propertiesSchema: [
      {
        key: 'actionType',
        label: '动作类型',
        type: 'select',
        defaultValue: 'spawn',
        group: '动作',
        options: [
          { label: '生成实体 (spawn)', value: 'spawn' },
          { label: '造成伤害 (damage)', value: 'damage' },
          { label: '传送 (teleport)', value: 'teleport' },
          { label: '给予物品 (give)', value: 'give' },
          { label: '播放音效 (playSound)', value: 'playSound' },
          { label: '生成粒子 (spawnParticle)', value: 'spawnParticle' },
        ],
      },
      {
        key: 'target',
        label: '目标',
        type: 'string',
        defaultValue: '@self',
        group: '动作',
        placeholder: '@self / @attacker / @nearby',
      },
    ],
  },

  // ============ 逻辑子节点：变量 ============
  logic_variable: {
    kind: 'logic_variable',
    label: '变量',
    category: 'logic',
    icon: 'Variable',
    color: 'emerald',
    description: '存储临时变量',
    defaultSize: { width: 180, height: 80 },
    inputPorts: [
      { id: 'set', label: '设置', dataType: 'string', direction: 'input' },
    ],
    outputPorts: [
      { id: 'get', label: '获取', dataType: 'string', direction: 'output' },
    ],
    supportsSubLogic: false,
    propertiesSchema: [
      {
        key: 'varName',
        label: '变量名',
        type: 'string',
        defaultValue: 'tempVar',
        group: '变量',
        placeholder: '小写驼峰',
      },
      {
        key: 'varType',
        label: '类型',
        type: 'select',
        defaultValue: 'number',
        group: '变量',
        options: [
          { label: '数值 (number)', value: 'number' },
          { label: '字符串 (string)', value: 'string' },
          { label: '布尔 (boolean)', value: 'boolean' },
        ],
      },
      {
        key: 'initialValue',
        label: '初始值',
        type: 'string',
        defaultValue: '0',
        group: '变量',
      },
    ],
  },

  // ============ 调试节点：打印日志 ============
  debug_log: {
    kind: 'debug_log',
    label: '打印日志',
    category: 'logic',
    icon: 'Terminal',
    color: 'emerald',
    description: '输出日志到控制台（调试用）',
    defaultSize: { width: 180, height: 80 },
    inputPorts: [
      { id: 'in', label: '输入', dataType: 'string', direction: 'input' },
    ],
    outputPorts: [],
    supportsSubLogic: false,
    propertiesSchema: [
      {
        key: 'message',
        label: '日志内容',
        type: 'string',
        defaultValue: 'Hello from node!',
        group: '日志',
      },
      {
        key: 'logLevel',
        label: '级别',
        type: 'select',
        defaultValue: 'info',
        group: '日志',
        options: [
          { label: '信息 (info)', value: 'info' },
          { label: '警告 (warn)', value: 'warn' },
          { label: '错误 (error)', value: 'error' },
        ],
      },
    ],
  },

  // ============ 调试节点：断点 ============
  debug_breakpoint: {
    kind: 'debug_breakpoint',
    label: '断点',
    category: 'logic',
    icon: 'CircleDot',
    color: 'rose',
    description: '运行到此节点暂停（调试用）',
    defaultSize: { width: 160, height: 70 },
    inputPorts: [
      { id: 'in', label: '输入', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [
      { id: 'out', label: '继续', dataType: 'boolean', direction: 'output' },
    ],
    supportsSubLogic: false,
    propertiesSchema: [
      {
        key: 'condition',
        label: '断点条件',
        type: 'string',
        defaultValue: '',
        group: '断点',
        placeholder: '留空表示总是断',
      },
    ],
  },

  // ============ 阶段 8：装备节点 ============
  equipment: {
    kind: 'equipment',
    label: '装备',
    category: 'core',
    icon: 'Shield',
    color: 'cyan',
    description: '自定义防具装备（头盔/胸甲/护腿/靴子）',
    defaultSize: { width: 240, height: 220 },
    inputPorts: [
      { id: 'trigger', label: '触发', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [
      { id: 'equipment_out', label: '装备', dataType: 'itemstack', direction: 'output' },
    ],
    supportsSubLogic: true,
    propertiesSchema: [
      { key: 'name', label: '名称', type: 'string', defaultValue: 'New Armor', group: '基础' },
      { key: 'registryId', label: '注册 ID', type: 'string', defaultValue: 'new_armor', group: '基础' },
      { key: 'equipmentSlot', label: '装备槽', type: 'select', defaultValue: 'chest', group: '基础', options: [
        { label: '头盔 (Head)', value: 'head' },
        { label: '胸甲 (Chest)', value: 'chest' },
        { label: '护腿 (Legs)', value: 'legs' },
        { label: '靴子 (Feet)', value: 'feet' },
      ]},
      { key: 'armorValue', label: '护甲值', type: 'number', defaultValue: 5, min: 0, max: 30, step: 1, group: '属性' },
      { key: 'armorToughness', label: '护甲韧性', type: 'number', defaultValue: 0, min: 0, max: 20, step: 0.5, group: '属性' },
      { key: 'knockbackResistance', label: '击退抗性', type: 'number', defaultValue: 0, min: 0, max: 1, step: 0.05, group: '属性' },
      { key: 'durability', label: '耐久度', type: 'number', defaultValue: 200, min: 1, max: 5000, step: 10, group: '属性' },
      { key: 'enchantability', label: '附魔等级', type: 'number', defaultValue: 15, min: 0, max: 50, step: 1, group: '属性' },
      { key: 'repairMaterial', label: '修复材料', type: 'string', defaultValue: 'minecraft:diamond', group: '属性' },
      { key: 'texture', label: '贴图', type: 'texture', defaultValue: null, group: '基础' },
    ],
  },

  // ============ 武器节点 ============
  weapon: {
    kind: 'weapon',
    label: '武器',
    category: 'core',
    icon: 'Swords',
    color: 'rose',
    description: '自定义武器（剑/斧/弓/弩/三叉戟）',
    defaultSize: { width: 240, height: 220 },
    inputPorts: [
      { id: 'trigger', label: '触发', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [
      { id: 'weapon_out', label: '武器', dataType: 'itemstack', direction: 'output' },
    ],
    supportsSubLogic: true,
    propertiesSchema: [
      { key: 'name', label: '名称', type: 'string', defaultValue: 'New Weapon', group: '基础' },
      { key: 'registryId', label: '注册 ID', type: 'string', defaultValue: 'new_weapon', group: '基础' },
      { key: 'weaponType', label: '武器类型', type: 'select', defaultValue: 'sword', group: '基础', options: [
        { label: '剑 (Sword)', value: 'sword' },
        { label: '斧 (Axe)', value: 'axe' },
        { label: '弓 (Bow)', value: 'bow' },
        { label: '弩 (Crossbow)', value: 'crossbow' },
        { label: '三叉戟 (Trident)', value: 'trident' },
      ]},
      { key: 'attackDamage', label: '攻击伤害', type: 'number', defaultValue: 6, min: 0, max: 100, step: 0.5, group: '战斗' },
      { key: 'attackSpeed', label: '攻击速度', type: 'number', defaultValue: -2.4, min: -4, max: 4, step: 0.1, group: '战斗' },
      { key: 'reachDistance', label: '攻击距离', type: 'number', defaultValue: 3, min: 1, max: 10, step: 0.5, group: '战斗' },
      { key: 'durability', label: '耐久度', type: 'number', defaultValue: 500, min: 1, max: 10000, step: 10, group: '战斗' },
      { key: 'enchantability', label: '附魔等级', type: 'number', defaultValue: 14, min: 0, max: 50, step: 1, group: '战斗' },
      { key: 'repairMaterial', label: '修复材料', type: 'string', defaultValue: 'minecraft:diamond', group: '战斗' },
      { key: 'texture', label: '贴图', type: 'texture', defaultValue: null, group: '基础' },
    ],
  },

  // ============ 食物节点 ============
  food: {
    kind: 'food',
    label: '食物',
    category: 'core',
    icon: 'Apple',
    color: 'amber',
    description: '自定义食物（带饱食度/饱和度/药水效果）',
    defaultSize: { width: 240, height: 200 },
    inputPorts: [
      { id: 'trigger', label: '触发', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [
      { id: 'food_out', label: '食物', dataType: 'itemstack', direction: 'output' },
    ],
    supportsSubLogic: true,
    propertiesSchema: [
      { key: 'name', label: '名称', type: 'string', defaultValue: 'New Food', group: '基础' },
      { key: 'registryId', label: '注册 ID', type: 'string', defaultValue: 'new_food', group: '基础' },
      { key: 'maxStackSize', label: '最大堆叠', type: 'number', defaultValue: 64, min: 1, max: 64, step: 1, group: '基础' },
      { key: 'nutrition', label: '饱食度', type: 'number', defaultValue: 6, min: 0, max: 20, step: 1, group: '食物属性' },
      { key: 'saturation', label: '饱和度', type: 'number', defaultValue: 0.6, min: 0, max: 20, step: 0.1, group: '食物属性' },
      { key: 'canAlwaysEat', label: '总是可吃', type: 'boolean', defaultValue: false, group: '食物属性' },
      { key: 'fastFood', label: '快速食用', type: 'boolean', defaultValue: false, group: '食物属性' },
      { key: 'isMeat', label: '是肉类', type: 'boolean', defaultValue: false, group: '食物属性' },
      { key: 'rarity', label: '稀有度', type: 'select', defaultValue: 'common', group: '基础', options: [
        { label: '普通 (Common)', value: 'common' },
        { label: '罕见 (Uncommon)', value: 'uncommon' },
        { label: '稀有 (Rare)', value: 'rare' },
        { label: '史诗 (Epic)', value: 'epic' },
      ]},
      { key: 'texture', label: '贴图', type: 'texture', defaultValue: null, group: '基础' },
    ],
  },

  // ============ 群系节点 ============
  biome: {
    kind: 'biome',
    label: '群系',
    category: 'core',
    icon: 'Trees',
    color: 'emerald',
    description: '自定义生物群系',
    defaultSize: { width: 260, height: 240 },
    inputPorts: [
      { id: 'trigger', label: '触发', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [
      { id: 'biome_out', label: '群系', dataType: 'entity', direction: 'output' },
    ],
    supportsSubLogic: true,
    propertiesSchema: [
      { key: 'name', label: '名称', type: 'string', defaultValue: 'New Biome', group: '基础' },
      { key: 'registryId', label: '注册 ID', type: 'string', defaultValue: 'new_biome', group: '基础' },
      { key: 'temperature', label: '温度', type: 'number', defaultValue: 0.5, min: -2, max: 2, step: 0.1, group: '气候' },
      { key: 'downfall', label: '降水量', type: 'number', defaultValue: 0.5, min: 0, max: 1, step: 0.1, group: '气候' },
      { key: 'precipitation', label: '降水类型', type: 'select', defaultValue: 'rain', group: '气候', options: [
        { label: '无', value: 'none' },
        { label: '雨', value: 'rain' },
        { label: '雪', value: 'snow' },
      ]},
      { key: 'category', label: '群系类别', type: 'select', defaultValue: 'plains', group: '基础', options: [
        { label: '沙漠 (Desert)', value: 'desert' },
        { label: '森林 (Forest)', value: 'forest' },
        { label: '平原 (Plains)', value: 'plains' },
        { label: '山地 (Mountain)', value: 'mountain' },
        { label: '沼泽 (Swamp)', value: 'swamp' },
        { label: '丛林 (Jungle)', value: 'jungle' },
        { label: '热带草原 (Savanna)', value: 'savanna' },
        { label: '针叶林 (Taiga)', value: 'taiga' },
        { label: '海洋 (Ocean)', value: 'ocean' },
        { label: '海滩 (Beach)', value: 'beach' },
        { label: '河流 (River)', value: 'river' },
        { label: '地下 (Underground)', value: 'underground' },
        { label: '下界 (Nether)', value: 'nether' },
        { label: '末地 (End)', value: 'end' },
      ]},
      { key: 'depth', label: '深度', type: 'number', defaultValue: 0.125, min: -2, max: 2, step: 0.025, group: '地形' },
      { key: 'scale', label: '缩放', type: 'number', defaultValue: 0.05, min: 0, max: 2, step: 0.025, group: '地形' },
      { key: 'waterColor', label: '水颜色', type: 'color', defaultValue: '3F76E4', group: '外观' },
      { key: 'waterFogColor', label: '水雾颜色', type: 'color', defaultValue: '050533', group: '外观' },
      { key: 'foliageColor', label: '树叶颜色', type: 'color', defaultValue: '48B518', group: '外观' },
      { key: 'grassColor', label: '草颜色', type: 'color', defaultValue: '5A7D31', group: '外观' },
    ],
  },

  // ============ 结构节点 ============
  structure: {
    kind: 'structure',
    label: '结构',
    category: 'core',
    icon: 'Castle',
    color: 'violet',
    description: '自定义生成结构（村庄/神庙/要塞等）',
    defaultSize: { width: 260, height: 220 },
    inputPorts: [
      { id: 'trigger', label: '触发', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [
      { id: 'structure_out', label: '结构', dataType: 'entity', direction: 'output' },
    ],
    supportsSubLogic: true,
    propertiesSchema: [
      { key: 'name', label: '名称', type: 'string', defaultValue: 'New Structure', group: '基础' },
      { key: 'registryId', label: '注册 ID', type: 'string', defaultValue: 'new_structure', group: '基础' },
      { key: 'structureType', label: '结构类型', type: 'select', defaultValue: 'village', group: '基础', options: [
        { label: '村庄 (Village)', value: 'village' },
        { label: '神庙 (Temple)', value: 'temple' },
        { label: '要塞 (Stronghold)', value: 'stronghold' },
        { label: '沉船 (Shipwreck)', value: 'shipwreck' },
        { label: '海底废墟 (Ocean Ruin)', value: 'ocean_ruin' },
        { label: '埋藏宝藏 (Buried Treasure)', value: 'buried_treasure' },
        { label: '掠夺者前哨 (Pillager Outpost)', value: 'pillager_outpost' },
        { label: '林地府邸 (Woodland Mansion)', value: 'woodland_mansion' },
        { label: '废弃矿井 (Mineshaft)', value: 'mineshaft' },
        { label: '沙漠神殿 (Desert Pyramid)', value: 'desert_pyramid' },
        { label: '丛林神庙 (Jungle Temple)', value: 'jungle_temple' },
        { label: '雪屋 (Igloo)', value: 'igloo' },
        { label: '废弃传送门 (Ruined Portal)', value: 'ruined_portal' },
        { label: '堡垒遗迹 (Bastion)', value: 'bastion' },
        { label: '末地城 (End City)', value: 'end_city' },
      ]},
      { key: 'biomeList', label: '允许群系', type: 'string', defaultValue: 'minecraft:plains', group: '生成', placeholder: '逗号分隔' },
      { key: 'spawnChance', label: '生成概率', type: 'number', defaultValue: 0.01, min: 0, max: 1, step: 0.005, group: '生成' },
      { key: 'minDistance', label: '最小间距', type: 'number', defaultValue: 32, min: 1, max: 1024, step: 1, group: '生成' },
      { key: 'maxDistance', label: '最大间距', type: 'number', defaultValue: 128, min: 1, max: 4096, step: 1, group: '生成' },
    ],
  },

  // ============ 维度节点 ============
  dimension: {
    kind: 'dimension',
    label: '维度',
    category: 'core',
    icon: 'Globe',
    color: 'teal',
    description: '自定义维度（主世界/下界/末地/自定义）',
    defaultSize: { width: 260, height: 260 },
    inputPorts: [
      { id: 'trigger', label: '触发', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [
      { id: 'dimension_out', label: '维度', dataType: 'entity', direction: 'output' },
    ],
    supportsSubLogic: true,
    propertiesSchema: [
      { key: 'name', label: '名称', type: 'string', defaultValue: 'New Dimension', group: '基础' },
      { key: 'registryId', label: '注册 ID', type: 'string', defaultValue: 'new_dimension', group: '基础' },
      { key: 'dimensionType', label: '维度类型', type: 'select', defaultValue: 'overworld', group: '基础', options: [
        { label: '主世界 (Overworld)', value: 'overworld' },
        { label: '下界 (Nether)', value: 'nether' },
        { label: '末地 (End)', value: 'end' },
        { label: '自定义 (Custom)', value: 'custom' },
      ]},
      { key: 'hasSkyLight', label: '有天顶光', type: 'boolean', defaultValue: true, group: '环境' },
      { key: 'hasCeiling', label: '有顶', type: 'boolean', defaultValue: false, group: '环境' },
      { key: 'ultrawarm', label: '超热', type: 'boolean', defaultValue: false, group: '环境' },
      { key: 'natural', label: '自然', type: 'boolean', defaultValue: true, group: '环境' },
      { key: 'coordinateScale', label: '坐标缩放', type: 'number', defaultValue: 1, min: 0.1, max: 10, step: 0.1, group: '环境' },
      { key: 'height', label: '高度', type: 'number', defaultValue: 384, min: 16, max: 4064, step: 16, group: '环境' },
      { key: 'minY', label: '最低 Y', type: 'number', defaultValue: -64, min: -2032, max: 0, step: 16, group: '环境' },
      { key: 'bedWorks', label: '床可用', type: 'boolean', defaultValue: true, group: '机制' },
      { key: 'piglinSafe', label: '猪灵安全', type: 'boolean', defaultValue: false, group: '机制' },
      { key: 'respawnAnchorWorks', label: '重生锚可用', type: 'boolean', defaultValue: false, group: '机制' },
      { key: 'hasRaids', label: '有袭击', type: 'boolean', defaultValue: true, group: '机制' },
      { key: 'gravity', label: '重力', type: 'number', defaultValue: 0.08, min: 0, max: 1, step: 0.01, group: '物理' },
      { key: 'environment', label: '环境类型', type: 'select', defaultValue: 'normal', group: '环境', options: [
        { label: '普通', value: 'normal' },
        { label: '下界', value: 'nether' },
        { label: '末地', value: 'end' },
      ]},
    ],
  },

  // ============ 药水效果节点 ============
  potion: {
    kind: 'potion',
    label: '药水效果',
    category: 'core',
    icon: 'FlaskConical',
    color: 'pink',
    description: '自定义药水效果（速度/力量/再生等）',
    defaultSize: { width: 240, height: 220 },
    inputPorts: [
      { id: 'trigger', label: '触发', dataType: 'boolean', direction: 'input' },
    ],
    outputPorts: [
      { id: 'potion_out', label: '药水', dataType: 'entity', direction: 'output' },
    ],
    supportsSubLogic: true,
    propertiesSchema: [
      { key: 'name', label: '名称', type: 'string', defaultValue: 'New Effect', group: '基础' },
      { key: 'registryId', label: '注册 ID', type: 'string', defaultValue: 'new_effect', group: '基础' },
      { key: 'effectType', label: '效果类型', type: 'select', defaultValue: 'speed', group: '效果', options: [
        { label: '速度 (Speed)', value: 'speed' },
        { label: '缓慢 (Slowness)', value: 'slowness' },
        { label: '急迫 (Haste)', value: 'haste' },
        { label: '挖掘疲劳 (Mining Fatigue)', value: 'mining_fatigue' },
        { label: '力量 (Strength)', value: 'strength' },
        { label: '瞬间治疗 (Instant Health)', value: 'instant_health' },
        { label: '瞬间伤害 (Instant Damage)', value: 'instant_damage' },
        { label: '跳跃提升 (Jump Boost)', value: 'jump_boost' },
        { label: '反胃 (Nausea)', value: 'nausea' },
        { label: '生命恢复 (Regeneration)', value: 'regeneration' },
        { label: '抗性提升 (Resistance)', value: 'resistance' },
        { label: '防火 (Fire Resistance)', value: 'fire_resistance' },
        { label: '水下呼吸 (Water Breathing)', value: 'water_breathing' },
        { label: '隐身 (Invisibility)', value: 'invisibility' },
        { label: '失明 (Blindness)', value: 'blindness' },
        { label: '夜视 (Night Vision)', value: 'night_vision' },
        { label: '饥饿 (Hunger)', value: 'hunger' },
        { label: '虚弱 (Weakness)', value: 'weakness' },
        { label: '中毒 (Poison)', value: 'poison' },
        { label: '凋零 (Wither)', value: 'wither' },
        { label: '生命提升 (Health Boost)', value: 'health_boost' },
        { label: '吸收 (Absorption)', value: 'absorption' },
        { label: '饱和 (Saturation)', value: 'saturation' },
        { label: '发光 (Glowing)', value: 'glowing' },
        { label: '飘浮 (Levitation)', value: 'levitation' },
        { label: '幸运 (Luck)', value: 'luck' },
        { label: '霉运 (Bad Luck)', value: 'unluck' },
        { label: '缓降 (Slow Falling)', value: 'slow_falling' },
        { label: '潮涌能量 (Conduit Power)', value: 'conduit_power' },
        { label: '海豚恩惠 (Dolphins Grace)', value: 'dolphins_grace' },
        { label: '不祥之兆 (Bad Omen)', value: 'bad_omen' },
        { label: '英雄村庄 (Hero of Village)', value: 'hero_of_the_village' },
      ]},
      { key: 'duration', label: '持续时间 (tick)', type: 'number', defaultValue: 3600, min: 1, max: 72000, step: 20, group: '效果' },
      { key: 'amplifier', label: '效果等级', type: 'number', defaultValue: 0, min: 0, max: 127, step: 1, group: '效果' },
      { key: 'isAmbient', label: '环境效果', type: 'boolean', defaultValue: false, group: '效果' },
      { key: 'isBeneficial', label: '增益效果', type: 'boolean', defaultValue: true, group: '效果' },
      { key: 'color', label: '药水颜色', type: 'color', defaultValue: '820AC', group: '外观' },
      { key: 'hasIcon', label: '显示图标', type: 'boolean', defaultValue: true, group: '外观' },
    ],
  },

  // === 配方节点 ===
  recipe: {
    kind: 'recipe',
    label: '合成配方',
    category: 'advanced',
    color: 'orange',
    icon: 'CookingPot',
    description: '合成台/熔炉配方',
    supportsSubLogic: false,
    inputPorts: [
      { id: 'ingredient_a', label: '材料 A', dataType: 'itemstack' },
      { id: 'ingredient_b', label: '材料 B', dataType: 'itemstack' },
      { id: 'ingredient_c', label: '材料 C', dataType: 'itemstack' },
    ],
    outputPorts: [
      { id: 'result', label: '产物', dataType: 'itemstack' },
    ],
    propertiesSchema: [
      { key: 'name', label: '名称', type: 'string', defaultValue: 'New Recipe', group: '基础', placeholder: '显示名称' },
      { key: 'registryId', label: '注册 ID', type: 'string', defaultValue: 'new_recipe', group: '基础', placeholder: '小写下划线' },
      {
        key: 'recipeType',
        label: '配方类型',
        type: 'select',
        defaultValue: 'crafting',
        group: '基础',
        options: [
          { label: '合成台 (Crafting)', value: 'crafting' },
          { label: '熔炉 (Smelting)', value: 'smelting' },
          { label: '高炉 (Blasting)', value: 'blasting' },
          { label: '烟熏炉 (Smoking)', value: 'smoking' },
          { label: '切石机 (Stonecutting)', value: 'stonecutting' },
        ],
      },
      { key: 'resultItem', label: '产物 ID', type: 'string', defaultValue: 'minecraft:diamond', group: '产物', placeholder: '如 minecraft:diamond' },
      { key: 'resultCount', label: '产物数量', type: 'number', defaultValue: 1, min: 1, max: 64, step: 1, group: '产物' },
      { key: 'ingredientA', label: '材料 A', type: 'string', defaultValue: 'minecraft:stick', group: '材料', placeholder: '物品 ID' },
      { key: 'ingredientB', label: '材料 B', type: 'string', defaultValue: 'minecraft:stick', group: '材料', placeholder: '物品 ID' },
      { key: 'ingredientC', label: '材料 C', type: 'string', defaultValue: '', group: '材料', placeholder: '可选' },
      { key: 'cookingTime', label: '烧制时间 (tick)', type: 'number', defaultValue: 200, min: 1, max: 2000, step: 1, group: '熔炉', description: 'tick' },
      { key: 'experience', label: '经验值', type: 'number', defaultValue: 0.1, min: 0, max: 100, step: 0.1, group: '熔炉' },
    ],
  },

  // === 附魔节点 ===
  enchantment: {
    kind: 'enchantment',
    label: '附魔',
    category: 'advanced',
    color: 'violet',
    icon: 'Sparkles',
    description: '自定义附魔效果',
    supportsSubLogic: false,
    inputPorts: [
      { id: 'trigger', label: '触发', dataType: 'boolean' },
    ],
    outputPorts: [
      { id: 'enchant_out', label: '附魔', dataType: 'any' },
    ],
    propertiesSchema: [
      { key: 'name', label: '名称', type: 'string', defaultValue: 'New Enchantment', group: '基础', placeholder: '显示名称' },
      { key: 'registryId', label: '注册 ID', type: 'string', defaultValue: 'new_enchant', group: '基础', placeholder: '小写下划线' },
      {
        key: 'rarity',
        label: '稀有度',
        type: 'select',
        defaultValue: 'common',
        group: '属性',
        options: [
          { label: '普通', value: 'common' },
          { label: ' uncommon', value: 'uncommon' },
          { label: '稀有', value: 'rare' },
          { label: '史诗', value: 'very_rare' },
        ],
      },
      {
        key: 'category',
        label: '附魔类别',
        type: 'select',
        defaultValue: 'weapon',
        group: '属性',
        options: [
          { label: '武器', value: 'weapon' },
          { label: '盔甲', value: 'armor' },
          { label: '工具', value: 'digger' },
          { label: '弓', value: 'bow' },
          { label: '鱼竿', value: 'fishing_rod' },
          { label: '三叉戟', value: 'trident' },
          { label: '弩', value: 'crossbow' },
        ],
      },
      { key: 'maxLevel', label: '最大等级', type: 'number', defaultValue: 5, min: 1, max: 255, step: 1, group: '属性' },
      { key: 'minCost', label: '最低消耗', type: 'number', defaultValue: 1, min: 1, max: 100, step: 1, group: '属性' },
      { key: 'costPerLevel', label: '每级消耗', type: 'number', defaultValue: 10, min: 1, max: 100, step: 1, group: '属性' },
      { key: 'isTreasure', label: '宝藏附魔', type: 'boolean', defaultValue: false, group: '特殊' },
      { key: 'isCurse', label: '诅咒附魔', type: 'boolean', defaultValue: false, group: '特殊' },
      { key: 'isTradeable', label: '可交易', type: 'boolean', defaultValue: true, group: '特殊' },
      { key: 'isCompatibleWithBooks', label: '附魔书可用', type: 'boolean', defaultValue: true, group: '特殊' },
      { key: 'compatibleItems', label: '额外适用物品', type: 'string', defaultValue: '', group: '兼容', placeholder: 'minecraft:netherite_sword,minecraft:stick' },
      { key: 'incompatibleEnchants', label: '冲突附魔', type: 'string', defaultValue: '', group: '兼容', placeholder: 'minecraft:sharpness,minecraft:smite' },
    ],
  },

  // === 成就节点 ===
  advancement: {
    kind: 'advancement',
    label: '成就',
    category: 'advanced',
    color: 'amber',
    icon: 'Trophy',
    description: '自定义成就/进度',
    supportsSubLogic: false,
    inputPorts: [
      { id: 'trigger', label: '触发', dataType: 'boolean' },
    ],
    outputPorts: [
      { id: 'advancement_out', label: '成就', dataType: 'any' },
    ],
    propertiesSchema: [
      { key: 'name', label: '名称', type: 'string', defaultValue: 'New Advancement', group: '基础', placeholder: '显示名称' },
      { key: 'registryId', label: '注册 ID', type: 'string', defaultValue: 'new_advancement', group: '基础', placeholder: '小写下划线' },
      { key: 'icon', label: '图标物品', type: 'string', defaultValue: 'minecraft:diamond', group: '显示', placeholder: 'minecraft:diamond' },
      { key: 'description', label: '描述', type: 'string', defaultValue: '完成此成就', group: '显示', placeholder: '成就描述' },
      {
        key: 'frame',
        label: '边框样式',
        type: 'select',
        defaultValue: 'task',
        group: '显示',
        options: [
          { label: '普通', value: 'task' },
          { label: '挑战', value: 'challenge' },
          { label: '目标', value: 'goal' },
        ],
      },
      { key: 'showToast', label: '显示提示', type: 'boolean', defaultValue: true, group: '显示' },
      { key: 'announceToChat', label: '聊天公告', type: 'boolean', defaultValue: false, group: '显示' },
      { key: 'hidden', label: '隐藏直到完成', type: 'boolean', defaultValue: false, group: '显示' },
      {
        key: 'triggerType',
        label: '触发类型',
        type: 'select',
        defaultValue: 'inventory_changed',
        group: '触发',
        options: [
          { label: '物品栏变化', value: 'inventory_changed' },
          { label: '击杀实体', value: 'player_killed_entity' },
          { label: '放置方块', value: 'placed_block' },
          { label: '使用物品', value: 'used_item' },
          { label: '进入维度', value: 'changed_dimension' },
          { label: '合成物品', value: 'recipe_crafted' },
        ],
      },
      { key: 'triggerItem', label: '触发物品', type: 'string', defaultValue: 'minecraft:diamond', group: '触发', placeholder: '物品 ID' },
    ],
  },
}

/** 获取节点类型定义（合并插件贡献的自定义类型） */
export function getNodeTypeDefinition(kind: string): NodeTypeDefinition | undefined {
  // 内置类型优先
  const builtin = NODE_TYPE_REGISTRY[kind]
  if (builtin) return builtin
  // 插件贡献的类型
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCustomNodeTypes } = require('@/lib/plugin-system')
    const custom = getCustomNodeTypes()
    return custom[kind]
  } catch {
    return undefined
  }
}

/** 获取所有可创建的节点类型（用于右键菜单，排除纯逻辑子节点） */
export function getCreatableNodeTypes(): NodeTypeDefinition[] {
  const builtin = Object.values(NODE_TYPE_REGISTRY).filter((t) => t.category !== 'logic')
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCustomNodeTypes } = require('@/lib/plugin-system')
    const custom = Object.values(getCustomNodeTypes()).filter((t) => t.category !== 'logic')
    return [...builtin, ...custom]
  } catch {
    return builtin
  }
}

/** 获取所有逻辑子节点类型（用于子图编辑器工具栏） */
export function getLogicNodeTypes(): NodeTypeDefinition[] {
  return Object.values(NODE_TYPE_REGISTRY).filter((t) => t.category === 'logic')
}

/** 按分类获取节点类型（合并插件贡献） */
export function getNodeTypesByCategory(): Record<NodeCategory, NodeTypeDefinition[]> {
  const result: Record<NodeCategory, NodeTypeDefinition[]> = {
    core: [],
    advanced: [],
    logic: [],
  }
  for (const def of Object.values(NODE_TYPE_REGISTRY)) {
    result[def.category].push(def)
  }
  // 合并插件贡献（归入 advanced 分类）
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCustomNodeTypes } = require('@/lib/plugin-system')
    const custom = getCustomNodeTypes()
    for (const def of Object.values(custom)) {
      result[def.category ?? 'advanced'].push(def)
    }
  } catch {
    // 插件系统未加载时忽略
  }
  return result
}
