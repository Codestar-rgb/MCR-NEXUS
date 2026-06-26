'use client'

/**
 * 右侧属性面板（占位）
 *
 * - 宽度由 workspace store.rightPanelWidth 控制（默认 320）
 * - 顶部 header：动态标题（根据 selectedNodeType 切换）
 * - Tabs：[基础属性] [行为逻辑]
 *   - 基础属性：mock 属性表单（disabled，阶段 3 接入真实编辑）
 *   - 行为逻辑：占位（阶段 3 实现）
 * - 没选中节点时：空状态插画 + "选中节点开始编辑"
 * - 底部：贴图纹理拖拽上传区
 */

import { motion } from 'framer-motion'
import {
  MousePointerClick,
  Boxes,
  Network,
  Image as ImageIcon,
  UploadCloud,
  Heart,
  Swords,
  Shield,
  Box,
  Hammer,
  Bomb,
  Lightbulb,
  Gem,
  Layers,
  Sparkles,
  Clock,
} from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

/** 属性字段定义（用于驱动 mock 表单） */
interface PropertyField {
  key: string
  label: string
  value: string | number
  icon?: typeof Heart
  /** 是否为 select 字段 */
  options?: string[]
}

/** 按节点类型分组的基础属性 */
const PROPERTIES_BY_TYPE: Record<'entity' | 'block' | 'item', PropertyField[]> = {
  entity: [
    { key: 'name', label: '名称', value: 'RubyGolem', icon: Heart },
    { key: 'registryId', label: '注册 ID', value: 'nexcube:ruby_golem' },
    { key: 'health', label: '生命值', value: 100, icon: Heart },
    { key: 'attack', label: '攻击力', value: 18, icon: Swords },
    { key: 'armor', label: '护甲值', value: 12, icon: Shield },
    { key: 'collisionBox', label: '碰撞箱', value: '1.4 × 2.7 × 1.4' },
    {
      key: 'aiType',
      label: 'AI 类型',
      value: 'melee',
      icon: Boxes,
      options: ['melee', 'ranged', 'passive', 'neutral'],
    },
  ],
  block: [
    { key: 'name', label: '名称', value: 'RubyBlock', icon: Box },
    { key: 'registryId', label: '注册 ID', value: 'nexcube:ruby_block' },
    { key: 'hardness', label: '硬度', value: 5.0, icon: Hammer },
    { key: 'resistance', label: '抗爆度', value: 6.0, icon: Bomb },
    { key: 'lightLevel', label: '发光等级', value: 7, icon: Lightbulb },
    {
      key: 'tool',
      label: '破坏工具',
      value: 'pickaxe',
      options: ['pickaxe', 'axe', 'shovel', 'hoe', 'none'],
    },
    { key: 'drops', label: '掉落物', value: 'nexcube:ruby × 1' },
  ],
  item: [
    { key: 'name', label: '名称', value: 'Ruby', icon: Gem },
    { key: 'registryId', label: '注册 ID', value: 'nexcube:ruby' },
    { key: 'maxStack', label: '最大堆叠', value: 64, icon: Layers },
    {
      key: 'rarity',
      label: '稀有度',
      value: 'uncommon',
      icon: Sparkles,
      options: ['common', 'uncommon', 'rare', 'epic'],
    },
    { key: 'cooldown', label: '使用冷却', value: 0, icon: Clock },
    {
      key: 'isFood',
      label: '是否食物',
      value: 'false',
      options: ['true', 'false'],
    },
  ],
}

/** 类型 → 中文显示 + 主色 */
const TYPE_DISPLAY: Record<'entity' | 'block' | 'item', { label: string; color: string }> = {
  entity: { label: '实体属性', color: 'text-rose-300' },
  block: { label: '方块属性', color: 'text-amber-300' },
  item: { label: '物品属性', color: 'text-teal-300' },
}

