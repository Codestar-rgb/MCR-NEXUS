'use client'

/**
 * 子节点逻辑编辑器（Task 3-B）
 *
 * 当用户在属性面板切换到"行为逻辑" Tab 时，显示一个嵌套的 React Flow 画布，
 * 用于编辑选中节点（实体/方块/物品/函数）的行为逻辑。
 *
 * 结构：
 *  - 标题栏：父节点名 + "行为逻辑" + 节点统计 + 适配视图按钮
 *  - 工具栏：5 个快捷添加按钮（事件/条件/循环/动作/变量）+ 清空子图
 *  - 画布：渲染 subNodes + subEdges，节点用 LogicNodeCard
 *  - 右键菜单：添加逻辑节点 / 删除节点
 *
 * 关键技术点：
 *  - 独立的 ReactFlowProvider（避免与主画布冲突）
 *  - 节点 / 连线从主 canvas store 过滤 subGraphId === activeSubgraphNodeId
 *  - 子节点 CRUD 通过 subgraph store 转发到 canvas store（自动持久化）
 *  - 视觉区分：边框 amber-500/40 + bg-zinc-950/60 + 标题栏带返回箭头
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
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
import {
  Radio,
  GitBranch,
  Repeat,
  Zap,
  Variable,
  Trash2,
  Maximize2,
  Plus,
  Boxes,
  Network,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'

import { nodeTypes } from '@/components/workspace/canvas/nodes'
import { TypedEdge } from '@/components/workspace/canvas/typed-edge'
import { useCanvasStore } from '@/stores/canvas'
import { useSubgraphStore } from '@/stores/subgraph'
import {
  getNodeTypeDefinition,
  getLogicNodeTypes,
  isPortCompatible,
  type FlowNode,
} from '@/lib/node-system'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 模块级常量                                                          */
/* ------------------------------------------------------------------ */

const edgeTypes: EdgeTypes = {
  typed: TypedEdge,
}

const defaultEdgeOptions = {
  type: 'typed' as const,
}

/** 工具栏快捷按钮配置 */
interface ToolButton {
  kind: string
  label: string
  icon: typeof Radio
  color: string
}

const TOOL_BUTTONS: ToolButton[] = [
  { kind: 'logic_event', label: '事件', icon: Radio, color: 'amber' },
  { kind: 'logic_condition', label: '条件', icon: GitBranch, color: 'cyan' },
  { kind: 'logic_loop', label: '循环', icon: Repeat, color: 'teal' },
  { kind: 'logic_action', label: '动作', icon: Zap, color: 'violet' },
  { kind: 'logic_variable', label: '变量', icon: Variable, color: 'emerald' },
]

/** Tailwind 色名 → hover 类名映射 */
const TOOL_COLOR_HOVER: Record<string, string> = {
  amber: 'hover:border-amber-500/60 hover:bg-amber-500/10 hover:text-amber-300',
  cyan: 'hover:border-cyan-500/60 hover:bg-cyan-500/10 hover:text-cyan-300',
  teal: 'hover:border-teal-500/60 hover:bg-teal-500/10 hover:text-teal-300',
  violet: 'hover:border-violet-500/60 hover:bg-violet-500/10 hover:text-violet-300',
  emerald: 'hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-300',
}

/** Tailwind 色名 → hex 映射（用于 MiniMap 节点着色） */
const COLOR_HEX: Record<string, string> = {
  amber: '#f59e0b',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  violet: '#8b5cf6',
  emerald: '#10b981',
  rose: '#f43f5e',
  slate: '#64748b',
  zinc: '#71717a',
}

/* ------------------------------------------------------------------ */
/* 子图右键菜单                                                       */
/* ------------------------------------------------------------------ */

interface SubContextMenu {
  x: number
  y: number
  visible: boolean
  nodeId?: string
  canvasPosition?: { x: number; y: number }
}

/* ------------------------------------------------------------------ */
/* 主组件（包裹 ReactFlowProvider）                                    */
/* ------------------------------------------------------------------ */

export interface SubgraphEditorProps {
  /** 父节点 ID（必传，否则渲染空状态） */
  parentNodeId: string
  /** 父节点显示名（用于标题栏） */
  parentNodeName?: string
  /** 父节点类型（用于图标显示） */
  parentNodeKind?: string
  /** 高度（默认 400px） */
  height?: number
}

export function SubgraphEditor(props: SubgraphEditorProps) {
  return (
    <ReactFlowProvider>
      <SubgraphEditorInner {...props} />
    </ReactFlowProvider>
  )
}

/* ------------------------------------------------------------------ */
/* 内部组件（在 Provider 内）                                          */
/* ------------------------------------------------------------------ */

