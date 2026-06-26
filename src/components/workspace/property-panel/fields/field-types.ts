'use client'

/**
 * 字段组件共享类型
 *
 * 每个字段组件接收 schema + value + onChange，以受控模式工作。
 * - schema：来自 NODE_TYPE_REGISTRY 的 PropertySchema，描述字段元信息
 * - value：当前字段值（与 schema.defaultValue 同型）
 * - onChange：值变更回调，由 property-form 转发到 property-panel，
 *   property-panel 再同步到 canvas store + debounce 300ms 持久化到 API
 */

import type { PropertySchema } from '@/lib/node-system'

export interface FieldProps {
  schema: PropertySchema
  value: unknown
  onChange: (value: unknown) => void
}
