'use client'

/**
 * 配方节点卡片（RecipeNodeCard）
 *
 * 专用卡片：可视化显示配方内容
 *  - crafting: 3x3 合成网格
 *  - smelting/blasting/smoking: 熔炉图标 + 输入→输出
 *  - stonecutting: 切石机图标 + 输入→输出
 *
 * 主题色：orange
 */

import * as React from 'react'
import { memo } from 'react'
import { type NodeProps, type Node } from '@xyflow/react'
import { Flame, Scissors, CookingPot } from 'lucide-react'
import { BaseNodeCard } from './base-node-card'
import type { FlowNodeData } from '@/lib/node-system'
import { getMCIconUrl } from '@/lib/mc-icons'

export type RecipeNodeData = FlowNodeData & {
  kind?: 'recipe'
}

export type RecipeNodeType = Node<RecipeNodeData, 'recipe'>

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback
}

/** 从 minecraft:stone 中提取 stone 用于显示 */
function shortId(id: string): string {
  if (!id) return '—'
  const parts = id.split(':')
  return parts[parts.length - 1] || id
}

/** 渲染物品图标（MC 原版图标 or 文字 fallback） */
function ItemIcon({ itemId, size = 'h-7 w-7', textClass = 'text-[8px]' }: { itemId: string; size?: string; textClass?: string }) {
  const [iconUrl, setIconUrl] = React.useState<string | null>(() => getMCIconUrl(itemId))
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    setIconUrl(getMCIconUrl(itemId))
    setFailed(false)
  }, [itemId])

  if (iconUrl && !failed) {
    return (
      <img
        src={iconUrl}
        alt={itemId}
        onError={() => setFailed(true)}
        className={size}
        style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
      />
    )
  }
  return <span className={textClass + ' font-mono'}>{shortId(itemId).slice(0, 4)}</span>
}

function RecipeNodeCardImpl(props: NodeProps<RecipeNodeType>) {
  const p = (props.data.properties ?? {}) as Record<string, unknown>
  const recipeType = str(p.recipeType, 'crafting')
  const resultItem = str(p.resultItem, 'minecraft:diamond')
  const resultCount = num(p.resultCount, 1)
  const ingredientA = str(p.ingredientA, '')
  const ingredientB = str(p.ingredientB, '')
  const ingredientC = str(p.ingredientC, '')
  const cookingTime = num(p.cookingTime, 200)
  const experience = num(p.experience, 0.1)
  const grid = (p.grid as string[]) ?? null

  return (
    <BaseNodeCard
      {...props}
      data={{ ...props.data, kind: 'recipe' }}
      renderContent={() => {
        if (recipeType === 'smelting' || recipeType === 'blasting' || recipeType === 'smoking') {
          return (
            <SmeltingPreview
              type={recipeType}
              input={ingredientA}
              output={resultItem}
              outputCount={resultCount}
              cookingTime={cookingTime}
              experience={experience}
            />
          )
        }
        if (recipeType === 'stonecutting') {
          return (
            <StonecuttingPreview
              input={ingredientA}
              output={resultItem}
              outputCount={resultCount}
            />
          )
        }
        return (
          <CraftingPreview
            grid={grid}
            fallbackA={ingredientA}
            fallbackB={ingredientB}
            fallbackC={ingredientC}
            output={resultItem}
            outputCount={resultCount}
          />
        )
      }}
      renderSummary={() => (
        <span className="flex items-center gap-1.5">
          <CookingPot className="h-3 w-3 text-orange-400" />
          {resultCount > 1 ? `${resultCount}× ` : ''}{shortId(resultItem)}
          <span className="text-muted-foreground/50">· {recipeType}</span>
        </span>
      )}
    />
  )
}

