'use client'

/**
 * React Flow v12 自定义节点类型注册表
 *
 * 把所有 NODE_TYPE_REGISTRY 中注册的 kind 映射到对应的卡片组件：
 *  - entity / block / item：专用卡片（EntityNodeCard / BlockNodeCard / ItemNodeCard）
 *  - group：GroupNodeCard（带 NodeResizer）
 *  - blackbox：BlackboxNodeCard（虚线警告样式 + 代码预览）
 *  - function：GenericNodeCard（基于 BaseNodeCard 回退）
 *  - logic_*（5 种）：LogicNodeCard（紧凑逻辑子节点卡片）
 *  - debug_log / debug_breakpoint：LogicNodeCard（同属 logic 分类，紧凑展示）
 *
 * 重要：nodeTypes 必须是模块级常量（或在组件内 useMemo），不能在每次渲染时
 * 创建新对象，否则 React Flow v12 会打印警告并丢失内部状态。
 */

import type { NodeTypes } from '@xyflow/react'
import { EntityNodeCard } from './entity-node-card'
import { BlockNodeCard } from './block-node-card'
import { ItemNodeCard } from './item-node-card'
import { GroupNodeCard } from './group-node-card'
import { BlackboxNodeCard } from './blackbox-node-card'
import { GenericNodeCard } from './generic-node-card'
import { LogicNodeCard } from './logic-node-card'

export const nodeTypes = {
  // 核心节点（专用卡片）
  entity: EntityNodeCard,
  block: BlockNodeCard,
  item: ItemNodeCard,
  // 阶段 8 新增核心节点（用 GenericNodeCard，基于 BaseNodeCard）
  equipment: GenericNodeCard,
  weapon: GenericNodeCard,
  food: GenericNodeCard,
  biome: GenericNodeCard,
  structure: GenericNodeCard,
  dimension: GenericNodeCard,
  potion: GenericNodeCard,
  // 高级节点
  group: GroupNodeCard,
  blackbox: BlackboxNodeCard,
  function: GenericNodeCard,
  // 逻辑子节点（专用紧凑卡片）
  logic_event: LogicNodeCard,
  logic_condition: LogicNodeCard,
  logic_loop: LogicNodeCard,
  logic_action: LogicNodeCard,
  logic_variable: LogicNodeCard,
  // 调试节点（同样使用紧凑逻辑卡片）
  debug_log: LogicNodeCard,
  debug_breakpoint: LogicNodeCard,
} satisfies NodeTypes

export type NodeKindKey = keyof typeof nodeTypes

export {
  EntityNodeCard,
  BlockNodeCard,
  ItemNodeCard,
  GroupNodeCard,
  BlackboxNodeCard,
  GenericNodeCard,
  LogicNodeCard,
}

