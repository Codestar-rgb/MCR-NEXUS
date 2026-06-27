'use client'

/**
 * 调试面板（Task 3-C）
 *
 * 浮动在画布右下角的折叠式调试面板：
 *  - 顶部 toolbar：[▶ 开始] [⏸ 暂停] [⏭ 单步] [⏹ 停止] [展开/折叠]
 *  - 日志输出区：显示 debug_log 节点的输出（info/warn/error 三色）
 *  - 断点列表：显示所有 debug_breakpoint 节点
 *  - 状态指示器：idle/running/paused/stopped
 *
 * Mock 执行：
 *  - "开始"：读取当前画布所有可见节点（selectRootNodes）+ 连线，
 *    调用 useDebugStore.start() 进行 BFS 拓扑排序 + 顺序高亮
 *  - 遇到 debug_log 节点：把 message 推入 logs
 *  - 遇到 debug_breakpoint 节点：暂停（高亮 + 等待"继续"）
 *  - 队列执行完毕：自动归位 idle
 *
 * 'use client' 必须：使用 framer-motion + 多个 useState
 */

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  SkipForward,
  Square,
  ChevronDown,
  ChevronUp,
  Terminal,
  CircleDot,
  Trash2,
  Bug,
} from 'lucide-react'
import { useCanvasStore } from '@/stores/canvas'
import { useDebugStore, selectBreakpoints } from '@/stores/debug-store'
import { cn } from '@/lib/utils'

type LogLevel = 'info' | 'warn' | 'error'

const LOG_LEVEL_STYLES: Record<LogLevel, { color: string; bg: string; label: string }> = {
  info: {
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    label: 'INFO',
  },
  warn: {
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    label: 'WARN',
  },
  error: {
    color: 'text-rose-300',
    bg: 'bg-rose-500/10',
    label: 'ERROR',
  },
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  idle: { text: '就绪', color: 'text-muted-foreground' },
  running: { text: '运行中', color: 'text-emerald-300' },
  paused: { text: '已暂停', color: 'text-amber-300' },
  stopped: { text: '已停止', color: 'text-rose-300' },
}

