'use client'

/**
 * 任务提示区 —— Task 4-C 集成同步状态
 *
 * 浮动在节点画布右上角（由父容器 absolute 定位，本组件只关心内容）。
 *
 * 通知来源：
 *  1. workspace store.taskNotifications —— 持久化的通用通知（mock + 后续真实事件源）
 *  2. sync store.syncResult —— 当前代码 → 节点同步结果（Task 4-C）
 *     a. blackboxBlocks → 警告"检测到 N 处代码无法同步到节点"
 *     b. highRiskChanges → 错误"检测到 N 处高风险修改" + AlertDialog
 *     c. nodeUpdates → sync"代码已变更，N 处属性待应用" + "一键应用"按钮
 *
 * 高风险修改（类名/mod ID/注册删除）会触发 AlertDialog：
 *  - 用户点击"应用并保留代码"→ 应用 nodeUpdates + 关闭对话框
 *  - 用户点击"取消"→ 丢弃 nodeUpdates + 关闭对话框
 *  - 代码改动始终保留（用户已写的代码不被回滚）
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
  Code2,
  Check,
  ShieldAlert,
} from 'lucide-react'
import {
  useWorkspaceStore,
  type TaskNotification,
  type TaskNotificationType,
} from '@/stores/workspace'
import {
  useSyncStore,
  selectBlackboxCount,
  selectHighRiskCount,
  selectPendingUpdateCount,
  selectHasSyncActivity,
  formatHighRiskChanges,
} from '@/stores/sync'
import { useCanvasStore } from '@/stores/canvas'
import { applyNodeUpdates } from '@/stores/sync'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
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

/* ------------------------------------------------------------------ */
/* 通用通知气泡                                                        */
/* ------------------------------------------------------------------ */

interface NotificationBubbleProps {
  notification: TaskNotification
  onDismiss: (id: string) => void
}

function NotificationBubble({ notification, onDismiss }: NotificationBubbleProps) {
  const meta = TYPE_META[notification.type]
  const Icon = meta.icon

  const handleAction = () => {
    // 阶段 1 占位：仅打印 action key
    // notification action dispatched
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
        <span
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
            meta.bgClass,
          )}
        >
          <Icon className={cn('h-3.5 w-3.5', meta.iconClass)} />
        </span>

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

/* ------------------------------------------------------------------ */
/* 同步通知气泡（Task 4-C）                                            */
/* ------------------------------------------------------------------ */

interface SyncBubbleProps {
  variant: 'blackbox' | 'highRisk' | 'pendingSync'
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  onDismiss?: () => void
}

const SYNC_VARIANT_META: Record<
  SyncBubbleProps['variant'],
  { icon: typeof Info; iconClass: string; bgClass: string; ringClass: string }
> = {
  blackbox: {
    icon: Code2,
    iconClass: 'text-amber-300',
    bgClass: 'bg-amber-500/15',
    ringClass: 'border-amber-500/40',
  },
  highRisk: {
    icon: ShieldAlert,
    iconClass: 'text-rose-300',
    bgClass: 'bg-rose-500/15',
    ringClass: 'border-rose-500/40',
  },
  pendingSync: {
    icon: RefreshCw,
    iconClass: 'text-cyan-300',
    bgClass: 'bg-cyan-500/15',
    ringClass: 'border-cyan-500/40',
  },
}

function SyncBubble({
  variant,
  title,
  message,
  actionLabel,
  onAction,
  onDismiss,
}: SyncBubbleProps) {
  const meta = SYNC_VARIANT_META[variant]
  const Icon = meta.icon

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
        <span
          className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
            meta.bgClass,
          )}
        >
          <Icon className={cn('h-3.5 w-3.5', meta.iconClass)} />
        </span>

        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {title}
          </span>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {message}
          </p>

          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className={cn(
                'mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium',
                'bg-primary/10 text-primary transition-colors hover:bg-primary/20',
              )}
            >
              {actionLabel}
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            aria-label="关闭同步提示"
            className="h-6 w-6 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* 高风险修改确认对话框（Task 4-C）                                    */
/* ------------------------------------------------------------------ */

