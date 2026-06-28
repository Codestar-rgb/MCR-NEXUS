'use client'

/**
 * 烧炼预览字段
 *
 * 用于 smelting/blasting/smoking 类型的配方。
 * 可视化：输入 → 火焰 → 产物 + 烧制时间/经验。
 */

import * as React from 'react'
import { Flame, ArrowRight, Clock, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SmeltingPreviewFieldProps {
  recipeType: string
  inputItem: string
  resultItem: string
  resultCount: number
  cookingTime: number
  experience: number
  onInputChange: (item: string) => void
  onResultChange: (item: string, count: number) => void
  onCookingTimeChange: (time: number) => void
  onExperienceChange: (exp: number) => void
}

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  smelting: { label: '熔炉', icon: '🔥', color: 'text-orange-400' },
  blasting: { label: '高炉', icon: '⚡', color: 'text-amber-400' },
  smoking: { label: '烟熏炉', icon: '💨', color: 'text-rose-400' },
}

function shortId(id: string): string {
  if (!id) return ''
  return id.split(':').pop() || id
}

export function SmeltingPreviewField({
  recipeType, inputItem, resultItem, resultCount,
  cookingTime, experience,
  onInputChange, onResultChange, onCookingTimeChange, onExperienceChange,
}: SmeltingPreviewFieldProps) {
  const typeMeta = TYPE_LABELS[recipeType] ?? TYPE_LABELS.smelting
  const seconds = (cookingTime / 20).toFixed(1)

  return (
    <div className="space-y-3">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame className={cn('h-3.5 w-3.5', typeMeta.color)} />
          <span className="text-[11px] font-medium text-foreground">{typeMeta.label}配方</span>
        </div>
        <span className={cn('text-[10px]', typeMeta.color)}>{typeMeta.icon} {typeMeta.label}</span>
      </div>

      {/* 输入 → 火焰 → 产物 */}
      <div className="flex items-center justify-center gap-3 py-2">
        {/* 输入 */}
        <div className="flex flex-col items-center gap-1">
          <input
            type="text"
            value={inputItem}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="输入物品"
            className="w-20 rounded-lg border border-orange-500/30 bg-orange-500/5 px-2 py-1.5 text-center text-[9px] font-mono text-orange-300 placeholder:text-orange-300/30 focus:border-orange-500/50 focus:outline-none"
          />
          <span className="text-[8px] text-muted-foreground/50">输入</span>
        </div>

        {/* 火焰动画 */}
        <div className="relative h-8 w-8">
          <Flame className="absolute inset-0 h-8 w-8 text-orange-500 animate-pulse" />
          <Flame className="absolute inset-0 h-6 w-6 translate-x-1 translate-y-1 text-amber-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
        </div>

        <ArrowRight className="h-4 w-4 text-orange-400" />

        {/* 产物 */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-1">
            <input
              type="text"
              value={resultItem}
              onChange={(e) => onResultChange(e.target.value, resultCount)}
              placeholder="产物"
              className="w-20 rounded-lg border border-orange-500/40 bg-orange-500/10 px-2 py-1.5 text-center text-[9px] font-mono text-orange-300 placeholder:text-orange-300/30 focus:border-orange-500/60 focus:outline-none"
            />
            <input
              type="number"
              value={resultCount}
              min={1}
              max={64}
              onChange={(e) => onResultChange(resultItem, Math.max(1, Math.min(64, Number(e.target.value) || 1)))}
              className="w-10 rounded-lg border border-orange-500/40 bg-orange-500/10 px-1 py-1.5 text-center text-[10px] font-mono text-orange-300 focus:border-orange-500/60 focus:outline-none"
            />
          </div>
          <span className="text-[8px] text-muted-foreground/50">产物 × 数量</span>
        </div>
      </div>

      {/* 烧制时间 + 经验 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/20 px-2.5 py-1.5">
          <Clock className="h-3 w-3 text-orange-400" />
          <span className="text-[10px] text-muted-foreground">时间</span>
          <input
            type="number"
            value={cookingTime}
            min={1}
            max={2000}
            step={20}
            onChange={(e) => onCookingTimeChange(Math.max(1, Number(e.target.value) || 1))}
            className="ml-auto w-14 rounded border border-border/40 bg-background px-1 py-0.5 text-center text-[10px] font-mono text-orange-300 focus:border-orange-500/40 focus:outline-none"
          />
          <span className="text-[9px] text-muted-foreground/50">tick ({seconds}s)</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/20 px-2.5 py-1.5">
          <Zap className="h-3 w-3 text-amber-400" />
          <span className="text-[10px] text-muted-foreground">经验</span>
          <input
            type="number"
            value={experience}
            min={0}
            max={100}
            step={0.1}
            onChange={(e) => onExperienceChange(Math.max(0, Number(e.target.value) || 0))}
            className="ml-auto w-12 rounded border border-border/40 bg-background px-1 py-0.5 text-center text-[10px] font-mono text-amber-300 focus:border-amber-500/40 focus:outline-none"
          />
          <span className="text-[9px] text-muted-foreground/50">XP</span>
        </div>
      </div>

      {/* 提示 */}
      <div className="text-[9px] text-muted-foreground/50">
        💡 1 秒 = 20 tick。标准熔炉 200 tick（10s），高炉/烟熏炉 100 tick（5s）。
      </div>
    </div>
  )
}
