'use client'

/**
 * 函数节点详情视图（Task 3-C）
 *
 * 双击函数节点 → 打开此详情视图（覆盖整个画布区域）：
 *  - 顶部 header：返回按钮 + 函数名 + 输入/输出端口摘要 + 关闭按钮
 *  - 中部：独立 React Flow 画布，仅显示该函数内部的子节点
 *  - 内部子节点（subGraphId === functionNodeId）支持完整编辑
 *
 * 内部节点的数据来自 canvas store（共享 nodes/edges 数组），
 * 但通过 selectFunctionChildren 过滤。
 *
 * 编辑能力：
 *  - 拖动子节点：position 变更（持久化由 useCanvasSync 处理）
 *  - 添加子节点：通过右键菜单（共享 CanvasContextMenu 组件）
 *  - 删除子节点：Backspace / Delete（React Flow 默认）
 *
 * 函数节点的端口对应内部子图的入口/出口：
 *  - 输入端口：来自外部 → 子图内部第一节点的边
 *  - 输出端口：子图内部 → 外部的边
 *  端口定义存储在 function node 的 properties.inputPorts / outputPorts
 */

import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Node as RFNode,
  type Edge as RFEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ArrowLeft, X, FunctionSquare, LogIn, LogOut } from 'lucide-react'
import { useCanvasStore, getNodeColorHex } from '@/stores/canvas'
import { nodeTypes } from '@/components/workspace/canvas/nodes'
import { TypedEdge } from '@/components/workspace/canvas/typed-edge'
import { PORT_TYPES } from '@/lib/node-system'
import { cn } from '@/lib/utils'

const edgeTypes = { typed: TypedEdge }
const defaultEdgeOptions = { type: 'typed' as const }

interface FunctionNodeDetailProps {
  /** 关闭详情视图的回调 */
  onClose: () => void
}

export function FunctionNodeDetail({ onClose }: FunctionNodeDetailProps) {
  return (
    <ReactFlowProvider>
      <FunctionNodeDetailInner onClose={onClose} />
    </ReactFlowProvider>
  )
}

