'use client'

/**
 * NexCube 顶部全局仪表盘（阶段 1-A）
 *
 * 布局（高度 h-14 / 56px）：
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ [←] 项目名(modId) [Forge][MC 1.20.1] [⌥ main] │ 节点/代码 │ [🔨][▶][⏹] [ℹ] [🔔3] │
 *   └──────────────────────────────────────────────────────────┘
 *      左侧：返回 + 项目信息                  中间：模式切换     右侧：构建动作 + 工具
 *
 * 数据来源：
 *  - useWorkspaceStore: currentView/currentProjectId/mode/taskNotifications
 *  - TanStack Query: GET /api/projects/{id}
 */

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Home, GitBranch, Hammer, Play, Square, Bell, Info,
  Boxes, Code2, Loader2, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useWorkspaceStore,
  selectUnreadNotificationCount,
  type WorkspaceMode,
  type NotificationType,
} from '@/stores/workspace'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 类型与常量                                                          */
/* ------------------------------------------------------------------ */

/** GET /api/projects/[id] 返回的 Prisma Project 原始形状 */
interface ProjectDetail {
  id: string
  modId: string
  name: string
  author: string
  version: string
  mcVersion: string
  forgeVersion: string
  loader: string
  iconPath: string | null
  storagePath: string
  description: string | null
  lastOpenedAt: string
  createdAt: string
  updatedAt: string
}

/** 加载器徽章样式 —— 严格遵循 emerald/teal/cyan/amber 配色 */
const LOADER_BADGE_STYLES: Record<string, string> = {
  forge: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  fabric: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
  neoforge: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  quilt: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
}

const LOADER_LABEL: Record<string, string> = {
  forge: 'Forge',
  fabric: 'Fabric',
  neoforge: 'NeoForge',
  quilt: 'Quilt',
}

