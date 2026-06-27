'use client'

/**
 * 黑盒节点卡片
 *
 * 特殊样式（区别于普通节点）：
 *  - 深色半透明背景（bg-zinc-950/80）
 *  - 虚线边框（border-dashed）
 *  - 警示色边框（border-amber-500/50）
 *  - 顶部警告图标 + "黑盒代码"标签
 *  - 中间显示代码片段预览（前 3 行，font-mono）
 *  - 底部"双击编辑代码"提示
 *  - 双击触发 onEditCode 事件（本阶段 toast 提示"阶段 4 实现"）
 */

import { memo } from 'react'
import { Position, type NodeProps, type Node } from '@xyflow/react'
import { AlertTriangle, Code2, MousePointerClick } from 'lucide-react'
import { toast } from 'sonner'
import { PortHandle } from './port-handle'
import { getNodeTypeDefinition, type FlowNodeData } from '@/lib/node-system'
import { cn } from '@/lib/utils'

export type BlackboxNodeData = FlowNodeData & {
  kind?: 'blackbox'
  /** 代码片段预览（data.codePreview 或 properties.code） */
  codePreview?: string
}

export type BlackboxNodeType = Node<BlackboxNodeData, 'blackbox'>

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function BlackboxNodeCardImpl(props: NodeProps<BlackboxNodeType>) {
  const { data, selected } = props

  const def = getNodeTypeDefinition('blackbox')
  if (!def) return null

  // 取代码：优先 data.codePreview，其次 properties.code
  const codeRaw = str(data.codePreview) || str(data.properties?.code, '')
  const codeLines = codeRaw.split('\n').slice(0, 3)

  return (
    <div
      className={cn(
        'group relative rounded-xl border-2 border-dashed border-amber-500/50 bg-zinc-950/80 shadow-lg backdrop-blur transition-all',
        selected
          ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/20'
          : 'hover:border-amber-400/80',
      )}
      style={{ minWidth: def.defaultSize.width }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        toast.info('双击编辑代码（阶段 4 实现）', {
          description: '将打开 Monaco 编辑器并解析为节点',
        })
      }}
    >
      {/* 顶部 header：警告色 */}
      <div className="flex items-center gap-2 border-b border-dashed border-amber-500/30 bg-amber-500/10 px-3 py-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground">
              {data.title || '黑盒代码'}
            </span>
            <span className="rounded bg-amber-500/20 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-amber-300">
              Blackbox
            </span>
          </div>
        </div>
        <Code2 className="h-3.5 w-3.5 text-amber-400/60" />
      </div>

      {/* 中间：代码预览 */}
      <div className="px-3 py-2.5">
        <div className="rounded-md bg-zinc-900/80 p-2 ring-1 ring-amber-500/10">
          <div className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-wider text-amber-400/60">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60" />
            Java 代码预览
          </div>
          <pre className="max-h-24 overflow-hidden font-mono text-[10px] leading-relaxed text-amber-200/80">
            {codeLines.length > 0 ? (
              codeLines.map((line, i) => (
                <div key={i} className="truncate">
                  <span className="mr-2 text-amber-500/40">{i + 1}</span>
                  {line || ' '}
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">{'// 双击编辑代码'}</div>
            )}
          </pre>
        </div>
      </div>

      {/* 底部：编辑提示 */}
      <div className="flex items-center justify-center gap-1.5 border-t border-dashed border-amber-500/30 px-3 py-1.5 text-[10px] text-amber-400/70">
        <MousePointerClick className="h-3 w-3" />
        双击编辑代码
      </div>

      {/* 端口 */}
      {def.inputPorts.map((port, i) => (
        <div
          key={port.id}
          className="absolute left-0"
          style={{ top: `${38 + i * 22}px` }}
        >
          <PortHandle
            dataType={port.dataType}
            position={Position.Left}
            portId={port.id}
            label={port.label}
          />
        </div>
      ))}
      {def.outputPorts.map((port, i) => (
        <div
          key={port.id}
          className="absolute right-0"
          style={{ top: `${38 + i * 22}px` }}
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

export const BlackboxNodeCard = memo(BlackboxNodeCardImpl)
