'use client'

/**
 * NexCube 节点画布状态管理（Task 2-C）
 *
 * 职责：
 *  - 维护节点 / 连线数组（驱动 React Flow v12）
 *  - 维护选中状态（节点 ID / 连线 ID，支持多选）
 *  - 维护右键上下文菜单（坐标 / 可见性 / 目标节点 ID）
 *  - 维护框选中的节点（用于"打包为组"）
 *  - 节点 CRUD：addNode / updateNode / removeNode / cloneNode
 *  - 连线 CRUD：onConnect（含端口类型校验由调用方处理）/ removeEdge
 *  - 节点组：groupSelected / ungroupNode / toggleNodeCollapsed
 *  - 持久化接口：loadFromProject / clearCanvas
 *
 * 与 Task 2-A 的 node-system 集成：
 *  - FlowNode / FlowEdge / getNodeTypeDefinition / isPortCompatible 等
 *    都从 @/lib/node-system 导入
 *  - 本文件附加 createFlowNode 工厂（Task 2-A 的 createNode 返回 Prisma 形状，
 *    这里转换为 FlowNode + 把 properties 展开到 data 顶层，兼容老卡片组件）
 *  - getNodeColorHex：把 NODE_TYPE_REGISTRY[kind].color（tailwind 色名）映射为 hex
 */

import { create } from 'zustand'
import type {
  NodeChange,
  EdgeChange,
  Connection,
  XYPosition,
  Node as RFNode,
  Edge as RFEdge,
} from '@xyflow/react'
import {
  getNodeTypeDefinition,
  isPortCompatible,
  createDefaultProperties,
  PORT_TYPES,
  type FlowNode,
  type FlowEdge,
  type NodeKind,
  type PortDataType,
} from '@/lib/node-system'

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

/** Tailwind 色名 → hex 映射（与 base-node-card.tsx 的 COLOR_CLASSES 对齐） */
const TAILWIND_COLOR_HEX: Record<string, string> = {
  rose: '#f43f5e',
  amber: '#f59e0b',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  emerald: '#10b981',
  violet: '#8b5cf6',
  pink: '#ec4899',
  slate: '#64748b',
  zinc: '#71717a',
}

/** 根据 kind 获取 hex 主题色（用于 MiniMap 着色） */
export function getNodeColorHex(kind: string): string {
  const def = getNodeTypeDefinition(kind)
  if (!def) return '#71717a'
  return TAILWIND_COLOR_HEX[def.color] ?? '#71717a'
}

/** 生成简易唯一 ID（不依赖 uuid 以减小体积） */
function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return `${prefix}_${time}_${rand}`
}

/**
 * FlowNode 工厂：根据 kind 在指定坐标创建一个新节点。
 *
 * 与 Task 2-A 的 createNode 不同：
 *  - 返回 FlowNode（含 data/position），可直接加入 React Flow nodes 数组
 *  - 把 propertiesSchema 的 defaultValue 收集到 data.properties
 *  - 同时把 properties 展开到 data 顶层（兼容老卡片组件直接读 data.health 等）
 */
export function createFlowNode(kind: string, position: XYPosition): FlowNode {
  const def = getNodeTypeDefinition(kind)
  if (!def) {
    throw new Error(`Unknown node kind: ${kind}`)
  }

  const id = makeId(def.kind)
  const props = createDefaultProperties(kind as NodeKind)
  // 从 store 获取当前工作区 ID，确保新节点属于当前工作区
  const activeWorkspaceId = (useCanvasStore as any).getState?.()?.activeWorkspaceId ?? null

  return {
    id,
    type: def.kind,
    position,
    data: {
      kind: def.kind,
      title: def.label,
      properties: props,
      isCollapsed: false,
      subGraphId: activeWorkspaceId,
      // 同时把 properties 展开到 data 顶层，兼容老卡片组件
      ...props,
    },
    width: def.defaultSize.width,
    height: def.defaultSize.height,
  }
}

/**
 * 复制一个已有节点（深拷贝 data + 新 ID + 偏移位置）。
 */
