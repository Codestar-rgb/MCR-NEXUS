'use client'

/**
 * NexCube 构建历史面板（Task 5-C）
 *
 * 用 Sheet（侧滑抽屉）展示某个项目的构建历史：
 *  - 列表：任务名 + 状态徽章 + 耗时 + 相对时间
 *  - 点击单条 → 弹出详情 Dialog（完整日志 + 解析卡片）
 *  - 清空按钮：DELETE /api/projects/[id]/builds
 *
 * 数据源：
 *  - 列表：GET /api/projects/[id]/builds（TanStack Query 缓存）
 *  - 详情：GET /api/projects/[id]/builds/[buildId]（按需查询）
 *  - 写入：由 terminal-panel.tsx 完成构建后调用 POST + invalidate
 */

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Hammer,
  Loader2,
  Play,
  Server,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ParsedLogCard } from '@/lib/capabilities/types'

/* ------------------------------------------------------------------ */
/* 类型与常量                                                          */
/* ------------------------------------------------------------------ */

interface BuildHistoryItem {
  id: string
  projectId: string
  status: string
  task: string
  duration: number | null
  createdAt: string
  outputPreview: string
  cardCount: number
}

interface BuildDetail {
  id: string
  projectId: string
  status: string
  task: string
  duration: number | null
  createdAt: string
  output: string
  parsedCards: ParsedLogCard[]
}

const TASK_LABELS: Record<string, string> = {
  build: '构建 JAR',
  runClient: '启动客户端',
  runServer: '启动服务端',
  clean: '清理',
}

const TASK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  build: Hammer,
  runClient: Play,
  runServer: Server,
  clean: Trash2,
}

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return '-'
  if (ms < 1000) return `${ms}ms`
  const sec = ms / 1000
  if (sec < 60) return `${sec.toFixed(1)}s`
  const min = Math.floor(sec / 60)
  const rem = Math.round(sec % 60)
  return `${min}m${rem}s`
}

function formatTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), {
      addSuffix: true,
      locale: zhCN,
    })
  } catch {
    return iso
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'success':
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        >
          <CheckCircle2 className="mr-1 h-3 w-3" />
          成功
        </Badge>
      )
    case 'failed':
      return (
        <Badge
          variant="outline"
          className="border-rose-500/30 bg-rose-500/10 text-rose-300"
        >
          <XCircle className="mr-1 h-3 w-3" />
          失败
        </Badge>
      )
    case 'running':
      return (
        <Badge
          variant="outline"
          className="border-teal-500/30 bg-teal-500/10 text-teal-300"
        >
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          进行中
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" />
          {status}
        </Badge>
      )
  }
}

/* ------------------------------------------------------------------ */
/* 详情对话框                                                          */
/* ------------------------------------------------------------------ */

interface DetailDialogProps {
  item: BuildHistoryItem | null
  projectId: string
  onClose: () => void
}

