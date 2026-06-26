'use client'

/**
 * 画布工具栏浮层（Task 2-C）
 *
 * 浮动在画布顶部居中，半透明背景：
 *  - 节点数统计（实时）
 *  - 连线数统计（实时）
 *  - 缩放百分比（实时，跟随用户滚轮 / Controls）
 *  - 适配视图按钮（调用 ReactFlow.fitView）
 *  - 清空按钮（带二次确认）
 *
 * 通过 useReactFlow 钩子获取 React Flow 实例（必须在 ReactFlowProvider 内）。
 */

import { useEffect, useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import { Maximize2, Trash2, Circle, GitBranch } from 'lucide-react'
import { toast } from 'sonner'
import { useCanvasStore } from '@/stores/canvas'
import { cn } from '@/lib/utils'

export function CanvasToolbar() {
  const { fitView, getZoom } = useReactFlow()
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const clearCanvas = useCanvasStore((s) => s.clearCanvas)

  const [zoom, setZoom] = useState(1)

  /* 跟踪当前缩放比例（300ms 轮询，避免过度更新） */
  useEffect(() => {
    const updateZoom = () => setZoom(getZoom())
    updateZoom()
    const interval = window.setInterval(updateZoom, 300)
    return () => window.clearInterval(interval)
  }, [getZoom])

  const handleFitView = () => {
    fitView({ padding: 0.25, duration: 400 })
    toast.success('已适配视图')
  }

  const handleClear = () => {
    if (nodes.length === 0) {
      toast.info('画布已经是空的')
      return
    }
    clearCanvas()
    toast.success(`已清空画布（${nodes.length} 节点 / ${edges.length} 连线）`)
  }

  return (
    <div
      className={cn(
        'pointer-events-auto absolute left-1/2 top-3 z-20 -translate-x-1/2',
        'flex items-center gap-1 rounded-full border border-border/80 bg-card/80 px-2 py-1 shadow-lg backdrop-blur-md',
      )}
    >
      {/* 节点数 */}
      <Stat
        icon={<Circle className="h-3 w-3 text-emerald-400" />}
        value={nodes.length}
        label="节点"
      />
      <Divider />
      {/* 连线数 */}
      <Stat
        icon={<GitBranch className="h-3 w-3 text-cyan-400" />}
        value={edges.length}
        label="连线"
      />
      <Divider />
      {/* 缩放 */}
      <div className="px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
        {Math.round(zoom * 100)}%
      </div>
      <Divider />
      {/* 适配视图 */}
      <button
        type="button"
        onClick={handleFitView}
        title="适配视图"
        aria-label="适配视图"
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-emerald-300"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
      {/* 清空 */}
      <button
        type="button"
        onClick={handleClear}
        title="清空画布"
        aria-label="清空画布"
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-rose-500/15 hover:text-rose-300"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 子组件                                                              */
/* ------------------------------------------------------------------ */

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5">
      {icon}
      <span className="text-xs font-semibold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

function Divider() {
  return <div className="h-3.5 w-px bg-border/60" />
}
