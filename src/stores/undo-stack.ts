'use client'

/**
 * 撤销 / 重做栈（Task 4-D）
 *
 * 用途：在节点画布 / 属性面板 / 代码编辑器中追踪用户操作的「反向补丁」，
 *       支持 Ctrl+Z / Ctrl+Shift+Z 全局快捷键回滚。
 *
 * 设计原则：
 *  - 每条 UndoEntry 仅记录「最小还原信息」（属性 diff / 位置 / 标题）
 *  - 栈上限 50 条（FIFO 截断，丢弃最早条目）
 *  - 新操作进入 stack 时清空 redoStack（与所有 IDE 一致）
 *  - 不持久化（刷新页面后撤销栈为空，符合预期）
 *
 * 与 useKeyboardShortcuts 的协作：
 *  - Ctrl+Z  → undo()
 *  - Ctrl+Y / Ctrl+Shift+Z → redo()
 *  - 撤销后由调用方（property-panel / node-canvas）根据 previousState 还原 UI
 *
 * 高风险修改拦截（阶段 5 完整接入）：
 *  - 撤销栈本身不拦截，但 pushUndo 时由调用方检查 isHighRisk 标记
 *    （由 lib/safety-guard 统一判定，本 store 只存储）
 */

import { create } from 'zustand'

/* ------------------------------------------------------------------ */
/* 类型定义                                                            */
/* ------------------------------------------------------------------ */

/** 单条撤销记录（描述一次「反向补丁」） */
export interface UndoEntry {
  /** 唯一 ID（便于日志与调试） */
  id: string
  /** 创建时间戳（ms） */
  timestamp: number
  /** 人类可读描述，如 "修改生命值 80→150" / "删除节点 RubyGolem" */
  description: string
  /** 操作类型（决定调用方如何还原） */
  kind: UndoEntryKind
  /** 涉及的节点 ID（撤销/重做目标） */
  nodeId?: string
  /** 涉及的代码文件路径（代码编辑器用） */
  filePath?: string
  /** 旧状态快照（撤销时还原） */
  previousState: UndoStateSnapshot
  /** 新状态快照（重做时还原，可选） */
  nextState?: UndoStateSnapshot
  /** 是否为高风险操作（影响构建/破坏性删除等） */
  isHighRisk?: boolean
  /** 来源标签（便于追溯） */
  source?: 'property-panel' | 'node-canvas' | 'code-editor' | 'export' | 'system'
}

/** 撤销条目类型 */
export type UndoEntryKind =
  | 'property-change' // 属性面板字段变更
  | 'node-move' // 节点位置变更
  | 'node-create' // 创建节点
  | 'node-delete' // 删除节点
  | 'node-title' // 节点标题变更
  | 'connection-create' // 创建连线
  | 'connection-delete' // 删除连线
  | 'code-edit' // 代码编辑器内容变更
  | 'bulk' // 批量操作（一次包含多条变更）

/** 撤销状态快照（按需携带字段，避免大对象） */
export interface UndoStateSnapshot {
  /** 属性键值对（property-change / bulk 时携带） */
  properties?: Record<string, unknown>
  /** 节点位置（node-move 时携带） */
  position?: { x: number; y: number }
  /** 节点标题（node-title 时携带） */
  title?: string
  /** 代码内容（code-edit 时携带） */
  code?: string
  /** 节点完整快照（node-create / node-delete 时携带） */
  nodeSnapshot?: {
    id: string
    type: string
    title: string
    positionX: number
    positionY: number
    properties: string
    subGraphId?: string | null
    parentId?: string | null
  }
}

/** Store 接口 */
export interface UndoState {
  /** 撤销栈（最新在末尾） */
  stack: UndoEntry[]
  /** 重做栈（最新在末尾） */
  redoStack: UndoEntry[]
  /** 当前是否处于「撤销中」标记，避免撤销操作自身被记入栈 */
  isApplyingUndo: boolean

