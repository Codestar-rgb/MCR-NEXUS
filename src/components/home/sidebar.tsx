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
import { useToast } from '@/hooks/use-toast'

/**
 * NexCube 启动主页左侧导航栏（窄）。
 *
 * 桌面端：固定 64px 宽的纵向条，顶部 LOGO，底部设置齿轮。
 * 移动端：折叠为顶部横向条，LOGO 在左、设置在右。
 */
export function Sidebar() {
  const { toast } = useToast()

  const handleSettings = React.useCallback(() => {
    toast({
      title: '设置面板',
      description: '设置功能开发中，敬请期待。',
    })
  }, [toast])

  return (
    <TooltipProvider delayDuration={200}>
      {/* 桌面端：纵向 */}
      <aside
        className="hidden md:flex md:w-16 md:flex-col md:items-center md:justify-between md:border-r md:bg-sidebar md:py-5"
        aria-label="主导航"
      >
        <div className="flex flex-col items-center gap-1">
          <NexCubeLogo size={32} />
          <span className="mt-1 text-[10px] font-medium tracking-wider text-muted-foreground">
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
              className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            >
              <Settings className="h-[18px] w-[18px]" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">设置</TooltipContent>
        </Tooltip>
      </aside>

      {/* 移动端：顶部横向条 */}
      <div className="flex items-center justify-between border-b bg-sidebar px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <NexCubeLogo size={26} />
          <span className="text-sm font-semibold tracking-wide">NexCube</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="打开设置"
          onClick={handleSettings}
          className="h-9 w-9 text-muted-foreground"
        >
          <Settings className="h-[18px] w-[18px]" />
        </Button>
      </div>
    </TooltipProvider>
  )
}
