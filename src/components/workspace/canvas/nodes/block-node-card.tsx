'use client'

/**
 * 方块节点卡片
 *
 * 基于 BaseNodeCard 实现，展示 MC 方块的关键属性。
 * 主题色：amber（#f59e0b）
 *
 * 展示属性：
 *  - 硬度（数值）
 *  - 抗爆度（数值）
 *  - 发光等级（数值/15）
 *  - 破坏工具 + 挖掘等级（Badge）
 *  - 透明/固体（开关图标）
 *  - 掉落物 + 掉落数量
 *
 * 折叠摘要：硬度 {hardness} · {harvestTool} · 发光 {lightLevel}
 */

import { memo } from 'react'
import { type NodeProps, type Node } from '@xyflow/react'
import { Hammer, Bomb, Lightbulb, Eye, Box, Package } from 'lucide-react'
import { BaseNodeCard } from './base-node-card'
import type { FlowNodeData } from '@/lib/node-system'
import { cn } from '@/lib/utils'

export type BlockNodeData = FlowNodeData & {
  kind?: 'block'
}

export type BlockNodeType = Node<BlockNodeData, 'block'>

const HARVEST_TOOL_LABELS: Record<string, string> = {
  pickaxe: '镐',
  axe: '斧',
  shovel: '锹',
  hoe: '锄',
  any: '任意',
}

const HARVEST_LEVEL_LABELS: Record<string, string> = {
  wood: '木',
  stone: '石',
  iron: '铁',
  diamond: '钻石',
  netherite: '下界合金',
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

function BlockNodeCardImpl(props: NodeProps<BlockNodeType>) {
  return (
    <BaseNodeCard
      {...props}
      data={{ ...props.data, kind: 'block' }}
      renderContent={(p) => {
        const hardness = num(p.hardness)
        const resistance = num(p.resistance)
        const lightLevel = num(p.lightLevel)
        const harvestTool = str(p.harvestTool, 'pickaxe')
        const harvestLevel = str(p.harvestLevel, 'iron')
        const isTransparent = bool(p.isTransparent)
        const isSolid = bool(p.isSolid)
        const dropItem = str(p.dropItem)
        const dropCount = num(p.dropCount, 1)

        return (
          <>
            <Row icon={<Hammer className="h-3.5 w-3.5 text-amber-400" />} label="硬度">
              <span className="font-mono font-semibold text-amber-300">{hardness}</span>
            </Row>
            <Row icon={<Bomb className="h-3.5 w-3.5 text-amber-400" />} label="抗爆度">
              <span className="font-mono font-semibold text-amber-300">{resistance}</span>
            </Row>
            <Row icon={<Lightbulb className="h-3.5 w-3.5 text-amber-400" />} label="发光等级">
              <span className="font-mono font-semibold text-amber-300">{lightLevel}/15</span>
            </Row>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Hammer className="h-3.5 w-3.5 text-amber-400" />
                破坏工具
              </span>
              <div className="flex gap-1">
                <Badge className="bg-amber-500/15 text-amber-300">
                  {HARVEST_TOOL_LABELS[harvestTool] ?? harvestTool}
                </Badge>
                <Badge className="bg-amber-500/15 text-amber-300">
                  {HARVEST_LEVEL_LABELS[harvestLevel] ?? harvestLevel}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">物理性质</span>
              <div className="flex gap-1.5">
                <Tag icon={<Eye className="h-3 w-3" />} active={isTransparent} activeLabel="透明" inactiveLabel="不透明" />
                <Tag icon={<Box className="h-3 w-3" />} active={isSolid} activeLabel="固体" inactiveLabel="非固体" />
              </div>
            </div>
            <Row icon={<Package className="h-3.5 w-3.5 text-amber-400" />} label="掉落物">
              {dropItem ? (
                <span className="font-mono text-amber-300">
                  {dropItem} ×{dropCount}
                </span>
              ) : (
                <span className="text-muted-foreground">未绑定</span>
              )}
            </Row>
          </>
        )
      }}
      renderSummary={(p) => (
        <span>
          硬度 {num(p.hardness)} · {HARVEST_TOOL_LABELS[str(p.harvestTool, 'pickaxe')] ?? str(p.harvestTool, 'pickaxe')} · 发光 {num(p.lightLevel)}
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

function Tag({
  icon,
  active,
  activeLabel,
  inactiveLabel,
}: {
  icon: React.ReactNode
  active: boolean
  activeLabel: string
  inactiveLabel: string
}) {
  return (
    <span
      className={cn(
        'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
        active
          ? 'bg-amber-500/15 text-amber-300'
          : 'bg-muted/40 text-muted-foreground',
      )}
    >
      {icon}
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

export const BlockNodeCard = memo(BlockNodeCardImpl)
