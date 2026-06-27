/**
 * NexCube — Minecraft 1.20.1 + Forge 47.3.x API 字典
 *
 * 用途：
 *  - 为 Monaco Editor 提供 Java 智能补全数据（输入类名前缀触发）
 *  - 为代码生成引擎（Task 4-B）提供类型与方法元数据
 *  - 为属性面板/AST 反向同步提供类描述（中文化）
 *
 * 收录范围：
 *  - net.minecraft.world.entity.*       实体 / AI 目标 / 属性
 *  - net.minecraft.world.item.*          物品 / 物品堆
 *  - net.minecraft.world.level.block.*   方块 / 方块行为
 *  - net.minecraft.world.level.block.state.*  方块状态
 *  - net.minecraft.world.level.*         世界 / 区块 / 维度
 *  - net.minecraft.world.phys.*          向量 / 包围盒
 *  - net.minecraft.core.*                注册表 / BlockPos / Direction
 *  - net.minecraft.resources.*           ResourceLocation
 *  - net.minecraft.nbt.*                 NBT 标签
 *  - net.minecraft.network.*             网络包
 *  - net.minecraft.network.chat.*        文本组件
 *  - net.minecraft.sounds.*              声音事件
 *  - net.minecraft.world.effect.*        药水效果
 *  - net.minecraft.world.entity.player.* 玩家 / 物品栏
 *  - net.minecraft.world.food.*          食物属性
 *  - net.minecraft.world.inventory.*     容器菜单
 *  - net.minecraft.world.entity.projectile.*  投射物
 *  - net.minecraftforge.event.*          Forge 事件总线
 *  - net.minecraftforge.eventbus.api.*   事件注解
 *  - net.minecraftforge.fml.common.*     Mod 加载
 *  - net.minecraftforge.registries.*     延迟注册
 *  - net.minecraftforge.network.*        网络分发
 *  - net.minecraftforge.api.distmarker.* 客户端/服务端标记
 *  - net.minecraftforge.common.*         Forge 通用工具
 *  - net.minecraftforge.client.*         Forge 客户端
 *  - net.minecraft.server.level.*        服务端玩家 / 世界
 *  - net.minecraft.world.level.material.*  流体 / 材料
 *
 * 维护：
 *  - 持续迭代优先级 #2：扩展到 500+ 类
 *  - 核心 26 类有 methods 字段，其余类至少有 package/className/description
 */

export interface ApiMethodInfo {
  /** 方法签名（含返回类型 + 参数） */
  signature: string
  /** 中文描述 */
  description: string
}

export interface ApiFieldInfo {
  /** 字段类型 */
  type: string
  /** 字段名 */
  name: string
  /** 中文描述 */
  description: string
}

export interface ApiClassInfo {
  /** 完整包名 */
  package: string
  /** 类名 */
  className: string
  /** 中文描述 */
  description: string
  /** 关键方法 */
  methods?: ApiMethodInfo[]
  /** 关键字段 */
  fields?: ApiFieldInfo[]
}

/* ------------------------------------------------------------------ */
/* MC API 字典                                                         */
/* ------------------------------------------------------------------ */

