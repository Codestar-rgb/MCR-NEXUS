'use client'

/**
 * NexCube 完整节点画布（Task 2-C）
 *
 * 替换阶段 1 的 NodeCanvasPlaceholder，接入 Zustand canvas store：
 *
 *  - 节点 / 连线从 useCanvasStore 读取
 *  - onNodesChange / onEdgesChange / onConnect 直接接 store action
 *  - isValidConnection 用 isPortCompatible 校验端口数据类型兼容性
 *  - 自定义 TypedEdge（按 dataType 着色 + 流动动画）
 *  - 自定义 nodeTypes（实体/方块/物品/组/黑盒/函数）
 *  - 背景：点阵（zinc-800）
 *  - 右下角：Controls + MiniMap（按节点类型着色）
 *  - 顶部居中：CanvasToolbar（节点/连线统计 + 缩放 + 适配视图 + 清空）
 *  - 左上角：ProjectInfoCard（浮动，待 Task 2-D 接入工程数据）
 *  - 右上角：TaskNotifications（浮动）
 *  - 右键菜单：onNodeContextMenu / onPaneContextMenu → CanvasContextMenu
 *  - 节点拖拽：onNodeDragStop → console.log（Task 2-D 接入持久化）
 *
 * 与 Task 2-A 的 node-system 集成：
 *  - FlowNode / FlowEdge 是 store 中的纯接口，结构上兼容 React Flow Node/Edge
 *  - 传给 ReactFlow 组件时通过类型断言适配（运行时无开销）
 *  - nodeExtras（parentId / dragging 等 React Flow 附加字段）合并到渲染节点上
 */

import * as React from 'react'
import { useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  type IsValidConnection,
  type Node as RFNode,
  type Edge as RFEdge,
  type EdgeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Plus } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'
import { nodeTypes } from '@/components/workspace/canvas/nodes'
import { TypedEdge } from '@/components/workspace/canvas/typed-edge'
import { CanvasContextMenu } from '@/components/workspace/canvas/canvas-context-menu'
import { CanvasToolbar } from '@/components/workspace/canvas/canvas-toolbar'
import { AlignToolbar } from '@/components/workspace/canvas/align-toolbar'
import { ProjectInfoCard } from '@/components/workspace/canvas/project-info-card'
import { TaskNotifications } from '@/components/workspace/canvas/task-notifications'
// RecommendationBubble 已移除
// AlignmentLines, FunctionEncapsulator, FunctionNodeDetail 保留
import { AlignmentLines } from '@/components/workspace/canvas/alignment-lines'
import { FunctionEncapsulator } from '@/components/workspace/canvas/function-encapsulator'
import { FunctionNodeDetail } from '@/components/workspace/canvas/function-node-detail'
// 调试面板已移除
// 性能压测面板已移除（对用户无意义）
import {
  useCanvasStore,
  createFlowNode,
  getNodeColorHex,
} from '@/stores/canvas'
import { useWorkspaceStore } from '@/stores/workspace'
import { useCanvasSync } from '@/hooks/use-canvas-sync'
import {
  isPortCompatible,
  getNodeTypeDefinition,
} from '@/lib/node-system'
import {
  getPerformanceConfig,
  usePerformanceMonitor,
  enableWebGL,
  getWebGLEnableReason,
} from '@/lib/performance/canvas-perf'

/* ------------------------------------------------------------------ */
/* 模块级常量（避免每次渲染重建导致 React Flow 警告）                    */
/* ------------------------------------------------------------------ */

const edgeTypes: EdgeTypes = {
  typed: TypedEdge,
}

const defaultEdgeOptions = {
  type: 'typed' as const,
}

/* ------------------------------------------------------------------ */
/* 主组件（包裹 ReactFlowProvider，子组件才能用 useReactFlow）            */
/* ------------------------------------------------------------------ */

export function NodeCanvas() {
  return (
    <ReactFlowProvider>
      <NodeCanvasInner />
    </ReactFlowProvider>
  )
}

/* ------------------------------------------------------------------ */
/* 内部组件（在 Provider 内，可使用 useReactFlow）                        */
/* ------------------------------------------------------------------ */

