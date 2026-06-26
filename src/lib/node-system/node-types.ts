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
    ],
  },
}

/** 获取节点类型定义 */
export function getNodeTypeDefinition(kind: string): NodeTypeDefinition | undefined {
  return NODE_TYPE_REGISTRY[kind]
}

/** 获取所有可创建的节点类型（用于右键菜单，排除纯逻辑子节点） */
export function getCreatableNodeTypes(): NodeTypeDefinition[] {
  return Object.values(NODE_TYPE_REGISTRY).filter((t) => t.category !== 'logic')
}

/** 按分类获取节点类型 */
export function getNodeTypesByCategory(): Record<NodeCategory, NodeTypeDefinition[]> {
  const result: Record<NodeCategory, NodeTypeDefinition[]> = {
    core: [],
    advanced: [],
    logic: [],
  }
  for (const def of Object.values(NODE_TYPE_REGISTRY)) {
    result[def.category].push(def)
  }
  return result
}
