'use client'

/**
 * 调试状态管理（Task 3-C）
 *
 * 维护：
 *  - status：调试状态机 idle / running / paused / stopped
 *  - currentNodeId：当前正在执行的节点 ID（用于高亮）
 *  - logs：debug_log 节点输出的日志条目
 *  - breakpoints：所有 debug_breakpoint 节点（动态从 canvas store 推导）
 *  - executionQueue：本次调试的节点执行队列（顺序由 BFS 拓扑排序决定）
 *
 * Mock 执行策略：
 *  - start()：从入口节点（无入边的节点）开始 BFS 拓扑排序，生成执行队列
 *  - 依次高亮队列中每个节点（500ms 停留）
 *  - 遇到 debug_log 节点：把 message 推入 logs
 *  - 遇到 debug_breakpoint 节点：暂停 + 等待 resume()
 *  - 队列执行完毕：自动 stop()
 *
 * 真实执行引擎在后续阶段接入（Mock 现仅做 UI 演示）。
 */

import { create } from 'zustand'
import type { FlowNode, FlowEdge } from '@/lib/node-system'

export type DebugStatus = 'idle' | 'running' | 'paused' | 'stopped'

export interface DebugLogEntry {
  id: string
  nodeId: string
  nodeTitle: string
  level: 'info' | 'warn' | 'error'
  message: string
  timestamp: number
}

export interface BreakpointInfo {
  nodeId: string
  nodeTitle: string
  condition: string
  hit: boolean
}

interface DebugState {
  /* 状态 */
  status: DebugStatus
  currentNodeId: string | null
  logs: DebugLogEntry[]
  /** 已命中且暂停在的断点 ID */
  pausedAtBreakpointId: string | null

  /* 控制 */
  start: (nodes: FlowNode[], edges: FlowEdge[]) => Promise<void>
  pause: () => void
  resume: () => void
  step: () => void
  stop: () => void
  clearLogs: () => void

  /* 内部 */
  _resolveResume: (() => void) | null
}

/** 生成简易唯一 ID */
function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return `${prefix}_${time}_${rand}`
}

/**
 * 拓扑排序：从入口节点（无入边）开始 BFS
 *
 * - 入口节点：没有任何输入连线的节点（即不是任何 edge 的 target）
 * - 按 BFS 顺序加入队列，已访问的节点不重复加入
 * - 不要求严格拓扑（带环图也能输出可执行序列，只是会重复访问被剪枝）
 */
function topologicalOrder(
  nodes: FlowNode[],
  edges: FlowEdge[],
): FlowNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const incomingCount = new Map<string, number>()
  const outgoing = new Map<string, string[]>()

  for (const n of nodes) {
    incomingCount.set(n.id, 0)
    outgoing.set(n.id, [])
  }
  for (const e of edges) {
    if (!nodeMap.has(e.source) || !nodeMap.has(e.target)) continue
    incomingCount.set(e.target, (incomingCount.get(e.target) ?? 0) + 1)
    outgoing.get(e.source)?.push(e.target)
  }

  const queue: string[] = []
  for (const [id, count] of incomingCount.entries()) {
    if (count === 0) queue.push(id)
  }

  // 如果没有入口节点（全是环），取第一个节点作为起点
  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id)
  }

  const visited = new Set<string>()
  const ordered: FlowNode[] = []

  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    const node = nodeMap.get(id)
    if (node) ordered.push(node)
    for (const next of outgoing.get(id) ?? []) {
      if (!visited.has(next)) queue.push(next)
    }
  }

  // 兜底：把未访问的节点追加到末尾
  for (const n of nodes) {
    if (!visited.has(n.id)) ordered.push(n)
  }

  return ordered
}

const STEP_DELAY_MS = 500

