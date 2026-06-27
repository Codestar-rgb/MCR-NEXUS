'use client'

/**
 * NexCube 文件标签页（多文件 Tab Bar）
 *
 * 功能：
 *  - 模拟 IDE 标签栏：当前打开的文件列表
 *  - 每个标签：文件名 + 关闭按钮 + 修改状态指示器（小圆点）
 *  - 点击标签切换文件（onActivate）
 *  - 关闭按钮（onClose）
 *  - 中键关闭（浏览器原生 + stopPropagation）
 *  - 横向滚动条（文件过多时）
 *  - 拖拽排序（hover 时显示插入位）
 *
 * 集成点：
 *  - 顶部固定一行（h-9），位于 CodeEditor 之上
 *  - 数据源：从 mock-file-tree 或代码生成结果获取已打开文件列表
 *  - 与 code-toolbar.tsx 共享 openFiles / activeFileId 状态
 */

import * as React from 'react'
import { X, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/* ------------------------------------------------------------------ */
/* 类型定义                                                            */
/* ------------------------------------------------------------------ */

export interface OpenFile {
  /** 文件唯一标识（通常等于完整路径） */
  id: string
  /** 完整路径（如 'src/main/java/.../MyItem.java'） */
  path: string
  /** 文件名（path 最后一段） */
  name: string
  /** 文件扩展名（决定图标颜色） */
  extension?: string
  /** 是否已修改（未保存） */
  isDirty?: boolean
  /** 是否只读 */
  isReadOnly?: boolean
  /** 文件内容 */
  value?: string
  /** 关联的节点 ID（双向联动） */
  linkedNodeId?: string
}

export interface FileTabsProps {
  /** 已打开的文件列表（顺序即标签顺序） */
  files: OpenFile[]
  /** 当前激活的文件 ID */
  activeFileId: string | null
  /** 点击标签切换 */
  onActivate?: (fileId: string) => void
  /** 关闭标签 */
  onClose?: (fileId: string) => void
  /** 拖拽重排序（可选） */
  onReorder?: (fromId: string, toId: string) => void
  className?: string
}

/* ------------------------------------------------------------------ */
/* 文件类型 → 图标颜色                                                 */
/* ------------------------------------------------------------------ */

function getFileColor(ext?: string): string {
  switch (ext?.toLowerCase()) {
    case 'java':
      return 'text-emerald-400'
    case 'toml':
      return 'text-amber-400'
    case 'json':
      return 'text-teal-400'
    case 'gradle':
    case 'groovy':
      return 'text-amber-400'
    case 'md':
      return 'text-zinc-400'
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return 'text-cyan-400'
    case 'txt':
      return 'text-zinc-500'
    default:
      return 'text-zinc-400'
  }
}

/* ------------------------------------------------------------------ */
/* 单个标签                                                            */
/* ------------------------------------------------------------------ */

interface FileTabProps {
  file: OpenFile
  isActive: boolean
  onActivate: () => void
  onClose: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

function FileTab({
  file,
  isActive,
  onActivate,
  onClose,
  onDragStart,
  onDragOver,
  onDrop,
}: FileTabProps) {
  const fileColor = getFileColor(file.extension)

  return (
    <div
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onActivate()
        }
      }}
      onMouseDown={(e) => {
        // 中键关闭
        if (e.button === 1) {
          e.preventDefault()
          onClose()
        }
      }}
      className={cn(
        'group relative flex h-9 shrink-0 cursor-pointer items-center gap-2 border-r border-zinc-800 px-3 text-xs transition-colors',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-emerald-500',
        isActive
          ? 'bg-zinc-950 text-zinc-100'
          : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
      )}
      title={file.path}
    >
      {/* 顶部高亮条 */}
      {isActive && (
        <span className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500" aria-hidden />
      )}

      {/* 文件名 */}
      <span className={cn('font-mono', fileColor)}>{file.name}</span>

      {/* 修改状态 / 关闭按钮 */}
      <div className="ml-1 flex h-4 w-4 items-center justify-center">
        {file.isDirty ? (
          <>
            {/* 修改未保存：小圆点（hover 时变关闭按钮） */}
            <Circle
              className="h-2 w-2 fill-current text-amber-400 group-hover:hidden"
              aria-label="已修改"
            />
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-4 w-4 p-0 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 group-hover:flex"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              aria-label={`关闭 ${file.name}`}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-4 w-4 p-0 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-100',
              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-label={`关闭 ${file.name}`}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* 只读标记 */}
      {file.isReadOnly && (
        <span className="ml-1 rounded bg-zinc-800 px-1 py-0.5 text-[10px] text-zinc-400">
          RO
        </span>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export function FileTabs({
  files,
  activeFileId,
  onActivate,
  onClose,
  onReorder,
  className,
}: FileTabsProps) {
  const dragIdRef = React.useRef<string | null>(null)

  const handleDragStart = (id: string) => (e: React.DragEvent) => {
    dragIdRef.current = id
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    const fromId = dragIdRef.current
    dragIdRef.current = null
    if (fromId && fromId !== targetId) {
      onReorder?.(fromId, targetId)
    }
  }

  return (
    <div
      role="tablist"
      aria-label="打开的文件"
      className={cn(
        'flex h-9 w-full items-stretch overflow-x-auto overflow-y-hidden border-b border-zinc-800 bg-zinc-900/40',
        'scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent',
        className,
      )}
    >
      {files.length === 0 ? (
        <div className="flex h-full items-center px-4 text-xs text-zinc-600">
          没有打开的文件
        </div>
      ) : (
        files.map((file) => (
          <FileTab
            key={file.id}
            file={file}
            isActive={file.id === activeFileId}
            onActivate={() => onActivate?.(file.id)}
            onClose={() => onClose?.(file.id)}
            onDragStart={handleDragStart(file.id)}
            onDragOver={handleDragOver}
            onDrop={handleDrop(file.id)}
          />
        ))
      )}
    </div>
  )
}

export default FileTabs
