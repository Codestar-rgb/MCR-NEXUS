'use client'

/**
 * 底部状态栏 v2
 *
 * 显示当前模式、节点/连线数、实时 FPS、快捷键提示
 */

import * as React from 'react'
import { useWorkspaceStore } from '@/stores/workspace'
import { useCanvasStore } from '@/stores/canvas'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/lib/utils'
import { Boxes, Zap, Activity, Cpu } from 'lucide-react'

/** FPS 监测 Hook */
function useFPS() {
  const [fps, setFps] = React.useState(60)
  React.useEffect(() => {
    let frame = 0
    let lastTime = performance.now()
    let rafId: number
    const tick = () => {
      frame++
      const now = performance.now()
      if (now - lastTime >= 1000) {
        setFps(Math.round((frame * 1000) / (now - lastTime)))
        frame = 0
        lastTime = now
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])
  return fps
}

/** 内存监测 Hook（仅 Chrome 支持） */
function useMemory() {
  const [memMB, setMemMB] = React.useState<number | null>(null)
  React.useEffect(() => {
    const update = () => {
      const perf = performance as unknown as { memory?: { usedJSHeapSize: number } }
      if (perf.memory) {
        setMemMB(Math.round(perf.memory.usedJSHeapSize / 1024 / 1024))
      }
    }
    update()
    const id = setInterval(update, 2000)
    return () => clearInterval(id)
  }, [])
  return memMB
}

/** 渲染时间监测 Hook */
function useRenderTime() {
  const [renderMs, setRenderMs] = React.useState(0)
  React.useEffect(() => {
    let rafId: number
    const measure = () => {
      const start = performance.now()
      rafId = requestAnimationFrame(() => {
        const duration = performance.now() - start
        setRenderMs(Math.round(duration * 10) / 10)
      })
    }
    const id = setInterval(measure, 1000)
    return () => { clearInterval(id); cancelAnimationFrame(rafId) }
  }, [])
  return renderMs
}

export function StatusBar() {
  const mode = useWorkspaceStore((s) => s.mode)
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const { t } = useI18n()
  const fps = useFPS()
  const mem = useMemory()
  const renderMs = useRenderTime()

  const fpsColor = fps >= 50 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-red-400'

  return (
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-border/30 bg-sidebar/20 px-3 text-[10px] text-muted-foreground/60">
      {/* 左侧：状态信息 */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Boxes className="h-3 w-3" />
          {nodes.length} {t('workspace.nodes')} · {edges.length} {t('workspace.edges')}
        </span>
        <span className="text-muted-foreground/30">|</span>
        <span className={cn(
          'flex items-center gap-1',
          mode === 'node' ? 'text-primary' : 'text-cyan-400'
        )}>
          <Zap className="h-3 w-3" />
          {mode === 'node' ? t('status.nodeMode') : t('status.codeMode')}
        </span>
        <span className="text-muted-foreground/30">|</span>
        {/* 实时 FPS */}
        <span className={cn('flex items-center gap-1 font-mono', fpsColor)} title="实时帧率">
          <Activity className="h-3 w-3" />
          {fps} FPS
        </span>
        {/* 内存（仅 Chrome） */}
        {mem !== null && (
          <span className="flex items-center gap-1 font-mono text-muted-foreground/50" title="已用内存">
            <Cpu className="h-3 w-3" />
            {mem} MB
          </span>
        )}
        {/* 渲染时间 */}
        <span className={cn(
          'flex items-center gap-0.5 font-mono',
          renderMs < 8 ? 'text-emerald-400/60' : renderMs < 16 ? 'text-amber-400/60' : 'text-red-400/60',
        )} title="单帧渲染时间">
          {renderMs}ms
        </span>
      </div>

      {/* 右侧：快捷键提示 */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border/40 px-1 py-px font-mono text-[9px]">Ctrl+C/V</kbd>
          {t('status.copyPaste')}
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border/40 px-1 py-px font-mono text-[9px]">Ctrl+D</kbd>
          克隆
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border/40 px-1 py-px font-mono text-[9px]">Ctrl+Z</kbd>
          {t('status.undo')}
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border/40 px-1 py-px font-mono text-[9px]">Ctrl+P</kbd>
          {t('status.search')}
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border/40 px-1 py-px font-mono text-[9px]">⇧+P</kbd>
          {t('status.command')}
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border/40 px-1 py-px font-mono text-[9px]">Ctrl+B</kbd>
          {t('status.build')}
        </span>
        <span className="text-muted-foreground/30">|</span>
        <span>UTF-8</span>
        <span className="text-muted-foreground/30">|</span>
        <span>Java 17</span>
        <span className="text-muted-foreground/30">|</span>
        <span>Forge 1.20.1</span>
      </div>
    </footer>
  )
}
