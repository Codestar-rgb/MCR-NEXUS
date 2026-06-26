'use client'

/**
 * NexCube 工作区状态管理（阶段 1-A）
 *
 * 职责：
 *  - 维护「主页 / 工作区」视图切换（currentView / currentProjectId）
 *  - 维护工作区模式（节点视图 / 代码视图）
 *  - 维护各面板可见性与尺寸（左侧文件树 / 右侧属性面板 / 底部终端）
 *  - 维护选中状态（节点 / 代码文件 / 节点类型 / 节点名称）
 *  - 维护任务提示通知队列（构建同步 / 警告 / 信息 / 错误）
 *
 * 持久化策略（persist 中间件）：
 *  - 持久化：mode、各面板开关与尺寸、通知队列
 *  - 不持久化：currentView、currentProjectId（避免刷新后仍停留在工作区）
 *
 * 兼容性说明：
 *  本 store 同时暴露 Task 1-A 与 Task 1-D 的 API（后者为子集）：
 *   - selectNode(id)              ← Task 1-A
 *   - setSelectedNode(id, type, name) ← Task 1-D（同时更新 type/name）
 *   - addNotification(n)          ← Task 1-A
 *   - pushNotification(n)         ← Task 1-D（别名）
 *   - NotificationType / TaskNotificationType 互为别名
 *
 * 设计说明：
 *  - TaskNotification.action.onClick 是字符串形式的 action key（由后续任务
 *    实现时根据 key 查表分发），避免在 store 里直接挂载函数无法被 persist
 *    序列化的问题。
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/* ------------------------------------------------------------------ */
/* 类型定义                                                            */
/* ------------------------------------------------------------------ */

export type WorkspaceView = 'home' | 'workspace'

export type WorkspaceMode = 'node' | 'code'

/** 通知类型（Task 1-A 命名） */
export type NotificationType = 'sync' | 'warning' | 'info' | 'error'

/** 通知类型别名（Task 1-D 命名，向后兼容） */
export type TaskNotificationType = NotificationType

export interface TaskNotificationAction {
  /** 按钮文案 */
  label: string
  /**
   * 动作 key（字符串），由消费方查表分发。
   * 例如 'open-terminal' / 'view-build-log' / 'fix-mirror'。
   */
  onClick: string
}

export interface TaskNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  action?: TaskNotificationAction
  /** 创建时间戳（ms） */
  createdAt: number
  /** 是否已被用户标记为已读 */
  read?: boolean
}

/** 选中节点的类型（与 Prisma Node.type 子集对齐） */
export type SelectedNodeType = 'entity' | 'block' | 'item' | null

export interface WorkspaceState {
  /* 视图状态 */
  currentView: WorkspaceView
  currentProjectId: string | null

  /* 工作区模式 */
  mode: WorkspaceMode

  /* 面板状态 —— 终端 */
  terminalOpen: boolean
  terminalHeight: number // px
  activeTerminalTab: string

  /* 面板状态 —— 右侧属性面板 */
  rightPanelOpen: boolean
  rightPanelWidth: number // px

  /* 面板状态 —— 左侧文件树 */
  leftSidebarOpen: boolean
  leftSidebarWidth: number // px

  /* 选中状态 */
  selectedNodeId: string | null
  /** 选中节点类型（属性面板标题用） */
  selectedNodeType: SelectedNodeType
  /** 选中节点显示名称 */
  selectedNodeName: string | null
  selectedFilePath: string | null

  /* 任务提示 */
  taskNotifications: TaskNotification[]

  /* ----- Actions: 视图 ----- */
  setView: (view: WorkspaceView) => void
  openProject: (projectId: string) => void
  closeProject: () => void

  /* ----- Actions: 模式 ----- */
  setMode: (mode: WorkspaceMode) => void

  /* ----- Actions: 终端 ----- */
  toggleTerminal: () => void
  setTerminalHeight: (h: number) => void
  setActiveTerminalTab: (tab: string) => void

