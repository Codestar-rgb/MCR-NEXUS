'use client'

/**
 * 对齐工具栏
 *
 * 选中 2+ 节点时浮动显示在画布顶部偏右。
 * 提供 8 种对齐方式：
 *  - 左对齐 / 右对齐 / 顶对齐 / 底对齐
 *  - 水平居中 / 垂直居中
 *  - 水平等距分布 / 垂直等距分布
 */

import { motion, AnimatePresence } from 'framer-motion'
import {
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignCenterVertical,
  AlignCenterHorizontal,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
} from 'lucide-react'
import { useCanvasStore, type AlignMode } from '@/stores/canvas'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ALIGN_TOOLS: Array<{ mode: AlignMode; icon: React.ComponentType<{ className?: string }>; label: string; needs3?: boolean }> = [
  { mode: 'left', icon: AlignStartVertical, label: '左对齐' },
  { mode: 'h-center', icon: AlignCenterVertical, label: '水平居中' },
  { mode: 'right', icon: AlignEndVertical, label: '右对齐' },
  { mode: 'h-distribute', icon: AlignHorizontalSpaceAround, label: '水平等距', needs3: true },
  { mode: 'top', icon: AlignStartHorizontal, label: '顶对齐' },
  { mode: 'v-center', icon: AlignCenterHorizontal, label: '垂直居中' },
  { mode: 'bottom', icon: AlignEndHorizontal, label: '底对齐' },
  { mode: 'v-distribute', icon: AlignVerticalSpaceAround, label: '垂直等距', needs3: true },
]

export function AlignToolbar() {
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds)
  const alignSelected = useCanvasStore((s) => s.alignSelected)

  const show = selectedNodeIds.length >= 2
  const has3 = selectedNodeIds.length >= 3

  const handleAlign = (mode: AlignMode, label: string) => {
    alignSelected(mode)
    toast.success(`已${label} ${selectedNodeIds.length} 个节点`)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="glass absolute right-3 top-14 z-20 flex items-center gap-0.5 rounded-lg border border-border/40 p-1 shadow-lg"
        >
          {ALIGN_TOOLS.map((tool, idx) => {
            const Icon = tool.icon
            const disabled = tool.needs3 && !has3
            return (
              <button
                key={tool.mode}
                onClick={() => !disabled && handleAlign(tool.mode, tool.label)}
                disabled={disabled}
                title={tool.label + (disabled ? '（需 3+ 节点）' : '')}
                aria-label={tool.label}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded transition-colors',
                  disabled
                    ? 'text-muted-foreground/20 cursor-not-allowed'
                    : 'text-muted-foreground hover:bg-accent hover:text-primary',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
