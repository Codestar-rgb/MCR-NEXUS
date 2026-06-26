'use client'

/**
 * 节点组卡片（React Flow Group 节点）
 *
 * 特殊容器节点：
 *  - 大尺寸，半透明背景
 *  - 顶部可拖拽的标题栏（带颜色条）
 *  - 内部容纳其他节点
 *  - 可重命名（双击标题）
 *  - 可改色（颜色选择器）
 *
 * 不渲染输入/输出端口（容器型节点）。
 */

import { memo, useRef, useState, type KeyboardEvent } from 'react'
import { type NodeProps, type Node } from '@xyflow/react'
import { Group as GroupIcon, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { FlowNodeData } from '@/lib/node-system'
import { cn } from '@/lib/utils'

/** 节点组可选颜色（与 COLOR_CLASSES 对齐） */
const GROUP_COLORS = [
  { id: 'rose', hex: '#f43f5e' },
  { id: 'amber', hex: '#f59e0b' },
  { id: 'teal', hex: '#14b8a6' },
  { id: 'cyan', hex: '#06b6d4' },
  { id: 'emerald', hex: '#10b981' },
  { id: 'violet', hex: '#8b5cf6' },
  { id: 'slate', hex: '#64748b' },
] as const

export type GroupNodeData = FlowNodeData & {
  kind?: 'group'
  /** 组标题 */
  title?: string
  /** 组颜色（tailwind 色名） */
  groupColor?: string
  /** 备注 */
  groupNote?: string
}

export type GroupNodeType = Node<GroupNodeData, 'group'>

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function GroupNodeCardImpl({ data, selected }: NodeProps<GroupNodeType>) {
  const title = str(data.title ?? data.properties?.title, '新建组')
  const colorId = str(data.groupColor ?? data.properties?.color, 'slate')
  const note = str(data.groupNote ?? data.properties?.note, '')

  const colorMeta =
    GROUP_COLORS.find((c) => c.id === colorId) ?? GROUP_COLORS[6]

  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEditing() {
    setDraftTitle(title)
    setIsEditing(true)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  function commitEdit() {
    setIsEditing(false)
    // 本阶段仅本地展示；持久化由 store 完成（Task 2-C）
    if (draftTitle.trim() && draftTitle !== title) {
      toast.success('组名已更新', { description: draftTitle })
    }
  }

  function cancelEdit() {
    setIsEditing(false)
    setDraftTitle(title)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 bg-card/30 shadow-inner backdrop-blur-sm transition-all',
        selected
          ? 'border-zinc-300 ring-2 ring-zinc-300/40'
          : 'border-zinc-500/30 hover:border-zinc-400/50',
      )}
      style={{
        minWidth: 360,
        minHeight: 220,
        width: '100%',
        height: '100%',
      }}
    >
      {/* 颜色条 */}
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: colorMeta.hex }}
        aria-hidden
      />

      {/* 顶部标题栏（可拖拽区域由 React Flow 自动处理 className="nopan"） */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-t-xl border-b px-3 py-2',
          'border-zinc-500/20 bg-zinc-500/5',
        )}
        onDoubleClick={(e) => {
          e.stopPropagation()
          startEditing()
        }}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{
            backgroundColor: `${colorMeta.hex}22`,
            color: colorMeta.hex,
          }}
        >
          <GroupIcon className="h-3.5 w-3.5" />
        </span>

        {isEditing ? (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <input
              ref={inputRef}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={commitEdit}
              // 阻止 React Flow 拖拽
              onMouseDown={(e) => e.stopPropagation()}
              className="min-w-0 flex-1 rounded border border-zinc-500/40 bg-background px-1.5 py-0.5 text-sm text-foreground outline-none focus:border-zinc-400"
              placeholder="输入组名..."
            />
            <button
              type="button"
              onClick={commitEdit}
              className="rounded p-0.5 text-emerald-400 hover:bg-emerald-500/10"
              aria-label="确认"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted/40"
              aria-label="取消"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-foreground">
                {title}
              </span>
              <span className="rounded bg-zinc-500/20 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-zinc-300">
                Group
              </span>
            </div>
            {note && (
              <p className="truncate text-[10px] text-muted-foreground">
                {note}
              </p>
            )}
          </div>
        )}

        {/* 颜色选择器 */}
        <div
          className="flex items-center gap-1"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {GROUP_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                // 本阶段仅 toast；持久化由 store 完成
                toast.info(`颜色已切换（${c.id}）`, {
                  description: '持久化待 Task 2-C 集成',
                })
              }}
              className={cn(
                'h-3 w-3 rounded-full ring-1 ring-background transition-transform hover:scale-125',
                c.id === colorId && 'ring-2 ring-foreground/40',
              )}
              style={{ backgroundColor: c.hex }}
              aria-label={`切换为 ${c.id} 色`}
            />
          ))}
        </div>
      </div>

      {/* 内容区（容纳其他节点，由 React Flow 自动渲染子节点） */}
      <div className="relative h-full p-2">
        {/* 空状态提示（仅当没有子节点时显示，由 React Flow 自动管理） */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
          <span className="text-[10px] text-muted-foreground/40">
            拖拽节点到此处添加到组
          </span>
        </div>
      </div>
    </div>
  )
}

export const GroupNodeCard = memo(GroupNodeCardImpl)
