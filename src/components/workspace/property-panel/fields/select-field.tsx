'use client'

/**
 * SelectField — 下拉选择字段
 *
 * 用于 PropertySchema.type === 'select'，使用 shadcn Select。
 * schema.options 必须提供 { label, value } 数组。
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { FieldProps } from './field-types'

export function SelectField({ schema, value, onChange }: FieldProps) {
  const current = typeof value === 'string' ? value : String(value ?? '')
  const options = schema.options ?? []

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground">
        {schema.label}
      </Label>
      <Select
        value={current}
        onValueChange={(v) => onChange(v)}
      >
        <SelectTrigger className="h-8 w-full text-xs" size="sm">
          <SelectValue placeholder={schema.placeholder ?? '请选择'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {schema.description && (
        <p className="text-[10px] leading-tight text-muted-foreground/60">
          {schema.description}
        </p>
      )}
    </div>
  )
}