/** 通知类型对应的色点 */
const NOTIFICATION_DOT_STYLES: Record<NotificationType, string> = {
  sync: 'bg-emerald-400',
  warning: 'bg-amber-400',
  info: 'bg-cyan-400',
  error: 'bg-rose-400',
}

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export function TopDashboard() {
  const currentProjectId = useWorkspaceStore((s) => s.currentProjectId)
  const mode = useWorkspaceStore((s) => s.mode)
  const setMode = useWorkspaceStore((s) => s.setMode)
  const closeProject = useWorkspaceStore((s) => s.closeProject)
  const toggleRightPanel = useWorkspaceStore((s) => s.toggleRightPanel)
  const unreadCount = useWorkspaceStore(selectUnreadNotificationCount)
  const markAllRead = useWorkspaceStore((s) => s.markAllNotificationsRead)
  const notifications = useWorkspaceStore((s) => s.taskNotifications)
  const dismissNotification = useWorkspaceStore((s) => s.dismissNotification)

  // 项目详情查询
  const { data: project, isLoading } = useQuery<ProjectDetail>({
    queryKey: ['project', currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) throw new Error('no_project')
      const res = await fetch(`/api/projects/${currentProjectId}`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('failed_to_load_project')
      return (await res.json()) as ProjectDetail
    },
    enabled: !!currentProjectId,
    staleTime: 60_000,
  })

  // 通知下拉
  const [bellOpen, setBellOpen] = React.useState(false)
  const bellRef = React.useRef<HTMLDivElement | null>(null)

  // 点击外部关闭通知下拉
  React.useEffect(() => {
    if (!bellOpen) return
    function handle(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [bellOpen])

  const handleBellClick = React.useCallback(() => {
    setBellOpen((open) => {
      const next = !open
      if (next && unreadCount > 0) {
        // 打开时顺手标记为已读（仅清计数，不删条目）
        setTimeout(() => markAllRead(), 800)
      }
      return next
    })
  }, [unreadCount, markAllRead])

  return (
    <TooltipProvider delayDuration={200}>
      <header
        className={cn(
          'flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-3',
          'backdrop-blur supports-[backdrop-filter]:bg-background/75',
        )}
        role="toolbar"
        aria-label="工作区顶部仪表盘"
      >
        {/* ---------- 左侧：返回 + 项目信息 ---------- */}
        <div className="flex min-w-0 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="返回主页"
                onClick={closeProject}
                className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Home className="h-[18px] w-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">返回主页</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-7" />

          {/* 项目信息块 */}
          {isLoading ? (
            <ProjectInfoSkeleton />
          ) : project ? (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
              className="flex min-w-0 items-center gap-2.5"
            >
              {/* 项目图标（缩略图占位） */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
                  'border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-teal-500/10',
                  'text-xs font-bold text-emerald-400',
                )}
                aria-hidden
              >
                {project.name.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex min-w-0 flex-col">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {project.name}
                  </span>
                  <span
                    className="hidden font-mono text-[11px] text-muted-foreground sm:inline"
                    title="模组 ID"
                  >
                    {project.modId}
                  </span>
                </div>
              </div>

              {/* 加载器 + MC 版本徽章 */}
              <div className="hidden items-center gap-1.5 md:flex">
                <Badge
                  variant="outline"
                  className={cn(
                    'border px-1.5 py-0 text-[10px] font-medium',
                    LOADER_BADGE_STYLES[project.loader] ??
                      LOADER_BADGE_STYLES.forge,
                  )}
                >
                  {LOADER_LABEL[project.loader] ?? project.loader}{' '}
                  {project.forgeVersion}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-border bg-muted/40 px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
                >
                  MC {project.mcVersion}
                </Badge>
              </div>

              {/* Git 分支标识 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="hidden items-center gap-1 rounded-md border border-border bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground lg:flex">
                    <GitBranch className="h-3 w-3" />
                    <span className="font-mono">main</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">Git 分支：main</TooltipContent>
              </Tooltip>
            </motion.div>
          ) : (
            <div className="text-xs text-muted-foreground">
              <span>未找到项目</span>
            </div>
          )}
        </div>

        {/* ---------- 中间：模式切换器（弹性居中） ---------- */}
        <div className="mx-auto flex items-center">
          <ModeSwitcher value={mode} onChange={setMode} />
        </div>

        {/* ---------- 右侧：工具按钮（构建操作在底部终端区，避免冗余） ---------- */}
        <div className="flex items-center gap-1.5">
          {/* 工程卡片切换 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="工程信息卡片"
                onClick={toggleRightPanel}
                className="h-9 w-9 rounded-lg text-muted-foreground transition-all hover:bg-accent hover:text-primary"
              >
                <Info className="h-[18px] w-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">工程信息卡片</TooltipContent>
          </Tooltip>

          {/* 任务通知铃铛 */}
          <div className="relative" ref={bellRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="任务提示"
                  aria-haspopup="menu"
                  aria-expanded={bellOpen}
                  onClick={handleBellClick}
                  className="relative h-9 w-9 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 ? (
                    <span
                      className={cn(
                        'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center',
                        'justify-center rounded-full bg-emerald-500 px-1',
                        'text-[9px] font-bold text-white shadow ring-2 ring-background',
                      )}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  ) : null}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                任务提示{unreadCount > 0 ? `（${unreadCount} 条未读）` : ''}
              </TooltipContent>
            </Tooltip>

            {bellOpen ? (
              <NotificationDropdown
                notifications={notifications}
                onDismiss={dismissNotification}
                onClear={() => useWorkspaceStore.getState().clearNotifications()}
              />
            ) : null}
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}

/* ------------------------------------------------------------------ */
/* 子组件：模式切换器                                                  */
/* ------------------------------------------------------------------ */

function ModeSwitcher({
  value,
  onChange,
}: {
  value: WorkspaceMode
  onChange: (m: WorkspaceMode) => void
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as WorkspaceMode)
      }}
      aria-label="工作区模式切换"
      className={cn(
        'rounded-lg border border-border bg-muted/40 p-0.5',
        'data-[variant=outline]:shadow-none',
      )}
    >
      <ToggleGroupItem
        value="node"
        aria-label="节点视图"
        className={cn(
          'h-7 rounded-md px-3 text-xs font-medium',
          'data-[state=on]:bg-emerald-500/15 data-[state=on]:text-emerald-300',
          'data-[state=on]:shadow-[inset_0_0_0_1px_theme(colors.emerald.500/30)]',
          'gap-1.5 text-muted-foreground',
        )}
      >
        <Boxes className="h-3.5 w-3.5" />
        节点视图
      </ToggleGroupItem>
      <ToggleGroupItem
        value="code"
        aria-label="代码视图"
        className={cn(
          'h-7 rounded-md px-3 text-xs font-medium',
          'data-[state=on]:bg-emerald-500/15 data-[state=on]:text-emerald-300',
          'data-[state=on]:shadow-[inset_0_0_0_1px_theme(colors.emerald.500/30)]',
          'gap-1.5 text-muted-foreground',
        )}
      >
        <Code2 className="h-3.5 w-3.5" />
        代码视图
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

/* ------------------------------------------------------------------ */
/* 子组件：构建动作按钮组                                              */
/* ------------------------------------------------------------------ */

function BuildButtonGroup() {
  const [isBuilding, setIsBuilding] = React.useState(false)
  const [isRunning, setIsRunning] = React.useState(false)

  const handleBuild = React.useCallback(() => {
    if (isBuilding) return
    setIsBuilding(true)
    // 占位：阶段 5 接入真实构建逻辑（@/lib/capabilities build）
    setTimeout(() => setIsBuilding(false), 1500)
  }, [isBuilding])

  const handleRun = React.useCallback(() => {
    if (isRunning) return
    setIsRunning(true)
    // 占位：阶段 5 接入真实 runClient
  }, [isRunning])

  const handleStop = React.useCallback(() => {
    setIsRunning(false)
    setIsBuilding(false)
  }, [])

  return (
    <div className="flex items-center gap-1.5">
      {/* 构建 JAR */}
      <Button
        size="sm"
        onClick={handleBuild}
        disabled={isBuilding}
        aria-label="构建 JAR"
        className={cn(
          'h-8 gap-1.5 rounded-md px-3 text-xs font-medium',
          'bg-emerald-500/15 text-emerald-300 shadow-none',
          'border border-emerald-500/30 hover:bg-emerald-500/25',
          'hover:text-emerald-200',
        )}
      >
        {isBuilding ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Hammer className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">构建 JAR</span>
      </Button>

      {/* 启动测试 */}
      <Button
        size="sm"
        onClick={handleRun}
        disabled={isRunning}
        aria-label="启动测试客户端"
        className={cn(
          'h-8 gap-1.5 rounded-md px-3 text-xs font-medium',
          'bg-teal-500/15 text-teal-300 shadow-none',
          'border border-teal-500/30 hover:bg-teal-500/25',
          'hover:text-teal-200',
        )}
      >
        {isRunning ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">启动测试</span>
      </Button>

      {/* 停止 */}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleStop}
        disabled={!isBuilding && !isRunning}
        aria-label="停止运行"
        className={cn(
          'h-8 gap-1.5 rounded-md px-2.5 text-xs font-medium',
          'text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300',
        )}
      >
        <Square className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 子组件：通知下拉面板                                                */
/* ------------------------------------------------------------------ */

function NotificationDropdown({
  notifications,
  onDismiss,
  onClear,
}: {
  notifications: ReturnType<typeof useWorkspaceStore.getState>['taskNotifications']
  onDismiss: (id: string) => void
  onClear: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.12 }}
      role="menu"
      className={cn(
        'absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg',
        'border border-border bg-popover shadow-lg',
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-semibold text-foreground">任务提示</span>
        {notifications.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            清空全部
          </button>
        ) : null}
      </div>

      <div className="max-h-80 overflow-y-auto nexcube-scroll">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
              <Bell className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground">暂无任务提示</p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={cn(
                  'flex gap-2.5 border-b border-border/50 px-3 py-2.5 last:border-b-0',
                  'hover:bg-accent/40',
                )}
              >
                <span
                  className={cn(
                    'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                    NOTIFICATION_DOT_STYLES[n.type],
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-foreground">
                      {n.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDismiss(n.id)}
                      aria-label="忽略此通知"
                      className="shrink-0 text-muted-foreground/60 hover:text-foreground"
                    >
                      <ChevronDown className="h-3 w-3 rotate-90" />
                    </button>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {n.message}
                  </p>
                  {n.action ? (
                    <button
                      type="button"
                      className="mt-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
                      // TODO: Task 1-C 将根据 n.action.onClick 字符串查表分发
                      onClick={() => {}}
                    >
                      {n.action.label} →
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* 子组件：项目信息骨架屏                                              */
/* ------------------------------------------------------------------ */

function ProjectInfoSkeleton() {
  return (
    <div className="flex items-center gap-2.5">
      <Skeleton className="h-8 w-8 rounded-md" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="hidden h-2 w-20 sm:block" />
      </div>
      <div className="hidden items-center gap-1.5 md:flex">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
    </div>
  )
}