  /* ----- Actions: 右侧属性面板 ----- */
  toggleRightPanel: () => void
  setRightPanelWidth: (w: number) => void

  /* ----- Actions: 左侧文件树 ----- */
  toggleLeftSidebar: () => void
  setLeftSidebarWidth: (w: number) => void

  /* ----- Actions: 选中 ----- */
  /** Task 1-A：仅设置节点 id */
  selectNode: (id: string | null) => void
  /** Task 1-D：同时设置 id / type / name（推荐用法） */
  setSelectedNode: (
    id: string | null,
    type?: SelectedNodeType,
    name?: string | null,
  ) => void
  selectFile: (path: string | null) => void

  /* ----- Actions: 通知 ----- */
  /** Task 1-A 命名 */
  addNotification: (
    n: Omit<TaskNotification, 'id' | 'createdAt'> &
      Partial<Pick<TaskNotification, 'id' | 'createdAt'>>,
  ) => void
  /** Task 1-D 命名（别名） */
  pushNotification: (
    n: Omit<TaskNotification, 'id' | 'createdAt'> & { id?: string },
  ) => void
  dismissNotification: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void
}

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

/** 生成简易唯一 ID（不引入 uuid 依赖以减小体积） */
function makeId(prefix = 'nx'): string {
  const rand = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return `${prefix}_${time}_${rand}`
}

/* ------------------------------------------------------------------ */
/* 默认值                                                              */
/* ------------------------------------------------------------------ */

const DEFAULT_TERMINAL_HEIGHT = 192 // ≈ h-48
const DEFAULT_RIGHT_PANEL_WIDTH = 320 // ≈ w-80
const DEFAULT_LEFT_SIDEBAR_WIDTH = 256 // ≈ w-64

/** Mock 通知：演示用，阶段 1 后由真实事件源替换 */
const INITIAL_NOTIFICATIONS: TaskNotification[] = [
  {
    id: 'mock-sync-1',
    type: 'sync',
    title: '代码已更新',
    message: '检测到 ExampleMod.java 有变更，是否同步到节点？',
    createdAt: Date.now() - 30_000,
    action: { label: '一键同步', onClick: 'sync_code' },
    read: false,
  },
  {
    id: 'mock-info-1',
    type: 'info',
    title: '环境就绪',
    message: 'Java 21 + Forge 47.3.7 已配置',
    createdAt: Date.now() - 120_000,
    read: false,
  },
]

