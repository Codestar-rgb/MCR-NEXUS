'use client'

/**
 * StringField — 文本输入字段
 *
 * 用于 PropertySchema.type === 'string'，支持 placeholder 与 description。
 * 受控模式：value 来自父组件，onChange 实时同步到 store。
 *
 * 注意：blackbox 节点的 sourceCode 字段也是 string 类型，但内容是多行 Java 代码。
 * 这里通过 schema.key === 'sourceCode' 检测并切换为 Textarea。
 */

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { FieldProps } from './field-types'

export function StringField({ schema, value, onChange }: FieldProps) {
  const str = typeof value === 'string' ? value : ''
  // 本地状态用于即时 UI 反馈，避免每次按键都经过 store round-trip 造成卡顿
  const [local, setLocal] = useState(str)
  const [tracked, setTracked] = useState(value)

  // 当外部 value 变化（如撤销/重做/切换节点）时同步本地
  // 使用 derived-state-during-render 模式（React 推荐做法，避免 useEffect+setState）
  if (value !== tracked) {
    setTracked(value)
    setLocal(typeof value === 'string' ? value : '')
  }

  const isMultiline = schema.key === 'sourceCode'

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={`field-${schema.key}`}
        className="text-[11px] font-medium text-muted-foreground"
      >
        {schema.label}
      </Label>
      {isMultiline ? (
        <Textarea
          id={`field-${schema.key}`}
          value={local}
          placeholder={schema.placeholder}
          onChange={(e) => {
            setLocal(e.target.value)
            onChange(e.target.value)
          }}
          className="min-h-[120px] resize-y font-mono text-xs"
          spellCheck={false}
        />
      ) : (
        <Input
          id={`field-${schema.key}`}
          type="text"
          value={local}
          placeholder={schema.placeholder}
          onChange={(e) => {
            setLocal(e.target.value)
            onChange(e.target.value)
          }}
          className="h-8 text-xs"
        />
      )}
      {schema.description && (
        <p className="text-[10px] leading-tight text-muted-foreground/70">
          {schema.description}
        </p>
      )}
    </div>
  )
}
