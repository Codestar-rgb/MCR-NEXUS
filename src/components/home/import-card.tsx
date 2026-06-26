'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportCardProps {
  onImport?: () => void
}

/**
 * 导入项目卡片 v2.0
 */
export function ImportCard({ onImport }: ImportCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onImport}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onImport?.()
        }
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'group relative w-full overflow-hidden rounded-xl border border-border/60 bg-card/50 p-5 text-left transition-all duration-200',
        'hover:border-primary/40 hover:bg-card hover:shadow-floating',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="relative flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 text-cyan-300 ring-1 ring-cyan-500/15 transition-transform duration-200 group-hover:scale-105">
          <Download className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground">导入项目</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            从 GitHub/Gitee URL 或本地 ZIP 导入
          </p>
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </motion.button>
  )
}
