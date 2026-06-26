'use client'

/**
 * NexCube 加载骨架屏预设（Task 6-C）
 *
 * 三种工作区场景的骨架屏，统一替代零散的 spinner：
 *   - WorkspaceSkeleton       : 工作区主体（顶部 + 左 + 中 + 右 + 终端）
 *   - PropertyPanelSkeleton   : 属性面板（标题 + Tabs + 表单字段）
 *   - TerminalSkeleton        : 终端（tab 栏 + 行占位）
 *   - NodeCanvasSkeleton      : 节点画布（点阵 + 节点卡占位）
 *
 * 全部基于 shadcn Skeleton（animate-pulse + bg-accent），与项目深色主题兼容。
 */

import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 工作区整体骨架                                                      */
/* ------------------------------------------------------------------ */

export function WorkspaceSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-screen w-full flex-col overflow-hidden bg-background',
        className,
      )}
      role="status"
      aria-label="工作区加载中"
      aria-live="polite"
    >
      {/* 顶部仪表盘骨架（h-14） */}
      <Skeleton className="h-14 w-full rounded-none border-b border-border" />

      <div className="flex min-h-0 flex-1">
        {/* 左侧文件树 */}
        <div className="hidden w-64 shrink-0 flex-col gap-2 border-r border-border bg-sidebar/30 p-3 md:flex">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>

        {/* 中间画布 */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <NodeCanvasSkeleton className="flex-1" />
        </div>

        {/* 右侧属性面板 */}
        <div className="hidden w-80 shrink-0 flex-col gap-2 border-l border-border bg-sidebar/30 p-3 lg:flex">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-9 w-full" />
          {Array.from({ length: 6 }).map((_, i) => (
            <React.Fragment key={i}>
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-7 w-full" />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 底部终端 */}
      <Skeleton className="h-9 w-full rounded-none border-t border-border" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 属性面板骨架                                                        */
/* ------------------------------------------------------------------ */

export function PropertyPanelSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex h-full flex-col gap-3 p-4', className)}
      role="status"
      aria-label="属性面板加载中"
      aria-live="polite"
    >
      {/* 标题区 */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="ml-auto h-5 w-12 rounded-full" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-7 flex-1" />
        ))}
      </div>

      {/* 表单字段 */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>

      {/* 贴图区 */}
      <Skeleton className="h-24 w-full rounded-lg" />

      {/* 底部按钮 */}
      <div className="mt-auto flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 终端骨架                                                            */
/* ------------------------------------------------------------------ */

export function TerminalSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex h-full flex-col', className)}
      role="status"
      aria-label="终端加载中"
      aria-live="polite"
    >
      {/* Tab 栏 */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-16" />
        ))}
        <Skeleton className="ml-auto h-6 w-20" />
      </div>

      {/* 终端行 */}
      <div className="flex-1 space-y-1.5 bg-zinc-950/40 p-3 font-mono">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton
              className="h-3"
              style={{ width: `${30 + ((i * 13) % 50)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 节点画布骨架                                                        */
/* ------------------------------------------------------------------ */

export function NodeCanvasSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden bg-background',
        className,
      )}
      role="status"
      aria-label="节点画布加载中"
      aria-live="polite"
    >
      {/* 点阵背景占位 */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle, #27272a 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        aria-hidden
      />

      {/* 浮动节点卡占位 */}
      <div className="absolute left-12 top-12 w-64">
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
      <div className="absolute right-24 top-24 w-64">
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <div className="absolute bottom-32 left-1/3 w-64">
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>

      {/* 右下角控件占位 */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
      <div className="absolute bottom-3 right-12">
        <Skeleton className="h-32 w-48 rounded-md" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 通用列表骨架（用于卡片列表、构建历史等）                              */
/* ------------------------------------------------------------------ */

export function ListSkeleton({
  count = 4,
  className,
  itemClassName,
}: {
  count?: number
  className?: string
  itemClassName?: string
}) {
  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      role="status"
      aria-label="列表加载中"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-3 rounded-lg px-2.5 py-2',
            itemClassName,
          )}
        >
          <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  )
}