function HighRiskSyncDialog() {
  const showRiskDialog = useSyncStore((s) => s.showRiskDialog)
  const syncResult = useSyncStore((s) => s.syncResult)
  const setShowRiskDialog = useSyncStore((s) => s.setShowRiskDialog)
  const setPendingSync = useSyncStore((s) => s.setPendingSync)
  const clearSync = useSyncStore((s) => s.clearSync)
  const updateNodeData = useCanvasStore((s) => s.updateNodeData)

  const handleConfirm = () => {
    // 应用所有节点更新
    if (syncResult && syncResult.nodeUpdates.length > 0) {
      applyNodeUpdates(
        syncResult.nodeUpdates,
        updateNodeData,
        (id) => {
          const n = useCanvasStore.getState().nodes.find((x) => x.id === id)
          return n as
            | { data: { properties?: Record<string, unknown> } }
            | undefined
        },
      )
    }
    // 高风险变更不应用（用户已确认看到，代码改动保留）
    setPendingSync(false)
    setShowRiskDialog(false)
    clearSync()
  }

  const handleCancel = () => {
    // 丢弃所有 nodeUpdates，恢复节点状态
    setPendingSync(false)
    setShowRiskDialog(false)
    clearSync()
  }

  if (!syncResult) return null

  const highRiskText = formatHighRiskChanges(syncResult.highRiskChanges)

  return (
    <AlertDialog open={showRiskDialog} onOpenChange={setShowRiskDialog}>
      <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-500" />
            检测到 {syncResult.highRiskChanges.length} 处高风险修改
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                以下修改可能影响 Forge 注册，需您确认是否应用：
              </p>
              <pre className="max-h-60 overflow-y-auto rounded-md bg-rose-500/5 p-3 font-mono text-[11px] leading-relaxed text-rose-200 ring-1 ring-rose-500/20">
{highRiskText}
              </pre>
              {syncResult.nodeUpdates.length > 0 && (
                <p className="text-cyan-300">
                  同时有 {syncResult.nodeUpdates.length} 处属性更新待应用。
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                ⚠️ 高风险修改本身不会被回滚到节点（代码改动保留），
                您可以选择应用其他属性更新或全部取消。
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            取消（丢弃属性更新）
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            <Check className="mr-1 h-4 w-4" />
            应用属性更新（保留代码）
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/* ------------------------------------------------------------------ */
/* 同步通知集合（Task 4-C）                                            */
/* ------------------------------------------------------------------ */

function SyncNotifications() {
  const syncResult = useSyncStore((s) => s.syncResult)
  const blackboxCount = useSyncStore(selectBlackboxCount)
  const highRiskCount = useSyncStore(selectHighRiskCount)
  const pendingUpdateCount = useSyncStore(selectPendingUpdateCount)
  const hasSyncActivity = useSyncStore(selectHasSyncActivity)
  const pendingSync = useSyncStore((s) => s.pendingSync)
  const setShowRiskDialog = useSyncStore((s) => s.setShowRiskDialog)
  const clearSync = useSyncStore((s) => s.clearSync)
  const updateNodeData = useCanvasStore((s) => s.updateNodeData)

  // 应用普通节点更新（非高风险时）
  const handleApplyNodeUpdates = () => {
    if (!syncResult) return
    applyNodeUpdates(
      syncResult.nodeUpdates,
      updateNodeData,
      (id) => {
        const n = useCanvasStore.getState().nodes.find((x) => x.id === id)
        return n as
          | { data: { properties?: Record<string, unknown> } }
          | undefined
      },
    )
    clearSync()
  }

  if (!hasSyncActivity) return null

  return (
    <AnimatePresence initial={false}>
      {/* 1. 黑盒块通知 */}
      {blackboxCount > 0 && (
        <SyncBubble
          key="sync-blackbox"
          variant="blackbox"
          title={`检测到 ${blackboxCount} 处代码无法同步到节点`}
          message={
            syncResult?.blackboxBlocks[0]?.code
              ? `如："${syncResult.blackboxBlocks[0].code.slice(0, 60)}${syncResult.blackboxBlocks[0].code.length > 60 ? '...' : ''}"`
              : '这些代码片段将作为黑盒节点保留在画布上'
          }
          actionLabel="查看详情"
          onAction={() => {
            // TODO(Task 4-D): 跳转到代码编辑器对应行
            // blackbox blocks processed
          }}
          onDismiss={clearSync}
        />
      )}

      {/* 2. 高风险修改通知 */}
      {highRiskCount > 0 && (
        <SyncBubble
          key="sync-highrisk"
          variant="highRisk"
          title={`检测到 ${highRiskCount} 处高风险修改`}
          message="类名 / Mod ID / 注册相关变更，需要您确认"
          actionLabel="查看并确认"
          onAction={() => setShowRiskDialog(true)}
        />
      )}

      {/* 3. 待应用的节点更新（非高风险时显示） */}
      {pendingUpdateCount > 0 && !pendingSync && (
        <SyncBubble
          key="sync-pending"
          variant="pendingSync"
          title="代码已变更"
          message={`${pendingUpdateCount} 处节点属性待应用`}
          actionLabel="一键应用代码变更到节点"
          onAction={handleApplyNodeUpdates}
          onDismiss={clearSync}
        />
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export function TaskNotifications() {
  const notifications = useWorkspaceStore((s) => s.taskNotifications)
  const dismissNotification = useWorkspaceStore((s) => s.dismissNotification)
  const hasSyncActivity = useSyncStore(selectHasSyncActivity)
  const [expanded, setExpanded] = useState(true)

  const totalCount = notifications.length + (hasSyncActivity ? 1 : 0)

  // 空状态：只显示一个铃铛按钮
  if (totalCount === 0) {
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
        <span>{totalCount} 条通知</span>
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
            {/* 同步通知（Task 4-C）—— 优先显示在最上方 */}
            <SyncNotifications />

            {/* 通用通知 */}
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

      {/* 高风险确认对话框（由 showRiskDialog 控制） */}
      <HighRiskSyncDialog />
    </div>
  )
}
