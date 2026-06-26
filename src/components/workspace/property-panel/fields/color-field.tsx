'use client'

/**
 * ColorField — 颜色选择字段
 *
 * 用于 PropertySchema.type === 'color'，存储 tailwind 色名（如 'rose'）。
 *
 * UI：
 *  - 8 种预设色块（rose/amber/teal/cyan/emerald/violet/slate/zinc）
 *  - 自定义 hex 输入框（用于扩展颜色，存原值）
 *  - 当前选中色有 ring 高亮
 */

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FieldProps } from './field-types'

/** 8 种预设色（与 canvas store TAILWIND_COLOR_HEX 对齐） */
const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: 'rose', hex: '#f43f5e' },
  { name: 'amber', hex: '#f59e0b' },
  { name: 'teal', hex: '#14b8a6' },
  { name: 'cyan', hex: '#06b6d4' },
  { name: 'emerald', hex: '#10b981' },
  { name: 'violet', hex: '#8b5cf6' },
  { name: 'slate', hex: '#64748b' },
  { name: 'zinc', hex: '#71717a' },
]

/** 判断字符串是否为合法 hex 颜色 */
function isHex(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s)
}

export function ColorField({ schema, value, onChange }: FieldProps) {
  const current = typeof value === 'string' ? value : ''
  const isPreset = PRESET_COLORS.some((c) => c.name === current)

  // 自定义 hex 本地状态
  const [customHex, setCustomHex] = useState<string>(isPreset ? '' : current)
  const [tracked, setTracked] = useState(current)

  // 外部 current 变化时同步本地（derived-state-during-render 模式）
  if (current !== tracked) {
    setTracked(current)
    setCustomHex(isPreset ? '' : current)
  }

  function handlePresetClick(name: string) {
    onChange(name)
    setCustomHex('')
  }

  function handleCustomChange(raw: string) {
    setCustomHex(raw)
    if (isHex(raw)) {
      onChange(raw)
    }
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground">
        {schema.label}
      </Label>

      {/* 预设色块网格 */}
      <div className="grid grid-cols-8 gap-1.5">
        {PRESET_COLORS.map((c) => {
          const selected = current === c.name
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => handlePresetClick(c.name)}
              className={cn(
                'relative aspect-square rounded-md border transition-all',
                selected
                  ? 'border-foreground ring-2 ring-foreground/40'
                  : 'border-border hover:scale-110 hover:border-foreground/40',
              )}
              style={{ backgroundColor: c.hex }}
              aria-label={`选择 ${c.name}`}
              title={c.name}
            >
              {selected && (
                <Check className="absolute inset-0 m-auto h-3 w-3 text-white drop-shadow" />
              )}
            </button>
          )
        })}
      </div>

      {/* 自定义 hex 输入 */}
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 shrink-0 rounded-md border border-border"
          style={{
            backgroundColor: isPreset
              ? PRESET_COLORS.find((c) => c.name === current)?.hex
              : isHex(current)
                ? current
                : 'transparent',
          }}
        />
        <Input
          type="text"
          value={customHex}
          placeholder="#RRGGBB"
          onChange={(e) => handleCustomChange(e.target.value)}
          className="h-8 flex-1 font-mono text-xs"
          maxLength={7}
        />
      </div>

      {schema.description && (
        <p className="text-[10px] leading-tight text-muted-foreground/60">
          {schema.description}
        </p>
      )}
    </div>
  )
}
