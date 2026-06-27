'use client'

/**
 * 构建状态管理
 *
 * 跟踪每个节点的编译状态：
 * - idle: 未构建
 * - compiling: 编译中
 * - success: 编译成功
 * - failed: 编译失败
 *
 * 构建开始时，根据节点生成代码文件，
 * 模拟逐文件编译，更新每个节点状态。
 */

import { create } from 'zustand'

export type NodeBuildStatus = 'idle' | 'compiling' | 'success' | 'failed'

interface BuildStatusState {
  /** 节点 ID → 编译状态 */
  nodeStatuses: Record<string, NodeBuildStatus>
  /** 当前是否正在构建 */
  isBuilding: boolean
  /** 构建开始时间 */
  buildStartTime: number | null
  /** 构建结束时间 */
  buildEndTime: number | null
  /** 失败节点列表 */
  failedNodes: string[]
  /** 调试模式：当前执行到的节点路径 */
  debugPath: string[]
  debugIndex: number

  setNodeStatus: (nodeId: string, status: NodeBuildStatus) => void
  startBuild: (nodeIds: string[]) => void
  finishBuild: (success: boolean) => void
  resetAll: () => void

  /* 调试 */
  startDebug: (path: string[]) => void
  stepForward: () => void
  stepBackward: () => void
  stopDebug: () => void
  getCurrentDebugNode: () => string | null
}

export const useBuildStatusStore = create<BuildStatusState>((set, get) => ({
  nodeStatuses: {},
  isBuilding: false,
  buildStartTime: null,
  buildEndTime: null,
  failedNodes: [],
  debugPath: [],
  debugIndex: -1,

  setNodeStatus: (nodeId, status) =>
    set((s) => ({
      nodeStatuses: { ...s.nodeStatuses, [nodeId]: status },
    })),

  startBuild: (nodeIds) => {
    const statuses: Record<string, NodeBuildStatus> = {}
    nodeIds.forEach((id) => (statuses[id] = 'compiling'))
    set({
      nodeStatuses: statuses,
      isBuilding: true,
      buildStartTime: Date.now(),
      buildEndTime: null,
      failedNodes: [],
    })
  },

  finishBuild: (success) =>
    set((s) => {
      const updated = { ...s.nodeStatuses }
      // 所有还在 compiling 的节点设为 success 或 failed
      Object.keys(updated).forEach((id) => {
        if (updated[id] === 'compiling') {
          updated[id] = success ? 'success' : 'failed'
        }
      })
      const failed = Object.keys(updated).filter((id) => updated[id] === 'failed')
      return {
        nodeStatuses: updated,
        isBuilding: false,
        buildEndTime: Date.now(),
        failedNodes: failed,
      }
    }),

  resetAll: () =>
    set({
      nodeStatuses: {},
      isBuilding: false,
      buildStartTime: null,
      buildEndTime: null,
      failedNodes: [],
      debugPath: [],
      debugIndex: -1,
    }),

  /* === 调试模式 === */
  startDebug: (path) =>
    set({ debugPath: path, debugIndex: 0 }),

  stepForward: () =>
    set((s) => ({
      debugIndex: Math.min(s.debugIndex + 1, s.debugPath.length - 1),
    })),

  stepBackward: () =>
    set((s) => ({
      debugIndex: Math.max(s.debugIndex - 1, 0),
    })),

  stopDebug: () =>
    set({ debugPath: [], debugIndex: -1 }),

  getCurrentDebugNode: () => {
    const { debugPath, debugIndex } = get()
    if (debugIndex < 0 || debugIndex >= debugPath.length) return null
    return debugPath[debugIndex]
  },
}))

/**
 * 获取节点构建状态的 CSS 类
 */
export function getBuildStatusClass(status: NodeBuildStatus | undefined): string {
  switch (status) {
    case 'compiling':
      return 'ring-2 ring-amber-400/50 animate-pulse'
    case 'success':
      return 'ring-2 ring-emerald-400/40'
    case 'failed':
      return 'ring-2 ring-rose-400/50'
    default:
      return ''
  }
}

/**
 * 获取节点构建状态的颜色
 */
export function getBuildStatusColor(status: NodeBuildStatus | undefined): string | null {
  switch (status) {
    case 'compiling':
      return '#fbbf24'
    case 'success':
      return '#34d399'
    case 'failed':
      return '#fb7185'
    default:
      return null
  }
}
