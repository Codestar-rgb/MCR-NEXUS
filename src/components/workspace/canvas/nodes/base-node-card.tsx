'use client'

/**
 * 通用节点卡片基础组件
 *
 * 所有节点卡片（实体/方块/物品/黑盒/节点组）共享的骨架：
 *  - 顶部 header：图标 + 类型标签 + 标题 + 折叠按钮
 *  - 中间内容区（由子类通过 renderContent 填充）
 *  - 端口渲染（根据 NODE_TYPE_REGISTRY 的 inputPorts/outputPorts）
 *  - 选中状态高亮（含 Task 6-C 选中 ring 脉冲动画）
 *  - 折叠状态（只显示 header + summary）
 *
 * Tailwind 不支持动态类名（border-${color}-500），因此使用预定义的
 * COLOR_CLASSES 映射对象把 tailwind 色名映射为完整类名字符串。
 */

import { memo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Position, type NodeProps } from '@xyflow/react'
import { ChevronDown, ChevronRight, Box } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { getNodeTypeDefinition } from '@/lib/node-system'
import type { FlowNodeData } from '@/lib/node-system'
import { useDebugStore } from '@/stores/debug-store'
import { useBuildStatusStore } from '@/stores/build-status'
import { cn } from '@/lib/utils'
import { PortHandle } from './port-handle'
import { COLOR_CLASSES } from './color-classes'

/** Tailwind 主题色映射（从 color-classes.ts 导入，统一降低饱和度） */
export { COLOR_CLASSES } from './color-classes'

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

  // 构建状态
  const buildStatus = useBuildStatusStore((s) => s.nodeStatuses[id] ?? 'idle')
  const isDebugNode = useBuildStatusStore((s) => s.debugPath[s.debugIndex] === id)

  const def = getNodeTypeDefinition(data.kind)
  if (!def) return null

  const IconComponent =
    (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[
      def.icon
    ] ?? Box

  const c = getColorClasses(def.color)
  const properties = (data.properties ?? {}) as Record<string, unknown>

  // 构建状态颜色
  const buildRingClass =
    buildStatus === 'compiling' ? 'ring-2 ring-amber-400/50' :
    buildStatus === 'success' ? 'ring-2 ring-emerald-400/40' :
    buildStatus === 'failed' ? 'ring-2 ring-rose-400/50' : ''
  const debugRingClass = isDebugNode ? 'ring-2 ring-cyan-400/60 shadow-glow' : ''

  return (
    <div
      className={cn(
        'group relative rounded-xl border bg-card/95 shadow-lg backdrop-blur transition-all',
        c.border,
        selected
          ? cn(c.borderStrong, 'ring-2', c.ring)
          : 'hover:border-opacity-70',
        buildRingClass,
        debugRingClass,
        isExecuting && 'nexcube-debug-executing',
        className,
      )}
      style={{ minWidth: def.defaultSize.width }}
    >
      {/* 选中时 ring 脉冲动画 */}
      {selected && (
        <motion.span
          aria-hidden
          className={cn('pointer-events-none absolute inset-0 rounded-xl ring-2', c.ring)}
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: [0.6, 0.2, 0.6], scale: [1, 1.015, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ willChange: 'transform, opacity' }}
        />
      )}

      {/* 构建状态指示器（右上角小圆点） */}
      {buildStatus !== 'idle' && (
        <div
          className="absolute right-2 top-2 z-10 flex items-center gap-1"
          aria-label={`构建状态: ${buildStatus}`}
        >
          {buildStatus === 'compiling' && (
            <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          )}
          {buildStatus === 'success' && (
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
          )}
          {buildStatus === 'failed' && (
            <div className="h-2 w-2 rounded-full bg-rose-400" />
          )}
        </div>
      )}
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
            <PortHandle
              key={port.id}
              dataType={port.dataType}
              position={Position.Left}
              portId={port.id}
              label={port.label}
            />
          ))}
          {/* 右侧输出端口 */}
          {def.outputPorts.map((port, i) => (
            <PortHandle
              key={port.id}
              dataType={port.dataType}
              position={Position.Right}
              portId={port.id}
              label={port.label}
            />
          ))}
        </>
      )}
    </div>
  )
}

export const BaseNodeCard = memo(BaseNodeCardImpl)
