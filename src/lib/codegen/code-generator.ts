/**
 * 代码生成引擎（Task 4-B 占位实现）
 *
 * ⚠️ 这是一个最小可用的占位实现，Task 4-B 将用完整的 Forge 1.20.1
 * 代码生成器替换本文件。当前实现的目标是：
 *  1. 定义 GeneratedFile 类型（供 Task 4-C 双向联动 Hook 使用）
 *  2. 生成足够"特征"的 Java 代码，让 AST 同步引擎（Task 4-C）
 *     的正则匹配能够工作（生命值/攻击力/护甲/硬度/发光/堆叠等）
 *  3. 生成黑盒区域标记（与 ast-sync-engine 的常量保持一致）
 *
 * 与 Task 4-C 的契约：
 *  - GeneratedFile.linkedNodeId 用于双向联动（代码 ↔ 节点高亮）
 *  - 黑盒区域标记必须使用 BLACKBOX_START_MARKER / BLACKBOX_END_MARKER
 *    （从 ast-sync-engine 导入，保证一致）
 *
 * @see src/lib/codegen/ast-sync-engine.ts
 */

import type { FlowNode } from '@/lib/node-system'
import {
  BLACKBOX_START_MARKER,
  BLACKBOX_END_MARKER,
} from './ast-sync-engine'

/* ------------------------------------------------------------------ */
/* 类型定义                                                            */
/* ------------------------------------------------------------------ */

export type GeneratedFileLanguage =
  | 'java'
  | 'toml'
  | 'json'
  | 'gradle'
  | 'text'

/**
 * 生成的文件（供 Monaco 编辑器展示 + AST 同步引擎解析）
 *
 * linkedNodeId 是双向联动的核心：每个由节点生成的 Java 文件都
 * 标注它对应的画布节点 ID，这样：
 *  - 用户在画布选中节点 → 滚动到对应文件
 *  - 用户在编辑器选中代码行 → 高亮对应节点
 */
export interface GeneratedFile {
  /** 相对项目根的 POSIX 路径 */
  filePath: string
  /** 文件内容 */
  content: string
  /** 语法高亮语言 */
  language?: GeneratedFileLanguage
  /** 关联的画布节点 ID（用于双向联动） */
  linkedNodeId?: string
  /** 是否为只读文件（如 build.gradle 模板） */
  readOnly?: boolean
}

/** 代码生成结果 */
export interface GenerateProjectResult {
  files: GeneratedFile[]
  /** 实际使用的 mod ID（小写下划线） */
  modId: string
  /** 包路径（如 com.example.mod） */
  basePackage: string
  /** 生成时间戳 */
  generatedAt: number
}

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

/** 取节点 properties 中的字符串字段 */
function getStr(node: FlowNode, key: string, fallback = ''): string {
  const v = node.data.properties?.[key]
  return typeof v === 'string' ? v : fallback
}

/** 取节点 properties 中的数值字段 */
function getNum(node: FlowNode, key: string, fallback = 0): number {
  const v = node.data.properties?.[key]
  return typeof v === 'number' ? v : fallback
}

/** registry_id → PascalCase 类名（如 ruby_golem → RubyGolem） */
export function toClassName(registryId: string): string {
  if (!registryId) return 'UnknownNode'
  return registryId
    .split('_')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('')
}

/** mod_id → PascalCase 主类名（如 example_mod → ExampleMod） */
export function toModClassName(modId: string): string {
  return toClassName(modId) + 'Mod'
}

/* ------------------------------------------------------------------ */
/* 节点 → Java 文件                                                    */
/* ------------------------------------------------------------------ */

/**
 * 实体节点 → EntityClass.java
 *
 * 生成 Forge 1.20.1 风格的实体类（继承 PathfinderMob），
 * 包含 createAttributes() 中的 MAX_HEALTH / ATTACK_DAMAGE / ARMOR 赋值。
 */