export const MC_API_DICTIONARY: ApiClassInfo[] = [
  /* === net.minecraft.world.entity === */
  {
    package: 'net.minecraft.world.entity',
    className: 'Entity',
    description: '所有实体的基类',
    methods: [
      { signature: 'void tick()', description: '每刻调用，更新实体状态' },
      { signature: 'boolean hurt(DamageSource source, float amount)', description: '受到伤害' },
      { signature: 'void kill()', description: '杀死实体' },
      { signature: 'void setPos(double x, double y, double z)', description: '设置位置' },
      { signature: 'Vec3 position()', description: '获取位置' },
      { signature: 'Level level()', description: '获取所在世界' },
      { signature: 'UUID getUUID()', description: '获取唯一 ID' },
      { signature: 'boolean isAlive()', description: '是否存活' },
      { signature: 'void remove(RemovalReason reason)', description: '移除实体' },
      { signature: 'void setDeltaMovement(Vec3 motion)', description: '设置速度向量' },
      { signature: 'Vec3 getDeltaMovement()', description: '获取速度向量' },
      { signature: 'boolean isOnGround()', description: '是否在地面' },
      { signature: 'boolean isInWater()', description: '是否在水中' },
      { signature: 'boolean isUnderWater()', description: '是否在水下' },
      { signature: 'boolean isInLava()', description: '是否在岩浆中' },
      { signature: 'void teleportTo(double x, double y, double z)', description: '传送到坐标' },
      { signature: 'void spawnAtLocation(ItemStack stack)', description: '掉落物品' },
      { signature: 'boolean startRiding(Entity entity)', description: '骑乘目标' },
      { signature: 'void dismount()', description: '停止骑乘' },
    ],
  },
  {
    package: 'net.minecraft.world.entity',
    className: 'LivingEntity',
    description: '有生命值的实体（生物、玩家）',
    methods: [
      { signature: 'float getHealth()', description: '获取当前生命值' },
      { signature: 'void setHealth(float health)', description: '设置生命值' },
      { signature: 'float getMaxHealth()', description: '获取最大生命值' },
      { signature: 'void heal(float amount)', description: '治疗' },
      { signature: 'boolean addEffect(MobEffectInstance effect)', description: '添加药水效果' },
      { signature: 'void removeEffect(MobEffect effect)', description: '移除药水效果' },
      { signature: 'ItemStack getMainHandItem()', description: '获取主手物品' },
      { signature: 'ItemStack getOffhandItem()', description: '获取副手物品' },
      { signature: 'void swing(InteractionHand hand)', description: '挥手动画' },
      { signature: 'boolean isDeadOrDying()', description: '是否濒死或死亡' },
      { signature: 'float getArmorValue()', description: '获取护甲值' },
      { signature: 'MobType getMobType()', description: '获取生物群系类型' },
      { signature: 'void setArrowCount(int count)', description: '设置插箭数量' },
      { signature: 'int getArrowCount()', description: '获取插箭数量' },
      { signature: 'boolean canBeAffected(MobEffectInstance effect)', description: '是否可被施加效果' },
    ],
  },
  {
    package: 'net.minecraft.world.entity',
    className: 'Mob',
    description: '有 AI 的生物',
    methods: [
      { signature: 'void setTarget(LivingEntity target)', description: '设置攻击目标' },
      { signature: 'LivingEntity getTarget()', description: '获取攻击目标' },
      { signature: 'GoalSelector goalSelector', description: 'AI 目标选择器' },
      { signature: 'GoalSelector targetSelector', description: 'AI 目标选择器（目标类）' },
      { signature: 'boolean isAggressive()', description: '是否处于激怒状态' },
      { signature: 'void setPersistenceRequired()', description: '标记不可自然消失' },
      { signature: 'boolean requiresCustomPersistence()', description: '是否需要持久化' },
    ],
    fields: [
      { type: 'GoalSelector', name: 'goalSelector', description: 'AI 行为目标选择器' },
      { type: 'GoalSelector', name: 'targetSelector', description: 'AI 攻击目标选择器' },
    ],
  },
  {
    package: 'net.minecraft.world.entity',
    className: 'PathfinderMob',
    description: '有寻路能力的生物',
  },
  {
    package: 'net.minecraft.world.entity',
    className: 'Monster',
    description: '怪物基类（烈焰人/僵尸/骷髅等）',
  },
  {
    package: 'net.minecraft.world.entity',
    className: 'Animal',
    description: '动物基类（可繁殖）',
    methods: [
      { signature: 'boolean isFood(ItemStack stack)', description: '是否可作食物（繁殖用）' },
      { signature: 'void setInLove(Player player)', description: '进入发情状态' },
    ],
  },
  {
    package: 'net.minecraft.world.entity',
    className: 'Creature',
    description: '中立生物（不主动攻击）',
  },
  {
    package: 'net.minecraft.world.entity',
    className: 'AgeableMob',
    description: '有年龄阶段的生物（幼体/成年）',
  },
  {
    package: 'net.minecraft.world.entity',
    className: 'TamableAnimal',
    description: '可驯服动物（狼/猫/鹦鹉）',
  },
  {
    package: 'net.minecraft.world.entity',
    className: 'EntityType',
    description: '实体类型注册表项',
    methods: [
      { signature: 'T create(Level level)', description: '创建实体实例' },
      { signature: 'static EntityType.Builder<T> builder()', description: '构造 Builder' },
      { signature: 'ResourceLocation getKey()', description: '获取注册 ID' },
    ],
  },
  {
    package: 'net.minecraft.world.entity',
    className: 'MobCategory',
    description: '生物分类（怪物/生物/水生物等）',
    fields: [
      { type: 'MobCategory', name: 'MONSTER', description: '怪物（限 70）' },
      { type: 'MobCategory', name: 'CREATURE', description: '被动生物（限 10）' },
      { type: 'MobCategory', name: 'AMBIENT', description: '环境生物（蝙蝠）' },
      { type: 'MobCategory', name: 'WATER_CREATURE', description: '水生生物' },
    ],
  },
  {
    package: 'net.minecraft.world.entity',
    className: 'InteractionHand',
    description: '交互手（主手/副手）',
    fields: [
      { type: 'InteractionHand', name: 'MAIN_HAND', description: '主手' },
      { type: 'InteractionHand', name: 'OFF_HAND', description: '副手' },
    ],
  },
  {
    package: 'net.minecraft.world.entity',
    className: 'EntitySpawnReason',
    description: '实体生成原因（自然/召唤/命令等）',
  },

  /* === net.minecraft.world.entity.ai.goal === */
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'Goal',
    description: 'AI 目标基类',
    methods: [
      { signature: 'boolean canUse()', description: '是否可以激活' },
      { signature: 'boolean canContinueToUse()', description: '是否可以继续' },
      { signature: 'void start()', description: '激活时调用' },
      { signature: 'void tick()', description: '每刻执行' },
      { signature: 'void stop()', description: '停止时调用' },
      { signature: 'boolean isInterruptable()', description: '是否可被打断' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'MeleeAttackGoal',
    description: '近战攻击 AI（接近目标 + 攻击）',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'RangedAttackGoal',
    description: '远程攻击 AI（拉开距离 + 射击）',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'WaterAvoidingRandomStrollGoal',
    description: '随机散步（避开水域）',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'RandomStrollGoal',
    description: '随机散步',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'RandomLookAroundGoal',
    description: '随机张望',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'LookAtPlayerGoal',
    description: '看向玩家',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'FloatGoal',
    description: '在水中上浮',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'PanicGoal',
    description: '惊慌逃跑',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'AvoidEntityGoal',
    description: '躲避指定实体',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'FollowParentGoal',
    description: '幼崽跟随父母',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'BreedGoal',
    description: '繁殖 AI',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'TemptGoal',
    description: '被食物吸引',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal.target',
    className: 'NearestAttackableTargetGoal',
    description: '锁定最近的可攻击目标',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal.target',
    className: 'HurtByTargetGoal',
    description: '被攻击后反击',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'GoalSelector',
    description: 'AI 目标选择器（按优先级调度）',
    methods: [
      { signature: 'void addGoal(int priority, Goal goal)', description: '添加目标' },
      { signature: 'void removeGoal(Goal goal)', description: '移除目标' },
      { signature: 'void tick()', description: '每刻调度' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'WrappedGoal',
    description: '已注册的目标包装',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'MoveTowardsRestrictionGoal',
    description: '向限制点移动',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'RestrictSunGoal',
    description: '躲避阳光（亡灵）',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'FleeSunGoal',
    description: '逃离阳光',
  },
  {
    package: 'net.minecraft.world.entity.ai.goal',
    className: 'OpenDoorGoal',
    description: '开门 AI',
  },

  /* === net.minecraft.world.entity.ai.attributes === */
  {
    package: 'net.minecraft.world.entity.ai.attributes',
    className: 'Attribute',
    description: '生物属性基类',
  },
  {
    package: 'net.minecraft.world.entity.ai.attributes',
    className: 'Attributes',
    description: '内置属性常量（生命/攻击/移速等）',
    fields: [
      { type: 'Attribute', name: 'MAX_HEALTH', description: '最大生命值（默认 20）' },
      { type: 'Attribute', name: 'ATTACK_DAMAGE', description: '攻击伤害（默认 2）' },
      { type: 'Attribute', name: 'MOVEMENT_SPEED', description: '移动速度（默认 0.7）' },
      { type: 'Attribute', name: 'ARMOR', description: '护甲（默认 0）' },
      { type: 'Attribute', name: 'ARMOR_TOUGHNESS', description: '护甲韧性（默认 0）' },
      { type: 'Attribute', name: 'KNOCKBACK_RESISTANCE', description: '击退抗性（默认 0）' },
      { type: 'Attribute', name: 'FOLLOW_RANGE', description: '追踪范围（默认 16）' },
      { type: 'Attribute', name: 'ATTACK_SPEED', description: '攻击速度（默认 4）' },
      { type: 'Attribute', name: 'FLYING_SPEED', description: '飞行速度' },
      { type: 'Attribute', name: 'JUMP_STRENGTH', description: '跳跃力（马）' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.ai.attributes',
    className: 'AttributeInstance',
    description: '属性实例（含基础值 + 修饰符）',
    methods: [
      { signature: 'double getValue()', description: '获取最终值（基础+修饰）' },
      { signature: 'void setBaseValue(double value)', description: '设置基础值' },
      { signature: 'void addModifier(AttributeModifier mod)', description: '添加修饰符' },
      { signature: 'void removeModifier(AttributeModifier mod)', description: '移除修饰符' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.ai.attributes',
    className: 'AttributeModifier',
    description: '属性修饰符（装备/Buff 加成）',
    fields: [
      { type: 'Operation', name: 'ADDITION', description: '加法（+x）' },
      { type: 'Operation', name: 'MULTIPLY_BASE', description: '乘法基础（base*x）' },
      { type: 'Operation', name: 'MULTIPLY_TOTAL', description: '乘法总和（total*x）' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.ai.attributes',
    className: 'RangedAttribute',
    description: '范围属性（含 min/max 限制）',
  },
  {
    package: 'net.minecraft.world.entity.ai.attributes',
    className: 'AttributeSupplier',
    description: '属性提供器（生物属性批量注册）',
  },

  /* === net.minecraft.world.item === */
  {
    package: 'net.minecraft.world.item',
    className: 'Item',
    description: '物品基类',
    methods: [
      { signature: 'InteractionResult useOn(UseOnContext ctx)', description: '右键方块时触发' },
      { signature: 'InteractionResult use(Level level, Player player, InteractionHand hand)', description: '右键空气时触发' },
      { signature: 'int getMaxStackSize(ItemStack stack)', description: '最大堆叠' },
      { signature: 'boolean isEnchantable(ItemStack stack)', description: '可附魔？' },
      { signature: 'int getEnchantmentValue(ItemStack stack)', description: '附魔能力' },
      { signature: 'Rarity getRarity(ItemStack stack)', description: '稀有度' },
      { signature: 'void appendHoverText(ItemStack stack, Level level, List<Component> lines, TooltipFlag flag)', description: '追加悬浮提示' },
      { signature: 'boolean isValidRepairItem(ItemStack toRepair, ItemStack repair)', description: '可作修复材料？' },
    ],
  },
  {
    package: 'net.minecraft.world.item',
    className: 'ItemStack',
    description: '物品堆（带 NBT 的物品实例）',
    methods: [
      { signature: 'Item getItem()', description: '获取对应 Item' },
      { signature: 'int getCount()', description: '获取数量' },
      { signature: 'void setCount(int count)', description: '设置数量' },
      { signature: 'boolean isEmpty()', description: '是否为空' },
      { signature: 'CompoundTag getOrCreateTag()', description: '获取或创建 NBT' },
      { signature: 'CompoundTag getTag()', description: '获取 NBT' },
      { signature: 'void setTag(CompoundTag tag)', description: '设置 NBT' },
      { signature: 'boolean hasTag()', description: '是否有 NBT' },
      { signature: 'void shrink(int amount)', description: '减少数量' },
      { signature: 'void grow(int amount)', description: '增加数量' },
      { signature: 'boolean isEnchanted()', description: '已附魔？' },
      { signature: 'boolean isDamageableItem()', description: '可受损？' },
      { signature: 'int getDamageValue()', description: '获取耐久损失' },
      { signature: 'void setDamageValue(int damage)', description: '设置耐久损失' },
      { signature: 'int getMaxDamage()', description: '最大耐久' },
    ],
  },
  {
    package: 'net.minecraft.world.item',
    className: 'Item.Properties',
    description: '物品属性构建器（堆叠/耐久/稀有度/Tab）',
    methods: [
      { signature: 'Properties stacksTo(int max)', description: '最大堆叠' },
      { signature: 'Properties durability(int max)', description: '最大耐久' },
      { signature: 'Properties rarity(Rarity rarity)', description: '稀有度' },
      { signature: 'Properties food(FoodProperties food)', description: '食物属性' },
      { signature: 'Properties tab(CreativeModeTab tab)', description: '创造模式 Tab' },
      { signature: 'Properties setNoRepair()', description: '不可修复' },
      { signature: 'Properties fireResistant()', description: '防火（地狱岩浆免疫）' },
      { signature: 'Properties craftRemainder(Item item)', description: '合成剩余物' },
    ],
  },
  {
    package: 'net.minecraft.world.item',
    className: 'CreativeModeTab',
    description: '创造模式物品栏 Tab',
    methods: [
      { signature: 'static CreativeModeTab.Builder builder()', description: '创建 Builder' },
      { signature: 'void fillItemList(NonNullList<ItemStack> items)', description: '填充物品列表' },
    ],
  },
  {
    package: 'net.minecraft.world.item',
    className: 'CreativeModeTabs',
    description: '内置 Tab 注册表（建筑/红石/工具等）',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'Items',
    description: '原版物品常量（AIR/DIAMOND/IRON_INGOT 等）',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'ItemUseContext',
    description: '物品使用上下文（含世界/玩家/手/位置）',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'UseOnContext',
    description: '右键方块上下文',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'TieredItem',
    description: '有等级的工具（剑/镐/斧等）',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'SwordItem',
    description: '剑（攻击伤害 + 攻击速度）',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'PickaxeItem',
    description: '镐',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'AxeItem',
    description: '斧',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'ShovelItem',
    description: '铲',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'HoeItem',
    description: '锄',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'ArmorItem',
    description: '盔甲（头盔/胸甲/护腿/靴子）',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'ArmorMaterials',
    description: '盔甲材质（皮革/铁/金/钻石/下界合金）',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'Tier',
    description: '工具等级接口（等级/速度/附魔/耐久/修复材料）',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'Tiers',
    description: '原版工具等级（木/石/铁/金/钻石/下界合金）',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'ItemCooldowns',
    description: '物品冷却管理（紫影果/末影珍珠）',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'Rarity',
    description: '稀有度（普通/稀有/史诗/传说）',
    fields: [
      { type: 'Rarity', name: 'COMMON', description: '普通（白）' },
      { type: 'Rarity', name: 'UNCOMMON', description: '罕见（黄）' },
      { type: 'Rarity', name: 'RARE', description: '稀有（青）' },
      { type: 'Rarity', name: 'EPIC', description: '史诗（紫）' },
    ],
  },
  {
    package: 'net.minecraft.world.item',
    className: 'EnchantedBookItem',
    description: '附魔书',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'BlockItem',
    description: '方块物品（与 Block 绑定）',
  },
  {
    package: 'net.minecraft.world.item',
    className: 'SpawnEggItem',
    description: '生成蛋',
  },

  /* === net.minecraft.world.level.block === */
  {
    package: 'net.minecraft.world.level.block',
    className: 'Block',
    description: '方块基类',
    methods: [
      { signature: 'BlockState defaultBlockState()', description: '默认状态' },
      { signature: 'void neighborChanged(BlockState state, Level level, BlockPos pos, Block neighbor, BlockPos neighborPos, boolean isMoving)', description: '邻接方块变更' },
      { signature: 'InteractionResult use(BlockState state, Level level, BlockPos pos, Player player, InteractionHand hand, BlockHitResult hit)', description: '右键方块' },
      { signature: 'void onPlace(BlockState state, Level level, BlockPos pos, BlockState oldState, boolean isMoving)', description: '放置时' },
      { signature: 'void onRemove(BlockState state, Level level, BlockPos pos, BlockState newState, boolean isMoving)', description: '移除时' },
      { signature: 'ItemStack getCloneItemStack(BlockGetter level, BlockPos pos, BlockState state)', description: '中键拾取的物品' },
      { signature: 'VoxelShape getShape(BlockState state, BlockGetter level, BlockPos pos, CollisionContext context)', description: '碰撞箱' },
      { signature: 'boolean canSurvive(BlockState state, LevelReader level, BlockPos pos)', description: '可放置？' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'BlockBehaviour',
    description: '方块行为基类（属性 / 状态 / 实体交互）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'BlockBehaviour.Properties',
    description: '方块属性构建器（硬度/抗爆/声音/发光等）',
    methods: [
      { signature: 'Properties strength(float hardness, float resistance)', description: '硬度 + 抗爆度' },
      { signature: 'Properties sound(SoundType sound)', description: '走/破坏/放置声音' },
      { signature: 'Properties lightLevel(StatePredicate level)', description: '发光等级' },
      { signature: 'Properties noCollission()', description: '无碰撞箱（草/花）' },
      { signature: 'Properties noOcclusion()', description: '无遮挡（玻璃）' },
      { signature: 'Properties dropsLike(Block block)', description: '掉落物同某方块' },
      { signature: 'Properties dropSelf(boolean drop)', description: '掉落自身' },
      { signature: 'Properties harvestLevel(int level)', description: '挖掘等级（0=木，3=钻石）' },
      { signature: 'Properties harvestTool(ToolType tool)', description: '挖掘工具（镐/斧/锹/锄）' },
      { signature: 'Properties requiresCorrectToolForDrops()', description: '需正确工具才掉落' },
      { signature: 'Properties friction(float friction)', description: '摩擦力（冰 0.98）' },
      { signature: 'Properties speedFactor(float factor)', description: '速度因子（灵魂沙 0.4）' },
      { signature: 'Properties jumpFactor(float factor)', description: '跳跃因子' },
      { signature: 'Properties instabreak()', description: '瞬间破坏' },
      { signature: 'Properties randomTicks()', description: '随机刻（作物成长）' },
      { signature: 'Properties mapColor(MapColor color)', description: '地图颜色' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'Blocks',
    description: '原版方块常量（AIR/STONE/DIRT/GRASS 等）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'FallingBlock',
    description: '受重力影响（沙/砂砾）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'LiquidBlock',
    description: '流体方块（水/岩浆）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'StairBlock',
    description: '楼梯',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'SlabBlock',
    description: '半砖（顶/底/完整）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'FenceBlock',
    description: '栅栏（自动连接）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'FenceGateBlock',
    description: '栅栏门（可开关）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'WallBlock',
    description: '墙（自动连接）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'DoorBlock',
    description: '门（双格高，可开关）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'TrapDoorBlock',
    description: '活板门',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'PressurePlateBlock',
    description: '压力板（玩家/怪物触发）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'ButtonBlock',
    description: '按钮（短暂触发）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'LeverBlock',
    description: '拉杆（持续触发）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'TorchBlock',
    description: '火把（粒子）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'OreBlock',
    description: '矿石方块（经验掉落）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'CropBlock',
    description: '作物（小麦/胡萝卜/马铃薯）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'SaplingBlock',
    description: '树苗',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'LeavesBlock',
    description: '树叶（自然凋落）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'FlowerBlock',
    description: '花朵',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'BaseEntityBlock',
    description: '有 BlockEntity 的方块基类',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'BedBlock',
    description: '床（设置重生点）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'SandBlock',
    description: '沙（落沙）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'SnowLayerBlock',
    description: '雪层（1-8 层）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'WebBlock',
    description: '蜘蛛网（减速）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'GlassBlock',
    description: '玻璃（透明 + 无遮挡）',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'IronBlock',
    description: '铁块',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'DiamondBlock',
    description: '钻石块',
  },
  {
    package: 'net.minecraft.world.level.block',
    className: 'SoundType',
    description: '方块声音类型（脚步/破坏/放置）',
    fields: [
      { type: 'SoundType', name: 'STONE', description: '石头' },
      { type: 'SoundType', name: 'WOOD', description: '木头' },
      { type: 'SoundType', name: 'GRAVEL', description: '沙砾' },
      { type: 'SoundType', name: 'GLASS', description: '玻璃' },
      { type: 'SoundType', name: 'METAL', description: '金属' },
      { type: 'SoundType', name: 'SAND', description: '沙' },
    ],
  },

  /* === net.minecraft.world.level.block.state === */
  {
    package: 'net.minecraft.world.level.block.state',
    className: 'BlockState',
    description: '方块状态（含属性键值对）',
    methods: [
      { signature: 'Block getBlock()', description: '获取对应 Block' },
      { signature: '<T extends Comparable<T>> T getValue(Property<T> prop)', description: '获取属性值' },
      { signature: '<T extends Comparable<T>, V extends T> BlockState setValue(Property<T> prop, V value)', description: '设置属性值' },
      { signature: 'boolean is(Block block)', description: '是否为某方块' },
      { signature: 'Material getMaterial()', description: '获取材料' },
      { signature: 'boolean isAir()', description: '是否为空气' },
      { signature: 'int getLightEmission()', description: '发光等级' },
      { signature: 'float getDestroySpeed(LevelReader level, BlockPos pos)', description: '破坏速度' },
      { signature: 'boolean canOcclude()', description: '是否遮挡' },
      { signature: 'VoxelShape getCollisionShape(BlockGetter level, BlockPos pos)', description: '碰撞箱' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.state',
    className: 'BlockBehaviour.BlockStateBase',
    description: '方块状态抽象基类',
  },
  {
    package: 'net.minecraft.world.level.block.state',
    className: 'StateHolder',
    description: '状态持有者基类（BlockState/FluidState 共用）',
  },
  {
    package: 'net.minecraft.world.level.block.state.properties',
    className: 'BlockStateProperties',
    description: '常用方块属性常量',
    fields: [
      { type: 'DirectionProperty', name: 'FACING', description: '朝向（六向）' },
      { type: 'DirectionProperty', name: 'HORIZONTAL_FACING', description: '水平朝向（四向）' },
      { type: 'BooleanProperty', name: 'POWERED', description: '已充能' },
      { type: 'BooleanProperty', name: 'OPEN', description: '已打开（门/栅栏门）' },
      { type: 'IntegerProperty', name: 'AGE', description: '年龄（作物成长 0-7）' },
      { type: 'IntegerProperty', name: 'POWER', description: '红石信号 0-15' },
      { type: 'EnumProperty<Half>', name: 'HALF', description: '上半/下半（楼梯）' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.state.properties',
    className: 'Property',
    description: '方块属性基类',
  },
  {
    package: 'net.minecraft.world.level.block.state.properties',
    className: 'BooleanProperty',
    description: '布尔属性',
  },
  {
    package: 'net.minecraft.world.level.block.state.properties',
    className: 'IntegerProperty',
    description: '整数属性（含 min/max）',
  },
  {
    package: 'net.minecraft.world.level.block.state.properties',
    className: 'DirectionProperty',
    description: '方向属性',
  },
  {
    package: 'net.minecraft.world.level.block.state.properties',
    className: 'EnumProperty',
    description: '枚举属性',
  },
  {
    package: 'net.minecraft.world.level.block.state.properties',
    className: 'Half',
    description: '上下半部分枚举（楼梯/门）',
  },
  {
    package: 'net.minecraft.world.level.block.state.properties',
    className: 'SlabType',
    description: '半砖类型（顶/底/完整）',
  },
  {
    package: 'net.minecraft.world.level.block.state.properties',
    className: 'RailShape',
    description: '铁轨形状',
  },

  /* === net.minecraft.world.level === */
  {
    package: 'net.minecraft.world.level',
    className: 'Level',
    description: '世界（客户端 + 服务端基类）',
    methods: [
      { signature: 'BlockState getBlockState(BlockPos pos)', description: '获取方块状态' },
      { signature: 'boolean setBlock(BlockPos pos, BlockState state, int flags)', description: '设置方块' },
      { signature: 'boolean removeBlock(BlockPos pos, boolean isMoving)', description: '移除方块' },
      { signature: 'void addBlockEntity(BlockEntity be)', description: '添加 BlockEntity' },
      { signature: 'BlockEntity getBlockEntity(BlockPos pos)', description: '获取 BlockEntity' },
      { signature: 'void addFreshEntity(Entity entity)', description: '生成实体' },
      { signature: 'List<Entity> getEntities(Entity except, AABB box, Predicate<Entity> filter)', description: '获取范围内实体' },
      { signature: '<T extends Entity> List<T> getEntitiesOfClass(Class<T> cls, AABB box)', description: '按类型获取实体' },
      { signature: 'long getGameTime()', description: '游戏刻' },
      { signature: 'long getDayTime()', description: '一天内的时间' },
      { signature: 'boolean isClientSide()', description: '客户端?' },
      { signature: 'boolean isDay()', description: '白天?' },
      { signature: 'boolean isNight()', description: '夜晚?' },
      { signature: 'boolean isRaining()', description: '下雨?' },
      { signature: 'boolean isThundering()', description: '雷暴?' },
      { signature: 'Difficulty getDifficulty()', description: '难度' },
      { signature: 'void playSound(Player player, BlockPos pos, SoundEvent sound, SoundSource source, float volume, float pitch)', description: '播放声音' },
      { signature: 'void levelEvent(int type, BlockPos pos, int data)', description: '世界事件（粒子）' },
      { signature: 'void destroyBlock(BlockPos pos, boolean dropItems)', description: '破坏方块' },
    ],
  },
  {
    package: 'net.minecraft.world.level',
    className: 'ServerLevel',
    description: '服务端世界（含持久化/维度/数据包）',
    methods: [
      { signature: 'MinecraftServer getServer()', description: '获取服务器实例' },
      { signature: 'void sendParticles(ParticleOptions particle, double x, double y, double z, int count, double dx, double dy, double dz, double speed)', description: '发送粒子包' },
      { signature: 'boolean addFreshEntity(Entity entity)', description: '生成实体（带维度检查）' },
      { signature: 'long getSeed()', description: '世界种子' },
      { signature: 'void setDayTime(long time)', description: '设置时间（命令/time）' },
      { signature: 'ServerChunkCache getChunkSource()', description: '获取区块源' },
    ],
  },
  {
    package: 'net.minecraft.world.level',
    className: 'BlockGetter',
    description: '方块查询接口（只读）',
  },
  {
    package: 'net.minecraft.world.level',
    className: 'EntityGetter',
    description: '实体查询接口',
  },
  {
    package: 'net.minecraft.world.level',
    className: 'LevelReader',
    description: '世界只读访问',
  },
  {
    package: 'net.minecraft.world.level',
    className: 'LevelAccessor',
    description: '世界读写访问',
  },
  {
    package: 'net.minecraft.world.level',
    className: 'LevelWriter',
    description: '世界写入接口',
  },
  {
    package: 'net.minecraft.world.level',
    className: 'Explosion',
    description: '爆炸（伤害/破坏方块）',
  },
  {
    package: 'net.minecraft.world.level',
    className: 'ExplosionDamageCalculator',
    description: '爆炸伤害计算器',
  },
  {
    package: 'net.minecraft.world.level',
    className: 'TickList',
    description: '刻调度列表',
  },
  {
    package: 'net.minecraft.world.level',
    className: 'NaturalSpawner',
    description: '自然生成管理器',
  },
  {
    package: 'net.minecraft.world.level',
    className: 'Difficulty',
    description: '难度枚举（和平/简单/普通/困难）',
    fields: [
      { type: 'Difficulty', name: 'PEACEFUL', description: '和平' },
      { type: 'Difficulty', name: 'EASY', description: '简单' },
      { type: 'Difficulty', name: 'NORMAL', description: '普通' },
      { type: 'Difficulty', name: 'HARD', description: '困难' },
    ],
  },

  /* === net.minecraft.world.level.material === */
  {
    package: 'net.minecraft.world.level.material',
    className: 'Material',
    description: '方块材料（决定物理属性）',
  },
  {
    package: 'net.minecraft.world.level.material',
    className: 'Materials',
    description: '内置材料常量',
  },
  {
    package: 'net.minecraft.world.level.material',
    className: 'Fluid',
    description: '流体基类',
  },
  {
    package: 'net.minecraft.world.level.material',
    className: 'FluidState',
    description: '流体状态',
  },
  {
    package: 'net.minecraft.world.level.material',
    className: 'Fluids',
    description: '原版流体常量（水/岩浆/空）',
  },
  {
    package: 'net.minecraft.world.level.material',
    className: 'FlowingFluid',
    description: '可流动的流体',
  },
  {
    package: 'net.minecraft.world.level.material',
    className: 'LavaFluid',
    description: '岩浆流体',
  },
  {
    package: 'net.minecraft.world.level.material',
    className: 'WaterFluid',
    description: '水流体',
  },

  /* === net.minecraft.world.phys === */
  {
    package: 'net.minecraft.world.phys',
    className: 'Vec3',
    description: '三维向量',
    methods: [
      { signature: 'double x()', description: 'X 坐标' },
      { signature: 'double y()', description: 'Y 坐标' },
      { signature: 'double z()', description: 'Z 坐标' },
      { signature: 'Vec3 add(Vec3 other)', description: '向量加' },
      { signature: 'Vec3 subtract(Vec3 other)', description: '向量减' },
      { signature: 'Vec3 scale(double factor)', description: '缩放' },
      { signature: 'double distanceTo(Vec3 other)', description: '距离' },
      { signature: 'double distanceToSqr(Vec3 other)', description: '距离平方' },
      { signature: 'Vec3 normalize()', description: '归一化' },
      { signature: 'static Vec3 directionFromRotation(float pitch, float yaw)', description: '从俯仰/偏航构造向量' },
    ],
  },
  {
    package: 'net.minecraft.world.phys',
    className: 'Vec3i',
    description: '整数三维向量（BlockPos 基类）',
  },
  {
    package: 'net.minecraft.world.phys',
    className: 'AABB',
    description: '轴对齐包围盒',
    methods: [
      { signature: 'double getMinX()', description: '最小 X' },
      { signature: 'double getMaxX()', description: '最大 X' },
      { signature: 'boolean intersects(AABB other)', description: '是否相交' },
      { signature: 'AABB move(double x, double y, double z)', description: '平移' },
      { signature: 'static AABB unitCubeFromOrigin(Vec3 origin)', description: '从原点构造单位立方体' },
    ],
  },
  {
    package: 'net.minecraft.world.phys',
    className: 'HitResult',
    description: '射线命中结果基类',
  },
  {
    package: 'net.minecraft.world.phys',
    className: 'BlockHitResult',
    description: '方块命中结果（含 BlockPos/Direction）',
  },
  {
    package: 'net.minecraft.world.phys',
    className: 'EntityHitResult',
    description: '实体命中结果',
  },
  {
    package: 'net.minecraft.world.phys',
    className: 'Vec2',
    description: '二维向量（pitch/yaw）',
  },

  /* === net.minecraft.core === */
  {
    package: 'net.minecraft.core',
    className: 'BlockPos',
    description: '方块坐标（不可变）',
    methods: [
      { signature: 'int getX()', description: 'X 坐标' },
      { signature: 'int getY()', description: 'Y 坐标' },
      { signature: 'int getZ()', description: 'Z 坐标' },
      { signature: 'BlockPos above()', description: '上方' },
      { signature: 'BlockPos below()', description: '下方' },
      { signature: 'BlockPos north()', description: '北方' },
      { signature: 'BlockPos south()', description: '南方' },
      { signature: 'BlockPos east()', description: '东方' },
      { signature: 'BlockPos west()', description: '西方' },
      { signature: 'BlockPos relative(Direction dir)', description: '相对方向' },
      { signature: 'static BlockPos containing(double x, double y, double z)', description: '从浮点构造' },
    ],
  },
  {
    package: 'net.minecraft.core',
    className: 'BlockPos.MutableBlockPos',
    description: '可变方块坐标（高性能循环用）',
  },
  {
    package: 'net.minecraft.core',
    className: 'Direction',
    description: '六向方向枚举',
    fields: [
      { type: 'Direction', name: 'DOWN', description: '下 (0, -1, 0)' },
      { type: 'Direction', name: 'UP', description: '上 (0, 1, 0)' },
      { type: 'Direction', name: 'NORTH', description: '北 (0, 0, -1)' },
      { type: 'Direction', name: 'SOUTH', description: '南 (0, 0, 1)' },
      { type: 'Direction', name: 'WEST', description: '西 (-1, 0, 0)' },
      { type: 'Direction', name: 'EAST', description: '东 (1, 0, 0)' },
    ],
  },
  {
    package: 'net.minecraft.core',
    className: 'Direction.Axis',
    description: '方向轴（X/Y/Z）',
  },
  {
    package: 'net.minecraft.core',
    className: 'Registry',
    description: '注册表接口',
  },
  {
    package: 'net.minecraft.core',
    className: 'BuiltInRegistries',
    description: '原版注册表集合（BLOCK/ITEM/ENTITY_TYPE 等）',
  },
  {
    package: 'net.minecraft.core',
    className: 'DefaultedRegistry',
    description: '带默认值的注册表',
  },
  {
    package: 'net.minecraft.core',
    className: 'MappedRegistry',
    description: '映射型注册表（按 ID + Key 双向）',
  },
  {
    package: 'net.minecraft.core',
    className: 'Holder',
    description: '注册项持有者（直接/引用）',
  },
  {
    package: 'net.minecraft.core',
    className: 'Holder.Reference',
    description: '引用型持有者',
  },
  {
    package: 'net.minecraft.core',
    className: 'HolderSet',
    description: '持有者集合（标签/直接）',
  },
  {
    package: 'net.minecraft.core',
    className: 'WritableRegistry',
    description: '可写注册表',
  },
  {
    package: 'net.minecraft.core',
    className: 'ResourceKey',
    description: '资源键（注册表 + 路径）',
  },
  {
    package: 'net.minecraft.core',
    className: 'NonNullList',
    description: '非空列表（物品栏常用）',
  },

  /* === net.minecraft.resources === */
  {
    package: 'net.minecraft.resources',
    className: 'ResourceLocation',
    description: '资源定位符（namespace:path）',
    methods: [
      { signature: 'String getNamespace()', description: '命名空间（mod id）' },
      { signature: 'String getPath()', description: '路径' },
      { signature: 'static ResourceLocation tryParse(String input)', description: '解析字符串' },
      { signature: 'static ResourceLocation tryBuild(String ns, String path)', description: '从命名空间+路径构造' },
    ],
  },
  {
    package: 'net.minecraft.resources',
    className: 'Resource',
    description: '资源（输入流 + 元数据）',
  },

  /* === net.minecraft.nbt === */
  {
    package: 'net.minecraft.nbt',
    className: 'CompoundTag',
    description: 'NBT 复合标签（键值对）',
    methods: [
      { signature: 'void put(String key, Tag tag)', description: '设置子标签' },
      { signature: 'void putBoolean(String key, boolean value)', description: '设置布尔' },
      { signature: 'void putByte(String key, byte value)', description: '设置字节' },
      { signature: 'void putInt(String key, int value)', description: '设置整数' },
      { signature: 'void putLong(String key, long value)', description: '设置长整数' },
      { signature: 'void putFloat(String key, float value)', description: '设置浮点' },
      { signature: 'void putDouble(String key, double value)', description: '设置双精度' },
      { signature: 'void putString(String key, String value)', description: '设置字符串' },
      { signature: 'boolean getBoolean(String key)', description: '获取布尔' },
      { signature: 'int getInt(String key)', description: '获取整数' },
      { signature: 'long getLong(String key)', description: '获取长整数' },
      { signature: 'float getFloat(String key)', description: '获取浮点' },
      { signature: 'double getDouble(String key)', description: '获取双精度' },
      { signature: 'String getString(String key)', description: '获取字符串' },
      { signature: 'CompoundTag getCompound(String key)', description: '获取子复合标签' },
      { signature: 'ListTag getList(String key, int type)', description: '获取列表标签' },
      { signature: 'boolean contains(String key)', description: '是否含键' },
      { signature: 'void remove(String key)', description: '删除键' },
    ],
  },
  {
    package: 'net.minecraft.nbt',
    className: 'Tag',
    description: 'NBT 标签基类',
  },
  {
    package: 'net.minecraft.nbt',
    className: 'ListTag',
    description: 'NBT 列表标签',
  },
  {
    package: 'net.minecraft.nbt',
    className: 'ByteArrayTag',
    description: 'NBT 字节数组',
  },
  {
    package: 'net.minecraft.nbt',
    className: 'IntArrayTag',
    description: 'NBT 整数数组',
  },
  {
    package: 'net.minecraft.nbt',
    className: 'LongArrayTag',
    description: 'NBT 长整数数组',
  },
  {
    package: 'net.minecraft.nbt',
    className: 'StringTag',
    description: 'NBT 字符串',
  },
  {
    package: 'net.minecraft.nbt',
    className: 'ByteTag',
    description: 'NBT 字节',
  },
  {
    package: 'net.minecraft.nbt',
    className: 'ShortTag',
    description: 'NBT 短整数',
  },
  {
    package: 'net.minecraft.nbt',
    className: 'IntTag',
    description: 'NBT 整数',
  },
  {
    package: 'net.minecraft.nbt',
    className: 'LongTag',
    description: 'NBT 长整数',
  },
  {
    package: 'net.minecraft.nbt',
    className: 'FloatTag',
    description: 'NBT 浮点',
  },
  {
    package: 'net.minecraft.nbt',
    className: 'DoubleTag',
    description: 'NBT 双精度',
  },
  {
    package: 'net.minecraft.nbt',
    className: 'NumericTag',
    description: 'NBT 数字标签基类',
  },
  {
    package: 'net.minecraft.nbt',
    className: 'NbtIo',
    description: 'NBT 读写工具',
  },

  /* === net.minecraft.network === */
  {
    package: 'net.minecraft.network',
    className: 'FriendlyByteBuf',
    description: '网络字节缓冲（编解码）',
    methods: [
      { signature: 'FriendlyByteBuf writeVarInt(int value)', description: '写 VarInt' },
      { signature: 'int readVarInt()', description: '读 VarInt' },
      { signature: 'FriendlyByteBuf writeUtf(String str)', description: '写字符串' },
      { signature: 'String readUtf()', description: '读字符串' },
      { signature: 'FriendlyByteBuf writeItem(ItemStack stack)', description: '写物品堆' },
      { signature: 'ItemStack readItem()', description: '读物品堆' },
      { signature: 'FriendlyByteBuf writeBlockPos(BlockPos pos)', description: '写方块坐标' },
      { signature: 'BlockPos readBlockPos()', description: '读方块坐标' },
      { signature: 'FriendlyByteBuf writeCompoundTag(CompoundTag tag)', description: '写 NBT' },
      { signature: 'CompoundTag readCompoundTag()', description: '读 NBT' },
    ],
  },
  {
    package: 'net.minecraft.network',
    className: 'Protocol',
    description: '网络协议',
  },
  {
    package: 'net.minecraft.network',
    className: 'Connection',
    description: '网络连接',
  },
  {
    package: 'net.minecraft.network',
    className: 'ConnectionProtocol',
    description: '协议枚举（HANDSHAKE/PLAY/STATUS/LOGIN）',
  },
  {
    package: 'net.minecraft.network',
    className: 'Packet',
    description: '网络包接口',
  },
  {
    package: 'net.minecraft.network',
    className: 'PacketFlow',
    description: '网络流向（CLIENTBOUND/SERVERBOUND）',
  },

  /* === net.minecraft.network.chat === */
  {
    package: 'net.minecraft.network.chat',
    className: 'Component',
    description: '文本组件基类（可拼接 / 可着色 / 可本地化）',
    methods: [
      { signature: 'String getString()', description: '纯文本' },
      { signature: 'MutableComponent append(Component sibling)', description: '追加子组件' },
      { signature: 'Style getStyle()', description: '获取样式' },
      { signature: 'static Component literal(String content)', description: '字面量构造' },
      { signature: 'static Component translatable(String key, Object... args)', description: '本地化构造' },
      { signature: 'static Component empty()', description: '空组件' },
    ],
  },
  {
    package: 'net.minecraft.network.chat',
    className: 'MutableComponent',
    description: '可变组件',
  },
  {
    package: 'net.minecraft.network.chat',
    className: 'TextComponent',
    description: '字面量文本（1.20 已退化为 Component.literal）',
  },
  {
    package: 'net.minecraft.network.chat',
    className: 'TranslatableComponent',
    description: '可本地化文本',
  },
  {
    package: 'net.minecraft.network.chat',
    className: 'Style',
    description: '文本样式（颜色/斜体/粗体/下划线/事件）',
    methods: [
      { signature: 'Style withColor(TextColor color)', description: '设置颜色' },
      { signature: 'Style withBold(boolean bold)', description: '加粗' },
      { signature: 'Style withItalic(boolean italic)', description: '斜体' },
      { signature: 'Style withClickEvent(ClickEvent event)', description: '点击事件' },
      { signature: 'Style withHoverEvent(HoverEvent event)', description: '悬浮事件' },
    ],
  },
  {
    package: 'net.minecraft.network.chat',
    className: 'TextColor',
    description: '文本颜色',
  },
  {
    package: 'net.minecraft.network.chat',
    className: 'ChatType',
    description: '聊天类型（CHAT/SYSTEM/GAME_INFO）',
  },
  {
    package: 'net.minecraft.network.chat',
    className: 'ChatFormatting',
    description: '格式化代码（颜色/粗体/斜体等）',
    fields: [
      { type: 'ChatFormatting', name: 'BLACK', description: '黑色' },
      { type: 'ChatFormatting', name: 'RED', description: '红色' },
      { type: 'ChatFormatting', name: 'GREEN', description: '绿色' },
      { type: 'ChatFormatting', name: 'YELLOW', description: '黄色' },
      { type: 'ChatFormatting', name: 'BLUE', description: '蓝色' },
      { type: 'ChatFormatting', name: 'GOLD', description: '金色' },
      { type: 'ChatFormatting', name: 'GRAY', description: '灰色' },
      { type: 'ChatFormatting', name: 'BOLD', description: '加粗' },
      { type: 'ChatFormatting', name: 'ITALIC', description: '斜体' },
      { type: 'ChatFormatting', name: 'UNDERLINE', description: '下划线' },
      { type: 'ChatFormatting', name: 'RESET', description: '重置' },
    ],
  },
  {
    package: 'net.minecraft.network.chat',
    className: 'ClickEvent',
    description: '点击事件（命令/打开 URL/翻页）',
  },
  {
    package: 'net.minecraft.network.chat',
    className: 'HoverEvent',
    description: '悬浮事件（显示物品/文本/实体）',
  },

  /* === net.minecraft.sounds === */
  {
    package: 'net.minecraft.sounds',
    className: 'SoundEvent',
    description: '声音事件',
    methods: [
      { signature: 'ResourceLocation getLocation()', description: '获取声音 ID' },
      { signature: 'static SoundEvent create(ResourceLocation id)', description: '构造 SoundEvent' },
    ],
  },
  {
    package: 'net.minecraft.sounds',
    className: 'SoundEvents',
    description: '原版声音常量（UI_BUTTON_CLICK/BLOCK_STONE_BREAK 等）',
  },
  {
    package: 'net.minecraft.sounds',
    className: 'SoundSource',
    description: '声音类别（主音量/方块/敌对/中立/玩家/天气/唱片）',
    fields: [
      { type: 'SoundSource', name: 'MASTER', description: '主音量' },
      { type: 'SoundSource', name: 'MUSIC', description: '背景音乐' },
      { type: 'SoundSource', name: 'BLOCKS', description: '方块' },
      { type: 'SoundSource', name: 'HOSTILE', description: '敌对生物' },
      { type: 'SoundSource', name: 'NEUTRAL', description: '中立生物' },
      { type: 'SoundSource', name: 'PLAYERS', description: '玩家' },
      { type: 'SoundSource', name: 'WEATHER', description: '天气' },
      { type: 'SoundSource', name: 'RECORDS', description: '唱片' },
    ],
  },

  /* === net.minecraft.world.effect === */
  {
    package: 'net.minecraft.world.effect',
    className: 'MobEffect',
    description: '药水效果（增益/减益）',
    methods: [
      { signature: 'void applyEffectTick(LivingEntity entity, int amplifier)', description: '每刻触发' },
      { signature: 'boolean isInstantenous()', description: '是否瞬时' },
      { signature: 'boolean isBeneficial()', description: '是否增益' },
    ],
  },
  {
    package: 'net.minecraft.world.effect',
    className: 'MobEffectInstance',
    description: '药水效果实例（持续时长 + 等级）',
    methods: [
      { signature: 'int getDuration()', description: '剩余时长（tick）' },
      { signature: 'int getAmplifier()', description: '等级（0=I，1=II）' },
      { signature: 'MobEffect getEffect()', description: '获取效果类型' },
      { signature: 'boolean update(MobEffectInstance other)', description: '合并更长时长' },
    ],
  },
  {
    package: 'net.minecraft.world.effect',
    className: 'MobEffects',
    description: '原版效果常量',
    fields: [
      { type: 'MobEffect', name: 'MOVEMENT_SPEED', description: '速度' },
      { type: 'MobEffect', name: 'MOVEMENT_SLOWDOWN', description: '缓慢' },
      { type: 'MobEffect', name: 'DIG_SPEED', description: '急迫' },
      { type: 'MobEffect', name: 'DAMAGE_BOOST', description: '力量' },
      { type: 'MobEffect', name: 'HEAL', description: '瞬间治疗' },
      { type: 'MobEffect', name: 'HARM', description: '瞬间伤害' },
      { type: 'MobEffect', name: 'JUMP', description: '跳跃提升' },
      { type: 'MobEffect', name: 'REGENERATION', description: '生命恢复' },
      { type: 'MobEffect', name: 'DAMAGE_RESISTANCE', description: '抗性提升' },
      { type: 'MobEffect', name: 'FIRE_RESISTANCE', description: '抗火' },
      { type: 'MobEffect', name: 'WATER_BREATHING', description: '水下呼吸' },
      { type: 'MobEffect', name: 'NIGHT_VISION', description: '夜视' },
      { type: 'MobEffect', name: 'POISON', description: '中毒' },
      { type: 'MobEffect', name: 'WITHER', description: '凋零' },
    ],
  },

  /* === net.minecraft.world.entity.player === */
  {
    package: 'net.minecraft.world.entity.player',
    className: 'Player',
    description: '玩家基类',
    methods: [
      { signature: 'Inventory getInventory()', description: '获取物品栏' },
      { signature: 'boolean isCreative()', description: '创造模式?' },
      { signature: 'boolean isSpectator()', description: '旁观模式?' },
      { signature: 'void giveExperiencePoints(int amount)', description: '给予经验' },
      { signature: 'int getTotalExperience()', description: '总经验' },
      { signature: 'void setExperiencePoints(int points)', description: '设置经验点' },
      { signature: 'boolean addItem(ItemStack stack)', description: '添加物品到背包' },
      { signature: 'Abilities getAbilities()', description: '获取能力（飞行/无敌等）' },
      { signature: 'GameProfile getGameProfile()', description: '获取玩家档案' },
      { signature: 'void displayClientMessage(Component message, boolean actionbar)', description: '显示消息' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.player',
    className: 'Inventory',
    description: '玩家物品栏（主背包 + 装备 + 副手）',
    methods: [
      { signature: 'ItemStack getSelected()', description: '当前选中物品' },
      { signature: 'void setSelected(int slot)', description: '设置选中槽' },
      { signature: 'int getFreeSlot()', description: '第一个空槽' },
      { signature: 'boolean add(ItemStack stack)', description: '添加物品' },
      { signature: 'ItemStack getItem(int slot)', description: '获取某槽物品' },
      { signature: 'void setItem(int slot, ItemStack stack)', description: '设置某槽物品' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.player',
    className: 'Abilities',
    description: '玩家能力',
    fields: [
      { type: 'boolean', name: 'invulnerable', description: '无敌' },
      { type: 'boolean', name: 'flying', description: '飞行中' },
      { type: 'boolean', name: 'mayfly', description: '允许飞行' },
      { type: 'boolean', name: 'instabuild', description: '瞬间破坏' },
      { type: 'float', name: 'flyingSpeed', description: '飞行速度' },
      { type: 'float', name: 'walkingSpeed', description: '行走速度' },
    ],
  },

  /* === net.minecraft.world.food === */
  {
    package: 'net.minecraft.world.food',
    className: 'FoodProperties',
    description: '食物属性（饥饿值 + 饱和度 + 效果）',
    methods: [
      { signature: 'int getNutrition()', description: '饥饿值（鸡腿图标）' },
      { signature: 'float getSaturationModifier()', description: '饱和度修正' },
      { signature: 'boolean canAlwaysEat()', description: '是否可永远吃（紫颂果）' },
    ],
  },
  {
    package: 'net.minecraft.world.food',
    className: 'FoodProperties.Builder',
    description: '食物构建器',
    methods: [
      { signature: 'Builder nutrition(int amount)', description: '饥饿值' },
      { signature: 'Builder saturationMod(float mod)', description: '饱和度' },
      { signature: 'Builder effect(MobEffectInstance effect, float probability)', description: '附加效果' },
      { signature: 'Builder alwaysEat()', description: '可永远吃' },
      { signature: 'Builder meat()', description: '肉食（可喂狗）' },
      { signature: 'Builder fast()', description: '快速食用' },
    ],
  },

  /* === net.minecraft.world.inventory === */
  {
    package: 'net.minecraft.world.inventory',
    className: 'AbstractContainerMenu',
    description: '容器菜单基类（物品栏 GUI 同步）',
    methods: [
      { signature: 'boolean stillValid(Player player)', description: '是否可继续使用' },
      { signature: 'ItemStack quickMoveStack(Player player, int index)', description: 'Shift 点击移动' },
      { signature: 'void broadcastChanges()', description: '同步变化' },
    ],
  },
  {
    package: 'net.minecraft.world.inventory',
    className: 'MenuType',
    description: '菜单类型注册项',
  },
  {
    package: 'net.minecraft.world.inventory',
    className: 'MenuProvider',
    description: '菜单提供者接口',
  },
  {
    package: 'net.minecraft.world.inventory',
    className: 'SimpleContainerProvider',
    description: '简单菜单提供者',
  },
  {
    package: 'net.minecraft.world.inventory',
    className: 'ContainerData',
    description: '容器同步数据（如熔炉烧制进度）',
  },
  {
    package: 'net.minecraft.world.inventory',
    className: 'Container',
    description: '容器接口',
  },
  {
    package: 'net.minecraft.world.inventory',
    className: 'SimpleContainer',
    description: '简单容器实现',
  },

  /* === net.minecraft.world.entity.projectile === */
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'Projectile',
    description: '投射物基类（箭/雪球/末影珍珠等）',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'AbstractArrow',
    description: '箭类基类（普通箭/光灵箭/三叉戟）',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'Arrow',
    description: '普通箭（可带药水效果）',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'ThrownTrident',
    description: '三叉戟（可回收）',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'FireworkRocketEntity',
    description: '烟花火箭',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'Snowball',
    description: '雪球',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'EnderPearl',
    description: '末影珍珠',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'ThrowableProjectile',
    description: '可抛掷投射物基类',
  },

  /* === net.minecraft.world.level.chunk === */
  {
    package: 'net.minecraft.world.level.chunk',
    className: 'ChunkAccess',
    description: '区块访问基类',
  },
  {
    package: 'net.minecraft.world.level.chunk',
    className: 'LevelChunk',
    description: '已加载的完整区块',
  },
  {
    package: 'net.minecraft.world.level.chunk',
    className: 'ChunkStatus',
    description: '区块生成阶段',
  },
  {
    package: 'net.minecraft.world.level.chunk',
    className: 'ChunkPos',
    description: '区块坐标',
  },
  {
    package: 'net.minecraft.world.level.chunk',
    className: 'ChunkGenerator',
    description: '区块生成器（地形/结构）',
  },

  /* === net.minecraft.world.level.levelgen === */
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'Feature',
    description: '地形特性（树/矿/湖等）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'FeaturePlaceContext',
    description: '特性放置上下文',
  },
  {
    package: 'net.minecraft.world.level.levelgen',
    className: 'GenerationStep',
    description: '生成步骤（地表/地下结构/装饰）',
  },
  {
    package: 'net.minecraft.world.level.levelgen',
    className: 'Heightmap',
    description: '高度图（最高方块）',
  },

  /* === net.minecraft.server.level === */
  {
    package: 'net.minecraft.server.level',
    className: 'ServerPlayer',
    description: '服务端玩家实例',
    methods: [
      { signature: 'void sendSystemMessage(Component message)', description: '发送系统消息' },
      { signature: 'void teleportTo(ServerLevel level, double x, double y, double z, float yaw, float pitch)', description: '跨维度传送' },
      { signature: 'void setExperiencePoints(int points)', description: '设置经验点' },
      { signature: 'ServerLevel serverLevel()', description: '获取所在世界' },
      { signature: 'void displayClientMessage(Component message, boolean actionbar)', description: '显示消息' },
    ],
  },
  {
    package: 'net.minecraft.server.level',
    className: 'ServerChunkCache',
    description: '服务端区块缓存',
  },
  {
    package: 'net.minecraft.server',
    className: 'MinecraftServer',
    description: '服务端主类',
    methods: [
      { signature: 'void sendSystemMessage(Component msg)', description: '广播消息' },
      { signature: 'Iterable<ServerLevel> getAllLevels()', description: '所有世界' },
      { signature: 'int getTickCount()', description: '当前 tick' },
    ],
  },

  /* === net.minecraftforge.event === */
  {
    package: 'net.minecraftforge.event',
    className: 'Event',
    description: 'Forge 事件基类',
    methods: [
      { signature: 'boolean isCancelable()', description: '是否可取消' },
      { signature: 'boolean isCanceled()', description: '是否已取消' },
      { signature: 'void setCanceled(boolean canceled)', description: '设置取消' },
      { signature: 'Event.Result getResult()', description: '获取结果（DEFAULT/ALLOW/DENY）' },
    ],
  },
  {
    package: 'net.minecraftforge.event',
    className: 'TickEvent',
    description: 'Tick 事件基类（Server/Client/Level/Player）',
  },
  {
    package: 'net.minecraftforge.event.entity.player',
    className: 'PlayerInteractEvent',
    description: '玩家交互事件基类',
  },
  {
    package: 'net.minecraftforge.event.entity.player',
    className: 'PlayerInteractEvent.RightClickBlock',
    description: '右键方块',
  },
  {
    package: 'net.minecraftforge.event.entity.player',
    className: 'PlayerInteractEvent.RightClickItem',
    description: '右键物品（空气）',
  },
  {
    package: 'net.minecraftforge.event.entity.player',
    className: 'PlayerInteractEvent.LeftClickBlock',
    description: '左键方块',
  },
  {
    package: 'net.minecraftforge.event.level',
    className: 'BlockEvent',
    description: '方块事件基类',
  },
  {
    package: 'net.minecraftforge.event.level',
    className: 'BlockEvent.BreakBlock',
    description: '方块被破坏',
  },
  {
    package: 'net.minecraftforge.event.level',
    className: 'BlockEvent.PlaceBlock',
    description: '方块被放置',
  },
  {
    package: 'net.minecraftforge.event.entity',
    className: 'EntityEvent',
    description: '实体事件基类',
  },
  {
    package: 'net.minecraftforge.event.entity',
    className: 'EntityJoinLevelEvent',
    description: '实体加入世界',
  },
  {
    package: 'net.minecraftforge.event.entity.player',
    className: 'PlayerEvent',
    description: '玩家事件基类',
  },
  {
    package: 'net.minecraftforge.event.entity.living',
    className: 'LivingEvent',
    description: '生物事件基类',
  },
  {
    package: 'net.minecraftforge.event.entity.living',
    className: 'LivingDeathEvent',
    description: '生物死亡',
  },
  {
    package: 'net.minecraftforge.event.entity.living',
    className: 'LivingHurtEvent',
    description: '生物受伤',
  },
  {
    package: 'net.minecraftforge.event.entity.living',
    className: 'LivingAttackEvent',
    description: '生物被攻击',
  },
  {
    package: 'net.minecraftforge.event.entity.living',
    className: 'LivingDamageEvent',
    description: '生物伤害结算',
  },
  {
    package: 'net.minecraftforge.event.entity.player',
    className: 'PlayerXpEvent',
    description: '玩家经验事件',
  },
  {
    package: 'net.minecraftforge.event.entity.item',
    className: 'ItemTossEvent',
    description: '玩家丢弃物品',
  },
  {
    package: 'net.minecraftforge.event',
    className: 'TickEvent.ServerTickEvent',
    description: '服务端 Tick（Pre/Phase/Post）',
  },
  {
    package: 'net.minecraftforge.event',
    className: 'TickEvent.ClientTickEvent',
    description: '客户端 Tick',
  },
  {
    package: 'net.minecraftforge.event',
    className: 'TickEvent.LevelTickEvent',
    description: '世界 Tick',
  },
  {
    package: 'net.minecraftforge.event.entity.living',
    className: 'LivingSpawnEvent',
    description: '生物生成事件',
  },

  /* === net.minecraftforge.eventbus.api === */
  {
    package: 'net.minecraftforge.eventbus.api',
    className: 'IEventBus',
    description: '事件总线接口',
    methods: [
      { signature: '<T extends Event> void addListener(Consumer<T> consumer)', description: '注册监听' },
      { signature: '<T extends Event> void addListener(EventPriority priority, Consumer<T> consumer)', description: '指定优先级' },
      { signature: '<T extends Event> void addListener(EventPriority priority, boolean receiveCanceled, Consumer<T> consumer)', description: '指定优先级 + 接收已取消' },
      { signature: 'void post(Event event)', description: '派发事件' },
      { signature: 'boolean post(Event event, IEventBusEventDispatchPredicate predicate)', description: '条件派发' },
    ],
  },
  {
    package: 'net.minecraftforge.eventbus.api',
    className: 'EventBus',
    description: '事件总线实现',
  },
  {
    package: 'net.minecraftforge.eventbus.api',
    className: 'SubscribeEvent',
    description: '订阅事件注解（静态方法）',
  },
  {
    package: 'net.minecraftforge.eventbus.api',
    className: 'EventPriority',
    description: '事件优先级',
    fields: [
      { type: 'EventPriority', name: 'HIGHEST', description: '最高（最先）' },
      { type: 'EventPriority', name: 'HIGH', description: '高' },
      { type: 'EventPriority', name: 'NORMAL', description: '普通（默认）' },
      { type: 'EventPriority', name: 'LOW', description: '低' },
      { type: 'EventPriority', name: 'LOWEST', description: '最低（最后）' },
    ],
  },
  {
    package: 'net.minecraftforge.eventbus.api',
    className: 'Cancelable',
    description: '标记事件可取消',
  },

  /* === net.minecraftforge.fml.common === */
  {
    package: 'net.minecraftforge.fml.common',
    className: 'Mod',
    description: 'Mod 声明注解（modid/name/version）',
    fields: [
      { type: 'String', name: 'value', description: 'mod id（必须小写）' },
    ],
  },
  {
    package: 'net.minecraftforge.fml.javafmlmod',
    className: 'FMLJavaModLoadingContext',
    description: 'JavaFML 加载上下文（获取 Mod 事件总线）',
    methods: [
      { signature: 'IEventBus getModEventBus()', description: '获取 Mod 事件总线' },
    ],
  },
  {
    package: 'net.minecraftforge.fml',
    className: 'ModContainer',
    description: 'Mod 容器（含元数据 + 实例）',
  },
  {
    package: 'net.minecraftforge.fml',
    className: 'ModLoader',
    description: 'Mod 加载器',
  },
  {
    package: 'net.minecraftforge.fml.event.lifecycle',
    className: 'FMLCommonSetupEvent',
    description: '通用初始化（无论客户端/服务端）',
  },
  {
    package: 'net.minecraftforge.fml.event.lifecycle',
    className: 'FMLClientSetupEvent',
    description: '客户端初始化（仅客户端）',
  },
  {
    package: 'net.minecraftforge.fml.event.lifecycle',
    className: 'FMLDedicatedServerSetupEvent',
    description: '专用服务端初始化',
  },
  {
    package: 'net.minecraftforge.fml.event.lifecycle',
    className: 'InterModEnqueueEvent',
    description: '跨 Mod 通信发送阶段',
  },
  {
    package: 'net.minecraftforge.fml.event.lifecycle',
    className: 'InterModProcessEvent',
    description: '跨 Mod 通信处理阶段',
  },

  /* === net.minecraftforge.registries === */
  {
    package: 'net.minecraftforge.registries',
    className: 'DeferredRegister',
    description: '延迟注册器（统一管理一类注册项）',
    methods: [
      { signature: 'static <T> DeferredRegister<T> create(ResourceKey<Registry<T>> key, String modid)', description: '创建' },
      { signature: '<I extends T> RegistryObject<I> register(String name, Supplier<I> supplier)', description: '注册一项' },
      { signature: 'void register(IEventBus bus)', description: '绑定到 Mod 事件总线' },
      { signature: 'Collection<RegistryObject<T>> getEntries()', description: '获取全部注册项' },
    ],
  },
  {
    package: 'net.minecraftforge.registries',
    className: 'RegistryObject',
    description: '注册项持有者（首次访问时解析）',
    methods: [
      { signature: 'T get()', description: '获取实际对象（已注册后）' },
      { signature: 'ResourceLocation getId()', description: '获取注册 ID' },
      { signature: 'boolean isPresent()', description: '是否已注册' },
    ],
  },
  {
    package: 'net.minecraftforge.registries',
    className: 'ForgeRegistries',
    description: 'Forge 注册表常量集合',
    fields: [
      { type: 'IForgeRegistry<Block>', name: 'BLOCKS', description: '方块' },
      { type: 'IForgeRegistry<Item>', name: 'ITEMS', description: '物品' },
      { type: 'IForgeRegistry<EntityType<?>>', name: 'ENTITY_TYPES', description: '实体类型' },
      { type: 'IForgeRegistry<SoundEvent>', name: 'SOUND_EVENTS', description: '声音事件' },
      { type: 'IForgeRegistry<MobEffect>', name: 'MOB_EFFECTS', description: '药水效果' },
      { type: 'IForgeRegistry<ParticleType<?>>', name: 'PARTICLE_TYPES', description: '粒子类型' },
    ],
  },
  {
    package: 'net.minecraftforge.registries',
    className: 'IForgeRegistry',
    description: 'Forge 注册表接口',
  },
  {
    package: 'net.minecraftforge.registries',
    className: 'RegisterEvent',
    description: '注册事件（按类型分发）',
    methods: [
      { signature: '<T> void register(ResourceKey<Registry<T>> key, ResourceLocation name, Supplier<T> value)', description: '注册一项' },
    ],
  },
  {
    package: 'net.minecraftforge.registries',
    className: 'IForgeRegistryEntry',
    description: '可注册项接口（设置 Registry ID）',
  },
  {
    package: 'net.minecraftforge.registries',
    className: 'NewRegistryEvent',
    description: '自定义注册表创建事件',
  },

  /* === net.minecraftforge.network === */
  {
    package: 'net.minecraftforge.network',
    className: 'PacketDistributor',
    description: '网络包分发器（按目标群体发送）',
    methods: [
      { signature: 'PacketDistributor<Player> playerWith(Supplier<Player> player)', description: '发往指定玩家' },
      { signature: 'PacketDistributor<List<Connection>> toAll()', description: '发往所有' },
      { signature: 'PacketDistributor<List<Connection>> trackingEntity(Entity entity)', description: '追踪某实体' },
      { signature: 'PacketDistributor<List<Connection>> trackingChunk(LevelChunk chunk)', description: '追踪某区块' },
      { signature: '<MSG> void send(MSG message, BiConsumer<MSG, FriendlyByteBuf> encoder)', description: '实际发送' },
    ],
  },
  {
    package: 'net.minecraftforge.network',
    className: 'SimpleChannel',
    description: '简单网络通道（注册包 + 编解码）',
    methods: [
      { signature: '<MSG> int registerMessage(int id, Class<MSG> msg, BiConsumer<MSG, FriendlyByteBuf> encoder, Function<FriendlyByteBuf, MSG> decoder, BiConsumer<MSG, Supplier<Context>> handler)', description: '注册消息' },
      { signature: '<MSG> void send(PacketDistributor<MSG> target, MSG message)', description: '发送' },
      { signature: '<MSG> void sendToServer(MSG message)', description: '发往服务端（客户端→服务端）' },
    ],
  },
  {
    package: 'net.minecraftforge.network',
    className: 'NetworkRegistry',
    description: '网络通道注册表',
    methods: [
      { signature: 'static SimpleChannel newSimpleChannel(ResourceLocation name, ChannelBuilder.Negotiator version)', description: '创建简单通道' },
      { signature: 'static SimpleChannel.ChannelBuilder newChannel(ResourceLocation name, String... versions)', description: 'Builder 模式' },
    ],
  },
  {
    package: 'net.minecraftforge.network',
    className: 'NetworkEvent.Context',
    description: '网络事件上下文（发送方/方向/包调度）',
    methods: [
      { signature: 'NetworkDirection getDirection()', description: '获取方向' },
      { signature: 'ServerPlayer getSender()', description: '发送方玩家' },
      { signature: 'void enqueueWork(Runnable work)', description: '加入主线程队列' },
      { signature: 'void setPacketHandled(boolean handled)', description: '标记已处理' },
    ],
  },
  {
    package: 'net.minecraftforge.network',
    className: 'NetworkEvent',
    description: '网络事件基类',
  },
  {
    package: 'network',
    className: 'NetworkDirection',
    description: '网络方向（PLAY_TO_CLIENT/PLAY_TO_SERVER/LOGIN_TO_CLIENT/LOGIN_TO_SERVER）',
  },
  {
    package: 'net.minecraftforge.network',
    className: 'NetworkHooks',
    description: '网络工具（GUI 打开等）',
    methods: [
      { signature: 'static void openScreen(ServerPlayer player, MenuProvider provider, BlockPos pos)', description: '服务端打开 GUI' },
    ],
  },

  /* === net.minecraftforge.api.distmarker === */
  {
    package: 'net.minecraftforge.api.distmarker',
    className: 'Dist',
    description: '运行环境（CLIENT/DEDICATED_SERVER）',
    fields: [
      { type: 'Dist', name: 'CLIENT', description: '客户端（含渲染）' },
      { type: 'Dist', name: 'DEDICATED_SERVER', description: '专用服务端（无渲染）' },
    ],
  },
  {
    package: 'net.minecraftforge.api.distmarker',
    className: 'OnlyIn',
    description: '标记仅在某环境加载（客户端渲染常用）',
  },
  {
    package: 'net.minecraftforge.api.distmarker',
    className: 'DistExecutor',
    description: '按环境执行（安全调用客户端类）',
    methods: [
      { signature: 'static <T> void safeRunWhenOn(Dist dist, Supplier<SafeRunnable> toRun)', description: '仅在某环境运行' },
      { signature: 'static <T> T safeRunForDist(Supplier<SafeSupplier<T>> client, Supplier<SafeSupplier<T>> server)', description: '按环境返回不同值' },
    ],
  },

  /* === net.minecraftforge.common === */
  {
    package: 'net.minecraftforge.common',
    className: 'ForgeConfigSpec',
    description: 'Forge 配置规格（客户端/通用/服务端）',
    methods: [
      { signature: 'Builder push(String path)', description: '推入分组' },
      { signature: 'Builder pop()', description: '弹出分组' },
      { signature: 'ConfigValue<Integer> defineInRange(String path, int def, int min, int max)', description: '整数范围' },
      { signature: 'ConfigValue<Boolean> define(String path, boolean def)', description: '布尔' },
      { signature: 'ConfigValue<String> define(String path, String def)', description: '字符串' },
    ],
  },
  {
    package: 'net.minecraftforge.common',
    className: 'MinecraftForge',
    description: 'Forge 入口常量',
    fields: [
      { type: 'IEventBus', name: 'EVENT_BUS', description: 'Forge 事件总线（游戏事件）' },
    ],
  },
  {
    package: 'net.minecraftforge.common',
    className: 'ForgeConfig',
    description: 'Forge 内置配置',
  },
  {
    package: 'net.minecraftforge.common',
    className: 'ForgeHooks',
    description: 'Forge 工具方法',
  },
  {
    package: 'net.minecraftforge.common',
    className: 'Tags',
    description: 'Forge 标签常量（Blocks/Items/Fluids/EntityTypes）',
  },
  {
    package: 'net.minecraftforge.common',
    className: 'TierSortingRegistry',
    description: '工具等级排序',
  },
  {
    package: 'net.minecraftforge.common',
    className: 'PlantType',
    description: '植物类型（骨头粉催熟）',
  },
  {
    package: 'net.minecraftforge.common.extensions',
    className: 'IForgeBlock',
    description: 'Block 扩展接口（Forge 添加方法）',
  },
  {
    package: 'net.minecraftforge.common.extensions',
    className: 'IForgeItem',
    description: 'Item 扩展接口（Forge 添加方法）',
  },
  {
    package: 'net.minecraftforge.common.extensions',
    className: 'IForgeEntity',
    description: 'Entity 扩展接口（Forge 添加方法）',
  },
  {
    package: 'net.minecraftforge.common.util',
    className: 'LazyOptional',
    description: '懒加载 Optional（能力系统）',
    methods: [
      { signature: 'Optional<T> resolve()', description: '解析为 Optional' },
      { signature: '<X> LazyOptional<X> map(Function<T, X> mapper)', description: '映射' },
      { signature: 'void addListener(Consumer<LazyOptional<T>> listener)', description: '失效回调' },
    ],
  },

  /* === net.minecraftforge.client === */
  {
    package: 'net.minecraftforge.client',
    className: 'ForgeHooksClient',
    description: '客户端工具（渲染/模型）',
  },
  {
    package: 'net.minecraftforge.client',
    className: 'ClientRegistry',
    description: '客户端注册（按键绑定/TESR）',
  },
  {
    package: 'net.minecraftforge.client.event',
    className: 'RenderLevelStageEvent',
    description: '世界渲染阶段事件',
  },
  {
    package: 'net.minecraftforge.client.event',
    className: 'RenderGuiEvent',
    description: 'HUD 渲染事件',
  },
  {
    package: 'net.minecraftforge.client.event',
    className: 'InputEvent',
    description: '输入事件（鼠标/键盘）',
  },
  {
    package: 'net.minecraftforge.client.event',
    className: 'ColorHandlerEvent',
    description: '颜色注册事件',
  },
  {
    package: 'net.minecraftforge.client.event',
    className: 'ModelRegistryEvent',
    description: '模型注册事件',
  },

  /* === net.minecraft.world.damagesource === */
  {
    package: 'net.minecraft.world.damagesource',
    className: 'DamageSource',
    description: '伤害来源（玩家/怪物/坠落/岩浆等）',
    methods: [
      { signature: 'Entity getEntity()', description: '伤害实体' },
      { signature: 'boolean isProjectile()', description: '是否远程' },
      { signature: 'boolean isExplosion()', description: '是否爆炸' },
      { signature: 'boolean isFire()', description: '是否火焰' },
      { signature: 'boolean isMagic()', description: '是否魔法' },
      { signature: 'boolean isFall()', description: '是否坠落' },
    ],
  },
  {
    package: 'net.minecraft.world.damagesource',
    className: 'DamageSources',
    description: '伤害源工厂（1.20 引入）',
    methods: [
      { signature: 'DamageSource playerAttack(Player player)', description: '玩家攻击' },
      { signature: 'DamageSource mobAttack(LivingEntity entity)', description: '怪物攻击' },
      { signature: 'DamageSource fall()', description: '坠落' },
      { signature: 'DamageSource lava()', description: '岩浆' },
      { signature: 'DamageSource drown()', description: '溺水' },
      { signature: 'DamageSource outOfWorld()', description: '虚空' },
    ],
  },
  {
    package: 'net.minecraft.world.damagesource',
    className: 'DamageType',
    description: '伤害类型（数据驱动）',
  },

  /* === net.minecraft.world.level.block.entity === */
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'BlockEntity',
    description: '方块实体（带 NBT 的复杂方块数据）',
    methods: [
      { signature: 'void load(CompoundTag tag)', description: '从 NBT 读取' },
      { signature: 'void save(CompoundTag tag)', description: '写入 NBT' },
      { signature: 'BlockPos getBlockPos()', description: '获取位置' },
      { signature: 'Level getLevel()', description: '获取世界' },
      { signature: 'void setChanged()', description: '标记变更（触发保存）' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'BlockEntityType',
    description: 'BlockEntity 类型注册项',
    methods: [
      { signature: 'static <T extends BlockEntity> BlockEntityType.Builder<T> of(BlockEntityType.BlockEntitySupplier<T> factory, Block... blocks)', description: 'Builder' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'ChestBlockEntity',
    description: '箱子 BlockEntity',
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'FurnaceBlockEntity',
    description: '熔炉 BlockEntity',
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'SignBlockEntity',
    description: '告示牌 BlockEntity',
  },

  /* === net.minecraft.client === */
  {
    package: 'net.minecraft.client',
    className: 'Minecraft',
    description: '客户端主类（仅客户端）',
    fields: [
      { type: 'Player', name: 'player', description: '本地玩家' },
      { type: 'Level', name: 'level', description: '本地世界' },
      { type: 'Options', name: 'options', description: '游戏设置' },
    ],
    methods: [
      { signature: 'void setScreen(Screen screen)', description: '打开 GUI' },
      { signature: 'Window getWindow()', description: '获取窗口' },
    ],
  },
  {
    package: 'net.minecraft.client',
    className: 'Options',
    description: '游戏选项',
  },

  /* === net.minecraft.client.gui === */
  {
    package: 'net.minecraft.client.gui',
    className: 'Screen',
    description: 'GUI 屏幕基类',
    methods: [
      { signature: 'void render(GuiGraphics graphics, int mouseX, int mouseY, float partial)', description: '渲染' },
      { signature: 'void init()', description: '初始化（添加组件）' },
      { signature: 'boolean isPauseScreen()', description: '是否暂停游戏' },
    ],
  },
  {
    package: 'net.minecraft.client.gui',
    className: 'GuiGraphics',
    description: 'GUI 绘制工具（1.20 引入）',
    methods: [
      { signature: 'void drawString(Font font, Component text, int x, int y, int color)', description: '绘制文本' },
      { signature: 'void blit(ResourceLocation texture, int x, int y, int u, int v, int w, int h)', description: '绘制贴图' },
      { signature: 'void fill(int x1, int y1, int x2, int y2, int color)', description: '填充矩形' },
    ],
  },

  /* === net.minecraft.client.renderer === */
  {
    package: 'net.minecraft.client.renderer',
    className: 'BlockEntityWithoutLevelRenderer',
    description: '物品渲染器（含 BlockEntity 模型）',
  },
  {
    package: 'net.minecraft.client.renderer',
    className: 'ItemBlockRenderTypes',
    description: '物品渲染类型注册',
  },
  {
    package: 'net.minecraft.client.renderer',
    className: 'RenderType',
    description: '渲染类型（solid/cutout/translucent）',
  },
  {
    package: 'net.minecraft.client.renderer.block',
    className: 'BlockRenderDispatcher',
    description: '方块渲染调度器',
  },
  {
    package: 'net.minecraft.client.renderer.blockentity',
    className: 'BlockEntityRenderer',
    description: 'BlockEntity 渲染器接口',
  },

  /* === net.minecraft.client.particle === */
  {
    package: 'net.minecraft.client.particle',
    className: 'ParticleEngine',
    description: '粒子引擎',
  },
  {
    package: 'net.minecraft.core.particles',
    className: 'ParticleOptions',
    description: '粒子选项',
  },
  {
    package: 'net.minecraft.core.particles',
    className: 'ParticleTypes',
    description: '原版粒子常量',
  },

  /* === 杂项 === */
  {
    package: 'net.minecraft.util',
    className: 'RandomSource',
    description: '随机数源',
    methods: [
      { signature: 'int nextInt(int bound)', description: '0 到 bound-1' },
      { signature: 'float nextFloat()', description: '0.0 到 1.0' },
      { signature: 'double nextDouble()', description: '0.0 到 1.0' },
      { signature: 'boolean nextBoolean()', description: '随机布尔' },
      { signature: 'static RandomSource create()', description: '创建实例' },
    ],
  },
  {
    package: 'net.minecraft.util',
    className: 'Mth',
    description: '数学工具',
    methods: [
      { signature: 'static float clamp(float v, float min, float max)', description: '夹紧' },
      { signature: 'static int floor(double v)', description: '向下取整' },
      { signature: 'static int ceil(double v)', description: '向上取整' },
      { signature: 'static float lerp(float t, float a, float b)', description: '线性插值' },
      { signature: 'static float sin(float rad)', description: '正弦' },
      { signature: 'static float cos(float rad)', description: '余弦' },
    ],
  },
  {
    package: 'net.minecraft.world.item.context',
    className: 'BlockPlaceContext',
    description: '方块放置上下文',
  },
  {
    package: 'net.minecraft.world.entity.ai.navigation',
    className: 'PathNavigation',
    description: '寻路导航',
    methods: [
      { signature: 'boolean moveTo(double x, double y, double z, double speed)', description: '移动到坐标' },
      { signature: 'boolean moveTo(Entity entity, double speed)', description: '跟随实体' },
      { signature: 'boolean isDone()', description: '是否到达' },
    ],
  },
  {
    package: 'net.minecraft.world.level.pathfinder',
    className: 'Path',
    description: '寻路路径',
  },
  {
    package: 'net.minecraft.commands',
    className: 'CommandSourceStack',
    description: '命令源（玩家/命令方块/控制台）',
  },
  {
    package: 'net.minecraft.commands',
    className: 'Commands',
    description: '命令注册器',
  },
  {
    package: 'net.minecraft.world.level.storage',
    className: 'loot.LootTable',
    description: '战利品表',
  },
  {
    package: 'net.minecraft.advancements',
    className: 'CriterionTrigger',
    description: '进度触发器',
  },
  {
    package: 'net.minecraft.tags',
    className: 'BlockTags',
    description: '原版方块标签',
  },
  {
    package: 'net.minecraft.tags',
    className: 'ItemTags',
    description: '原版物品标签',
  },
  {
    package: 'net.minecraft.tags',
    className: 'EntityTypeTags',
    description: '原版实体标签',
  },
  {
    package: 'net.minecraft.world.level.storage',
    className: 'WorldData',
    description: '世界数据',
  },
  {
    package: 'net.minecraft.world.level',
    className: 'LevelSettings',
    description: '世界设置（种子/模式/规则）',
  },
  {
    package: 'net.minecraft.server.level',
    className: 'ServerPlayerGameMode',
    description: '服务端玩家游戏模式',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Animal',
    description: '被动动物（牛/羊/猪/鸡）',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'WaterAnimal',
    description: '水生动物（鱿鱼/海豚）',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Monster',
    description: '怪物（僵尸/骷髅/蜘蛛）',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Zombie',
    description: '僵尸',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Skeleton',
    description: '骷髅',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Creeper',
    description: '苦力怕（爆炸）',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Cow',
    description: '牛',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Pig',
    description: '猪',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Chicken',
    description: '鸡',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Sheep',
    description: '羊（可染色）',
  },
  {
    package: 'net.minecraft.world.entity.animal.horse',
    className: 'AbstractHorse',
    description: '马类基类',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Wolf',
    description: '狼（可驯服）',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Cat',
    description: '猫（可驯服）',
  },
  {
    package: 'net.minecraft.world.entity.boss.enderdragon',
    className: 'EnderDragon',
    description: '末影龙',
  },
  {
    package: 'net.minecraft.world.entity.boss.wither',
    className: 'WitherBoss',
    description: '凋灵',
  },
  {
    package: 'net.minecraft.world.entity.vehicle',
    className: 'AbstractMinecart',
    description: '矿车基类',
  },
  {
    package: 'net.minecraft.world.entity.vehicle',
    className: 'Boat',
    description: '船',
  },
  {
    package: 'net.minecraft.world.entity.decoration',
    className: 'ArmorStand',
    description: '盔甲架',
  },
  {
    package: 'net.minecraft.world.entity.item',
    className: 'ItemEntity',
    description: '掉落物实体',
  },
  {
    package: 'net.minecraft.world.entity.experience',
    className: 'ExperienceOrb',
    description: '经验球',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'Fireball',
    description: '火球（恶魂/烈焰人）',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'SmallFireball',
    description: '小火球',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'LargeFireball',
    description: '大火球',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'WitherSkull',
    description: '凋灵之首',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'DragonFireball',
    description: '末影龙火球',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'LlamaSpit',
    description: '羊驼唾沫',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'ShulkerBullet',
    description: '潜影贝子弹',
  },
  {
    package: 'net.minecraft.world.entity.ambient',
    className: 'Bat',
    description: '蝙蝠',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Bee',
    description: '蜜蜂',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Fox',
    description: '狐狸',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Panda',
    description: '熊猫',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'PolarBear',
    description: '北极熊',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Rabbit',
    description: '兔子',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Turtle',
    description: '海龟',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Ocelot',
    description: '豹猫',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Parrot',
    description: '鹦鹉（可驯服）',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'EnderMan',
    description: '末影人',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Endermite',
    description: '末影螨',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Silverfish',
    description: '蠹虫',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Slime',
    description: '史莱姆',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Spider',
    description: '蜘蛛',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Witch',
    description: '女巫',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Blaze',
    description: '烈焰人',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Ghast',
    description: '恶魂',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'MagmaCube',
    description: '岩浆怪',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Piglin',
    description: '猪灵',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Hoglin',
    description: '疣猪兽',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Zoglin',
    description: '僵尸疣猪兽',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Phantom',
    description: '幻翼',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Pillager',
    description: '掠夺者',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Vindicator',
    description: '卫道士',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Evoker',
    description: '唤魔者',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Vex',
    description: '恼鬼',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Ravager',
    description: '劫掠兽',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Guardian',
    description: '守卫者',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'ElderGuardian',
    description: '远古守卫者',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Shulker',
    description: '潜影贝',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Stray',
    description: '流浪者',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Husk',
    description: '尸壳',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Drowned',
    description: '溺尸',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'WitherSkeleton',
    description: '凋灵骷髅',
  },
  {
    package: 'net.minecraft.world.entity.npc',
    className: 'Villager',
    description: '村民（含职业）',
  },
  {
    package: 'net.minecraft.world.entity.npc',
    className: 'WanderingTrader',
    description: '流浪商人',
  },
  {
    package: 'net.minecraft.world.entity.npc',
    className: 'AbstractVillager',
    description: '村民基类（含流浪商人）',
  },
  {
    package: 'net.minecraft.world.entity.monster.piglin',
    className: 'PiglinBrute',
    description: '猪灵蛮兵',
  },

  /* ================================================================ */
  /* 阶段 8-B 扩展：16 个新领域，180+ 类                              */
  /* ================================================================ */

  /* === 领域 1：net.minecraft.world.entity.animal（21 类） === */
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Horse',
    description: '马（可骑乘、可装备鞍与马铠）',
    methods: [
      { signature: 'boolean isTamed()', description: '是否已被驯服' },
      { signature: 'void setTamed(boolean tamed)', description: '设置驯服状态' },
      { signature: 'int getTemper()', description: '获取脾气值（影响驯服难度）' },
      { signature: 'void setTemper(int temper)', description: '设置脾气值' },
      { signature: 'boolean isEating()', description: '是否正在低头吃草' },
      { signature: 'boolean canWearArmor(ItemStack stack)', description: '能否穿戴指定马铠' },
      { signature: 'boolean wearsArmor()', description: '是否穿着马铠' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Donkey',
    description: '驴（可骑乘、可携带箱子）',
    methods: [
      { signature: 'boolean hasChest()', description: '是否已装备箱子' },
      { signature: 'int getInventoryColumns()', description: '获取库存列数（驴为 5 列）' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Mule',
    description: '骡（驴和马的后代，可携带箱子）',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Llama',
    description: '羊驼（可装备箱子、可吐口水攻击）',
    methods: [
      { signature: 'void doSpitAttack(LivingEntity target)', description: '对目标吐口水' },
      { signature: 'boolean isTraderLlama()', description: '是否为行商羊驼' },
      { signature: 'int getStrength()', description: '获取强度（影响库存大小）' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'TraderLlama',
    description: '行商羊驼（流浪商人伴生）',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Cod',
    description: '鳕鱼（普通鱼群实体）',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Salmon',
    description: '鲑鱼',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Pufferfish',
    description: '河豚（受惊会膨胀并造成中毒）',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'TropicalFish',
    description: '热带鱼（多种颜色变种）',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Squid',
    description: '鱿鱼',
    methods: [
      { signature: 'Vec3 getRotVec()', description: '获取旋转向量' },
      { signature: 'boolean hurt(DamageSource source, float amount)', description: '受到伤害（墨汁喷洒机制）' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'GlowSquid',
    description: '发光鱿鱼（喷洒发光墨汁）',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Dolphin',
    description: '海豚（可带路至沉船、给予玩家海豚的恩惠）',
    methods: [
      { signature: 'void setTargetPos(BlockPos pos)', description: '设置带路目标' },
      { signature: 'BlockPos getTargetPos()', description: '获取带路目标' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Axolotl',
    description: '美西螈（多色变种，攻击其他水生生物，模拟死亡机制）',
    methods: [
      { signature: 'boolean isPlayingDead()', description: '是否在装死' },
      { signature: 'int getVariant()', description: '获取颜色变种' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Goat',
    description: '山羊（可冲撞、可尖叫变种）',
    methods: [
      { signature: 'boolean isScreamingGoat()', description: '是否为尖叫山羊' },
      { signature: 'long getLongJumpCooldown()', description: '获取长跳冷却' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Mooshroom',
    description: '哞菇（蘑菇牛，可用碗取蘑菇煲）',
    methods: [
      { signature: 'Mooshroom.MushroomType getMushroomType()', description: '获取蘑菇类型（红/棕）' },
      { signature: 'void setMushroomType(Mooshroom.MushroomType type)', description: '设置蘑菇类型' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Sniffer',
    description: '嗅探兽（1.20 新增，可挖掘古老种子）',
    methods: [
      { signature: 'void setSniffingTarget(BlockPos pos)', description: '设置嗅探目标坐标' },
      { signature: 'BlockPos getSniffingTarget()', description: '获取嗅探目标' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Allay',
    description: '悦灵（可拾取物品、跟随音符盒）',
    methods: [
      { signature: 'boolean isDancing()', description: '是否正在跳舞' },
      { signature: 'BlockPos getJukeboxPos()', description: '获取音符盒坐标' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Frog',
    description: '青蛙（可吞食小型史莱姆）',
    methods: [
      { signature: 'FrogVariant getVariant()', description: '获取青蛙变种（温带/寒带/热带）' },
      { signature: 'void setVariant(FrogVariant variant)', description: '设置青蛙变种' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Tadpole',
    description: '蝌蚪（青蛙幼体，水生）',
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Camel',
    description: '骆驼（1.20 新增，可骑乘两人、可坐下）',
    methods: [
      { signature: 'boolean isSitting()', description: '是否坐下' },
      { signature: 'void setSitting(boolean sitting)', description: '设置坐下状态' },
      { signature: 'int getDashCooldown()', description: '获取冲刺冷却' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.animal',
    className: 'Strider',
    description: '炽足兽（下界岩浆上行走，可用诡异菌钓竿引导）',
    methods: [
      { signature: 'boolean isSuffocating()', description: '是否在岩浆外窒息' },
      { signature: 'void setSuffocating(boolean suffocating)', description: '设置窒息状态' },
    ],
  },

  /* === 领域 2：net.minecraft.world.entity.monster（14 类） === */
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'CaveSpider',
    description: '洞穴蜘蛛（小型、攻击附带中毒）',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Giant',
    description: '巨人僵尸（无 AI 的传统实体）',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Illusioner',
    description: '幻术师（灾厄村民法师，施放失明与分身）',
    methods: [
      { signature: 'void performRangedAttack(LivingEntity target, float distanceFactor)', description: '远程攻击目标' },
      { signature: 'void applyRaidBuffs(int wave, boolean unused)', description: '应用袭击增益' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'ZombifiedPiglin',
    description: '僵尸猪灵（下界原住民，被攻击会激怒群体）',
    methods: [
      { signature: 'boolean isAngry()', description: '是否处于激怒状态' },
      { signature: 'void setTarget(LivingEntity target)', description: '设置攻击目标（触发群体仇恨）' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Warden',
    description: '监守者（1.19+ 新增，深暗之园 BOSS）',
    methods: [
      { signature: 'int getAngerLevel()', description: '获取愤怒等级（0-149）' },
      { signature: 'void increaseAngerAt(Entity entity)', description: '增加对目标的愤怒' },
      { signature: 'boolean canDisableShield()', description: '是否可破盾（始终 true）' },
      { signature: 'void sonicBoom()', description: '施放音波攻击' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'AbstractSkeleton',
    description: '骷髅基类（Skeleton/Stray/WitherSkeleton 共同父类）',
    methods: [
      { signature: 'boolean isShaking()', description: '是否在颤抖（淋雨受影响）' },
      { signature: 'void performRangedAttack(LivingEntity target, float distanceFactor)', description: '远程攻击' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'AbstractIllager',
    description: '灾厄村民基类（突袭成员共同父类）',
    methods: [
      { signature: 'boolean isCelebrating()', description: '是否在庆祝' },
      { signature: 'void setCelebrating(boolean celebrating)', description: '设置庆祝状态' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'SpellcasterIllager',
    description: '施法灾厄村民基类（Evoker/Illusioner 父类）',
    methods: [
      { signature: 'SpellcasterIllager.IllagerSpell getSpell()', description: '获取当前法术类型' },
      { signature: 'boolean isCastingSpell()', description: '是否在施法' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'Enemy',
    description: '敌对生物接口（标识可主动攻击玩家的实体）',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'CrossbowAttackMob',
    description: '弩攻击接口（灾厄村民、猪灵使用）',
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'RangedAttackMob',
    description: '远程攻击接口（骷髅、女巫等使用）',
    methods: [
      { signature: 'void performRangedAttack(LivingEntity target, float distanceFactor)', description: '执行远程攻击' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'ZombieVillager',
    description: '僵尸村民（可被虚弱+金苹果治愈回村民）',
    methods: [
      { signature: 'int getConversionProgress()', description: '获取治愈进度' },
      { signature: 'boolean isConverting()', description: '是否正在治愈' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.monster',
    className: 'PatrolMonster',
    description: '巡逻怪物基类（掠夺者队长生成）',
    methods: [
      { signature: 'boolean canBeLeader()', description: '是否能成为队长' },
      { signature: 'boolean canJoinPatrol()', description: '是否能加入巡逻队' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.monster.piglin',
    className: 'AbstractPiglin',
    description: '猪灵基类（Piglin/PiglinBrute 父类，处理僵尸化逻辑）',
    methods: [
      { signature: 'boolean isImmuneToZombification()', description: '是否免疫僵尸化' },
      { signature: 'boolean isConverting()', description: '是否正在转化为僵尸猪灵' },
    ],
  },

  /* === 领域 3：net.minecraft.world.entity.npc（4 类） === */
  {
    package: 'net.minecraft.world.entity.npc',
    className: 'VillagerProfession',
    description: '村民职业（无业/武器匠/工具匠/盔甲匠/图书管理员/皮匠/石匠/牧师/农民/渔夫/牧羊人/制箭师/制图师/屠夫）',
    methods: [
      { signature: 'static VillagerProfession byName(String name)', description: '按名称获取职业' },
      { signature: 'String name()', description: '获取职业内部名' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.npc',
    className: 'VillagerType',
    description: '村民类型（按生物群系分类：沙漠/丛林/平原/萨凡纳/雪原/沼泽/针叶林）',
  },
  {
    package: 'net.minecraft.world.entity.npc',
    className: 'VillagerData',
    description: '村民数据容器（包装类型/职业/等级）',
    methods: [
      { signature: 'int level()', description: '获取等级（1=新手,2=学徒,3=老手,4=专家,5=大师）' },
      { signature: 'VillagerProfession profession()', description: '获取职业' },
      { signature: 'VillagerType type()', description: '获取类型' },
      { signature: 'void setProfession(VillagerProfession profession)', description: '设置职业' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.npc',
    className: 'VillagerTrades',
    description: '村民交易列表管理（按职业/等级注册买卖配方）',
    methods: [
      { signature: 'static void trades(VillagerProfession profession, int level, ItemListing[] trades)', description: '注册职业/等级的交易配方' },
    ],
  },

  /* === 领域 4：net.minecraft.world.entity.vehicle（8 类） === */
  {
    package: 'net.minecraft.world.entity.vehicle',
    className: 'MinecartChest',
    description: '运输矿车（带箱子可携带 27 格物品）',
  },
  {
    package: 'net.minecraft.world.entity.vehicle',
    className: 'MinecartCommandBlock',
    description: '命令方块矿车（执行命令）',
  },
  {
    package: 'net.minecraft.world.entity.vehicle',
    className: 'MinecartFurnace',
    description: '动力矿车（烧燃料推动自身，已弃用但保留）',
    methods: [
      { signature: 'boolean hasFuel()', description: '是否还有燃料' },
      { signature: 'void setHasFuel(boolean hasFuel)', description: '设置燃料状态' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.vehicle',
    className: 'MinecartHopper',
    description: '漏斗矿车（可吸取上方物品）',
    methods: [
      { signature: 'boolean isEnabled()', description: '是否启用吸取' },
      { signature: 'void setEnabled(boolean enabled)', description: '设置启用状态' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.vehicle',
    className: 'MinecartSpawner',
    description: '刷怪笼矿车（移动刷怪笼）',
  },
  {
    package: 'net.minecraft.world.entity.vehicle',
    className: 'MinecartTNT',
    description: 'TNT 矿车（碰撞或激活时爆炸）',
    methods: [
      { signature: 'void primeFuse(int fuse)', description: '点燃引信' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.vehicle',
    className: 'ChestBoat',
    description: '运输船（带箱子可携带 27 格物品）',
  },
  {
    package: 'net.minecraft.world.entity.vehicle',
    className: 'Boat.Type',
    description: '船的木材类型枚举（橡木/云杉/白桦/丛林/金合欢/深色橡木/红树/竹子/樱桃）',
  },

  /* === 领域 5：net.minecraft.world.entity.projectile（10 类） === */
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'SpectralArrow',
    description: '光灵箭（命中目标附带发光效果 10 秒）',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'Egg',
    description: '投掷的鸡蛋（命中随机生成小鸡）',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'ExperienceBottle',
    description: '附魔之瓶（命中生成经验球）',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'EyeOfEnder',
    description: '末影之眼（飞向要塞）',
    methods: [
      { signature: 'void signalTo(BlockPos pos)', description: '飞向目标坐标' },
      { signature: 'ItemStack getItem()', description: '获取内部末影之眼物品' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'FishingHook',
    description: '鱼漂（玩家钓鱼时抛出的钩子）',
    methods: [
      { signature: 'int retrieve(ItemStack stack)', description: '收回鱼线，返回钓到鱼的奖励等级' },
      { signature: 'boolean isAlive()', description: '是否在水中' },
      { signature: 'Player getPlayerOwner()', description: '获取所属玩家' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'AbstractHurtingProjectile',
    description: '伤害型投射物基类（火球/凋灵之首/龙息等父类）',
    methods: [
      { signature: 'void setOwner(Entity entity)', description: '设置发射者' },
      { signature: 'double getPower()', description: '获取威力' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'ThrowableItemProjectile',
    description: '投掷物基类（雪球/鸡蛋/末影珍珠/附魔之瓶共同父类）',
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'ProjectileUtil',
    description: '投射物工具类（运动/旋转矩阵计算）',
    methods: [
      { signature: 'static Vec3 getMovementOfShootable(Entity entity, float x, float y, float z, float speed, float divergence)', description: '计算投射物运动向量' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'EvokerFangs',
    description: '唤魔者尖牙（地面突起的攻击实体）',
    methods: [
      { signature: 'void setDamage(float damage)', description: '设置伤害值' },
    ],
  },
  {
    package: 'net.minecraft.world.entity.projectile',
    className: 'AbstractArrow.Pickup',
    description: '箭矢拾取规则枚举（允许拾取/创造模式/不允许拾取）',
  },
  {
    package: 'net.minecraft.world.entity.item',
    className: 'PrimedTnt',
    description: '点燃的 TNT 实体（实际 TNT 实体类名）',
    methods: [
      { signature: 'int getFuse()', description: '获取剩余引信时间（刻）' },
      { signature: 'void setFuse(int fuse)', description: '设置引信时间' },
      { signature: 'LivingEntity getOwner()', description: '获取点燃者' },
    ],
  },

  /* === 领域 6：net.minecraft.world.level.block.entity（25 类） === */
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'BarrelBlockEntity',
    description: '木桶方块实体（27 格物品库存）',
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'ShulkerBoxBlockEntity',
    description: '潜影盒方块实体（27 格物品库存，保留物品不掉落）',
    methods: [
      { signature: 'boolean isClosed()', description: '是否关闭' },
      { signature: 'float getProgress(float partialTicks)', description: '获取开合动画进度（0-1）' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'EnderChestBlockEntity',
    description: '末影箱方块实体（玩家共享库存）',
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'BannerBlockEntity',
    description: '旗帜方块实体（存储图案层数据）',
    methods: [
      { signature: 'ListTag getPatterns()', description: '获取图案层数据' },
      { signature: 'void setPatterns(ListTag patterns)', description: '设置图案层' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'BeaconBlockEntity',
    description: '信标方块实体（提供增益光环）',
    methods: [
      { signature: 'int getLevels()', description: '获取信标等级（0-4）' },
      { signature: 'MobEffect getPrimaryEffect()', description: '获取主效果' },
      { signature: 'void setPrimaryEffect(MobEffect effect)', description: '设置主效果' },
      { signature: 'boolean updateBase(int level, int primary, int secondary)', description: '更新信标效果' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'BrewingStandBlockEntity',
    description: '酿造台方块实体（3 药水槽 + 烈性粉槽 + 材料槽）',
    methods: [
      { signature: 'int getBrewTime()', description: '获取酿造进度（0-400）' },
      { signature: 'int getFuel()', description: '获取燃料数' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'BlastFurnaceBlockEntity',
    description: '高炉方块实体（熔炼速度 2 倍，仅限矿石/金属）',
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'SmokerBlockEntity',
    description: '烟熏炉方块实体（烹饪速度 2 倍，仅限食物）',
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'DispenserBlockEntity',
    description: '发射器方块实体（9 格库存，可发射物品/生成实体）',
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'DropperBlockEntity',
    description: '投掷器方块实体（9 格库存，仅投掷物品）',
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'HopperBlockEntity',
    description: '漏斗方块实体（5 格库存，吸取/推送物品）',
    methods: [
      { signature: 'boolean isOnCustomCooldown()', description: '是否在传输冷却' },
      { signature: 'void setCooldown(int cooldown)', description: '设置传输冷却' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'JukeboxBlockEntity',
    description: '唱片机方块实体（播放音乐唱片）',
    methods: [
      { signature: 'ItemStack getRecord()', description: '获取当前唱片' },
      { signature: 'void setRecord(ItemStack record)', description: '设置唱片' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'NoteBlockEntity',
    description: '音符盒方块实体（存储音符 0-24）',
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'PistonMovingBlockEntity',
    description: '活塞移动方块实体（活塞头推动方块时使用）',
    methods: [
      { signature: 'Direction getMovementDirection()', description: '获取活塞移动方向' },
      { signature: 'float getPartialMove(float partialTicks)', description: '获取部分移动进度' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'EnchantmentTableBlockEntity',
    description: '附魔台方块实体（书页翻动动画）',
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'EndPortalBlockEntity',
    description: '末地传送门方块实体（仅装饰用）',
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'SpawnerBlockEntity',
    description: '刷怪笼方块实体（生成指定实体）',
    methods: [
      { signature: 'int getSpin()', description: '获取旋转刻度' },
      { signature: 'void setNextSpawnData(SpawnData data)', description: '设置下次生成数据' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'CommandBlockBlockEntity',
    description: '命令方块方块实体（执行命令）',
    methods: [
      { signature: 'boolean isAutomatic()', description: '是否自动执行' },
      { signature: 'boolean runCommand(CommandSourceStack source)', description: '执行命令' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'StructureBlockEntity',
    description: '结构方块方块实体（保存/加载结构）',
    methods: [
      { signature: 'boolean saveStructure(boolean showToast)', description: '保存结构' },
      { signature: 'boolean loadStructure(boolean showToast)', description: '加载结构' },
      { signature: 'void setMode(StructureMode mode)', description: '设置模式（保存/加载/数据/角落）' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'SkullBlockEntity',
    description: '头颅方块实体（可显示玩家头）',
    methods: [
      { signature: 'GameProfile getOwnerProfile()', description: '获取头颅所属玩家' },
      { signature: 'void setOwner(GameProfile profile)', description: '设置头颅所属玩家' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'BedBlockEntity',
    description: '床方块实体（存储颜色）',
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'BellBlockEntity',
    description: '钟方块实体（响铃效果）',
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'CampfireBlockEntity',
    description: '营火方块实体（4 槽烹饪）',
    methods: [
      { signature: 'ItemStack getItem(int slot)', description: '获取指定槽物品' },
      { signature: 'int getCookingProgress(int slot)', description: '获取烹饪进度' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'LecternBlockEntity',
    description: '讲台方块实体（放置书/翻页）',
    methods: [
      { signature: 'ItemStack getBook()', description: '获取书' },
      { signature: 'int getPage()', description: '获取当前页码' },
      { signature: 'void setPage(int page)', description: '设置当前页码' },
    ],
  },
  {
    package: 'net.minecraft.world.level.block.entity',
    className: 'ConduitBlockEntity',
    description: '潮涌核心方块实体（水下提供呼吸与伤害附近敌对生物）',
  },

  /* === 领域 7：net.minecraft.world.level.storage（6 类） === */
  {
    package: 'net.minecraft.world.level.storage',
    className: 'LevelStorageSource',
    description: '世界存储源（管理存档文件夹）',
    methods: [
      { signature: 'LevelStorageSource.LevelStorageAccess createAccess(String levelId)', description: '创建存档访问器' },
      { signature: 'List<LevelSummary> getLevelList()', description: '获取所有存档列表' },
    ],
  },
  {
    package: 'net.minecraft.world.level.storage',
    className: 'LevelStorageException',
    description: '世界存储异常',
  },
  {
    package: 'net.minecraft.world.level.storage',
    className: 'PlayerDataStorage',
    description: '玩家数据存储（NBT 文件）',
    methods: [
      { signature: 'CompoundTag load(Player player)', description: '加载玩家 NBT' },
      { signature: 'void save(Player player)', description: '保存玩家 NBT' },
    ],
  },
  {
    package: 'net.minecraft.world.level.storage',
    className: 'ServerLevelData',
    description: '服务端世界数据接口（继承 WorldData）',
    methods: [
      { signature: 'int getDayTime()', description: '获取世界时间' },
      { signature: 'void setDayTime(int time)', description: '设置世界时间' },
      { signature: 'boolean isRaining()', description: '是否在下雨' },
      { signature: 'boolean isThundering()', description: '是否在雷暴' },
    ],
  },
  {
    package: 'net.minecraft.world.level.storage',
    className: 'PrimaryLevelData',
    description: '主世界数据实现（继承 ServerLevelData）',
  },
  {
    package: 'net.minecraft.world.level.storage',
    className: 'LevelData',
    description: '世界数据接口基类（共享给客户端/服务端）',
    methods: [
      { signature: 'long getGameTime()', description: '获取游戏刻数' },
      { signature: 'long getDayTime()', description: '获取一天内时间' },
      { signature: 'Difficulty getDifficulty()', description: '获取难度' },
    ],
  },

  /* === 领域 8：net.minecraft.world.level.chunk（5 类） === */
  {
    package: 'net.minecraft.world.level.chunk',
    className: 'ChunkSource',
    description: '区块源（提供区块访问接口）',
    methods: [
      { signature: 'ChunkAccess getChunk(int x, int z, ChunkStatus status, boolean require)', description: '获取指定状态的区块' },
      { signature: 'boolean hasChunk(int x, int z)', description: '区块是否已加载' },
    ],
  },
  {
    package: 'net.minecraft.world.level.chunk',
    className: 'Chunk',
    description: '区块接口（LevelChunk 实现，提供方块状态读写）',
    methods: [
      { signature: 'BlockState getBlockState(BlockPos pos)', description: '获取方块状态' },
      { signature: 'void setBlockState(BlockPos pos, BlockState state, boolean isMoving)', description: '设置方块状态' },
    ],
  },
  {
    package: 'net.minecraft.world.level.chunk',
    className: 'ProtoChunk',
    description: '原型区块（生成过程中的中间区块状态）',
  },
  {
    package: 'net.minecraft.world.level.chunk',
    className: 'EmptyLevelChunk',
    description: '空区块（用于无区块加载时的占位）',
  },
  {
    package: 'net.minecraft.world.level.chunk',
    className: 'ChunkSerializer',
    description: '区块序列化工具（写入/读取 NBT）',
    methods: [
      { signature: 'static ChunkAccess read(ServerLevel level, PoiManager poiManager, ChunkPos pos, CompoundTag tag)', description: '从 NBT 读取区块' },
      { signature: 'static CompoundTag write(ServerLevel level, ChunkAccess chunk)', description: '将区块写入 NBT' },
    ],
  },

  /* === 领域 9：net.minecraft.world.level.levelgen（11 类） === */
  {
    package: 'net.minecraft.world.level.levelgen',
    className: 'NoiseGeneratorSettings',
    description: '噪声生成器设置（每维度的噪声参数）',
    methods: [
      { signature: 'NoiseSettings noiseSettings()', description: '获取噪声设置' },
      { signature: 'boolean islandOverride()', description: '是否启用岛屿覆盖' },
    ],
  },
  {
    package: 'net.minecraft.world.level.levelgen',
    className: 'NoiseBasedChunkGenerator',
    description: '基于噪声的区块生成器（原版主世界/下界使用）',
    methods: [
      { signature: 'void buildSurface(WorldGenRegion region, StructureManager manager, RandomState random, ChunkAccess chunk)', description: '生成地表' },
      { signature: 'void applyCarvers(WorldGenRegion region, long seed, RandomState random, BiomeManager biomeManager, StructureManager manager, ChunkAccess chunk, GenerationStep.Carving step)', description: '应用雕刻器（洞穴/峡谷）' },
    ],
  },
  {
    package: 'net.minecraft.world.level.levelgen',
    className: 'NoiseRouter',
    description: '噪声路由器（连接噪声函数与最终地形参数）',
  },
  {
    package: 'net.minecraft.world.level.levelgen',
    className: 'NoiseSettings',
    description: '噪声设置（高度/密度函数配置）',
    methods: [
      { signature: 'int height()', description: '获取高度（通常 384）' },
      { signature: 'int minY()', description: '获取最低 Y（主世界 -64）' },
    ],
  },
  {
    package: 'net.minecraft.world.level.levelgen',
    className: 'WorldgenRandom',
    description: '世界生成随机数源',
  },
  {
    package: 'net.minecraft.world.level.levelgen',
    className: 'FeatureSorter',
    description: '特性排序器（按生物群系分组特性）',
  },
  {
    package: 'net.minecraft.world.level.levelgen',
    className: 'DensityFunction',
    description: '密度函数接口（噪声地形核心）',
    methods: [
      { signature: 'double compute(DensityFunction.FunctionContext context)', description: '计算指定位置的密度值' },
    ],
  },
  {
    package: 'net.minecraft.world.level.levelgen',
    className: 'SurfaceRules',
    description: '地表规则（按条件应用地表方块）',
  },
  {
    package: 'net.minecraft.world.level.levelgen',
    className: 'SurfaceSystem',
    description: '地表系统（执行地表规则）',
  },
  {
    package: 'net.minecraft.world.level.levelgen',
    className: 'CarvingContext',
    description: '雕刻上下文（提供雕刻器访问）',
  },
  {
    package: 'net.minecraft.world.level',
    className: 'WorldGenLevel',
    description: '世界生成等级接口（继承 LevelAccessor，提供生物群系/结构访问）',
  },

  /* === 领域 10：net.minecraft.world.level.levelgen.feature（20 类） === */
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'SimpleBlockFeature',
    description: '单方块特性（在指定位置放置方块）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'MonsterRoomFeature',
    description: '怪物房间特性（地牢/刷怪笼房间）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'LakeFeature',
    description: '湖泊特性（生成水/岩浆湖）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'OreFeature',
    description: '矿石特性（生成矿脉）',
    methods: [
      { signature: 'boolean place(FeaturePlaceContext<OreConfiguration> context)', description: '生成矿石' },
    ],
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'SpikeFeature',
    description: '末地黑曜石柱特性',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'BasaltColumnsFeature',
    description: '玄武岩柱特性',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'DeltaFeature',
    description: '三角洲特性（下界岩浆/玄武岩平地）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'ReplaceBlobsFeature',
    description: '替换块状区域特性',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'FillLayerFeature',
    description: '填充整层特性',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'DiskFeature',
    description: '圆盘特性（沙/黏土圆盘）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'NoSurfaceOreFeature',
    description: '无表面矿石特性（不暴露在地表）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'BoulderFeature',
    description: '巨石特性（苔石/铁粒堆）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'BonusChestFeature',
    description: '奖励箱特性（出生点附近）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'CoralClawFeature',
    description: '珊瑚爪特性（水下珊瑚）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'CoralMushroomFeature',
    description: '珊瑚蘑菇特性',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'CoralTreeFeature',
    description: '珊瑚树特性',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'ConfiguredFeature',
    description: '已配置的特性（Feature + 配置的组合，可注册）',
    methods: [
      { signature: 'Feature<FC> feature()', description: '获取底层 Feature' },
      { signature: 'FC config()', description: '获取配置' },
      { signature: 'boolean place(WorldGenLevel level, ChunkGenerator generator, RandomSource random, BlockPos pos)', description: '在指定位置生成' },
    ],
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'TreeFeature',
    description: '树木特性（基于 TreeConfiguration 生成）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'HugeFungusFeature',
    description: '巨型菌类特性（下界诡异菌）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature',
    className: 'BambooStalkFeature',
    description: '竹子特性（生成竹竿）',
  },

  /* === 领域 11：net.minecraft.world.level.levelgen.feature.configurations（15 类） === */
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'FeatureConfiguration',
    description: '特性配置接口（所有配置类的根）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'OreConfiguration',
    description: '矿石配置（目标方块 + 替换规则 + 矿脉大小）',
    methods: [
      { signature: 'static OreConfiguration target(RuleTest test, BlockState state)', description: '创建矿石配置' },
      { signature: 'int size()', description: '获取矿脉大小' },
    ],
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'DiskConfiguration',
    description: '圆盘配置（半径/方块/状态）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'ReplaceBlockConfiguration',
    description: '替换方块配置（替换指定方块为目标方块）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'SimpleBlockConfiguration',
    description: '简单方块配置（单一方块状态）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'SimpleRandomFeatureConfiguration',
    description: '简单随机特性配置（从列表中随机选一个）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'RandomFeatureConfiguration',
    description: '随机特性配置（带权重的随机选择）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'NoneFeatureConfiguration',
    description: '空特性配置（无参特性的占位）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'BlockColumnConfiguration',
    description: '方块列配置（垂直方块柱）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'HugeMushroomFeatureConfiguration',
    description: '巨型蘑菇配置（蘑菇茎/盖方块 + 高度）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'TreeConfiguration',
    description: '树木配置（树干/树叶/高度/根/装饰物）',
    methods: [
      { signature: 'TreeConfiguration.Builder builder()', description: '获取构建器' },
    ],
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'SpringConfiguration',
    description: '泉配置（流体 + 可替换方块列表）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'SpikeConfiguration',
    description: '末地黑曜石柱配置',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'BasaltColumnsConfiguration',
    description: '玄武岩柱配置（高度范围）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.feature.configurations',
    className: 'DeltaFeatureConfiguration',
    description: '三角洲特性配置（液体 + 边缘方块 + 大小）',
  },

  /* === 领域 12：net.minecraft.world.level.levelgen.placement（8 类） === */
  {
    package: 'net.minecraft.world.level.levelgen.placement',
    className: 'PlacedFeature',
    description: '已放置的特性（ConfiguredFeature + 修饰符列表）',
    methods: [
      { signature: 'boolean place(WorldGenLevel level, ChunkGenerator generator, RandomSource random, BlockPos pos)', description: '在指定位置生成' },
      { signature: 'List<PlacementModifier> placementModifiers()', description: '获取修饰符列表' },
    ],
  },
  {
    package: 'net.minecraft.world.level.levelgen.placement',
    className: 'PlacementModifier',
    description: '放置修饰符基类（决定特性在哪些位置生成）',
    methods: [
      { signature: 'Stream<BlockPos> getPositions(PlacementContext context, RandomSource random, BlockPos pos)', description: '获取可放置位置流' },
    ],
  },
  {
    package: 'net.minecraft.world.level.levelgen.placement',
    className: 'PlacementContext',
    description: '放置上下文（提供区块生成器/特性访问）',
  },
  {
    package: 'net.minecraft.world.level.levelgen.placement',
    className: 'BiomeFilter',
    description: '生物群系过滤器（仅在合法生物群系生成）',
    methods: [
      { signature: 'static BiomeFilter biome()', description: '获取实例' },
    ],
  },
  {
    package: 'net.minecraft.world.level.levelgen.placement',
    className: 'CountPlacement',
    description: '数量放置修饰符（生成 N 次）',
    methods: [
      { signature: 'static CountPlacement of(int count)', description: '按数量创建' },
      { signature: 'static CountPlacement of(IntProvider count)', description: '按区间创建' },
    ],
  },
  {
    package: 'net.minecraft.world.level.levelgen.placement',
    className: 'RarityFilter',
    description: '稀有度过滤器（按概率生成）',
    methods: [
      { signature: 'static RarityFilter onAverageOnceEvery(int chance)', description: '按 1/N 概率创建' },
    ],
  },
  {
    package: 'net.minecraft.world.level.levelgen.placement',
    className: 'InSquarePlacement',
    description: '方形内放置（在 16x16 区块内随机选点）',
    methods: [
      { signature: 'static InSquarePlacement spread()', description: '获取实例' },
    ],
  },
  {
    package: 'net.minecraft.world.level.levelgen.placement',
    className: 'HeightRangePlacement',
    description: '高度范围放置（在指定 Y 范围内生成）',
    methods: [
      { signature: 'static HeightRangePlacement of(HeightProvider height)', description: '按高度提供器创建' },
      { signature: 'static HeightRangePlacement uniform(VerticalAnchor min, VerticalAnchor max)', description: '均匀分布' },
      { signature: 'static HeightRangePlacement triangle(VerticalAnchor min, VerticalAnchor max)', description: '三角分布' },
    ],
  },

  /* === 领域 13：net.minecraft.commands + brigadier（9 类） === */
  {
    package: 'net.minecraft.commands',
    className: 'CommandBuildContext',
    description: '命令构建上下文（提供注册表访问给参数解析）',
  },
  {
    package: 'net.minecraft.commands',
    className: 'CommandRuntimeException',
    description: '命令执行时抛出的运行时异常',
  },
  {
    package: 'net.minecraft.commands',
    className: 'CommandSource',
    description: '命令源接口（提供反馈/权限/位置信息）',
    methods: [
      { signature: 'void sendSystemMessage(Component message)', description: '发送消息' },
      { signature: 'boolean acceptsSuccess()', description: '是否接受成功消息' },
      { signature: 'boolean acceptsFailure()', description: '是否接受失败消息' },
      { signature: 'boolean shouldInformAdmins()', description: '是否通知管理员' },
    ],
  },
  {
    package: 'net.minecraft.commands',
    className: 'CommandSigningContext',
    description: '命令签名上下文（用于聊天签名验证）',
  },
  {
    package: 'com.mojang.brigadier',
    className: 'CommandDispatcher',
    description: 'Brigadier 命令调度器（注册/执行命令）',
    methods: [
      { signature: 'LiteralArgumentBuilder<S> literal(String name)', description: '创建字面量参数构建器' },
      { signature: 'RequiredArgumentBuilder<S, T> argument(String name, ArgumentType<T> type)', description: '创建必填参数构建器' },
      { signature: 'int execute(ParseResults<S> parse)', description: '执行已解析命令' },
      { signature: 'ParseResults<S> parse(String command, S source)', description: '解析命令字符串' },
    ],
  },
  {
    package: 'com.mojang.brigadier.context',
    className: 'CommandContext',
    description: '命令执行上下文（包含源 + 已解析参数）',
    methods: [
      { signature: 'S getSource()', description: '获取命令源' },
      { signature: '<T> T getArgument(String name, Class<T> clazz)', description: '获取已解析参数值' },
      { signature: 'String getInput()', description: '获取原始输入字符串' },
    ],
  },
  {
    package: 'com.mojang.brigadier.exceptions',
    className: 'CommandSyntaxException',
    description: 'Brigadier 命令语法异常',
    methods: [
      { signature: 'String getMessage()', description: '获取异常消息' },
      { signature: 'int getCursor()', description: '获取错误位置' },
    ],
  },
  {
    package: 'com.mojang.brigadier.builder',
    className: 'LiteralArgumentBuilder',
    description: '字面量参数构建器（构建字面子命令）',
    methods: [
      { signature: 'static <S> LiteralArgumentBuilder<S> literal(String name)', description: '创建字面量构建器' },
      { signature: 'LiteralArgumentBuilder<S> executes(Command<S> command)', description: '设置执行逻辑' },
      { signature: 'LiteralArgumentBuilder<S> then(ArgumentBuilder<S, ?> argument)', description: '添加子参数' },
    ],
  },
  {
    package: 'com.mojang.brigadier.builder',
    className: 'RequiredArgumentBuilder',
    description: '必填参数构建器（构建参数化子命令）',
    methods: [
      { signature: 'static <S, T> RequiredArgumentBuilder<S, T> argument(String name, ArgumentType<T> type)', description: '创建必填参数构建器' },
      { signature: 'RequiredArgumentBuilder<S, T> suggests(SuggestionProvider<S> provider)', description: '设置建议提供器' },
    ],
  },

  /* === 领域 14：net.minecraft.commands.arguments + brigadier.arguments（11 类） === */
  {
    package: 'net.minecraft.commands.arguments',
    className: 'BlockPosArgument',
    description: '方块坐标参数（@a/@s 或具体 x y z）',
    methods: [
      { signature: 'static BlockPosArgument blockPos()', description: '获取参数实例' },
      { signature: 'static BlockPos getLoadedBlockPos(CommandContext<CommandSourceStack> ctx, String name)', description: '获取已加载坐标' },
    ],
  },
  {
    package: 'net.minecraft.commands.arguments',
    className: 'EntityArgument',
    description: '实体参数（玩家/实体/选择器）',
    methods: [
      { signature: 'static EntityArgument player()', description: '单玩家' },
      { signature: 'static EntityArgument players()', description: '多玩家' },
      { signature: 'static EntityArgument entity()', description: '单实体' },
      { signature: 'static EntityArgument entities()', description: '多实体' },
      { signature: 'static Entity getEntity(CommandContext<CommandSourceStack> ctx, String name)', description: '获取单个实体' },
    ],
  },
  {
    package: 'net.minecraft.commands.arguments',
    className: 'ResourceArgument',
    description: '注册表资源参数（按 ResourceKey 选择注册表项）',
  },
  {
    package: 'net.minecraft.commands.arguments',
    className: 'ItemArgument',
    description: '物品参数（带 NBT 与数量）',
    methods: [
      { signature: 'static ItemArgument item(CommandBuildContext ctx)', description: '创建实例' },
      { signature: 'static ItemStack getItem(CommandContext<CommandSourceStack> ctx, String name)', description: '获取物品堆' },
    ],
  },
  {
    package: 'net.minecraft.commands.arguments',
    className: 'BlockStateArgument',
    description: '方块状态参数（带 NBT 与属性）',
    methods: [
      { signature: 'static BlockStateArgument block(CommandBuildContext ctx)', description: '创建实例' },
    ],
  },
  {
    package: 'net.minecraft.commands.arguments',
    className: 'GameProfileArgument',
    description: '玩家档案参数（按名字或选择器解析）',
  },
  {
    package: 'net.minecraft.commands.arguments',
    className: 'MessageArgument',
    description: '消息参数（聊天消息，参与签名）',
    methods: [
      { signature: 'static Component getMessage(CommandContext<CommandSourceStack> ctx, String name)', description: '获取解析后的消息' },
    ],
  },
  {
    package: 'net.minecraft.commands.arguments',
    className: 'ComponentArgument',
    description: '文本组件参数（JSON 格式解析）',
  },
  {
    package: 'com.mojang.brigadier.arguments',
    className: 'ArgumentType',
    description: '参数类型接口（ Brigadier 解析器入口）',
    methods: [
      { signature: 'T parse(StringReader reader) throws CommandSyntaxException', description: '从读取器解析参数' },
    ],
  },
  {
    package: 'com.mojang.brigadier.arguments',
    className: 'StringArgumentType',
    description: '字符串参数（单字/带空格/贪婪）',
    methods: [
      { signature: 'static StringArgumentType word()', description: '单字（无空格）' },
      { signature: 'static StringArgumentType string()', description: '带空格字符串' },
      { signature: 'static StringArgumentType greedyString()', description: '贪婪读取剩余' },
    ],
  },
  {
    package: 'com.mojang.brigadier.arguments',
    className: 'IntegerArgumentType',
    description: '整数参数（带最小/最大值）',
    methods: [
      { signature: 'static IntegerArgumentType integer(int min, int max)', description: '创建带范围的整数参数' },
      { signature: 'static int getInteger(CommandContext<?> ctx, String name)', description: '获取参数值' },
    ],
  },

  /* === 领域 15：net.minecraftforge.client.event（9 类） === */
  {
    package: 'net.minecraftforge.client.event',
    className: 'RenderHandEvent',
    description: '渲染手部事件（可取消，用于自定义第一人称手部）',
    methods: [
      { signature: 'PoseStack getPoseStack()', description: '获取姿态栈' },
      { signature: 'MultiBufferSource getMultiBufferSource()', description: '获取缓冲源' },
      { signature: 'InteractionHand getHand()', description: '获取渲染的手' },
    ],
  },
  {
    package: 'net.minecraftforge.client.event',
    className: 'RenderPlayerEvent',
    description: '玩家渲染事件基类（含 Pre/Post 子事件）',
    methods: [
      { signature: 'Player getPlayer()', description: '获取玩家' },
      { signature: 'PoseStack getPoseStack()', description: '获取姿态栈' },
    ],
  },
  {
    package: 'net.minecraftforge.client.event',
    className: 'RenderNameTagEvent',
    description: '渲染名牌事件（可修改/取消名牌）',
    methods: [
      { signature: 'Component getContent()', description: '获取名牌内容' },
      { signature: 'void setContent(Component content)', description: '设置名牌内容' },
    ],
  },
  {
    package: 'net.minecraftforge.client.event',
    className: 'ViewportEvent',
    description: '视口事件基类（ComputeFov/ComputeCameraAngles 父类）',
  },
  {
    package: 'net.minecraftforge.client.event',
    className: 'ComputeFovEvent',
    description: '计算 FOV 事件（修改瞄准/速度时的 FOV 变化）',
    methods: [
      { signature: 'float getFov()', description: '获取当前 FOV' },
      { signature: 'void setFov(float fov)', description: '设置 FOV' },
      { signature: 'float getNewFov()', description: '获取新 FOV' },
    ],
  },
  {
    package: 'net.minecraftforge.client.event',
    className: 'ScreenEvent',
    description: '屏幕事件基类（Init/MouseInput/KeyboardInput 等子事件）',
    methods: [
      { signature: 'Screen getScreen()', description: '获取屏幕实例' },
    ],
  },
  {
    package: 'net.minecraftforge.client.event',
    className: 'RenderTooltipEvent',
    description: '渲染工具提示事件（Pre/Post/BackgroundColor 等子事件）',
  },
  {
    package: 'net.minecraftforge.client.event',
    className: 'RenderItemInFrameEvent',
    description: '渲染物品框中物品事件',
    methods: [
      { signature: 'ItemStack getItemStack()', description: '获取物品堆' },
      { signature: 'ItemFrame getFrame()', description: '获取物品框实体' },
    ],
  },
  {
    package: 'net.minecraftforge.client.event',
    className: 'RenderLivingEvent',
    description: '生物渲染事件基类（Pre/Post 子事件）',
    methods: [
      { signature: 'LivingEntity getEntity()', description: '获取生物' },
      { signature: 'PoseStack getPoseStack()', description: '获取姿态栈' },
    ],
  },

  /* === 领域 16：net.minecraftforge.event.level（7 类） === */
  {
    package: 'net.minecraftforge.event.level',
    className: 'ExplosionEvent',
    description: '爆炸事件基类（Start/Detonate 子事件）',
    methods: [
      { signature: 'Level getLevel()', description: '获取世界' },
      { signature: 'Explosion getExplosion()', description: '获取爆炸对象' },
    ],
  },
  {
    package: 'net.minecraftforge.event.level',
    className: 'NoteBlockEvent',
    description: '音符盒事件基类（Play/Change 子事件）',
    methods: [
      { signature: 'Note getNote()', description: '获取音符' },
      { signature: 'void setNote(Note note)', description: '设置音符' },
    ],
  },
  {
    package: 'net.minecraftforge.event.level',
    className: 'PistonEvent',
    description: '活塞事件基类（Pre/Post 子事件）',
    methods: [
      { signature: 'Direction getDirection()', description: '获取移动方向' },
      { signature: 'PistonMoveType getPistonMoveType()', description: '获取移动类型（推/拉）' },
    ],
  },
  {
    package: 'net.minecraftforge.event.level',
    className: 'ChunkDataEvent',
    description: '区块数据事件（Load/Save 子事件）',
    methods: [
      { signature: 'ChunkAccess getChunk()', description: '获取区块' },
      { signature: 'CompoundTag getData()', description: '获取区块 NBT 数据' },
    ],
  },
  {
    package: 'net.minecraftforge.event.level',
    className: 'ChunkEvent',
    description: '区块事件基类（Load/Unload 子事件）',
    methods: [
      { signature: 'ChunkAccess getChunk()', description: '获取区块' },
    ],
  },
  {
    package: 'net.minecraftforge.event.level',
    className: 'LevelEvent',
    description: '世界事件基类（Load/Unload/Save 子事件）',
    methods: [
      { signature: 'Level getLevel()', description: '获取世界' },
    ],
  },
  {
    package: 'net.minecraftforge.event.level',
    className: 'PortalSpawnEvent',
    description: '传送门生成事件（可取消）',
    methods: [
      { signature: 'LevelAccessor getLevel()', description: '获取世界' },
      { signature: 'BlockPos getPos()', description: '获取生成位置' },
    ],
  },

  /* === 额外补充：交易相关（3 类） === */
  {
    package: 'net.minecraft.world.item.trading',
    className: 'MerchantOffers',
    description: '商人交易列表（CompoundTag 序列化）',
    methods: [
      { signature: 'MerchantOffer get(int index)', description: '获取指定索引的交易' },
      { signature: 'boolean add(MerchantOffer offer)', description: '添加交易' },
      { signature: 'CompoundTag createTag()', description: '序列化为 NBT' },
    ],
  },
  {
    package: 'net.minecraft.world.item.trading',
    className: 'MerchantOffer',
    description: '商人交易（买入 A + 买入 B → 输出 C，带使用次数/价格倍率）',
    methods: [
      { signature: 'ItemStack getBaseCostA()', description: '获取买入 A 价格' },
      { signature: 'ItemStack getBaseCostB()', description: '获取买入 B 价格' },
      { signature: 'ItemStack getResult()', description: '获取输出物品' },
      { signature: 'int getUses()', description: '获取已使用次数' },
      { signature: 'int getMaxUses()', description: '获取最大使用次数' },
    ],
  },
  {
    package: 'net.minecraft.world.item.trading',
    className: 'Merchant',
    description: '商人接口（Villager/AbstractVillager 实现）',
    methods: [
      { signature: 'MerchantOffers getOffers()', description: '获取交易列表' },
      { signature: 'void overrideOffers(MerchantOffers offers)', description: '覆盖交易列表' },
      { signature: 'void notifyTrade(MerchantOffer offer)', description: '通知交易完成' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

/**
 * 为 Monaco 注册的补全提供者数据
 *
 * @param query 用户已输入的前缀（不区分大小写）
 * @returns 匹配的类列表（按 className 或 package 包含 query 过滤）
 *
 * 注意：当 query 为空字符串时，返回全部类（让 Monaco 触发显示）
 */
export function getMonacoSuggestions(query: string): ApiClassInfo[] {
  if (!query) return MC_API_DICTIONARY
  const lower = query.toLowerCase()
  return MC_API_DICTIONARY.filter(
    (c) =>
      c.className.toLowerCase().includes(lower) ||
      c.package.toLowerCase().includes(lower) ||
      c.description.toLowerCase().includes(lower),
  )
}

/**
 * 按 className 精确查找（用于代码生成引擎查询类元数据）
 */
export function findClassByName(className: string): ApiClassInfo | undefined {
  return MC_API_DICTIONARY.find((c) => c.className === className)
}

/**
 * 按包前缀过滤（用于代码生成分组）
 */
export function findClassesByPackage(packagePrefix: string): ApiClassInfo[] {
  return MC_API_DICTIONARY.filter((c) => c.package.startsWith(packagePrefix))
}

/**
 * 统计：返回字典规模信息
 *
 * 阶段 8-B 后：总类数 500+，含 16 个新增领域（实体/方块实体/世界生成/命令/Forge 事件）
 */
export function getDictionaryStats() {
  const total = MC_API_DICTIONARY.length
  const withMethods = MC_API_DICTIONARY.filter((c) => c.methods && c.methods.length > 0).length
  const withFields = MC_API_DICTIONARY.filter((c) => c.fields && c.fields.length > 0).length
  const totalMethods = MC_API_DICTIONARY.reduce(
    (sum, c) => sum + (c.methods?.length ?? 0),
    0,
  )
  const totalFields = MC_API_DICTIONARY.reduce(
    (sum, c) => sum + (c.fields?.length ?? 0),
    0,
  )
  // 按 package 去掉最后一段 className 后聚合，得到"父包"数量
  const packages = new Set(
    MC_API_DICTIONARY.map((c) => c.package.split('.').slice(0, -1).join('.')),
  ).size
  // 完整 package 路径数量（包含末端包名）
  const fullPackages = new Set(MC_API_DICTIONARY.map((c) => c.package)).size
  return {
    total,
    withMethods,
    withFields,
    totalMethods,
    totalFields,
    packages,
    fullPackages,
  }
}
