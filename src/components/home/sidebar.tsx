'use client'

import * as React from 'react'
import { Settings } from 'lucide-react'
import { NexCubeLogo } from '@/components/nexcube-logo'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useWorkspaceStore } from '@/stores/workspace'

/**
 * NexCube 左侧导航栏 v2.0
 *
 * 设计改进：
 * - LOGO 带辉光
 * - 更精致的设置按钮 hover 效果
 * - 品牌色点缀
 */
export function Sidebar() {
  const openSettings = useWorkspaceStore((s) => s.openSettings)

  const handleSettings = React.useCallback(() => {
    openSettings()
  }, [openSettings])

  return (
    <TooltipProvider delayDuration={200}>
      {/* 桌面端：纵向 */}
      <aside
        className="hidden md:flex md:w-16 md:flex-col md:items-center md:justify-between md:border-r md:border-border/50 md:bg-sidebar md:py-5"
        aria-label="主导航"
      >
        <div className="flex flex-col items-center gap-1.5">
          <NexCubeLogo size={32} className="shadow-glow rounded-lg" />
          <span className="text-[10px] font-medium tracking-wider text-muted-foreground">
            NEX
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="打开设置"
              onClick={handleSettings}
              className="h-10 w-10 rounded-xl text-muted-foreground transition-all hover:bg-accent hover:text-primary"
            >
              <Settings className="h-[18px] w-[18px]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">设置</TooltipContent>
        </Tooltip>
      </aside>

      {/* 移动端：顶部横向条 */}
      <div className="flex items-center justify-between border-b border-border/50 bg-sidebar px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <NexCubeLogo size={26} className="shadow-glow rounded" />
          <span className="text-sm font-semibold tracking-wide">NexCube</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="打开设置"
          onClick={handleSettings}
          className="h-9 w-9 text-muted-foreground hover:text-primary"
        >
          <Settings className="h-[18px] w-[18px]" />
        </Button>
      </div>
    </TooltipProvider>
  )
}