export const useDebugStore = create<DebugState>((set, get) => {
  /** 内部：等待 resume 被调用 */
  const waitResume = (): Promise<void> => {
    return new Promise((resolve) => {
      set({ _resolveResume: resolve })
    })
  }

  /** 内部：执行单步逻辑 */
  const executeNode = async (node: FlowNode): Promise<'break' | 'continue'> => {
    set({ currentNodeId: node.id })

    if (node.data.kind === 'debug_log') {
      const props = (node.data.properties ?? {}) as Record<string, unknown>
      const message = typeof props.message === 'string' ? props.message : ''
      const level =
        props.logLevel === 'warn' || props.logLevel === 'error'
          ? (props.logLevel as 'warn' | 'error')
          : 'info'
      const entry: DebugLogEntry = {
        id: makeId('log'),
        nodeId: node.id,
        nodeTitle: String(node.data.title ?? '未命名节点'),
        level,
        message,
        timestamp: Date.now(),
      }
      set((s) => ({ logs: [...s.logs, entry] }))
    }

    if (node.data.kind === 'debug_breakpoint') {
      const props = (node.data.properties ?? {}) as Record<string, unknown>
      const condition =
        typeof props.condition === 'string' ? props.condition : ''
      set({
        status: 'paused',
        pausedAtBreakpointId: node.id,
      })
      // 推入断点命中日志
      const entry: DebugLogEntry = {
        id: makeId('log'),
        nodeId: node.id,
        nodeTitle: String(node.data.title ?? '断点'),
        level: 'warn',
        message: condition
          ? `命中条件断点：${condition}`
          : '命中断点（总是断）',
        timestamp: Date.now(),
      }
      set((s) => ({ logs: [...s.logs, entry] }))
      await waitResume()
      set({ status: 'running', pausedAtBreakpointId: null })
      return 'break'
    }

    // 普通节点：停留 500ms
    await new Promise((r) => setTimeout(r, STEP_DELAY_MS))
    return 'continue'
  }

  return {
    status: 'idle',
    currentNodeId: null,
    logs: [],
    pausedAtBreakpointId: null,
    _resolveResume: null,

    start: async (nodes, edges) => {
      if (get().status === 'running') return
      set({
        status: 'running',
        logs: [],
        currentNodeId: null,
        pausedAtBreakpointId: null,
        _resolveResume: null,
      })

      const queue = topologicalOrder(nodes, edges)

      for (const node of queue) {
        // 检查是否被外部 stop
        if (get().status === 'stopped') break
        // 如果是被 pause（断点），等待 resume
        while (get().status === 'paused') {
          await waitResume()
          if (get().status === 'stopped') break
        }
        if (get().status === 'stopped') break

        // 跳过节点组（group 节点不执行）
        if (node.data.kind === 'group') continue

        await executeNode(node)
      }

      // 完成后归位
      if (get().status !== 'stopped') {
        set({
          status: 'idle',
          currentNodeId: null,
          pausedAtBreakpointId: null,
          _resolveResume: null,
        })
      }
    },

    pause: () => {
      if (get().status === 'running') {
        set({ status: 'paused' })
      }
    },

    resume: () => {
      const { _resolveResume, status } = get()
      if (status === 'paused') {
        set({ status: 'running', _resolveResume: null })
        _resolveResume?.()
      }
    },

    step: () => {
      // step 在 paused 状态下相当于 resume（执行到下一个节点或断点）
      const { status, _resolveResume } = get()
      if (status === 'paused') {
        set({ status: 'running', _resolveResume: null })
        _resolveResume?.()
      }
    },

    stop: () => {
      const { _resolveResume } = get()
      set({
        status: 'stopped',
        currentNodeId: null,
        pausedAtBreakpointId: null,
        _resolveResume: null,
      })
      _resolveResume?.()
      // 重置为 idle 以便下次启动
      setTimeout(() => set({ status: 'idle' }), 100)
    },

    clearLogs: () => set({ logs: [] }),
  }
})

/* ------------------------------------------------------------------ */
/* 选择器                                                              */
/* ------------------------------------------------------------------ */

export const selectBreakpoints = (
  nodes: FlowNode[],
): BreakpointInfo[] => {
  return nodes
    .filter((n) => n.data.kind === 'debug_breakpoint')
    .map((n) => {
      const props = (n.data.properties ?? {}) as Record<string, unknown>
      return {
        nodeId: n.id,
        nodeTitle: String(n.data.title ?? '断点'),
        condition:
          typeof props.condition === 'string' ? props.condition : '',
        hit: false,
      }
    })
}
