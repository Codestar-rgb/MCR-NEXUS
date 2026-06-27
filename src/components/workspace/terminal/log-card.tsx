'use client'

/**
 * NexCube 单条日志卡片（Task 5-A）
 *
 * 展示一条 ParsedLogCard：
 *   - 标题栏：level 图标 + 中文标题 + level 徽章 + ruleId + 关闭按钮
 *   - 原文（可折叠）：font-mono 英文日志片段
 *   - 原因分析：📋 中文
 *   - 建议操作：💡 中文 + 修复按钮（emerald，仅当 fixAction 存在）
 *   - 修复动作 key 展示：🔧 显示 fixAction.action 字符串
 *
 * 视觉规范：
 *   - level=error → rose
 *   - level=warn  → amber
 *   - level=info  → cyan
 *   - 左侧 4px 色条
 *   - framer-motion 进出场动画
 *   - 深色背景（zinc-900/60）+ 圆角 + 边框
 */

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Info,
  Loader2,
  Wand2,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { listItemTransition } from '@/components/providers/framer-provider'
import { cn } from '@/lib/utils'
import type { ParsedLogCard } from '@/lib/capabilities'

export interface LogCardProps {
  card: ParsedLogCard
  /** 修复按钮回调（传入完整 card，由消费方调用 executeFixAction） */
  onFix?: (card: ParsedLogCard) => void | Promise<void>
  /** 关闭按钮回调（仅移除 UI 上的卡片，不改日志） */
  onClose?: (id: string) => void
}

type LevelKey = 'error' | 'warn' | 'info'

interface LevelMeta {
  icon: React.ComponentType<{ className?: string }>
  label: string
  /** 色条 / 图标 / 徽章颜色 */
  bar: string
  iconColor: string
  titleColor: string
  headerBg: string
  badge: string
}

const LEVEL_META: Record<LevelKey, LevelMeta> = {
  error: {
    icon: AlertCircle,
    label: '错误',
    bar: 'bg-rose-500',
    iconColor: 'text-rose-400',
    titleColor: 'text-rose-100',
    headerBg: 'bg-rose-500/5',
    badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  },
  warn: {
    icon: AlertTriangle,
    label: '警告',
    bar: 'bg-amber-500',
    iconColor: 'text-amber-400',
    titleColor: 'text-amber-100',
    headerBg: 'bg-amber-500/5',
    badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
  info: {
    icon: Info,
    label: '信息',
    bar: 'bg-cyan-500',
    iconColor: 'text-cyan-400',
    titleColor: 'text-cyan-100',
    headerBg: 'bg-cyan-500/5',
    badge: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  },
}

export function LogCard({ card, onFix, onClose }: LogCardProps) {
  const [expanded, setExpanded] = React.useState(true)
  const [fixing, setFixing] = React.useState(false)

  const meta = LEVEL_META[card.level]
  const Icon = meta.icon

  const handleFix = async () => {
    if (!onFix || !card.fixAction) return
    setFixing(true)
    try {
      await onFix(card)
    } finally {
      setFixing(false)
    }
  }

  const lineRange = card.lineRange
    ? `行 ${card.lineRange[0]}-${card.lineRange[1]}`
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -16, scale: 0.94 }}
      transition={listItemTransition}
      className={cn(
        'relative overflow-hidden rounded-md border border-zinc-800/80',
        'bg-zinc-900/60 shadow-sm backdrop-blur-sm',
      )}
      style={{ willChange: 'transform, opacity' }}
      role="article"
      aria-label={`日志卡片：${card.title}`}
    >
      {/* 左侧色条（4px） */}
      <div
        className={cn('absolute left-0 top-0 h-full w-1', meta.bar)}
        aria-hidden
      />

      {/* 标题栏 */}
      <div
        className={cn(
          'flex items-center gap-2 border-b border-zinc-800/60 px-3 py-2 pl-3.5',
          meta.headerBg,
        )}
      >
        <Icon className={cn('h-3.5 w-3.5 shrink-0', meta.iconColor)} />
        <h4
          className={cn(
            'min-w-0 flex-1 truncate text-xs font-semibold',
            meta.titleColor,
          )}
          title={card.title}
        >
          {card.title}
        </h4>
        <Badge
          variant="outline"
          className={cn(
            'h-4 shrink-0 px-1.5 text-[10px] font-medium uppercase tracking-wide',
            meta.badge,
          )}
        >
          {meta.label}
        </Badge>
        {card.ruleId && (
          <span
            className="hidden shrink-0 font-mono text-[10px] text-zinc-500 sm:inline"
            title="规则 ID"
          >
            {card.ruleId}
          </span>
        )}
        {onClose && (
          <button
            type="button"
            onClick={() => onClose(card.id)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="关闭卡片"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* 内容 */}
      <div className="space-y-2 px-3 py-2 pl-3.5">
        {/* 原文（可折叠） */}
        <div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 transition-colors hover:text-zinc-200"
            aria-expanded={expanded}
            aria-label={expanded ? '折叠原文' : '展开原文'}
          >
            <ChevronRight
              className={cn(
                'h-3 w-3 transition-transform',
                expanded && 'rotate-90',
              )}
            />
            <span>原文</span>
            {lineRange && (
              <span className="ml-1 text-[10px] text-zinc-500">
                · {lineRange}
              </span>
            )}
          </button>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.pre
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'mt-1 max-h-48 overflow-auto rounded bg-zinc-950/80 p-2',
                  'whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-zinc-300',
                  'nexcube-scroll',
                )}
              >
                {card.originalText}
              </motion.pre>
            )}
          </AnimatePresence>
        </div>

        {/* 原因分析 */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-300">
            <span aria-hidden>📋</span>
            <span>原因分析</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-400">
            {card.analysis}
          </p>
        </div>

        {/* 建议操作 */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-300">
            <span aria-hidden>💡</span>
            <span>建议操作</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-400">
            {card.suggestion}
          </p>
          {card.fixAction && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Button
                size="sm"
                onClick={handleFix}
                disabled={fixing}
                className={cn(
                  'h-6 gap-1 rounded-md px-2 text-[11px] font-medium shadow-none',
                  'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
                  'hover:bg-emerald-500/25 hover:text-emerald-200',
                  'disabled:opacity-70',
                )}
                aria-label={card.fixAction.label}
              >
                {fixing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Wand2 className="h-3 w-3" />
                )}
                {card.fixAction.label}
              </Button>
              <span className="text-[10px] text-zinc-500">一键修复</span>
            </div>
          )}
        </div>

        {/* 自动修复动作 key 展示 */}
        {card.fixAction && (
          <div className="rounded border border-zinc-800/60 bg-zinc-950/40 px-2 py-1.5">
            <div className="flex flex-wrap items-center gap-1 text-[10px] font-medium text-zinc-400">
              <span aria-hidden>🔧</span>
              <span>修复动作：</span>
              <code className="rounded bg-zinc-800/60 px-1 py-0.5 font-mono text-[9px] text-zinc-300">
                {card.fixAction.action}
              </code>
              {card.fixAction.payload &&
                Object.keys(card.fixAction.payload).length > 0 && (
                  <code className="rounded bg-zinc-800/40 px-1 py-0.5 font-mono text-[9px] text-zinc-500">
                    {JSON.stringify(card.fixAction.payload)}
                  </code>
                )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
