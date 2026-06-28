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
  const aiType = getStr(node, 'aiType', 'melee')

  // 自定义属性代码（如果设置了 customAttrName）
  const customAttrName = getStr(node, 'customAttrName', '')
  const customAttrValue = getNum(node, 'customAttrValue', 0)
  const customAttrName2 = getStr(node, 'customAttrName2', '')
  const customAttrValue2 = getNum(node, 'customAttrValue2', 0)

  const customAttrParts: string[] = []
  if (customAttrName) {
    customAttrParts.push(`\n            .add(ForgeRegistries.ATTRIBUTES.getValue(new net.minecraft.resources.ResourceLocation("${modId}", "${customAttrName}")), ${customAttrValue}F)`)
  }
  if (customAttrName2) {
    customAttrParts.push(`\n            .add(ForgeRegistries.ATTRIBUTES.getValue(new net.minecraft.resources.ResourceLocation("${modId}", "${customAttrName2}")), ${customAttrValue2}F)`)
  }
  const customAttrCode = customAttrParts.join('')

  // AI 目标生成（基于 aiType）
  const aiGoals = generateAIGoals(aiType, className)

  const content = `package com.example.mod.entity;

import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.entity.PathfinderMob;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.ai.goal.FloatGoal;
import net.minecraft.world.entity.ai.goal.MeleeAttackGoal;
import net.minecraft.world.entity.ai.goal.RandomLookAroundGoal;
import net.minecraft.world.entity.ai.goal.WaterAvoidingRandomStrollGoal;
import net.minecraft.world.entity.ai.goal.target.NearestAttackableTargetGoal;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.Level;

/**
 * NexCube 自动生成的实体类
 * 节点名称：${node.data.title}
 * 注册 ID：${registryId}
 * AI 类型：${aiType}
 */
public class ${className} extends PathfinderMob {

    public ${className}(EntityType<? extends Mob> type, Level level) {
        super(type, level);
    }

    @Override
    protected void registerGoals() {
        this.goalSelector.addGoal(0, new FloatGoal(this));
${aiGoals}
        this.goalSelector.addGoal(7, new WaterAvoidingRandomStrollGoal(this, ${speed.toFixed(2)}));
        this.goalSelector.addGoal(8, new RandomLookAroundGoal(this));
    }

    public static AttributeSupplier.Builder createAttributes() {
        return PathfinderMob.createMobAttributes()
            .add(Attributes.MAX_HEALTH, ${health.toFixed(1)}F)
            .add(Attributes.ATTACK_DAMAGE, ${attack.toFixed(1)}F)
            .add(Attributes.ARMOR, ${armor.toFixed(1)}F)
            .add(Attributes.ARMOR_TOUGHNESS, ${armorToughness.toFixed(1)}F)
            .add(Attributes.MOVEMENT_SPEED, ${speed.toFixed(2)}F)${customAttrCode};
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

/** 根据 AI 类型生成目标 */
function generateAIGoals(aiType: string, className: string): string {
  switch (aiType) {
    case 'melee':
      return `        this.goalSelector.addGoal(2, new MeleeAttackGoal(this, 1.2, true));
        this.targetSelector.addGoal(2, new NearestAttackableTargetGoal<>(this, Player.class, true));`
    case 'ranged':
      return `        this.goalSelector.addGoal(2, new MeleeAttackGoal(this, 1.0, true));
        // TODO: 远程攻击需自定义 RangedAttackGoal
        this.targetSelector.addGoal(2, new NearestAttackableTargetGoal<>(this, Player.class, true));`
    case 'passive':
      return `        // 被动生物：不主动攻击`
    case 'neutral':
      return `        this.goalSelector.addGoal(2, new MeleeAttackGoal(this, 1.2, true));
        // 中立生物：仅在被攻击后反击`
    default:
      return `        this.goalSelector.addGoal(2, new MeleeAttackGoal(this, 1.2, true));`
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

  // 解析 BlockState 属性
  const statePropsRaw = getStr(node, 'blockStateProps', '')
  const stateProps = statePropsRaw
    ? statePropsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : []
  const hasStateProps = stateProps.length > 0

  // 生成属性定义代码
  const propDefs = stateProps.map((prop) => {
    const [name, defaultVal] = prop.split('=').map((s) => s.trim())
    if (!name) return null
    // 简单推断类型：true/false → boolean, 数字 → integer, 其他 → enum
    if (defaultVal === 'true' || defaultVal === 'false') {
      return `    public static final BooleanProperty ${name.toUpperCase()} = BooleanProperty.create("${name}");`
    }
    if (/^\d+$/.test(defaultVal)) {
      return `    public static final IntegerProperty ${name.toUpperCase()} = IntegerProperty.create("${name}", 0, 15);`
    }
    return null
  }).filter(Boolean).join('\n')

  // 生成 createBlockStateDefinition
  const stateBuilder = hasStateProps
    ? `
    @Override
    protected void createBlockStateDefinition(net.minecraft.world.level.block.state.StateDefinition.Builder<Block, net.minecraft.world.level.block.state.BlockState> builder) {
        builder.add(${stateProps.map((p) => p.split('=')[0].trim().toUpperCase()).join(', ')});
    }
`
    : ''

  // 导入
  const imports = hasStateProps
    ? `import net.minecraft.world.level.block.state.properties.BooleanProperty;\nimport net.minecraft.world.level.block.state.properties.IntegerProperty;\n`
    : ''

  const content = `package com.example.mod.block;

import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockBehaviour;
${imports}
/**
 * NexCube 自动生成的方块类
 * 节点名称：${node.data.title}
 * 注册 ID：${registryId}
${hasStateProps ? ` * BlockState 属性：${statePropsRaw}\n` : ''} */
public class ${className} extends Block {
${hasStateProps ? propDefs + '\n' : ''}
    public ${className}() {
        super(BlockBehaviour.Properties.of()
            .strength(${hardness.toFixed(1)}F, ${resistance.toFixed(1)}F)
            .lightLevel(state -> ${lightLevel})
            .requiresCorrectToolForDrops()
        );
    }
${stateBuilder}
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
 *
 * Forge 1.20.1 的 ArmorMaterial 是接口，需自定义实现。
 * 使用匿名内部类简化代码。
 */
function generateEquipmentFile(node: FlowNode): GeneratedFile | null {
  const p = (node.data.properties ?? {}) as Record<string, unknown>
  const registryId = String(p.registryId ?? 'new_armor')
  const className = toClassName(registryId)
  const slot = p.equipmentSlot === 'head' ? 'HELMET' : p.equipmentSlot === 'chest' ? 'CHESTPLATE' : p.equipmentSlot === 'legs' ? 'LEGGINGS' : 'BOOTS'
  const armorValue = Number(p.armorValue ?? 5)
  const armorToughness = Number(p.armorToughness ?? 0)
  const knockbackResistance = Number(p.knockbackResistance ?? 0)
  const enchantability = Number(p.enchantability ?? 15)
  const durability = Number(p.durability ?? 400)

  const content = `package com.example.mod.item;

import net.minecraft.sounds.SoundEvent;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.world.item.ArmorItem;
import net.minecraft.world.item.ArmorMaterial;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraft.world.item.Rarity;

/**
 * ${p.name ?? 'Custom Armor'} - 由 NexCube 自动生成
 * 装备槽: ${p.equipmentSlot}
 * 护甲值: ${armorValue}
 * 韧性: ${armorToughness}
 */
