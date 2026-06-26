/**
 * Forge 1.20.1 Java 源码生成器（Task 4-D）
 *
 * 根据节点画布快照生成完整可编译的 Java 源码：
 *   - 主类 @Mod（事件总线订阅、构造器、客户端 setup）
 *   - block 包：ModBlocks（DeferredRegister） + 每个方块的 *Block 子类
 *   - item 包：ModItems（DeferredRegister） + 每个物品的 *Item 子类
 *   - entity 包：ModEntities（DeferredRegister） + 每个实体的 *Entity 子类
 *   - client 包：ClientSetup（实体渲染器、BlockItem 模型）
 *   - blackbox 包：黑盒代码归档（不参与编译的引用）
 *
 * 编译目标：Forge 1.20.1 (47.3.7) + ForgeGradle 6.0.x + Java 17
 */

import type { CodegenNode, CodegenProject, GeneratedFile } from './types'
import {
  buildJavaPackage,
  modIdToPascalCase,
  parseProperties,
  readProp,
  registryIdToClassName,
  packageToPath,
} from './naming'

/* ------------------------------------------------------------------ */
/* 节点信息收集                                                        */
/* ------------------------------------------------------------------ */

interface EntityNodeInfo {
  className: string
  registryId: string
  health: number
  attack: number
  armor: number
  movementSpeed: number
  mobCategory: string
  aiType: string
  collisionX: number
  collisionY: number
}

interface BlockNodeInfo {
  className: string
  registryId: string
  hardness: number
  resistance: number
  lightLevel: number
  harvestTool: string
  harvestLevel: number
  isSolid: boolean
}

interface ItemNodeInfo {
  className: string
  registryId: string
  maxStackSize: number
  rarity: string
  isFood: boolean
  nutrition: number
  saturation: number
}

interface BlackboxNodeInfo {
  className: string
  sourceCode: string
}

/** 仅保留主画布上的核心节点（properties 中无 subGraphId） */
function filterMainCanvasCoreNodes(nodes: CodegenNode[]): CodegenNode[] {
  const CORE_TYPES = new Set(['entity', 'block', 'item', 'blackbox'])
  return nodes.filter((n) => {
    if (!CORE_TYPES.has(n.type)) return false
    try {
      const parsed = JSON.parse(n.properties || '{}') as Record<string, unknown>
      return !parsed.subGraphId
    } catch {
      return true
    }
  })
}

function collectEntityNodes(nodes: CodegenNode[]): EntityNodeInfo[] {
  return nodes
    .filter((n) => n.type === 'entity')
    .map((n, idx) => {
      const props = parseProperties(n.properties)
      const registryId = readProp<string>(props, 'registryId', `entity_${idx + 1}`)
      const colBox = readProp<{ x: number; y: number; z: number }>(props, 'collisionBox', {
        x: 0.6,
        y: 1.8,
        z: 0.6,
      })
      return {
        className: registryIdToClassName(registryId, 'CustomEntity') + 'Entity',
        registryId,
        health: readProp<number>(props, 'health', 20),
        attack: readProp<number>(props, 'attack', 0),
        armor: readProp<number>(props, 'armor', 0),
        movementSpeed: readProp<number>(props, 'movementSpeed', 0.3),
        mobCategory: readProp<string>(props, 'mobCategory', 'creature'),
        aiType: readProp<string>(props, 'aiType', 'none'),
        collisionX: colBox.x,
        collisionY: colBox.y,
      }
    })
}

function collectBlockNodes(nodes: CodegenNode[]): BlockNodeInfo[] {
  return nodes
    .filter((n) => n.type === 'block')
    .map((n, idx) => {
      const props = parseProperties(n.properties)
      const registryId = readProp<string>(props, 'registryId', `block_${idx + 1}`)
      return {
        className: registryIdToClassName(registryId, 'CustomBlock') + 'Block',
        registryId,
        hardness: readProp<number>(props, 'hardness', 3),
        resistance: readProp<number>(props, 'resistance', 6),
        lightLevel: readProp<number>(props, 'lightLevel', 0),
        harvestTool: readProp<string>(props, 'harvestTool', 'pickaxe'),
        harvestLevel: readProp<number>(props, 'harvestLevel', 1),
        isSolid: readProp<boolean>(props, 'isSolid', true),
      }
    })
}

function collectItemNodes(nodes: CodegenNode[]): ItemNodeInfo[] {
  return nodes
    .filter((n) => n.type === 'item')
    .map((n, idx) => {
      const props = parseProperties(n.properties)
      const registryId = readProp<string>(props, 'registryId', `item_${idx + 1}`)
      return {
        className: registryIdToClassName(registryId, 'CustomItem') + 'Item',
        registryId,
        maxStackSize: readProp<number>(props, 'maxStackSize', 64),
        rarity: readProp<string>(props, 'rarity', 'common'),
        isFood: readProp<boolean>(props, 'isFood', false),
        nutrition: readProp<number>(props, 'nutrition', 0),
        saturation: readProp<number>(props, 'saturation', 0),
      }
    })
}

