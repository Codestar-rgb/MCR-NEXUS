'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            {/* 渲染前显示与默认深色一致的图标，避免水合闪烁 */}
            {mounted && !isDark ? (
              <Moon className="h-[18px] w-[18px]" />
            ) : (
              <Sun className="h-[18px] w-[18px]" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isDark ? '切换到浅色模式' : '切换到深色模式'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
