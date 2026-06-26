'use client'

/**
 * 方块节点卡片（React Flow 自定义节点）
 *
 * - amber 边框/角标（区别于实体=rose、物品=teal）
 * - 顶部：方块图标 + 名称 + 类型标签
 * - 中间：硬度 / 抗爆度 / 发光等级
 * - 底部：输入/输出端口指示器
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Hammer, Bomb, Lightbulb, Box } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 方块节点 data 字段 */
export interface BlockNodeData {
  name: string
  registryId: string
  /** 硬度 */
  hardness: number
  /** 抗爆度 */
  resistance: number
  /** 发光等级 0-15 */
  lightLevel: number
  [key: string]: unknown
}

export type BlockNodeType = Node<BlockNodeData, 'block'>

function BlockNodeCardImpl({ data, selected }: NodeProps<BlockNodeType>) {
  const { name, registryId, hardness, resistance, lightLevel } = data

  return (
    <div
      className={cn(
        'group relative w-60 rounded-xl border border-amber-500/40 bg-card/95 shadow-lg backdrop-blur',
        'ring-1 ring-amber-500/20 transition-all',
        selected ? 'border-amber-400 ring-amber-400/60 shadow-amber-500/20' : 'hover:border-amber-400/70',
      )}
    >
      {/* 顶部 */}
      <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
          <Box className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground">{name}</span>
            <span className="rounded bg-amber-500/20 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-amber-300">
              Block
            </span>
          </div>
          <code className="block truncate font-mono text-[10px] text-muted-foreground">{registryId}</code>
        </div>
      </div>

      {/* 中间：关键属性 */}
      <div className="space-y-1.5 px-3 py-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Hammer className="h-3.5 w-3.5 text-amber-400" />
            硬度
          </span>
          <span className="font-mono font-semibold text-amber-300">{hardness}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Bomb className="h-3.5 w-3.5 text-amber-400" />
            抗爆度
          </span>
          <span className="font-mono font-semibold text-amber-300">{resistance}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
            发光等级
          </span>
          <span className="font-mono font-semibold text-amber-300">{lightLevel}/15</span>
        </div>
      </div>

      {/* 底部 */}
      <div className="flex items-center justify-between border-t border-amber-500/20 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60" />
          输入
        </span>
        <span className="flex items-center gap-1 opacity-60">
          <Box className="h-3 w-3" />
          掉落物已绑定
        </span>
        <span className="flex items-center gap-1">
          输出
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60" />
        </span>
      </div>

      {/* 端口 */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !border-amber-400 !bg-amber-500/80"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !border-amber-400 !bg-amber-500/80"
      />
    </div>
  )
}

export const BlockNodeCard = memo(BlockNodeCardImpl)
