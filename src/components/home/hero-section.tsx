'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Github } from 'lucide-react'
import { NexCubeLogo } from '@/components/nexcube-logo'
import { ThemeToggle } from '@/components/home/theme-toggle'
import { Button } from '@/components/ui/button'
import { useWorkspaceStore } from '@/stores/workspace'

interface HeroSectionProps {
  onCreate: () => void
  onImport: () => void
}

/**
 * 英雄区 v3.0
 *
 * 全新设计：
 * - 顶部工具栏（设置 + 主题切换 + GitHub）
 * - 大型 LOGO + 品牌名渐变
 * - 精致副标题
 * - 主操作按钮（创建项目）+ 次操作（导入）
 * - 背景微妙的品牌色辉光
 */
export function HeroSection({ onCreate, onImport }: HeroSectionProps) {
  const openSettings = useWorkspaceStore((s) => s.openSettings)

  return (
    <section className="relative">
      {/* 背景品牌色辉光 */}
      <div
        className="pointer-events-none absolute -top-20 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]"
        aria-hidden
      />

      {/* 顶部工具栏 */}
      <div className="relative mb-12 flex items-center justify-end gap-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          aria-label="GitHub 仓库"
          className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={() => window.open('https://github.com/Codestar-rgb/MCR-NEXUS', '_blank')}
        >
          <Github className="h-[18px] w-[18px]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="设置"
          onClick={openSettings}
          className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary"
        >
          <Sparkles className="h-[18px] w-[18px]" />
        </Button>
      </div>

      {/* 主体内容 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex flex-col items-center gap-6 text-center"
      >
        {/* LOGO 带辉光 */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        >
          <NexCubeLogo size={72} className="shadow-glow-strong rounded-2xl" />
        </motion.div>

        {/* 标题 */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="text-gradient-brand">NexCube</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            下一代 Minecraft 模组开发 IDE
            <br className="hidden sm:block" />
            <span className="text-foreground/70">双轨协同 · 开箱即用 · 极致本土化</span>
          </p>
        </div>

        {/* 版本徽章 */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[11px] font-medium">
            <span className="nexcube-pulse inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            v0.1.0 Alpha
          </span>
          <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-[11px] font-medium text-muted-foreground">
            MC 1.20.1 · Forge 47.3.x
          </span>
        </div>

        {/* 主操作按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center gap-3 pt-2"
        >
          <Button
            size="lg"
            onClick={onCreate}
            className="h-11 gap-2 rounded-xl bg-gradient-brand px-6 text-sm font-medium text-primary-foreground shadow-glow transition-all hover:shadow-glow-strong"
          >
            开始创建
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onImport}
            className="h-11 rounded-xl border-border/60 px-6 text-sm font-medium hover:border-primary/40 hover:text-primary"
          >
            导入项目
          </Button>
        </motion.div>
      </motion.div>
    </section>
  )
}
