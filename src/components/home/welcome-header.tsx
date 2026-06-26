'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { NexCubeLogo } from '@/components/nexcube-logo'
import { ThemeToggle } from '@/components/home/theme-toggle'

/**
 * 欢迎头部 v2.0
 *
 * 设计改进：
 * - 标题层级清晰：「欢迎使用」轻 + 「NexCube」品牌色渐变重
 * - 字号增大（h1 36px），更突出品牌
 * - LOGO 带辉光效果
 * - 版本信息用精致徽章
 * - 入场动画
 */
export function WelcomeHeader() {
  return (
    <header className="flex flex-col gap-8">
      {/* 顶部细条：右对齐主题切换 */}
      <div className="flex items-center justify-end">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left"
      >
        <div className="flex items-center gap-4">
          <NexCubeLogo size={56} className="shadow-glow rounded-lg" />
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold leading-none tracking-tight sm:text-4xl">
              <span className="text-muted-foreground">欢迎使用</span>{' '}
              <span className="text-gradient-brand">NexCube</span>
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              下一代 Minecraft 模组开发 IDE · 双轨协同 · 开箱即用
            </p>
          </div>
        </div>

        {/* 版本信息徽章 */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] font-medium">
            <span className="nexcube-pulse inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            v0.1.0 Alpha
          </span>
          <span className="text-[11px] text-muted-foreground/60">·</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            MC 1.20.1 · Forge 47.3.x
          </span>
        </div>
      </motion.div>
    </header>
  )
}