function generateEntityFile(node: FlowNode, modId: string): GeneratedFile | null {
  const registryId = getStr(node, 'registryId', 'new_entity')
  const className = toClassName(registryId) + 'Entity'
  const health = getNum(node, 'health', 20)
  const attack = getNum(node, 'attack', 0)
  const armor = getNum(node, 'armor', 0)
  const armorToughness = getNum(node, 'armorToughness', 0)
  const speed = getNum(node, 'movementSpeed', 0.3)

  const content = `package com.example.mod.entity;

import net.minecraft.world.entity.PathfinderMob;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.level.Level;

/**
 * NexCube 自动生成的实体类
 * 节点 ID：${node.id}
 * 节点名称：${node.data.title}
 */
public class ${className} extends PathfinderMob {

    public ${className}(EntityType<? extends ${className}> type, Level level) {
        super(type, level);
    }

    public static AttributeSupplier.Builder createAttributes() {
        return PathfinderMob.createLivingAttributes()
            .add(Attributes.MAX_HEALTH, ${health.toFixed(1)}F)
            .add(Attributes.ATTACK_DAMAGE, ${attack.toFixed(1)}F)
            .add(Attributes.ARMOR, ${armor.toFixed(1)}F)
            .add(Attributes.ARMOR_TOUGHNESS, ${armorToughness.toFixed(1)}F)
            .add(Attributes.MOVEMENT_SPEED, ${speed.toFixed(2)}F);
    }

    // ${BLACKBOX_START_MARKER}
    // 在此添加自定义逻辑（NexCube 不会解析此区域）
    // ${BLACKBOX_END_MARKER}
}
`

  return {
    filePath: `src/main/java/com/example/mod/entity/${className}.java`,
    content,
    language: 'java',
    linkedNodeId: node.id,
  }
}

/**
 * 方块节点 → BlockClass.java
 *
 * 生成 Forge 1.20.1 风格的方块类（继承 Block），
 * 包含 .strength() / .lightLevel() / .stacksTo() 调用。
 */
function generateBlockFile(node: FlowNode): GeneratedFile | null {
  const registryId = getStr(node, 'registryId', 'new_block')
  const className = toClassName(registryId) + 'Block'
  const hardness = getNum(node, 'hardness', 3)
  const resistance = getNum(node, 'resistance', 6)
  const lightLevel = getNum(node, 'lightLevel', 0)

  const content = `package com.example.mod.block;

import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.BlockBehaviour;

/**
 * NexCube 自动生成的方块类
 * 节点 ID：${node.id}
 * 节点名称：${node.data.title}
 */
public class ${className} extends Block {

    public ${className}() {
        super(BlockBehaviour.Properties.of()
            .strength(${hardness.toFixed(1)}F, ${resistance.toFixed(1)}F)
            .lightLevel(state -> ${lightLevel})
            .requiresCorrectToolForDrops()
        );
    }

    // ${BLACKBOX_START_MARKER}
    // 在此添加自定义逻辑（NexCube 不会解析此区域）
    // ${BLACKBOX_END_MARKER}
}
`

  return {
    filePath: `src/main/java/com/example/mod/block/${className}.java`,
    content,
    language: 'java',
    linkedNodeId: node.id,
  }
}

/**
 * 物品节点 → ItemClass.java
 *
 * 生成 Forge 1.20.1 风格的物品类（继承 Item），
 * 包含 .stacksTo() 调用。
 */
function generateItemFile(node: FlowNode): GeneratedFile | null {
  const registryId = getStr(node, 'registryId', 'new_item')
  const className = toClassName(registryId) + 'Item'
  const maxStackSize = getNum(node, 'maxStackSize', 64)

  const content = `package com.example.mod.item;

import net.minecraft.world.item.Item;
import net.minecraft.world.item.Item.Properties;

/**
 * NexCube 自动生成的物品类
 * 节点 ID：${node.id}
 * 节点名称：${node.data.title}
 */
public class ${className} extends Item {

    public ${className}() {
        super(new Properties().stacksTo(${maxStackSize}));
    }

    // ${BLACKBOX_START_MARKER}
    // 在此添加自定义逻辑（NexCube 不会解析此区域）
    // ${BLACKBOX_END_MARKER}
}
`

  return {
    filePath: `src/main/java/com/example/mod/item/${className}.java`,
    content,
    language: 'java',
    linkedNodeId: node.id,
  }
}

