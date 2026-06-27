'use client'

/**
 * 实体节点卡片
 *
 * 基于 BaseNodeCard 实现，展示 MC 实体（怪物/动物/NPC）的关键属性。
 * 主题色：rose（#f43f5e）
 *
 * 展示属性：
 *  - 生命值（Heart 图标）
 *  - 攻击力（Swords 图标）
 *  - 护甲值（Shield 图标）
 *  - 护甲韧性（数值）
 *  - 移动速度（数值）
 *  - 生物类别（Badge）
 *  - AI 类型（Badge）
 *
 * 折叠摘要：HP {health} · ATK {attack} · {aiType}
 */

import { memo } from 'react'
import { type NodeProps, type Node } from '@xyflow/react'
import { Heart, Swords, Shield, Gauge, ShieldPlus } from 'lucide-react'
import { BaseNodeCard } from './base-node-card'
import type { FlowNodeData } from '@/lib/node-system'
import { cn } from '@/lib/utils'

export type EntityNodeData = FlowNodeData & {
  kind?: 'entity'
}

export type EntityNodeType = Node<EntityNodeData, 'entity'>

const CREATURE_TYPE_LABELS: Record<string, string> = {
  undead: '不死',
  arthropod: '节肢',
  water: '水生',
  normal: '普通',
}

const AI_TYPE_LABELS: Record<string, string> = {
  melee: '近战',
  ranged: '远程',
  neutral: '中立',
  passive: '被动',
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function EntityNodeCardImpl(props: NodeProps<EntityNodeType>) {
  return (
    <BaseNodeCard
      {...props}
      data={{ ...props.data, kind: 'entity' }}
      renderContent={(p) => {
        const health = num(p.health)
        const attack = num(p.attack)
        const armor = num(p.armor)
        const armorToughness = num(p.armorToughness)
        const movementSpeed = num(p.movementSpeed)
        const creatureType = str(p.creatureType, 'normal')
        const aiType = str(p.aiType, 'melee')

        return (
          <>
            <Row icon={<Heart className="h-3.5 w-3.5 text-rose-400" />} label="生命值">
              <span className="font-mono font-semibold text-rose-300">{health} HP</span>
            </Row>
            <Row icon={<Swords className="h-3.5 w-3.5 text-rose-400" />} label="攻击力">
              <span className="font-mono font-semibold text-rose-300">{attack} ATK</span>
            </Row>
            <Row icon={<Shield className="h-3.5 w-3.5 text-rose-400" />} label="护甲值">
              <span className="font-mono font-semibold text-rose-300">{armor}</span>
            </Row>
            <Row icon={<ShieldPlus className="h-3.5 w-3.5 text-rose-400" />} label="护甲韧性">
              <span className="font-mono font-semibold text-rose-300">{armorToughness}</span>
            </Row>
            <Row icon={<Gauge className="h-3.5 w-3.5 text-rose-400" />} label="移动速度">
              <span className="font-mono font-semibold text-rose-300">{movementSpeed.toFixed(2)}</span>
            </Row>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-xs text-muted-foreground">生物类别</span>
              <Badge className="bg-rose-500/15 text-rose-300">
                {CREATURE_TYPE_LABELS[creatureType] ?? creatureType}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">AI 类型</span>
              <Badge className="bg-rose-500/15 text-rose-300">
                {AI_TYPE_LABELS[aiType] ?? aiType}
              </Badge>
            </div>
          </>
        )
      }}
      renderSummary={(p) => (
        <span>
          HP {num(p.health)} · ATK {num(p.attack)} · {AI_TYPE_LABELS[str(p.aiType, 'melee')] ?? str(p.aiType, 'melee')}
        </span>
      )}
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

export const EntityNodeCard = memo(EntityNodeCardImpl)
