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
import { EquipmentNodeCard } from './equipment-node-card'
import { WeaponNodeCard } from './weapon-node-card'
import { FoodNodeCard } from './food-node-card'
import { BiomeNodeCard } from './biome-node-card'
import { StructureNodeCard } from './structure-node-card'
import { DimensionNodeCard } from './dimension-node-card'
import { PotionNodeCard } from './potion-node-card'
import { GroupNodeCard } from './group-node-card'
import { BlackboxNodeCard } from './blackbox-node-card'
import { GenericNodeCard } from './generic-node-card'
import { LogicNodeCard } from './logic-node-card'
import { RecipeNodeCard } from './recipe-node-card'

export const nodeTypes = {
  // 核心节点（专用卡片）
  entity: EntityNodeCard,
  block: BlockNodeCard,
  item: ItemNodeCard,
  // 阶段 8 新增核心节点（专用卡片）
  equipment: EquipmentNodeCard,
  weapon: WeaponNodeCard,
  food: FoodNodeCard,
  biome: BiomeNodeCard,
  structure: StructureNodeCard,
  dimension: DimensionNodeCard,
  potion: PotionNodeCard,
  // 高级节点
  group: GroupNodeCard,
  blackbox: BlackboxNodeCard,
  function: GenericNodeCard,
  // 插件贡献的节点类型（用 GenericNodeCard 渲染）
  spell: GenericNodeCard,
  // 附魔/成就节点
  enchantment: GenericNodeCard,
  advancement: GenericNodeCard,
  // 配方节点（专用卡片，3x3 网格 / 熔炉预览）
  recipe: RecipeNodeCard,
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

