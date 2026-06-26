'use client'

/**
 * 通用节点卡片（无专用卡片的节点类型回退方案）
 *
 * 用于 function / event_trigger / event_listener / math / logic 等暂未提供
 * 专用卡片实现的节点类型。基于 BaseNodeCard，仅展示 description + 关键字段。
 */

import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { BaseNodeCard } from './base-node-card'
import type { FlowNodeData } from '@/lib/node-system'
import { getNodeTypeDefinition, type NodeKind } from '@/lib/node-system'

export interface GenericNodeData extends FlowNodeData {
  kind: NodeKind
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function GenericNodeCardImpl(props: NodeProps) {
  const data = props.data as GenericNodeData
  const def = getNodeTypeDefinition(data.kind)

  return (
    <BaseNodeCard
      {...props}
      data={{ ...data, kind: data.kind }}
      renderContent={(p) => {
        if (!def) return null
        switch (data.kind) {
          case 'math':
          case 'logic': {
            const operator = str(p.operator, 'add')
            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">运算符</span>
                  <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                    {operator}
                  </code>
                </div>
                <p className="text-[11px] text-muted-foreground">{def.description}</p>
              </div>
            )
          }
          case 'event_trigger': {
            const eventName = str(p.eventName, 'onPlayerJoin')
            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">事件名</span>
                  <code className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                    {eventName}
                  </code>
                </div>
                <p className="text-[11px] text-muted-foreground">{def.description}</p>
              </div>
            )
          }
          case 'function': {
            const inputCount = num(p.inputCount, 1)
            const outputCount = num(p.outputCount, 1)
            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">输入参数</span>
                  <span className="font-mono text-foreground">{inputCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">输出参数</span>
                  <span className="font-mono text-foreground">{outputCount}</span>
                </div>
              </div>
            )
          }
          default:
            return (
              <p className="text-[11px] text-muted-foreground">{def.description}</p>
            )
        }
      }}
      renderSummary={(p) => {
        if (!def) return null
        if (data.kind === 'math' || data.kind === 'logic') {
          return <span>运算符 {str(p.operator, 'add')}</span>
        }
        if (data.kind === 'event_trigger') {
          return <span>{str(p.eventName, 'onPlayerJoin')}</span>
        }
        return <span>{def.label}</span>
      }}
    />
  )
}

export const GenericNodeCard = memo(GenericNodeCardImpl)
