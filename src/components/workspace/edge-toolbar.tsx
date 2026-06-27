'use client'

/**
 * NexCube 右侧边缘工具栏 v2
 *
 * 全面修复：所有按钮均接入真实功能，不再有 "开发中" toast。
 *
 *   ┌────┐
 *   │ 🟩 │  模式：节点视图
 *   │ 💻 │  模式：代码视图
 *   ├────┤
 *   │ 🔍 │  搜索（打开 GlobalSearch，Ctrl+P）
 *   │ ⊕  │  添加节点（打开分类弹出面板）
 *   ├────┤
 *   │ ⊞  │  缩放适应（dispatch 事件 → canvas fitView）
 *   │ 🔍+│  放大（dispatch 事件 → canvas zoomIn）
 *   │ 🔍-│  缩小（dispatch 事件 → canvas zoomOut）
 *   ├────┤
 *   │ ℹ  │  工程信息卡片（toggleRightPanel）
 *   │ 🔔 │  任务提示（toggleBell，与 TopDashboard 共享）
 *   ├────┤
 *   │ ⚙  │  设置
 *   └────┘
 */

import * as React from 'react'
import {
  Bell,
  Boxes,
  Code2,
  Info,
  Maximize,
  Plus,
  PanelLeft,
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
import { createFlowNode, useCanvasStore } from '@/stores/canvas'
import {
  getNodeTypesByCategory,
  getNodeTypeDefinition,
  type NodeCategory,
  type NodeTypeDefinition,
} from '@/lib/node-system'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'

/* 缩放事件总线（window CustomEvent，由 node-canvas 监听执行） */
export const ZOOM_FIT_EVENT = 'nexcube:zoom-fit'
export const ZOOM_IN_EVENT = 'nexcube:zoom-in'
export const ZOOM_OUT_EVENT = 'nexcube:zoom-out'

function dispatchZoom(event: string) {
  window.dispatchEvent(new CustomEvent(event))
}

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export function EdgeToolbar() {
  const mode = useWorkspaceStore((s) => s.mode)
  const setMode = useWorkspaceStore((s) => s.setMode)
  const unreadCount = useWorkspaceStore(selectUnreadNotificationCount)
  const openSettings = useWorkspaceStore((s) => s.openSettings)
  const toggleLeftSidebar = useWorkspaceStore((s) => s.toggleLeftSidebar)
  const leftSidebarOpen = useWorkspaceStore((s) => s.leftSidebarOpen)
  const toggleRightPanel = useWorkspaceStore((s) => s.toggleRightPanel)
  const rightPanelOpen = useWorkspaceStore((s) => s.rightPanelOpen)
  const toggleSearch = useWorkspaceStore((s) => s.toggleSearch)
  const toggleBell = useWorkspaceStore((s) => s.toggleBell)
  const bellOpen = useWorkspaceStore((s) => s.bellOpen)

  /* 添加节点弹出面板 */
  const [nodePopoverOpen, setNodePopoverOpen] = React.useState(false)
  const popoverRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!nodePopoverOpen) return
    function handle(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setNodePopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [nodePopoverOpen])

  const handleAddNode = React.useCallback((kind: string) => {
    try {
      const node = createFlowNode(kind, { x: 200, y: 200 })
      useCanvasStore.getState().addNode(node)
      useCanvasStore.getState().selectNode(node.id)
      useWorkspaceStore.getState().setSelectedNode(node.id, kind, node.data.title)
      toast.success(`已创建 ${node.data.title} 节点`)
      setNodePopoverOpen(false)
    } catch (err) {
      toast.error(`创建失败: ${err instanceof Error ? err.message : '未知错误'}`)
    }
  }, [])

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          'relative flex w-12 shrink-0 flex-col items-center gap-1 border-l border-border/50',
          'glass py-3',
          'md:w-12',
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

        {/* ---------- 移动端专用：文件树抽屉切换 ---------- */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLeftSidebar}
              aria-label="文件树抽屉"
              aria-pressed={leftSidebarOpen}
              className={cn(
                'relative h-9 w-9 rounded-lg transition-colors md:hidden',
                leftSidebarOpen
                  ? 'border border-primary/40 bg-primary/10 text-primary'
                  : 'border border-transparent text-muted-foreground hover:bg-accent hover:text-primary/80',
              )}
            >
              <PanelLeft className="h-[16px] w-[16px]" strokeWidth={1.75} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={6}>
            文件树（移动端）
          </TooltipContent>
        </Tooltip>

        {/* ---------- 工具组 ---------- */}
        <ToolButton
          label="搜索节点 (Ctrl+P)"
          onClick={toggleSearch}
          Icon={Search}
        />
        {/* 添加节点 — 弹出面板 */}
        <div className="relative" ref={popoverRef}>
          <ToolButton
            label="添加节点"
            active={nodePopoverOpen}
            onClick={() => setNodePopoverOpen((v) => !v)}
            Icon={Plus}
          />
          {nodePopoverOpen && (
            <NodeCreationPopover onSelect={handleAddNode} />
          )}
        </div>

        <HSpacer />

        {/* ---------- 缩放组 ---------- */}
        <ToolButton
          label="缩放适应 (Ctrl+0)"
          onClick={() => dispatchZoom(ZOOM_FIT_EVENT)}
          Icon={Maximize}
        />
        <ToolButton
          label="放大 (Ctrl+=)"
          onClick={() => dispatchZoom(ZOOM_IN_EVENT)}
          Icon={ZoomIn}
        />
        <ToolButton
          label="缩小 (Ctrl+-)"
          onClick={() => dispatchZoom(ZOOM_OUT_EVENT)}
          Icon={ZoomOut}
        />

        <HSpacer />

        {/* ---------- 系统组 ---------- */}
        <ToolButton
          label={rightPanelOpen ? '隐藏工程信息' : '显示工程信息'}
          active={rightPanelOpen}
          onClick={toggleRightPanel}
          Icon={Info}
        />
        <ToolButton
          label={
            unreadCount > 0
              ? `任务提示（${unreadCount} 条未读）`
              : '任务提示中心'
          }
          active={bellOpen}
          onClick={toggleBell}
          Icon={Bell}
          badge={unreadCount > 0 ? unreadCount : undefined}
        />

        {/* ---------- 底部：设置 ---------- */}
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
/* 节点创建弹出面板                                                    */
/* ------------------------------------------------------------------ */

const CATEGORY_LABEL: Record<NodeCategory, string> = {
  core: '核心节点',
  advanced: '高级节点',
  logic: '逻辑节点（子图用）',
}

function NodeCreationPopover({ onSelect }: { onSelect: (kind: string) => void }) {
  const grouped = React.useMemo(() => getNodeTypesByCategory(), [])

  return (
    <div
      className="absolute right-14 top-0 z-50 w-64 max-h-[420px] overflow-y-auto nexcube-scroll rounded-lg border border-border bg-popover/95 p-2 shadow-floating backdrop-blur-xl"
      role="menu"
    >
      <div className="mb-2 px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        创建节点
      </div>
      {(Object.entries(grouped) as [NodeCategory, NodeTypeDefinition[]][]).map(
        ([cat, defs]) => {
          if (defs.length === 0) return null
          return (
            <div key={cat} className="mb-2">
              <div className="mb-1 px-1.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground/50">
                {CATEGORY_LABEL[cat]}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {defs.map((def) => {
                  const Icon = (LucideIcons as unknown as Record<
                    string,
                    React.ComponentType<{ className?: string }>
                  >)[def.icon] ?? Boxes
                  return (
                    <button
                      key={def.kind}
                      onClick={() => onSelect(def.kind)}
                      className="group flex flex-col items-start gap-1 rounded-md border border-border/30 bg-card/30 px-2 py-1.5 text-left transition-colors hover:border-primary/40 hover:bg-card/60"
                    >
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] font-medium leading-tight text-foreground">
                        {def.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        },
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 子组件                                                              */
/* ------------------------------------------------------------------ */

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
              ? 'border border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary/80'
              : 'border border-transparent text-muted-foreground hover:bg-accent hover:text-primary/80',
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

export type { WorkspaceMode }
