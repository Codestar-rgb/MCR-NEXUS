'use client'

/**
 * Vec3Field — 三轴数值输入字段
 *
 * 用于 PropertySchema.type === 'vec3'，值为 { x, y, z }。
 * 典型场景：实体碰撞箱、方块尺寸、坐标偏移。
 *
 * 三个输入框并排，标签 x/y/z 用对应 tailwind 色：
 *  - x: rose
 *  - y: emerald
 *  - z: cyan
 */

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { FieldProps } from './field-types'

interface Vec3 {
  x: number
  y: number
  z: number
}

const AXIS_COLORS: { axis: keyof Vec3; color: string }[] = [
  { axis: 'x', color: 'text-rose-400' },
  { axis: 'y', color: 'text-emerald-400' },
  { axis: 'z', color: 'text-cyan-400' },
]

function toVec3(v: unknown, fallback: Vec3): Vec3 {
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return {
      x: typeof o.x === 'number' ? o.x : fallback.x,
      y: typeof o.y === 'number' ? o.y : fallback.y,
      z: typeof o.z === 'number' ? o.z : fallback.z,
    }
  }
  return fallback
}

function vec3ToStrings(v: Vec3) {
  return { x: String(v.x), y: String(v.y), z: String(v.z) }
}

export function Vec3Field({ schema, value, onChange }: FieldProps) {
  const fallback = (schema.defaultValue && typeof schema.defaultValue === 'object'
    ? (schema.defaultValue as Vec3)
    : { x: 0, y: 0, z: 0 })
  const vec = toVec3(value, fallback)

  // 本地 string 状态，允许过渡值
  const [local, setLocal] = useState<{ x: string; y: string; z: string }>(() =>
    vec3ToStrings(vec),
  )
  const [tracked, setTracked] = useState(value)

  // 外部 value 变化时同步本地（derived-state-during-render 模式）
  if (value !== tracked) {
    setTracked(value)
    setLocal(vec3ToStrings(vec))
  }

  function commit(axis: keyof Vec3, raw: string) {
    setLocal((s) => ({ ...s, [axis]: raw }))
    if (raw === '' || raw === '-' || raw === '.') return
    const parsed = Number(raw)
    if (Number.isNaN(parsed)) return
    const next: Vec3 = { ...vec, [axis]: parsed }
    onChange(next)
  }

  const min = schema.min
  const max = schema.max
  const step = schema.step ?? 0.1

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground">
        {schema.label}
      </Label>
      <div className="grid grid-cols-3 gap-1.5">
        {AXIS_COLORS.map(({ axis, color }) => (
          <div key={axis} className="relative">
            <span
              className={cn(
                'pointer-events-none absolute top-1/2 left-2 z-10 -translate-y-1/2 text-[10px] font-bold uppercase',
                color,
              )}
            >
              {axis}
            </span>
            <Input
              type="number"
              inputMode="decimal"
              value={local[axis]}
              min={min}
              max={max}
              step={step}
              onChange={(e) => commit(axis, e.target.value)}
              className="h-8 pl-6 text-xs"
              aria-label={`${schema.label} ${axis}`}
            />
          </div>
        ))}
      </div>
      {schema.description && (
        <p className="text-[10px] leading-tight text-muted-foreground/60">
          {schema.description}
        </p>
      )}
    </div>
  )
}
