'use client'

/**
 * 类型化连线组件（React Flow v12 自定义 edge type='typed'）
 *
 * 根据 edge.data.dataType 显示不同颜色 + 流动动画：
 *  - entity    → rose   (#f43f5e)
 *  - boolean   → amber  (#f59e0b)
 *  - number    → cyan   (#06b6d4)
 *  - string    → emerald(#10b981)
 *  - itemstack → violet (#8b5cf6)
 *  - any       → slate  (#94a3b8)
 *
 * 连线带 dasharray + 动画（流动效果），并在中点渲染数据类型标签。
 */

import { memo } from 'react'
import * as React from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { PORT_TYPES, type PortDataType, getNodeTypeDefinition } from '@/lib/node-system'

interface TypedEdgeData {
  dataType: PortDataType | string
  label?: string
  /** 是否为新创建的边（触发绘制动画） */
  isNew?: boolean
  /** 源节点类型 */
  sourceKind?: string
  /** 目标节点类型 */
  targetKind?: string
}

type TypedEdgeProps = EdgeProps & {
  data?: TypedEdgeData
}

function TypedEdgeImpl({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: TypedEdgeProps) {
  const dataTypeRaw: string = data?.dataType ?? 'any'
  const dataType = dataTypeRaw as PortDataType
  const def = PORT_TYPES[dataType] ?? { hex: '#94a3b8', label: '未知', color: 'slate', icon: 'Circle', type: 'any', description: '' }
  const color = def.hex ?? '#94a3b8'
  const label = data?.label
  const isNew = data?.isNew ?? false
  const sourceKind = data?.sourceKind
  const targetKind = data?.targetKind

  // 生成语义化标签（基于源/目标节点类型）
  const semanticLabel = React.useMemo(() => {
    if (label) return label
    if (!sourceKind || !targetKind) return def.label
    // 根据节点类型组合生成语义名称
    const sourceDef = getNodeTypeDefinition(sourceKind)
    const targetDef = getNodeTypeDefinition(targetKind)
    const sourceLabel = sourceDef?.label ?? sourceKind
    const targetLabel = targetDef?.label ?? targetKind
    return `${sourceLabel} → ${targetLabel}`
  }, [label, sourceKind, targetKind, def.label])

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      {/* 主体连线（带流动动画） */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '6 4',
          animation: isNew
            ? 'nexcube-edge-draw 0.4s ease-out, nexcube-edge-flow 0.8s linear infinite 0.4s'
            : 'nexcube-edge-flow 0.8s linear infinite',
          opacity: selected ? 1 : 0.85,
        }}
      />
      {/* 新连线创建脉冲 */}
      {isNew && (
        <BaseEdge
          id={`${id}-pulse`}
          path={edgePath}
          style={{
            stroke: color,
            strokeWidth: 8,
            opacity: 0.3,
            filter: 'blur(3px)',
            animation: 'nexcube-edge-draw 0.4s ease-out',
          }}
        />
      )}
      {/* 选中态外发光 */}
      {selected && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{
            stroke: color,
            strokeWidth: 6,
            opacity: 0.18,
            filter: 'blur(2px)',
          }}
        />
      )}

      {/* 标签：数据类型 + 自定义 label */}
      <EdgeLabelRenderer>
        <div
          className={`pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium shadow-sm ${isNew ? 'nexcube-edge-label-pop' : ''}`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            backgroundColor: 'var(--color-card, #18181b)',
            borderColor: `${color}55`,
            color,
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span>{semanticLabel}</span>
          {label ? (
            <span className="text-muted-foreground">· {label}</span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const TypedEdge = memo(TypedEdgeImpl)