export function cloneFlowNode(node: FlowNode, offset = { x: 40, y: 40 }): FlowNode {
  const id = makeId(node.data.kind)
  return {
    ...node,
    id,
    position: { x: node.position.x + offset.x, y: node.position.y + offset.y },
    data: {
      ...node.data,
      title: `${node.data.title} 副本`,
      // 老卡片字段同步
      ...(typeof node.data.name === 'string'
        ? { name: `${node.data.name} 副本` }
        : {}),
    },
    selected: false,
  }
}

/** 计算一组节点的包围盒 */
function computeBounds(nodes: FlowNode[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} | null {
  if (nodes.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const n of nodes) {
    const w = n.width ?? 240
    const h = n.height ?? 200
    minX = Math.min(minX, n.position.x)
    minY = Math.min(minY, n.position.y)
    maxX = Math.max(maxX, n.position.x + w)
    maxY = Math.max(maxY, n.position.y + h)
  }
  return { minX, minY, maxX, maxY }
}

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

export interface CanvasContextMenu {
  x: number
  y: number
  visible: boolean
  /** 右键目标节点 ID（空白右键时为 undefined） */
  nodeId?: string
  /** 屏幕坐标 → 画布坐标（用于在右键位置创建节点） */
  canvasPosition?: XYPosition
}

export interface CanvasState {
  /* 数据 */
  nodes: FlowNode[]
  edges: FlowEdge[]
  /** React Flow 内部维护的 node 附加字段（dragging / parentId / style 等） */
  nodeExtras: Record<string, Partial<RFNode>>
  edgeExtras: Record<string, Partial<RFEdge>>

  /* 视图状态 */
  isInitialized: boolean

  /* 选中 */
  selectedNodeIds: string[]
  /** 当前激活的工作区 ID（用于过滤画布节点） */
  activeWorkspaceId: string | null
  selectedEdgeIds: string[]

  /* 右键菜单 */
  contextMenu: CanvasContextMenu | null

  /* 节点组选择（框选中的节点） */
  groupingSelection: string[]

  /* 函数节点详情视图：当前打开的函数节点 ID（双击打开） */
  openedFunctionNodeId: string | null

  /** "封装为函数"对话框打开状态（由右键菜单或浮动按钮触发） */
  encapsulatorDialogOpen: boolean

  /* ----- Actions: 数据 ----- */
  setNodes: (nodes: FlowNode[]) => void
  setEdges: (edges: FlowEdge[]) => void
  addNode: (node: FlowNode) => void
  addNodes: (nodes: FlowNode[]) => void
  updateNode: (id: string, updates: Partial<FlowNode>) => void
  updateNodeData: (id: string, dataUpdates: Record<string, unknown>) => void
  removeNode: (id: string) => void
  removeNodes: (ids: string[]) => void
  cloneNodeById: (id: string) => void
  applyNodeChanges: (changes: NodeChange[]) => void
  applyEdgeChanges: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void

  /* ----- Actions: 选中 ----- */
  selectNode: (id: string | null) => void
  /** 切换当前工作区（影响画布节点过滤） */
  setActiveWorkspace: (id: string | null) => void
  toggleNodeSelection: (id: string) => void
  setSelectedNodes: (ids: string[]) => void
  setSelectedEdges: (ids: string[]) => void
  clearSelection: () => void

  /* ----- Actions: 折叠 ----- */
  toggleNodeCollapsed: (id: string) => void

  /* ----- Actions: 右键菜单 ----- */
  setContextMenu: (menu: CanvasContextMenu | null) => void
  closeContextMenu: () => void

  /* ----- Actions: 节点组 ----- */
  setGroupingSelection: (ids: string[]) => void
  groupSelected: (name: string, color: string) => string | null
  ungroupNode: (groupId: string) => void

  /* ----- Actions: 函数节点封装 ----- */
  encapsulateToFunction: (
    name: string,
    color: string,
    nodeIds: string[],
  ) => string | null
  /** 双击函数节点 → 打开详情视图 */
  openFunctionDetail: (functionNodeId: string) => void
  closeFunctionDetail: () => void
  /** 打开"封装为函数"对话框 */
  openEncapsulatorDialog: () => void
  /** 关闭"封装为函数"对话框 */
  closeEncapsulatorDialog: () => void

  /* ----- Actions: 持久化 ----- */
  clearCanvas: () => void
  loadFromProject: (nodes: FlowNode[], edges: FlowEdge[]) => void
}

/* ------------------------------------------------------------------ */
/* Store                                                                */
/* ------------------------------------------------------------------ */

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  nodeExtras: {},
  edgeExtras: {},
  isInitialized: false,
  selectedNodeIds: [],
  activeWorkspaceId: null,
  selectedEdgeIds: [],
  contextMenu: null,
  groupingSelection: [],
  openedFunctionNodeId: null,
  encapsulatorDialogOpen: false,

  /* ----- Actions: 数据 ----- */

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),

  addNodes: (newNodes) => set((s) => ({ nodes: [...s.nodes, ...newNodes] })),

  updateNode: (id, updates) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              ...updates,
              data: updates.data
                ? { ...n.data, ...(updates.data as object) }
                : n.data,
            }
          : n,
      ),
    })),

  updateNodeData: (id, dataUpdates) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...dataUpdates } } : n,
      ),
    })),

  removeNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeIds: s.selectedNodeIds.filter((nid) => nid !== id),
      groupingSelection: s.groupingSelection.filter((nid) => nid !== id),
    })),

  removeNodes: (ids) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => !ids.includes(n.id)),
      edges: s.edges.filter(
        (e) => !ids.includes(e.source) && !ids.includes(e.target),
      ),
      selectedNodeIds: s.selectedNodeIds.filter((nid) => !ids.includes(nid)),
      groupingSelection: s.groupingSelection.filter(
        (nid) => !ids.includes(nid),
      ),
    })),

  cloneNodeById: (id) => {
    const { nodes } = get()
    const original = nodes.find((n) => n.id === id)
    if (!original) return
    const cloned = cloneFlowNode(original)
    set((s) => ({ nodes: [...s.nodes, cloned] }))
  },

  applyNodeChanges: (changes) =>
    set((s) => {
      let nodes = s.nodes
      let selectedNodeIds = s.selectedNodeIds
      let groupingSelection = s.groupingSelection
      let mutated = false

      for (const change of changes) {
        switch (change.type) {
          case 'position': {
            if (change.position) {
              const next = nodes.map((n) =>
                n.id === change.id
                  ? {
                      ...n,
                      position: change.position!,
                    }
                  : n,
              )
              nodes = next
              mutated = true
            }
            break
          }
          case 'remove': {
            nodes = nodes.filter((n) => n.id !== change.id)
            selectedNodeIds = selectedNodeIds.filter((nid) => nid !== change.id)
            groupingSelection = groupingSelection.filter(
              (nid) => nid !== change.id,
            )
            mutated = true
            break
          }
          case 'select': {
            if (change.selected) {
              if (!selectedNodeIds.includes(change.id)) {
                selectedNodeIds = [...selectedNodeIds, change.id]
                mutated = true
              }
            } else {
              const next = selectedNodeIds.filter((nid) => nid !== change.id)
              if (next.length !== selectedNodeIds.length) {
                selectedNodeIds = next
                mutated = true
              }
            }
            break
          }
          case 'dimensions': {
            if (change.dimensions) {
              const next = nodes.map((n) =>
                n.id === change.id
                  ? {
                      ...n,
                      width: change.dimensions!.width,
                      height: change.dimensions!.height,
                    }
                  : n,
              )
              nodes = next
              mutated = true
            }
            break
          }
          default:
            break
        }
      }

      if (!mutated) return s
      return { nodes, selectedNodeIds, groupingSelection }
    }),

  applyEdgeChanges: (changes) =>
    set((s) => {
      let edges = s.edges
      let selectedEdgeIds = s.selectedEdgeIds
      let mutated = false

      for (const change of changes) {
        switch (change.type) {
          case 'remove': {
            edges = edges.filter((e) => e.id !== change.id)
            selectedEdgeIds = selectedEdgeIds.filter((eid) => eid !== change.id)
            mutated = true
            break
          }
          case 'select': {
            if (change.selected) {
              if (!selectedEdgeIds.includes(change.id)) {
                selectedEdgeIds = [...selectedEdgeIds, change.id]
                mutated = true
              }
            } else {
              const next = selectedEdgeIds.filter((eid) => eid !== change.id)
              if (next.length !== selectedEdgeIds.length) {
                selectedEdgeIds = next
                mutated = true
              }
            }
            break
          }
          default:
            break
        }
      }

      if (!mutated) return s
      return { edges, selectedEdgeIds }
    }),

  onConnect: (connection) =>
    set((s) => {
      if (!connection.source || !connection.target) return s
      const sourceNode = s.nodes.find((n) => n.id === connection.source)
      if (!sourceNode) return s

      const sourceDef = getNodeTypeDefinition(sourceNode.data.kind)
      if (!sourceDef) return s

      const sourcePort =
        sourceDef.outputPorts.find((p) => p.id === connection.sourceHandle) ??
        sourceDef.outputPorts[0]
      if (!sourcePort) return s

      const dataType: PortDataType = sourcePort.dataType
      const newEdge: FlowEdge = {
        id: makeId('e'),
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? sourcePort.id,
        targetHandle: connection.targetHandle ?? null,
        data: { dataType },
      }
      return { edges: [...s.edges, newEdge] }
    }),

  /* ----- Actions: 选中 ----- */

  selectNode: (id) =>
    set({ selectedNodeIds: id ? [id] : [], selectedEdgeIds: [] }),

  setActiveWorkspace: (id) =>
    set({ activeWorkspaceId: id, selectedNodeIds: [], selectedEdgeIds: [] }),

  toggleNodeSelection: (id) =>
    set((s) => ({
      selectedNodeIds: s.selectedNodeIds.includes(id)
        ? s.selectedNodeIds.filter((nid) => nid !== id)
        : [...s.selectedNodeIds, id],
    })),

  setSelectedNodes: (ids) => set({ selectedNodeIds: ids, selectedEdgeIds: [] }),
  setSelectedEdges: (ids) => set({ selectedEdgeIds: ids }),

  clearSelection: () => set({ selectedNodeIds: [], selectedEdgeIds: [] }),

  /* ----- Actions: 折叠 ----- */

  toggleNodeCollapsed: (id) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...n.data,
                isCollapsed: !n.data.isCollapsed,
              },
            }
          : n,
      ),
    })),

  /* ----- Actions: 右键菜单 ----- */

  setContextMenu: (menu) => set({ contextMenu: menu }),

  closeContextMenu: () => set({ contextMenu: null }),

  /* ----- Actions: 节点组 ----- */

  setGroupingSelection: (ids) => set({ groupingSelection: ids }),

  groupSelected: (name, color) => {
    const { nodes, groupingSelection } = get()
    if (groupingSelection.length === 0) return null

    const selectedNodes = nodes.filter((n) => groupingSelection.includes(n.id))
    const bounds = computeBounds(selectedNodes)
    if (!bounds) return null

    const groupId = makeId('group')
    const { minX, minY, maxX, maxY } = bounds
    const groupWidth = maxX - minX + 40
    const groupHeight = maxY - minY + 60

    const groupNode: FlowNode = {
      id: groupId,
      type: 'group',
      position: { x: minX - 20, y: minY - 40 },
      data: {
        kind: 'group',
        title: name || '节点组',
        color,
        isCollapsed: false,
        properties: { color },
      },
      width: groupWidth,
      height: groupHeight,
    }

    // 把选中节点记入 nodeExtras.parentId（React Flow v12 支持）
    const nodeExtras = { ...get().nodeExtras }
    for (const id of groupingSelection) {
      nodeExtras[id] = { ...nodeExtras[id], parentId: groupId }
    }

    set({
      nodes: [groupNode, ...nodes],
      nodeExtras,
      groupingSelection: [],
      selectedNodeIds: [groupId],
    })

    return groupId
  },

  ungroupNode: (groupId) =>
    set((s) => {
      const nodeExtras = { ...s.nodeExtras }
      for (const id of Object.keys(nodeExtras)) {
        if (nodeExtras[id]?.parentId === groupId) {
          nodeExtras[id] = { ...nodeExtras[id], parentId: undefined }
        }
      }
      return {
        nodes: s.nodes.filter((n) => n.id !== groupId),
        nodeExtras,
      }
    }),

  /* ----- Actions: 函数节点封装 ----- */

  /**
   * 把多个选中节点封装为一个新的函数节点。
   *
   * 步骤：
   *   1. 计算选中节点包围盒，确定函数节点位置
   *   2. 推断函数节点的输入/输出端口（来自选中节点上"未被内部连线占用"的端口）
   *   3. 创建 function 节点（kind='function'），把端口定义存入 properties
   *   4. 把选中节点的 data.subGraphId 设为新函数节点的 ID（主画布将过滤这些节点）
   *   5. 选中态切换为新建的函数节点
   *
   * 返回新函数节点 ID；失败（无选中节点）返回 null。
   */
  encapsulateToFunction: (name, color, nodeIds) => {
    const { nodes, edges } = get()
    if (nodeIds.length === 0) return null

    const selectedNodes = nodes.filter((n) => nodeIds.includes(n.id))
    if (selectedNodes.length === 0) return null

    // 1) 计算包围盒
    const bounds = computeBounds(selectedNodes)
    if (!bounds) return null
    const { minX, minY, maxX } = bounds
    const centerX = (minX + maxX) / 2

    const functionNodeId = makeId('function')

    // 2) 推断端口：
    //    - 内部连线：source 和 target 都在选中集合内的边（这些边属于函数内部，无需暴露）
    //    - 输入端口：选中节点上的 input port，如果有外部连线指向它 → 暴露为函数输入
    //    - 输出端口：选中节点上的 output port，如果它有连线指向外部节点 → 暴露为函数输出
    const selectedIdSet = new Set(nodeIds)

    // 收集外部入口边（外部 → 选中节点）
    const incomingExternalEdges = edges.filter(
      (e) => !selectedIdSet.has(e.source) && selectedIdSet.has(e.target),
    )
    // 收集外部出口边（选中节点 → 外部）
    const outgoingExternalEdges = edges.filter(
      (e) => selectedIdSet.has(e.source) && !selectedIdSet.has(e.target),
    )

    // 推断输入端口（去重 by target node + target port）
    const inputPortKeys = new Set<string>()
    const inputPorts: Array<{
      id: string
      label: string
      dataType: string
      direction: 'input'
    }> = []
    for (const edge of incomingExternalEdges) {
      const key = `${edge.target}:${edge.targetHandle ?? ''}`
      if (inputPortKeys.has(key)) continue
      inputPortKeys.add(key)
      const targetNode = nodes.find((n) => n.id === edge.target)
      if (!targetNode) continue
      const targetDef = getNodeTypeDefinition(targetNode.data.kind)
      const targetPort = targetDef?.inputPorts.find(
        (p) => p.id === edge.targetHandle,
      )
      const label = targetNode.data.title
        ? `${String(targetNode.data.title).slice(0, 8)}.${targetPort?.label ?? 'in'}`
        : targetPort?.label ?? 'in'
      const dataType = targetPort?.dataType ?? 'string'
      inputPorts.push({
        id: `in_${inputPorts.length + 1}`,
        label,
        dataType,
        direction: 'input',
      })
    }
    // 至少保留 1 个调用端口
    if (inputPorts.length === 0) {
      inputPorts.push({
        id: 'call',
        label: '调用',
        dataType: 'boolean',
        direction: 'input',
      })
    }

    // 推断输出端口
    const outputPortKeys = new Set<string>()
    const outputPorts: Array<{
      id: string
      label: string
      dataType: string
      direction: 'output'
    }> = []
    for (const edge of outgoingExternalEdges) {
      const key = `${edge.source}:${edge.sourceHandle ?? ''}`
      if (outputPortKeys.has(key)) continue
      outputPortKeys.add(key)
      const sourceNode = nodes.find((n) => n.id === edge.source)
      if (!sourceNode) continue
      const sourceDef = getNodeTypeDefinition(sourceNode.data.kind)
      const sourcePort = sourceDef?.outputPorts.find(
        (p) => p.id === edge.sourceHandle,
      )
      const label = sourceNode.data.title
        ? `${String(sourceNode.data.title).slice(0, 8)}.${sourcePort?.label ?? 'out'}`
        : sourcePort?.label ?? 'out'
      const dataType = sourcePort?.dataType ?? 'string'
      outputPorts.push({
        id: `out_${outputPorts.length + 1}`,
        label,
        dataType,
        direction: 'output',
      })
    }
    if (outputPorts.length === 0) {
      outputPorts.push({
        id: 'return',
        label: '返回',
        dataType: 'string',
        direction: 'output',
      })
    }

    // 3) 创建函数节点
    const functionNode: FlowNode = {
      id: functionNodeId,
      type: 'function',
      position: { x: centerX - 110, y: minY - 80 },
      data: {
        kind: 'function',
        title: name || '函数节点',
        properties: {
          name: name || 'myFunction',
          color,
          functionName: name || 'myFunction',
          inputPorts,
          outputPorts,
          encapsulatedNodeIds: nodeIds,
        },
        isCollapsed: false,
        color,
        subGraphId: null,
      },
      width: 220,
      height: 140,
    }

    // 4) 把选中节点的 subGraphId 设置为新函数节点 ID
    //    同时清除它们的 selected 标记（避免出现在 selectedNodeIds）
    const updatedNodes = nodes.map((n) => {
      if (!selectedIdSet.has(n.id)) return n
      return {
        ...n,
        data: { ...n.data, subGraphId: functionNodeId },
        selected: false,
      }
    })

    // 5) 切换选中态到函数节点
    set({
      nodes: [functionNode, ...updatedNodes],
      selectedNodeIds: [functionNodeId],
      groupingSelection: [],
    })

    return functionNodeId
  },

  openFunctionDetail: (functionNodeId) =>
    set({ openedFunctionNodeId: functionNodeId }),

  closeFunctionDetail: () => set({ openedFunctionNodeId: null }),

  openEncapsulatorDialog: () => set({ encapsulatorDialogOpen: true }),

  closeEncapsulatorDialog: () => set({ encapsulatorDialogOpen: false }),

  /* ----- Actions: 持久化 ----- */

  clearCanvas: () =>
    set({
      nodes: [],
      edges: [],
      nodeExtras: {},
      edgeExtras: {},
      isInitialized: false,
      selectedNodeIds: [],
      selectedEdgeIds: [],
      groupingSelection: [],
      contextMenu: null,
      openedFunctionNodeId: null,
      encapsulatorDialogOpen: false,
    }),

  loadFromProject: (nodes, edges) =>
    set({
      nodes,
      edges,
      nodeExtras: {},
      edgeExtras: {},
      isInitialized: true,
      selectedNodeIds: [],
      selectedEdgeIds: [],
      groupingSelection: [],
      contextMenu: null,
      openedFunctionNodeId: null,
      encapsulatorDialogOpen: false,
    }),
}))