  /** 推入一条撤销记录 */
  pushUndo: (entry: Omit<UndoEntry, 'id' | 'timestamp'> & Partial<Pick<UndoEntry, 'id' | 'timestamp'>>) => UndoEntry
  /** 执行撤销，返回弹出的条目（调用方据此还原 UI）；栈空返回 null */
  undo: () => UndoEntry | null
  /** 执行重做，返回弹出的条目；栈空返回 null */
  redo: () => UndoEntry | null
  /** 是否可撤销 */
  canUndo: () => boolean
  /** 是否可重做 */
  canRedo: () => boolean
  /** 清空两个栈（切换项目时调用） */
  clear: () => setClear
  /** 标记撤销/重做是否正在应用（用于避免无限递归） */
  setApplying: (v: boolean) => void
  /** 返回最近 N 条记录（用于 UI 列表展示） */
  recentEntries: (limit?: number) => UndoEntry[]
}

type setClear = void

/* ------------------------------------------------------------------ */
/* 工具                                                                */
/* ------------------------------------------------------------------ */

const MAX_STACK = 50

function makeId(prefix = 'undo'): string {
  const rand = Math.random().toString(36).slice(2, 8)
  const time = Date.now().toString(36)
  return `${prefix}_${time}_${rand}`
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export const useUndoStack = create<UndoState>((set, get) => ({
  stack: [],
  redoStack: [],
  isApplyingUndo: false,

  pushUndo: (entry) => {
    const full: UndoEntry = {
      id: entry.id ?? makeId(),
      timestamp: entry.timestamp ?? Date.now(),
      description: entry.description,
      kind: entry.kind,
      nodeId: entry.nodeId,
      filePath: entry.filePath,
      previousState: entry.previousState,
      nextState: entry.nextState,
      isHighRisk: entry.isHighRisk,
      source: entry.source,
    }
    set((s) => ({
      stack: [...s.stack, full].slice(-MAX_STACK),
      redoStack: [], // 新操作清空 redo
    }))
    return full
  },

  undo: () => {
    const { stack } = get()
    if (stack.length === 0) return null
    const entry = stack[stack.length - 1]
    set((s) => ({
      stack: s.stack.slice(0, -1),
      redoStack: [...s.redoStack, entry],
    }))
    return entry
  },

  redo: () => {
    const { redoStack } = get()
    if (redoStack.length === 0) return null
    const entry = redoStack[redoStack.length - 1]
    set((s) => ({
      stack: [...s.stack, entry],
      redoStack: s.redoStack.slice(0, -1),
    }))
    return entry
  },

  canUndo: () => get().stack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  clear: () => set({ stack: [], redoStack: [], isApplyingUndo: false }) as setClear,

  setApplying: (v) => set({ isApplyingUndo: v }),

  recentEntries: (limit = 10) => {
    const { stack } = get()
    return [...stack].slice(-limit).reverse()
  },
}))

/* ------------------------------------------------------------------ */
/* 便捷工具函数（非 hook，可在事件处理器内调用）                       */
/* ------------------------------------------------------------------ */

/** 推入属性变更撤销记录 */
export function pushPropertyChange(args: {
  nodeId: string
  description: string
  previousProperties: Record<string, unknown>
  nextProperties: Record<string, unknown>
  source?: UndoEntry['source']
  isHighRisk?: boolean
}): UndoEntry {
  return useUndoStack.getState().pushUndo({
    description: args.description,
    kind: 'property-change',
    nodeId: args.nodeId,
    previousState: { properties: args.previousProperties },
    nextState: { properties: args.nextProperties },
    source: args.source ?? 'property-panel',
    isHighRisk: args.isHighRisk,
  })
}

/** 推入节点移动撤销记录 */
export function pushNodeMove(args: {
  nodeId: string
  description?: string
  previous: { x: number; y: number }
  next: { x: number; y: number }
}): UndoEntry {
  return useUndoStack.getState().pushUndo({
    description: args.description ?? `移动节点 ${args.nodeId.slice(-6)}`,
    kind: 'node-move',
    nodeId: args.nodeId,
    previousState: { position: args.previous },
    nextState: { position: args.next },
    source: 'node-canvas',
  })
}

/** 推入节点删除撤销记录（高风险） */
export function pushNodeDelete(args: {
  nodeId: string
  nodeSnapshot: UndoStateSnapshot['nodeSnapshot']
  description?: string
}): UndoEntry {
  return useUndoStack.getState().pushUndo({
    description: args.description ?? `删除节点 ${args.nodeSnapshot?.title ?? args.nodeId.slice(-6)}`,
    kind: 'node-delete',
    nodeId: args.nodeId,
    previousState: { nodeSnapshot: args.nodeSnapshot },
    source: 'node-canvas',
    isHighRisk: true,
  })
}
