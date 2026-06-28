'use client'

/**
 * 实体 AI 行为可视化面板
 *
 * 在实体节点的属性面板中作为第三个 Tab 显示。
 * 以可视化方式展示 AI 目标优先级，允许拖拽排序。
 *
 * AI 目标类型：
 *  - FloatGoal（防溺水）— 固定优先级 0
 *  - MeleeAttackGoal（近战攻击）
 *  - NearestAttackableTargetGoal（追踪玩家）
 *  - PanicGoal（逃窜）
 *  - LookAtPlayerGoal（看玩家）
 *  - RandomStrollGoal（随机游走）
 *  - RandomLookAroundGoal（随机看）
 *
 * 优先级数字越小越高（0 最高）。
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Waves, Swords, Eye, Footprints, Zap, Compass, ChevronUp, ChevronDown, Plus, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/** AI 目标定义 */
interface AIGoal {
  id: string
  name: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  priority: number
  isTarget?: boolean // 是否为 targetSelector（而非 goalSelector）
  removable?: boolean
}

/** 根据 aiType 属性生成默认 AI 目标列表 */
function generateGoals(aiType: string): AIGoal[] {
  const base: AIGoal[] = [
    { id: 'float', name: '防溺水', desc: '在水中浮起', icon: Waves, priority: 0, removable: false },
    { id: 'look_around', name: '随机看', desc: '随机转动方向', icon: Compass, priority: 8, removable: false },
  ]

  switch (aiType) {
    case 'melee':
      return [
        ...base.slice(0, 1),
        { id: 'melee', name: '近战攻击', desc: '接近并攻击目标', icon: Swords, priority: 2, removable: true },
        { id: 'chase', name: '追踪玩家', desc: '锁定最近玩家为目标', icon: Eye, priority: 2, isTarget: true, removable: true },
        { id: 'stroll', name: '随机游走', desc: '空闲时漫步', icon: Footprints, priority: 7, removable: true },
        ...base.slice(1),
      ]
    case 'ranged':
      return [
        ...base.slice(0, 1),
        { id: 'melee', name: '近战攻击', desc: '接近并攻击目标', icon: Swords, priority: 2, removable: true },
        { id: 'ranged', name: '远程攻击', desc: '保持距离远程攻击', icon: Zap, priority: 3, removable: true },
        { id: 'chase', name: '追踪玩家', desc: '锁定最近玩家为目标', icon: Eye, priority: 2, isTarget: true, removable: true },
        { id: 'stroll', name: '随机游走', desc: '空闲时漫步', icon: Footprints, priority: 7, removable: true },
        ...base.slice(1),
      ]
    case 'panic':
      return [
        ...base.slice(0, 1),
        { id: 'panic', name: '逃窜', desc: '受击后逃跑', icon: Zap, priority: 1, removable: true },
        { id: 'stroll', name: '随机游走', desc: '空闲时漫步', icon: Footprints, priority: 7, removable: true },
        ...base.slice(1),
      ]
    case 'look':
      return [
        ...base.slice(0, 1),
        { id: 'look_player', name: '看玩家', desc: '面向附近玩家', icon: Eye, priority: 6, removable: true },
        { id: 'stroll', name: '随机游走', desc: '空闲时漫步', icon: Footprints, priority: 7, removable: true },
        ...base.slice(1),
      ]
    case 'wander':
      return [
        ...base.slice(0, 1),
        { id: 'stroll', name: '随机游走', desc: '空闲时漫步', icon: Footprints, priority: 7, removable: true },
        ...base.slice(1),
      ]
    default: // 'none'
      return base
  }
}

interface AIBehaviorPanelProps {
  aiType: string
  onAiTypeChange: (type: string) => void
}

const AI_TYPE_LABELS: Record<string, string> = {
  none: '无 AI',
  melee: '近战攻击',
  ranged: '远程攻击',
  panic: '逃窜',
  look: '看玩家',
  wander: '游走',
}

export function AIBehaviorPanel({ aiType, onAiTypeChange }: AIBehaviorPanelProps) {
  const [goals, setGoals] = React.useState<AIGoal[]>(() => generateGoals(aiType))

  // aiType 变化时重新生成
  React.useEffect(() => {
    setGoals(generateGoals(aiType))
  }, [aiType])

  const moveGoal = (index: number, direction: 'up' | 'down') => {
    const newGoals = [...goals]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newGoals.length) return
    ;[newGoals[index], newGoals[swapIndex]] = [newGoals[swapIndex], newGoals[index]]
    setGoals(newGoals)
    toast.success('已调整 AI 目标优先级')
  }

  const removeGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id))
    toast.success('已移除 AI 目标')
  }

  // 按优先级排序显示
  const sortedGoals = [...goals].sort((a, b) => a.priority - b.priority)

  return (
    <div className="space-y-3">
      {/* AI 类型快速切换 */}
      <div>
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
          AI 行为模板
        </p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(AI_TYPE_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => onAiTypeChange(value)}
              className={cn(
                'rounded-md border px-2 py-1 text-[10px] font-medium transition-colors',
                aiType === value
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border/30 bg-card/30 text-muted-foreground hover:border-primary/30 hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* AI 目标列表 */}
      <div>
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
          AI 目标（按优先级排序）
        </p>
        <div className="space-y-1">
          {sortedGoals.map((goal, index) => {
            const Icon = goal.icon
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  'group flex items-center gap-2 rounded-lg border px-2.5 py-1.5',
                  goal.isTarget
                    ? 'border-rose-500/20 bg-rose-500/5'
                    : 'border-border/30 bg-card/20',
                )}
              >
                {/* 优先级数字 */}
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 font-mono text-[9px] font-bold text-primary">
                  {goal.priority}
                </span>

                {/* 图标 */}
                <Icon className={cn('h-3.5 w-3.5 shrink-0', goal.isTarget ? 'text-rose-400' : 'text-primary')} />

                {/* 名称 + 描述 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-medium text-foreground">{goal.name}</span>
                    {goal.isTarget && (
                      <span className="rounded bg-rose-500/15 px-1 py-px text-[8px] font-bold uppercase text-rose-300">
                        目标
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[9px] text-muted-foreground/60">{goal.desc}</p>
                </div>

                {/* 上移/下移按钮 */}
                <div className="flex shrink-0 flex-col">
                  <button
                    onClick={() => moveGoal(index, 'up')}
                    disabled={index === 0}
                    className="text-muted-foreground/40 hover:text-primary disabled:opacity-20"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => moveGoal(index, 'down')}
                    disabled={index === sortedGoals.length - 1}
                    className="text-muted-foreground/40 hover:text-primary disabled:opacity-20"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>

                {/* 删除按钮 */}
                {goal.removable && (
                  <button
                    onClick={() => removeGoal(goal.id)}
                    className="shrink-0 text-muted-foreground/30 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* 说明 */}
      <div className="rounded-lg border border-border/20 bg-muted/10 p-2 text-[9px] leading-relaxed text-muted-foreground/60">
        <p>
          💡 优先级数字越小越高（0 最高）。<span className="text-rose-300">目标</span> 类型决定实体追击什么，
          其他目标决定实体如何行动。AI 模板切换会重置目标列表。
        </p>
      </div>
    </div>
  )
}
