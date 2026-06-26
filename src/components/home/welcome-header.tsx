'use client'

import * as React from 'react'
import { NexCubeLogo } from '@/components/nexcube-logo'
import { ThemeToggle } from '@/components/home/theme-toggle'

/**
 * 欢迎头部：LOGO + 标题 + 副标题 + 版本号 + 主题切换按钮。
 */
export function WelcomeHeader() {
  return (
    <header className="flex flex-col gap-6">
      {/* 顶部细条：右对齐主题切换（桌面端） */}
      <div className="flex items-center justify-end">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
        <div className="flex items-center gap-3">
          <NexCubeLogo size={48} />
          <div className="flex flex-col">
            <h1 className="bg-gradient-to-br from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
              欢迎使用 NexCube
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              下一代 Minecraft 模组开发 IDE · 双轨协同 · 开箱即用
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
          <span className="text-xs font-medium text-muted-foreground">
            v0.1.0 Alpha
          </span>
          <span className="text-xs text-muted-foreground/60">·</span>
          <span className="text-xs text-muted-foreground/80">MC 1.20.1 · Forge 47.3.x</span>
        </div>
      </div>
    </header>
  )
}