/* === 合成台 3x3 网格预览 === */
function CraftingPreview({
  grid, fallbackA, fallbackB, fallbackC, output, outputCount,
}: {
  grid: string[] | null
  fallbackA: string; fallbackB: string; fallbackC: string
  output: string; outputCount: number
}) {
  // 优先使用 grid（3x3 完整网格），否则用 fallback（只有 3 个材料放第一行）
  const slots = grid && grid.length === 9
    ? grid
    : [fallbackA, fallbackB, fallbackC, '', '', '', '', '', '']

  return (
    <div className="flex items-center gap-3 py-1">
      {/* 3x3 网格 */}
      <div className="grid grid-cols-3 gap-0.5">
        {slots.map((s, i) => (
          <div
            key={i}
            className={`flex h-7 w-7 items-center justify-center rounded border text-[8px] font-mono ${
              s
                ? 'border-orange-500/30 bg-orange-500/5 text-orange-300'
                : 'border-border/30 bg-muted/20 text-muted-foreground/20'
            }`}
          >
            {s ? <ItemIcon itemId={s} size="h-6 w-6" /> : ''}
          </div>
        ))}
      </div>

      {/* 箭头 */}
      <span className="text-orange-400">→</span>

      {/* 产物 */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex h-10 w-10 items-center justify-center rounded border border-orange-500/40 bg-orange-500/10">
          <ItemIcon itemId={output} size="h-8 w-8" />
        </div>
        {outputCount > 1 && (
          <span className="text-[9px] font-bold text-orange-400">×{outputCount}</span>
        )}
      </div>
    </div>
  )
}

/* === 熔炉类预览 === */
function SmeltingPreview({
  type, input, output, outputCount, cookingTime, experience,
}: {
  type: string
  input: string
  output: string
  outputCount: number
  cookingTime: number
  experience: number
}) {
  const typeLabel = type === 'smelting' ? '熔炉' : type === 'blasting' ? '高炉' : '烟熏炉'
  return (
    <div className="flex items-center gap-3 py-1">
      {/* 输入 */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex h-8 w-8 items-center justify-center rounded border border-orange-500/30 bg-orange-500/5 text-[8px] font-mono text-orange-300">
          {input ? shortId(input).slice(0, 5) : '—'}
        </div>
        <span className="text-[8px] text-muted-foreground/50">输入</span>
      </div>

      {/* 熔炉图标 */}
      <div className="flex flex-col items-center gap-0.5">
        <Flame className="h-5 w-5 text-orange-400" />
        <span className="text-[8px] text-orange-400/70">{typeLabel}</span>
      </div>

      {/* 箭头 */}
      <span className="text-orange-400">→</span>

      {/* 产物 */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex h-8 w-8 items-center justify-center rounded border border-orange-500/40 bg-orange-500/10 text-[8px] font-mono text-orange-300">
          {shortId(output).slice(0, 5)}
        </div>
        <span className="text-[8px] text-muted-foreground/50">
          {outputCount > 1 ? `×${outputCount} ` : ''}{cookingTime}t
        </span>
      </div>

      {/* 经验 */}
      <div className="ml-1 flex flex-col items-end text-[8px] text-amber-400/70">
        <span>XP</span>
        <span className="font-mono">{experience.toFixed(1)}</span>
      </div>
    </div>
  )
}

/* === 切石机预览 === */
function StonecuttingPreview({
  input, output, outputCount,
}: {
  input: string
  output: string
  outputCount: number
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex h-8 w-8 items-center justify-center rounded border border-orange-500/30 bg-orange-500/5 text-[8px] font-mono text-orange-300">
          {input ? shortId(input).slice(0, 5) : '—'}
        </div>
        <span className="text-[8px] text-muted-foreground/50">输入</span>
      </div>

      <Scissors className="h-4 w-4 text-orange-400" />

      <span className="text-orange-400">→</span>

      <div className="flex flex-col items-center gap-0.5">
        <div className="flex h-8 w-8 items-center justify-center rounded border border-orange-500/40 bg-orange-500/10 text-[8px] font-mono text-orange-300">
          {shortId(output).slice(0, 5)}
        </div>
        {outputCount > 1 && (
          <span className="text-[9px] font-bold text-orange-400">×{outputCount}</span>
        )}
      </div>
    </div>
  )
}

export const RecipeNodeCard = memo(RecipeNodeCardImpl)