function SubgraphEditorInner({
  parentNodeId,
  parentNodeName,
  parentNodeKind,
  height = 400,
}: SubgraphEditorProps) {
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const applyNodeChanges = useCanvasStore((s) => s.applyNodeChanges)
  const applyEdgeChanges = useCanvasStore((s) => s.applyEdgeChanges)

  const addSubNode = useSubgraphStore((s) => s.addSubNode)
  const removeSubNode = useSubgraphStore((s) => s.removeSubNode)
  const addSubEdge = useSubgraphStore((s) => s.addSubEdge)

  const { screenToFlowPosition, fitView } = useReactFlow()

  /* 子图右键菜单 */
  const [contextMenu, setContextMenuState] = useState<SubContextMenu | null>(
    null,
  )
  const menuRef = useRef<HTMLDivElement>(null)

  /* 从主 canvas store 过滤出当前子图的节点 */
  const subNodes = useMemo<FlowNode[]>(
    () => nodes.filter((n) => n.data.subGraphId === parentNodeId),
    [nodes, parentNodeId],
  )

  /* 从主 canvas store 过滤出当前子图的连线（两端节点都在子图内） */
  const subNodeIds = useMemo(
    () => new Set(subNodes.map((n) => n.id)),
    [subNodes],
  )
  const subEdges = useMemo(
    () =>
      edges.filter(
        (e) => subNodeIds.has(e.source) && subNodeIds.has(e.target),
      ),
    [edges, subNodeIds],
  )

  /* 转换为 React Flow 节点 / 连线 */
  const rfNodes = useMemo<RFNode[]>(
    () =>
      subNodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
        width: n.width,
        height: n.height,
        selected: n.selected,
      })) as RFNode[],
    [subNodes],
  )

  const rfEdges = useMemo<RFEdge[]>(
    () =>
      subEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined,
        type: 'typed',
        data: e.data,
      })) as RFEdge[],
    [subEdges],
  )

  /* 端口类型校验 */
  const isValidConnection = useCallback<IsValidConnection<RFEdge>>(
    (connection) => {
      if (!connection.source || !connection.target) return false
      if (connection.source === connection.target) return false

      const sourceNode = subNodes.find((n) => n.id === connection.source)
      const targetNode = subNodes.find((n) => n.id === connection.target)
      if (!sourceNode || !targetNode) return false

      const sourceDef = getNodeTypeDefinition(sourceNode.data.kind)
      const targetDef = getNodeTypeDefinition(targetNode.data.kind)
      if (!sourceDef || !targetDef) return false

      const sourcePort =
        sourceDef.outputPorts.find((p) => p.id === connection.sourceHandle) ??
        sourceDef.outputPorts[0]
      const targetPort =
        targetDef.inputPorts.find((p) => p.id === connection.targetHandle) ??
        targetDef.inputPorts[0]
      if (!sourcePort || !targetPort) return false

      return isPortCompatible(sourcePort.dataType, targetPort.dataType)
    },
    [subNodes],
  )

  const handleNodesChange = useCallback<OnNodesChange<RFNode>>(
    (changes) => {
      // 只处理 position / dimensions / select，过滤掉 remove（让用户通过右键菜单删除）
      const filtered = changes.filter((c) => c.type !== 'remove')
      if (filtered.length > 0) applyNodeChanges(filtered)
    },
    [applyNodeChanges],
  )

  const handleEdgesChange = useCallback<OnEdgesChange<RFEdge>>(
    (changes) => applyEdgeChanges(changes),
    [applyEdgeChanges],
  )

  const handleConnect = useCallback<OnConnect>(
    (connection) => addSubEdge(connection),
    [addSubEdge],
  )

  /* 工具栏：添加节点 */
  const handleAddNode = useCallback(
    (kind: string) => {
      // 在画布中心略偏位置创建
      const position = {
        x: 80 + Math.random() * 60,
        y: 60 + Math.random() * 60,
      }
      const id = addSubNode(kind, position)
      if (id) {
        const def = getNodeTypeDefinition(kind)
        toast.success(`已添加 ${def?.label ?? kind}`)
      }
    },
    [addSubNode],
  )

  /* 画布空白右键 → 弹出添加菜单 */
  const onPaneContextMenu = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      e.preventDefault()
      const canvasPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      setContextMenuState({
        x: e.clientX,
        y: e.clientY,
        visible: true,
        canvasPosition: canvasPos,
      })
    },
    [screenToFlowPosition],
  )

  /* 节点右键 → 弹出删除菜单 */
  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: RFNode) => {
      e.preventDefault()
      const canvasPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      setContextMenuState({
        x: e.clientX,
        y: e.clientY,
        visible: true,
        nodeId: node.id,
        canvasPosition: canvasPos,
      })
    },
    [screenToFlowPosition],
  )

  /* 点击空白 → 关闭菜单 */
  const onPaneClick = useCallback(() => {
    setContextMenuState(null)
  }, [])

  /* Esc / 外部点击 → 关闭菜单 */
  useEffect(() => {
    if (!contextMenu?.visible) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenuState(null)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenuState(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [contextMenu?.visible])

  /* MiniMap 着色 */
  const miniMapNodeColor = useCallback((node: RFNode) => {
    const def = getNodeTypeDefinition(node.type ?? '')
    return def ? (COLOR_HEX[def.color] ?? '#71717a') : '#71717a'
  }, [])

  /* 适配视图按钮 */
  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 })
  }, [fitView])

  /* 清空子图 */
  const handleClearSubgraph = useCallback(() => {
    if (subNodes.length === 0) return
    if (
      !window.confirm(
        `确认清空子图？将删除 ${subNodes.length} 个逻辑节点及关联连线。`,
      )
    ) {
      return
    }
    // 批量删除子图节点（连线由 store removeNode 自动级联）
    useCanvasStore.getState().removeNodes(subNodes.map((n) => n.id))
    toast.success('子图已清空')
  }, [subNodes])

  /* 父节点图标 */
  const parentIcon = parentNodeKind
    ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
        getNodeTypeDefinition(parentNodeKind)?.icon ?? 'Boxes'
      ] ?? Boxes
    : Boxes
  const ParentIcon = parentIcon

  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg border border-amber-500/30 bg-zinc-950/60"
      style={{ height }}
    >
      {/* 标题栏 */}
      <header className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2">
        <ParentIcon className="h-3.5 w-3.5 shrink-0 text-amber-300" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-semibold text-amber-200">
              {parentNodeName ?? '子图'}
            </span>
            <span className="shrink-0 rounded bg-amber-500/20 px-1 py-px text-[9px] font-bold uppercase tracking-wider text-amber-300">
              行为逻辑
            </span>
          </div>
          <p className="text-[10px] text-amber-200/60">
            {subNodes.length} 节点 · {subEdges.length} 连线
          </p>
        </div>
        <button
          type="button"
          onClick={handleFitView}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-amber-300/70 transition-colors hover:bg-amber-500/15 hover:text-amber-300"
          title="适配视图"
        >
          <Maximize2 className="h-3 w-3" />
        </button>
      </header>

      {/* 工具栏：5 个快捷添加按钮 */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border bg-card/40 px-2 py-1.5">
        {TOOL_BUTTONS.map((btn) => {
          const Icon = btn.icon
          return (
            <button
              key={btn.kind}
              type="button"
              onClick={() => handleAddNode(btn.kind)}
              className={cn(
                'flex items-center gap-1 rounded border border-border bg-background/60 px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors',
                TOOL_COLOR_HOVER[btn.color],
              )}
              title={`添加${btn.label}节点`}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{btn.label}</span>
            </button>
          )
        })}
        <div className="ml-auto" />
        <button
          type="button"
          onClick={handleClearSubgraph}
          disabled={subNodes.length === 0}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
          title="清空子图"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* 画布容器 */}
      <div className="relative flex-1 overflow-hidden">
        {subNodes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5">
              <Network className="h-5 w-5 text-amber-300/50" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-amber-200/80">
                子图为空
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                点击上方按钮添加逻辑节点
              </p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            isValidConnection={isValidConnection}
            onPaneContextMenu={onPaneContextMenu}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={onPaneClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
            deleteKeyCode={null}
            multiSelectionKeyCode={['Meta', 'Shift']}
            proOptions={{ hideAttribution: true }}
            className="bg-zinc-950/40"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1}
              color="#3f3f46"
            />
            <Controls
              className="!border !border-border !bg-card/90 !shadow-lg"
              showInteractive={false}
              position="bottom-right"
            />
            <MiniMap
              pannable
              zoomable
              className="!border !border-border !bg-card/90 !shadow-lg"
              nodeColor={miniMapNodeColor}
              nodeStrokeWidth={2}
              maskColor="rgba(0, 0, 0, 0.5)"
              position="bottom-left"
            />
          </ReactFlow>
        )}

        {/* 右键菜单 */}
        {contextMenu?.visible && (
          <div
            ref={menuRef}
            className="fixed z-50 min-w-[160px] overflow-hidden rounded-md border border-border bg-popover/95 p-1 shadow-xl backdrop-blur"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.nodeId ? (
              /* 节点右键菜单 */
              <>
                <button
                  type="button"
                  onClick={() => {
                    removeSubNode(contextMenu.nodeId!)
                    setContextMenuState(null)
                    toast.success('节点已删除')
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                  删除节点
                </button>
              </>
            ) : (
              /* 空白右键菜单：列出 5 种 logic 节点 */
              <>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  添加逻辑节点
                </div>
                {getLogicNodeTypes().map((def) => {
                  const Icon =
                    (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
                      def.icon
                    ] ?? Plus
                  return (
                    <button
                      key={def.kind}
                      type="button"
                      onClick={() => {
                        const pos = contextMenu.canvasPosition ?? { x: 80, y: 60 }
                        addSubNode(def.kind, pos)
                        setContextMenuState(null)
                        toast.success(`已添加 ${def.label}`)
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-muted/60"
                    >
                      <Icon className="h-3 w-3" />
                      {def.label}
                      <span className="ml-auto text-[9px] text-muted-foreground">
                        {def.description}
                      </span>
                    </button>
                  )
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 空状态：未选中支持子逻辑的节点                                     */
/* ------------------------------------------------------------------ */

export function SubgraphEditorEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
        <Network className="h-5 w-5 text-muted-foreground/60" />
      </div>
      <div>
        <p className="text-xs font-medium text-foreground">子节点逻辑编辑器</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          当前节点不支持子逻辑
        </p>
      </div>
    </div>
  )
}
