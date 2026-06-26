'use client'

/**
 * React Flow v12 自定义节点类型注册表
 *
 * 把所有 NODE_TYPE_REGISTRY 中注册的 kind 映射到对应的卡片组件：
 *  - entity / block / item：专用卡片（EntityNodeCard / BlockNodeCard / ItemNodeCard）
 *  - group：GroupNodeCard（带 NodeResizer）
 *  - blackbox：BlackboxNodeCard（虚线警告样式 + 代码预览）
 *  - function / logic_*：GenericNodeCard（基于 BaseNodeCard 回退）
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

export const nodeTypes = {
  // 核心节点（专用卡片）
  entity: EntityNodeCard,
  block: BlockNodeCard,
  item: ItemNodeCard,
  // 高级节点
  group: GroupNodeCard,
  blackbox: BlackboxNodeCard,
  function: GenericNodeCard,
  // 逻辑子节点（暂用通用卡片渲染）
  logic_event: GenericNodeCard,
  logic_condition: GenericNodeCard,
  logic_loop: GenericNodeCard,
  logic_action: GenericNodeCard,
  logic_variable: GenericNodeCard,
} satisfies NodeTypes

export type NodeKindKey = keyof typeof nodeTypes

export {
  EntityNodeCard,
  BlockNodeCard,
  ItemNodeCard,
  GroupNodeCard,
  BlackboxNodeCard,
  GenericNodeCard,
}