public class ${className} extends ArmorItem {

    // 自定义护甲材质（Forge 1.20.1 ArmorMaterial 接口实现）
    public static final ArmorMaterial MATERIAL = new ArmorMaterial() {
        @Override
        public int getDefenseForType(ArmorItem.Type type) {
            return ${armorValue};
        }
        @Override
        public int getDurabilityForType(ArmorItem.Type type) {
            return new int[]{13, 15, 16, 11}[type.getSlot().getIndex()];
        }
        @Override
        public int getEnchantmentValue() { return ${enchantability}; }
        @Override
        public SoundEvent getEquipSound() { return SoundEvents.ARMOR_EQUIP_DIAMOND; }
        @Override
        public net.minecraft.world.item.crafting.Ingredient getRepairIngredient() {
            return net.minecraft.world.item.crafting.Ingredient.of(new ItemStack(Items.DIAMOND));
        }
        @Override
        public String getName() { return "${registryId}"; }
        @Override
        public float getToughness() { return ${armorToughness}F; }
        @Override
        public float getKnockbackResistance() { return ${knockbackResistance}F; }
    };

    public ${className}(Properties properties) {
        super(MATERIAL, ArmorItem.Type.${slot}, properties
            .durability(${durability})
            .rarity(Rarity.EPIC)
        );
    }
}
`
  return { filePath: `src/main/java/com/example/mod/item/${className}.java`, content, linkedNodeId: node.id, language: 'java' }
}

/**
 * 生成武器类（SwordItem / AxeItem）
 *
 * Forge 1.20.1 SwordItem 构造函数：
 *   SwordItem(Tier tier, int attackDamage, float attackSpeed, Properties properties)
 * Tier 决定挖掘等级、附魔值、耐久等。
 */
function generateWeaponFile(node: FlowNode): GeneratedFile | null {
  const p = (node.data.properties ?? {}) as Record<string, unknown>
  const registryId = String(p.registryId ?? 'new_weapon')
  const className = toClassName(registryId)
  const attackDamage = Number(p.attackDamage ?? 7)
  const attackSpeed = Number(p.attackSpeed ?? -2.4)
  const durability = Number(p.durability ?? 500)
  const enchantability = Number(p.enchantability ?? 14)

  const content = `package com.example.mod.item;

import net.minecraft.world.item.SwordItem;
import net.minecraft.world.item.Tier;
import net.minecraft.world.item.Tiers;
import net.minecraft.world.item.Rarity;
import net.minecraft.world.item.crafting.Ingredient;
import net.minecraft.world.item.Items;

/**
 * ${p.name ?? 'Custom Weapon'} - 由 NexCube 自动生成
 * 类型: ${p.weaponType}
 * 攻击伤害: ${attackDamage}
 * 攻击速度: ${attackSpeed}
 */
public class ${className} extends SwordItem {

    // 自定义武器 Tier（Forge 1.20.1 Tier 接口实现）
    public static final Tier TIER = new Tier() {
        @Override
        public int getUses() { return ${durability}; }
        @Override
        public float getSpeed() { return 8.0F; }
        @Override
        public float getAttackDamageBonus() { return ${attackDamage}F; }
        @Override
        public int getLevel() { return 3; }
        @Override
        public int getEnchantmentValue() { return ${enchantability}; }
        @Override
        public Ingredient getRepairIngredient() {
            return Ingredient.of(Items.DIAMOND);
        }
    };