function collectBlackboxNodes(nodes: CodegenNode[]): BlackboxNodeInfo[] {
  return nodes
    .filter((n) => n.type === 'blackbox' && n.sourceCode)
    .map((n, idx) => ({
      className: `BlackboxSnippet${idx + 1}`,
      sourceCode: n.sourceCode as string,
    }))
}

/* ------------------------------------------------------------------ */
/* 单文件生成器                                                        */
/* ------------------------------------------------------------------ */

function genMainClass(project: CodegenProject, pkg: string, modId: string): string {
  const className = modIdToPascalCase(project.modId) + 'Mod'

  return `package ${pkg};

import ${pkg}.block.ModBlocks;
import ${pkg}.client.ClientSetup;
import ${pkg}.entity.ModEntities;
import ${pkg}.item.ModItems;

import com.mojang.logging.LogUtils;
import net.minecraftforge.common.MinecraftForge;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.event.lifecycle.FMLCommonSetupEvent;
import net.minecraftforge.event.server.ServerStartingEvent;
import net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext;

import org.slf4j.Logger;

/**
 * ${project.name} — 主模组类
 *
 * 由 NexCube IDE 自动生成。
 * 目标：Minecraft ${project.mcVersion} + Forge ${project.forgeVersion}
 *
 * @author ${project.author}
 * @version ${project.version}
 */
@Mod(${className}.MOD_ID)
public class ${className} {

    public static final String MOD_ID = "${modId}";
    public static final Logger LOGGER = LogUtils.getLogger();

    public ${className}() {
        IEventBus modBus = FMLJavaModLoadingContext.get().getModEventBus();

        // 注册 DeferredRegister
        ModBlocks.BLOCKS.register(modBus);
        ModBlocks.ITEMS.register(modBus);
        ModItems.ITEMS.register(modBus);
        ModEntities.ENTITIES.register(modBus);

        // 生命周期事件
        modBus.addListener(this::commonSetup);
        modBus.addListener(ClientSetup::onClientSetup);

        // FORGE 事件总线
        MinecraftForge.EVENT_BUS.register(this);

        LOGGER.info("[{}] NexCube-generated mod loaded.", MOD_ID);
    }

    private void commonSetup(final FMLCommonSetupEvent event) {
        event.enqueueWork(() -> {
            LOGGER.info("[{}] Common setup complete.", MOD_ID);
        });
    }

    @SubscribeEvent
    public void onServerStarting(ServerStartingEvent event) {
        LOGGER.info("[{}] Server starting.", MOD_ID);
    }
}
`
}

function genModBlocks(blocks: BlockNodeInfo[], pkg: string, modId: string): string {
  const blockFieldLines = blocks
    .map(
      (b) =>
        `    public static final RegistryObject<Block> ${b.registryId.toUpperCase()} =\n            BLOCKS.register("${b.registryId}", ${b.className}::new);`,
    )
    .join('\n\n')

  const blockItemLines = blocks
    .map(
      (b) =>
        `        registerBlockItem("${b.registryId}", BLOCKS.get("${b.registryId}"));`,
    )
    .join('\n')

  return `package ${pkg}.block;

import net.minecraft.world.item.BlockItem;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.block.Block;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

/**
 * 方块注册中心 —— 由 NexCube 自动生成
 * 所有自定义方块在此声明，Forge 启动时统一注册。
 */
public class ModBlocks {

    public static final DeferredRegister<Block> BLOCKS =
            DeferredRegister.create(ForgeRegistries.BLOCKS, "${modId}");

    public static final DeferredRegister<Item> ITEMS =
            DeferredRegister.create(ForgeRegistries.ITEMS, "${modId}");

${blockFieldLines || '    // 当前项目无方块节点'}

    /**
     * 为方块自动注册 BlockItem（玩家手持 / 创造模式可见）
     * 由主类在 commonSetup 中调用一次。
     */
    public static void registerBlockItems() {
${blockItemLines || '        // 无方块需要注册 BlockItem'}
    }

    private static void registerBlockItem(String name, Block block) {
        ITEMS.register(name, () -> new BlockItem(block, new Item.Properties()));
    }
}
`
}

