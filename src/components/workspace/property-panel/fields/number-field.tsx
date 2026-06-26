'use client'

/**
 * NumberField — 数值输入字段
 *
 * 用于 PropertySchema.type === 'number'，支持 min/max/step。
 *
 * 实现细节：
 *  - 本地维护 string 状态以允许输入过渡值（如 "0." / "-" / 空字符串）
 *  - 仅在解析为合法数字且在 min/max 范围内时才向父组件 propagate
 *  - 输入框右侧显示单位（schema.description）若有
 */

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FieldProps } from './field-types'

function valueToInitialString(value: unknown, fallback: number): string {
  if (typeof value === 'number' && !Number.isNaN(value)) return String(value)
  if (value === null || value === undefined) return String(fallback)
  return String(fallback)
}

export function NumberField({ schema, value, onChange }: FieldProps) {
  const fallback = typeof schema.defaultValue === 'number' ? schema.defaultValue : 0
  const [local, setLocal] = useState<string>(() => valueToInitialString(value, fallback))
  const [tracked, setTracked] = useState(value)

  // 外部 value 变化时同步本地（derived-state-during-render 模式，避免 useEffect+setState）
  if (value !== tracked) {
    setTracked(value)
    setLocal(valueToInitialString(value, fallback))
  }

  const min = schema.min
  const max = schema.max
  const step = schema.step ?? 1

  function commit(raw: string) {
    setLocal(raw)
    if (raw === '' || raw === '-' || raw === '.') {
      // 输入过渡态：不向 store propagate，避免 NaN
      return
    }
    const parsed = Number(raw)
    if (Number.isNaN(parsed)) return
    let clamped = parsed
    if (typeof min === 'number') clamped = Math.max(min, clamped)
    if (typeof max === 'number') clamped = Math.min(max, clamped)
    // 如果 clamp 改变了值，回写本地（避免显示超出范围的值）
    if (clamped !== parsed) {
      setLocal(String(clamped))
    }
    onChange(clamped)
  }

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={`field-${schema.key}`}
        className="text-[11px] font-medium text-muted-foreground"
      >
        {schema.label}
      </Label>
      <div className="relative">
        <Input
          id={`field-${schema.key}`}
          type="number"
          inputMode="decimal"
          value={local}
          min={min}
          max={max}
          step={step}
          onChange={(e) => commit(e.target.value)}
          className="h-8 pr-12 text-xs"
        />
        {schema.description && (
          <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[10px] text-muted-foreground/60">
            {schema.description}
          </span>
        )}
      </div>
      {(typeof min === 'number' || typeof max === 'number') && (
        <p className="text-[10px] leading-tight text-muted-foreground/60">
          {typeof min === 'number' && typeof max === 'number'
            ? `范围 ${min} ~ ${max}`
            : typeof min === 'number'
              ? `最小 ${min}`
              : `最大 ${max}`}
        </p>
      )}
    </div>
  )
}