    public ${className}(Properties properties) {
        super(TIER, ${attackDamage}, ${attackSpeed}F, properties
            .rarity(Rarity.RARE)
        );
    }
}
`
  return { filePath: `src/main/java/com/example/mod/item/${className}.java`, content, linkedNodeId: node.id, language: 'java' }
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
 * 生成群系 — Forge 1.20.1 数据包格式
 *
 * 生成两个文件：
 *  1. data/<modId>/worldgen/biome/<id>.json — 群系数据（正确 1.20.1 格式）
 *  2. Java 类占位（说明文档）
 *
 * 群系在 1.20.1 通过 datapack 注册，无需 Java 代码。
 */
function generateBiomeFile(node: FlowNode): GeneratedFile | null {
  const p = (node.data.properties ?? {}) as Record<string, unknown>
  const id = String(p.registryId ?? 'new_biome')
  const temp = Number(p.temperature ?? 0.5)
  const downfall = Number(p.downfall ?? 0.5)
  const waterColor = parseInt(String(p.waterColor ?? '3F76E4').replace('#', ''), 16)
  const waterFogColor = parseInt(String(p.waterFogColor ?? '050533').replace('#', ''), 16)
  const foliageColor = parseInt(String(p.foliageColor ?? '48B518').replace('#', ''), 16)
  const grassColor = parseInt(String(p.grassColor ?? '5A7D31').replace('#', ''), 16)

  // Forge 1.20.1 群系 JSON 格式
  const content = JSON.stringify({
    temperature: temp,
    downfall,
    precipitation: p.precipitation ?? 'rain',
    temperature_modifier: 'none',
    effects: {
      sky_color: 7907327,
      water_color: waterColor,
      water_fog_color: waterFogColor,
      foliage_color: foliageColor,
      grass_color: grassColor,
    },
    spawners: {
      monster: [],
      creature: [],
      ambient: [],
      axolotls: [],
      underground_water_creature: [],
      water_creature: [],
      water_ambient: [],
      misc: [],
    },
    spawn_costs: {},
    carvers: {
      air: [],
    },
    features: [
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      [],
    ],
  }, null, 2)

  return { filePath: `src/main/resources/data/example_mod/worldgen/biome/${id}.json`, content, linkedNodeId: node.id, language: 'json' }
}

/**
 * 生成结构 — Forge 1.20.1 数据包格式
 *
 * 生成结构配置 JSON（template/pool/biomes/step）。
 * 结构在 1.20.1 通过 datapack 注册。
 */
function generateStructureFile(node: FlowNode): GeneratedFile | null {
  const p = (node.data.properties ?? {}) as Record<string, unknown>
  const id = String(p.registryId ?? 'new_structure')
  const biomes = String(p.biomeList ?? 'minecraft:plains')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  // Forge 1.20.1 结构配置 JSON
  const content = JSON.stringify({
    type: `example_mod:${id}`,
    biomes,
    step: 'surface_structures',
    spawn_overrides: {},
    terrain_adaptation: 'none',
    // 结构集（控制生成间距）
    spacing: Number(p.maxDistance ?? 128),
    separation: Number(p.minDistance ?? 32),
    salt: Math.floor(Math.random() * 1000000),
  }, null, 2)

  return { filePath: `src/main/resources/data/example_mod/worldgen/structure/${id}.json`, content, linkedNodeId: node.id, language: 'json' }
}

/**
 * 生成维度 — Forge 1.20.1 数据包格式
 *
 * 生成 dimension_type JSON（维度类型定义）。
 * 维度在 1.20.1 通过 datapack 注册。
 */
function generateDimensionFile(node: FlowNode): GeneratedFile | null {
  const p = (node.data.properties ?? {}) as Record<string, unknown>
  const id = String(p.registryId ?? 'new_dimension')
  const height = Number(p.height ?? 384)
  const minY = Number(p.minY ?? -64)
  const gravity = Number(p.gravity ?? 0.08)

  // Forge 1.20.1 dimension_type JSON
  const content = JSON.stringify({
    ultrawarm: Boolean(p.ultrawarm ?? false),
    natural: Boolean(p.natural ?? true),
    piglin_safe: Boolean(p.piglinSafe ?? false),
    respawn_anchor_works: Boolean(p.respawnAnchorWorks ?? false),
    bed_works: Boolean(p.bedWorks ?? true),
    has_raids: Boolean(p.hasRaids ?? true),
    has_skylight: Boolean(p.hasSkyLight ?? true),
    has_ceiling: Boolean(p.hasCeiling ?? false),
    coordinate_scale: Number(p.coordinateScale ?? 1.0),
    effects: p.environment === 'nether' ? 'minecraft:the_nether' : p.environment === 'end' ? 'minecraft:the_end' : 'minecraft:overworld',
    min_y: minY,
    height,
    logical_height: height,
    infiniburn: p.environment === 'nether' ? '#minecraft:infiniburn_nether' : '#minecraft:infiniburn_overworld',
    monster_spawn_light_level: {
      type: 'minecraft:uniform',
      value: {
        min_inclusive: 0,
        max_inclusive: 7,
      },
    },
    monster_spawn_block_light_limit: 0,
    fixed_time: p.environment === 'nether' ? 18000 : undefined,
    gravity,
  }, null, 2)

  return { filePath: `src/main/resources/data/example_mod/dimension_type/${id}.json`, content, linkedNodeId: node.id, language: 'json' }
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
 * 生成配方 — Forge 1.20.1 数据包格式
 *
 * 根据 recipeType 生成不同的 JSON：
 *  - crafting: 合成台配方（shaped/shapeless）
 *  - smelting/blasting/smoking: 熔炉类配方
 *  - stonecutting: 切石机配方
 */
function generateRecipeFile(node: FlowNode, modId: string): GeneratedFile | null {
  const p = (node.data.properties ?? {}) as Record<string, unknown>
  const id = String(p.registryId ?? 'new_recipe')
  const recipeType = String(p.recipeType ?? 'crafting')
  const resultItem = String(p.resultItem ?? 'minecraft:diamond')
  const resultCount = Number(p.resultCount ?? 1)
  const ingredientA = String(p.ingredientA ?? 'minecraft:stick')
  const ingredientB = String(p.ingredientB ?? 'minecraft:stick')
  const ingredientC = String(p.ingredientC ?? '')
  const cookingTime = Number(p.cookingTime ?? 200)
  const experience = Number(p.experience ?? 0.1)
  const shaped = Boolean(p.shaped ?? true)
  const grid = (p.grid as string[]) ?? null

  let content: string

  if (recipeType === 'smelting' || recipeType === 'blasting' || recipeType === 'smoking') {
    // 熔炉类配方
    content = JSON.stringify({
      type: `minecraft:${recipeType}`,
      ingredient: { item: ingredientA },
      result: { item: resultItem, count: resultCount },
      experience,
      cookingtime: cookingTime,
    }, null, 2)
  } else if (recipeType === 'stonecutting') {
    // 切石机配方
    content = JSON.stringify({
      type: 'minecraft:stonecutting',
      ingredient: { item: ingredientA },
      result: { item: resultItem, count: resultCount },
    }, null, 2)
  } else if (shaped && grid && grid.length === 9) {
    // 有序合成（shaped）— 使用 3x3 网格生成 pattern + key
    const { pattern, key } = buildShapedPattern(grid)
    if (Object.keys(key).length === 0) {
      // 空网格降级为 shapeless
      content = JSON.stringify({
        type: 'minecraft:crafting_shapeless',
        ingredients: [{ item: resultItem }],
        result: { item: resultItem, count: resultCount },
      }, null, 2)
    } else {
      content = JSON.stringify({
        type: 'minecraft:crafting_shaped',
        pattern,
        key: key as Record<string, { item: string }>,
        result: { item: resultItem, count: resultCount },
      }, null, 2)
    }
  } else {
    // 无序合成（shapeless）
    const ingredients = [ingredientA, ingredientB, ingredientC].filter(Boolean).map((item) => ({ item }))
    content = JSON.stringify({
      type: 'minecraft:crafting_shapeless',
      ingredients,
      result: { item: resultItem, count: resultCount },
    }, null, 2)
  }

  return {
    filePath: `src/main/resources/data/${modId}/recipes/${id}.json`,
    content,
    linkedNodeId: node.id,
    language: 'json',
  }
}

/**
 * 从 3x3 网格构建 shaped 配方的 pattern + key
 *
 * 网格索引：
 *   0 1 2
 *   3 4 5
 *   6 7 8
 *
 * 每个不同的物品 ID 映射到一个字符（A-Z），空格子用空格。
 * pattern 是 3 行字符串，key 是字符→物品 ID 的映射。
 */
function buildShapedPattern(grid: string[]): {
  pattern: string[]
  key: Record<string, string>
} {
  // 收集所有非空物品 ID，按首次出现顺序分配字符
  const itemToChar = new Map<string, string>()
  let charIndex = 0
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  for (const item of grid) {
    if (item && !itemToChar.has(item)) {
      itemToChar.set(item, chars[charIndex] ?? '?')
      charIndex++
    }
  }

  // 构建 pattern（3 行）
  const pattern: string[] = []
  for (let row = 0; row < 3; row++) {
    let line = ''
    for (let col = 0; col < 3; col++) {
      const item = grid[row * 3 + col]
      line += item ? (itemToChar.get(item) ?? '?') : ' '
    }
    pattern.push(line)
  }

  // 构建 key（字符→物品 ID）
  const key: Record<string, string> = {}
  for (const [item, char] of itemToChar) {
    key[char] = item
  }

  return { pattern, key }
}

/**
 * 生成附魔类 — Forge 1.20.1 Enchantment
 *
 * 继承 Enchantment，设置 rarity/category/maxLevel/cost。
 */
function generateEnchantmentFile(node: FlowNode, modId: string): GeneratedFile | null {
  const p = (node.data.properties ?? {}) as Record<string, unknown>
  const registryId = String(p.registryId ?? 'new_enchant')
  const className = toClassName(registryId)
  const rarity = String(p.rarity ?? 'common').toUpperCase()
  const category = String(p.category ?? 'weapon').toUpperCase()
  const maxLevel = Number(p.maxLevel ?? 5)
  const minCost = Number(p.minCost ?? 1)
  const costPerLevel = Number(p.costPerLevel ?? 10)
  const isTreasure = Boolean(p.isTreasure ?? false)
  const isCurse = Boolean(p.isCurse ?? false)
  const isTradeable = Boolean(p.isTradeable ?? true)
  const isCompatibleWithBooks = Boolean(p.isCompatibleWithBooks ?? true)
  const compatibleItemsRaw = String(p.compatibleItems ?? '').trim()
  const incompatibleEnchantsRaw = String(p.incompatibleEnchants ?? '').trim()

  // 额外适用物品代码
  const compatibleItems = compatibleItemsRaw
    ? compatibleItemsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : []
  // 冲突附魔代码
  const incompatibleEnchants = incompatibleEnchantsRaw
    ? incompatibleEnchantsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  // 检查兼容性方法的代码
  const compatOverride = compatibleItems.length > 0
    ? `
    @Override
    public boolean canEnchant(net.minecraft.world.item.ItemStack stack) {
        // 额外适用物品
        ${compatibleItems.map((item) => `if (stack.is(net.minecraft.core.registries.BuiltInRegistries.ITEM.get(new net.minecraft.resources.ResourceLocation("${item}")))) return true;`).join('\n        ')}
        return super.canEnchant(stack);
    }
