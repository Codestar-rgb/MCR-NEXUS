/**
 * MC 物品图标工具
 *
 * 基于 mcicons.ccleaf.com 的资源结构：
 *   https://mcicons.ccleaf.com/thumbnails/10. Items/<category>/<Item_Name>.png
 *
 * 物品名称使用 PascalCase + 下划线（如 Diamond_Sword, Iron_Ingot），
 * 与 Minecraft 的 registryId（如 minecraft:diamond_sword）对应。
 *
 * 用法：
 *   getMCIconUrl('minecraft:diamond') → 完整 URL
 *   getMCIconUrl('minecraft:diamond_sword') → 完整 URL
 */

/** MC 物品 ID → mcicons 路径的映射 */
const MC_ICON_BASE = 'https://mcicons.ccleaf.com/thumbnails/10. Items'

/** 物品分类映射（常见物品 → 分类目录） */
const CATEGORY_MAP: Record<string, string> = {
  // 食物
  apple: '10. Food', baked_potato: '10. Food', bread: '10. Food', cake: '10. Food',
  carrot: '10. Food', cooked_beef: '10. Food', cooked_chicken: '10. Food',
  cooked_cod: '10. Food', cooked_porkchop: '10. Food', cookie: '10. Food',
  golden_apple: '10. Food', golden_carrot: '10. Food', melon_slice: '10. Food',
  mushroom_stew: '10. Food', poisonous_potato: '10. Food', potato: '10. Food',
  pumpkin_pie: '10. Food', raw_beef: '10. Food', raw_chicken: '10. Food',
  raw_cod: '10. Food', raw_porkchop: '10. Food', raw_rabbit: '10. Food',
  raw_salmon: '10. Food', sweet_berries: '10. Food',
  // 武器/工具
  diamond_sword: '2. Swords', netherite_sword: '2. Swords', iron_sword: '2. Swords',
  golden_sword: '2. Swords', stone_sword: '2. Swords', wooden_sword: '2. Swords',
  diamond_axe: '3. Axes', netherite_axe: '3. Axes', iron_axe: '3. Axes',
  diamond_pickaxe: '4. Pickaxes', iron_pickaxe: '4. Pickaxes',
  diamond_shovel: '5. Shovels', iron_shovel: '5. Shovels',
  diamond_hoe: '6. Hoes', iron_hoe: '6. Hoes',
  // 盔甲
  diamond_helmet: '8. Armor', diamond_chestplate: '8. Armor',
  diamond_leggings: '8. Armor', diamond_boots: '8. Armor',
  netherite_helmet: '8. Armor', netherite_chestplate: '8. Armor',
  iron_helmet: '8. Armor', iron_chestplate: '8. Armor',
  // 矿物
  diamond: '11. Materials', iron_ingot: '11. Materials', gold_ingot: '11. Materials',
  netherite_ingot: '11. Materials', emerald: '11. Materials', coal: '11. Materials',
  redstone: '11. Materials', lapis_lazuli: '11. Materials', quartz: '11. Materials',
  // 方块
  diamond_block: '1. Blocks', iron_block: '1. Blocks', gold_block: '1. Blocks',
  emerald_block: '1. Blocks', redstone_block: '1. Blocks',
  cobblestone: '1. Blocks', stone: '1. Blocks', dirt: '1. Blocks',
  grass_block: '1. Blocks', sand: '1. Blocks', gravel: '1. Blocks',
  oak_log: '1. Blocks', oak_planks: '1. Blocks', oak_leaves: '1. Blocks',
  // 弓/弩
  bow: '12. Ranged', crossbow: '12. Ranged', arrow: '7. Arrows',
  // 三叉戟/盾牌
  trident: '14. Other', shield: '14. Other',
  // 钓鱼竿
  fishing_rod: '14. Other', carrot_on_a_stick: '14. Other',
  // 打火石/指南针/钟
  flint_and_steel: '14. Other', compass: '14. Other', clock: '14. Other',
  map: '14. Other', spyglass: '14. Other',
  // 桶
  water_bucket: '19. Buckets', lava_bucket: '19. Buckets',
  milk_bucket: '19. Buckets', bucket: '19. Buckets',
  // 花
  dandelion: '23. Flowers', poppy: '23. Flowers', rose_bush: '23. Flowers',
  // 生怪蛋（常见）
  zombie_spawn_egg: '31. Spawn Eggs', skeleton_spawn_egg: '31. Spawn Eggs',
  creeper_spawn_egg: '31. Spawn Eggs', enderman_spawn_egg: '31. Spawn Eggs',
  // 红石
  redstone_torch: '26. Redstone', lever: '26. Redstone',
  repeater: '26. Redstone', comparator: '26. Redstone',
  // 书/纸
  book: '36. Other', enchanted_book: '36. Other', paper: '36. Other',
  writable_book: '36. Other', written_book: '36. Other',
}

/** 默认分类（未映射的物品） */
const DEFAULT_CATEGORY = '36. Other'

/**
 * 获取 MC 物品图标 URL
 *
 * @param itemId 物品 ID（如 'minecraft:diamond_sword' 或 'diamond_sword'）
 * @returns 完整的 mcicons URL，如果无法获取则返回 null
 */
export function getMCIconUrl(itemId: string): string | null {
  if (!itemId) return null

  // 提取 registryId（去掉 minecraft: 前缀）
  const regId = itemId.replace(/^minecraft:/, '').replace(/^modId:/, '')
  if (!regId) return null

  // 查找分类
  const category = CATEGORY_MAP[regId] ?? DEFAULT_CATEGORY

  // 转换为 PascalCase（如 diamond_sword → Diamond_Sword）
  const pascalName = regId
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('_')

  return `${MC_ICON_BASE}/${category}/${pascalName}.png`
}

/**
 * 批量获取多个物品的图标 URL
 */
export function getMCIconUrls(itemIds: string[]): Array<{ id: string; url: string | null }> {
  return itemIds.map((id) => ({ id, url: getMCIconUrl(id) }))
}

/**
 * 获取物品分类列表（用于贴图选择器）
 */
export function getMCCategories(): string[] {
  return Array.from(new Set(Object.values(CATEGORY_MAP))).sort()
}

/** mcicons 基础 URL（公开导出） */
export const MCICONS_BASE = MC_ICON_BASE
