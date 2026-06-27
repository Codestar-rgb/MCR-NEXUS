/**
 * 自动布局引擎
 *
 * 三种布局算法：
 * - grid: 网格排列（整齐）
 * - spiral: 螺旋排列（紧凑）
 * - tree: 树形排列（按连线关系分层）
 */

import type { FlowNode, FlowEdge } from '@/lib/node-system'

export type LayoutType = 'grid' | 'spiral' | 'tree'

export function autoLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  type: LayoutType,
): Array<{ id: string; x: number; y: number }> {
  if (nodes.length === 0) return []

  switch (type) {
    case 'grid':
      return layoutGrid(nodes)
    case 'spiral':
      return layoutSpiral(nodes)
    case 'tree':
      return layoutTree(nodes, edges)
  }
}

function layoutGrid(nodes: FlowNode[]) {
  const cols = Math.ceil(Math.sqrt(nodes.length))
  const gapX = 300
  const gapY = 260
  const startX = 100
  const startY = 100

  return nodes.map((node, i) => ({
    id: node.id,
    x: startX + (i % cols) * gapX,
    y: startY + Math.floor(i / cols) * gapY,
  }))
}

function layoutSpiral(nodes: FlowNode[]) {
  const centerX = 400
  const centerY = 300
  const gap = 40
  const results: Array<{ id: string; x: number; y: number }> = []

  for (let i = 0; i < nodes.length; i++) {
    const angle = i * 0.8
    const radius = gap + i * gap * 0.5
    results.push({
      id: nodes[i].id,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    })
  }

  return results
}

function layoutTree(nodes: FlowNode[], edges: FlowEdge[]) {
  // 找根节点（没有输入连线的节点）
  const targetIds = new Set(edges.map((e) => e.target))
  const roots = nodes.filter((n) => !targetIds.has(n.id))

  // 如果没有明确的根，用第一个节点
  const rootNodes = roots.length > 0 ? roots : [nodes[0]]
  const rootIds = new Set(rootNodes.map((n) => n.id))

  // BFS 分层
  const levels = new Map<string, number>()
  const queue: Array<{ id: string; level: number }> = rootIds.size > 0
    ? rootNodes.map((n) => ({ id: n.id, level: 0 }))
    : [{ id: nodes[0].id, level: 0 }]

  const visited = new Set<string>()

  while (queue.length > 0) {
    const { id, level } = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    levels.set(id, level)

    // 找子节点
    const children = edges
      .filter((e) => e.source === id)
      .map((e) => e.target)
      .filter((tid) => !visited.has(tid))

    children.forEach((tid) => queue.push({ id: tid, level: level + 1 }))
  }

  // 未被分层的节点放最后一层
  const maxLevel = Math.max(...Array.from(levels.values()), 0)
  nodes.forEach((n) => {
    if (!levels.has(n.id)) levels.set(n.id, maxLevel + 1)
  })

  // 按层排列
  const layerGap = 280
  const nodeGap = 220
  const startX = 100
  const startY = 100

  // 按层分组
  const byLevel = new Map<number, FlowNode[]>()
  nodes.forEach((n) => {
    const level = levels.get(n.id) ?? 0
    if (!byLevel.has(level)) byLevel.set(level, [])
    byLevel.get(level)!.push(n)
  })

  const results: Array<{ id: string; x: number; y: number }> = []
  byLevel.forEach((levelNodes, level) => {
    const totalWidth = levelNodes.length * nodeGap
    const offset = (totalWidth - nodeGap) / 2
    levelNodes.forEach((node, i) => {
      results.push({
        id: node.id,
        x: 400 - offset + i * nodeGap,
        y: startY + level * layerGap,
      })
    })
  })

  return results
}