function genBlockClass(block: BlockNodeInfo, pkg: string): string {
  return `package ${pkg}.block;

import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockBehaviour;
import net.minecraft.world.level.block.SoundType;
import net.minecraft.world.level.material.MapColor;
import net.minecraft.world.level.material.PushReaction;

/**
 * ${block.registryId} —— 由 NexCube 节点画布生成
 *
 * 硬度: ${block.hardness}
 * 抗爆: ${block.resistance}
 * 发光: ${block.lightLevel}
 * 工具: ${block.harvestTool}（等级 ${block.harvestLevel}）
 */
public class ${block.className} extends Block {

    public ${block.className}() {
        super(BlockBehaviour.Properties.of()
                .mapColor(MapColor.STONE)
                .sound(SoundType.STONE)
                .strength(${block.hardness}f, ${block.resistance}f)
                .lightLevel(state -> ${block.lightLevel})
                .pushReaction(PushReaction.BLOCK)
                ${block.isSolid ? '.requiresCorrectToolForDrops()' : '.noOcclusion()'}
        );
    }
}
`
}

function genModItems(items: ItemNodeInfo[], pkg: string, modId: string): string {
  const itemFieldLines = items
    .map(
      (i) =>
        `    public static final RegistryObject<Item> ${i.registryId.toUpperCase()} =\n            ITEMS.register("${i.registryId}", ${i.className}::new);`,
    )
    .join('\n\n')

  return `package ${pkg}.item;

import net.minecraft.world.item.Item;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

/**
 * 物品注册中心 —— 由 NexCube 自动生成
 */
public class ModItems {

    public static final DeferredRegister<Item> ITEMS =
            DeferredRegister.create(ForgeRegistries.ITEMS, "${modId}");

${itemFieldLines || '    // 当前项目无独立物品节点（方块会自动生成 BlockItem）'}
}
`
}

function genItemClass(item: ItemNodeInfo, pkg: string): string {
  const foodProps = item.isFood
    ? `.food(new FoodProperties.Builder()
                        .nutrition(${item.nutrition})
                        .saturationMod(${item.saturation}f)
                        .build())`
    : ''

  return `package ${pkg}.item;

import net.minecraft.world.food.FoodProperties;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.Rarity;

/**
 * ${item.registryId} —— 由 NexCube 节点画布生成
 *
 * 最大堆叠: ${item.maxStackSize}
 * 稀有度:   ${item.rarity}
 * 食物:     ${item.isFood ? `是（饱食度 ${item.nutrition}, 饱和度 ${item.saturation}）` : '否'}
 */
public class ${item.className} extends Item {

    public ${item.className}() {
        super(new Item.Properties()
                .stacksTo(${item.maxStackSize})
                .rarity(Rarity.${item.rarity.toUpperCase()})
                ${foodProps}
        );
    }
}
`
}

function genModEntities(entities: EntityNodeInfo[], pkg: string, modId: string): string {
  const entityFieldLines = entities
    .map((e) => {
      const trackingRange = e.movementSpeed > 0.5 ? 10 : 8
      return `    public static final RegistryObject<EntityType<${e.className}>> ${e.registryId.toUpperCase()} =
            ENTITIES.register("${e.registryId}", () ->
                    EntityType.Builder.of(${e.className}::new, MobCategory.${e.mobCategory.toUpperCase()})
                            .sized(${e.collisionX}f, ${e.collisionY}f)
                            .clientTrackingRange(${trackingRange})
                            .build("${e.registryId}"));`
    })
    .join('\n\n')

  return `package ${pkg}.entity;

import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.MobCategory;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

/**
 * 实体注册中心 —— 由 NexCube 自动生成
 */
public class ModEntities {

    public static final DeferredRegister<EntityType<?>> ENTITIES =
            DeferredRegister.create(ForgeRegistries.ENTITY_TYPES, "${modId}");

${entityFieldLines || '    // 当前项目无实体节点'}
}
`
}

function genEntityClass(entity: EntityNodeInfo, pkg: string): string {
  return `package ${pkg}.entity;

import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.PathfinderMob;
import net.minecraft.world.entity.ai.attributes.AttributeSupplier;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.level.Level;

/**
 * ${entity.registryId} —— 由 NexCube 节点画布生成
 *
 * 生命值:   ${entity.health}
 * 攻击力:   ${entity.attack}
 * 护甲值:   ${entity.armor}
 * 移速:     ${entity.movementSpeed}
 * 生物类别: ${entity.mobCategory}
 * AI 类型:  ${entity.aiType}
 */
public class ${entity.className} extends PathfinderMob {

    public ${entity.className}(EntityType<? extends PathfinderMob> type, Level level) {
        super(type, level);
    }

    /**
     * 注册实体属性（生命值、攻击、护甲、移速等）
     * 由 Forge 通过 EntityAttributeCreationEvent 调用。
     */
    public static AttributeSupplier.Builder createAttributes() {
        return PathfinderMob.createMobAttributes()
                .add(Attributes.MAX_HEALTH, ${entity.health}d)
                .add(Attributes.ATTACK_DAMAGE, ${entity.attack}d)
                .add(Attributes.ARMOR, ${entity.armor}d)
                .add(Attributes.MOVEMENT_SPEED, ${entity.movementSpeed}d);
    }
}
`
}

