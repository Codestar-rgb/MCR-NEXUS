'use client'

/**
 * 武器节点卡片（WeaponNodeCard）
 *
 * 专用卡片：显示武器类型、攻击伤害、攻速、耐久、附魔值、修复材料。
 * 主题色：red
 *
 * 展示属性：
 *  - 武器类型（Badge：剑/斧/弓/弩/三叉戟）
 *  - 攻击伤害（Swords 图标）
 *  - 攻击速度（数值）
 *  - 攻击距离（数值）
 *  - 耐久度（Heart 图标）
 *  - 附魔值（Sparkles 图标）
 *  - 修复材料（Badge）
 *
 * 折叠摘要：{weaponType} · DMG {attackDamage} · 耐久 {durability}
 */

import { memo } from 'react'
import { type NodeProps, type Node } from '@xyflow/react'
import { Swords, Heart, Sparkles, Hammer, Zap } from 'lucide-react'
import { BaseNodeCard } from './base-node-card'
import type { FlowNodeData } from '@/lib/node-system'
import { cn } from '@/lib/utils'

export type WeaponNodeData = FlowNodeData & {
  kind?: 'weapon'
}

export type WeaponNodeType = Node<WeaponNodeData, 'weapon'>

const WEAPON_TYPE_LABELS: Record<string, string> = {
  sword: '剑',
  axe: '斧',
  bow: '弓',
  crossbow: '弩',
  trident: '三叉戟',
}

const WEAPON_TYPE_ICONS: Record<string, string> = {
  sword: '⚔',
  axe: '🪓',
  bow: '🏹',
  crossbow: '🎯',
  trident: '🔱',
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function WeaponNodeCardImpl(props: NodeProps<WeaponNodeType>) {
  return (
    <BaseNodeCard
      {...props}
      data={{ ...props.data, kind: 'weapon' }}
      renderContent={(p) => {
        const weaponType = str(p.weaponType, 'sword')
        const attackDamage = num(p.attackDamage, 7)
        const attackSpeed = num(p.attackSpeed, -2.4)
        const reachDistance = num(p.reachDistance, 3)
        const durability = num(p.durability, 500)
        const enchantability = num(p.enchantability, 14)
        const repairMaterial = str(p.repairMaterial, 'minecraft:diamond')

        return (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Swords className="h-3.5 w-3.5 text-red-400" />
                攻击伤害
              </span>
              <span className="font-mono font-semibold text-red-300">{attackDamage} DMG</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-red-400" />
                攻击速度
              </span>
              <span className="font-mono font-semibold text-red-300">{attackSpeed.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">攻击距离</span>
              <span className="font-mono font-semibold text-red-300">{reachDistance} 格</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Heart className="h-3.5 w-3.5 text-red-400" />
                耐久度
              </span>
              <span className="font-mono font-semibold text-red-300">{durability}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-red-400" />
                附魔值
              </span>
              <span className="font-mono font-semibold text-red-300">{enchantability}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Hammer className="h-3.5 w-3.5 text-red-400" />
                修复材料
              </span>
              <span className="truncate font-mono text-[10px] text-red-300/80">{repairMaterial}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-xs text-muted-foreground">武器类型</span>
              <Badge className="bg-red-500/15 text-red-300">
                {WEAPON_TYPE_ICONS[weaponType] ?? '⚔'} {WEAPON_TYPE_LABELS[weaponType] ?? weaponType}
              </Badge>
            </div>
          </>
        )
      }}
      renderSummary={(p) => {
        const weaponType = str(p.weaponType, 'sword')
        const attackDamage = num(p.attackDamage, 7)
        const durability = num(p.durability, 500)
        return (
          <span>
            {WEAPON_TYPE_LABELS[weaponType] ?? weaponType} · DMG {attackDamage} · 耐久 {durability}
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

export const WeaponNodeCard = memo(WeaponNodeCardImpl)
