'use client'

/**
 * 通用节点卡片基础组件
 *
 * 所有节点卡片（实体/方块/物品/黑盒/节点组）共享的骨架：
 *  - 顶部 header：图标 + 类型标签 + 标题 + 折叠按钮
 *  - 中间内容区（由子类通过 renderContent 填充）
 *  - 端口渲染（根据 NODE_TYPE_REGISTRY 的 inputPorts/outputPorts）
 *  - 选中状态高亮
 *  - 折叠状态（只显示 header + summary）
 *
 * Tailwind 不支持动态类名（border-${color}-500），因此使用预定义的
 * COLOR_CLASSES 映射对象把 tailwind 色名映射为完整类名字符串。
 */

import { memo, type ReactNode } from 'react'
import { Position, type NodeProps } from '@xyflow/react'
import { ChevronDown, ChevronRight, Box } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { getNodeTypeDefinition } from '@/lib/node-system'
import type { FlowNodeData } from '@/lib/node-system'
import { useDebugStore } from '@/stores/debug-store'
import { cn } from '@/lib/utils'
import { PortHandle } from './port-handle'

/** Tailwind 主题色映射（避免动态类名） */
export const COLOR_CLASSES: Record<
  string,
  {
    border: string
    borderStrong: string
    bg: string
    bgHeader: string
    text: string
    ring: string
    iconBg: string
    iconText: string
  }
> = {
  rose: {
    border: 'border-rose-500/40',
    borderStrong: 'border-rose-400',
    bg: 'bg-rose-500/10',
    bgHeader: 'bg-rose-500/10',
    text: 'text-rose-300',
    ring: 'ring-rose-400/40',
    iconBg: 'bg-rose-500/20',
    iconText: 'text-rose-300',
  },
  amber: {
    border: 'border-amber-500/40',
    borderStrong: 'border-amber-400',
    bg: 'bg-amber-500/10',
    bgHeader: 'bg-amber-500/10',
    text: 'text-amber-300',
    ring: 'ring-amber-400/40',
    iconBg: 'bg-amber-500/20',
    iconText: 'text-amber-300',
  },
  teal: {
    border: 'border-teal-500/40',
    borderStrong: 'border-teal-400',
    bg: 'bg-teal-500/10',
    bgHeader: 'bg-teal-500/10',
    text: 'text-teal-300',
    ring: 'ring-teal-400/40',
    iconBg: 'bg-teal-500/20',
    iconText: 'text-teal-300',
  },
  cyan: {
    border: 'border-cyan-500/40',
    borderStrong: 'border-cyan-400',
    bg: 'bg-cyan-500/10',
    bgHeader: 'bg-cyan-500/10',
    text: 'text-cyan-300',
    ring: 'ring-cyan-400/40',
    iconBg: 'bg-cyan-500/20',
    iconText: 'text-cyan-300',
  },
  emerald: {
    border: 'border-emerald-500/40',
    borderStrong: 'border-emerald-400',
    bg: 'bg-emerald-500/10',
    bgHeader: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    ring: 'ring-emerald-400/40',
    iconBg: 'bg-emerald-500/20',
    iconText: 'text-emerald-300',
  },
  violet: {
    border: 'border-violet-500/40',
    borderStrong: 'border-violet-400',
    bg: 'bg-violet-500/10',
    bgHeader: 'bg-violet-500/10',
    text: 'text-violet-300',
    ring: 'ring-violet-400/40',
    iconBg: 'bg-violet-500/20',
    iconText: 'text-violet-300',
  },
  slate: {
    border: 'border-slate-500/40',
    borderStrong: 'border-slate-400',
    bg: 'bg-slate-500/10',
    bgHeader: 'bg-slate-500/10',
    text: 'text-slate-300',
    ring: 'ring-slate-400/40',
    iconBg: 'bg-slate-500/20',
    iconText: 'text-slate-300',
  },
  zinc: {
    border: 'border-zinc-500/40',
    borderStrong: 'border-zinc-400',
    bg: 'bg-zinc-500/10',
    bgHeader: 'bg-zinc-500/10',
    text: 'text-zinc-300',
    ring: 'ring-zinc-400/40',
    iconBg: 'bg-zinc-500/20',
    iconText: 'text-zinc-300',
  },
}