export function DebugPanel() {
  const [expanded, setExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<'logs' | 'breakpoints'>('logs')

  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)

  const status = useDebugStore((s) => s.status)
  const logs = useDebugStore((s) => s.logs)
  const currentNodeId = useDebugStore((s) => s.currentNodeId)
  const pausedAtBreakpointId = useDebugStore((s) => s.pausedAtBreakpointId)
  const startDebug = useDebugStore((s) => s.start)
  const pauseDebug = useDebugStore((s) => s.pause)
  const resumeDebug = useDebugStore((s) => s.resume)
  const stepDebug = useDebugStore((s) => s.step)
  const stopDebug = useDebugStore((s) => s.stop)
  const clearLogs = useDebugStore((s) => s.clearLogs)

  /* 仅显示主画布可见节点（排除已封装到函数内部的节点） */
  const rootNodes = useMemo(() => nodes.filter((n) => !n.data.subGraphId), [nodes])
  const rootEdges = useMemo(() => {
    const rootIdSet = new Set(rootNodes.map((n) => n.id))
    return edges.filter(
      (e) => rootIdSet.has(e.source) && rootIdSet.has(e.target),
    )
  }, [edges, rootNodes])

  /* 断点列表（来自主画布 + 子图所有断点节点） */
  const breakpointNodes = useMemo(
    () => nodes.filter((n) => n.data.kind === 'debug_breakpoint'),
    [nodes],
  )
  const breakpoints = useMemo(
    () => selectBreakpoints(breakpointNodes),
    [breakpointNodes],
  )

  const isRunning = status === 'running'
  const isPaused = status === 'paused'
  const isActive = isRunning || isPaused

  const handleStart = () => {
    if (rootNodes.length === 0) return
    void startDebug(rootNodes, rootEdges)
  }

  const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.idle

  return (
    <motion.div
      initial={false}
      animate={{
        height: expanded ? 'auto' : 44,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'pointer-events-auto absolute bottom-3 right-3 z-30 flex w-80 flex-col overflow-hidden',
        'rounded-lg border border-border bg-card/90 shadow-2xl backdrop-blur-md',
      )}
    >
      {/* 顶部 toolbar */}
      <div className="flex items-center gap-1 border-b border-border bg-muted/30 px-2 py-1.5">
        <Bug className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs font-semibold text-foreground">调试面板</span>
        <span
          className={cn(
            'ml-1 rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wider',
            status === 'running' && 'bg-emerald-500/15 text-emerald-300',
            status === 'paused' && 'bg-amber-500/15 text-amber-300',
            status === 'stopped' && 'bg-rose-500/15 text-rose-300',
            status === 'idle' && 'bg-muted text-muted-foreground',
          )}
        >
          {statusInfo.text}
        </span>

        <div className="ml-auto flex items-center gap-0.5">
          {/* 开始 / 继续 */}
          <button
            type="button"
            onClick={isPaused ? resumeDebug : handleStart}
            disabled={isRunning}
            title={isPaused ? '继续' : '开始调试'}
            aria-label={isPaused ? '继续' : '开始调试'}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded text-emerald-300 transition-colors',
              'hover:bg-emerald-500/15 disabled:opacity-30 disabled:hover:bg-transparent',
            )}
          >
            <Play className="h-3 w-3" />
          </button>

          {/* 暂停 */}
          <button
            type="button"
            onClick={pauseDebug}
            disabled={!isRunning}
            title="暂停"
            aria-label="暂停"
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded text-amber-300 transition-colors',
              'hover:bg-amber-500/15 disabled:opacity-30 disabled:hover:bg-transparent',
            )}
          >
            <Pause className="h-3 w-3" />
          </button>

          {/* 单步 */}
          <button
            type="button"
            onClick={stepDebug}
            disabled={!isPaused}
            title="单步"
            aria-label="单步"
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded text-cyan-300 transition-colors',
              'hover:bg-cyan-500/15 disabled:opacity-30 disabled:hover:bg-transparent',
            )}
          >
            <SkipForward className="h-3 w-3" />
          </button>

          {/* 停止 */}
          <button
            type="button"
            onClick={stopDebug}
            disabled={!isActive}
            title="停止"
            aria-label="停止"
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded text-rose-300 transition-colors',
              'hover:bg-rose-500/15 disabled:opacity-30 disabled:hover:bg-transparent',
            )}
          >
            <Square className="h-3 w-3" />
          </button>

          {/* 展开/折叠 */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? '折叠' : '展开'}
            aria-label={expanded ? '折叠面板' : '展开面板'}
            className="ml-1 flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* 展开内容 */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            {/* 当前执行节点提示 */}
            {currentNodeId && (
              <div className="border-b border-border bg-emerald-500/5 px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-muted-foreground">当前节点：</span>
                  <code className="truncate font-mono text-emerald-300">
                    {nodes.find((n) => n.id === currentNodeId)?.data.title ??
                      currentNodeId.slice(0, 12)}
                  </code>
                </div>
              </div>
            )}

            {/* Tab 切换 */}
            <div className="flex items-center gap-1 border-b border-border px-2 py-1">
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={cn(
                  'flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                  activeTab === 'logs'
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Terminal className="h-3 w-3" />
                日志
                {logs.length > 0 && (
                  <span className="rounded-full bg-muted-foreground/20 px-1 text-[9px]">
                    {logs.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('breakpoints')}
                className={cn(
                  'flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                  activeTab === 'breakpoints'
                    ? 'bg-rose-500/10 text-rose-300'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <CircleDot className="h-3 w-3" />
                断点
                {breakpoints.length > 0 && (
                  <span className="rounded-full bg-muted-foreground/20 px-1 text-[9px]">
                    {breakpoints.length}
                  </span>
                )}
              </button>

              {activeTab === 'logs' && logs.length > 0 && (
                <button
                  type="button"
                  onClick={clearLogs}
                  className="ml-auto flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="清空日志"
                  aria-label="清空日志"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* 内容区 */}
            <div className="max-h-72 min-h-[120px] overflow-y-auto nexcube-scroll">
              {activeTab === 'logs' ? (
                <LogList logs={logs} />
              ) : (
                <BreakpointList
                  breakpoints={breakpoints}
                  pausedAtBreakpointId={pausedAtBreakpointId}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* 日志列表                                                            */
/* ------------------------------------------------------------------ */

function LogList({
  logs,
}: {
  logs: ReturnType<typeof useDebugStore.getState>['logs']
}) {
  if (logs.length === 0) {
    return (
      <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-1 px-4 py-6 text-center">
        <Terminal className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-[11px] text-muted-foreground">暂无日志输出</p>
        <p className="text-[10px] text-muted-foreground/60">
          点击"开始调试"执行 debug_log 节点
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-1 p-2 font-mono">
      {logs.map((log) => {
        const style = LOG_LEVEL_STYLES[log.level] ?? LOG_LEVEL_STYLES.info
        return (
          <div
            key={log.id}
            className={cn(
              'rounded border-l-2 px-2 py-1 text-[11px]',
              style.bg,
              log.level === 'info' && 'border-l-emerald-500',
              log.level === 'warn' && 'border-l-amber-500',
              log.level === 'error' && 'border-l-rose-500',
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className={cn('font-bold', style.color)}>{style.label}</span>
              <span className="text-muted-foreground">
                {new Date(log.timestamp).toLocaleTimeString('zh-CN', {
                  hour12: false,
                })}
              </span>
              <span className="truncate text-foreground/80">
                [{log.nodeTitle}]
              </span>
            </div>
            <p className="mt-0.5 break-words text-foreground">{log.message}</p>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 断点列表                                                            */
/* ------------------------------------------------------------------ */

function BreakpointList({
  breakpoints,
  pausedAtBreakpointId,
}: {
  breakpoints: ReturnType<typeof selectBreakpoints>
  pausedAtBreakpointId: string | null
}) {
  if (breakpoints.length === 0) {
    return (
      <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-1 px-4 py-6 text-center">
        <CircleDot className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-[11px] text-muted-foreground">暂无断点</p>
        <p className="text-[10px] text-muted-foreground/60">
          添加 debug_breakpoint 节点以暂停执行
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-1 p-2">
      {breakpoints.map((bp) => {
        const isPaused = pausedAtBreakpointId === bp.nodeId
        return (
          <div
            key={bp.nodeId}
            className={cn(
              'flex items-center gap-2 rounded border px-2 py-1.5 transition-colors',
              isPaused
                ? 'border-amber-500/60 bg-amber-500/10'
                : 'border-border bg-muted/30',
            )}
          >
            <CircleDot
              className={cn(
                'h-3 w-3 shrink-0',
                isPaused ? 'text-amber-400' : 'text-rose-400',
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-medium text-foreground">
                {bp.nodeTitle}
              </div>
              {bp.condition && (
                <div className="truncate font-mono text-[10px] text-muted-foreground">
                  if {bp.condition}
                </div>
              )}
              {!bp.condition && (
                <div className="text-[10px] text-muted-foreground">
                  总是断
                </div>
              )}
            </div>
            {isPaused && (
              <span className="rounded bg-amber-500/20 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-amber-300">
                已命中
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
