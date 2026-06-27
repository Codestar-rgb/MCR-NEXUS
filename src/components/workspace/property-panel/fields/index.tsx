'use client'

/**
 * 字段组件 barrel 导出
 *
 * 提供：
 *  - FieldProps：通用字段接口
 *  - 7 个字段组件：StringField / NumberField / BooleanField /
 *    SelectField / ColorField / Vec3Field / TextureField
 *  - renderField(schema, value, onChange)：根据 schema.type 路由到对应组件
 */

import type { PropertySchema } from '@/lib/node-system'
import type { FieldProps } from './field-types'
import { StringField } from './string-field'
import { NumberField } from './number-field'
import { BooleanField } from './boolean-field'
import { SelectField } from './select-field'
import { ColorField } from './color-field'
import { Vec3Field } from './vec3-field'
import { TextureField } from './texture-field'

export type { FieldProps }
export {
  StringField,
  NumberField,
  BooleanField,
  SelectField,
  ColorField,
  Vec3Field,
  TextureField,
}

/** 根据 schema.type 渲染对应字段组件 */
export function renderField(
  schema: PropertySchema,
  value: unknown,
  onChange: (value: unknown) => void,
) {
  const props: FieldProps = { schema, value, onChange }
  switch (schema.type) {
    case 'string':
      return <StringField {...props} />
    case 'number':
      return <NumberField {...props} />
    case 'boolean':
      return <BooleanField {...props} />
    case 'select':
      return <SelectField {...props} />
    case 'color':
      return <ColorField {...props} />
    case 'vec3':
      return <Vec3Field {...props} />
    case 'texture':
      return <TextureField {...props} />
    default:
      return (
        <div className="rounded border border-dashed border-rose-500/40 bg-rose-500/5 px-2 py-1 text-[10px] text-rose-400">
          未知字段类型：{schema.type}
        </div>
      )
  }
}
