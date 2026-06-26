'use client'

/**
 * BooleanField — 布尔开关字段
 *
 * 用于 PropertySchema.type === 'boolean'，使用 shadcn Switch。
 * 标签与开关同行，节省垂直空间。
 */

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { FieldProps } from './field-types'

export function BooleanField({ schema, value, onChange }: FieldProps) {
  const checked = Boolean(value)
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <div className="flex flex-col gap-0.5">
        <Label
          htmlFor={`field-${schema.key}`}
          className="text-[11px] font-medium text-muted-foreground"
        >
          {schema.label}
        </Label>
        {schema.description && (
          <span className="text-[10px] leading-tight text-muted-foreground/60">
            {schema.description}
          </span>
        )}
      </div>
      <Switch
        id={`field-${schema.key}`}
        checked={checked}
        onCheckedChange={(c) => onChange(c)}
        aria-label={schema.label}
      />
    </div>
  )
}
