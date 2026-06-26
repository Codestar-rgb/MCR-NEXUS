'use client'

/**
 * 画布性能优化配置（Task 2-E）
 *
 * 针对 NexCube 万级节点画布的性能策略：
 *
 * 1. 阈值分层：
 *    - < 500 节点：完整渲染，所有交互正常
 *    - 500-2000 节点：启用虚拟渲染，仅渲染视口内节点
 *    - 2000-10000 节点：聚合显示模式（同类型节点合并为色块）
 *    - > 10000 节点：强制 WebGL 模式（预留接口，v12 实验性）
 */

import { useState, useEffect } from 'react'

export type PerformanceTier = 'full' | 'virtual' | 'aggregated' | 'webgl'

export interface PerformanceConfig {
  tier: PerformanceTier
  nodeCount: number
  onlyRenderVisibleElements: boolean
  nodesDraggable: boolean
  showNodeDetails: boolean
  miniMapEnabled: boolean
  aggregated: boolean
  hint?: string
}

const TIERS: { threshold: number; tier: PerformanceTier }[] = [
  { threshold: 500, tier: 'full' },
  { threshold: 2000, tier: 'virtual' },
  { threshold: 10000, tier: 'aggregated' },
  { threshold: Infinity, tier: 'webgl' },
]

export function getPerformanceConfig(nodeCount: number): PerformanceConfig {
  const tier = TIERS.find((t) => nodeCount < t.threshold)?.tier ?? 'webgl'
  const base: PerformanceConfig = {
    tier, nodeCount,
    onlyRenderVisibleElements: false,
    nodesDraggable: true,
    showNodeDetails: true,
    miniMapEnabled: true,
    aggregated: false,
  }
  switch (tier) {
    case 'full': return base
    case 'virtual':
      return { ...base, onlyRenderVisibleElements: true, hint: '已启用虚拟渲染（仅渲染视口内节点）' }
    case 'aggregated':
      return {
        ...base, onlyRenderVisibleElements: true, nodesDraggable: false,
        showNodeDetails: false, miniMapEnabled: false, aggregated: true,
        hint: '已切换聚合显示模式（同类型节点合并显示）',
      }
    case 'webgl':
      return {
        ...base, onlyRenderVisibleElements: true, nodesDraggable: false,
        showNodeDetails: false, miniMapEnabled: false, aggregated: true,
        hint: '已切换 WebGL 渲染模式（实验性）',
      }
  }
}

export function usePerformanceMonitor() {
  const [fps, setFps] = useState(60)
  const [isLowPerf, setIsLowPerf] = useState(false)

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    let rafId: number
    let mounted = true
    const measure = () => {
      if (!mounted) return
      frameCount++
      const now = performance.now()
      if (now - lastTime >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastTime))
        setFps(currentFps)
        setIsLowPerf(currentFps < 30)
        frameCount = 0
        lastTime = now
      }
      rafId = requestAnimationFrame(measure)
    }
    rafId = requestAnimationFrame(measure)
    return () => { mounted = false; cancelAnimationFrame(rafId) }
  }, [])

  return { fps, isLowPerf }
}

/** 批量生成测试节点（性能压测用） */
export function generateTestNodes(count: number) {
  const types = ['entity', 'block', 'item']
  const names = ['Ruby', 'Sapphire', 'Emerald', 'Topaz', 'Amethyst', 'Diamond']
  const nodes = []
  const cols = Math.ceil(Math.sqrt(count))
  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    nodes.push({
      id: `test-node-${i}`,
      type: types[i % types.length],
      position: { x: col * 280, y: row * 260 },
      data: {
        kind: types[i % types.length],
        title: `${names[i % names.length]} ${i}`,
        properties: {
          name: `${names[i % names.length]} ${i}`,
          registryId: `test_${i}`,
          health: 20,
          attack: 5,
        },
        isCollapsed: false,
      },
    })
  }
  return nodes
}