/**
 * 黑盒节点 → 内联 Java 片段文件（不作为标准类导出）
 */
function generateBlackboxFile(node: FlowNode): GeneratedFile | null {
  const title = node.data.title || '黑盒代码'
  const code = getStr(node, 'sourceCode', '// 自定义 Java 代码')

  const content = `package com.example.mod.blackbox;

/**
 * NexCube 黑盒节点
 * 节点 ID：${node.id}
 * 节点名称：${title}
 *
 * 此文件由黑盒节点（Blackbox）生成，代码片段以原样插入主生成代码。
 */
public class ${toClassName(node.id)}Blackbox {

    // ${BLACKBOX_START_MARKER}
${code}
    // ${BLACKBOX_END_MARKER}
}
`

  return {
    filePath: `src/main/java/com/example/mod/blackbox/${toClassName(node.id)}Blackbox.java`,
    content,
    language: 'java',
    linkedNodeId: node.id,
  }
}

/**
 * 生成装备类（ArmorItem）
 */
function generateEquipmentFile(node: FlowNode): GeneratedFile | null {
  const p = node.data.properties ?? {}
  const className = toClassName(String(p.registryId ?? 'new_armor'))
  const slot = p.equipmentSlot === 'head' ? 'HEAD' : p.equipmentSlot === 'chest' ? 'CHEST' : p.equipmentSlot === 'legs' ? 'LEGS' : 'FEET'

  const content = `package com.example.mod.item;

import net.minecraft.world.item.ArmorItem;
import net.minecraft.world.item.ArmorMaterial;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Rarity;
import net.minecraft.sounds.SoundEvent;
import net.minecraft.sounds.SoundEvents;

/**
 * ${p.name ?? 'Custom Armor'} - 由 NexCube 自动生成
 * 装备槽: ${p.equipmentSlot}
 * 护甲值: ${p.armorValue}
 * 韧性: ${p.armorToughness}
 */
public class ${className} extends ArmorItem {
    public ${className}() {
        super(new ArmorMaterial(
            ${p.armorValue}F,              // protection
            ${p.armorToughness}F,          // toughness
            ${p.knockbackResistance}F,     // knockback resistance
            SoundEvents.ARMOR_EQUIP_DIAMOND,
            ${p.enchantability},            // enchantability
            () -> new ItemStack(net.minecraft.world.item.Items.DIAMOND), // repair material
            () -> "${p.registryId}"         // name
        ), ArmorItem.Type.${slot}, new Properties()
            .durability(${p.durability})
            .rarity(Rarity.EPIC)
        );
    }
}
`
  return { filePath: `src/main/java/com/example/mod/item/${className}.java`, content, linkedNodeId: node.id }
}

/**
 * 生成武器类（SwordItem / AxeItem）
 */
function generateWeaponFile(node: FlowNode): GeneratedFile | null {
  const p = node.data.properties ?? {}
  const className = toClassName(String(p.registryId ?? 'new_weapon'))
  const tier = p.weaponType === 'bow' ? 'Tiers.WOOD' : p.weaponType === 'axe' ? 'Tiers.DIAMOND' : 'Tiers.DIAMOND'

  const content = `package com.example.mod.item;

import net.minecraft.world.item.SwordItem;
import net.minecraft.world.item.Tiers;
import net.minecraft.world.item.Rarity;

/**
 * ${p.name ?? 'Custom Weapon'} - 由 NexCube 自动生成
 * 类型: ${p.weaponType}
 * 攻击伤害: ${p.attackDamage}
 * 攻击速度: ${p.attackSpeed}
 */
public class ${className} extends SwordItem {
    public ${className}() {
        super(${tier}, ${p.attackDamage}, ${p.attackSpeed}F, new Properties()
            .durability(${p.durability})
            .rarity(Rarity.RARE)
            .enchantable(${p.enchantability})
        );
    }
}
`
  return { filePath: `src/main/java/com/example/mod/item/${className}.java`, content, linkedNodeId: node.id }
}

