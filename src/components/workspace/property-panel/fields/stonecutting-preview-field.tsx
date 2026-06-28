'use client'

/**
 * 切石预览字段
 *
 * 用于 stonecutting 类型的配方。
 * 可视化：输入 → 切石机 → 产物。
 */

import { Scissors, ArrowRight } from 'lucide-react'

interface StonecuttingPreviewFieldProps {
  inputItem: string
  resultItem: string
  resultCount: number
  onInputChange: (item: string) => void
  onResultChange: (item: string, count: number) => void
}

export function StonecuttingPreviewField({
  inputItem, resultItem, resultCount,
  onInputChange, onResultChange,
}: StonecuttingPreviewFieldProps) {
  return (
    <div className="space-y-3">
      {/* 标题 */}
      <div className="flex items-center gap-1.5">
        <Scissors className="h-3.5 w-3.5 text-orange-400" />
        <span className="text-[11px] font-medium text-foreground">切石机配方</span>
      </div>

      {/* 输入 → 切石机 → 产物 */}
      <div className="flex items-center justify-center gap-3 py-2">
        {/* 输入 */}
        <div className="flex flex-col items-center gap-1">
          <input
            type="text"
            value={inputItem}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="输入方块"
            className="w-20 rounded-lg border border-orange-500/30 bg-orange-500/5 px-2 py-1.5 text-center text-[9px] font-mono text-orange-300 placeholder:text-orange-300/30 focus:border-orange-500/50 focus:outline-none"
          />
          <span className="text-[8px] text-muted-foreground/50">输入</span>
        </div>

        {/* 切石机图标 */}
        <Scissors className="h-5 w-5 text-orange-400" />

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

      {/* 提示 */}
      <div className="text-[9px] text-muted-foreground/50">
        💡 切石机配方不支持经验值。1 个输入物品 → 1~64 个产物。
      </div>
    </div>
  )
}
