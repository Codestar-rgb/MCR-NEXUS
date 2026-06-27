/**
 * 节点工厂
 *
 * 提供：
 *   - createDefaultProperties(kind)：根据节点类型的 propertiesSchema 生成默认属性对象
 *   - createNode(kind, position, projectId)：创建一个新节点（用于右键菜单创建）
 *
 * 创建出的节点对象形状与 Prisma Node 模型对齐，
 * 可直接传入 prisma.node.create({ data: ... })。
 */

import { v4 as uuidv4 } from 'uuid'
import { NODE_TYPE_REGISTRY, getNodeTypeDefinition, type NodeKind } from './node-types'
import type { NodeProperties } from './types'

/**
 * 创建新节点的默认 properties（按 propertiesSchema 的 defaultValue 收集）
 *
 * 注意：spec 原写 kind: NodeKind，但 API 路由会在运行时从 body.type 接收任意 string，
 * 因此参数放宽为 NodeKind | string（运行时若 kind 未注册返回空对象，不会抛错）。
 */
export function createDefaultProperties(kind: NodeKind | string): NodeProperties {
  // 使用 getNodeTypeDefinition 以合并插件贡献的类型
  const def = getNodeTypeDefinition(kind)
  if (!def) return {}
  const props: NodeProperties = {}
  for (const schema of def.propertiesSchema) {
    props[schema.key] = schema.defaultValue
  }
  return props
}

/** 创建新节点返回的形状（与 Prisma Node 模型对齐，但不含外键关联字段） */
export interface CreatedNode {
  id: string
  projectId: string
  type: string
  title: string
  positionX: number
  positionY: number
  width: number
  height: number
  color: string
  isCollapsed: boolean
  properties: string
  createdAt: Date
  updatedAt: Date
}

/** 创建新节点（用于右键菜单创建） */
export function createNode(
  kind: NodeKind | string,
  position: { x: number; y: number },
  projectId: string,
): CreatedNode {
  const def = NODE_TYPE_REGISTRY[kind]
  if (!def) throw new Error(`Unknown node kind: ${kind}`)
  const now = new Date()
  return {
    id: uuidv4(),
    projectId,
    type: kind,
    title: def.label,
    positionX: position.x,
    positionY: position.y,
    width: def.defaultSize.width,
    height: def.defaultSize.height,
    color: def.color,
    isCollapsed: false,
    properties: JSON.stringify(createDefaultProperties(kind)),
    createdAt: now,
    updatedAt: now,
  }
}
