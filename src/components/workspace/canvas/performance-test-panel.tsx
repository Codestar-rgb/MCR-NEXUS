'use client'

/**
 * NexCube 节点画布性能压测面板（Task 6-C）
 *
 * 浮动在画布左下角（FPS 指示器旁边）的开发工具：
 *   - 4 个按钮：生成 100 / 500 / 1K / 5K 测试节点
 *   - 显示当前节点数 + FPS + 性能等级
 *   - 清空测试节点（移除所有 test-node-* 开头的节点）
 *   - 可折叠（默认展开）
 *   - 仅在开发模式显示（process.env.NODE_ENV !== 'production'）
 *
 * 设计要点：
 *   - 生成节点时调用 generateTestNodes（canvas-perf.ts）
 *   - 生成后自动 fitView（debounce 50ms 等待 store 更新）
 *   - 不持久化测试节点（用户刷新后清空）
 *   - 测试节点用 test-node- 前缀，方便清理
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, FlaskConical, Trash2 } from 'lucide-react'
import { useReactFlow } from '@xyflow/react'
import { generateTestNodes } from '@/lib/performance/canvas-perf'
import { useCanvasStore } from '@/stores/canvas'
import type { FlowNode } from '@/lib/node-system'
import { cn } from '@/lib/utils'

/** 压测节点数量档位 */
const TEST_COUNTS = [100, 500, 1000, 5000] as const

interface PerformanceTestPanelProps {
  /** 当前 FPS（由 NodeCanvas 传入，避免重复监控） */
  fps?: number
  /** 当前性能等级（perfConfig.tier） */
  tier?: string
  /** 是否启用 WebGL 模式（开发者开关） */
  webglEnabled?: boolean
  /** 切换 WebGL 开发模式 */
  onToggleWebGL?: () => void
}

export function PerformanceTestPanel({
  fps = 60,
  tier = 'full',
  webglEnabled = false,
  onToggleWebGL,
}: PerformanceTestPanelProps) {
  const [collapsed, setCollapsed] = React.useState(false)

  const nodes = useCanvasStore((s) => s.nodes)
  const addNodes = useCanvasStore((s) => s.addNodes)
  const removeNodes = useCanvasStore((s) => s.removeNodes)
  const { fitView } = useReactFlow()

  const testNodeCount = React.useMemo(
    () => nodes.filter((n) => n.id.startsWith('test-node-')).length,
    [nodes],
  )

  const handleGenerate = React.useCallback(
    (count: number) => {
      const newNodes = generateTestNodes(count) as unknown as FlowNode[]
      addNodes(newNodes)
      // 等待 store 更新后 fitView
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 })
      }, 50)
    },
    [addNodes, fitView],
  )

  const handleClear = React.useCallback(() => {
    const testIds = nodes
      .filter((n) => n.id.startsWith('test-node-'))
      .map((n) => n.id)
    if (testIds.length > 0) {
      removeNodes(testIds)
      setTimeout(() => {
        fitView({ padding: 0.25, duration: 400 })
      }, 50)
    }
  }, [nodes, removeNodes, fitView])

  return (
    <div
      className={cn(
        'pointer-events-auto w-72 overflow-hidden rounded-lg border border-border/80',
        'bg-card/95 shadow-lg backdrop-blur',
      )}
      role="region"
      aria-label="性能压测工具"
    >
      {/* 标题栏 */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2 border-b border-border/60 px-3 py-2 text-left',
          'transition-colors hover:bg-accent/40',
        )}
        aria-expanded={!collapsed}
        aria-label={collapsed ? '展开性能压测面板' : '折叠性能压测面板'}
      >
        <FlaskConical className="h-3.5 w-3.5 text-emerald-400" />
        <span className="flex-1 text-xs font-semibold text-foreground">
          性能压测
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {testNodeCount} 测试节点
        </span>
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-3 py-2.5">
              {/* 4 档生成按钮 */}
              <div className="grid grid-cols-4 gap-1.5">
                {TEST_COUNTS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleGenerate(count)}
                    className={cn(
                      'h-7 rounded-md border border-emerald-500/30 bg-emerald-500/10',
                      'text-[11px] font-medium text-emerald-300',
                      'transition-colors hover:bg-emerald-500/20 hover:text-emerald-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
                    )}
                    aria-label={`生成 ${count} 个测试节点`}
                  >
                    {count >= 1000 ? `${count / 1000}K` : count}
                  </button>
                ))}
              </div>

              {/* 当前状态 */}
              <div className="rounded-md bg-muted/30 px-2 py-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-muted-foreground">节点数</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    {nodes.length}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-muted-foreground">FPS</span>
                  <span
                    className={cn(
                      'font-mono font-semibold tabular-nums',
                      fps < 30
                        ? 'text-rose-400'
                        : fps < 50
                          ? 'text-amber-400'
                          : 'text-emerald-400',
                    )}
                  >
                    {fps}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-muted-foreground">性能等级</span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-px font-mono text-[9px] font-bold uppercase tracking-wider',
                      tier === 'full'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : tier === 'virtual'
                          ? 'bg-teal-500/15 text-teal-300'
                          : tier === 'aggregated'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-violet-500/15 text-violet-300',
                    )}
                  >
                    {tier}
                  </span>
                </div>
              </div>

              {/* WebGL 切换开关（开发者用） */}
              {onToggleWebGL && (
                <label className="flex cursor-pointer items-center justify-between gap-2 px-2 py-1 text-[11px]">
                  <span className="text-muted-foreground">
                    WebGL 模式
                    <span className="ml-1 text-[9px] text-violet-400">实验性</span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={webglEnabled}
                    onClick={onToggleWebGL}
                    className={cn(
                      'relative h-4 w-7 rounded-full transition-colors',
                      webglEnabled
                        ? 'bg-violet-500/60'
                        : 'bg-muted-foreground/30',
                    )}
                    aria-label="切换 WebGL 模式"
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform',
                        webglEnabled ? 'translate-x-3.5' : 'translate-x-0.5',
                      )}
                    />
                  </button>
                </label>
              )}

              {/* 清空测试节点 */}
              <button
                type="button"
                onClick={handleClear}
                disabled={testNodeCount === 0}
                className={cn(
                  'flex h-7 w-full items-center justify-center gap-1.5 rounded-md',
                  'border border-rose-500/30 bg-rose-500/10 text-[11px] font-medium text-rose-300',
                  'transition-colors hover:bg-rose-500/20 hover:text-rose-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                )}
                aria-label="清空测试节点"
              >
                <Trash2 className="h-3 w-3" />
                清空测试节点
              </button>

              {/* 提示文案 */}
              <p className="px-1 text-[10px] leading-relaxed text-muted-foreground/70">
                测试节点用 <code className="font-mono text-emerald-400/80">test-node-*</code>{' '}
                前缀，刷新后不保留
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * 仅在开发模式下渲染的压测面板包装器
 * （在 NodeCanvas 中以 <DevOnlyPerformanceTestPanel /> 引用，避免污染生产构建）
 */
export function DevOnlyPerformanceTestPanel(props: PerformanceTestPanelProps) {
  if (process.env.NODE_ENV === 'production') return null
  return <PerformanceTestPanel {...props} />
}
