'use client'

/**
 * NexCube 左侧工程树容器
 *
 * Task 1-B
 *
 * 整合：
 *  - FileTreeHeader（标题 + 4 个动作按钮）
 *  - FileTree（递归渲染）
 *
 * 容器：
 *  - 带边框、圆角、深色背景的卡片
 *  - 宽度由 workspace store.leftSidebarWidth 控制（默认 256px / w-64）
 *  - 顶部 header 固定，下方可滚动树区域（flex-1 overflow-y-auto）
 *  - 使用 .nexcube-scroll 自定义滚动条
 *
 * 集成：默认导出 <FileTreePanel />，供 Task 1-A WorkspaceShell 整合到左侧栏。
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/stores/workspace'
import { FileTreeHeader } from './file-tree-header'
import { FileTree } from './file-tree'

export interface FileTreePanelProps {
  className?: string
  /** 是否覆盖宽度（默认从 workspace store 读取） */
  width?: number
}

export function FileTreePanel({ className, width }: FileTreePanelProps) {
  const storeWidth = useWorkspaceStore((s) => s.leftSidebarWidth)
  const computedWidth = width ?? storeWidth

  return (
    <aside
      data-slot="file-tree-panel"
      className={cn(
        'flex h-full flex-col border-r border-border/60 bg-card/30',
        className,
      )}
      style={{ width: computedWidth, minWidth: 0 }}
    >
      <FileTreeHeader />
      <div className="nexcube-scroll relative flex-1 overflow-y-auto overflow-x-hidden">
        <FileTree />
        {/* 底部留白 + 版权标注 */}
        <div className="pointer-events-none sticky bottom-0 flex h-8 items-center justify-center border-t border-border/40 bg-background/60 backdrop-blur-sm">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Forge 1.20.1 · Mock Tree
          </span>
        </div>
      </div>
    </aside>
  )
}

export default FileTreePanel