/**
 * 生成食物类（Item with FoodProperties）
 */
function generateFoodFile(node: FlowNode): GeneratedFile | null {
  const p = node.data.properties ?? {}
  const className = toClassName(String(p.registryId ?? 'new_food'))

  const foodProps = p.isFood
    ? `.food(new net.minecraft.world.food.FoodProperties.Builder()
            .nutrition(${p.nutrition})
            .saturationMod(${p.saturation}F)
            ${p.isMeat ? '.meat()' : p.fastFood ? '.fast()' : ''}
            .build())`
    : ''

  const content = `package com.example.mod.item;

import net.minecraft.world.item.Item;
import net.minecraft.world.item.Rarity;

/**
 * ${p.name ?? 'Custom Food'} - 由 NexCube 自动生成
 * 饱食度: ${p.nutrition}
 * 饱和度: ${p.saturation}
 */
public class ${className} extends Item {
    public ${className}() {
        super(new Properties()
            .stacksTo(${p.maxStackSize})
            .rarity(Rarity.${String(p.rarity ?? 'common').toUpperCase()})
            ${foodProps}
        );
    }
}
`
  return { filePath: `src/main/java/com/example/mod/item/${className}.java`, content, linkedNodeId: node.id }
}

/**
 * 生成群系数据包文件（biome.json）
 */
function generateBiomeFile(node: FlowNode): GeneratedFile | null {
  const p = node.data.properties ?? {}
  const id = String(p.registryId ?? 'new_biome')

  const content = JSON.stringify({
    type: 'minecraft:biome',
    id,
    name: p.name ?? id,
    temperature: p.temperature ?? 0.5,
    downfall: p.downfall ?? 0.5,
    precipitation: p.precipitation ?? 'rain',
    category: p.category ?? 'plains',
    depth: p.depth ?? 0.125,
    scale: p.scale ?? 0.05,
    effects: {
      water_color: parseInt(String(p.waterColor ?? '3F76E4'), 16),
      water_fog_color: parseInt(String(p.waterFogColor ?? '050533'), 16),
      foliage_color: parseInt(String(p.foliageColor ?? '48B518'), 16),
      grass_color: parseInt(String(p.grassColor ?? '5A7D31'), 16),
    },
  }, null, 2)

  return { filePath: `src/main/resources/data/${id}/biome/${id}.json`, content, linkedNodeId: node.id }
}

/**
 * 生成结构数据包文件（structure.json）
 */
function generateStructureFile(node: FlowNode): GeneratedFile | null {
  const p = node.data.properties ?? {}
  const id = String(p.registryId ?? 'new_structure')

  const content = JSON.stringify({
    type: 'minecraft:structure',
    id,
    name: p.name ?? id,
    structure_type: p.structureType ?? 'village',
    biomes: String(p.biomeList ?? 'minecraft:plains').split(',').map((s: string) => s.trim()),
    spawn_chance: p.spawnChance ?? 0.01,
    min_distance: p.minDistance ?? 32,
    max_distance: p.maxDistance ?? 128,
  }, null, 2)

  return { filePath: `src/main/resources/data/${id}/structure/${id}.json`, content, linkedNodeId: node.id }
}

/**
 * 生成维度类型文件（dimension_type.json）
 */
function generateDimensionFile(node: FlowNode): GeneratedFile | null {
  const p = node.data.properties ?? {}
  const id = String(p.registryId ?? 'new_dimension')

  const content = JSON.stringify({
    type: 'minecraft:dimension_type',
    id,
    name: p.name ?? id,
    has_skylight: p.hasSkyLight ?? true,
    has_ceiling: p.hasCeiling ?? false,
    ultrawarm: p.ultrawarm ?? false,
    natural: p.natural ?? true,
    coordinate_scale: p.coordinateScale ?? 1.0,
    height: p.height ?? 384,
    min_y: p.minY ?? -64,
    bed_works: p.bedWorks ?? true,
    piglin_safe: p.piglinSafe ?? false,
    respawn_anchor_works: p.respawnAnchorWorks ?? false,
    has_raids: p.hasRaids ?? true,
    monster_spawn_light_level: 7,
    monster_spawn_block_light_limit: 0,
    gravity: p.gravity ?? 0.08,
    environment: p.environment ?? 'normal',
  }, null, 2)

  return { filePath: `src/main/resources/data/${id}/dimension_type/${id}.json`, content, linkedNodeId: node.id }
}

