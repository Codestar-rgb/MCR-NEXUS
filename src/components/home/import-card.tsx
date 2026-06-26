'use client'

import * as React from 'react'
import { ArrowRight, Download, Github } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ImportCardProps {
  /** 点击卡片触发的回调 */
  onImport?: () => void
}

/**
 * 导入项目卡片：从 GitHub/Gitee URL 或本地 ZIP 导入。
 */
export function ImportCard({ onImport }: ImportCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onImport}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onImport?.()
        }
      }}
      className={cn(
        'group cursor-pointer border bg-card p-5 transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 transition-colors group-hover:border-cyan-400/50 group-hover:bg-cyan-500/15">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground">导入项目</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            从 GitHub/Gitee URL 或本地 ZIP 导入
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground/70">
            <span className="inline-flex items-center gap-1">
              <Github className="h-3 w-3" />
              GitHub
            </span>
            <span aria-hidden>·</span>
            <span>Gitee</span>
            <span aria-hidden>·</span>
            <span>ZIP</span>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-400" />
      </div>
    </Card>
  )
}
