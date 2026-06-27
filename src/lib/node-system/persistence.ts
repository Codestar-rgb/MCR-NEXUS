/**
 * 节点/连线持久化转换辅助
 *
 * Task 2-A / 2-C 的 node-system 模块已在 types.ts 提供了
 * `flowNodeToPrismaNode` / `prismaNodeToFlowNode`，但仅覆盖核心字段。
 * 本文件补充：
 *  - PrismaNodeDTO / PrismaConnectionDTO（完整的传输类型，含可选字段）
 *  - flowEdgeToPrismaConnection / prismaConnectionToFlowEdge（连线转换）
 *
 * 这些函数被 sync API 与 useCanvasSync hook 共享。
 */

import type { Edge } from '@xyflow/react'
import type { FlowEdge } from './types'

/** Prisma Node 模型的完整传输对象（含可选字段） */
export interface PrismaNodeDTO {
  id: string
  projectId: string
  type: string
  title: string
  positionX: number
  positionY: number
  width?: number | null
  height?: number | null
  color?: string | null
  isCollapsed: boolean
  parentId?: string | null
  subGraphId?: string | null
  properties: string // JSON string
  sourceCode?: string | null
  linkedFile?: string | null
  linkedLine?: number | null
  createdAt?: string
  updatedAt?: string
}

/** Prisma Connection 模型的完整传输对象 */
export interface PrismaConnectionDTO {
  id: string
  projectId: string
  sourceNodeId: string
  targetNodeId: string
  sourcePort: string
  targetPort: string
  dataType: string
  createdAt?: string
}

/**
 * FlowEdge → Prisma Connection DTO
 * edge.data?.dataType 决定 dataType 字段；缺失时默认 'any'
 */
export function flowEdgeToPrismaConnection(
  edge: Edge | FlowEdge,
  projectId: string,
): PrismaConnectionDTO {
  const data = (edge.data ?? {}) as { dataType?: string }
  return {
    id: edge.id,
    projectId,
    sourceNodeId: edge.source,
    targetNodeId: edge.target,
    sourcePort: edge.sourceHandle ?? '',
    targetPort: edge.targetHandle ?? '',
    dataType: data.dataType ?? 'any',
  }
}

/**
 * Prisma Connection DTO → FlowEdge
 */
export function prismaConnectionToFlowEdge(c: PrismaConnectionDTO): FlowEdge {
  return {
    id: c.id,
    source: c.sourceNodeId,
    target: c.targetNodeId,
    sourceHandle: c.sourcePort || null,
    targetHandle: c.targetPort || null,
    data: { dataType: c.dataType },
  } as unknown as FlowEdge
}
