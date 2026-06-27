'use client'

/**
 * 维度节点卡片（DimensionNodeCard）
 *
 * 专用卡片：显示环境类型、高度范围、重力、关键机制开关。
 * 主题色：purple
 *
 * 展示属性：
 *  - 环境类型（Badge：主世界/下界/末地 + emoji）
 *  - 高度范围（Y 轴可视化条）
 *  - 重力（数值）
 *  - 坐标缩放
 *  - 4 个机制开关芯片（天顶光/自然/床可用/有袭击）
 *
 * 折叠摘要：{environment} · Y {minY}~{minY+height} · 重力 {gravity}
 */

import { memo } from 'react'
import { type NodeProps, type Node } from '@xyflow/react'
import { Globe, Ruler, ArrowDown, Scale } from 'lucide-react'
import { BaseNodeCard } from './base-node-card'
import type { FlowNodeData } from '@/lib/node-system'
import { cn } from '@/lib/utils'

export type DimensionNodeData = FlowNodeData & {
  kind?: 'dimension'
}

export type DimensionNodeType = Node<DimensionNodeData, 'dimension'>

const ENV_LABELS: Record<string, { label: string; emoji: string }> = {
  normal: { label: '主世界', emoji: '🌍' },
  nether: { label: '下界', emoji: '🔥' },
  end: { label: '末地', emoji: '🌌' },
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

function DimensionNodeCardImpl(props: NodeProps<DimensionNodeType>) {
  return (
    <BaseNodeCard
      {...props}
      data={{ ...props.data, kind: 'dimension' }}
      renderContent={(p) => {
        const environment = str(p.environment, 'normal')
        const height = num(p.height, 384)
        const minY = num(p.minY, -64)
        const gravity = num(p.gravity, 0.08)
        const coordinateScale = num(p.coordinateScale, 1)
        const hasSkyLight = bool(p.hasSkyLight, true)
        const natural = bool(p.natural, true)
        const bedWorks = bool(p.bedWorks, true)
        const hasRaids = bool(p.hasRaids, true)

        const envMeta = ENV_LABELS[environment] ?? { label: environment, emoji: '🌍' }
        const maxY = minY + height

        return (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="h-3.5 w-3.5 text-purple-400" />
                环境类型
              </span>
              <Badge className="bg-purple-500/15 text-purple-300">
                {envMeta.emoji} {envMeta.label}
              </Badge>
            </div>

            {/* 高度范围可视化 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Ruler className="h-3.5 w-3.5 text-purple-400" />
                  高度范围
                </span>
                <span className="font-mono text-xs text-purple-300">
                  {minY} ~ {maxY}
                </span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-muted/30">
                {/* Y=0 参考线 */}
                {minY < 0 && maxY > 0 && (
                  <div
                    className="absolute top-0 h-full w-px bg-border/60"
                    style={{ left: `${(-minY / height) * 100}%` }}
                  />
                )}
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-purple-400/40"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-muted-foreground/50">
                <span>Y={minY}</span>
                <span>高度 {height}</span>
                <span>Y={maxY}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowDown className="h-3.5 w-3.5 text-purple-400" />
                重力
              </span>
              <span className="font-mono font-semibold text-purple-300">{gravity.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Scale className="h-3.5 w-3.5 text-purple-400" />
                坐标缩放
              </span>
              <span className="font-mono font-semibold text-purple-300">{coordinateScale.toFixed(1)}×</span>
            </div>

            {/* 机制开关芯片 */}
            <div className="grid grid-cols-2 gap-1 pt-0.5">
              <MechChip active={hasSkyLight} label="天顶光" />
              <MechChip active={natural} label="自然" />
              <MechChip active={bedWorks} label="床可用" />
              <MechChip active={hasRaids} label="有袭击" />
            </div>
          </>
        )
      }}
      renderSummary={(p) => {
        const environment = str(p.environment, 'normal')
        const minY = num(p.minY, -64)
        const height = num(p.height, 384)
        const gravity = num(p.gravity, 0.08)
        const envMeta = ENV_LABELS[environment] ?? { label: environment, emoji: '🌍' }
        return (
          <span>
            {envMeta.label} · Y {minY}~{minY + height} · 重力 {gravity.toFixed(2)}
          </span>
        )
      }}
    />
  )
}

function MechChip({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1 rounded border px-1 py-0.5 text-[9px]',
        active
          ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
          : 'border-border/20 bg-muted/10 text-muted-foreground/40',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-purple-400' : 'bg-muted-foreground/30')} />
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
    <span className={cn('rounded px-1.5 py-px text-[10px] font-bold uppercase tracking-wider', className)}>
      {children}
    </span>
  )
}

export const DimensionNodeCard = memo(DimensionNodeCardImpl)
