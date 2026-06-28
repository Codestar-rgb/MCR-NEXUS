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
import { RecipeGridField } from './fields/recipe-grid-field'
import { SmeltingPreviewField } from './fields/smelting-preview-field'
import { StonecuttingPreviewField } from './fields/stonecutting-preview-field'

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

  // recipe 节点：添加 3x3 网格编辑器（仅 crafting 类型）
  const isCraftingRecipe = nodeKind === 'recipe' && String(properties.recipeType ?? 'crafting') === 'crafting'
  const isSmeltingRecipe = nodeKind === 'recipe' && ['smelting', 'blasting', 'smoking'].includes(String(properties.recipeType ?? ''))
  const isStonecuttingRecipe = nodeKind === 'recipe' && String(properties.recipeType ?? '') === 'stonecutting'

  return (
    <PropertyGroupList defaultValues={defaultOpen}>
      {/* recipe 节点的 3x3 网格编辑器（crafting 类型） */}
      {isCraftingRecipe && (
        <PropertyGroup
          key="合成网格"
          groupId="合成网格"
          name="合成网格"
          schemas={[]}
        >
          <RecipeGridField
            grid={(properties.grid as string[]) ?? Array(9).fill('')}
            resultItem={String(properties.resultItem ?? 'minecraft:diamond')}
            resultCount={Number(properties.resultCount ?? 1)}
            shaped={Boolean(properties.shaped ?? true)}
            onGridChange={(grid) => onChange('grid', grid)}
            onResultChange={(item, count) => {
              onChange('resultItem', item)
              onChange('resultCount', count)
            }}
            onShapedChange={(shaped) => onChange('shaped', shaped)}
          />
        </PropertyGroup>
      )}

      {/* recipe 节点的烧炼预览（smelting/blasting/smoking） */}
      {isSmeltingRecipe && (
        <PropertyGroup
          key="烧炼预览"
          groupId="烧炼预览"
          name="烧炼预览"
          schemas={[]}
        >
          <SmeltingPreviewField
            recipeType={String(properties.recipeType ?? 'smelting')}
            inputItem={String(properties.ingredientA ?? 'minecraft:iron_ore')}
            resultItem={String(properties.resultItem ?? 'minecraft:iron_ingot')}
            resultCount={Number(properties.resultCount ?? 1)}
            cookingTime={Number(properties.cookingTime ?? 200)}
            experience={Number(properties.experience ?? 0.1)}
            onInputChange={(item) => onChange('ingredientA', item)}
            onResultChange={(item, count) => {
              onChange('resultItem', item)
              onChange('resultCount', count)
            }}
            onCookingTimeChange={(t) => onChange('cookingTime', t)}
            onExperienceChange={(e) => onChange('experience', e)}
          />
        </PropertyGroup>
      )}

      {/* recipe 节点的切石预览（stonecutting） */}
      {isStonecuttingRecipe && (
        <PropertyGroup
          key="切石预览"
          groupId="切石预览"
          name="切石预览"
          schemas={[]}
        >
          <StonecuttingPreviewField
            inputItem={String(properties.ingredientA ?? 'minecraft:stone')}
            resultItem={String(properties.resultItem ?? 'minecraft:stone_bricks')}
            resultCount={Number(properties.resultCount ?? 1)}
            onInputChange={(item) => onChange('ingredientA', item)}
            onResultChange={(item, count) => {
              onChange('resultItem', item)
              onChange('resultCount', count)
            }}
          />
        </PropertyGroup>
      )}

      {groups.map((g) => (
        <PropertyGroup
          key={g.name}
          groupId={g.name}
          name={g.name}
          schemas={g.schemas}
        >
          {/* recipe 节点：跳过 resultItem/resultCount（已在网格中编辑） */}
          {g.schemas
            .filter((schema) => {
              if (nodeKind === 'recipe' && (schema.key === 'resultItem' || schema.key === 'resultCount')) {
                return !isCraftingRecipe
              }
              return true
            })
            .map((schema) =>
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
