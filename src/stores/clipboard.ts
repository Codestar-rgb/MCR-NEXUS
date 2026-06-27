'use client'

/**
 * 节点剪贴板 + 撤销/重做系统
 *
 * - Ctrl+C: 复制选中节点
 * - Ctrl+V: 粘贴节点（偏移 40px）
 * - Ctrl+Z: 撤销
 * - Ctrl+Shift+Z / Ctrl+Y: 重做
 *
 * 撤销栈记录节点/连线的快照（最多 50 条）
 */

import { create } from 'zustand'
import type { FlowNode, FlowEdge } from '@/lib/node-system'

interface HistoryEntry {
  id: string
  description: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  timestamp: number
}

interface ClipboardState {
  /** 剪贴板中的节点 */
  clipboard: FlowNode[]
  /** 撤销栈 */
  undoStack: HistoryEntry[]
  /** 重做栈 */
  redoStack: HistoryEntry[]
  /** 是否正在执行撤销/重做（避免循环记录） */
  isApplying: boolean

  copy: (nodes: FlowNode[]) => void
  paste: () => FlowNode[]
  hasClipboard: () => boolean

  pushUndo: (nodes: FlowNode[], edges: FlowEdge[], description: string) => void
  undo: () => HistoryEntry | null
  redo: () => HistoryEntry | null
  canUndo: () => boolean
  canRedo: () => boolean
  clear: () => void
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  clipboard: [],
  undoStack: [],
  redoStack: [],
  isApplying: false,

  copy: (nodes) => {
    if (nodes.length === 0) return
    // 深拷贝
    const copies = nodes.map((n) => ({
      ...n,
      data: { ...n.data, properties: { ...(n.data.properties ?? {}) } },
      selected: false,
    }))
    set({ clipboard: copies })
  },

  paste: () => {
    const { clipboard } = get()
    if (clipboard.length === 0) return []
    // 创建新节点（新 ID + 偏移位置）
    const pasted = clipboard.map((n) => ({
      ...n,
      id: `paste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      position: { x: n.position.x + 40, y: n.position.y + 40 },
      data: { ...n.data, title: `${n.data.title} 副本` },
      selected: false,
    }))
    return pasted
  },

  hasClipboard: () => get().clipboard.length > 0,

  pushUndo: (nodes, edges, description) => {
    if (get().isApplying) return
    const entry: HistoryEntry = {
      id: `undo-${Date.now()}`,
      description,
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now(),
    }
    set((s) => ({
      undoStack: [...s.undoStack, entry].slice(-50),
      redoStack: [], // 新操作清空 redo
    }))
  },

  undo: () => {
    const { undoStack, isApplying } = get()
    if (undoStack.length === 0 || isApplying) return null
    const entry = undoStack[undoStack.length - 1]
    set((s) => ({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, entry],
      isApplying: true,
    }))
    // 释放 isApplying
    setTimeout(() => set({ isApplying: false }), 100)
    return entry
  },

  redo: () => {
    const { redoStack, isApplying } = get()
    if (redoStack.length === 0 || isApplying) return null
    const entry = redoStack[redoStack.length - 1]
    set((s) => ({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, entry],
      isApplying: true,
    }))
    setTimeout(() => set({ isApplying: false }), 100)
    return entry
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  clear: () => set({ clipboard: [], undoStack: [], redoStack: [], isApplying: false }),
}))
