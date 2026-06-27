'use client'

/**
 * PropertyGroup — 可折叠的属性分组容器
 *
 * 使用 shadcn Accordion 实现：
 *  - 标题显示分组名 + 字段数（badge）
 *  - 多个分组可独立展开（type="multiple"）
 *  - 默认展开第一组（defaultValue 传入第一个 group 名）
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { ChevronDown } from 'lucide-react'
import type { PropertySchema } from '@/lib/node-system'

interface PropertyGroupProps {
  /** 分组名 */
  name: string
  /** 该分组下的字段 schema 列表 */
  schemas: PropertySchema[]
  /** 子节点：渲染字段组件 */
  children?: React.ReactNode
  /** 是否默认展开 */
  defaultOpen?: boolean
  /** 用于在 Accordion 中保持唯一性 */
  groupId: string
}

export function PropertyGroup({
  name,
  schemas,
  children,
  defaultOpen,
  groupId,
}: PropertyGroupProps) {
  return (
    <AccordionItem
      value={groupId}
      className="border-b border-border/60 last:border-b-0"
    >
      <AccordionTrigger
        className="px-3 py-2.5 hover:no-underline"
        aria-label={`展开/折叠 ${name} 分组`}
      >
        <div className="flex flex-1 items-center justify-between gap-2 pr-1">
          <span className="text-xs font-semibold text-foreground">{name}</span>
          <Badge
            variant="secondary"
            className="h-4 px-1.5 text-[10px] font-normal text-muted-foreground"
          >
            {schemas.length}
          </Badge>
        </div>
        <ChevronDown className="text-muted-foreground pointer-events-none size-3.5 shrink-0 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3 pt-1">
        <div className="space-y-3">{children}</div>
      </AccordionContent>
    </AccordionItem>
  )
}

/**
 * PropertyGroupList — 多个分组的容器
 *
 * 包装 shadcn Accordion，提供 multiple 模式 + 默认展开第一组。
 */
interface PropertyGroupListProps {
  /** 默认展开的分组 ID 列表 */
  defaultValues?: string[]
  children: React.ReactNode
}

export function PropertyGroupList({
  defaultValues,
  children,
}: PropertyGroupListProps) {
  return (
    <Accordion
      type="multiple"
      defaultValue={defaultValues}
      className="w-full"
    >
      {children}
    </Accordion>
  )
}