`
    : ''

  const incompatOverride = incompatibleEnchants.length > 0
    ? `
    @Override
    public boolean checkCompatibility(Enchantment other) {
        // 冲突附魔检查
        ${incompatibleEnchants.map((ench) => `if (other.getDescriptionId().equals("${ench}")) return false;`).join('\n        ')}
        return super.checkCompatibility(other);
    }
`
    : ''

  const content = `package com.example.mod.enchantment;

import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.item.enchantment.Enchantment;
import net.minecraft.world.item.enchantment.EnchantmentCategory;

/**
 * ${p.name ?? 'Custom Enchantment'} - 由 NexCube 自动生成
 * 注册 ID：${registryId}
 * 稀有度：${rarity}
 * 类别：${category}
 * 最大等级：${maxLevel}
${compatibleItems.length > 0 ? ` * 额外适用：${compatibleItems.join(', ')}\n` : ''}${incompatibleEnchants.length > 0 ? ` * 冲突附魔：${incompatibleEnchants.join(', ')}\n` : ''} */
public class ${className} extends Enchantment {

    public ${className}() {
        super(Rarity.${rarity}, EnchantmentCategory.${category},
            new EquipmentSlot[]{EquipmentSlot.MAINHAND, EquipmentSlot.OFFHAND});
    }

    @Override
    public int getMinLevel() {
        return 1;
    }

    @Override
    public int getMaxLevel() {
        return ${maxLevel};
    }

    @Override
    public int getMinCost(int level) {
        return ${minCost} + (level - 1) * ${costPerLevel};
    }

    @Override
    public int getMaxCost(int level) {
        return this.getMinCost(level) + ${costPerLevel};
    }

    @Override
    public boolean isTreasureOnly() {
        return ${isTreasure};
    }

    @Override
    public boolean isCurse() {
        return ${isCurse};
    }

    @Override
    public boolean isTradeable() {
        return ${isTradeable};
    }

    @Override
    public boolean isDiscoverable() {
        return true;
    }

    @Override
    public boolean isAllowedOnBooks() {
        return ${isCompatibleWithBooks};
    }
${compatOverride}${incompatOverride}}
`

  return {
    filePath: `src/main/java/com/example/mod/enchantment/${className}.java`,
    content,
    language: 'java',
    linkedNodeId: node.id,
  }
}

/**
 * 生成成就 JSON — Forge 1.20.1 advancements 格式
 *
 * 生成 data/<modId>/advancements/<id>.json
 */
function generateAdvancementFile(node: FlowNode, modId: string): GeneratedFile | null {
  const p = (node.data.properties ?? {}) as Record<string, unknown>
  const registryId = String(p.registryId ?? 'new_advancement')
  const icon = String(p.icon ?? 'minecraft:diamond')
  const title = node.data.title
  const description = String(p.description ?? '完成此成就')
  const frame = String(p.frame ?? 'task')
  const showToast = Boolean(p.showToast ?? true)
  const announceToChat = Boolean(p.announceToChat ?? false)
  const hidden = Boolean(p.hidden ?? false)
  const triggerType = String(p.triggerType ?? 'inventory_changed')
  const triggerItem = String(p.triggerItem ?? 'minecraft:diamond')

  // 构建触发条件
  let triggerConditions: Record<string, unknown> = {}
  if (triggerType === 'inventory_changed') {
    triggerConditions = {
      items: [{ items: [triggerItem] }],
    }
  } else if (triggerType === 'player_killed_entity') {
    triggerConditions = { entity: { type: triggerItem } }
  } else if (triggerType === 'placed_block') {
    triggerConditions = { block: triggerItem }
  } else if (triggerType === 'used_item') {
    triggerConditions = { item: triggerItem }
  } else if (triggerType === 'changed_dimension') {
    triggerConditions = {}
  } else if (triggerType === 'recipe_crafted') {
    triggerConditions = { recipe: triggerItem }
  }

  // parent 成就（如果有设置）
  const parentAdvancement = String(p.parentAdvancement ?? '')
  const parentId = parentAdvancement ? `${modId}:${parentAdvancement}` : 'minecraft:recipes/root'

  const content = JSON.stringify({
    display: {
      icon: { item: icon },
      title: { translate: `advancements.${modId}.${registryId}.title`, fallback: title },
      description: { translate: `advancements.${modId}.${registryId}.description`, fallback: description },
      frame,
      show_toast: showToast,
      announce_to_chat: announceToChat,
      hidden,
    },
    parent: parentId,
    criteria: {
      trigger: {
        trigger: `minecraft:${triggerType}`,
        conditions: triggerConditions,
      },
    },
    requirements: [['trigger']],
  }, null, 2)

  return {
    filePath: `src/main/resources/data/${modId}/advancements/${registryId}.json`,
    content,
    language: 'json',
    linkedNodeId: node.id,
  }
}

/**
 * 生成主 Mod 类（@Mod 注解，注册入口）
 *
 * 使用 DeferredRegister 模式（Forge 1.20.1 推荐）：
 *  - ModItems / ModBlocks / ModEntities 三个注册中心类
 *  - 主类构造函数中 register(modEventBus)
 *  - 实体属性通过 @Mod.EventBusSubscriber 注册
 */
function generateMainModFile(modId: string, nodes: FlowNode[]): GeneratedFile {
  const modClassName = toModClassName(modId)
  const pkg = 'com.example.mod'

  // 分类节点
  const entities = nodes.filter((n) => n.data.kind === 'entity')
  const blocks = nodes.filter((n) => n.data.kind === 'block')
  const items = nodes.filter((n) => ['item', 'equipment', 'weapon', 'food'].includes(n.data.kind))
  const potions = nodes.filter((n) => n.data.kind === 'potion')
  const enchantments = nodes.filter((n) => n.data.kind === 'enchantment')

  const hasEntities = entities.length > 0
  const hasBlocks = blocks.length > 0
  const hasItems = items.length > 0
  const hasPotions = potions.length > 0
  const hasEnchantments = enchantments.length > 0

  const imports: string[] = [
    'import net.minecraftforge.eventbus.api.IEventBus;',
    'import net.minecraftforge.fml.common.Mod;',
    'import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;',
  ]
  if (hasItems) imports.push(`import ${pkg}.item.ModItems;`)
  if (hasBlocks) imports.push(`import ${pkg}.block.ModBlocks;`)
  if (hasEntities) imports.push(`import ${pkg}.entity.ModEntities;`)
  if (hasPotions) imports.push(`import ${pkg}.effect.ModEffects;`)
  if (hasEnchantments) imports.push(`import ${pkg}.enchantment.ModEnchantments;`)

  const hasCreatables = hasItems || hasBlocks || hasEntities
  if (hasCreatables) imports.push(`import ${pkg}.ModCreativeTabs;`)

  const registerCalls: string[] = []
  if (hasItems) registerCalls.push('        ModItems.REGISTER.register(bus);')
  if (hasBlocks) registerCalls.push('        ModBlocks.REGISTER.register(bus);')
  if (hasEntities) registerCalls.push('        ModEntities.REGISTER.register(bus);')
  if (hasPotions) registerCalls.push('        ModEffects.REGISTER.register(bus);')
  if (hasEnchantments) registerCalls.push('        ModEnchantments.REGISTER.register(bus);')
  if (hasCreatables) registerCalls.push('        ModCreativeTabs.REGISTER.register(bus);')

  const content = `package ${pkg};

