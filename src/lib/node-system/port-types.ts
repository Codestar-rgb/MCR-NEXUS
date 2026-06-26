/**
 * 端口数据类型系统
 *
 * NexCube 节点画布上的端口（输入/输出）有 5 种数据类型：
 *   - entity    实体类型引用
 *   - boolean   布尔值
 *   - number    数值（整数/浮点）
 *   - string    字符串
 *   - itemstack 物品堆叠引用
 *
 * 每种类型有：颜色（tailwind 颜色名）、十六进制颜色（端口圆点）、lucide 图标名、中文标签、描述
 * 类型之间有一定的隐式转换关系，由 isPortCompatible 校验
 *
 * Task 2-A 严格按规范落地，禁止 indigo/blue 主色。
 */

/** 端口数据类型枚举（5 种） */
export type PortDataType =
  | 'entity' // 实体类型
  | 'boolean' // 布尔值
  | 'number' // 数值
  | 'string' // 字符串
  | 'itemstack' // 物品堆

/** 端口类型定义 */
export interface PortTypeDefinition {
  type: PortDataType
  label: string // 中文标签
  color: string // tailwind 颜色名（用于边框/背景类名片段，如 'rose'）
  hex: string // 端口圆点的十六进制颜色
  icon: string // lucide 图标名
  description: string
}

/** 端口类型注册表（5 种） */
export const PORT_TYPES: Record<PortDataType, PortTypeDefinition> = {
  entity: {
    type: 'entity',
    label: '实体',
    color: 'rose',
    hex: '#f43f5e',
    icon: 'Boxes',
    description: 'Minecraft 实体类型引用',
  },
  boolean: {
    type: 'boolean',
    label: '布尔',
    color: 'amber',
    hex: '#f59e0b',
    icon: 'ToggleLeft',
    description: 'true / false',
  },
  number: {
    type: 'number',
    label: '数值',
    color: 'cyan',
    hex: '#06b6d4',
    icon: 'Hash',
    description: '整数或浮点数',
  },
  string: {
    type: 'string',
    label: '字符串',
    color: 'emerald',
    hex: '#10b981',
    icon: 'Type',
    description: '文本字符串',
  },
  itemstack: {
    type: 'itemstack',
    label: '物品堆',
    color: 'violet',
    hex: '#8b5cf6',
    icon: 'Package',
    description: '物品堆叠引用',
  },
}

/**
 * 类型兼容性校验：source 类型能否连接到 target 类型
 *
 * 规则（隐式转换矩阵）：
 *   - 同类型：always 兼容
 *   - number → boolean：非0为true
 *   - number → string：数值转字符串
 *   - boolean → string：布尔转字符串
 *   - entity → string：实体ID作为字符串
 *   - itemstack → string：物品堆描述作为字符串
 *
 * 注意：转换是单向的，例如 boolean 不能反向转回 number
 */
export function isPortCompatible(source: PortDataType, target: PortDataType): boolean {
  // 同类型 always 兼容
  if (source === target) return true
  // number → boolean 隐式转换（非0为true）
  if (source === 'number' && target === 'boolean') return true
  // number → string 隐式转换
  if (source === 'number' && target === 'string') return true
  // boolean → string
  if (source === 'boolean' && target === 'string') return true
  // entity → string（实体ID作为字符串）
  if (source === 'entity' && target === 'string') return true
  // itemstack → string
  if (source === 'itemstack' && target === 'string') return true
  // entity/itemstack → boolean（存在即触发）
  if ((source === 'entity' || source === 'itemstack') && target === 'boolean') return true
  // any → boolean（万能触发）
  if (source === 'any' && target === 'boolean') return true
  return false
}

/** 端口定义（节点上的输入/输出端口） */
export interface PortDefinition {
  id: string // 端口唯一 ID（节点内唯一）
  label: string // 端口标签
  dataType: PortDataType
  direction: 'input' | 'output'
  required?: boolean
  defaultValue?: unknown
}