/* ------------------------------------------------------------------ */
/* 选择器                                                              */
/* ------------------------------------------------------------------ */

export const selectSelectedNode = (s: CanvasState): FlowNode | null =>
  s.nodes.find((n) => n.id === s.selectedNodeIds[0]) ?? null

export const selectNodeCount = (s: CanvasState): number => s.nodes.length
export const selectEdgeCount = (s: CanvasState): number => s.edges.length

/** 主画布可见节点：subGraphId 为空的节点（即不属于任何函数节点内部） */
export const selectRootNodes = (s: CanvasState): FlowNode[] =>
  s.nodes.filter((n) => !n.data.subGraphId)

/** 函数节点内部子节点：subGraphId === functionNodeId */
export const selectFunctionChildren = (
  s: CanvasState,
  functionNodeId: string,
): FlowNode[] =>
  s.nodes.filter((n) => n.data.subGraphId === functionNodeId)

/** 调试断点节点：所有 kind === 'debug_breakpoint' 的节点 */
export const selectBreakpointNodes = (s: CanvasState): FlowNode[] =>
  s.nodes.filter((n) => n.data.kind === 'debug_breakpoint')

/* ------------------------------------------------------------------ */
/* 默认初始节点（用于空画布演示）                                       */
/* ------------------------------------------------------------------ */

