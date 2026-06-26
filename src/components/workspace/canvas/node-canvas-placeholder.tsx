'use client'

/**
 * 节点画布占位（React Flow v12）
 *
 * 阶段 1 占位：
 * - 3 个 mock 节点（实体 RubyGolem / 方块 RubyBlock / 物品 Ruby）
 * - 2 条连线（物品→方块→实体，表示"掉落物"关系）
 * - 启用 minimap / controls / 点阵 background
 * - 支持拖拽 / 缩放 / 平移
 *
 * 阶段 2 将替换为真实数据驱动 + 节点 CRUD + 连线规则校验。
 *
 * 同时浮动画布左上角的 ProjectInfoCard 与右上角的 TaskNotifications。
 * 浮动容器使用 pointer-events-none，仅子卡片 pointer-events-auto，
 * 保证画布拖拽/平移不被遮挡。
 */

import '@xyflow/react/dist/style.css'

import { useCallback, useMemo, type Node, type Edge } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import { useWorkspaceStore } from '@/stores/workspace'
import { EntityNodeCard, type EntityNodeData } from './nodes/entity-node-card'
import { BlockNodeCard, type BlockNodeData } from './nodes/block-node-card'
import { ItemNodeCard, type ItemNodeData } from './nodes/item-node-card'
import { ProjectInfoCard } from './project-info-card'
import { TaskNotifications } from './task-notifications'

/** 画布初始 mock 节点 */
const initialNodes: Node[] = [
  {
    id: 'item-ruby',
    type: 'item',
    position: { x: 80, y: 80 },
    data: {
      name: 'Ruby',
      registryId: 'nexcube:ruby',
      maxStack: 64,
      rarity: 'uncommon',
      cooldown: 0,
    } satisfies ItemNodeData,
  },
  {
    id: 'block-ruby',
    type: 'block',
    position: { x: 420, y: 220 },
    data: {
      name: 'RubyBlock',
      registryId: 'nexcube:ruby_block',
      hardness: 5.0,
      resistance: 6.0,
      lightLevel: 7,
    } satisfies BlockNodeData,
  },
  {
    id: 'entity-ruby-golem',
    type: 'entity',
    position: { x: 760, y: 60 },
    data: {
      name: 'RubyGolem',
      registryId: 'nexcube:ruby_golem',
      health: 100,
      attack: 18,
      armor: 12,
    } satisfies EntityNodeData,
  },
]

/** 连线：物品 → 方块（被方块产出）→ 实体（被实体掉落） */
const initialEdges: Edge[] = [
  {
    id: 'e-ruby-to-ruby-block',
    source: 'item-ruby',
    target: 'block-ruby',
    label: '产出 ×9',
    type: 'default',
    animated: true,
    style: { stroke: '#2dd4bf', strokeWidth: 2 },
    labelStyle: { fill: '#99f6e4', fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: '#0f172a' },
  },
  {
    id: 'e-ruby-block-to-golem',
    source: 'block-ruby',
    target: 'entity-ruby-golem',
    label: '召唤掉落',
    type: 'default',
    animated: true,
    style: { stroke: '#fbbf24', strokeWidth: 2 },
    labelStyle: { fill: '#fde68a', fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: '#0f172a' },
  },
]

export function NodeCanvasPlaceholder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const setSelectedNode = useWorkspaceStore((s) => s.setSelectedNode)

  /** 自定义节点类型映射，用 useMemo 避免每次渲染重建（会导致 React Flow 警告） */
  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      entity: EntityNodeCard,
      block: BlockNodeCard,
      item: ItemNodeCard,
    }),
    [],
  )

  /** 点击节点选中 → 同步到 workspace store → 驱动右侧属性面板 */
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const type = node.type as 'entity' | 'block' | 'item' | undefined
      const name = (node.data as { name?: string } | undefined)?.name ?? null
      setSelectedNode(node.id, type ?? null, name)
    },
    [setSelectedNode],
  )

  /** 点击画布空白处 → 取消选中 */
  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [setSelectedNode])

  /** 节点拖拽变更（保留 React Flow 内部状态同步） */
  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes)
    },
    [onNodesChange],
  )

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes)
    },
    [onEdgesChange],
  )

  // 防止未使用 setter 的 lint 警告（阶段 2 用于节点 CRUD）
  void setNodes
  void setEdges
  void applyNodeChanges
  void applyEdgeChanges

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0e14]">
      {/* React Flow 画布 */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'default' }}
        proOptions={{ hideAttribution: true }}
        className="!bg-[#0a0e14]"
      >
        {/* 点阵背景 */}
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} color="#1e293b" />

        {/* 缩放控制（右下角，minimap 上方） */}
        <Controls
          className="!rounded-lg !border !border-border !bg-card/90 !shadow-lg backdrop-blur"
          showInteractive={false}
        />

        {/* 小地图（右下角） */}
        <MiniMap
          pannable
          zoomable
          className="!rounded-lg !border !border-border !bg-card/90 !shadow-lg"
          maskColor="rgba(10, 14, 20, 0.7)"
          nodeColor={(node) => {
            switch (node.type) {
              case 'entity':
                return '#f43f5e'
              case 'block':
                return '#f59e0b'
              case 'item':
                return '#14b8a6'
              default:
                return '#64748b'
            }
          }}
          nodeStrokeWidth={2}
        />
      </ReactFlow>

      {/* 浮动层：左上角工程信息卡片 + 右上角任务通知 */}
      {/* 容器 pointer-events-none，子卡片 pointer-events-auto，避免遮挡画布交互 */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="pointer-events-auto absolute left-4 top-4">
          <ProjectInfoCard />
        </div>
        <div className="pointer-events-auto absolute right-4 top-4 flex w-80 flex-col gap-2">
          <TaskNotifications />
        </div>
      </div>
    </div>
  )
}
