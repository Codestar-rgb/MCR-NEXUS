'use client'

/**
 * RecipeGridField — 3x3 合成网格编辑器
 *
 * 用于 recipe 节点的 crafting 类型配方。
 */

import * as React from 'react'
import { Grid3x3, Shuffle, Eraser, ArrowRight, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecipeGridFieldProps {
  grid: string[]
  resultItem: string
  resultCount: number
  shaped: boolean
  onGridChange: (grid: string[]) => void
  onResultChange: (item: string, count: number) => void
  onShapedChange: (shaped: boolean) => void
}

function shortId(id: string): string {
  if (!id) return ''
  const parts = id.split(':')
  return parts[parts.length - 1] || id
}

export function RecipeGridField({
  grid,
  resultItem,
  resultCount,
  shaped,
  onGridChange,
  onResultChange,
  onShapedChange,
}: RecipeGridFieldProps) {
  const updateSlot = (index: number, value: string) => {
    const next = [...grid]
    next[index] = value
    onGridChange(next)
  }

  const clearGrid = () => {
    onGridChange(Array(9).fill(''))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Grid3x3 className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-[11px] font-medium text-foreground">合成网格</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onShapedChange(true)}
            className={cn(
              'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
              shaped ? 'bg-orange-500/15 text-orange-300' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            有序
          </button>
          <button
            type="button"
            onClick={() => onShapedChange(false)}
            className={cn(
              'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
              !shaped ? 'bg-orange-500/15 text-orange-300' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            无序
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <GridSlot
              key={i}
              value={grid[i] ?? ''}
              onChange={(v) => updateSlot(i, v)}
              shaped={shaped}
            />
          ))}
        </div>

        <ArrowRight className="h-5 w-5 shrink-0 text-orange-400" />

        <div className="flex flex-col items-center gap-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-orange-500/40 bg-orange-500/10">
            <input
              type="text"
              value={resultItem}
              onChange={(e) => onResultChange(e.target.value, resultCount)}
              placeholder="产物"
              className="w-full bg-transparent px-1 text-center text-[9px] font-mono text-orange-300 placeholder:text-orange-300/30 focus:outline-none"
            />
          </div>
          <input
            type="number"
            value={resultCount}
            min={1}
            max={64}
            onChange={(e) => onResultChange(resultItem, Math.max(1, Math.min(64, Number(e.target.value) || 1)))}
            className="w-12 rounded border border-border/40 bg-card/30 px-1 py-0.5 text-center text-[10px] font-mono text-orange-300 focus:border-orange-500/40 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={clearGrid}
          className="flex items-center gap-1 rounded border border-border/40 bg-card/30 px-2 py-1 text-[10px] text-muted-foreground hover:border-red-500/30 hover:text-red-400"
        >
          <Eraser className="h-3 w-3" />
          清空
        </button>
        <button
          type="button"
          onClick={() => {
            const example = [
              '', 'minecraft:diamond', '',
              '', 'minecraft:diamond', '',
              '', 'minecraft:stick', '',
            ]
            onGridChange(example)
            onResultChange('minecraft:diamond_sword', 1)
          }}
          className="flex items-center gap-1 rounded border border-border/40 bg-card/30 px-2 py-1 text-[10px] text-muted-foreground hover:border-orange-500/30 hover:text-orange-400"
        >
          <Shuffle className="h-3 w-3" />
          示例
        </button>
        {!shaped && (
          <span className="text-[9px] text-muted-foreground/50">
            无序合成：格子位置不影响结果
          </span>
        )}
      </div>
    </div>
  )
}

function GridSlot({
  value,
  onChange,
  shaped,
}: {
  value: string
  onChange: (v: string) => void
  shaped: boolean
}) {
  const [editing, setEditing] = React.useState(false)

  return (
    <div
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded border text-[8px] font-mono transition-colors',
        value
          ? 'border-orange-500/30 bg-orange-500/5 text-orange-300'
          : 'border-border/30 bg-muted/20 text-muted-foreground/20',
        !shaped && 'border-dashed',
      )}
      onClick={() => setEditing(true)}
    >
      {editing ? (
        <input
          type="text"
          value={value}
          autoFocus
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') setEditing(false)
          }}
          placeholder="—"
          className="w-full bg-transparent px-0.5 text-center text-[8px] focus:outline-none"
        />
      ) : value ? (
        <span className="truncate">{shortId(value).slice(0, 5)}</span>
      ) : (
        <Package className="h-3 w-3 opacity-20" />
      )}
    </div>
  )
}
