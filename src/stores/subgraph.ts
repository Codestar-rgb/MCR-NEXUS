'use client'

/**
 * NexCube 子图状态管理（Task 3-B）
 *
 * 职责：
 *  - 维护当前打开的子图父节点 ID（activeSubgraphNodeId）
 *  - 子图编辑器从中读取需要渲染的节点 / 连线（从主 canvas store 过滤）
 *  - 提供在子图内创建节点 / 连线 / 删除节点等便捷 action
 *
 * 设计决策（重要）：
 *  子图节点不单独存储，而是与主画布节点共享同一个 canvas store。
 *  通过 FlowNode.data.subGraphId 字段区分：
 *    - 主画布节点：data.subGraphId === null / undefined
 *    - 子图节点：data.subGraphId === 父节点 ID（如某个 entity 节点的 id）
 *
 *  优势：
 *   - 持久化复用 useCanvasSync（同一个 /sync API 自动写入 subGraphId 字段）
 *   - 主画布渲染时过滤 subGraphId !== null 即可隐藏子图节点
 *   - 子图编辑器渲染时过滤 subGraphId === activeSubgraphNodeId 即可
 *   - 节点 / 连线 CRUD 无需重复实现，直接调 canvas store action
 *
 *  本 store 只负责：
 *   1. activeSubgraphNodeId 状态
 *   2. createSubFlowNode 工厂（在创建节点时自动注入 subGraphId）
 *   3. 一些便捷选择器（subNodes / subEdges）
 */

import { create } from 'zustand'
import type { XYPosition, Connection } from '@xyflow/react'
import { useCanvasStore } from './canvas'
import {
  getNodeTypeDefinition,
  createDefaultProperties,
  type FlowNode,
  type FlowEdge,
  type NodeKind,
  type PortDataType,
} from '@/lib/node-system'

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

/** 生成简易唯一 ID */
function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return `${prefix}_${time}_${rand}`
}

/**
 * 创建一个子图内的 FlowNode（自动注入 subGraphId = parentNodeId）
 *
 * 与 canvas.ts 的 createFlowNode 类似，但：
 *  - data.subGraphId = parentNodeId
 *  - type 取自 NODE_TYPE_REGISTRY（只能是 logic_* 类型）
 */
export function createSubFlowNode(
  kind: string,
  position: XYPosition,
  parentNodeId: string,
): FlowNode {
  const def = getNodeTypeDefinition(kind)
  if (!def) {
    throw new Error(`Unknown node kind: ${kind}`)
  }

  const id = makeId(`sub_${def.kind}`)
  const props = createDefaultProperties(kind as NodeKind)

  return {
    id,
    type: def.kind,
    position,
    data: {
      kind: def.kind,
      title: def.label,
      properties: props,
      isCollapsed: false,
      // 关键：注入 subGraphId，让主画布过滤、子图编辑器筛选
      subGraphId: parentNodeId,
      // 同时把 properties 展开到 data 顶层（与 createFlowNode 行为一致）
      ...props,
    },
    width: def.defaultSize.width,
    height: def.defaultSize.height,
  }
}

/* ------------------------------------------------------------------ */
/* Store 定义                                                          */
/* ------------------------------------------------------------------ */

export interface SubgraphState {
  /** 当前打开的子图父节点 ID（null 表示未打开子图） */
  activeSubgraphNodeId: string | null

  /* ----- Actions ----- */
  /** 打开某个父节点的子图编辑器 */
  setActiveSubgraph: (nodeId: string | null) => void
  /** 退出子图编辑器 */
  closeSubgraph: () => void

  /** 在当前子图内添加一个 logic_* 节点（自动注入 subGraphId） */
  addSubNode: (kind: string, position: XYPosition) => string | null
  /** 在当前子图内删除节点 */
  removeSubNode: (id: string) => void
  /** 在当前子图内更新节点属性 */
  updateSubNodeData: (id: string, dataUpdates: Record<string, unknown>) => void
  /** 在当前子图内创建连线 */
  addSubEdge: (connection: Connection) => void
  /** 在当前子图内删除连线 */
  removeSubEdge: (id: string) => void
}

export const useSubgraphStore = create<SubgraphState>((set, get) => ({
  activeSubgraphNodeId: null,

  setActiveSubgraph: (nodeId) => set({ activeSubgraphNodeId: nodeId }),

  closeSubgraph: () => set({ activeSubgraphNodeId: null }),

  addSubNode: (kind, position) => {
    const parentNodeId = get().activeSubgraphNodeId
    if (!parentNodeId) return null

    const node = createSubFlowNode(kind, position, parentNodeId)
    useCanvasStore.getState().addNode(node)
    return node.id
  },

  removeSubNode: (id) => {
    useCanvasStore.getState().removeNode(id)
  },

  updateSubNodeData: (id, dataUpdates) => {
    useCanvasStore.getState().updateNodeData(id, dataUpdates)
  },

  addSubEdge: (connection) => {
    if (!connection.source || !connection.target) return

    const canvasState = useCanvasStore.getState()
    const sourceNode = canvasState.nodes.find((n) => n.id === connection.source)
    if (!sourceNode) return

    const sourceDef = getNodeTypeDefinition(sourceNode.data.kind)
    if (!sourceDef) return

    const sourcePort =
      sourceDef.outputPorts.find((p) => p.id === connection.sourceHandle) ??
      sourceDef.outputPorts[0]
    if (!sourcePort) return

    const dataType: PortDataType = sourcePort.dataType
    const newEdge: FlowEdge = {
      id: makeId('sub_e'),
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? sourcePort.id,
      targetHandle: connection.targetHandle ?? null,
      data: { dataType },
    }

    // 复用 canvas store 的 edges 管理（不通过 onConnect 是为了不依赖闭包）
    useCanvasStore.setState((s) => ({ edges: [...s.edges, newEdge] }))
  },

  removeSubEdge: (id) => {
    useCanvasStore.setState((s) => ({
      edges: s.edges.filter((e) => e.id !== id),
      selectedEdgeIds: s.selectedEdgeIds.filter((eid) => eid !== id),
    }))
  },
}))

/* ------------------------------------------------------------------ */
/* 选择器                                                              */
/* ------------------------------------------------------------------ */

/** 选择当前子图的父节点（从主 canvas store 读取） */
export function selectActiveParentNode(): FlowNode | null {
  const parentId = useSubgraphStore.getState().activeSubgraphNodeId
  if (!parentId) return null
  return (
    useCanvasStore.getState().nodes.find((n) => n.id === parentId) ?? null
  )
}

/** 选择当前子图的所有节点（从主 canvas store 过滤） */
export function selectSubNodes(): FlowNode[] {
  const parentId = useSubgraphStore.getState().activeSubgraphNodeId
  if (!parentId) return []
  return useCanvasStore
    .getState()
    .nodes.filter((n) => n.data.subGraphId === parentId)
}

/** 选择当前子图的所有连线（两端节点都在子图内） */
export function selectSubEdges(): FlowEdge[] {
  const parentId = useSubgraphStore.getState().activeSubgraphNodeId
  if (!parentId) return []
  const state = useCanvasStore.getState()
  const subNodeIds = new Set(
    state.nodes.filter((n) => n.data.subGraphId === parentId).map((n) => n.id),
  )
  return state.edges.filter(
    (e) => subNodeIds.has(e.source) && subNodeIds.has(e.target),
  )
}
