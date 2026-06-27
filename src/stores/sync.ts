'use client'

/**
 * 代码同步状态管理 —— Task 4-C
 *
 * 职责：
 *  - 维护当前 syncResult（AST 同步引擎解析代码的结果）
 *  - 维护 pendingSync 标志（true 表示有高风险变更，等待用户确认）
 *  - 维护 showRiskDialog 标志（控制高风险确认对话框的显示）
 *  - 维护"待应用的节点更新"队列（高风险确认后批量应用）
 *
 * 与 canvas store / workspace store 的关系：
 *  - canvas store：节点数据的真实源（节点变更后 → 重新生成代码 → 更新 syncResult）
 *  - workspace store：用户选中状态（节点选中 → 滚动到对应文件 / 文件选中 → 高亮节点）
 *  - sync store：仅维护"代码 → 节点"同步过程中的中间状态，不持久化
 *
 * 设计原则（"节点为基准，代码为增强"）：
 *  - syncResult.nodeUpdates 只更新节点属性，不创建/删除节点
 *  - syncResult.highRiskChanges 必须用户确认后才应用
 *  - syncResult.blackboxBlocks 仅作为提示，不自动创建黑盒节点
 */

import { create } from 'zustand'
import type {
  SyncResult,
  NodeUpdate,
  HighRiskChange,
} from '@/lib/codegen/ast-sync-engine'

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

export interface SyncStoreState {
  /** 最近一次同步结果（含节点更新/黑盒块/高风险变更） */
  syncResult: SyncResult | null
  /** 是否有高风险变更等待用户确认 */
  pendingSync: boolean
  /** 高风险确认对话框是否打开 */
  showRiskDialog: boolean
  /** 同步来源文件路径（用于通知展示） */
  sourceFilePath: string | null

  /* ----- Actions ----- */
  /** 设置最近同步结果（同时更新 pendingSync 标志） */
  setSyncResult: (result: SyncResult | null, sourceFilePath?: string | null) => void
  /** 显式打开/关闭高风险对话框 */
  setShowRiskDialog: (show: boolean) => void
  /** 标记 pendingSync（用于 confirmSync / cancelSync） */
  setPendingSync: (pending: boolean) => void
  /** 清空同步状态（切换项目/文件时调用） */
  clearSync: () => void
}

/* ------------------------------------------------------------------ */
/* 选择器                                                              */
/* ------------------------------------------------------------------ */

/** 待应用的节点更新数 */
export const selectPendingUpdateCount = (s: SyncStoreState): number =>
  s.syncResult?.nodeUpdates.length ?? 0

/** 检测到的黑盒块数 */
export const selectBlackboxCount = (s: SyncStoreState): number =>
  s.syncResult?.blackboxBlocks.length ?? 0

/** 高风险变更数 */
export const selectHighRiskCount = (s: SyncStoreState): number =>
  s.syncResult?.highRiskChanges.length ?? 0

/** 总变更数（节点更新 + 黑盒块 + 高风险） */
export const selectTotalChangeCount = (s: SyncStoreState): number => {
  if (!s.syncResult) return 0
  return (
    s.syncResult.nodeUpdates.length +
    s.syncResult.blackboxBlocks.length +
    s.syncResult.highRiskChanges.length
  )
}

/** 是否有任何同步活动（用于显示/隐藏任务提示） */
export const selectHasSyncActivity = (s: SyncStoreState): boolean =>
  selectTotalChangeCount(s) > 0

/* ------------------------------------------------------------------ */
/* Store                                                                */
/* ------------------------------------------------------------------ */

export const useSyncStore = create<SyncStoreState>((set) => ({
  syncResult: null,
  pendingSync: false,
  showRiskDialog: false,
  sourceFilePath: null,

  setSyncResult: (result, sourceFilePath = null) =>
    set({
      syncResult: result,
      // 有高风险变更时自动进入 pending 状态
      pendingSync: !!result && result.highRiskChanges.length > 0,
      // 有高风险变更时自动打开确认对话框
      showRiskDialog: !!result && result.highRiskChanges.length > 0,
      sourceFilePath,
    }),

  setShowRiskDialog: (show) => set({ showRiskDialog: show }),

  setPendingSync: (pending) => set({ pendingSync: pending }),

  clearSync: () =>
    set({
      syncResult: null,
      pendingSync: false,
      showRiskDialog: false,
      sourceFilePath: null,
    }),
}))

/* ------------------------------------------------------------------ */
/* 工具函数（供 hook 调用）                                            */
/* ------------------------------------------------------------------ */

/**
 * 应用节点更新到画布（不通过 store action，避免循环依赖）
 *
 * 此函数由 useBidirectionalSync hook 调用，传入 canvas store 的 updateNodeData
 * action 引用。我们把它放在 store 文件中是为了让 TaskNotifications 也能调用
 * （"一键应用"按钮）。
 */
export function applyNodeUpdates(
  updates: NodeUpdate[],
  applyFn: (nodeId: string, dataUpdates: Record<string, unknown>) => void,
  findNode: (id: string) => { data: { properties?: Record<string, unknown> } } | undefined,
): void {
  for (const update of updates) {
    const node = findNode(update.nodeId)
    if (!node) continue
    applyFn(update.nodeId, {
      properties: { ...node.data.properties, ...update.properties },
    })
  }
}

/**
 * 把高风险变更格式化为人类可读的列表（供对话框展示）
 */
export function formatHighRiskChanges(changes: HighRiskChange[]): string {
  return changes
    .map((c, i) => `${i + 1}. [${c.type}] 第 ${c.line} 行：${c.description}`)
    .join('\n')
}