/** 取色映射，未注册的色名降级到 zinc */
function getColorClasses(color: string) {
  return COLOR_CLASSES[color] ?? COLOR_CLASSES.zinc
}

interface BaseNodeCardProps extends NodeProps {
  data: FlowNodeData & { kind: string }
  /** 自定义中间内容（展开状态） */
  renderContent?: (properties: Record<string, unknown>) => ReactNode
  /** 自定义折叠摘要（折叠状态） */
  renderSummary?: (properties: Record<string, unknown>) => ReactNode
  /** 自定义整个卡片的 className（用于黑盒节点的特殊样式） */
  className?: string
  /** 自定义 header className（用于黑盒节点的特殊样式） */
  headerClassName?: string
  /** 是否禁用默认端口渲染（节点组等不需要端口） */
  disablePorts?: boolean
  /** 端口起始 Y 偏移 */
  portStartY?: number
}

function BaseNodeCardImpl({
  data,
  selected,
  id,
  renderContent,
  renderSummary,
  className,
  headerClassName,
  disablePorts = false,
  portStartY = 38,
}: BaseNodeCardProps) {
  // 调试高亮（emerald 闪烁）：必须在任何早期 return 之前调用 hook
  const executingNodeId = useDebugStore((s) => s.currentNodeId)
  const debugStatus = useDebugStore((s) => s.status)
  const isExecuting =
    executingNodeId === id &&
    (debugStatus === 'running' || debugStatus === 'paused')

  const def = getNodeTypeDefinition(data.kind)
  if (!def) return null

  const IconComponent =
    (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[
      def.icon
    ] ?? Box

  const c = getColorClasses(def.color)
  const properties = (data.properties ?? {}) as Record<string, unknown>

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card/95 shadow-lg backdrop-blur transition-all',
        c.border,
        selected
          ? cn(c.borderStrong, 'ring-2', c.ring)
          : 'hover:border-opacity-70',
        isExecuting && 'nexcube-debug-executing',
        className,
      )}
      style={{ minWidth: def.defaultSize.width }}
    >
      {/* 顶部 header */}
      <div
        className={cn(
          'flex items-center gap-2 border-b px-3 py-2',
          c.border,
          c.bgHeader,
          headerClassName,
        )}
      >
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg',
            c.iconBg,
            c.iconText,
          )}
        >
          <IconComponent className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground">
              {data.title}
            </span>
            <span
              className={cn(
                'rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wider',
                c.bg,
                c.text,
              )}
            >
              {def.label}
            </span>
          </div>
        </div>
        {/* 折叠按钮（仅当提供 renderSummary 时显示） */}
        {renderSummary && (
          <button
            type="button"
            className="text-muted-foreground transition-colors hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              // 折叠状态由 store 控制；本组件只读取 data.isCollapsed
              // TODO（Task 2-C 集成）：调用 store.toggleNodeCollapsed(data.id)
            }}
            aria-label={data.isCollapsed ? '展开节点' : '折叠节点'}
          >
            {data.isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* 中间内容 */}
      {!data.isCollapsed ? (
        <div className="space-y-1.5 px-3 py-2.5">
          {renderContent ? renderContent(properties) : null}
        </div>
      ) : (
        renderSummary && (
          <div className="px-3 py-1.5 text-[10px] text-muted-foreground">
            {renderSummary(properties)}
          </div>
        )
      )}

      {/* 端口渲染 */}
      {!disablePorts && (
        <>
          {/* 左侧输入端口 */}
          {def.inputPorts.map((port, i) => (
            <div
              key={port.id}
              className="absolute left-0"
              style={{ top: `${portStartY + i * 22}px` }}
            >
              <PortHandle
                dataType={port.dataType}
                position={Position.Left}
                portId={port.id}
                label={port.label}
              />
            </div>
          ))}
          {/* 右侧输出端口 */}
          {def.outputPorts.map((port, i) => (
            <div
              key={port.id}
              className="absolute right-0"
              style={{ top: `${portStartY + i * 22}px` }}
            >
              <PortHandle
                dataType={port.dataType}
                position={Position.Right}
                portId={port.id}
                label={port.label}
              />
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export const BaseNodeCard = memo(BaseNodeCardImpl)
