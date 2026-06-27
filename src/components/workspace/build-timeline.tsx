'use client'

/**
 * 构建历史时间线
 *
 * 可视化展示项目的构建历史：
 * - 时间轴排列（最新在上）
 * - 每条记录：任务名 + 状态徽章 + 耗时 + 时间
 * - 点击展开查看完整日志
 * - 可清空历史
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle2, XCircle, Loader2, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BuildEntry {
  id: string
  task: string
  status: 'success' | 'failed' | 'running'
  duration: number | null
  createdAt: string
  outputPreview: string
  cardCount: number
}

interface BuildTimelineProps {
  projectId: string | null
  className?: string
}

export function BuildTimeline({ projectId, className }: BuildTimelineProps) {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const { data: builds = [] } = useQuery<BuildEntry[]>({
    queryKey: ['builds', projectId],
    queryFn: async () => {
      if (!projectId) return []
      const res = await fetch(`/api/projects/${projectId}/builds`)
      if (!res.ok) return []
      const data = await res.json()
      return data.builds ?? []
    },
    enabled: !!projectId,
    retry: false,
  })

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/builds`, { method: 'DELETE' })
      if (!res.ok) throw new Error('failed')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds', projectId] })
      toast.success('构建历史已清空')
    },
  })

  if (builds.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2 py-8 text-center', className)}>
        <Clock className="h-6 w-6 text-muted-foreground/30" />
        <p className="text-[11px] text-muted-foreground">暂无构建记录</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] font-medium text-muted-foreground">
          构建历史 ({builds.length})
        </span>
        <button
          onClick={() => clearMutation.mutate()}
          className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
          清空
        </button>
      </div>

      {/* 时间线 */}
      <div className="nexcube-scroll flex-1 overflow-y-auto px-2 pb-2">
        <div className="relative">
          {/* 竖线 */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/40" />

          {builds.map((build, idx) => (
            <BuildTimelineItem
              key={build.id}
              build={build}
              isExpanded={expandedId === build.id}
              onToggle={() => setExpandedId(expandedId === build.id ? null : build.id)}
              index={idx}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function BuildTimelineItem({
  build,
  isExpanded,
  onToggle,
  index,
}: {
  build: BuildEntry
  isExpanded: boolean
  onToggle: () => void
  index: number
}) {
  const time = React.useMemo(() => {
    try {
      return new Date(build.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return '—'
    }
  }, [build.createdAt])

  const isSuccess = build.status === 'success'
  const isRunning = build.status === 'running'

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="relative mb-1 pl-8"
    >
      {/* 时间线节点 */}
      <div
        className={cn(
          'absolute left-[11px] top-3 h-[10px] w-[10px] rounded-full border-2 border-background',
          isSuccess ? 'bg-emerald-400' : isRunning ? 'bg-amber-400 animate-pulse' : 'bg-rose-400',
        )}
      />

      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/30"
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/60" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
        )}
        <span className="shrink-0">
          {isSuccess ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          ) : isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-rose-400" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-foreground">{build.task}</span>
            {build.duration != null && (
              <span className="text-[9px] text-muted-foreground/60">{(build.duration / 1000).toFixed(1)}s</span>
            )}
          </div>
          <div className="text-[9px] text-muted-foreground/50">{time}</div>
        </div>
        {build.cardCount > 0 && (
          <span className="shrink-0 rounded-full bg-amber-500/10 px-1.5 py-px text-[9px] text-amber-400">
            {build.cardCount}
          </span>
        )}
      </button>

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <pre className="nexcube-scroll mt-1 max-h-40 overflow-y-auto rounded-md border border-border/30 bg-muted/20 p-2 text-[10px] font-mono text-muted-foreground">
              {build.outputPreview || '（无输出预览）'}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