function DetailDialog({ item, projectId, onClose }: DetailDialogProps) {
  const { data, isLoading, isError } = useQuery<BuildDetail>({
    queryKey: ['builds', projectId, item?.id, 'detail'],
    queryFn: async () => {
      if (!item) throw new Error('no_item')
      const res = await fetch(
        `/api/projects/${projectId}/builds/${item.id}`,
        { cache: 'no-store' },
      )
      if (!res.ok) throw new Error('failed_to_load_build_detail')
      return (await res.json()) as BuildDetail
    },
    enabled: !!item,
    retry: false,
  })

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-hidden bg-zinc-950 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {item && (() => {
              const Icon = TASK_ICONS[item.task] ?? Hammer
              return <Icon className="h-4 w-4 text-emerald-400" />
            })()}
            {item ? TASK_LABELS[item.task] ?? item.task : ''} · 构建详情
            {item && statusBadge(item.status)}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {item
              ? `${formatTime(item.createdAt)} · 耗时 ${formatDuration(item.duration)} · ${item.cardCount} 张解析卡片`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 px-1">
            {/* 解析卡片 */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                加载详情中…
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-xs text-rose-300">
                <AlertCircle className="h-5 w-5" />
                加载失败
              </div>
            ) : (
              <>
                {data?.parsedCards && data.parsedCards.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                      <Sparkles className="h-3.5 w-3.5" />
                      智能解析（{data.parsedCards.length}）
                    </div>
                    {data.parsedCards.map((card) => (
                      <div
                        key={card.id}
                        className={cn(
                          'rounded-md border p-3 text-xs',
                          card.level === 'error' &&
                            'border-rose-500/30 bg-rose-500/5',
                          card.level === 'warn' &&
                            'border-amber-500/30 bg-amber-500/5',
                          card.level === 'info' &&
                            'border-teal-500/30 bg-teal-500/5',
                        )}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          {card.level === 'error' && (
                            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                          )}
                          <span className="font-semibold text-zinc-100">
                            {card.title}
                          </span>
                          <Badge
                            variant="outline"
                            className="ml-auto text-[10px] text-muted-foreground"
                          >
                            {card.ruleId ?? card.level}
                          </Badge>
                        </div>
                        {card.originalText && (
                          <pre className="mb-2 overflow-x-auto whitespace-pre-wrap rounded bg-zinc-900/60 p-2 font-mono text-[11px] text-zinc-400">
                            {card.originalText}
                          </pre>
                        )}
                        <p className="mb-1 text-zinc-300">
                          <span className="text-muted-foreground">原因：</span>
                          {card.analysis}
                        </p>
                        <p className="text-zinc-300">
                          <span className="text-muted-foreground">建议：</span>
                          {card.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 原始日志 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                    <Hammer className="h-3.5 w-3.5" />
                    原始日志
                  </div>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-zinc-800 bg-black p-3 font-mono text-[11px] leading-relaxed text-emerald-300">
                    {data?.output || '(无日志)'}
                  </pre>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* 主组件：构建历史面板（Sheet）                                       */
/* ------------------------------------------------------------------ */

export interface BuildHistoryPanelProps {
  /** 受控开合 */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 项目 ID */
  projectId: string | null
}

export function BuildHistoryPanel({
  open,
  onOpenChange,
  projectId,
}: BuildHistoryPanelProps) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = React.useState<BuildHistoryItem | null>(null)

  const { data, isLoading, isError } = useQuery<BuildHistoryItem[]>({
    queryKey: ['builds', projectId],
    queryFn: async () => {
      if (!projectId) return []
      const res = await fetch(`/api/projects/${projectId}/builds`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('failed_to_load_builds')
      return (await res.json()) as BuildHistoryItem[]
    },
    enabled: !!projectId && open,
    placeholderData: (prev) => prev ?? [],
    retry: false,
  })

  const clearMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error('no_project')
      const res = await fetch(`/api/projects/${projectId}/builds`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('failed_to_clear')
      return res.json()
    },
    onSuccess: () => {
      toast.success('构建历史已清空')
      void queryClient.invalidateQueries({
        queryKey: ['builds', projectId],
      })
    },
    onError: () => {
      toast.error('清空失败')
    },
  })

  const items = data ?? []

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 border-l border-zinc-800 bg-zinc-950 p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-zinc-800 px-4 py-3">
            <SheetTitle className="flex items-center gap-2 text-sm text-zinc-100">
              <Hammer className="h-4 w-4 text-emerald-400" />
              构建历史
              {items.length > 0 && (
                <Badge
                  variant="outline"
                  className="ml-1 text-[10px] text-muted-foreground"
                >
                  {items.length}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription className="text-xs">
              最近 20 条构建记录，点击查看详情
            </SheetDescription>
          </SheetHeader>

          {/* 工具栏 */}
          <div className="flex items-center justify-between border-b border-zinc-800/60 px-4 py-2">
            <span className="text-[11px] text-muted-foreground">
              {items.length === 0 ? '暂无记录' : `共 ${items.length} 条`}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={items.length === 0 || clearMutation.isPending}
              onClick={() => clearMutation.mutate()}
              className="h-7 gap-1 px-2 text-[11px] text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="h-3 w-3" />
              清空
            </Button>
          </div>

          {/* 列表 */}
          <ScrollArea className="flex-1">
            <div className="min-h-full">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  加载中…
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-xs text-rose-300">
                  <AlertCircle className="h-5 w-5" />
                  加载失败
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-xs text-muted-foreground">
                  <Hammer className="h-6 w-6 opacity-40" />
                  <p>暂无构建历史</p>
                  <p className="text-[10px] opacity-70">
                    点击终端工具栏的「构建 JAR」开始第一次构建
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-900">
                  {items.map((item) => {
                    const Icon = TASK_ICONS[item.task] ?? Hammer
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className={cn(
                            'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                            'hover:bg-zinc-900/60',
                            'focus:bg-zinc-900/80 focus:outline-none',
                          )}
                        >
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-emerald-400">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-xs font-medium text-zinc-100">
                                {TASK_LABELS[item.task] ?? item.task}
                              </span>
                              {statusBadge(item.status)}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {formatDuration(item.duration)}
                              </span>
                              <span>·</span>
                              <span>{formatTime(item.createdAt)}</span>
                              {item.cardCount > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="flex items-center gap-0.5 text-amber-400">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    {item.cardCount}
                                  </span>
                                </>
                              )}
                            </div>
                            {item.outputPreview && (
                              <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground/70">
                                {item.outputPreview}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* 详情对话框 */}
      <DetailDialog
        item={selected}
        projectId={projectId ?? ''}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