/* ------------------------------------------------------------------ */
/* Store 定义                                                          */
/* ------------------------------------------------------------------ */

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      /* 视图状态 */
      currentView: 'home',
      currentProjectId: null,

      /* 工作区模式 */
      mode: 'node',

      /* 面板状态 —— 终端 */
      terminalOpen: false,
      terminalHeight: DEFAULT_TERMINAL_HEIGHT,
      activeTerminalTab: 'build',

      /* 面板状态 —— 右侧属性面板 */
      rightPanelOpen: true,
      rightPanelWidth: DEFAULT_RIGHT_PANEL_WIDTH,

      /* 面板状态 —— 左侧文件树 */
      leftSidebarOpen: true,
      leftSidebarWidth: DEFAULT_LEFT_SIDEBAR_WIDTH,

      /* 选中状态 */
      selectedNodeId: null,
      selectedNodeType: null,
      selectedNodeName: null,
      selectedFilePath: null,

      /* 任务提示 */
      taskNotifications: INITIAL_NOTIFICATIONS,

      /* ----- Actions: 视图 ----- */

      setView: (view) => set({ currentView: view }),

      openProject: (projectId) =>
        set({
          currentView: 'workspace',
          currentProjectId: projectId,
          // 打开项目时重置选中与终端默认状态
          selectedNodeId: null,
          selectedNodeType: null,
          selectedNodeName: null,
          selectedFilePath: null,
          activeTerminalTab: 'build',
        }),

      closeProject: () =>
        set({
          currentView: 'home',
          currentProjectId: null,
          selectedNodeId: null,
          selectedNodeType: null,
          selectedNodeName: null,
          selectedFilePath: null,
        }),

      /* ----- Actions: 模式 ----- */

      setMode: (mode) => set({ mode }),

      /* ----- Actions: 终端 ----- */

      toggleTerminal: () => set((s) => ({ terminalOpen: !s.terminalOpen })),
      setTerminalHeight: (h) =>
        set({ terminalHeight: Math.min(Math.max(h, 96), 600) }),
      setActiveTerminalTab: (tab) => set({ activeTerminalTab: tab }),

      /* ----- Actions: 右侧属性面板 ----- */

      toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
      setRightPanelWidth: (w) =>
        set({ rightPanelWidth: Math.min(Math.max(w, 240), 480) }),

      /* ----- Actions: 左侧文件树 ----- */

      toggleLeftSidebar: () =>
        set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
      setLeftSidebarWidth: (w) =>
        set({ leftSidebarWidth: Math.min(Math.max(w, 200), 400) }),

      /* ----- Actions: 选中 ----- */

      selectNode: (id) =>
        set(
          id
            ? { selectedNodeId: id }
            : { selectedNodeId: null, selectedNodeType: null, selectedNodeName: null },
        ),

      setSelectedNode: (id, type = null, name = null) =>
        set({
          selectedNodeId: id,
          selectedNodeType: id ? type : null,
          selectedNodeName: id ? name : null,
        }),

      selectFile: (path) => set({ selectedFilePath: path }),

      /* ----- Actions: 通知 ----- */

      addNotification: (n) =>
        set((s) => ({
          taskNotifications: [
            {
              id: n.id ?? makeId('note'),
              createdAt: n.createdAt ?? Date.now(),
              type: n.type,
              title: n.title,
              message: n.message,
              action: n.action,
              read: false,
            },
            ...s.taskNotifications,
          ].slice(0, 50), // 最多保留 50 条
        })),

      pushNotification: (n) =>
        set((s) => ({
          taskNotifications: [
            {
              id: n.id ?? makeId('note'),
              createdAt: Date.now(),
              type: n.type,
              title: n.title,
              message: n.message,
              action: n.action,
              read: false,
            },
            ...s.taskNotifications,
          ].slice(0, 50),
        })),

      dismissNotification: (id) =>
        set((s) => ({
          taskNotifications: s.taskNotifications.filter((n) => n.id !== id),
        })),

      markAllNotificationsRead: () =>
        set((s) => ({
          taskNotifications: s.taskNotifications.map((n) => ({
            ...n,
            read: true,
          })),
        })),

      clearNotifications: () => set({ taskNotifications: [] }),
    }),
    {
      name: 'nexcube-workspace',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      /**
       * 只持久化面板状态 / 选中 / 通知；不持久化视图与项目 ID。
       * 这样用户刷新浏览器后会回到主页，而不是停在已失效的工作区。
       */
      partialize: (state) => ({
        mode: state.mode,
        terminalOpen: state.terminalOpen,
        terminalHeight: state.terminalHeight,
        activeTerminalTab: state.activeTerminalTab,
        rightPanelOpen: state.rightPanelOpen,
        rightPanelWidth: state.rightPanelWidth,
        leftSidebarOpen: state.leftSidebarOpen,
        leftSidebarWidth: state.leftSidebarWidth,
        // 通知也持久化，方便用户回到项目后还原状态
        taskNotifications: state.taskNotifications,
      }),
    },
  ),
)

/* ------------------------------------------------------------------ */
/* 选择器（便于组件按需订阅，避免无谓 re-render）                       */
/* ------------------------------------------------------------------ */

export const selectUnreadNotificationCount = (s: WorkspaceState): number =>
  s.taskNotifications.filter((n) => !n.read).length
