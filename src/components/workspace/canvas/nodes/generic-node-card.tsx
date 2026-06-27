'use client'

/**
 * 通用节点卡片（GenericNodeCard）
 *
 * 用于没有专用卡片的节点类型（function/group/equipment/weapon/food/biome/structure/dimension/potion）。
 * 基于 BaseNodeCard，显示节点描述和关键属性摘要。
 */

import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { getNodeTypeDefinition } from '@/lib/node-system'
import type { FlowNodeData } from '@/lib/node-system'
import { BaseNodeCard } from './base-node-card'

interface GenericNodeCardData extends FlowNodeData {
  kind: string
  [key: string]: unknown
}

function GenericNodeCardImpl(props: NodeProps) {
  const data = props.data as GenericNodeCardData
  const def = getNodeTypeDefinition(data.kind)

  return (
    <BaseNodeCard
      {...props}
      data={{ ...data, kind: data.kind }}
      renderContent={() => {
        if (!def) return null
        return (
          <p className="text-[11px] text-muted-foreground">{def.description}</p>
        )
      }}
      renderSummary={() => {
        if (!def) return null
        return <span>{def.label}</span>
      }}
    />
  )
}

export const GenericNodeCard = memo(GenericNodeCardImpl)
