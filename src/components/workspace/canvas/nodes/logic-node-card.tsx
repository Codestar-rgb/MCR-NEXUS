'use client'

/**
 * 紧凑逻辑节点卡片
 *
 * 用于子图编辑器内的 5 种 logic_* 节点 + 2 种调试节点：
 *  - logic_event      事件监听（amber）
 *  - logic_condition  条件判断（cyan）
 *  - logic_loop       循环（teal）
 *  - logic_action     执行动作（violet）
 *  - logic_variable   变量（emerald）
 *  - debug_log        打印日志（emerald）
 *  - debug_breakpoint 断点（rose）
 *
 * 设计要点：
 *  - 比核心节点卡片更紧凑（180-200px 宽，单色边框 + 浅色背景）
 *  - 顶部：图标 + 类型标签 + 节点标题
 *  - 中间：1-2 个关键属性（按 kind 选择最有信息量的字段展示）
 *  - 端口：左输入右输出（与 BaseNodeCard 对齐，但更小）
 *  - 选中态：边框加粗 + ring
 *
 * 与 BaseNodeCard 的区别：
 *  - 不支持折叠（子图节点本就小，无需折叠）
 *  - 不显示节点类型大徽章（仅小标签）
 *  - 端口间距更小（18px）
 *  - 内边距更紧（px-2.5 py-2）
 */

import { memo } from 'react'
import { Position, type NodeProps } from '@xyflow/react'
import * as LucideIcons from 'lucide-react'
import { Box } from 'lucide-react'
import { getNodeTypeDefinition } from '@/lib/node-system'
import type { FlowNodeData } from '@/lib/node-system'
import { useDebugStore } from '@/stores/debug-store'
import { cn } from '@/lib/utils'
import { PortHandle } from './port-handle'

/** Tailwind 主题色映射（与 BaseNodeCard 的 COLOR_CLASSES 对齐，但更轻量） */
const LOGIC_COLOR_CLASSES: Record<
  string,
  { border: string; borderStrong: string; bg: string; bgHeader: string; text: string; ring: string; iconBg: string; iconText: string }
> = {
  amber: {
    border: 'border-amber-500/50',
    borderStrong: 'border-amber-400',
    bg: 'bg-amber-500/5',
    bgHeader: 'bg-amber-500/15',
    text: 'text-amber-300',
    ring: 'ring-amber-400/50',
    iconBg: 'bg-amber-500/25',
    iconText: 'text-amber-200',
  },
  cyan: {
    border: 'border-cyan-500/50',
    borderStrong: 'border-cyan-400',
    bg: 'bg-cyan-500/5',
    bgHeader: 'bg-cyan-500/15',
    text: 'text-cyan-300',
    ring: 'ring-cyan-400/50',
    iconBg: 'bg-cyan-500/25',
    iconText: 'text-cyan-200',
  },
  teal: {
    border: 'border-teal-500/50',
    borderStrong: 'border-teal-400',
    bg: 'bg-teal-500/5',
    bgHeader: 'bg-teal-500/15',
    text: 'text-teal-300',
    ring: 'ring-teal-400/50',
    iconBg: 'bg-teal-500/25',
    iconText: 'text-teal-200',
  },
  violet: {
    border: 'border-violet-500/50',
    borderStrong: 'border-violet-400',
    bg: 'bg-violet-500/5',
    bgHeader: 'bg-violet-500/15',
    text: 'text-violet-300',
    ring: 'ring-violet-400/50',
    iconBg: 'bg-violet-500/25',
    iconText: 'text-violet-200',
  },
  emerald: {
    border: 'border-emerald-500/50',
    borderStrong: 'border-emerald-400',
    bg: 'bg-emerald-500/5',
    bgHeader: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    ring: 'ring-emerald-400/50',
    iconBg: 'bg-emerald-500/25',
    iconText: 'text-emerald-200',
  },
  rose: {
    border: 'border-rose-500/50',
    borderStrong: 'border-rose-400',
    bg: 'bg-rose-500/5',
    bgHeader: 'bg-rose-500/15',
    text: 'text-rose-300',
    ring: 'ring-rose-400/50',
    iconBg: 'bg-rose-500/25',
    iconText: 'text-rose-200',
  },
}

function getColorClasses(color: string) {
  return LOGIC_COLOR_CLASSES[color] ?? LOGIC_COLOR_CLASSES.emerald
}

/* ------------------------------------------------------------------ */
/* 属性展示辅助                                                          */
/* ------------------------------------------------------------------ */

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback
}

/** 事件类型显示名映射 */
const EVENT_NAME_LABELS: Record<string, string> = {
  onTick: '每刻触发',
  onHurt: '被攻击',
  onDeath: '死亡时',
  onInteract: '被交互',
  onSpawn: '生成时',
  onRightClick: '右键点击',
}

/** 动作类型显示名映射 */
const ACTION_TYPE_LABELS: Record<string, string> = {
  spawn: '生成实体',
  damage: '造成伤害',
  teleport: '传送',
  give: '给予物品',
  playSound: '播放音效',
  spawnParticle: '生成粒子',
}

/** 循环类型显示名映射 */
const LOOP_TYPE_LABELS: Record<string, string> = {
  for: 'for',
  while: 'while',
  forEach: 'forEach',
}

/** 变量类型显示名映射 */
const VAR_TYPE_LABELS: Record<string, string> = {
  number: 'number',
  string: 'string',
  boolean: 'boolean',
}

