'use client'

/**
 * 物品节点卡片
 *
 * 基于 BaseNodeCard 实现，展示 MC 物品（工具/食物/材料）的关键属性。
 * 主题色：teal（#14b8a6）
 *
 * 展示属性：
 *  - 最大堆叠（数值）
 *  - 稀有度（Badge，按稀有度颜色：common=muted, uncommon=emerald, rare=cyan, epic=violet）
 *  - 使用冷却（数值 tick）
 *  - 是否食物（开关）
 *  - 如果是食物：饱食度 + 饱和度
 *
 * 折叠摘要：堆叠 {maxStackSize} · {rarity}
 */

import { memo } from 'react'
import * as React from 'react'
import { type NodeProps, type Node } from '@xyflow/react'
import { Layers, Sparkles, Clock, Apple, Drumstick, Droplet } from 'lucide-react'
import { BaseNodeCard } from './base-node-card'
import type { FlowNodeData } from '@/lib/node-system'
import { getMCIconUrl } from '@/lib/mc-icons'
import { cn } from '@/lib/utils'

export type ItemNodeData = FlowNodeData & {
  kind?: 'item'
}

export type ItemNodeType = Node<ItemNodeData, 'item'>

const RARITY_META: Record<
  string,
  { label: string; className: string }
> = {
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

function ItemNodeCardImpl(props: NodeProps<ItemNodeType>) {
  return (
    <BaseNodeCard
      {...props}
      data={{ ...props.data, kind: 'item' }}
      renderContent={(p) => {
        const maxStackSize = num(p.maxStackSize, 64)
        const rarity = str(p.rarity, 'common')
        const cooldown = num(p.cooldown)
        const isFood = bool(p.isFood)
        const hunger = num(p.hunger)
        const saturation = num(p.saturation)
        const rarityMeta = RARITY_META[rarity] ?? RARITY_META.common

        return (
          <>
            {/* MC 物品图标 */}
            <MCItemIcon registryId={str(p.registryId, '')} />
            <Row icon={<Layers className="h-3.5 w-3.5 text-teal-400" />} label="最大堆叠">
              <span className="font-mono font-semibold text-teal-300">{maxStackSize}</span>
            </Row>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                稀有度
              </span>
              <Badge className={rarityMeta.className}>{rarityMeta.label}</Badge>
            </div>
            <Row icon={<Clock className="h-3.5 w-3.5 text-teal-400" />} label="使用冷却">
              <span className="font-mono font-semibold text-teal-300">{cooldown} tick</span>
            </Row>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Apple className="h-3.5 w-3.5 text-teal-400" />
                是食物
              </span>
              <span
                className={cn(
                  'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                  isFood
                    ? 'bg-teal-500/15 text-teal-300'
                    : 'bg-muted/40 text-muted-foreground',
                )}
              >
                {isFood ? '是' : '否'}
              </span>
            </div>
            {isFood && (
              <>
                <Row icon={<Drumstick className="h-3.5 w-3.5 text-teal-400" />} label="饱食度">
                  <span className="font-mono font-semibold text-teal-300">{hunger}</span>
                </Row>
                <Row icon={<Droplet className="h-3.5 w-3.5 text-teal-400" />} label="饱和度">
                  <span className="font-mono font-semibold text-teal-300">{saturation.toFixed(1)}</span>
                </Row>
              </>
            )}
          </>
        )
      }}
      renderSummary={(p) => {
        const rarity = str(p.rarity, 'common')
        const rarityMeta = RARITY_META[rarity] ?? RARITY_META.common
        return (
          <span>
            堆叠 {num(p.maxStackSize, 64)} · {rarityMeta.label}
          </span>
        )
      }}
    />
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
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

export const ItemNodeCard = memo(ItemNodeCardImpl)

/** MC 物品图标（带 fallback） */
function MCItemIcon({ registryId }: { registryId: string }) {
  const [iconUrl, setIconUrl] = React.useState<string | null>(() => getMCIconUrl(registryId))
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    setIconUrl(getMCIconUrl(registryId))
    setFailed(false)
  }, [registryId])

  if (!iconUrl || failed) return null

  return (
    <div className="mb-1 flex justify-center">
      <img
        src={iconUrl}
        alt={registryId}
        onError={() => setFailed(true)}
        className="h-8 w-8"
        style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
      />
    </div>
  )
}
