'use client'

/**
 * PropertyForm — Schema 驱动的动态属性表单
 *
 * 职责：
 *  - 接收 nodeKind + properties
 *  - 从 NODE_TYPE_REGISTRY 获取 propertiesSchema
 *  - 按 schema.group 分组（基础 / 战斗 / AI / 物理 / 贴图 等）
 *  - 为每个 schema 渲染对应字段组件（renderField 路由）
 *  - 字段变更时调用 onChange(key, value)
 *
 * 不负责：
 *  - 持久化（由父组件 property-panel 处理 debounce + API 调用）
 *  - 节点选中状态（由 property-panel 读取 store）
 */

import { useMemo } from 'react'
import { getNodeTypeDefinition, type PropertySchema } from '@/lib/node-system'
import { PropertyGroup, PropertyGroupList } from './property-group'
import { renderField } from './fields'

interface PropertyFormProps {
  /** 节点类型 key（对应 NODE_TYPE_REGISTRY key） */
  nodeKind: string
  /** 节点当前属性 */
  properties: Record<string, unknown>
  /** 单字段变更回调 */
  onChange: (key: string, value: unknown) => void
}

interface GroupedSchemas {
  name: string
  schemas: PropertySchema[]
}

const DEFAULT_GROUP_NAME = '其他'

export function PropertyForm({
  nodeKind,
  properties,
  onChange,
}: PropertyFormProps) {
  const def = getNodeTypeDefinition(nodeKind)

  // 按 group 分组（保留首次出现顺序）
  const groups = useMemo<GroupedSchemas[]>(() => {
    if (!def) return []
    const map = new Map<string, PropertySchema[]>()
    const order: string[] = []
    for (const s of def.propertiesSchema) {
      const g = s.group ?? DEFAULT_GROUP_NAME
      if (!map.has(g)) {
        map.set(g, [])
        order.push(g)
      }
      map.get(g)!.push(s)
    }
    return order.map((name) => ({ name, schemas: map.get(name)! }))
  }, [def])

  // 默认展开第一组
  const defaultOpen = useMemo(() => {
    if (groups.length === 0) return []
    return [groups[0].name]
  }, [groups])

  if (!def) {
    return (
      <div className="rounded-md border border-dashed border-rose-500/40 bg-rose-500/5 px-3 py-4 text-center text-xs text-rose-400">
        未知节点类型：{nodeKind}
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
        该节点类型暂无可编辑属性
      </div>
    )
  }

  return (
    <PropertyGroupList defaultValues={defaultOpen}>
      {groups.map((g) => (
        <PropertyGroup
          key={g.name}
          groupId={g.name}
          name={g.name}
          schemas={g.schemas}
        >
          {g.schemas.map((schema) =>
            renderField(
              schema,
              properties[schema.key] ?? schema.defaultValue,
              (v) => onChange(schema.key, v),
            ),
          )}
        </PropertyGroup>
      ))}
    </PropertyGroupList>
  )
}