function NodeCanvasInner() {
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const nodeExtras = useCanvasStore((s) => s.nodeExtras)
  const applyNodeChanges = useCanvasStore((s) => s.applyNodeChanges)
  const applyEdgeChanges = useCanvasStore((s) => s.applyEdgeChanges)
  const onConnectStore = useCanvasStore((s) => s.onConnect)
  const setContextMenu = useCanvasStore((s) => s.setContextMenu)
  const closeContextMenu = useCanvasStore((s) => s.closeContextMenu)
  const selectNode = useCanvasStore((s) => s.selectNode)

  /* AI 推荐气泡：追踪最后创建的节点 */
  const prevNodeCountRef = React.useRef(nodes.length)
  const [lastCreated, setLastCreated] = React.useState<{
    id: string | null
    kind: string | null
    name: string | null
    position: { x: number; y: number } | null
  }>({ id: null, kind: null, name: null, position: null })

  React.useEffect(() => {
    if (nodes.length > prevNodeCountRef.current) {
      // 新增了节点，找最新的
      const newest = nodes[nodes.length - 1]
      if (newest) {
        setLastCreated({
          id: newest.id,
          kind: newest.data.kind,
          name: newest.data.title,
          position: newest.position,
        })
      }
    }
    prevNodeCountRef.current = nodes.length
  }, [nodes])
  const isInitialized = useCanvasStore((s) => s.isInitialized)
  const activeWorkspaceId = useCanvasStore((s) => s.activeWorkspaceId)
  const openFunctionDetail = useCanvasStore((s) => s.openFunctionDetail)
  const closeFunctionDetail = useCanvasStore((s) => s.closeFunctionDetail)
  const openedFunctionNodeId = useCanvasStore((s) => s.openedFunctionNodeId)

  const setSelectedNode = useWorkspaceStore((s) => s.setSelectedNode)
  const currentProjectId = useWorkspaceStore((s) => s.currentProjectId)
  const { screenToFlowPosition, setCenter, fitView, zoomIn, zoomOut } = useReactFlow()

  /* 节点选中时 — 仅首次搜索时定位（不跟随拖拽） */
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeIds[0] ?? null)
  const lastCenteredId = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!selectedNodeId) return
    // 仅在节点变化时定位一次，不重复跟随
    if (lastCenteredId.current === selectedNodeId) return
    lastCenteredId.current = selectedNodeId

    const node = nodes.find((n) => n.id === selectedNodeId)
    if (!node) return
    const x = node.position.x + (node.width ?? 120)
    const y = node.position.y + (node.height ?? 100)
    setCenter(x, y, { zoom: 1.2, duration: 300 })
  }, [selectedNodeId, nodes, setCenter])

  /* 缩放事件总线：EdgeToolbar 通过 window CustomEvent 触发缩放命令 */
  React.useEffect(() => {
    const onFit = () => fitView({ padding: 0.25, duration: 400 })
    const onIn = () => zoomIn({ duration: 300 })
    const onOut = () => zoomOut({ duration: 300 })
    window.addEventListener('nexcube:zoom-fit', onFit)
    window.addEventListener('nexcube:zoom-in', onIn)
    window.addEventListener('nexcube:zoom-out', onOut)
    return () => {
      window.removeEventListener('nexcube:zoom-fit', onFit)
      window.removeEventListener('nexcube:zoom-in', onIn)
      window.removeEventListener('nexcube:zoom-out', onOut)
    }
  }, [fitView, zoomIn, zoomOut])

  /* 阶段 2-D：从项目持久化加载节点 + debounce 同步 */
  useCanvasSync(currentProjectId)

  /* 把 store 中的 FlowNode[] 与 nodeExtras 合并为 RFNode[]。
   * 主画布只渲染 subGraphId 为空（即不属于任何子图）的节点；
   * 子图节点（subGraphId === 父节点 ID）由子图编辑器单独渲染。
   */
  const rfNodes = useMemo<RFNode[]>(() => {
    return nodes
      .filter((n) => {
        // 按工作区过滤：只显示当前激活工作区的节点
        return n.data.subGraphId === activeWorkspaceId
      })
      .map((n) => {
        const extra = nodeExtras[n.id] ?? {}
        return {
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
          width: n.width,
          height: n.height,
          selected: n.selected,
          ...extra,
        } as RFNode
      })
  }, [nodes, nodeExtras, activeWorkspaceId])

  /* 把 store 中的 FlowEdge[] 转为 RFEdge[]。
   * 主画布只渲染两端节点都在主画布上的连线（两端 subGraphId 都为空）；
   * 子图内部的连线由子图编辑器单独渲染，避免 React Flow 报"找不到节点"。
   */
  const rfEdges = useMemo<RFEdge[]>(() => {
    const nodeById = new Map(nodes.map((n) => [n.id, n]))
    return edges
      .filter((e) => {
        const s = nodeById.get(e.source)
        const t = nodeById.get(e.target)
        // 两端节点必须存在且都属于当前工作区
        return !!s && !!t && s.data.subGraphId === activeWorkspaceId && t.data.subGraphId === activeWorkspaceId
      })
      .map((e) => {
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? undefined,
          targetHandle: e.targetHandle ?? undefined,
          type: 'typed',
          data: e.data,
        } as RFEdge
      })
  }, [edges, nodes, activeWorkspaceId])

  /* 混合模式：defaultNodes/defaultEdges 初始化 + key 强制重建。
   * key 包含所有节点的 isCollapsed 摘要，使折叠/展开时重建画布以反映新状态。
   * 这是 React Flow v12 在受控模式下 edges 不渲染的已知问题的折中方案。 */
  const collapseSignature = nodes
    .filter((n) => n.data.subGraphId === activeWorkspaceId)
    .map((n) => `${n.id}:${n.data.isCollapsed ? '1' : '0'}`)
    .join('|')
  const canvasKey = `${currentProjectId}-${activeWorkspaceId}-${isInitialized}-${rfNodes.length}-${collapseSignature}`

  /* 端口类型校验：禁止不兼容类型连线 + 禁止自连 */
  const isValidConnection = useCallback<IsValidConnection<RFEdge>>(
    (connection) => {
      if (!connection.source || !connection.target) return false
      if (connection.source === connection.target) return false

      const sourceNode = nodes.find((n) => n.id === connection.source)
      const targetNode = nodes.find((n) => n.id === connection.target)
      if (!sourceNode || !targetNode) return false

      const sourceDef = getNodeTypeDefinition(sourceNode.data.kind)
      const targetDef = getNodeTypeDefinition(targetNode.data.kind)
      if (!sourceDef || !targetDef) return false

      // sourceHandle 为 null 时取第一个输出端口（兼容老卡片）
      const sourcePort =
        sourceDef.outputPorts.find((p) => p.id === connection.sourceHandle) ??
        sourceDef.outputPorts[0]
      const targetPort =
        targetDef.inputPorts.find((p) => p.id === connection.targetHandle) ??
        targetDef.inputPorts[0]
      if (!sourcePort || !targetPort) return false

      return isPortCompatible(sourcePort.dataType, targetPort.dataType)
    },
    [nodes],
  )

  const handleNodesChange = useCallback<OnNodesChange<RFNode>>(
    (changes) => applyNodeChanges(changes),
    [applyNodeChanges],
  )

  const handleEdgesChange = useCallback<OnEdgesChange<RFEdge>>(
    (changes) => applyEdgeChanges(changes),
    [applyEdgeChanges],
  )

  const handleConnect = useCallback<OnConnect>(
    (connection) => onConnectStore(connection),
    [onConnectStore],
  )

  /* 连接拒绝反馈：记录拖拽起点，结束时若未成功连接则提示原因 */
  const pendingConnectionRef = React.useRef<{ source: string; sourceHandle: string | null } | null>(null)
  const handleConnectStart = useCallback((_: React.MouseEvent | React.TouchEvent, params: { nodeId?: string | null; handleId?: string | null }) => {
    if (params.nodeId) {
      pendingConnectionRef.current = { source: params.nodeId, sourceHandle: params.handleId ?? null }
    }
  }, [])
  const handleConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    const pending = pendingConnectionRef.current
    pendingConnectionRef.current = null
    if (!pending) return

    // 检测落点位置对应的节点（通过 DOM 查询）
    const touch = 'touches' in event ? event.touches[0] ?? event.changedTouches[0] : null
    const clientX = touch ? touch.clientX : (event as MouseEvent).clientX
    const clientY = touch ? touch.clientY : (event as MouseEvent).clientY
    const el = document.elementFromPoint(clientX, clientY)
    const targetNode = el?.closest('[data-nodeid]') as HTMLElement | null
    const targetId = targetNode?.getAttribute('data-nodeid') ?? null

    // 若落点不在任何节点上（拖到空白处），不提示
    if (!targetId) return
    // 若落点是源节点自身，不提示
    if (targetId === pending.source) return

    // 判断为何被拒绝
    const sourceNode = nodes.find((n) => n.id === pending.source)
    const targetNode2 = nodes.find((n) => n.id === targetId)
    if (!sourceNode || !targetNode2) return
    const sourceDef = getNodeTypeDefinition(sourceNode.data.kind)
    const targetDef = getNodeTypeDefinition(targetNode2.data.kind)
    if (!sourceDef || !targetDef) return

    const sourcePort = sourceDef.outputPorts.find((p) => p.id === pending.sourceHandle) ?? sourceDef.outputPorts[0]
    const targetPort = targetDef.inputPorts[0]
    if (!sourcePort || !targetPort) return

    if (!isPortCompatible(sourcePort.dataType, targetPort.dataType)) {
      const PORT_LABELS: Record<string, string> = {
        entity: '实体', boolean: '布尔', number: '数值', string: '字符串',
        itemstack: '物品堆', any: '通用', block: '方块', void: '空',
      }
      const sLabel = PORT_LABELS[sourcePort.dataType] ?? sourcePort.dataType
      const tLabel = PORT_LABELS[targetPort.dataType] ?? targetPort.dataType
      toast.warning(`无法连接：${sourcePort.label}(${sLabel}) 不兼容 ${targetPort.label}(${tLabel})`, {
        description: '请连接数据类型兼容的端口，或使用转换节点。',
      })
    }
  }, [nodes])

  /* 画布空白右键 → 弹出"创建节点 / 全选 / 清空"菜单 */
  const onPaneContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      e.preventDefault()
      const canvasPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        visible: true,
        canvasPosition: canvasPos,
      })
      selectNode(null)
      setSelectedNode(null)
    },
    [screenToFlowPosition, setContextMenu, selectNode, setSelectedNode],
  )

  /* 节点右键 → 弹出"复制 / 删除 / 重命名 / 折叠 / 打包"菜单 */
  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: RFNode) => {
      e.preventDefault()
      const canvasPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        visible: true,
        nodeId: node.id,
        canvasPosition: canvasPos,
      })
      selectNode(node.id)
      const type = (node.type as 'entity' | 'block' | 'item' | null) ?? null
      const name =
        (node.data as { title?: string } | undefined)?.title ?? null
      setSelectedNode(node.id, type, name)
    },
    [screenToFlowPosition, setContextMenu, selectNode, setSelectedNode],
  )

  /* 点击画布空白 → 取消选中 + 关闭右键菜单 */
  const onPaneClick = useCallback(() => {
    closeContextMenu()
    selectNode(null)
    setSelectedNode(null)
  }, [closeContextMenu, selectNode, setSelectedNode])

  /* 点击节点 → 选中（同步到 canvas store + workspace store → 属性面板） */
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: RFNode) => {
      closeContextMenu()
      selectNode(node.id)
      const type = (node.type as 'entity' | 'block' | 'item' | null) ?? null
      const name =
        (node.data as { title?: string } | undefined)?.title ?? null
      setSelectedNode(node.id, type, name)
    },
    [closeContextMenu, selectNode, setSelectedNode],
  )

  /* 节点拖拽结束 → 检测是否拖入/拖出组 */
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent | MouseEvent, node: RFNode) => {
      const canvasState = useCanvasStore.getState()
      const allNodes = canvasState.nodes
      const draggedNode = allNodes.find((n) => n.id === node.id)
      if (!draggedNode) return

      // 获取所有组节点
      const groupNodes = allNodes.filter((n) => n.data.kind === 'group')
      if (groupNodes.length === 0) return

      // 检测拖拽节点中心是否在某个组的边界内
      const nodeCenterX = draggedNode.position.x + (draggedNode.width ?? 200) / 2
      const nodeCenterY = draggedNode.position.y + (draggedNode.height ?? 150) / 2

      let targetGroup: string | null = null
      for (const group of groupNodes) {
        const gx = group.position.x
        const gy = group.position.y
        const gw = group.width ?? 360
        const gh = group.height ?? 220
        if (
          nodeCenterX >= gx && nodeCenterX <= gx + gw &&
          nodeCenterY >= gy && nodeCenterY <= gy + gh
        ) {
          targetGroup = group.id
          break
        }
      }

      const currentParent = draggedNode.data.parentId ?? null

      if (targetGroup && targetGroup !== currentParent) {
        // 拖入新组
        const extras = { ...canvasState.nodeExtras }
        extras[node.id] = { ...extras[node.id], parentId: targetGroup }
        canvasState.updateNode(node.id, {
          data: { ...draggedNode.data, parentId: targetGroup },
        })
        toast.success(`节点已加入组`, { description: '拖出组区域可移除' })
      } else if (!targetGroup && currentParent) {
        // 拖出组
        const extras = { ...canvasState.nodeExtras }
        extras[node.id] = { ...extras[node.id], parentId: undefined }
        canvasState.updateNode(node.id, {
          data: { ...draggedNode.data, parentId: null },
        })
        toast.info('节点已移出组')
      }
    },
    [],
  )

  /* 双击函数节点 → 打开详情视图（编辑内部子节点） */
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: RFNode) => {
      const kind = (node.data as { kind?: string } | undefined)?.kind
      if (kind === 'function') {
        openFunctionDetail(node.id)
      }
    },
    [openFunctionDetail],
  )

  /* MiniMap 节点着色：按 kind 取主题色 hex */
  const miniMapNodeColor = useCallback((node: RFNode) => {
    return getNodeColorHex(node.type ?? '')
  }, [])

  /* 防止 nodeTypes 在每次渲染重建（已经在 nodes/index.tsx 模块级常量） */
  const stableNodeTypes = useMemo(() => nodeTypes, [])

  /* 阶段 2-E：万级节点性能优化配置 + Task 6-C WebGL 开发者开关 */
  const perfConfig = useMemo(() => getPerformanceConfig(nodes.length), [nodes.length])
  const { fps } = usePerformanceMonitor()
  const [webglForced, setWebglForced] = useState(false)
  const webglEnabled = enableWebGL(nodes.length, webglForced)
  const webglReason = getWebGLEnableReason(nodes.length, webglForced)

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <AnimatePresence mode="wait">
      <motion.div
        key={canvasKey}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
      <ReactFlow
        defaultNodes={rfNodes}
        defaultEdges={rfEdges}
        nodeTypes={stableNodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
        isValidConnection={isValidConnection}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onEdgeContextMenu={(e, edge) => {
          e.preventDefault()
          // 右键连线 → 选中 + 提示删除
          useCanvasStore.getState().selectNode(null)
          // 选中边
          const edgeId = edge.id
          toast.info(`连线已选中：按 Delete 删除`, {
            description: `ID: ${edgeId.slice(0, 12)}...`,
            action: {
              label: '删除',
              onClick: () => {
                useCanvasStore.getState().applyEdgeChanges([{ type: 'remove', id: edgeId }])
                toast.success('连线已删除')
              },
            },
          })
        }}
        onEdgeClick={(_e, edge) => {
          // 点击连线选中（高亮）
          useCanvasStore.getState().selectNode(null)
        }}
        onNodeDragStop={onNodeDragStop as any}
        nodesDraggable={perfConfig.nodesDraggable}
        onlyRenderVisibleElements={perfConfig.onlyRenderVisibleElements || nodes.length > 150}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.05}
        maxZoom={2.5}
        multiSelectionKeyCode={['Meta', 'Shift']}
        deleteKeyCode={['Backspace', 'Delete']}
        // 禁用 snapToGrid — 避免拖拽卡顿
        // snapToGrid
        // snapGrid={[20, 20]}
        // 触控优化
        panOnDrag={true}
        zoomOnPinch={true}
        panOnScroll={false}
        selectionOnDrag={false}
        zoomOnScroll={true}
        // 触控时禁用双指缩放冲突
        nodesConnectable={true}
        touchHandlerProps={{ passive: false }}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        {/* 点阵背景：精致低对比度，与深蓝黑背景协调 */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="oklch(0.35 0.015 250 / 30%)"
        />

        {/* 缩放控制（右下角） */}
        <Controls
          className="!border !border-border !bg-card/90 !shadow-lg backdrop-blur"
          showInteractive={false}
        />

        {/* 小地图（右下角，按节点类型着色；超大批量时关闭以提升性能） */}
        {perfConfig.miniMapEnabled ? (
          <MiniMap
            pannable
            zoomable
            className="!border !border-border !bg-card/90 !shadow-lg !rounded-lg"
            nodeColor={miniMapNodeColor}
            nodeStrokeColor="var(--color-foreground, #f4f4f5)"
            nodeStrokeWidth={2}
            nodeBorderRadius={6}
            maskColor="rgba(0, 0, 0, 0.4)"
            ariaLabel="画布缩略图 — 点击或拖拽定位"
          />
        ) : null}

        {/* 左上角 Panel（工程卡片，紧凑徽章风格，不遮挡画布） */}
        <Panel position="top-left" className="!m-2 !p-0">
          <div className="pointer-events-auto">
            <ProjectInfoCard />
          </div>
        </Panel>

        {/* 右上角 Panel（任务通知，紧凑徽章风格） */}
        <Panel position="top-right" className="!m-2 !p-0">
          <div className="pointer-events-auto w-72">
            <TaskNotifications />
          </div>
        </Panel>
      </ReactFlow>
      </motion.div>
      </AnimatePresence>

      {/* 空画布引导覆盖层（无节点时显示，含快捷创建按钮） */}
      {rfNodes.length === 0 && (
        <EmptyCanvasOverlay onCreateNode={(kind) => {
          const node = createFlowNode(kind, { x: 0, y: 0 })
          useCanvasStore.getState().addNode(node)
          useCanvasStore.getState().selectNode(node.id)
          setSelectedNode(node.id, kind, node.data.title)
        }} />
      )}

      {/* 节点对齐辅助线（拖拽时显示） */}
      <AlignmentLines />

      {/* 顶部居中工具栏（浮动，玻璃拟态） */}
      <CanvasToolbar />

      {/* 对齐工具栏（选中 2+ 节点时显示） */}
      <AlignToolbar />

      {/* AI 推荐气泡已移除（减少画布干扰） */}

      {/* 性能指示器（右下角，FPS + 模式提示，精致玻璃拟态） */}
      <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex items-center gap-2">
        <div className={`glass flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono ${
          fps < 30
            ? 'border-destructive/40 text-destructive'
            : fps < 50
              ? 'border-amber-500/40 text-amber-400'
              : 'border-primary/30 text-primary'
        }`}>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-current nexcube-pulse" />
          {fps} FPS · {nodes.length} 节点
          {perfConfig.tier !== 'full' && (
            <span className="ml-1 rounded bg-muted/50 px-1 py-px text-[9px] uppercase tracking-wider">
              {perfConfig.tier}
            </span>
          )}
        </div>
      </div>

      {/* WebGL 模式提示（顶部居中，仅 WebGL 启用时显示） */}
      {webglEnabled && webglReason ? (
        <div className="pointer-events-none absolute top-3 left-1/2 z-20 -translate-x-1/2">
          <div className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-[11px] text-violet-300 backdrop-blur">
            🎛 WebGL 模式（实验性）· {webglReason}
          </div>
        </div>
      ) : null}

      {/* 性能模式提示（顶部居中下方，仅非 full 模式显示） */}
      {perfConfig.hint ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
          <div className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-400 backdrop-blur">
            {perfConfig.hint}
          </div>
        </div>
      ) : null}

      {/* 右键上下文菜单（浮动） */}
      <CanvasContextMenu />

      {/* 函数节点封装按钮 + 对话框（多选时显示） */}
      <FunctionEncapsulator />

      {/* 调试面板（右下角浮动） */}
      {/* 调试面板已移除 */}

      {/* 函数节点详情视图（双击函数节点打开，覆盖整个画布） */}
      {openedFunctionNodeId && (
        <FunctionNodeDetail onClose={closeFunctionDetail} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 空画布引导覆盖层                                                    */
/* ------------------------------------------------------------------ */

const EMPTY_QUICK_NODES = [
  { kind: 'entity', label: '实体', icon: 'Boxes' },
  { kind: 'block', label: '方块', icon: 'Box' },
  { kind: 'item', label: '物品', icon: 'Package' },
] as const

function EmptyCanvasOverlay({ onCreateNode }: { onCreateNode: (kind: string) => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="pointer-events-auto flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border/40 bg-card/20 px-8 py-10 text-center backdrop-blur-sm">
        <div className="relative">
          <div className="absolute inset-0 -m-4 rounded-full bg-primary/8 blur-2xl" aria-hidden />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
            <Plus className="h-7 w-7 text-primary" />
          </div>
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">开始你的模组构建</p>
          <p className="mt-1.5 max-w-xs text-[12px] leading-relaxed text-muted-foreground">
            画布为空。点击下方按钮快速创建节点，或右键画布空白处查看全部节点类型。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {EMPTY_QUICK_NODES.map((n) => {
            const Icon = (LucideIcons as unknown as Record<
              string,
              React.ComponentType<{ className?: string }>
            >)[n.icon] ?? Plus
            return (
              <button
                key={n.kind}
                onClick={() => onCreateNode(n.kind)}
                className="group flex items-center gap-1.5 rounded-lg border border-border/40 bg-card/40 px-3.5 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-card/60"
              >
                <Icon className="h-3.5 w-3.5 text-primary transition-transform group-hover:scale-110" />
                {n.label}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 font-mono">Ctrl+P</kbd>
            搜索
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 font-mono">Ctrl+Shift+P</kbd>
            命令
          </span>
        </div>
      </div>
    </div>
  )
}
