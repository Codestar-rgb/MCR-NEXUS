'use client'

/**
 * 实体节点卡片（React Flow 自定义节点）
 *
 * 用于在节点画布上展示一个 MC 实体（如 RubyGolem）的概览。
 * - 红色/rose 角标（区别于方块=amber、物品=teal）
 * - 顶部：节点类型图标 + 名称 + 类型标签
 * - 中间：2-3 个关键属性（生命值/攻击力/护甲）
 * - 底部：输入/输出端口指示器（Handle）
 *
 * 该组件为阶段 1 占位，阶段 2 接入真实数据源后由 store 驱动。
 */

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Heart, Swords, Shield, Boxes, Swords as EntityIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 实体节点 data 字段 */
export interface EntityNodeData {
  name: string
  /** 注册 ID，如 ruby_golem */
  registryId: string
  /** 生命值 */
  health: number
  /** 攻击力 */
  attack: number
  /** 护甲值 */
  armor: number
  [key: string]: unknown
}

export type EntityNodeType = Node<EntityNodeData, 'entity'>

function EntityNodeCardImpl({ data, selected }: NodeProps<EntityNodeType>) {
  const { name, registryId, health, attack, armor } = data

  return (
    <div
      className={cn(
        'group relative w-60 rounded-xl border border-rose-500/40 bg-card/95 shadow-lg backdrop-blur',
        'ring-1 ring-rose-500/20 transition-all',
        selected ? 'border-rose-400 ring-rose-400/60 shadow-rose-500/20' : 'hover:border-rose-400/70',
      )}
    >
      {/* 顶部：图标 + 类型标签 + 名称 */}
      <div className="flex items-center gap-2 border-b border-rose-500/20 bg-rose-500/10 px-3 py-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-300">
          <EntityIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground">{name}</span>
            <span className="rounded bg-rose-500/20 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-rose-300">
              Entity
            </span>
          </div>
          <code className="block truncate font-mono text-[10px] text-muted-foreground">{registryId}</code>
        </div>
      </div>

      {/* 中间：关键属性 */}
      <div className="space-y-1.5 px-3 py-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-rose-400" />
            生命值
          </span>
          <span className="font-mono font-semibold text-rose-300">{health}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Swords className="h-3.5 w-3.5 text-rose-400" />
            攻击力
          </span>
          <span className="font-mono font-semibold text-rose-300">{attack}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-rose-400" />
            护甲值
          </span>
          <span className="font-mono font-semibold text-rose-300">{armor}</span>
        </div>
      </div>

      {/* 底部：端口指示器 */}
      <div className="flex items-center justify-between border-t border-rose-500/20 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400/60" />
          输入
        </span>
        <span className="flex items-center gap-1 opacity-60">
          <Boxes className="h-3 w-3" />
          AI 待绑定
        </span>
        <span className="flex items-center gap-1">
          输出
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400/60" />
        </span>
      </div>

      {/* React Flow 端口 */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !border-rose-400 !bg-rose-500/80"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !border-rose-400 !bg-rose-500/80"
      />
    </div>
  )
}

export const EntityNodeCard = memo(EntityNodeCardImpl)
