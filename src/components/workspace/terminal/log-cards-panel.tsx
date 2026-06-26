'use client'

/**
 * NexCube 日志卡片列表面板（Task 5-A）
 *
 * 显示终端构建日志解析出的所有 ParsedLogCard：
 *   - 顶部工具栏：卡片总数 + level 计数徽章 + ToggleGroup 筛选（全部/仅错误/仅警告）+ 清除全部
 *   - 卡片列表：垂直排列，可滚动，使用 AnimatePresence 进出场
 *   - 空状态：
 *     · 包含 GRADLE-BUILD-SUCCESS 且无 error → 「构建成功，无错误」
 *     · 全部 dismissed / 无卡片            → 「暂无日志」
 *
 * 关闭单卡片：仅从 UI 隐藏（dismissed set），不改原日志。
 * 清除全部：将所有卡片加入 dismissed set + 触发 onClearAll 回调（让父组件清空 cards state）。
 */

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, FileSearch, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import type { ParsedLogCard } from '@/lib/capabilities'
import { LogCard } from './log-card'

export interface LogCardsPanelProps {
  cards: ParsedLogCard[]
  /** 修复按钮回调（透传给每张卡片的 onFix） */
  onFix?: (card: ParsedLogCard) => void | Promise<void>
  /** 清除全部回调（让父组件清空 cards state） */
  onClearAll?: () => void
  className?: string
}

type Filter = 'all' | 'error' | 'warn'

export function LogCardsPanel({
  cards,
  onFix,
  onClearAll,
  className,
}: LogCardsPanelProps) {
  const [filter, setFilter] = React.useState<Filter>('all')
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set())

  // cards 变化时，清除已不在列表中的 dismissed 项
  React.useEffect(() => {
    setDismissed((prev) => {
      const next = new Set<string>()
      const ids = new Set(cards.map((c) => c.id))
      for (const id of prev) {
        if (ids.has(id)) next.add(id)
      }
      return next.size === prev.size ? prev : next
    })
  }, [cards])

  const errorCount = React.useMemo(
    () => cards.filter((c) => c.level === 'error').length,
    [cards],
  )
  const warnCount = React.useMemo(
    () => cards.filter((c) => c.level === 'warn').length,
    [cards],
  )
  const infoCount = React.useMemo(
    () => cards.filter((c) => c.level === 'info').length,
    [cards],
  )

  const visibleCards = React.useMemo(() => {
    return cards.filter((c) => {
      if (dismissed.has(c.id)) return false
      if (filter === 'all') return true
      return c.level === filter
    })
  }, [cards, filter, dismissed])

  const handleClose = React.useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const handleClearAll = React.useCallback(() => {
    setDismissed(new Set(cards.map((c) => c.id)))
    onClearAll?.()
  }, [cards, onClearAll])

  // 空状态判定
  const isEmpty = visibleCards.length === 0
  const hasCards = cards.length > 0
  const allDismissed = hasCards && cards.every((c) => dismissed.has(c.id))
  const buildSuccess =
    hasCards &&
    cards.some((c) => c.ruleId === 'GRADLE-BUILD-SUCCESS') &&
    errorCount === 0

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col bg-zinc-950/40',
        className,
      )}
      role="region"
      aria-label="日志解析卡片"
    >
      {/* 顶部工具栏 */}
      <div className="flex h-8 shrink-0 items-center justify-between gap-2 border-b border-zinc-800/60 bg-zinc-900/60 px-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px]">
          <span className="font-medium text-zinc-300">错误卡片</span>
          <span className="text-zinc-500">({cards.length})</span>
          {errorCount > 0 && (
            <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-medium text-rose-300">
              {errorCount} 错误
            </span>
          )}
          {warnCount > 0 && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
              {warnCount} 警告
            </span>
          )}
          {infoCount > 0 && (
            <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300">
              {infoCount} 信息
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(v) => {
              if (v) setFilter(v as Filter)
            }}
            variant="outline"
            className="h-6"
            aria-label="筛选卡片"
          >
            <ToggleGroupItem
              value="all"
              className="h-6 px-2 text-[10px] font-medium"
            >
              全部
            </ToggleGroupItem>
            <ToggleGroupItem
              value="error"
              className="h-6 px-2 text-[10px] font-medium"
            >
              仅错误
            </ToggleGroupItem>
            <ToggleGroupItem
              value="warn"
              className="h-6 px-2 text-[10px] font-medium"
            >
              仅警告
            </ToggleGroupItem>
          </ToggleGroup>

          {hasCards && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearAll}
              className="h-6 gap-1 px-2 text-[10px] font-medium text-zinc-400 hover:text-rose-300"
              aria-label="清除全部卡片"
            >
              <Trash2 className="h-3 w-3" />
              清除
            </Button>
          )}
        </div>
      </div>

      {/* 卡片列表 */}
      <div className="nexcube-scroll min-h-0 flex-1 overflow-y-auto p-2">
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center"
          >
            {buildSuccess ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <p className="text-xs font-medium text-emerald-300">
                  构建成功，无错误
                </p>
                <p className="text-[10px] text-zinc-500">
                  可继续下一步操作：导出 JAR / 启动测试
                </p>
              </>
            ) : allDismissed ? (
              <>
                <FileSearch className="h-8 w-8 text-zinc-500" />
                <p className="text-xs text-zinc-400">已清空所有卡片</p>
                <p className="text-[10px] text-zinc-500">
                  重新构建将再次解析日志
                </p>
              </>
            ) : (
              <>
                <FileSearch className="h-8 w-8 text-zinc-500" />
                <p className="text-xs text-zinc-400">暂无日志</p>
                <p className="text-[10px] text-zinc-500">
                  点击「构建 JAR」开始构建，完成后将自动解析
                </p>
              </>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {visibleCards.map((card) => (
                <LogCard
                  key={card.id}
                  card={card}
                  onFix={onFix}
                  onClose={handleClose}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