export function createDefaultNodes(): FlowNode[] {
  return [
    {
      id: 'item-ruby',
      type: 'item',
      position: { x: 80, y: 80 },
      data: {
        kind: 'item',
        title: 'Ruby',
        properties: {
          name: 'Ruby',
          registryId: 'nexcube:ruby',
          maxStackSize: 64,
          rarity: 'uncommon',
          useCooldown: 0,
          isFood: false,
          nutrition: 0,
          saturation: 0,
        },
        isCollapsed: false,
        // 顶层字段（兼容老卡片）
        name: 'Ruby',
        registryId: 'nexcube:ruby',
        maxStackSize: 64,
        rarity: 'uncommon',
        cooldown: 0,
        isFood: false,
        hunger: 0,
        saturation: 0,
      },
      width: 240,
      height: 200,
    },
    {
      id: 'block-ruby',
      type: 'block',
      position: { x: 420, y: 220 },
      data: {
        kind: 'block',
        title: 'RubyBlock',
        properties: {
          name: 'RubyBlock',
          registryId: 'nexcube:ruby_block',
          hardness: 5.0,
          resistance: 6.0,
          lightLevel: 7,
          harvestTool: 'pickaxe',
          harvestLevel: 2,
          isTransparent: false,
          isSolid: true,
          dropItem: 'self',
          dropCount: 1,
        },
        isCollapsed: false,
        name: 'RubyBlock',
        registryId: 'nexcube:ruby_block',
        hardness: 5.0,
        resistance: 6.0,
        lightLevel: 7,
        harvestTool: 'pickaxe',
        harvestLevel: 'iron',
        isTransparent: false,
        isSolid: true,
        dropItem: 'nexcube:ruby',
        dropCount: 1,
      },
      width: 240,
      height: 200,
    },
    {
      id: 'entity-ruby-golem',
      type: 'entity',
      position: { x: 760, y: 60 },
      data: {
        kind: 'entity',
        title: 'RubyGolem',
        properties: {
          name: 'RubyGolem',
          registryId: 'nexcube:ruby_golem',
          health: 100,
          attack: 18,
          armor: 12,
          armorToughness: 4,
          movementSpeed: 0.25,
          mobCategory: 'creature',
          aiType: 'melee',
        },
        isCollapsed: false,
        name: 'RubyGolem',
        registryId: 'nexcube:ruby_golem',
        health: 100,
        attack: 18,
        armor: 12,
        armorToughness: 4,
        movementSpeed: 0.25,
        creatureType: 'normal',
        aiType: 'melee',
      },
      width: 240,
      height: 200,
    },
  ]
}

export function createDefaultEdges(): FlowEdge[] {
  return [
    {
      id: 'e-ruby-to-ruby-block',
      source: 'item-ruby',
      target: 'block-ruby',
      sourceHandle: 'item_out',
      targetHandle: 'trigger',
      data: { dataType: 'itemstack' },
    },
    {
      id: 'e-ruby-block-to-golem',
      source: 'block-ruby',
      target: 'entity-ruby-golem',
      sourceHandle: 'block_out',
      targetHandle: 'trigger',
      data: { dataType: 'itemstack' },
    },
  ]
}

// 暴露 PORT_TYPES 给消费方（便于类型推断）
export { PORT_TYPES }
