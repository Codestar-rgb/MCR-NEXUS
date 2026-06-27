'use client'

/**
 * 药水节点卡片（PotionNodeCard）
 *
 * 专用卡片：显示效果类型、持续时间、等级、增益/有害、颜色。
 * 主题色：pink
 *
 * 展示属性：
 *  - 效果类型（Badge：速度/力量/再生/隐身...）
 *  - 持续时间（Clock 图标，自动换算秒）
 *  - 效果等级（数值，显示为 "等级 N+1"）
 *  - 增益/有害（Badge 颜色区分）
 *  - 药水颜色（色块预览）
 *  - 3 个属性芯片（环境/增益/图标）
 *
 * 折叠摘要：{effectType} · {duration}s · 等级 {amplifier+1}
 */

import { memo } from 'react'
import { type NodeProps, type Node } from '@xyflow/react'
import { Clock, Zap, Droplet, Sparkles } from 'lucide-react'
import { BaseNodeCard } from './base-node-card'
import type { FlowNodeData } from '@/lib/node-system'
import { cn } from '@/lib/utils'

export type PotionNodeData = FlowNodeData & {
  kind?: 'potion'
}

export type PotionNodeType = Node<PotionNodeData, 'potion'>

const EFFECT_LABELS: Record<string, string> = {
  speed: '速度',
  slowness: '缓慢',
  haste: '急迫',
  mining_fatigue: '挖掘疲劳',
  strength: '力量',
  instant_health: '瞬间治疗',
  instant_damage: '瞬间伤害',
  jump_boost: '跳跃提升',
  nausea: '反胃',
  regeneration: '生命恢复',
  resistance: '抗性提升',
  fire_resistance: '抗火',
  water_breathing: '水下呼吸',
  invisibility: '隐身',
  blindness: '失明',
  night_vision: '夜视',
  hunger: '饥饿',
  weakness: '虚弱',
  poison: '中毒',
  wither: '凋零',
  health_boost: '生命提升',
  absorption: '伤害吸收',
  saturation: '饱和',
  glowing: '发光',
  levitation: '飘浮',
  luck: '幸运',
  bad_luck: '霉运',
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

function PotionNodeCardImpl(props: NodeProps<PotionNodeType>) {
  return (
    <BaseNodeCard
      {...props}
      data={{ ...props.data, kind: 'potion' }}
      renderContent={(p) => {
        const effectType = str(p.effectType, 'speed')
        const duration = num(p.duration, 3600)
        const amplifier = num(p.amplifier, 0)
        const isAmbient = bool(p.isAmbient, false)
        const isBeneficial = bool(p.isBeneficial, true)
        const hasIcon = bool(p.hasIcon, true)
        const color = str(p.color, '820AC')

        const durationSec = (duration / 20).toFixed(1)
        const effectLabel = EFFECT_LABELS[effectType] ?? effectType

        return (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Droplet className="h-3.5 w-3.5 text-pink-400" />
                效果类型
              </span>
              <Badge
                className={
                  isBeneficial
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-red-500/15 text-red-300'
                }
              >
                {effectLabel}
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-pink-400" />
                持续时间
              </span>
              <span className="font-mono font-semibold text-pink-300">
                {durationSec}s
                <span className="ml-1 text-[9px] text-muted-foreground/50">({duration}t)</span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-pink-400" />
                效果等级
              </span>
              <span className="font-mono font-semibold text-pink-300">
                {amplifier + 1}
                <span className="ml-1 text-[9px] text-muted-foreground/50">(amp {amplifier})</span>
              </span>
            </div>

            {/* 颜色预览 */}
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-pink-400" />
                药水颜色
              </span>
              <div className="flex items-center gap-1.5">
                <div
                  className="h-5 w-5 rounded-full border border-border/40"
                  style={{ backgroundColor: `#${color.replace('#', '')}` }}
                />
                <span className="font-mono text-[10px] text-pink-300/70">#{color}</span>
              </div>
            </div>

            {/* 属性芯片 */}
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              <AttrChip active={isBeneficial} label="增益" colorClass="emerald" />
              <AttrChip active={isAmbient} label="环境" colorClass="pink" />
              <AttrChip active={hasIcon} label="图标" colorClass="cyan" />
            </div>
          </>
        )
      }}
      renderSummary={(p) => {
        const effectType = str(p.effectType, 'speed')
        const duration = num(p.duration, 3600)
        const amplifier = num(p.amplifier, 0)
        return (
          <span>
            {EFFECT_LABELS[effectType] ?? effectType} · {(duration / 20).toFixed(0)}s · 等级 {amplifier + 1}
          </span>
        )
      }}
    />
  )
}

function AttrChip({
  active,
  label,
  colorClass,
}: {
  active: boolean
  label: string
  colorClass: 'emerald' | 'pink' | 'cyan'
}) {
  const activeClass = {
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    pink: 'border-pink-500/30 bg-pink-500/10 text-pink-300',
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  }[colorClass]

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-0.5 rounded border px-1 py-1 text-[9px]',
        active
          ? activeClass
          : 'border-border/20 bg-muted/10 text-muted-foreground/40',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-current' : 'bg-muted-foreground/30')} />
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

export const PotionNodeCard = memo(PotionNodeCardImpl)
