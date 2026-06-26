'use client'

/**
 * 画布性能优化配置（Task 2-E + Task 6-C WebGL 预留）
 *
 * 针对 NexCube 万级节点画布的性能策略：
 *
 * 1. 阈值分层：
 *    - < 500 节点：完整渲染，所有交互正常
 *    - 500-2000 节点：启用虚拟渲染，仅渲染视口内节点
 *    - 2000-10000 节点：聚合显示模式（同类型节点合并为色块）
 *    - > 10000 节点：强制 WebGL 模式（预留接口，v12 实验性）
 *
 * 2. WebGL 渲染模式（React Flow v12 实验性）：
 *    - 启用条件：nodeCount > WEBGL_THRESHOLD (10000) 或开发者手动开启
 *    - 当前未真实启用，仅显示提示和返回 tier='webgl' 配置
 *    - 未来 React Flow v12 正式支持后，在 NodeCanvas 传入 renderer="webgl" 即可
 *    - 启用后预期：万级节点 60 FPS，但端口渲染/连线交互降级
 *
 * 3. WebGL renderer 配置示例（待 React Flow 支持）：
 *    ```tsx
 *    <ReactFlow
 *      nodes={nodes}
 *      edges={edges}
 *      renderer="webgl"           // 实验性 API
 *      nodeOrigin={[0.5, 0.5]}
 *      onlyRenderVisibleElements
 *      // ... 其他配置
 *    />
 *    ```
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

/** WebGL 模式启用阈值（节点数 > 此值时提示启用 WebGL） */
export const WEBGL_THRESHOLD = 10000

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

/**
 * 判断是否应启用 WebGL 渲染模式（Task 6-C 预留接口）
 *
 * 启用条件：
 *   1. 节点数超过 WEBGL_THRESHOLD（10000）
 *   2. 或开发者通过开关强制启用（forceEnable=true）
 *
 * 当前返回值仅用于 UI 提示，不影响实际渲染。
 * 等 React Flow v12 正式支持 WebGL renderer 后，
 * NodeCanvas 会根据本函数返回值传入 renderer="webgl"。
 */
export function enableWebGL(nodeCount: number, forceEnable = false): boolean {
  if (forceEnable) return true
  return nodeCount > WEBGL_THRESHOLD
}

/**
 * 获取 WebGL 启用原因（用于 UI 提示）
 */
export function getWebGLEnableReason(nodeCount: number, forceEnable = false): string | null {
  if (forceEnable) {
    return 'WebGL 模式已由开发者强制启用（实验性，渲染管线尚未真实接入）'
  }
  if (nodeCount > WEBGL_THRESHOLD) {
    return `节点数 ${nodeCount} 超过 ${WEBGL_THRESHOLD}，建议启用 WebGL 模式以保持流畅`
  }
  return null
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
  const nodes: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    data: {
      kind: string
      title: string
      properties: Record<string, unknown>
      isCollapsed: boolean
    }
  }> = []
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
