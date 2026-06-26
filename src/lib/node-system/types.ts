/**
 * 节点系统类型定义
 *
 * 包含：
 *   - NodeProperties：节点属性（JSON 字符串解析后的键值对）
 *   - FlowNodeData：React Flow 节点的 data 字段
 *   - FlowNode / FlowEdge：React Flow 节点与连线
 *   - prismaNodeToFlowNode / flowNodeToPrismaNode：Prisma ↔ FlowNode 双向转换
 */

/** 节点属性（键值对，存 JSON） */
export type NodeProperties = Record<string, unknown>

/** React Flow 节点 data 字段（运行时） */
export interface FlowNodeData {
  kind: string
  title: string
  properties: NodeProperties
  isCollapsed: boolean
  color?: string
  [key: string]: unknown
}

/** React Flow 节点（@xyflow/react v12） */
export interface FlowNode {
  id: string
  type: string // 节点视觉类型，对应 NODE_TYPE_REGISTRY key
  position: { x: number; y: number }
  data: FlowNodeData
  width?: number
  height?: number
  selected?: boolean
}

/** React Flow 连线 */
export interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle: string | null
  targetHandle: string | null
  data?: {
    dataType: string
  }
}

/** Prisma Node 模型形状（仅转换所需字段，避免依赖 Prisma 类型） */
export interface PrismaNodeShape {
  id: string
  type: string
  title: string
  positionX: number
  positionY: number
  width: number | null
  height: number | null
  color: string | null
  isCollapsed: boolean
  properties: string
}

/** Prisma Node ↔ FlowNode 转换：从 Prisma 模型 → FlowNode */
export function prismaNodeToFlowNode(p: PrismaNodeShape): FlowNode {
  let properties: NodeProperties = {}
  try {
    properties = JSON.parse(p.properties || '{}') as NodeProperties
  } catch {
    // properties 字段不是合法 JSON，降级为空对象
    properties = {}
  }
  return {
    id: p.id,
    type: p.type,
    position: { x: p.positionX, y: p.positionY },
    data: {
      kind: p.type,
      title: p.title,
      properties,
      isCollapsed: p.isCollapsed,
      color: p.color ?? undefined,
    },
    width: p.width ?? undefined,
    height: p.height ?? undefined,
  }
}

/** FlowNode → Prisma Node 写入形状（不含 createdAt/updatedAt，由 Prisma 自动维护） */
export function flowNodeToPrismaNode(f: FlowNode, projectId: string) {
  return {
    id: f.id,
    projectId,
    type: f.data.kind,
    title: f.data.title,
    positionX: f.position.x,
    positionY: f.position.y,
    width: f.width ?? null,
    height: f.height ?? null,
    color: f.data.color ?? null,
    isCollapsed: f.data.isCollapsed ?? false,
    properties: JSON.stringify(f.data.properties ?? {}),
  }
}