${imports.join('\n')}

/**
 * NexCube 自动生成的主 Mod 类
 * mod_id: ${modId}
 * 节点数量: ${nodes.length}（实体 ${entities.length} · 方块 ${blocks.length} · 物品 ${items.length} · 药水 ${potions.length}）
 */
@Mod("${modId}")
public class ${modClassName} {

    public static final String MOD_ID = "${modId}";

    public ${modClassName}() {
        IEventBus bus = FMLJavaModLoadingContext.get().getModEventBus();

        // 注册 DeferredRegister
${registerCalls.join('\n') || '        // (无节点)'}
    }
}
`

  return {
    filePath: `src/main/java/com/example/mod/${modClassName}.java`,
    content,
    language: 'java',
  }
}

/** 生成 ModItems 注册中心（物品/装备/武器/食物） */
function generateModItemsFile(modId: string, nodes: FlowNode[]): GeneratedFile | null {
  const itemNodes = nodes.filter((n) => ['item', 'equipment', 'weapon', 'food'].includes(n.data.kind))
  const entityNodes = nodes.filter((n) => n.data.kind === 'entity')
  if (itemNodes.length === 0 && entityNodes.length === 0) return null

  const pkg = 'com.example.mod.item'
  const hasFood = itemNodes.some((n) => n.data.kind === 'food')
  const hasEntities = entityNodes.length > 0

  const entries = itemNodes.map((n) => {
    const registryId = getStr(n, 'registryId', n.id)
    const className = toClassName(registryId)
    const kind = n.data.kind
    // 食物用 Food 接口；装备/武器用 Tier 接口；普通物品用 Item
    if (kind === 'food') {
      const nutrition = getNum(n, 'nutrition', 0)
      const saturation = getNum(n, 'saturation', 0)
      return `    public static final RegistryObject<Item> ${registryId.toUpperCase()} =\n        REGISTER.register("${registryId}", () -> new Item(new Item.Properties().food(new FoodProperties.Builder().nutrition(${nutrition}).saturationMod(${saturation}F).build())));`
    }
    if (kind === 'weapon' || kind === 'equipment') {
      return `    public static final RegistryObject<Item> ${registryId.toUpperCase()} =\n        REGISTER.register("${registryId}", () -> new ${className}(new Item.Properties()));`
    }
    return `    public static final RegistryObject<Item> ${registryId.toUpperCase()} =\n        REGISTER.register("${registryId}", () -> new Item(new Item.Properties()));`
  })

  // 实体生成蛋（SpawnEggItem）
  const spawnEggEntries = entityNodes.map((n) => {
    const registryId = getStr(n, 'registryId', n.id)
    const entityUpper = registryId.toUpperCase()
    return `    // ${n.data.title} 生怪蛋
    public static final RegistryObject<Item> ${entityUpper}_SPAWN_EGG =\n        REGISTER.register("${registryId}_spawn_egg", () -> new ForgeSpawnEggItem(ModEntities.${entityUpper}, 0x4D4D4D, 0xFFFFFF, new Item.Properties()));`
  })

  const allEntries = [...entries, ...spawnEggEntries]

  const content = `package ${pkg};

import net.minecraft.world.item.Item;
${hasFood ? 'import net.minecraft.world.food.FoodProperties;\n' : ''}${hasEntities ? 'import net.minecraftforge.common.ForgeSpawnEggItem;\n' : ''}import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;
${hasEntities ? 'import com.example.mod.entity.ModEntities;\n' : ''}import com.example.mod.${toModClassName(modId)};

/**
 * 物品注册中心（NexCube 自动生成）
 * 包含 ${itemNodes.length} 个物品节点${hasEntities ? ` + ${entityNodes.length} 个生怪蛋` : ''}
 */
public class ModItems {

    public static final DeferredRegister<Item> REGISTER =
        DeferredRegister.create(ForgeRegistries.ITEMS, ${toModClassName(modId)}.MOD_ID);

${allEntries.join('\n\n')}
}
`
  return {
    filePath: `src/main/java/com/example/mod/item/ModItems.java`,
    content,
    language: 'java',
  }
}

/** 生成 ModBlocks 注册中心 + BlockItem 联动 */
function generateModBlocksFile(modId: string, nodes: FlowNode[]): GeneratedFile | null {
  const blockNodes = nodes.filter((n) => n.data.kind === 'block')
  if (blockNodes.length === 0) return null

  const pkg = 'com.example.mod.block'
  const entries = blockNodes.map((n) => {
    const registryId = getStr(n, 'registryId', n.id)
    const className = toClassName(registryId) + 'Block'
    const hardness = getNum(n, 'hardness', 3)
    const resistance = getNum(n, 'resistance', 6)
    const lightLevel = getNum(n, 'lightLevel', 0)
    // 优先使用自定义 Block 子类（已在单独文件中生成）
    return `    public static final RegistryObject<Block> ${registryId.toUpperCase()} =\n        REGISTER.register("${registryId}", () -> new ${className}(BlockBehaviour.Properties.of()\n            .strength(${hardness}F, ${resistance}F)\n            .lightLevel(s -> ${lightLevel})));`
  })

  // BlockItem 联动注册
  const itemEntries = blockNodes.map((n) => {
    const registryId = getStr(n, 'registryId', n.id)
    return `    public static final RegistryObject<Item> ${registryId.toUpperCase()}_ITEM =\n        ModItems.REGISTER.register("${registryId}", () -> new BlockItem(${registryId.toUpperCase()}.get(), new Item.Properties()));`
  })

  const content = `package ${pkg};

import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;
import com.example.mod.item.ModItems;

/**
 * 方块注册中心（NexCube 自动生成）
 * 包含 ${blockNodes.length} 个方块节点 + 对应 BlockItem
 */
public class ModBlocks {

    public static final DeferredRegister<Block> REGISTER =
        DeferredRegister.create(ForgeRegistries.BLOCKS, com.example.mod.${toModClassName(modId)}.MOD_ID);

${entries.join('\n\n')}

    // BlockItem 联动注册（让方块可以在创造模式物品栏获得）
${itemEntries.join('\n\n')}
}
`
  return {
    filePath: `src/main/java/com/example/mod/block/ModBlocks.java`,
    content,
    language: 'java',
  }
}

/** 生成 ModEntities 注册中心 + 实体属性注册 */
function generateModEntitiesFile(modId: string, nodes: FlowNode[]): GeneratedFile | null {
  const entityNodes = nodes.filter((n) => n.data.kind === 'entity')
  if (entityNodes.length === 0) return null

  const pkg = 'com.example.mod.entity'
  const entries = entityNodes.map((n) => {
    const registryId = getStr(n, 'registryId', n.id)
    const className = toClassName(registryId) + 'Entity'
    const box = (n.data.properties?.collisionBox ?? { x: 0.6, y: 1.8, z: 0.6 }) as { x: number; y: number; z: number }
    const w = Number(box.x) || 0.6
    const h = Number(box.y) || 1.8
    return `    public static final RegistryObject<EntityType<${className}>> ${registryId.toUpperCase()} =\n        REGISTER.register("${registryId}", () -> EntityType.Builder\n            .of(${className}::new, MobCategory.CREATURE)\n            .sized(${w.toFixed(1)}f, ${h.toFixed(1)}f)\n            .build());`
  })

  const attrLines = entityNodes.map((n) => {
    const registryId = getStr(n, 'registryId', n.id)
    const className = toClassName(registryId) + 'Entity'
    return `        event.put(${registryId.toUpperCase()}.get(), ${className}.createAttributes().build());`
  })

  const content = `package ${pkg};