/** 渲染单个属性字段（disabled 占位） */
function PropertyFieldRow({ field }: { field: PropertyField }) {
  const Icon = field.icon
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {field.label}
      </Label>
      {field.options ? (
        <Select disabled value={String(field.value)}>
          <SelectTrigger className="h-8 w-full text-xs" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt} className="text-xs">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          disabled
          value={field.value}
          readOnly
          className="h-8 font-mono text-xs"
        />
      )}
    </div>
  )
}

export function PropertyPanel() {
  const width = useWorkspaceStore((s) => s.rightPanelWidth)
  const selectedNodeId = useWorkspaceStore((s) => s.selectedNodeId)
  const selectedNodeType = useWorkspaceStore((s) => s.selectedNodeType)
  const selectedNodeName = useWorkspaceStore((s) => s.selectedNodeName)

  const hasSelection = !!selectedNodeId && !!selectedNodeType
  const typeDisplay = hasSelection ? TYPE_DISPLAY[selectedNodeType] : null
  const fields = hasSelection ? PROPERTIES_BY_TYPE[selectedNodeType] : []

  const headerTitle = hasSelection
    ? `${typeDisplay!.label} - ${selectedNodeName ?? ''}`
    : '属性面板'

  return (
    <aside
      style={{ width }}
      className="flex h-full shrink-0 flex-col border-l border-border bg-card/40"
      aria-label="右侧属性面板"
    >
      {/* 顶部 header */}
      <header className="border-b border-border px-4 py-3">
        <h2 className="truncate text-sm font-semibold text-foreground">{headerTitle}</h2>
        {!hasSelection && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">点击节点查看属性</p>
        )}
        {hasSelection && typeDisplay && (
          <p className={cn('mt-0.5 text-[11px] font-medium', typeDisplay.color)}>
            当前选中：{selectedNodeName}
          </p>
        )}
      </header>

      {/* 主体内容 */}
      <div className="flex-1 overflow-y-auto nexcube-scroll">
        {hasSelection ? (
          <Tabs defaultValue="basic" className="flex flex-col gap-0">
            <div className="border-b border-border px-3 pt-3">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="basic" className="text-xs">
                  基础属性
                </TabsTrigger>
                <TabsTrigger value="behavior" className="text-xs">
                  行为逻辑
                </TabsTrigger>
              </TabsList>
            </div>

            {/* 基础属性 tab */}
            <TabsContent value="basic" className="m-0 p-4">
              <div className="space-y-3">
                {fields.map((field) => (
                  <PropertyFieldRow key={field.key} field={field} />
                ))}
              </div>

              {/* 提示条 */}
              <div className="mt-4 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                阶段 1 占位：表单字段为只读展示，阶段 3 接入真实编辑。
              </div>
            </TabsContent>

            {/* 行为逻辑 tab */}
            <TabsContent value="behavior" className="m-0 p-4">
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 py-12 text-center">
                <Network className="h-8 w-8 text-muted-foreground/60" />
                <div>
                  <p className="text-xs font-medium text-foreground">子节点逻辑编辑器</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">阶段 3 实现</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          /* 空状态 */
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30"
            >
              <MousePointerClick className="h-7 w-7 text-muted-foreground/60" />
            </motion.div>
            <div>
              <p className="text-xs font-medium text-foreground">选中节点开始编辑</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                在画布上点击任意节点，<br />其属性将在此处显示
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 底部：贴图纹理拖拽区 */}
      <footer className="border-t border-border p-3">
        <Label className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ImageIcon className="h-3 w-3" />
          贴图纹理
        </Label>
        <div
          className={cn(
            'flex h-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border',
            'bg-muted/20 text-center transition-colors hover:border-primary/40 hover:bg-muted/40',
          )}
        >
          <UploadCloud className="h-4 w-4 text-muted-foreground/70" />
          <span className="text-[11px] text-muted-foreground">拖拽贴图到此</span>
          <span className="text-[9px] text-muted-foreground/60">PNG · 16×16 / 32×32 / 64×64</span>
        </div>
      </footer>
    </aside>
  )
}
