'use client'

import * as React from 'react'
import { ArrowRight, FilePlus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CreateCardProps {
  /** 点击卡片触发的回调，由父组件控制创建向导的打开 */
  onCreate?: () => void
}

/**
 * 创建项目卡片：引导式新建模组项目。
 *
 * 视觉：圆角 xl，深色 card 背景，hover 时边框变 emerald-500/50，
 * 轻微上浮 + 阴影，右侧箭头浮现。
 */
export function CreateCard({ onCreate }: CreateCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onCreate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onCreate?.()
        }
      }}
      className={cn(
        'group cursor-pointer border bg-card p-5 transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition-colors group-hover:border-emerald-400/50 group-hover:bg-emerald-500/15">
          <FilePlus className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">创建项目</h3>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              推荐
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            从零开始，引导式创建你的模组项目
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-400" />
      </div>
    </Card>
  )
}
