'use client'

/**
 * NexCube 构建状态管理（Task 5-C）
 *
 * 职责：
 *  - 维护当前构建任务的实时状态（idle / running / success / failed）
 *  - 缓存原始日志输出 + 解析出的结构化卡片
 *  - 维护构建历史列表（最多 20 条），由 API 同步
 *
 * 数据流：
 *  startBuild(task) → appendOutput(chunk)* → finishBuild(success, parsedCards, duration)
 *                                                            ↓
 *                                              POST /api/projects/[id]/builds
 *                                                            ↓
 *                                              loadHistory(list) ← GET /api/projects/[id]/builds
 *
 * 不持久化（refresh 后即清空当前进行中的构建），但构建历史持久化到 DB。
 */

import { create } from 'zustand'
import type { ParsedLogCard } from '@/lib/capabilities/types'

/* ------------------------------------------------------------------ */
/* 类型定义                                                            */
/* ------------------------------------------------------------------ */

export type BuildStatus = 'idle' | 'running' | 'success' | 'failed'
export type BuildTask = 'build' | 'runClient' | 'runServer' | 'clean' | null

export interface BuildHistoryEntry {
  id: string
  task: string
  status: 'success' | 'failed'
  duration: number
  createdAt: number
  /** 日志前 200 字符预览 */
  outputPreview: string
  /** 完整日志（仅本地查看详情时填充，从 API 单独加载） */
  fullOutput?: string
  /** 解析卡片数量 */
  cardCount: number
}

export interface BuildState {
  /* 当前构建状态 */
  status: BuildStatus
  task: BuildTask
  startTime: number | null
  /** 原始 Gradle 日志（流式累积） */
  output: string
  /** 解析后的卡片（构建结束时一次性填充） */
  parsedCards: ParsedLogCard[]
  /** 构建时长（ms），构建中实时更新 */
  duration: number

  /* 构建历史（最多 20 条） */
  history: BuildHistoryEntry[]

  /* Actions */
  /** 启动一次构建（清空旧输出 + 切到 running） */
  startBuild: (task: NonNullable<BuildTask>) => void
  /** 追加流式输出 chunk */
  appendOutput: (chunk: string) => void
  /** 完成构建（写入历史 + 切到 success/failed） */
  finishBuild: (
    success: boolean,
    parsedCards: ParsedLogCard[],
    duration: number,
  ) => void
  /** 实时更新耗时（用于 UI 进度展示） */
  tickDuration: () => void
  /** 清空当前输出（不删除历史） */
  clearOutput: () => void
  /** 重置为 idle（不删除历史） */
  resetStatus: () => void
  /** 替换历史列表（来自 API） */
  loadHistory: (entries: BuildHistoryEntry[]) => void
  /** 向历史列表头部添加一条记录（构建完成时调用） */
  addHistoryEntry: (entry: BuildHistoryEntry) => void
  /** 删除全部历史（同时应调用 DELETE API） */
  clearHistory: () => void
  /** 为某条历史填充完整日志（点击查看详情时） */
  hydrateHistoryOutput: (id: string, fullOutput: string, cards: ParsedLogCard[]) => void
}

/* ------------------------------------------------------------------ */
/* 常量                                                                */
/* ------------------------------------------------------------------ */

/** 历史列表上限 */
export const MAX_HISTORY = 20

/** 输出预览长度（前 200 字符） */
const OUTPUT_PREVIEW_LEN = 200

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

/** 截取前 N 字符并替换换行 */
export function makeOutputPreview(output: string): string {
  if (!output) return ''
  const sliced = output.slice(0, OUTPUT_PREVIEW_LEN)
  return sliced.replace(/\r?\n/g, ' ⏎ ').trim()
}

/* ------------------------------------------------------------------ */
/* Store 实现                                                          */
/* ------------------------------------------------------------------ */

export const useBuildStore = create<BuildState>((set) => ({
  status: 'idle',
  task: null,
  startTime: null,
  output: '',
  parsedCards: [],
  duration: 0,
  history: [],

  startBuild: (task) =>
    set({
      status: 'running',
      task,
      startTime: Date.now(),
      output: '',
      parsedCards: [],
      duration: 0,
    }),

  appendOutput: (chunk) =>
    set((state) => ({ output: state.output + chunk })),

  finishBuild: (success, parsedCards, duration) =>
    set((state) => {
      const task = state.task
      // 仅在 task 非空时写入历史
      const entry: BuildHistoryEntry | null = task
        ? {
            id: `build-${Date.now().toString(36)}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
            task,
            status: success ? 'success' : 'failed',
            duration,
            createdAt: Date.now(),
            outputPreview: makeOutputPreview(state.output),
            cardCount: parsedCards.length,
          }
        : null

      return {
        status: success ? 'success' : 'failed',
        parsedCards,
        duration,
        history: entry
          ? [entry, ...state.history].slice(0, MAX_HISTORY)
          : state.history,
      }
    }),

  tickDuration: () =>
    set((state) => {
      if (state.status !== 'running' || state.startTime === null) return state
      return { duration: Date.now() - state.startTime }
    }),

  clearOutput: () => set({ output: '', parsedCards: [], duration: 0 }),

  resetStatus: () =>
    set({
      status: 'idle',
      task: null,
      startTime: null,
      duration: 0,
    }),

  loadHistory: (entries) => set({ history: entries.slice(0, MAX_HISTORY) }),

  addHistoryEntry: (entry) =>
    set((state) => ({
      history: [entry, ...state.history].slice(0, MAX_HISTORY),
    })),

  clearHistory: () => set({ history: [] }),

  hydrateHistoryOutput: (id, fullOutput, cards) =>
    set((state) => ({
      history: state.history.map((h) =>
        h.id === id
          ? {
              ...h,
              fullOutput,
              cardCount: cards.length,
            }
          : h,
      ),
    })),
}))