/** 日志级别显示名映射（debug_log 节点） */
const LOG_LEVEL_LABELS: Record<string, string> = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
}

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

interface LogicNodeCardData extends FlowNodeData {
  kind: string
}

/** 根据 kind 渲染中间的属性展示 */
function renderLogicProperties(
  kind: string,
  properties: Record<string, unknown>,
): { primary: { label: string; value: string }; secondary?: { label: string; value: string } } {
  switch (kind) {
    case 'logic_event': {
      const eventName = str(properties.eventName, 'onTick')
      return {
        primary: {
          label: '事件',
          value: EVENT_NAME_LABELS[eventName] ?? eventName,
        },
      }
    }
    case 'logic_condition': {
      const condition = str(properties.condition, 'true')
      return {
        primary: { label: '条件', value: condition },
      }
    }
    case 'logic_loop': {
      const loopType = str(properties.loopType, 'for')
      const count = num(properties.count, 10)
      return {
        primary: { label: '类型', value: LOOP_TYPE_LABELS[loopType] ?? loopType },
        secondary: { label: '次数', value: String(count) },
      }
    }
    case 'logic_action': {
      const actionType = str(properties.actionType, 'spawn')
      const target = str(properties.target, '@self')
      return {
        primary: { label: '动作', value: ACTION_TYPE_LABELS[actionType] ?? actionType },
        secondary: { label: '目标', value: target },
      }
    }
    case 'logic_variable': {
      const varName = str(properties.varName, 'tempVar')
      const varType = str(properties.varType, 'number')
      const initialValue = str(properties.initialValue, '0')
      return {
        primary: { label: varName, value: initialValue },
        secondary: { label: '类型', value: VAR_TYPE_LABELS[varType] ?? varType },
      }
    }
    case 'debug_log': {
      const message = str(properties.message, 'Hello from node!')
      const logLevel = str(properties.logLevel, 'info')
      return {
        primary: { label: LOG_LEVEL_LABELS[logLevel] ?? logLevel, value: message },
      }
    }
    case 'debug_breakpoint': {
      const condition = str(properties.condition, '')
      return {
        primary: {
          label: '断点',
          value: condition ? `if ${condition}` : '总是断',
        },
      }
    }
    default:
      return { primary: { label: '', value: '' } }
  }
}

function LogicNodeCardImpl(props: NodeProps) {
  const data = props.data as LogicNodeCardData
  // 调试高亮：当前正在执行的节点（emerald 闪烁）—— 必须在 early return 之前调用 hook
  const executingNodeId = useDebugStore((s) => s.currentNodeId)
  const debugStatus = useDebugStore((s) => s.status)

  const def = getNodeTypeDefinition(data.kind)
  if (!def) return null

  const IconComponent =
    (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[def.icon] ?? Box

  const c = getColorClasses(def.color)
  const properties = (data.properties ?? {}) as Record<string, unknown>
  const { primary, secondary } = renderLogicProperties(data.kind, properties)

  const isExecuting =
    executingNodeId === props.id &&
    (debugStatus === 'running' || debugStatus === 'paused')

  // 端口起始 Y：header 高度（≈ 40px）+ 8px 内边距
  const portStartY = 32

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card/95 shadow-md backdrop-blur transition-all',
        c.border,
        props.selected
          ? cn(c.borderStrong, 'ring-2', c.ring, 'shadow-lg')
          : 'hover:border-opacity-80',
        isExecuting && 'nexcube-debug-executing',
      )}
      style={{ minWidth: def.defaultSize.width, width: def.defaultSize.width }}
    >
      {/* 顶部 header */}
      <div
        className={cn(
          'flex items-center gap-1.5 border-b px-2.5 py-1.5',
          c.border,
          c.bgHeader,
        )}
      >
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded',
            c.iconBg,
            c.iconText,
          )}
        >
          <IconComponent className="h-3 w-3" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-xs font-semibold text-foreground">
              {data.title}
            </span>
            <span
              className={cn(
                'shrink-0 rounded px-1 py-px text-[8px] font-bold uppercase tracking-wide',
                c.bg,
                c.text,
              )}
            >
              {def.label}
            </span>
          </div>
        </div>
      </div>

      {/* 中间内容：1-2 个关键属性 */}
      <div className="space-y-1 px-2.5 py-2">
        {primary.value && (
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="shrink-0 text-muted-foreground">{primary.label}</span>
            <code
              className={cn(
                'truncate rounded px-1.5 py-0.5 font-mono text-[10px] font-medium',
                c.bg,
                c.text,
              )}
              title={primary.value}
            >
              {primary.value}
            </code>
          </div>
        )}
        {secondary?.value && (
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="shrink-0 text-muted-foreground">{secondary.label}</span>
            <code
              className="truncate rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-foreground"
              title={secondary.value}
            >
              {secondary.value}
            </code>
          </div>
        )}
      </div>

      {/* 端口渲染 */}
      {/* 左侧输入端口 */}
      {def.inputPorts.map((port, i) => (
        <div
          key={port.id}
          className="absolute left-0"
          style={{ top: `${portStartY + i * 18}px` }}
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
          style={{ top: `${portStartY + i * 18}px` }}
        >
          <PortHandle
            dataType={port.dataType}
            position={Position.Right}
            portId={port.id}
            label={port.label}
          />
        </div>
      ))}
    </div>
  )
}

export const LogicNodeCard = memo(LogicNodeCardImpl)
