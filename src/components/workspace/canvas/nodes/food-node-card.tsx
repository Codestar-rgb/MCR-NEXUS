'use client'

/**
 * 食物节点卡片（FoodNodeCard）
 *
 * 专用卡片：显示营养值、饱和度、可食属性、堆叠、稀有度。
 * 主题色：lime
 *
 * 展示属性：
 *  - 营养值（Drumstick 图标，恢复饥饿值）
 *  - 饱和度（Droplet 图标）
 *  - 可永远食用（开关）
 *  - 快速食用（开关）
 *  - 是肉食（开关）
 *  - 最大堆叠（数值）
 *  - 稀有度（Badge）
 *
 * 折叠摘要：营养 {nutrition} · 饱和 {saturation} · {rarity}
 */

import { memo } from 'react'
import { type NodeProps, type Node } from '@xyflow/react'
import { Drumstick, Droplet, Layers, Apple, Zap, Beef } from 'lucide-react'
import { BaseNodeCard } from './base-node-card'
import type { FlowNodeData } from '@/lib/node-system'
import { cn } from '@/lib/utils'

export type FoodNodeData = FlowNodeData & {
  kind?: 'food'
}

export type FoodNodeType = Node<FoodNodeData, 'food'>

const RARITY_META: Record<string, { label: string; className: string }> = {
  common: { label: '普通', className: 'bg-muted/50 text-muted-foreground' },
  uncommon: { label: '优秀', className: 'bg-emerald-500/15 text-emerald-300' },
  rare: { label: '稀有', className: 'bg-cyan-500/15 text-cyan-300' },
  epic: { label: '史诗', className: 'bg-violet-500/15 text-violet-300' },
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function FoodNodeCardImpl(props: NodeProps<FoodNodeType>) {
  return (
    <BaseNodeCard
      {...props}
      data={{ ...props.data, kind: 'food' }}
      renderContent={(p) => {
        const nutrition = num(p.nutrition, 0)
        const saturation = num(p.saturation, 0)
        const canAlwaysEat = bool(p.canAlwaysEat, false)
        const fastFood = bool(p.fastFood, false)
        const isMeat = bool(p.isMeat, false)
        const maxStackSize = num(p.maxStackSize, 64)
        const rarity = str(p.rarity, 'common')

        return (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Drumstick className="h-3.5 w-3.5 text-lime-400" />
                营养值
              </span>
              <span className="font-mono font-semibold text-lime-300">{nutrition} 🍗</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Droplet className="h-3.5 w-3.5 text-lime-400" />
                饱和度
              </span>
              <span className="font-mono font-semibold text-lime-300">{saturation.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Layers className="h-3.5 w-3.5 text-lime-400" />
                最大堆叠
              </span>
              <span className="font-mono font-semibold text-lime-300">{maxStackSize}</span>
            </div>

            {/* 属性开关 */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <AttrChip active={isMeat} icon={Beef} label="肉食" />
              <AttrChip active={fastFood} icon={Zap} label="快餐" />
              <AttrChip active={canAlwaysEat} icon={Apple} label="无限食" />
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-xs text-muted-foreground">稀有度</span>
              <Badge className={RARITY_META[rarity]?.className ?? RARITY_META.common.className}>
                {RARITY_META[rarity]?.label ?? rarity}
              </Badge>
            </div>
          </>
        )
      }}
      renderSummary={(p) => {
        const nutrition = num(p.nutrition, 0)
        const saturation = num(p.saturation, 0)
        const rarity = str(p.rarity, 'common')
        return (
          <span>
            营养 {nutrition} · 饱和 {saturation.toFixed(1)} · {RARITY_META[rarity]?.label ?? rarity}
          </span>
        )
      }}
    />
  )
}

/** 属性芯片（显示开/关状态） */
function AttrChip({
  active,
  icon: Icon,
  label,
}: {
  active: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-0.5 rounded border px-1 py-1 text-[9px]',
        active
          ? 'border-lime-500/30 bg-lime-500/10 text-lime-300'
          : 'border-border/20 bg-muted/10 text-muted-foreground/40',
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </div>
  )
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-px text-[10px] font-bold uppercase tracking-wider',
        className,
      )}
    >
      {children}
    </span>
  )
}

export const FoodNodeCard = memo(FoodNodeCardImpl)
