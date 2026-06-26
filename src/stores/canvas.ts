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

  return {
    id,
    type: def.kind,
    position,
    data: {
      kind: def.kind,
      title: def.label,
      properties: props,
      isCollapsed: false,
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
  selectedEdgeIds: string[]

  /* 右键菜单 */
  contextMenu: CanvasContextMenu | null

  /* 节点组选择（框选中的节点） */
  groupingSelection: string[]

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
  selectedEdgeIds: [],
  contextMenu: null,
  groupingSelection: [],

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

  /* ----- Actions: 持久化 ----- */

  clearCanvas: () =>
    set({
      nodes: [],
      edges: [],
      nodeExtras: {},
      edgeExtras: {},
      selectedNodeIds: [],
      selectedEdgeIds: [],
      groupingSelection: [],
      contextMenu: null,
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
    }),
}))

/* ------------------------------------------------------------------ */
/* 选择器                                                              */
/* ------------------------------------------------------------------ */

export const selectSelectedNode = (s: CanvasState): FlowNode | null =>
  s.nodes.find((n) => n.id === s.selectedNodeIds[0]) ?? null

export const selectNodeCount = (s: CanvasState): number => s.nodes.length
export const selectEdgeCount = (s: CanvasState): number => s.edges.length

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
