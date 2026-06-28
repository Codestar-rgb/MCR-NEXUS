'use client'

/**
 * 节点组卡片 v2 — 重新设计
 *
 * 改进：
 *  - 更精致的视觉：渐变边框 + 半透明背景 + 颜色条
 *  - 标题栏：可双击重命名 + 颜色切换 + 节点计数
 *  - 内容区：空状态提示 + 子节点预览
 *  - 选中态：品牌色 ring + 辉光
 *  - 解散按钮：一键解散组
 */

import { memo, useRef, useState, type KeyboardEvent } from 'react'
import { type NodeProps, type Node } from '@xyflow/react'
import { Group as GroupIcon, Check, X, Trash2, Layers } from 'lucide-react'
import { toast } from 'sonner'
import type { FlowNodeData } from '@/lib/node-system'
import { useCanvasStore } from '@/stores/canvas'
import { cn } from '@/lib/utils'

const GROUP_COLORS = [
  { id: 'rose', hex: '#f43f5e', name: '红' },
  { id: 'amber', hex: '#f59e0b', name: '橙' },
  { id: 'teal', hex: '#14b8a6', name: '青' },
  { id: 'cyan', hex: '#06b6d4', name: '蓝' },
  { id: 'emerald', hex: '#10b981', name: '绿' },
  { id: 'violet', hex: '#8b5cf6', name: '紫' },
  { id: 'slate', hex: '#64748b', name: '灰' },
] as const

export type GroupNodeData = FlowNodeData & {
  kind?: 'group'
  title?: string
  groupColor?: string
  groupNote?: string
}

export type GroupNodeType = Node<GroupNodeData, 'group'>

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function GroupNodeCardImpl({ data, id, selected }: NodeProps<GroupNodeType>) {
  const title = str(data.title ?? data.properties?.title, '新建组')
  const colorId = str(data.groupColor ?? data.properties?.color, 'slate')
  const note = str(data.groupNote ?? data.properties?.note, '')

  const colorMeta = GROUP_COLORS.find((c) => c.id === colorId) ?? GROUP_COLORS[6]

  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(title)
  const inputRef = useRef<HTMLInputElement>(null)

  const updateNode = useCanvasStore((s) => s.updateNode)
  const ungroupNode = useCanvasStore((s) => s.ungroupNode)
  const nodes = useCanvasStore((s) => s.nodes)

  // 计算组内子节点数
  const childCount = nodes.filter((n) => n.data.parentId === id).length

  function startEditing() {
    setDraftTitle(title)
    setIsEditing(true)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  function commitEdit() {
    setIsEditing(false)
    if (draftTitle.trim() && draftTitle !== title) {
      updateNode(id, { data: { ...data, title: draftTitle.trim() } })
      toast.success('组名已更新', { description: draftTitle.trim() })
    }
  }

  function cancelEdit() {
    setIsEditing(false)
    setDraftTitle(title)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    else if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
  }

  function changeColor(colorId: string) {
    updateNode(id, { data: { ...data, properties: { ...data.properties, color: colorId } } })
  }

  function handleUngroup() {
    ungroupNode(id)
    toast.success('组已解散，节点已释放')
  }

  return (
    <div
      className={cn(
        'group relative rounded-2xl border-2 backdrop-blur-sm transition-all',
        selected
          ? 'shadow-floating ring-2 ring-primary/40'
          : 'shadow-lg hover:shadow-xl',
      )}
      style={{
        minWidth: 320,
        minHeight: 200,
        width: '100%',
        height: '100%',
        borderColor: `${colorMeta.hex}40`,
        backgroundColor: `${colorMeta.hex}08`,
      }}
    >
      {/* 顶部渐变条 */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${colorMeta.hex}, ${colorMeta.hex}40)` }}
        aria-hidden
      />

      {/* 标题栏 */}
      <div
        className="flex items-center gap-2 rounded-t-2xl border-b px-3 py-2"
        style={{ borderColor: `${colorMeta.hex}30`, backgroundColor: `${colorMeta.hex}0A` }}
        onDoubleClick={(e) => { e.stopPropagation(); startEditing() }}
      >
        {/* 图标 */}
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1 ring-inset"
          style={{ backgroundColor: `${colorMeta.hex}18`, color: colorMeta.hex }}
        >
          <GroupIcon className="h-3.5 w-3.5" />
        </div>

        {isEditing ? (
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <input
              ref={inputRef}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={commitEdit}
              onMouseDown={(e) => e.stopPropagation()}
              className="min-w-0 flex-1 rounded border border-border/40 bg-background px-1.5 py-0.5 text-sm text-foreground outline-none focus:border-primary/40"
              placeholder="输入组名..."
            />
            <button onClick={commitEdit} className="rounded p-0.5 text-emerald-400 hover:bg-emerald-500/10">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={cancelEdit} className="rounded p-0.5 text-muted-foreground hover:bg-muted/40">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-foreground">{title}</span>
              {/* 子节点计数 */}
              {childCount > 0 && (
                <span
                  className="flex items-center gap-0.5 rounded-full px-1.5 py-px text-[9px] font-bold"
                  style={{ backgroundColor: `${colorMeta.hex}18`, color: colorMeta.hex }}
                >
                  <Layers className="h-2.5 w-2.5" />
                  {childCount}
                </span>
              )}
            </div>
            {note && <p className="truncate text-[10px] text-muted-foreground">{note}</p>}
          </div>
        )}

        {/* 颜色选择器 */}
        <div className="flex items-center gap-0.5" onMouseDown={(e) => e.stopPropagation()}>
          {GROUP_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => changeColor(c.id)}
              className={cn(
                'h-2.5 w-2.5 rounded-full transition-transform hover:scale-150',
                c.id === colorId && 'ring-1 ring-foreground/40 ring-offset-1',
              )}
              style={{ backgroundColor: c.hex }}
              aria-label={`切换为${c.name}色`}
            />
          ))}
        </div>

        {/* 解散按钮 */}
        <button
          onClick={handleUngroup}
          onMouseDown={(e) => e.stopPropagation()}
          className="rounded p-1 text-muted-foreground/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
          aria-label="解散组"
          title="解散组"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 内容区 */}
      <div className="relative h-full p-2">
        {childCount === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 p-4">
            <GroupIcon className="h-6 w-6 text-muted-foreground/15" />
            <span className="text-[10px] text-muted-foreground/30">
              拖拽节点到此处添加到组
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export const GroupNodeCard = memo(GroupNodeCardImpl)
