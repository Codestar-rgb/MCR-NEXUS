'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, FilePlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateCardProps {
  onCreate?: () => void
}

/**
 * 创建项目卡片 v2.0
 *
 * 设计改进：
 * - 更精致的边框和阴影
 * - hover 时品牌色辉光 + 上浮
 * - 图标容器带渐变背景
 * - "推荐"标签更精致
 * - 入场动画
 */
export function CreateCard({ onCreate }: CreateCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onCreate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onCreate?.()
        }
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'group relative w-full overflow-hidden rounded-xl border border-border/60 bg-card/50 p-5 text-left transition-all duration-200',
        'hover:border-primary/40 hover:bg-card hover:shadow-floating',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      )}
    >
      {/* hover 时的品牌色辉光背景 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="relative flex items-center gap-4">
        {/* 图标容器：渐变背景 */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-1 ring-primary/20 transition-transform duration-200 group-hover:scale-105">
          <FilePlus className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">创建项目</h3>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-primary/20">
              推荐
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            从零开始，引导式创建你的模组项目
          </p>
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </motion.button>
  )
}