import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.MobCategory;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraftforge.event.entity.EntityAttributeCreationEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;
import com.example.mod.${toModClassName(modId)};

/**
 * 实体注册中心（NexCube 自动生成）
 * 包含 ${entityNodes.length} 个实体节点
 */
@Mod.EventBusSubscriber(modid = ${toModClassName(modId)}.MOD_ID, bus = Mod.EventBusSubscriber.Bus.MOD)
public class ModEntities {

    public static final DeferredRegister<EntityType<?>> REGISTER =
        DeferredRegister.create(ForgeRegistries.ENTITY_TYPES, ${toModClassName(modId)}.MOD_ID);

${entries.join('\n\n')}

    @SubscribeEvent
    public static void registerAttributes(EntityAttributeCreationEvent event) {
${attrLines.join('\n\n')}
    }
}
`
  return {
    filePath: `src/main/java/com/example/mod/entity/ModEntities.java`,
    content,
    language: 'java',
  }
}

/** 生成附魔注册中心（DeferredRegister<Enchantment>） */
function generateModEnchantmentsFile(modId: string, nodes: FlowNode[]): GeneratedFile | null {
  const enchantNodes = nodes.filter((n) => n.data.kind === 'enchantment')
  if (enchantNodes.length === 0) return null

  const pkg = 'com.example.mod.enchantment'
  const entries = enchantNodes.map((n) => {
    const registryId = getStr(n, 'registryId', n.id)
    const className = toClassName(registryId)
    return `    public static final RegistryObject<Enchantment> ${registryId.toUpperCase()} =\n        REGISTER.register("${registryId}", ${className}::new);`
  })

  const content = `package ${pkg};

import net.minecraft.world.item.enchantment.Enchantment;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;
import com.example.mod.${toModClassName(modId)};

/**
 * 附魔注册中心（NexCube 自动生成）
 * 包含 ${enchantNodes.length} 个附魔节点
 */
public class ModEnchantments {

    public static final DeferredRegister<Enchantment> REGISTER =
        DeferredRegister.create(ForgeRegistries.ENCHANTMENTS, ${toModClassName(modId)}.MOD_ID);

${entries.join('\n\n')}
}
`
  return {
    filePath: `src/main/java/com/example/mod/enchantment/ModEnchantments.java`,
    content,
    language: 'java',
  }
}

/**
 * 生成 mods.toml（Forge 模组声明 + 依赖）
 */
function generateModsToml(modId: string): GeneratedFile {
  const content = `modLoader="javafml"
loaderVersion="[47,)"
license="MIT"

# 模组声明
[[mods]]
modId="${modId}"
version="1.0.0"
displayName="NexCube Mod"
description='''
Generated by NexCube — Next-generation Minecraft Mod IDE.
'''

# 依赖声明（Forge 47.x = MC 1.20.1）
[[dependencies.${modId}]]
    modId="forge"
    mandatory=true
    versionRange="[47,)"
    ordering="NONE"
    side="BOTH"

[[dependencies.${modId}]]
    modId="minecraft"
    mandatory=true
    versionRange="[1.20.1,1.21)"
    ordering="NONE"
    side="BOTH"
`
  return {
    filePath: 'src/main/resources/META-INF/mods.toml',
    content,
    language: 'toml',
  }
}

/**
 * 生成语言文件（en_us.json + zh_cn.json）
 * 为每个节点生成对应的物品/方块/实体显示名
 */
function generateLangFile(modId: string, nodes: FlowNode[], lang: 'en_us' | 'zh_cn'): GeneratedFile {
  const entries: string[] = []

  for (const node of nodes) {
    const kind = node.data.kind
    const registryId = getStr(node, 'registryId', node.id)
    const title = node.data.title

    if (['item', 'equipment', 'weapon', 'food'].includes(kind)) {
      entries.push(`  "item.${modId}.${registryId}": "${title}"`)
    } else if (kind === 'block') {
      entries.push(`  "block.${modId}.${registryId}": "${title}"`)
    } else if (kind === 'entity') {
      entries.push(`  "entity.${modId}.${registryId}": "${title}"`)
      // 生怪蛋语言键
      entries.push(`  "item.${modId}.${registryId}_spawn_egg": "${title} 生怪蛋"`)
    } else if (kind === 'potion') {
      entries.push(`  "effect.${modId}.${registryId}": "${title}"`)
    } else if (kind === 'enchantment') {
      entries.push(`  "enchantment.${modId}.${registryId}": "${title}"`)
    } else if (kind === 'advancement') {
      const desc = String(node.data.properties?.description ?? '完成此成就')
      entries.push(`  "advancements.${modId}.${registryId}.title": "${title}"`)
      entries.push(`  "advancements.${modId}.${registryId}.description": "${desc}"`)
    }
  }

  const content = `{
${entries.join(',\n')}${entries.length > 0 ? ',' : ''}
  "itemGroup.${modId}": "${modId}"
}
`
  return {
    filePath: `src/main/resources/assets/${modId}/lang/${lang}.json`,
    content,
    language: 'json',
  }
}

/**
 * 生成创造模式物品栏分组（CreativeModeTab）
 *
 * Forge 1.20.1 用 DeferredRegister<CreativeModeTab> 注册。
 * 自动将所有物品/方块加入该分组。
 */
function generateCreativeTabFile(modId: string, nodes: FlowNode[]): GeneratedFile {
  const modClassName = toModClassName(modId)
  const pkg = 'com.example.mod'

  // 收集所有要加入物品栏的 RegistryObject 引用
  const itemRefs: string[] = []
  for (const node of nodes) {
    const kind = node.data.kind
    const registryId = getStr(node, 'registryId', node.id)
    const upper = registryId.toUpperCase()
    if (['item', 'equipment', 'weapon', 'food'].includes(kind)) {
      itemRefs.push(`            output.accept(ModItems.${upper}.get());`)
    } else if (kind === 'block') {
      itemRefs.push(`            output.accept(ModBlocks.${upper}_ITEM.get());`)
    } else if (kind === 'entity') {
      // 实体生怪蛋也加入创造物品栏
      itemRefs.push(`            output.accept(ModItems.${upper}_SPAWN_EGG.get());`)
    }
  }

  const content = `package ${pkg};

import net.minecraft.core.registries.Registries;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.RegistryObject;
import ${pkg}.item.ModItems;
import ${pkg}.block.ModBlocks;

/**
 * 创造模式物品栏分组（NexCube 自动生成）
 * 将所有模组物品/方块集中显示在一个创造标签页中
 */
public class ModCreativeTabs {

    public static final DeferredRegister<CreativeModeTab> REGISTER =
        DeferredRegister.create(Registries.CREATIVE_MODE_TAB, ${modClassName}.MOD_ID);