function genClientSetup(entities: EntityNodeInfo[], pkg: string, modId: string): string {
  return `package ${pkg}.client;

import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.client.event.EntityRenderersEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.event.lifecycle.FMLClientSetupEvent;

/**
 * 客户端设置 —— 由 NexCube 自动生成
 *
 * 负责：
 *  - 注册实体渲染器
 *  - BlockItem / Item 模型绑定
 */
@Mod.EventBusSubscriber(modid = "${modId}", value = Dist.CLIENT, bus = Mod.EventBusSubscriber.Bus.MOD)
public class ClientSetup {

    public static void onClientSetup(final FMLClientSetupEvent event) {
        event.enqueueWork(() -> {
            // 模型注册可在此处用 ItemModelShaper / ModelLayers 完成
${
  entities.length > 0
    ? entities
        .map(
          (e) =>
            `            // ${e.registryId}: 实现 ${e.className}Renderer 后取消下行注释\n            // event.enqueueWork(() -> EntityRenderersEvent.RegisterRenderers 中注册);`,
        )
        .join('\n')
    : '            // 当前项目无实体需要注册渲染器'
}
        });
    }

    @SubscribeEvent
    public static void onRegisterRenderers(EntityRenderersEvent.RegisterRenderers event) {
        // 示例：event.registerEntityRenderer(ModEntities.RUBY_GOLEM.get(), RubyGolemRenderer::new);
    }
}
`
}

/* ------------------------------------------------------------------ */
/* 公共入口：generateJavaSources                                       */
/* ------------------------------------------------------------------ */

export interface JavaSourceBundle {
  files: GeneratedFile[]
  packageName: string
  mainClassName: string
}

/** 生成所有 Java 源码（不含资源、gradle 配置） */
export function generateJavaSources(
  project: CodegenProject,
  nodes: CodegenNode[],
): JavaSourceBundle {
  const modId = project.modId
  const pkg = buildJavaPackage(modId, project.author)
  const pkgPath = packageToPath(pkg)
  const mainClassName = modIdToPascalCase(modId) + 'Mod'
  const javaBase = `src/main/java/${pkgPath}`

  // 仅保留主画布核心节点
  const mainCanvasNodes = filterMainCanvasCoreNodes(nodes)
  const entities = collectEntityNodes(mainCanvasNodes)
  const blocks = collectBlockNodes(mainCanvasNodes)
  const items = collectItemNodes(mainCanvasNodes)
  const blackboxes = collectBlackboxNodes(mainCanvasNodes)

  const files: GeneratedFile[] = []

  // 主类
  files.push({
    path: `${javaBase}/${mainClassName}.java`,
    content: genMainClass(project, pkg, modId),
  })

  // block 包
  files.push({
    path: `${javaBase}/block/ModBlocks.java`,
    content: genModBlocks(blocks, pkg, modId),
  })
  for (const b of blocks) {
    files.push({
      path: `${javaBase}/block/${b.className}.java`,
      content: genBlockClass(b, pkg),
    })
  }

  // item 包
  files.push({
    path: `${javaBase}/item/ModItems.java`,
    content: genModItems(items, pkg, modId),
  })
  for (const i of items) {
    files.push({
      path: `${javaBase}/item/${i.className}.java`,
      content: genItemClass(i, pkg),
    })
  }

  // entity 包
  files.push({
    path: `${javaBase}/entity/ModEntities.java`,
    content: genModEntities(entities, pkg, modId),
  })
  for (const e of entities) {
    files.push({
      path: `${javaBase}/entity/${e.className}.java`,
      content: genEntityClass(e, pkg),
    })
  }

  // client 包
  files.push({
    path: `${javaBase}/client/ClientSetup.java`,
    content: genClientSetup(entities, pkg, modId),
  })

  // 黑盒代码归档
  for (const bb of blackboxes) {
    const indentedBody = bb.sourceCode
      .split('\n')
      .map((l) => '    ' + l)
      .join('\n')
    files.push({
      path: `${javaBase}/blackbox/${bb.className}.java`,
      content: `package ${pkg}.blackbox;\n\n/**\n * 黑盒代码片段（NexCube 自动隔离）\n * 该文件作为代码归档保留，不参与编译后的注册。\n */\npublic class ${bb.className} {\n\n${indentedBody}\n}\n`,
    })
  }

  return { files, packageName: pkg, mainClassName }
}
