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
import { nodeTypes } from '@/components/workspace/canvas/nodes'
import { TypedEdge } from '@/components/workspace/canvas/typed-edge'
import { CanvasContextMenu } from '@/components/workspace/canvas/canvas-context-menu'
import { CanvasToolbar } from '@/components/workspace/canvas/canvas-toolbar'
import { ProjectInfoCard } from '@/components/workspace/canvas/project-info-card'
import { TaskNotifications } from '@/components/workspace/canvas/task-notifications'
import { RecommendationBubble } from '@/components/workspace/canvas/recommendation-bubble'
import { AlignmentLines } from '@/components/workspace/canvas/alignment-lines'
import { FunctionEncapsulator } from '@/components/workspace/canvas/function-encapsulator'
import { FunctionNodeDetail } from '@/components/workspace/canvas/function-node-detail'
import { DebugPanel } from '@/components/workspace/property-panel/debug-panel'
// 性能压测面板已移除（对用户无意义）
import {
  useCanvasStore,
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
  const { screenToFlowPosition, setCenter } = useReactFlow()

  /* 节点选中时自动定位到画布中心 */
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeIds[0] ?? null)
  React.useEffect(() => {
    if (!selectedNodeId) return
    const node = nodes.find((n) => n.id === selectedNodeId)
    if (!node) return
    const x = node.position.x + (node.width ?? 120)
    const y = node.position.y + (node.height ?? 100)
    setCenter(x, y, { zoom: 1.2, duration: 300 })
  }, [selectedNodeId, nodes, setCenter])

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

  /* 节点拖拽结束 → 触发持久化（Task 2-D 接入 API） */
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent | MouseEvent, node: RFNode) => {
      // TODO(Task 2-D)：调用 PATCH /api/projects/[id]/nodes/[nodeId] 持久化 position
      // 持久化由 useCanvasSync 的 interval 自动处理
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
        isValidConnection={isValidConnection}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onNodeDragStop={onNodeDragStop as any}
        nodesDraggable={perfConfig.nodesDraggable}
        onlyRenderVisibleElements={nodes.length > 100}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.05}
        maxZoom={2.5}
        multiSelectionKeyCode={['Meta', 'Shift']}
        deleteKeyCode={['Backspace', 'Delete']}
        snapToGrid
        snapGrid={[20, 20]}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        {/* 点阵背景：精致低对比度，与深蓝黑背景协调 */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="oklch(0.3 0.015 250 / 40%)"
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
            className="!border !border-border !bg-card/90 !shadow-lg"
            nodeColor={miniMapNodeColor}
            nodeStrokeWidth={2}
            maskColor="rgba(0, 0, 0, 0.5)"
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

      {/* 节点对齐辅助线（拖拽时显示） */}
      <AlignmentLines />

      {/* 顶部居中工具栏（浮动，玻璃拟态） */}
      <CanvasToolbar />

      {/* AI 推荐气泡（右上角，创建节点后弹出） */}
      <RecommendationBubble
        lastCreatedNodeId={lastCreated.id}
        lastCreatedNodeKind={lastCreated.kind}
        lastCreatedNodeName={lastCreated.name}
        lastCreatedNodePosition={lastCreated.position}
      />

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
      <DebugPanel />

      {/* 函数节点详情视图（双击函数节点打开，覆盖整个画布） */}
      {openedFunctionNodeId && (
        <FunctionNodeDetail onClose={closeFunctionDetail} />
      )}
    </div>
  )
}