    public static final RegistryObject<CreativeModeTab> MAIN_TAB = REGISTER.register("main",
        () -> CreativeModeTab.builder()
            .title(Component.translatable("itemGroup.${modId}"))
            .icon(() -> new ItemStack(Items.DIAMOND))
            .displayItems((params, output) -> {
${itemRefs.join('\n')}
            })
            .build()
    );
}
`
  return {
    filePath: `src/main/java/com/example/mod/ModCreativeTabs.java`,
    content,
    language: 'java',
  }
}

/**
 * 生成方块战利品表（loot_tables/blocks/<id>.json）
 *
 * 方块破坏后掉落自身（self-drop），1.20.1 标准 JSON 格式。
 */
function generateBlockLootTable(modId: string, node: FlowNode): GeneratedFile {
  const registryId = getStr(node, 'registryId', node.id)
  const dropCount = getNum(node, 'dropCount', 1)

  const content = JSON.stringify({
    type: 'minecraft:block',
    pools: [
      {
        rolls: 1,
        entries: [
          {
            type: 'minecraft:item',
            name: `${modId}:${registryId}`,
            functions: dropCount !== 1 ? [
              {
                function: 'minecraft:set_count',
                count: dropCount,
              },
            ] : undefined,
          },
        ],
        conditions: [
          {
            condition: 'minecraft:survives_explosion',
          },
        ],
      },
    ],
  }, null, 2)

  return {
    filePath: `src/main/resources/data/${modId}/loot_tables/blocks/${registryId}.json`,
    content,
    linkedNodeId: node.id,
    language: 'json',
  }
}

/**
 * 生成实体掉落表 — Forge 1.20.1 loot_tables/entities/<id>.json
 *
 * 实体死亡时掉落物品。基于实体节点的属性生成：
 *  - 有 attack > 0 的怪物掉落经验值
 *  - 默认掉落自身关联物品（如果有同名 item 节点）
 *  - 10% 概率掉落（rare 属性可调整）
 */
function generateEntityLootTable(modId: string, node: FlowNode): GeneratedFile {
  const registryId = getStr(node, 'registryId', node.id)
  const attack = getNum(node, 'attack', 0)
  const health = getNum(node, 'health', 20)
  const dropItemId = getStr(node, 'dropItemId', '')
  const dropCount = getNum(node, 'dropCount', 1)
  const dropChance = getNum(node, 'dropChance', 1)

  // 经验值掉落（怪物死亡经验）
  const experienceDrop = attack > 0 ? Math.max(1, Math.floor(health / 5)) : 0

  // 掉落物品 ID：自定义 > 同名物品
  const lootItemId = dropItemId || `${modId}:${registryId}`

  // 构建掉落池
  const pools: unknown[] = []

  // 主掉落池
  const mainPool: Record<string, unknown> = {
    rolls: 1,
    entries: [
      {
        type: 'minecraft:item',
        name: lootItemId,
        functions: dropCount !== 1 ? [{ function: 'minecraft:set_count', count: dropCount }] : undefined,
      },
    ],
    conditions: [
      { condition: 'minecraft:killed_by_player' },
    ],
  }

  // 掉落概率 < 1 时添加 random_chance 条件
  if (dropChance < 1) {
    mainPool.conditions = [
      { condition: 'minecraft:killed_by_player' },
      { condition: 'minecraft:random_chance', chance: dropChance },
    ]
  }

  // 经验值函数
  if (experienceDrop > 0) {
    mainPool.functions = [
      { function: 'minecraft:set_experience', experience: experienceDrop },
    ]
  }

  pools.push(mainPool)

  const content = JSON.stringify({
    type: 'minecraft:entity',
    pools,
  }, null, 2)

  return {
    filePath: `src/main/resources/data/${modId}/loot_tables/entities/${registryId}.json`,
    content,
    linkedNodeId: node.id,
    language: 'json',
  }
}

/**
 * 生成物品进度（advancements/<id>.json）
 *
 * 获取该物品时触发进度（toast 通知 + 解锁配方）。
 */
function generateItemAdvancement(modId: string, node: FlowNode): GeneratedFile {
  const registryId = getStr(node, 'registryId', node.id)
  const title = node.data.title
  const kind = node.data.kind
  const itemRef = kind === 'block' ? `${modId}:${registryId}` : `${modId}:${registryId}`

  const content = JSON.stringify({
    display: {
      icon: {
        item: itemRef,
      },
      title: {
        translate: `itemGroup.${modId}.${registryId}`,
        fallback: title,
      },
      description: `获得 ${title}`,
      show_toast: true,
      announce_to_chat: false,
      hidden: false,
    },
    parent: 'minecraft:recipes/root',
    criteria: {
      get_item: {
        trigger: 'minecraft:inventory_changed',
        conditions: {
          items: [
            {
              items: [itemRef],
            },
          ],
        },
      },
    },
    requirements: [['get_item']],
  }, null, 2)

  return {
    filePath: `src/main/resources/data/${modId}/advancements/${registryId}.json`,
    content,
    linkedNodeId: node.id,
    language: 'json',
  }
}

/**
 * 生成物品标签文件（tags/items/<modId>.json）
 *
 * 将所有模组物品归入一个标签 `#<modId>:items`，
 * 便于其他 mod 引用或数据包扩展。
 */
function generateItemTagsFile(modId: string, nodes: FlowNode[]): GeneratedFile {
  const itemRefs = nodes.map((n) => {
    const registryId = getStr(n, 'registryId', n.id)
    return `${modId}:${registryId}`
  })

  const content = JSON.stringify({
    replace: false,
    values: itemRefs,
  }, null, 2)

  return {
    filePath: `src/main/resources/data/${modId}/tags/items/${modId}_items.json`,
    content,
    language: 'json',
  }
}

/**
 * 生成 Forge 事件处理器类
 *
 * 包含常用的 @SubscribeEvent 事件监听：
 *  - 实体死亡掉落（LivingDeathEvent）
 *  - 玩家加入服务器（PlayerEvent.PlayerLoggedInEvent）
 *  - 右键方块交互（PlayerInteractEvent.RightClickBlock）
 *
 * 用户可在 blackbox 区域添加自定义事件。
 */
