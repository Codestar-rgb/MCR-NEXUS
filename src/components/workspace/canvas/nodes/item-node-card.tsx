'use client'

/**
 * 物品节点卡片（React Flow 自定义节点）
 *
 * - teal 边框/角标（区别于实体=rose、方块=amber）
 * - 顶部：物品图标 + 名称 + 类型标签
 * - 中间：最大堆叠 / 稀有度 / 使用冷却
 * - 底部：输入/输出端口指示器
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Layers, Gem, Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 物品节点 data 字段 */
export interface ItemNodeData {
  name: string
  registryId: string
  /** 最大堆叠 */
  maxStack: number
  /** 稀有度：common / uncommon / rare / epic */
  rarity: string
  /** 使用冷却（tick） */
  cooldown: number
  [key: string]: unknown
}

export type ItemNodeType = Node<ItemNodeData, 'item'>

function ItemNodeCardImpl({ data, selected }: NodeProps<ItemNodeType>) {
  const { name, registryId, maxStack, rarity, cooldown } = data

  return (
    <div
      className={cn(
        'group relative w-60 rounded-xl border border-teal-500/40 bg-card/95 shadow-lg backdrop-blur',
        'ring-1 ring-teal-500/20 transition-all',
        selected ? 'border-teal-400 ring-teal-400/60 shadow-teal-500/20' : 'hover:border-teal-400/70',
      )}
    >
      {/* 顶部 */}
      <div className="flex items-center gap-2 border-b border-teal-500/20 bg-teal-500/10 px-3 py-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300">
          <Gem className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground">{name}</span>
            <span className="rounded bg-teal-500/20 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-teal-300">
              Item
            </span>
          </div>
          <code className="block truncate font-mono text-[10px] text-muted-foreground">{registryId}</code>
        </div>
      </div>

      {/* 中间 */}
      <div className="space-y-1.5 px-3 py-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-teal-400" />
            最大堆叠
          </span>
          <span className="font-mono font-semibold text-teal-300">{maxStack}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            稀有度
          </span>
          <span className="font-mono font-semibold text-teal-300">{rarity}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-teal-400" />
            使用冷却
          </span>
          <span className="font-mono font-semibold text-teal-300">{cooldown}t</span>
        </div>
      </div>

      {/* 底部 */}
      <div className="flex items-center justify-between border-t border-teal-500/20 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400/60" />
          输入
        </span>
        <span className="flex items-center gap-1 opacity-60">
          <Gem className="h-3 w-3" />
          配方未绑定
        </span>
        <span className="flex items-center gap-1">
          输出
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400/60" />
        </span>
      </div>

      {/* 端口 */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !border-teal-400 !bg-teal-500/80"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !border-teal-400 !bg-teal-500/80"
      />
    </div>
  )
}

export const ItemNodeCard = memo(ItemNodeCardImpl)