/**
 * 生成药水效果类（MobEffect）
 */
function generatePotionFile(node: FlowNode): GeneratedFile | null {
  const p = node.data.properties ?? {}
  const className = toClassName(String(p.registryId ?? 'new_effect'))

  const content = `package com.example.mod.effect;

import net.minecraft.world.effect.MobEffect;
import net.minecraft.world.effect.MobEffectCategory;
import net.minecraft.world.entity.ai.attributes.AttributeModifier;

/**
 * ${p.name ?? 'Custom Effect'} - 由 NexCube 自动生成
 * 效果类型: ${p.effectType}
 * 持续时间: ${p.duration} tick
 * 等级: ${p.amplifier}
 */
public class ${className} extends MobEffect {
    public ${className}() {
        super(${p.isBeneficial ? 'MobEffectCategory.BENEFICIAL' : 'MobEffectCategory.HARMFUL'},
              ${parseInt(String(p.color ?? '820AC'), 16)});
    }

    @Override
    public boolean isDurationEffectTick(int duration, int amplifier) {
        return duration > 0;
    }
}
`
  return { filePath: `src/main/java/com/example/mod/effect/${className}.java`, content, linkedNodeId: node.id }
}

/**
 * 生成主 Mod 类（@Mod 注解，注册入口）
 */
function generateMainModFile(modId: string, nodes: FlowNode[]): GeneratedFile {
  const modClassName = toModClassName(modId)
  const registryLines: string[] = []

  for (const node of nodes) {
    const kind = node.data.kind
    const registryId = getStr(node, 'registryId', node.id)
    const className = toClassName(registryId)

    if (kind === 'entity') {
      registryLines.push(`        // 实体：${node.data.title} (${node.id})`)
      registryLines.push(`        // REGISTER_ENTITY(${className}Entity, "${registryId}");`)
    } else if (kind === 'block') {
      registryLines.push(`        // 方块：${node.data.title} (${node.id})`)
      registryLines.push(`        // REGISTER_BLOCK(${className}Block, "${registryId}");`)
    } else if (kind === 'item') {
      registryLines.push(`        // 物品：${node.data.title} (${node.id})`)
      registryLines.push(`        // REGISTER_ITEM(${className}Item, "${registryId}");`)
    } else if (kind === 'equipment') {
      registryLines.push(`        // 装备：${node.data.title} (${node.id})`)
      registryLines.push(`        // REGISTER_ITEM(${className}, "${registryId}");`)
    } else if (kind === 'weapon') {
      registryLines.push(`        // 武器：${node.data.title} (${node.id})`)
      registryLines.push(`        // REGISTER_ITEM(${className}, "${registryId}");`)
    } else if (kind === 'food') {
      registryLines.push(`        // 食物：${node.data.title} (${node.id})`)
      registryLines.push(`        // REGISTER_ITEM(${className}, "${registryId}");`)
    } else if (kind === 'biome') {
      registryLines.push(`        // 群系：${node.data.title} (${node.id})`)
      registryLines.push(`        // REGISTER_BIOME(${registryId});`)
    } else if (kind === 'structure') {
      registryLines.push(`        // 结构：${node.data.title} (${node.id})`)
      registryLines.push(`        // REGISTER_STRUCTURE(${registryId});`)
    } else if (kind === 'dimension') {
      registryLines.push(`        // 维度：${node.data.title} (${node.id})`)
      registryLines.push(`        // REGISTER_DIMENSION(${registryId});`)
    } else if (kind === 'potion') {
      registryLines.push(`        // 药水效果：${node.data.title} (${node.id})`)
      registryLines.push(`        // REGISTER_EFFECT(${className}, "${registryId}");`)
    }
  }

  const content = `package com.example.mod;

import net.minecraftforge.fml.common.Mod;

/**
 * NexCube 自动生成的主 Mod 类
 * mod_id: ${modId}
 * 节点数量: ${nodes.length}
 */
@Mod("${modId}")
public class ${modClassName} {

    public static final String MOD_ID = "${modId}";

    public ${modClassName}() {
        // 注册节点对应的游戏对象
${registryLines.join('\n') || '        // (无节点)'}
    }
}
`

  return {
    filePath: `src/main/java/com/example/mod/${modClassName}.java`,
    content,
    language: 'java',
  }
}

