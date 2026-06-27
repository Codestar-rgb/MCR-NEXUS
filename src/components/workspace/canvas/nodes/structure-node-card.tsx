'use client'

/**
 * 结构节点卡片（StructureNodeCard）
 *
 * 专用卡片：显示结构类型、允许群系、生成概率、间距。
 * 主题色：stone
 *
 * 展示属性：
 *  - 结构类型（Badge：村庄/神殿/废弃/城堡/矿井）
 *  - 允许群系（列表，截断显示）
 *  - 生成概率（百分比 + 进度条）
 *  - 最小/最大间距（数值）
 *
 * 折叠摘要：{type} · {spawnChance} · {biomes}
 */

import { memo } from 'react'
import { type NodeProps, type Node } from '@xyflow/react'
import { Castle, MapPin, Ruler, Percent } from 'lucide-react'
import { BaseNodeCard } from './base-node-card'
import type { FlowNodeData } from '@/lib/node-system'
import { cn } from '@/lib/utils'

export type StructureNodeData = FlowNodeData & {
  kind?: 'structure'
}

export type StructureNodeType = Node<StructureNodeData, 'structure'>

const STRUCTURE_TYPE_LABELS: Record<string, string> = {
  village: '村庄',
  temple: '神殿',
  ruins: '废墟',
  castle: '城堡',
  mineshaft: '矿井',
  shipwreck: '沉船',
  stronghold: '要塞',
  monument: '海底神殿',
  mansion: '林地府邸',
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function StructureNodeCardImpl(props: NodeProps<StructureNodeType>) {
  return (
    <BaseNodeCard
      {...props}
      data={{ ...props.data, kind: 'structure' }}
      renderContent={(p) => {
        const structureType = str(p.structureType, 'village')
        const biomeList = str(p.biomeList, 'minecraft:plains')
        const spawnChance = num(p.spawnChance, 0.01)
        const minDistance = num(p.minDistance, 32)
        const maxDistance = num(p.maxDistance, 128)

        const biomes = biomeList.split(',').map((s) => s.trim()).filter(Boolean)

        return (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Castle className="h-3.5 w-3.5 text-stone-400" />
                结构类型
              </span>
              <Badge className="bg-stone-500/15 text-stone-300">
                {STRUCTURE_TYPE_LABELS[structureType] ?? structureType}
              </Badge>
            </div>

            {/* 生成概率 + 进度条 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Percent className="h-3.5 w-3.5 text-stone-400" />
                  生成概率
                </span>
                <span className="font-mono font-semibold text-stone-300">
                  {(spawnChance * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted/30">
                <div
                  className="h-full rounded-full bg-stone-400/60"
                  style={{ width: `${Math.min(spawnChance * 100 * 5, 100)}%` }}
                />
              </div>
            </div>

            {/* 间距 */}
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Ruler className="h-3.5 w-3.5 text-stone-400" />
                间距范围
              </span>
              <span className="font-mono text-xs text-stone-300">
                {minDistance} ~ {maxDistance} 格
              </span>
            </div>

            {/* 允许群系 */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-stone-400" />
                允许群系
              </div>
              <div className="flex flex-wrap gap-1">
                {biomes.slice(0, 4).map((b, i) => (
                  <span
                    key={i}
                    className="truncate rounded bg-stone-500/10 px-1.5 py-px text-[9px] font-mono text-stone-300/80"
                  >
                    {b.replace('minecraft:', '')}
                  </span>
                ))}
                {biomes.length > 4 && (
                  <span className="text-[9px] text-muted-foreground/50">
                    +{biomes.length - 4}
                  </span>
                )}
              </div>
            </div>
          </>
        )
      }}
      renderSummary={(p) => {
        const structureType = str(p.structureType, 'village')
        const spawnChance = num(p.spawnChance, 0.01)
        const biomeList = str(p.biomeList, 'minecraft:plains')
        const firstBiome = biomeList.split(',')[0]?.trim().replace('minecraft:', '') ?? ''
        return (
          <span>
            {STRUCTURE_TYPE_LABELS[structureType] ?? structureType} · {(spawnChance * 100).toFixed(1)}% · {firstBiome}
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
    <span className={cn('rounded px-1.5 py-px text-[10px] font-bold uppercase tracking-wider', className)}>
      {children}
    </span>
  )
}

export const StructureNodeCard = memo(StructureNodeCardImpl)
