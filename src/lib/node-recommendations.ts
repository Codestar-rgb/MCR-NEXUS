/**
 * 智能节点推荐引擎
 *
 * 创建节点后，根据节点类型推荐关联节点：
 * - entity → 生怪蛋(item) + 掉落物(item)
 * - block → 方块物品(item)
 * - weapon → 修复材料(item) + 附魔书(item)
 * - food → 食物效果(potion)
 * - biome → 结构(structure)
 */

import type { NodeKind } from '@/lib/node-system'

export interface Recommendation {
  kind: NodeKind
  title: string
  reason: string
  properties: Record<string, unknown>
  positionOffset: { x: number; y: number }
}

export function getRecommendations(nodeKind: string, nodeName: string): Recommendation[] {
  const recommendations: Record<string, Recommendation[]> = {
    entity: [
      {
        kind: 'item',
        title: `${nodeName} 生怪蛋`,
        reason: '为实体创建生怪蛋物品',
        properties: {
          name: `${nodeName} 生怪蛋`,
          registryId: `${nodeName.toLowerCase().replace(/\s+/g, '_')}_spawn_egg`,
          maxStackSize: 64,
          rarity: 'uncommon',
          useCooldown: 0,
          isFood: false,
          nutrition: 0,
          saturation: 0,
          texture: null,
        },
        positionOffset: { x: -280, y: 80 },
      },
    ],
    block: [
      {
        kind: 'item',
        title: `${nodeName} 物品`,
        reason: '为方块创建对应的物品形式',
        properties: {
          name: `${nodeName}`,
          registryId: `${nodeName.toLowerCase().replace(/\s+/g, '_')}_item`,
          maxStackSize: 64,
          rarity: 'common',
          useCooldown: 0,
          isFood: false,
          nutrition: 0,
          saturation: 0,
          texture: null,
        },
        positionOffset: { x: -280, y: 0 },
      },
    ],
    weapon: [
      {
        kind: 'item',
        title: '修复材料',
        reason: '武器的修复材料',
        properties: {
          name: '修复材料',
          registryId: 'repair_material',
          maxStackSize: 64,
          rarity: 'common',
          useCooldown: 0,
          isFood: false,
          nutrition: 0,
          saturation: 0,
          texture: null,
        },
        positionOffset: { x: -280, y: 60 },
      },
    ],
    food: [
      {
        kind: 'potion',
        title: '食用效果',
        reason: '食物食用后可能附带的药水效果',
        properties: {
          name: '食用效果',
          registryId: 'food_effect',
          effectType: 'saturation',
          duration: 100,
          amplifier: 0,
          isAmbient: false,
          isBeneficial: true,
          color: '93000A',
          hasIcon: true,
        },
        positionOffset: { x: 280, y: 0 },
      },
    ],
    biome: [
      {
        kind: 'structure',
        title: '群系结构',
        reason: '在此群系中生成的结构',
        properties: {
          name: `${nodeName}结构`,
          registryId: `${nodeName.toLowerCase().replace(/\s+/g, '_')}_structure`,
          structureType: 'village',
          biomeList: 'minecraft:plains',
          spawnChance: 0.02,
          minDistance: 32,
          maxDistance: 128,
        },
        positionOffset: { x: 280, y: 0 },
      },
    ],
  }

  return recommendations[nodeKind] ?? []
}