/**
 * 生成 mods.toml（Forge 模组声明）
 */
function generateModsToml(modId: string): GeneratedFile {
  const content = `modLoader="javafml"
loaderVersion="[47,)"
license="MIT"

[[mods]]
modId="${modId}"
version="1.0.0"
displayName="NexCube Mod"
description='''
Generated by NexCube.
'''
`
  return {
    filePath: 'src/main/resources/META-INF/mods.toml',
    content,
    language: 'toml',
  }
}

/* ------------------------------------------------------------------ */
/* 主入口                                                              */
/* ------------------------------------------------------------------ */

/**
 * 从画布节点生成完整 Forge 1.20.1 项目代码
 *
 * @param _projectId 项目 ID（保留参数，未来用于差异化生成）
 * @param modId 模组 ID（小写下划线）
 * @param nodes 画布所有节点（主画布 + 子图节点）
 */
export function generateProjectCode(
  _projectId: string,
  modId: string,
  nodes: FlowNode[],
): GenerateProjectResult {
  const files: GeneratedFile[] = []

  // 1. 主 Mod 类
  files.push(generateMainModFile(modId, nodes))

  // 2. 每个主画布节点 → 一个 Java 文件
  for (const node of nodes) {
    // 跳过子节点逻辑节点（属于行为逻辑编辑器，不生成顶层文件）
    // 但工作区节点（type='workspace' 的 subGraphId）应该生成

    let file: GeneratedFile | null = null
    switch (node.data.kind) {
      case 'entity':
        file = generateEntityFile(node, modId)
        break
      case 'block':
        file = generateBlockFile(node)
        break
      case 'item':
        file = generateItemFile(node)
        break
      case 'equipment':
        file = generateEquipmentFile(node)
        break
      case 'weapon':
        file = generateWeaponFile(node)
        break
      case 'food':
        file = generateFoodFile(node)
        break
      case 'biome':
        file = generateBiomeFile(node)
        break
      case 'structure':
        file = generateStructureFile(node)
        break
      case 'dimension':
        file = generateDimensionFile(node)
        break
      case 'potion':
        file = generatePotionFile(node)
        break
      case 'blackbox':
        file = generateBlackboxFile(node)
        break
      case 'group':
      case 'function':
        // 节点组 / 函数节点不生成独立文件，子节点会单独生成
        continue
      default:
        // 尝试插件贡献的代码生成器
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { getCustomCodeGenerator } = require('@/lib/plugin-system')
          const pluginGen = getCustomCodeGenerator(node.data.kind)
          if (pluginGen) {
            const code = pluginGen(node, modId)
            const className = toClassName(String(node.data.properties?.registryId ?? node.data.title))
            file = {
              filePath: `src/main/java/com/example/mod/${className}.java`,
              content: code,
              nodeId: node.id,
              kind: node.data.kind,
            }
            break
          }
        } catch {
          // 插件系统未加载
        }
        // 逻辑子节点 / 调试节点不生成顶层文件
        continue
    }
    if (file) files.push(file)
  }

  // 3. 资源文件
  files.push(generateModsToml(modId))

  return {
    files,
    modId,
    basePackage: 'com.example.mod',
    generatedAt: Date.now(),
  }
}
