/**
 * 工作区模板定义
 *
 * 每个模板包含预置节点和连线，新建工作区时可选择。
 * 模板通过 API 创建节点（subGraphId = 新工作区 ID）。
 */

export interface TemplateNode {
  type: string
  title: string
  positionX: number
  positionY: number
  properties: Record<string, unknown>
}

export interface TemplateEdge {
  sourceIndex: number
  targetIndex: number
  sourcePort: string
  targetPort: string
  dataType: string
}

export interface WorkspaceTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  nodes: TemplateNode[]
  edges: TemplateEdge[]
}

export const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  {
    id: 'blank',
    name: '空白工作区',
    description: '从零开始，不含任何节点',
    icon: 'FileCode2',
    color: 'slate',
    nodes: [],
    edges: [],
  },
  {
    id: 'entity',
    name: '实体系统',
    description: '自定义生物实体 + AI 行为',
    icon: 'Boxes',
    color: 'rose',
    nodes: [
      {
        type: 'entity',
        title: '自定义生物',
        positionX: 300,
        positionY: 200,
        properties: {
          name: '自定义生物',
          registryId: 'custom_mob',
          health: 40,
          attack: 8,
          armor: 2,
          armorToughness: 0,
          movementSpeed: 0.3,
          mobCategory: 'creature',
          collisionBox: { x: 0.6, y: 1.8, z: 0.6 },
          aiType: 'melee',
          texture: null,
        },
      },
      {
        type: 'item',
        title: '生怪蛋',
        positionX: 60,
        positionY: 200,
        properties: {
          name: '生怪蛋',
          registryId: 'custom_mob_spawn_egg',
          maxStackSize: 64,
          rarity: 'uncommon',
          useCooldown: 0,
          isFood: false,
          nutrition: 0,
          saturation: 0,
          texture: null,
        },
      },
    ],
    edges: [
      { sourceIndex: 1, targetIndex: 0, sourcePort: 'item_out', targetPort: 'trigger', dataType: 'itemstack' },
    ],
  },
  {
    id: 'block',
    name: '方块系统',
    description: '自定义方块 + 掉落物',
    icon: 'Box',
    color: 'amber',
    nodes: [
      {
        type: 'block',
        title: '自定义方块',
        positionX: 300,
        positionY: 180,
        properties: {
          name: '自定义方块',
          registryId: 'custom_block',
          hardness: 3,
          resistance: 6,
          lightLevel: 0,
          harvestTool: 'pickaxe',
          harvestLevel: 1,
          isTransparent: false,
          isSolid: true,
          dropItem: 'self',
          dropCount: 1,
          texture: null,
        },
      },
      {
        type: 'item',
        title: '方块物品',
        positionX: 60,
        positionY: 180,
        properties: {
          name: '方块物品',
          registryId: 'custom_block_item',
          maxStackSize: 64,
          rarity: 'common',
          useCooldown: 0,
          isFood: false,
          nutrition: 0,
          saturation: 0,
          texture: null,
        },
      },
    ],
    edges: [
      { sourceIndex: 1, targetIndex: 0, sourcePort: 'item_out', targetPort: 'trigger', dataType: 'itemstack' },
    ],
  },
  {
    id: 'item',
    name: '物品系统',
    description: '自定义物品 + 食物属性',
    icon: 'Package',
    color: 'teal',
    nodes: [
      {
        type: 'item',
        title: '自定义物品',
        positionX: 200,
        positionY: 200,
        properties: {
          name: '自定义物品',
          registryId: 'custom_item',
          maxStackSize: 64,
          rarity: 'uncommon',
          useCooldown: 0,
          isFood: false,
          nutrition: 0,
          saturation: 0,
          texture: null,
        },
      },
    ],
    edges: [],
  },
  {
    id: 'combat',
    name: '战斗系统',
    description: '武器 + 装备 + 药水效果',
    icon: 'Swords',
    color: 'rose',
    nodes: [
      {
        type: 'weapon',
        title: '自定义武器',
        positionX: 300,
        positionY: 120,
        properties: {
          name: '自定义武器',
          registryId: 'custom_weapon',
          weaponType: 'sword',
          attackDamage: 7,
          attackSpeed: -2.4,
          reachDistance: 3,
          durability: 500,
          enchantability: 14,
          repairMaterial: 'minecraft:diamond',
          texture: null,
        },
      },
      {
        type: 'equipment',
        title: '自定义装备',
        positionX: 60,
        positionY: 120,
        properties: {
          name: '自定义装备',
          registryId: 'custom_armor',
          equipmentSlot: 'chest',
          armorValue: 7,
          armorToughness: 2,
          knockbackResistance: 0,
          durability: 400,
          enchantability: 15,
          repairMaterial: 'minecraft:diamond',
          texture: null,
        },
      },
      {
        type: 'potion',
        title: '战斗药水',
        positionX: 180,
        positionY: 380,
        properties: {
          name: '战斗药水',
          registryId: 'combat_potion',
          effectType: 'strength',
          duration: 3600,
          amplifier: 1,
          isAmbient: false,
          isBeneficial: true,
          color: '93000A',
          hasIcon: true,
        },
      },
    ],
    edges: [],
  },
  {
    id: 'worldgen',
    name: '世界生成',
    description: '群系 + 结构 + 维度',
    icon: 'Trees',
    color: 'emerald',
    nodes: [
      {
        type: 'biome',
        title: '自定义群系',
        positionX: 60,
        positionY: 120,
        properties: {
          name: '自定义群系',
          registryId: 'custom_biome',
          temperature: 0.5,
          downfall: 0.5,
          precipitation: 'rain',
          category: 'plains',
          depth: 0.125,
          scale: 0.05,
          waterColor: '3F76E4',
          waterFogColor: '050533',
          foliageColor: '48B518',
          grassColor: '5A7D31',
        },
      },
      {
        type: 'structure',
        title: '自定义结构',
        positionX: 360,
        positionY: 120,
        properties: {
          name: '自定义结构',
          registryId: 'custom_structure',
          structureType: 'village',
          biomeList: 'minecraft:plains',
          spawnChance: 0.01,
          minDistance: 32,
          maxDistance: 128,
        },
      },
      {
        type: 'dimension',
        title: '自定义维度',
        positionX: 200,
        positionY: 400,
        properties: {
          name: '自定义维度',
          registryId: 'custom_dimension',
          dimensionType: 'custom',
          hasSkyLight: true,
          hasCeiling: false,
          ultrawarm: false,
          natural: true,
          coordinateScale: 1,
          height: 384,
          minY: -64,
          bedWorks: true,
          piglinSafe: false,
          respawnAnchorWorks: false,
          hasRaids: true,
          gravity: 0.08,
          environment: 'normal',
        },
      },
    ],
    edges: [],
  },
]

export function getTemplateById(id: string): WorkspaceTemplate | undefined {
  // 内置模板优先
  const builtin = WORKSPACE_TEMPLATES.find((t) => t.id === id)
  if (builtin) return builtin
  // 插件贡献的模板
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCustomTemplates } = require('@/lib/plugin-system')
    const custom = getCustomTemplates()
    return custom.find((t) => t.id === id)
  } catch {
    return undefined
  }
}
