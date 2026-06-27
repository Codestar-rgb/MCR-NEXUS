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
  /**
   * 所属子图 ID（即父节点 ID）。
   * - 主画布节点：subGraphId == null（或 undefined）
   * - 子图节点：subGraphId === 父节点 ID（如某个 entity / block / item 节点的 id）
   * 主画布渲染时会过滤掉 subGraphId 不为空的节点，子图编辑器只显示对应 subGraphId 的节点。
   */
  subGraphId?: string | null
  /**
   * 所属节点组 ID（用于 groupSelected 创建的节点组容器）。
   * - 普通节点：parentId == null
   * - 组内节点：parentId === 组节点 ID
   * 持久化到 Prisma Node.parentId 列。
   */
  parentId?: string | null
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
  /** 所属子图 ID（父节点 ID）—— 子图节点才有值，主画布节点为 null */
  subGraphId?: string | null
  /** 父节点组 ID（用于节点组嵌套，与 subGraphId 不同） */
  parentId?: string | null
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
      // 保留 subGraphId，主画布据此过滤子图节点
      subGraphId: p.subGraphId ?? null,
      // 保留 parentId，用于节点组嵌套渲染
      parentId: p.parentId ?? null,
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
    // 写入 subGraphId（主画布节点为 null，子图节点为父节点 ID）
    subGraphId: f.data.subGraphId ?? null,
    // 写入 parentId（普通节点为 null，组内节点为组节点 ID）
    parentId: f.data.parentId ?? null,
  }
}
