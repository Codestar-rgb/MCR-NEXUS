'use client'

/**
 * 底部状态栏
 *
 * 显示当前模式、节点/连线数、快捷键提示
 */

import { useWorkspaceStore } from '@/stores/workspace'
import { useCanvasStore } from '@/stores/canvas'
import { cn } from '@/lib/utils'
import { Boxes, GitBranch, Zap } from 'lucide-react'

export function StatusBar() {
  const mode = useWorkspaceStore((s) => s.mode)
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)

  return (
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-border/30 bg-sidebar/20 px-3 text-[10px] text-muted-foreground/60">
      {/* 左侧：状态信息 */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          main
        </span>
        <span className="text-muted-foreground/30">|</span>
        <span className="flex items-center gap-1">
          <Boxes className="h-3 w-3" />
          {nodes.length} 节点 · {edges.length} 连线
        </span>
        <span className="text-muted-foreground/30">|</span>
        <span className={cn(
          'flex items-center gap-1',
          mode === 'node' ? 'text-primary' : 'text-cyan-400'
        )}>
          <Zap className="h-3 w-3" />
          {mode === 'node' ? '节点模式' : '代码模式'}
        </span>
      </div>

      {/* 右侧：快捷键提示 */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border/40 px-1 py-px font-mono text-[9px]">Ctrl+P</kbd>
          搜索
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border/40 px-1 py-px font-mono text-[9px]">Ctrl+/</kbd>
          切换模式
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border/40 px-1 py-px font-mono text-[9px]">Ctrl+B</kbd>
          构建
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