function generateEventHandlerFile(modId: string, nodes: FlowNode[]): GeneratedFile {
  const modClassName = toModClassName(modId)
  const pkg = 'com.example.mod.event'

  const entityNodes = nodes.filter((n) => n.data.kind === 'entity')
  const blockNodes = nodes.filter((n) => n.data.kind === 'block')

  // 实体死亡掉落事件
  const entityDropHandlers = entityNodes.map((n) => {
    const registryId = getStr(n, 'registryId', n.id)
    const className = toClassName(registryId) + 'Entity'
    return `        // ${n.data.title} 死亡掉落
        // if (event.getEntity() instanceof ${className}) {
        //     event.getEntity().spawnAtLocation(new ItemStack(ModItems.${registryId.toUpperCase()}.get()));
        // }`
  }).join('\n')

  // 方块放置事件
  const blockPlaceHandlers = blockNodes.map((n) => {
    const registryId = getStr(n, 'registryId', n.id)
    return `        // ${n.data.title} 放置时触发
        // if (event.getPlacedBlock().getBlock() == ModBlocks.${registryId.toUpperCase()}.get()) {
        //     // 自定义逻辑
        // }`
  }).join('\n')

  const content = `package ${pkg};

import net.minecraftforge.event.entity.living.LivingDeathEvent;
import net.minecraftforge.event.entity.player.PlayerEvent;
import net.minecraftforge.event.entity.player.PlayerInteractEvent;
import net.minecraftforge.event.level.BlockEvent;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import com.example.mod.${modClassName};

/**
 * Forge 事件处理器（NexCube 自动生成）
 *
 * 包含常用事件监听示例。取消注释或修改以启用。
 */
@Mod.EventBusSubscriber(modid = ${modClassName}.MOD_ID, bus = Mod.EventBusSubscriber.Bus.FORGE)
public class ModEventHandlers {

    /**
     * 实体死亡事件 — 可用于自定义掉落
     */
    @SubscribeEvent
    public static void onLivingDeath(LivingDeathEvent event) {
${entityDropHandlers || '        // 无实体节点'}
    }

    /**
     * 玩家加入服务器 — 可用于欢迎消息
     */
    @SubscribeEvent
    public static void onPlayerLoggedIn(PlayerEvent.PlayerLoggedInEvent event) {
        // event.getEntity().sendSystemMessage(Component.literal("欢迎来到 NexCube 模组世界！"));
    }

    /**
     * 玩家离开服务器
     */
    @SubscribeEvent
    public static void onPlayerLoggedOut(PlayerEvent.PlayerLoggedOutEvent event) {
        // 清理玩家数据
    }

    /**
     * 右键方块交互 — 可用于自定义方块行为
     */
    @SubscribeEvent
    public static void onRightClickBlock(PlayerInteractEvent.RightClickBlock event) {
        // 在此添加自定义右键逻辑
    }

    /**
     * 方块放置事件 — 可用于触发特效
     */
    @SubscribeEvent
    public static void onBlockPlace(BlockEvent.EntityPlaceEvent event) {
${blockPlaceHandlers || '        // 无方块节点'}
    }

    /**
     * 方块破坏事件 — 可用于阻止破坏或触发掉落
     */
    @SubscribeEvent
    public static void onBlockBreak(BlockEvent.BreakEvent event) {
        // if (event.getState().getBlock() == ModBlocks.XXX.get()) {
        //     event.setCanceled(true); // 阻止破坏
        // }
    }

    /**
     * 服务器 Tick 事件 — 可用于周期性任务
     */
    @SubscribeEvent
    public static void onServerTick(TickEvent.ServerTickEvent event) {
        // if (event.phase == TickEvent.Phase.END) {
        //     // 每tick执行的逻辑
        // }
    }

    /**
     * 玩家 Tick 事件 — 可用于持续效果
     */
    @SubscribeEvent
    public static void onPlayerTick(TickEvent.PlayerTickEvent event) {
        // if (event.phase == TickEvent.Phase.END) {
        //     // 每tick对玩家执行逻辑
        // }
    }

    /**
     * 实体加入世界 — 可用于生成时特效
     */
    @SubscribeEvent
    public static void onEntityJoinLevel(net.minecraftforge.event.entity.EntityJoinLevelEvent event) {
        // if (event.getEntity() instanceof ${entityNodes.length > 0 ? toClassName(getStr(entityNodes[0], 'registryId', '')) + 'Entity' : 'YourEntity'}) {
        //     // 实体生成时触发
        // }
    }

    /**
     * 物品合成事件 — 可用于合成后效果
     */
    @SubscribeEvent
    public static void onItemCrafted(net.minecraftforge.event.entity.player.PlayerEvent.ItemCraftedEvent event) {
        // if (event.getCrafting().getItem() == ModItems.XXX.get()) {
        //     // 合成成功时触发
        // }
    }

    /**
     * 爆炸事件 — 可用于修改爆炸行为
     */
    @SubscribeEvent
    public static void onExplosion(net.minecraftforge.event.level.ExplosionEvent.Start event) {
        // event.getExplosion();
    }

    /**
     * 玩家复活事件
     */
    @SubscribeEvent
    public static void onPlayerRespawn(PlayerEvent.PlayerRespawnEvent event) {
        // event.getEntity().sendSystemMessage(Component.literal("你复活了！"));
    }

    /**
     * 方块右键 — 可用于打开 GUI
     */
    @SubscribeEvent
    public static void onRightClickItem(PlayerInteractEvent.RightClickItem event) {
        // 右键使用物品时触发
    }
}
`

  return {
    filePath: `src/main/java/com/example/mod/event/ModEventHandlers.java`,
    content,
    language: 'java',
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
      case 'recipe':
        file = generateRecipeFile(node, modId)
        break
      case 'enchantment':
        file = generateEnchantmentFile(node, modId)
        break
      case 'advancement':
        file = generateAdvancementFile(node, modId)
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

  // 3. 注册中心类（DeferredRegister 模式，Forge 1.20.1 推荐）
  const modItems = generateModItemsFile(modId, nodes)
  if (modItems) files.push(modItems)
  const modBlocks = generateModBlocksFile(modId, nodes)
  if (modBlocks) files.push(modBlocks)
  const modEntities = generateModEntitiesFile(modId, nodes)
  if (modEntities) files.push(modEntities)
  const modEnchantments = generateModEnchantmentsFile(modId, nodes)
  if (modEnchantments) files.push(modEnchantments)

  // 4. 资源文件
  files.push(generateModsToml(modId))

  // 5. 语言文件（en_us + zh_cn）
  files.push(generateLangFile(modId, nodes, 'en_us'))
  files.push(generateLangFile(modId, nodes, 'zh_cn'))

  // 6. 创造模式物品栏分组（有物品/方块/实体时生成）
  const hasCreatables = nodes.some((n) =>
    ['item', 'equipment', 'weapon', 'food', 'block', 'entity'].includes(n.data.kind),
  )
  if (hasCreatables) {
    files.push(generateCreativeTabFile(modId, nodes))
  }

  // 7. 战利品表（方块掉落）
  const blockNodes = nodes.filter((n) => n.data.kind === 'block')
  for (const block of blockNodes) {
    files.push(generateBlockLootTable(modId, block))
  }

  // 7b. 实体掉落表（实体死亡掉落）
  const entityNodesForLoot = nodes.filter((n) => n.data.kind === 'entity')
  for (const entity of entityNodesForLoot) {
    files.push(generateEntityLootTable(modId, entity))
  }

  // 8. 进度（advancements）— 获取物品触发
  const itemNodes = nodes.filter((n) =>
    ['item', 'equipment', 'weapon', 'food', 'block'].includes(n.data.kind),
  )
  for (const item of itemNodes) {
    files.push(generateItemAdvancement(modId, item))
  }

  // 9. 物品/方块标签（tags）— 便于其他 mod 引用
  if (itemNodes.length > 0) {
    files.push(generateItemTagsFile(modId, itemNodes))
  }

  // 9b. 方块标签（tags）— 便于其他 mod 引用方块
  const blockNodesForTags = nodes.filter((n) => n.data.kind === 'block')
  if (blockNodesForTags.length > 0) {
    const blockRefs = blockNodesForTags.map((n) => {
      const regId = getStr(n, 'registryId', n.id)
      return `${modId}:${regId}`
    })
    files.push({
      filePath: `src/main/resources/data/${modId}/tags/blocks/${modId}_blocks.json`,
      content: JSON.stringify({ replace: false, values: blockRefs }, null, 2),
      language: 'json',
    })
  }

  // 10. Forge 事件处理器（通用事件监听）
  files.push(generateEventHandlerFile(modId, nodes))

  return {
    files,
    modId,
    basePackage: 'com.example.mod',
    generatedAt: Date.now(),
  }
}
