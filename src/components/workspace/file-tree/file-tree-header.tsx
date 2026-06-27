'use client'

/**
 * NexCube 工程文件树 Header
 *
 * Task 1-B
 *
 * 结构：
 *  - 左侧：标题"工程文件"
 *  - 右侧：4 个图标按钮（新建文件 / 新建文件夹 / 刷新 / 折叠全部）
 *
 * 当前阶段：所有按钮仅 toast 提示"功能开发中"。
 * 后续阶段可由父容器通过 onNewFile / onNewFolder / onRefresh / onCollapseAll 注入真实行为。
 */

import * as React from 'react'
import {
  ChevronsDownUp,
  FilePlus,
  FolderPlus,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HeaderAction {
  id: string
  label: string
  Icon: LucideIcon
  onClick: () => void
}

interface FileTreeHeaderProps {
  className?: string
  /** 可选：注入真实行为（未提供则 toast "功能开发中"） */
  onNewFile?: () => void
  onNewFolder?: () => void
  onRefresh?: () => void
  onCollapseAll?: () => void
}

function notImplemented(label: string) {
  toast.info(`${label}功能开发中`)
}

export function FileTreeHeader({
  className,
  onNewFile,
  onNewFolder,
  onRefresh,
  onCollapseAll,
}: FileTreeHeaderProps) {
  const actions: HeaderAction[] = [
    {
      id: 'new-file',
      label: '新建文件',
      Icon: FilePlus,
      onClick: () => (onNewFile ? onNewFile() : notImplemented('新建文件')),
    },
    {
      id: 'new-folder',
      label: '新建文件夹',
      Icon: FolderPlus,
      onClick: () =>
        onNewFolder ? onNewFolder() : notImplemented('新建文件夹'),
    },
    {
      id: 'refresh',
      label: '刷新',
      Icon: RefreshCw,
      onClick: () => (onRefresh ? onRefresh() : notImplemented('刷新')),
    },
    {
      id: 'collapse-all',
      label: '折叠全部',
      Icon: ChevronsDownUp,
      onClick: () =>
        onCollapseAll ? onCollapseAll() : notImplemented('折叠全部'),
    },
  ]

  return (
    <header
      className={cn(
        'flex h-9 shrink-0 items-center justify-between gap-1 border-b border-border/60 px-3',
        'bg-background/40 backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
          工程文件
        </span>
      </div>

      <div className="flex items-center gap-0.5">
        {actions.map(({ id, label, Icon, onClick }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClick}
                className={cn(
                  'h-6 w-6 rounded-sm',
                  'text-muted-foreground hover:text-emerald-300',
                  'hover:bg-emerald-500/10',
                  'transition-colors',
                )}
                aria-label={label}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4}>
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </header>
  )
}
