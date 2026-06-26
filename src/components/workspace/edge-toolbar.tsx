'use client'

/**
 * NexCube 右侧边缘工具栏（Task 1-C）
 *
 * 垂直窄条（w-12），固定在右侧边缘。结构（自上而下）：
 *
 *   ┌────┐
 *   │ 🟩 │  模式：节点视图（emerald 高亮当前模式）
 *   │ 💻 │  模式：代码视图
 *   ├────┤  Separator
 *   │ 🔍 │  搜索（toast）
 *   │ ⊕  │  添加节点（toast）
 *   ├────┤
 *   │ ⊞  │  缩放适应（toast）
 *   │ 🔍+│  放大（toast）
 *   │ 🔍-│  缩小（toast）
 *   ├────┤
 *   │ ℹ  │  工程卡片切换（toast）
 *   │ 🔔 │  任务提示中心（显示未读数徽章，toast）
 *   ├────┤
 *   │ ⚙  │  设置（toast，底部）
 *   └────┘
 *
 * 设计要点：
 *  - 图标按钮 40x40 (h-10 w-10)，rounded-lg
 *  - hover 时 bg-accent + emerald 文字
 *  - 当前模式按钮高亮（emerald 边框 + bg-emerald-500/10 + text-emerald-400）
 *  - Tooltip side="left"，delay 300ms
 *  - 用 Separator 分组
 *  - 任务铃铛若有 taskNotifications 未读则显示数字徽章
 *  - 工具栏整体 bg-sidebar，左侧 border-l border-border
 */

import * as React from 'react'
import {
  Bell,
  Boxes,
  Code2,
  Info,
  Maximize,
  Plus,
  Search,
  Settings,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
} from '@/stores/workspace'
import { cn } from '@/lib/utils'

/**
 * 设置按钮点击 → 通过 workspace store 打开全局 SettingsDialog
 * （由 src/app/page.tsx 在根渲染，主页 + 工作区共用）。
 */

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export function EdgeToolbar() {
  const mode = useWorkspaceStore((s) => s.mode)
  const setMode = useWorkspaceStore((s) => s.setMode)
  const unreadCount = useWorkspaceStore(selectUnreadNotificationCount)
  const openSettings = useWorkspaceStore((s) => s.openSettings)

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          'flex w-12 shrink-0 flex-col items-center gap-1 border-l border-border',
          'bg-sidebar/40 py-3',
        )}
        role="toolbar"
        aria-label="边缘工具栏"
      >
        {/* ---------- 模式组 ---------- */}
        <ToolButton
          label="节点视图"
          active={mode === 'node'}
          onClick={() => setMode('node')}
          Icon={Boxes}
        />
        <ToolButton
          label="代码视图"
          active={mode === 'code'}
          onClick={() => setMode('code')}
          Icon={Code2}
        />

        <HSpacer />

        {/* ---------- 工具组 ---------- */}
        <ToolButton
          label="搜索"
          onClick={() => toast.info('搜索功能开发中')}
          Icon={Search}
        />
        <ToolButton
          label="添加节点"
          onClick={() => toast.info('添加节点功能开发中')}
          Icon={Plus}
        />

        <HSpacer />

        {/* ---------- 缩放组 ---------- */}
        <ToolButton
          label="缩放适应"
          onClick={() => toast.info('缩放适应（待接入 React Flow）')}
          Icon={Maximize}
        />
        <ToolButton
          label="放大"
          onClick={() => toast.info('放大（待接入 React Flow）')}
          Icon={ZoomIn}
        />
        <ToolButton
          label="缩小"
          onClick={() => toast.info('缩小（待接入 React Flow）')}
          Icon={ZoomOut}
        />

        <HSpacer />

        {/* ---------- 系统组 ---------- */}
        <ToolButton
          label="工程信息卡片"
          onClick={() => toast.info('工程信息卡片切换功能开发中')}
          Icon={Info}
        />
        <ToolButton
          label={
            unreadCount > 0
              ? `任务提示（${unreadCount} 条未读）`
              : '任务提示中心'
          }
          onClick={() =>
            toast.info(
              unreadCount > 0
                ? `任务提示中心：${unreadCount} 条未读`
                : '暂无未读任务提示',
            )
          }
          Icon={Bell}
          badge={unreadCount > 0 ? unreadCount : undefined}
        />

        {/* ---------- 底部：设置（mt-auto 推到底） ---------- */}
        <div className="mt-auto flex flex-col items-center gap-1">
          <HSpacer />
          <ToolButton
            label="设置"
            onClick={() => openSettings()}
            Icon={Settings}
          />
        </div>
      </aside>
    </TooltipProvider>
  )
}

/* ------------------------------------------------------------------ */
/* 子组件                                                              */
/* ------------------------------------------------------------------ */

/** 水平分隔（在垂直工具栏中表现为水平短横线） */
function HSpacer() {
  return (
    <Separator
      orientation="horizontal"
      className="my-1 h-px w-6 bg-border/60"
    />
  )
}

interface ToolButtonProps {
  label: string
  Icon: LucideIcon
  onClick: () => void
  active?: boolean
  badge?: number
}

function ToolButton({ label, Icon, onClick, active, badge }: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            'relative h-10 w-10 rounded-lg transition-colors',
            active
              ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300'
              : 'border border-transparent text-muted-foreground hover:bg-accent hover:text-emerald-300',
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          {badge !== undefined && badge > 0 && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center',
                'justify-center rounded-full bg-emerald-500 px-1',
                'text-[9px] font-bold text-white ring-2 ring-sidebar',
              )}
              aria-label={`${badge} 条未读`}
            >
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

/* ------------------------------------------------------------------ */
/* 工具：模式切换辅助（保留类型导出，便于后续接入）                     */
/* ------------------------------------------------------------------ */

export type { WorkspaceMode }
