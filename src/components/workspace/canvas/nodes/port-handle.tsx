'use client'

/**
 * 端口 Handle 组件
 *
 * 在节点卡片左右两侧渲染一个带数据类型颜色的 React Flow Handle。
 * 端口类型颜色由 PORT_TYPES 注册表统一规定：
 *  - entity    → rose
 *  - boolean   → amber
 *  - number    → cyan
 *  - string    → emerald
 *  - itemstack → violet
 *  - any       → slate
 *
 * 端口标签根据位置自动定位：
 *  - 左侧端口（target）：标签在 Handle 右侧（卡片内部）
 *  - 右侧端口（source）：标签在 Handle 左侧（卡片内部）
 */

import {
  Handle,
  Position,
  type HandleProps,
} from '@xyflow/react'
import { PORT_TYPES, type PortDataType } from '@/lib/node-system'
import { cn } from '@/lib/utils'

interface PortHandleProps extends Omit<HandleProps, 'position' | 'type'> {
  /** 端口数据类型，决定 Handle 颜色 */
  dataType: PortDataType
  /** 端口位置（Left=输入 / Right=输出） */
  position: Position
  /** 端口唯一 ID（在同一节点内唯一） */
  portId: string
  /** 显示标签 */
  label?: string
  /** 是否显示标签，默认 true */
  showLabel?: boolean
}

export function PortHandle({
  dataType,
  position,
  portId,
  label,
  showLabel = true,
  ...rest
}: PortHandleProps) {
  const def = PORT_TYPES[dataType]
  const isLeft = position === Position.Left

  return (
    <>
      <Handle
        id={portId}
        type={isLeft ? 'target' : 'source'}
        position={position}
        className={cn('!h-3 !w-3 !border-2 !border-background !rounded-full')}
        style={{ backgroundColor: def.hex, borderColor: def.hex }}
        {...rest}
      />
      {showLabel && label && (
        <div
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-medium',
            isLeft ? 'left-3' : 'right-3',
          )}
          style={{ color: def.hex }}
        >
          {label}
        </div>
      )}
    </>
  )
}
