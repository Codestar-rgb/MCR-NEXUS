'use client'

/**
 * 端口 Handle 组件
 *
 * 在节点卡片左右两侧渲染一个带数据类型颜色的 React Flow Handle。
 * Hover 时显示 tooltip：数据类型 + 描述 + 兼容类型。
 */

import * as React from 'react'
import {
  Handle,
  Position,
  type HandleProps,
} from '@xyflow/react'
import { PORT_TYPES, isPortCompatible, type PortDataType } from '@/lib/node-system'
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

/** 获取该类型兼容的所有类型列表 */
function getCompatibleTypes(dt: PortDataType): string[] {
  const allTypes = Object.keys(PORT_TYPES) as PortDataType[]
  return allTypes.filter((t) => isPortCompatible(dt, t))
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
  const [hovered, setHovered] = React.useState(false)
  const compatible = getCompatibleTypes(dataType)
  const portTypeLabel = isLeft ? '输入' : '输出'

  return (
    <>
      <Handle
        id={portId}
        type={isLeft ? 'target' : 'source'}
        position={position}
        className={cn('!h-3 !w-3 !border-2 !border-background !rounded-full cursor-crosshair')}
        style={{ backgroundColor: def.hex, borderColor: def.hex }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
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

      {/* Hover Tooltip */}
      {hovered && (
        <div
          className={cn(
            'pointer-events-none absolute top-1/2 z-50 -translate-y-1/2 rounded-lg border bg-popover/95 p-2 text-left shadow-floating backdrop-blur-sm',
            isLeft ? 'left-5' : 'right-5',
          )}
          style={{ minWidth: '160px', borderColor: `${def.hex}40` }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: def.hex }}
            />
            <span className="text-[11px] font-semibold text-foreground">
              {label ?? portTypeLabel} · {def.label}
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
            {def.description}
          </p>
          {compatible.length > 0 && (
            <div className="mt-1.5 border-t border-border/30 pt-1.5">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground/50">
                可连接类型
              </p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {compatible.map((t) => (
                  <span
                    key={t}
                    className="rounded px-1 py-px text-[9px] font-medium"
                    style={{
                      backgroundColor: `${PORT_TYPES[t].hex}20`,
                      color: PORT_TYPES[t].hex,
                    }}
                  >
                    {PORT_TYPES[t].label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
