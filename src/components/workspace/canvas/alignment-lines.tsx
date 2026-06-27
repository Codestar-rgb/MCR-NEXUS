'use client'

/**
 * 节点对齐辅助线
 *
 * 拖拽节点时，显示与其他节点对齐的辅助线：
 * - 水平对齐（Y 轴相同）
 * - 垂直对齐（X 轴相同）
 * - 中心对齐
 *
 * 使用 React Flow 的 onNodeDrag 回调计算对齐
 */

import * as React from 'react'
import { useStore, type Node } from '@xyflow/react'

interface AlignmentLine {
  type: 'horizontal' | 'vertical'
  x1: number
  y1: number
  x2: number
  y2: number
}

interface AlignmentLinesProps {
  /** 阈值（像素），距离小于此值时显示对齐线 */
  threshold?: number
}

export function AlignmentLines({ threshold = 6 }: AlignmentLinesProps) {
  const [lines, setLines] = React.useState<AlignmentLine[]>([])

  // 监听节点位置变化（拖拽中）
  const nodes = useStore((s) => s.nodes)
  const draggingNode = nodes.find((n) => n.dragging)

  React.useEffect(() => {
    if (!draggingNode) {
      setLines([])
      return
    }

    const newLines: AlignmentLine[] = []
    const dragX = draggingNode.position.x
    const dragY = draggingNode.position.y
    const dragW = draggingNode.width ?? draggingNode.measured?.width ?? 240
    const dragH = draggingNode.height ?? draggingNode.measured?.height ?? 200
    const dragCenterX = dragX + dragW / 2
    const dragCenterY = dragY + dragH / 2

    for (const node of nodes) {
      if (node.id === draggingNode.id) continue
      const nx = node.position.x
      const ny = node.position.y
      const nw = node.width ?? node.measured?.width ?? 240
      const nh = node.height ?? node.measured?.height ?? 200
      const ncx = nx + nw / 2
      const ncy = ny + nh / 2

      // 垂直对齐（X 轴）
      if (Math.abs(dragX - nx) < threshold) {
        newLines.push({
          type: 'vertical',
          x1: nx, y1: Math.min(dragY, ny),
          x2: nx, y2: Math.max(dragY + dragH, ny + nh),
        })
      } else if (Math.abs(dragCenterX - ncx) < threshold) {
        newLines.push({
          type: 'vertical',
          x1: ncx, y1: Math.min(dragY, ny),
          x2: ncx, y2: Math.max(dragY + dragH, ny + nh),
        })
      } else if (Math.abs(dragX + dragW - nx - nw) < threshold) {
        newLines.push({
          type: 'vertical',
          x1: nx + nw, y1: Math.min(dragY, ny),
          x2: nx + nw, y2: Math.max(dragY + dragH, ny + nh),
        })
      }

      // 水平对齐（Y 轴）
      if (Math.abs(dragY - ny) < threshold) {
        newLines.push({
          type: 'horizontal',
          x1: Math.min(dragX, nx), y1: ny,
          x2: Math.max(dragX + dragW, nx + nw), y2: ny,
        })
      } else if (Math.abs(dragCenterY - ncy) < threshold) {
        newLines.push({
          type: 'horizontal',
          x1: Math.min(dragX, nx), y1: ncy,
          x2: Math.max(dragX + dragW, nx + nw), y2: ncy,
        })
      } else if (Math.abs(dragY + dragH - ny - nh) < threshold) {
        newLines.push({
          type: 'horizontal',
          x1: Math.min(dragX, nx), y1: ny + nh,
          x2: Math.max(dragX + dragW, nx + nw), y2: ny + nh,
        })
      }
    }

    setLines(newLines)
  }, [nodes, draggingNode, threshold])

  if (lines.length === 0) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10"
      style={{ width: '100%', height: '100%' }}
    >
      {lines.map((line, i) => (
        <line
          key={i}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="#2dd4bf"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.5}
        />
      ))}
    </svg>
  )
}
