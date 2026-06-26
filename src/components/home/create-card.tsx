'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, FilePlus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { buttonTapVariants } from '@/components/providers/framer-provider'
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
 *
 * Task 6-C 微交互：
 *  - 卡片整体：framer-motion 卡片 hover 上浮 + 点击 scale 0.99
 *  - 左侧图标：hover 时旋转 -8deg（emerald 描边变深）
 *  - 右侧箭头：hover 时向右滑入 + 颜色变 emerald
 */
export function CreateCard({ onCreate }: CreateCardProps) {
  return (
    <motion.div
      variants={buttonTapVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      style={{ willChange: 'transform' }}
    >
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
          'group cursor-pointer border bg-card p-5 transition-colors duration-200',
          'hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
        )}
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            whileHover={{ rotate: -8, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            style={{ willChange: 'transform' }}
          >
            <FilePlus className="h-5 w-5 transition-colors group-hover:text-emerald-300" />
          </motion.div>
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
          <motion.div
            initial={{ opacity: 0.5, x: 0 }}
            whileHover={{ opacity: 1, x: 2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{ willChange: 'transform, opacity' }}
          >
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-emerald-400" />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  )
}
