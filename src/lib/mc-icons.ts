/**
 * MC 物品图标工具 v2
 *
 * 基于 mcicons.ccleaf.com 的资源结构：
 *   https://mcicons.ccleaf.com/thumbnails/10. Items/<category>/<Item_Name>.png
 *
 * v2: 扩展到 200+ 物品映射
 */

const MC_ICON_BASE = 'https://mcicons.ccleaf.com/thumbnails/10. Items'

/** 物品分类映射（200+ 物品） */
const CATEGORY_MAP: Record<string, string> = {
  // === 食物 (25) ===
  apple: '10. Food', baked_potato: '10. Food', bread: '10. Food', cake: '10. Food',
  carrot: '10. Food', cooked_beef: '10. Food', cooked_chicken: '10. Food',
  cooked_cod: '10. Food', cooked_porkchop: '10. Food', cooked_rabbit: '10. Food',
  cooked_salmon: '10. Food', cookie: '10. Food', dried_kelp: '10. Food',
  golden_apple: '10. Food', golden_carrot: '10. Food', melon_slice: '10. Food',
  mushroom_stew: '10. Food', beetroot: '10. Food', beetroot_soup: '10. Food',
  poisonous_potato: '10. Food', potato: '10. Food', pumpkin_pie: '10. Food',
  raw_beef: '10. Food', raw_chicken: '10. Food', raw_cod: '10. Food',
  raw_porkchop: '10. Food', raw_rabbit: '10. Food', raw_salmon: '10. Food',
  sweet_berries: '10. Food', glow_berries: '10. Food', cooked_mutton: '10. Food',
  raw_mutton: '10. Food', rabbit_stew: '10. Food', tropical_fish: '10. Food',
  pufferfish: '10. Food', spider_eye: '10. Food', rotten_flesh: '10. Food',
  chorus_fruit: '10. Food', popped_chorus_fruit: '10. Food',

  // === 剑 (12) ===
  diamond_sword: '2. Swords', netherite_sword: '2. Swords', iron_sword: '2. Swords',
  golden_sword: '2. Swords', stone_sword: '2. Swords', wooden_sword: '2. Swords',

  // === 斧 (12) ===
  diamond_axe: '3. Axes', netherite_axe: '3. Axes', iron_axe: '3. Axes',
  golden_axe: '3. Axes', stone_axe: '3. Axes', wooden_axe: '3. Axes',

  // === 镐 (12) ===
  diamond_pickaxe: '4. Pickaxes', netherite_pickaxe: '4. Pickaxes', iron_pickaxe: '4. Pickaxes',
  golden_pickaxe: '4. Pickaxes', stone_pickaxe: '4. Pickaxes', wooden_pickaxe: '4. Pickaxes',

  // === 铲 (12) ===
  diamond_shovel: '5. Shovels', netherite_shovel: '5. Shovels', iron_shovel: '5. Shovels',
  golden_shovel: '5. Shovels', stone_shovel: '5. Shovels', wooden_shovel: '5. Shovels',

  // === 锄 (12) ===
  diamond_hoe: '6. Hoes', netherite_hoe: '6. Hoes', iron_hoe: '6. Hoes',
  golden_hoe: '6. Hoes', stone_hoe: '6. Hoes', wooden_hoe: '6. Hoes',

  // === 箭 (4) ===
  arrow: '7. Arrows', spectral_arrow: '7. Arrows', tipped_arrow: '7. Arrows',

  // === 盔甲 (24) ===
  diamond_helmet: '8. Armor', diamond_chestplate: '8. Armor',
  diamond_leggings: '8. Armor', diamond_boots: '8. Armor',
  netherite_helmet: '8. Armor', netherite_chestplate: '8. Armor',
  netherite_leggings: '8. Armor', netherite_boots: '8. Armor',
  iron_helmet: '8. Armor', iron_chestplate: '8. Armor',
  iron_leggings: '8. Armor', iron_boots: '8. Armor',
  golden_helmet: '8. Armor', golden_chestplate: '8. Armor',
  golden_leggings: '8. Armor', golden_boots: '8. Armor',
  leather_helmet: '8. Armor', leather_chestplate: '8. Armor',
  leather_leggings: '8. Armor', leather_boots: '8. Armor',
  chainmail_helmet: '8. Armor', chainmail_chestplate: '8. Armor',
  chainmail_leggings: '8. Armor', chainmail_boots: '8. Armor',
  turtle_helmet: '8. Armor',

  // === 矿物/材料 (30) ===
  diamond: '11. Materials', iron_ingot: '11. Materials', gold_ingot: '11. Materials',
  netherite_ingot: '11. Materials', netherite_scrap: '11. Materials',
  emerald: '11. Materials', coal: '11. Materials', charcoal: '11. Materials',
  redstone: '11. Materials', lapis_lazuli: '11. Materials', quartz: '11. Materials',
  iron_nugget: '11. Materials', gold_nugget: '11. Materials',
  clay_ball: '11. Materials', brick: '11. Materials', nether_brick: '11. Materials',
  ender_pearl: '11. Materials', ender_eye: '11. Materials',
  blaze_rod: '11. Materials', blaze_powder: '11. Materials',
  ghast_tear: '11. Materials', gunpowder: '11. Materials',
  string: '11. Materials', feather: '11. Materials', leather: '11. Materials',
  rabbit_hide: '11. Materials', rabbit_foot: '11. Materials',
  slime_ball: '11. Materials', magma_cream: '11. Materials',
  phantom_membrane: '11. Materials', nautilus_shell: '11. Materials',
  heart_of_the_sea: '11. Materials', scute: '11. Materials',
  echo_shard: '11. Materials', recovery_compass: '11. Materials',
  disc_fragment_5: '11. Materials', dragon_breath: '11. Materials',
  shulker_shell: '11. Materials', prismarine_shard: '11. Materials',
  prismarine_crystals: '11. Materials', amethyst_shard: '11. Materials',

  // === 方块 (40) ===
  diamond_block: '1. Blocks', iron_block: '1. Blocks', gold_block: '1. Blocks',
  emerald_block: '1. Blocks', redstone_block: '1. Blocks', lapis_block: '1. Blocks',
  netherite_block: '1. Blocks', coal_block: '1. Blocks', quartz_block: '1. Blocks',
  cobblestone: '1. Blocks', stone: '1. Blocks', dirt: '1. Blocks',
  grass_block: '1. Blocks', sand: '1. Blocks', gravel: '1. Blocks',
  oak_log: '1. Blocks', oak_planks: '1. Blocks', oak_leaves: '1. Blocks',
  spruce_log: '1. Blocks', birch_log: '1. Blocks', jungle_log: '1. Blocks',
  acacia_log: '1. Blocks', dark_oak_log: '1. Blocks', mangrove_log: '1. Blocks',
  oak_sapling: '1. Blocks', glass: '1. Blocks', bricks: '1. Blocks',
  tnt: '1. Blocks', bookshelf: '1. Blocks', crafting_table: '1. Blocks',
  furnace: '1. Blocks', chest: '1. Blocks', enchanting_table: '1. Blocks',
  anvil: '1. Blocks', beacon: '1. Blocks', obsidian: '1. Blocks',
  bedrock: '1. Blocks', netherrack: '1. Blocks', soul_sand: '1. Blocks',
  end_stone: '1. Blocks', purpur_block: '1. Blocks', sea_lantern: '1. Blocks',
  concrete: '1. Blocks', terracotta: '1. Blocks',

  // === 弓/弩 (4) ===
  bow: '12. Ranged', crossbow: '12. Ranged',
  // === 三叉戟/盾牌 (4) ===
  trident: '14. Other', shield: '14. Other',
  // === 钓鱼竿/打火石/指南针/钟 (8) ===
  fishing_rod: '14. Other', carrot_on_a_stick: '14. Other',
  flint_and_steel: '14. Other', compass: '14. Other', clock: '14. Other',
  map: '14. Other', spyglass: '14. Other', recovery_compass_2: '14. Other',
  shears: '14. Other', name_tag: '14. Other', saddle: '14. Other',
  horse_armor: '14. Other', lead: '14. Other',

  // === 桶 (8) ===
  water_bucket: '19. Buckets', lava_bucket: '19. Buckets',
  milk_bucket: '19. Buckets', bucket: '19. Buckets',
  powder_snow_bucket: '19. Buckets', cod_bucket: '19. Buckets',
  salmon_bucket: '19. Buckets', tropical_fish_bucket: '19. Buckets',
  axolotl_bucket: '19. Buckets', tadpole_bucket: '19. Buckets',

  // === 花 (12) ===
  dandelion: '23. Flowers', poppy: '23. Flowers', rose_bush: '23. Flowers',
  blue_orchid: '23. Flowers', allium: '23. Flowers', azure_bluet: '23. Flowers',
  red_tulip: '23. Flowers', orange_tulip: '23. Flowers', white_tulip: '23. Flowers',
  sunflower: '23. Flowers', lilac: '23. Flowers', peony: '23. Flowers',
  cornflower: '23. Flowers', lily_of_the_valley: '23. Flowers',
  wither_rose: '23. Flowers', torchflower: '23. Flowers',

  // === 生怪蛋 (30) ===
  zombie_spawn_egg: '31. Spawn Eggs', skeleton_spawn_egg: '31. Spawn Eggs',
  creeper_spawn_egg: '31. Spawn Eggs', enderman_spawn_egg: '31. Spawn Eggs',
  spider_spawn_egg: '31. Spawn Eggs', zombie_pigman_spawn_egg: '31. Spawn Eggs',
  slime_spawn_egg: '31. Spawn Eggs', ghast_spawn_egg: '31. Spawn Eggs',
  blaze_spawn_egg: '31. Spawn Eggs', magma_cube_spawn_egg: '31. Spawn Eggs',
  witch_spawn_egg: '31. Spawn Eggs', bat_spawn_egg: '31. Spawn Eggs',
  wolf_spawn_egg: '31. Spawn Eggs', ocelot_spawn_egg: '31. Spawn Eggs',
  horse_spawn_egg: '31. Spawn Eggs', rabbit_spawn_egg: '31. Spawn Eggs',
  villager_spawn_egg: '31. Spawn Eggs', squid_spawn_egg: '31. Spawn Eggs',
  cow_spawn_egg: '31. Spawn Eggs', chicken_spawn_egg: '31. Spawn Eggs',
  pig_spawn_egg: '31. Spawn Eggs', sheep_spawn_egg: '31. Spawn Eggs',
  mooshroom_spawn_egg: '31. Spawn Eggs', guardian_spawn_egg: '31. Spawn Eggs',
  shulker_spawn_egg: '31. Spawn Eggs', endermite_spawn_egg: '31. Spawn Eggs',
  silverfish_spawn_egg: '31. Spawn Eggs', stray_spawn_egg: '31. Spawn Eggs',
  husk_spawn_egg: '31. Spawn Eggs', wither_skeleton_spawn_egg: '31. Spawn Eggs',
  polar_bear_spawn_egg: '31. Spawn Eggs', donkey_spawn_egg: '31. Spawn Eggs',
  mule_spawn_egg: '31. Spawn Eggs', llama_spawn_egg: '31. Spawn Eggs',
  parrot_spawn_egg: '31. Spawn Eggs', phantom_spawn_egg: '31. Spawn Eggs',
  drowned_spawn_egg: '31. Spawn Eggs', dolphin_spawn_egg: '31. Spawn Eggs',
  turtle_spawn_egg: '31. Spawn Eggs', panda_spawn_egg: '31. Spawn Eggs',
  fox_spawn_egg: '31. Spawn Eggs', bee_spawn_egg: '31. Spawn Eggs',
  axolotl_spawn_egg: '31. Spawn Eggs', goat_spawn_egg: '31. Spawn Eggs',
  allay_spawn_egg: '31. Spawn Eggs', frog_spawn_egg: '31. Spawn Eggs',
  warden_spawn_egg: '31. Spawn Eggs', camel_spawn_egg: '31. Spawn Eggs',

  // === 红石 (12) ===
  redstone_torch: '26. Redstone', lever: '26. Redstone',
  repeater: '26. Redstone', comparator: '26. Redstone',
  redstone_lamp: '26. Redstone', piston: '26. Redstone',
  sticky_piston: '26. Redstone', observer: '26. Redstone',
  hopper: '26. Redstone', dispenser: '26. Redstone',
  dropper: '26. Redstone', daylight_detector: '26. Redstone',
  tripwire_hook: '26. Redstone', target: '26. Redstone',

  // === 书/纸/唱片 (10) ===
  book: '36. Other', enchanted_book: '36. Other', paper: '36. Other',
  writable_book: '36. Other', written_book: '36. Other',
  music_disc_13: '36. Other', music_disc_cat: '36. Other',
  music_disc_blocks: '36. Other', music_disc_chirp: '36. Other',
  music_disc_far: '36. Other', music_disc_mall: '36. Other',
  music_disc_mellohi: '36. Other', music_disc_stal: '36. Other',
  music_disc_strad: '36. Other', music_disc_ward: '36. Other',
  music_disc_11: '36. Other', music_disc_wait: '36. Other',
  music_disc_otherside: '36. Other', music_disc_5: '36. Other',
  music_disc_pigstep: '36. Other',

  // === 药水/经验瓶 (8) ===
  potion: '36. Other', splash_potion: '36. Other',
  lingering_potion: '36. Other', experience_bottle: '36. Other',

  // === 装饰/旗帜 (6) ===
  white_wool: '36. Other', orange_wool: '36. Other', black_wool: '36. Other',
  white_banner: '36. Other', armor_stand: '36. Other', item_frame: '36. Other',
  glow_item_frame: '36. Other', painting: '36. Other', flower_pot: '36. Other',

  // === 船/矿车/运输 (10) ===
  oak_boat: '36. Other', spruce_boat: '36. Other', birch_boat: '36. Other',
  minecart: '36. Other', chest_minecart: '36. Other',
  hopper_minecart: '36. Other', furnace_minecart: '36. Other',
  tnt_minecart: '36. Other', command_block_minecart: '36. Other',
  saddle_2: '36. Other',

  // === 附魔/药水瓶 ===
  glass_bottle: '36. Other', brewing_stand: '36. Other',
  cauldron: '36. Other', blaze_rod_2: '36. Other',
  brewing_stand_2: '36. Other', fermented_spider_eye: '36. Other',
  dragon_breath_2: '36. Other', ghast_tear_2: '36. Other',
  glistering_melon_slice: '36. Other', golden_melon: '36. Other',
  magma_cream_2: '36. Other', nether_wart: '36. Other',
  rabbit_foot_2: '36. Other', sugar: '36. Other',
  spider_eye_2: '36. Other', thick_potion: '36. Other',

  // === 农场 (6) ===
  wheat_seeds: '36. Other', beetroot_seeds: '36. Other',
  melon_seeds: '36. Other', pumpkin_seeds: '36. Other',
  torchflower_seeds: '36. Other', sweet_berries_2: '36. Other',
  bone_meal: '36. Other', bone: '36. Other',

  // === 钥匙/特殊 (4) ===
  nether_star: '36. Other', dragon_egg: '36. Other',
  totem_of_undying: '36. Other', shulker_shell_2: '36. Other',

  // === 陶器碎片 (4) ===
  archer_pottery_sherd: '36. Other', arms_up_pottery_sherd: '36. Other',
  prize_pottery_sherd: '36. Other', skull_pottery_sherd: '36. Other',

  // === 骨头/羽毛/其他 ===
  stick: '36. Other', bowl: '36. Other',
  flint: '36. Other', coal_2: '36. Other',
  snowball: '36. Other', egg: '36. Other',
  end_crystal: '36. Other', firework_rocket: '36. Other',
  firework_star: '36. Other', fire_charge: '36. Other',
  crying_obsidian: '36. Other', respawn_anchor: '36. Other',
  lodestone: '36. Other', lightning_rod: '36. Other',
  pointed_dripstone: '36. Other', glow_ink_sac: '36. Other',
  ink_sac: '36. Other', glowstone_dust: '36. Other',
  glowstone: '36. Other', sponge: '36. Other',
  wet_sponge: '36. Other', sea_pickle: '36. Other',
  kelp: '36. Other', bamboo: '36. Other',
  sugar_cane: '36. Other', cactus: '36. Other',
  pumpkin: '36. Blocks', carved_pumpkin: '36. Other',
  jack_o_lantern: '36. Other', melon: '36. Blocks',
  hay_block: '36. Blocks', dried_kelp_block: '36. Blocks',
}

/** 默认分类 */
const DEFAULT_CATEGORY = '36. Other'

export function getMCIconUrl(itemId: string): string | null {
  if (!itemId) return null
  const regId = itemId.replace(/^minecraft:/, '').replace(/^modId:/, '')
  if (!regId) return null

  const category = CATEGORY_MAP[regId] ?? DEFAULT_CATEGORY

  const pascalName = regId
    .split('_')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('_')

  return `${MC_ICON_BASE}/${category}/${pascalName}.png`
}

export function getMCIconUrls(itemIds: string[]): Array<{ id: string; url: string | null }> {
  return itemIds.map((id) => ({ id, url: getMCIconUrl(id) }))
}

export function getMCCategories(): string[] {
  return Array.from(new Set(Object.values(CATEGORY_MAP))).sort()
}

/** mcicons 基础 URL */
export const MCICONS_BASE = MC_ICON_BASE

/** 获取映射的物品总数 */
export function getMappedItemCount(): number {
  return Object.keys(CATEGORY_MAP).length
}
