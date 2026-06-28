'use client'

/**
 * 装备节点卡片（EquipmentNodeCard）
 *
 * 专用卡片：显示护甲槽位、护甲值、韧性、击退抗性、耐久等。
 * 主题色：orange（与武器区分用 amber）
 *
 * 展示属性：
 *  - 装备槽位（Badge：头盔/胸甲/护腿/靴子）
 *  - 护甲值（Shield 图标）
 *  - 护甲韧性（ShieldPlus 图标）
 *  - 击退抗性（数值）
 *  - 耐久度（Heart 图标）
 *  - 附魔值（数值）
 *  - 修复材料（Badge）
 *
 * 折叠摘要：{slot} · 护甲 {armorValue} · 耐久 {durability}
 */

import { memo } from 'react'
import * as React from 'react'
import { type NodeProps, type Node } from '@xyflow/react'
import { Shield, ShieldPlus, Heart, Sparkles, Hammer } from 'lucide-react'
import { BaseNodeCard } from './base-node-card'
import type { FlowNodeData } from '@/lib/node-system'
import { getMCIconUrl } from '@/lib/mc-icons'
import { cn } from '@/lib/utils'

export type EquipmentNodeData = FlowNodeData & {
  kind?: 'equipment'
}

export type EquipmentNodeType = Node<EquipmentNodeData, 'equipment'>

const SLOT_LABELS: Record<string, string> = {
  head: '头盔',
  chest: '胸甲',
  legs: '护腿',
  feet: '靴子',
}

const SLOT_ICONS: Record<string, string> = {
  head: '⛑',
  chest: '🛡',
  legs: '👖',
  feet: '👢',
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function EquipmentNodeCardImpl(props: NodeProps<EquipmentNodeType>) {
  return (
    <BaseNodeCard
      {...props}
      data={{ ...props.data, kind: 'equipment' }}
      renderContent={(p) => {
        const slot = str(p.equipmentSlot, 'chest')
        const armorValue = num(p.armorValue, 5)
        const armorToughness = num(p.armorToughness, 0)
        const knockbackResistance = num(p.knockbackResistance, 0)
        const durability = num(p.durability, 400)
        const enchantability = num(p.enchantability, 15)
        const repairMaterial = str(p.repairMaterial, 'minecraft:diamond')

        return (
          <>
            <MCNodeIcon registryId={str(p.registryId, '')} />
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-orange-400" />
                护甲值
              </span>
              <span className="font-mono font-semibold text-orange-300">{armorValue}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldPlus className="h-3.5 w-3.5 text-orange-400" />
                护甲韧性
              </span>
              <span className="font-mono font-semibold text-orange-300">{armorToughness}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">击退抗性</span>
              <span className="font-mono font-semibold text-orange-300">{knockbackResistance}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Heart className="h-3.5 w-3.5 text-orange-400" />
                耐久度
              </span>
              <span className="font-mono font-semibold text-orange-300">{durability}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                附魔值
              </span>
              <span className="font-mono font-semibold text-orange-300">{enchantability}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Hammer className="h-3.5 w-3.5 text-orange-400" />
                修复材料
              </span>
              <span className="truncate font-mono text-[10px] text-orange-300/80">{repairMaterial}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-xs text-muted-foreground">装备槽位</span>
              <Badge className="bg-orange-500/15 text-orange-300">
                {SLOT_ICONS[slot] ?? '🛡'} {SLOT_LABELS[slot] ?? slot}
              </Badge>
            </div>
          </>
        )
      }}
      renderSummary={(p) => {
        const slot = str(p.equipmentSlot, 'chest')
        const armorValue = num(p.armorValue, 5)
        const durability = num(p.durability, 400)
        return (
          <span>
            {SLOT_LABELS[slot] ?? slot} · 护甲 {armorValue} · 耐久 {durability}
          </span>
        )
      }}
    />
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

/** MC 物品图标 */
function MCNodeIcon({ registryId }: { registryId: string }) {
  const [iconUrl, setIconUrl] = React.useState<string | null>(() => getMCIconUrl(registryId))
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => { setIconUrl(getMCIconUrl(registryId)); setFailed(false) }, [registryId])
  if (!iconUrl || failed) return null
  return (
    <div className="mb-1 flex justify-center">
      <img src={iconUrl} alt={registryId} onError={() => setFailed(true)}
        className="h-8 w-8" style={{ imageRendering: "pixelated", objectFit: "contain" }} />
    </div>
  )
}

export const EquipmentNodeCard = memo(EquipmentNodeCardImpl)
