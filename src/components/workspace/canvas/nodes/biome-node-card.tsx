'use client'

/**
 * 群系节点卡片（BiomeNodeCard）
 *
 * 专用卡片：显示温度、降水、群系类别、水深/草/树叶颜色色块。
 * 主题色：emerald
 *
 * 展示属性：
 *  - 温度（Thermometer 图标，带颜色指示：冷蓝/温绿/热红）
 *  - 降水量（CloudRain 图标）
 *  - 降水类型（Badge：雨/雪/无）
 *  - 群系类别（Badge）
 *  - 4 个颜色色块（水/水雾/树叶/草）
 *
 * 折叠摘要：{category} · 温度 {temp} · {precipitation}
 */

import { memo } from 'react'
import { type NodeProps, type Node } from '@xyflow/react'
import { Thermometer, CloudRain, Trees } from 'lucide-react'
import { BaseNodeCard } from './base-node-card'
import type { FlowNodeData } from '@/lib/node-system'
import { cn } from '@/lib/utils'

export type BiomeNodeData = FlowNodeData & {
  kind?: 'biome'
}

export type BiomeNodeType = Node<BiomeNodeData, 'biome'>

const PRECIP_LABELS: Record<string, string> = {
  rain: '雨',
  snow: '雪',
  none: '无',
}

const CATEGORY_LABELS: Record<string, string> = {
  plains: '平原',
  forest: '森林',
  desert: '沙漠',
  mountains: '山地',
  ocean: '海洋',
  swamp: '沼泽',
  taiga: '针叶林',
  jungle: '丛林',
  savanna: '草原',
  icy: '冰原',
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

/** 温度颜色：<0 蓝 / 0-1 绿 / >1 红 */
function tempColor(t: number): string {
  if (t < 0) return 'text-cyan-400'
  if (t > 1) return 'text-red-400'
  return 'text-emerald-400'
}

/** 颜色色块 */
function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="h-6 w-6 rounded border border-border/40"
        style={{ backgroundColor: `#${color.replace('#', '')}` }}
        title={label}
      />
      <span className="text-[8px] text-muted-foreground/60">{label}</span>
    </div>
  )
}

function BiomeNodeCardImpl(props: NodeProps<BiomeNodeType>) {
  return (
    <BaseNodeCard
      {...props}
      data={{ ...props.data, kind: 'biome' }}
      renderContent={(p) => {
        const temp = num(p.temperature, 0.5)
        const downfall = num(p.downfall, 0.5)
        const precipitation = str(p.precipitation, 'rain')
        const category = str(p.category, 'plains')
        const waterColor = str(p.waterColor, '3F76E4')
        const waterFogColor = str(p.waterFogColor, '050533')
        const foliageColor = str(p.foliageColor, '48B518')
        const grassColor = str(p.grassColor, '5A7D31')

        return (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Thermometer className={cn('h-3.5 w-3.5', tempColor(temp))} />
                温度
              </span>
              <span className={cn('font-mono font-semibold', tempColor(temp))}>
                {temp.toFixed(1)}{temp < 0 ? ' ❄' : temp > 1 ? ' 🔥' : ''}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CloudRain className="h-3.5 w-3.5 text-emerald-400" />
                降水量
              </span>
              <span className="font-mono font-semibold text-emerald-300">{(downfall * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Trees className="h-3.5 w-3.5 text-emerald-400" />
                群系类别
              </span>
              <Badge className="bg-emerald-500/15 text-emerald-300">
                {CATEGORY_LABELS[category] ?? category}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">降水类型</span>
              <Badge className="bg-emerald-500/15 text-emerald-300">
                {PRECIP_LABELS[precipitation] ?? precipitation}
              </Badge>
            </div>

            {/* 颜色色块 */}
            <div className="flex items-center justify-around gap-1 pt-1">
              <ColorSwatch color={waterColor} label="水" />
              <ColorSwatch color={waterFogColor} label="水雾" />
              <ColorSwatch color={foliageColor} label="树叶" />
              <ColorSwatch color={grassColor} label="草" />
            </div>
          </>
        )
      }}
      renderSummary={(p) => {
        const category = str(p.category, 'plains')
        const temp = num(p.temperature, 0.5)
        const precipitation = str(p.precipitation, 'rain')
        return (
          <span>
            {CATEGORY_LABELS[category] ?? category} · 温度 {temp.toFixed(1)} · {PRECIP_LABELS[precipitation] ?? precipitation}
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

export const BiomeNodeCard = memo(BiomeNodeCardImpl)