function FunctionNodeDetailInner({ onClose }: FunctionNodeDetailProps) {
  const functionNodeId = useCanvasStore((s) => s.openedFunctionNodeId)
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const nodeExtras = useCanvasStore((s) => s.nodeExtras)
  const applyNodeChanges = useCanvasStore((s) => s.applyNodeChanges)
  const applyEdgeChanges = useCanvasStore((s) => s.applyEdgeChanges)
  const onConnectStore = useCanvasStore((s) => s.onConnect)

  const { fitView } = useReactFlow()

  /* 函数节点本身 */
  const functionNode = useMemo(() => {
    if (!functionNodeId) return null
    return nodes.find((n) => n.id === functionNodeId) ?? null
  }, [functionNodeId, nodes])

  /* 函数内部子节点：subGraphId === functionNodeId */
  const childNodes = useMemo(() => {
    if (!functionNodeId) return []
    return nodes.filter((n) => n.data.subGraphId === functionNodeId)
  }, [functionNodeId, nodes])

  /* 函数内部连线：两端都在 childNodes 集合内 */
  const childEdges = useMemo(() => {
    if (!functionNodeId) return []
    const childIdSet = new Set(childNodes.map((n) => n.id))
    return edges.filter(
      (e) => childIdSet.has(e.source) && childIdSet.has(e.target),
    )
  }, [functionNodeId, edges, childNodes])

  /* 转 RFNode[] */
  const rfNodes = useMemo<RFNode[]>(() => {
    return childNodes.map((n) => {
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
  }, [childNodes, nodeExtras])

  const rfEdges = useMemo<RFEdge[]>(() => {
    return childEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? undefined,
      targetHandle: e.targetHandle ?? undefined,
      type: 'typed',
      data: e.data,
    })) as RFEdge[]
  }, [childEdges])

  /* 函数节点端口定义（从 properties 读取） */
  const inputPorts = useMemo(() => {
    const props = (functionNode?.data.properties ?? {}) as Record<
      string,
      unknown
    >
    const ports = props.inputPorts
    return Array.isArray(ports)
      ? (ports as Array<{ id: string; label: string; dataType: string }>)
      : []
  }, [functionNode])

  const outputPorts = useMemo(() => {
    const props = (functionNode?.data.properties ?? {}) as Record<
      string,
      unknown
    >
    const ports = props.outputPorts
    return Array.isArray(ports)
      ? (ports as Array<{ id: string; label: string; dataType: string }>)
      : []
  }, [functionNode])

  const handleNodesChange = useCallback<OnNodesChange<RFNode>>(
    (changes) => applyNodeChanges(changes),
    [applyNodeChanges],
  )

  const handleEdgesChange = useCallback<OnEdgesChange<RFEdge>>(
    (changes) => applyEdgeChanges(changes),
    [applyEdgeChanges],
  )

  const handleConnect = useCallback<OnConnect>(
    (conn) => onConnectStore(conn),
    [onConnectStore],
  )

  /* 端口 hex */
  const portHex = (dataType: string) => {
    const t = dataType as keyof typeof PORT_TYPES
    return PORT_TYPES[t]?.hex ?? '#71717a'
  }

  /* 关闭时调用 */
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  if (!functionNode) {
    return null
  }

  const colorHex = getNodeColorHex('function')

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background/95 backdrop-blur-md">
      {/* 顶部 header */}
      <header
        className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-2.5"
        style={{ borderLeft: `3px solid ${colorHex}` }}
      >
        <button
          type="button"
          onClick={handleClose}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回主画布
        </button>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ backgroundColor: `${colorHex}33`, color: colorHex }}
          >
            <FunctionSquare className="h-3.5 w-3.5" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">
                {functionNode.data.title}
              </span>
              <span className="rounded bg-cyan-500/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                函数节点
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {childNodes.length} 个子节点 · {childEdges.length} 条内部连线
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* 输入端口摘要 */}
          <div className="hidden items-center gap-1.5 md:flex">
            <LogIn className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] text-muted-foreground">输入</span>
            <div className="flex items-center gap-1">
              {inputPorts.map((p) => (
                <span
                  key={p.id}
                  className="flex items-center gap-1 rounded bg-muted/40 px-1.5 py-0.5 text-[10px]"
                  title={`${p.label} (${p.dataType})`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: portHex(p.dataType) }}
                  />
                  <span className="text-foreground">{p.label}</span>
                </span>
              ))}
              {inputPorts.length === 0 && (
                <span className="text-[10px] text-muted-foreground">无</span>
              )}
            </div>
          </div>

          {/* 输出端口摘要 */}
          <div className="hidden items-center gap-1.5 md:flex">
            <LogOut className="h-3 w-3 text-rose-400" />
            <span className="text-[10px] text-muted-foreground">输出</span>
            <div className="flex items-center gap-1">
              {outputPorts.map((p) => (
                <span
                  key={p.id}
                  className="flex items-center gap-1 rounded bg-muted/40 px-1.5 py-0.5 text-[10px]"
                  title={`${p.label} (${p.dataType})`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: portHex(p.dataType) }}
                  />
                  <span className="text-foreground">{p.label}</span>
                </span>
              ))}
              {outputPorts.length === 0 && (
                <span className="text-[10px] text-muted-foreground">无</span>
              )}
            </div>
          </div>

          {/* 适配视图 */}
          <button
            type="button"
            onClick={() => fitView({ padding: 0.25, duration: 400 })}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="适配视图"
            aria-label="适配视图"
          >
            <FunctionSquare className="h-3.5 w-3.5" />
          </button>

          {/* 关闭 */}
          <button
            type="button"
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-rose-500/15 hover:text-rose-300"
            title="关闭"
            aria-label="关闭"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* 函数内部画布 */}
      <div className="relative flex-1">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.1}
          maxZoom={2.5}
          deleteKeyCode={['Backspace', 'Delete']}
          proOptions={{ hideAttribution: true }}
          className="bg-background"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#27272a"
          />
          <Controls
            className="!border !border-border !bg-card/90 !shadow-lg backdrop-blur"
            showInteractive={false}
          />
          <MiniMap
            pannable
            zoomable
            className="!border !border-border !bg-card/90 !shadow-lg"
            nodeColor={(node) => getNodeColorHex(node.type ?? '')}
            nodeStrokeWidth={2}
            maskColor="rgba(0, 0, 0, 0.5)"
          />
        </ReactFlow>

        {/* 空状态提示 */}
        {childNodes.length === 0 && (
          <div
            className={cn(
              'pointer-events-none absolute inset-0 flex items-center justify-center',
            )}
          >
            <div className="rounded-lg border border-dashed border-border bg-card/60 px-6 py-4 text-center">
              <p className="text-xs font-medium text-foreground">
                此函数节点内部还没有子节点
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                右键空白处可创建子节点
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
