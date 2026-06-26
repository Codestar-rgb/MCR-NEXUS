'use client'

/**
 * 任务提示区
 *
 * 浮动在节点画布右上角（由父容器 absolute 定位，本组件只关心内容）。
 * - 订阅 workspace store.taskNotifications
 * - 每条通知一个气泡卡片：图标 + 标题 + 消息 + 操作按钮（可选）+ 关闭按钮 + 时间戳
 * - 多条垂直堆叠，最新在上
 * - 空状态：显示一个小铃铛按钮（无消息时收起，节省画布空间）
 * - framer-motion 进出场动画
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  X,
  RefreshCw,
  AlertTriangle,
  Info,
  XCircle,
  ChevronRight,
} from 'lucide-react'
import { useWorkspaceStore, type TaskNotification, type TaskNotificationType } from '@/stores/workspace'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** 通知类型 → 图标 + 主色 */
const TYPE_META: Record<
  TaskNotificationType,
  { icon: typeof Info; iconClass: string; bgClass: string; ringClass: string }
> = {
  sync: {
    icon: RefreshCw,
    iconClass: 'text-cyan-300',
    bgClass: 'bg-cyan-500/15',
    ringClass: 'border-cyan-500/40',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-300',
    bgClass: 'bg-amber-500/15',
    ringClass: 'border-amber-500/40',
  },
  info: {
    icon: Info,
    iconClass: 'text-emerald-300',
    bgClass: 'bg-emerald-500/15',
    ringClass: 'border-emerald-500/40',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-rose-300',
    bgClass: 'bg-rose-500/15',
    ringClass: 'border-rose-500/40',
  },
}

/** 把毫秒时间戳格式化为"刚刚 / x 分钟前" */
function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 30_000) return '刚刚'
  if (diff < 60_000) return '半分钟前'
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

interface NotificationBubbleProps {
  notification: TaskNotification
  onDismiss: (id: string) => void
}

function NotificationBubble({ notification, onDismiss }: NotificationBubbleProps) {
  const meta = TYPE_META[notification.type]
  const Icon = meta.icon

  const handleAction = () => {
    // 阶段 1 占位：仅打印 action key，阶段 2 由主代理 dispatch 真实动作
    console.log('[NexCube] notification action:', notification.action?.onClick)
    onDismiss(notification.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.9, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={cn(
        'relative overflow-hidden rounded-lg border bg-card/90 shadow-lg backdrop-blur-md',
        meta.ringClass,
      )}
    >
      <div className="flex items-start gap-2.5 p-3">
        {/* 图标 */}
        <span
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
            meta.bgClass,
          )}
        >
          <Icon className={cn('h-3.5 w-3.5', meta.iconClass)} />
        </span>

        {/* 文本 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {notification.title}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {formatRelative(notification.createdAt)}
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {notification.message}
          </p>

          {/* 操作按钮 */}
          {notification.action && (
            <button
              type="button"
              onClick={handleAction}
              className={cn(
                'mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium',
                'bg-primary/10 text-primary transition-colors hover:bg-primary/20',
              )}
            >
              {notification.action.label}
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* 关闭按钮 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDismiss(notification.id)}
          aria-label="关闭通知"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  )
}

export function TaskNotifications() {
  const notifications = useWorkspaceStore((s) => s.taskNotifications)
  const dismissNotification = useWorkspaceStore((s) => s.dismissNotification)
  const [expanded, setExpanded] = useState(true)

  // 空状态：只显示一个铃铛按钮
  if (notifications.length === 0) {
    return (
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="icon"
          aria-label="通知中心（当前无消息）"
          className="h-9 w-9 rounded-lg border border-border/50 bg-card/70 text-muted-foreground backdrop-blur-md hover:bg-accent"
        >
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {/* 折叠/展开切换按钮 */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/70 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground shadow backdrop-blur-md transition-colors hover:bg-accent hover:text-foreground"
        aria-expanded={expanded}
      >
        <Bell className="h-3.5 w-3.5" />
        <span>{notifications.length} 条通知</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex w-full flex-col gap-2 overflow-hidden"
          >
            <AnimatePresence initial={false}>
              {notifications.map((n) => (
                <NotificationBubble
                  key={n.id}
                  notification={n}
                  onDismiss={dismissNotification}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
