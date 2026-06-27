'use client'

/**
 * 工作区状态管理
 *
 * - 管理当前项目的工作区列表
 * - 当前激活的工作区 ID
 * - CRUD 操作
 */

import { create } from 'zustand'
import { useCanvasStore } from '@/stores/canvas'

export interface WorkspaceCard {
  id: string
  name: string
  color: string
  icon: string
  nodeCount: number
  edgeCount: number
  sortOrder: number
}

interface WorkspaceStoreState {
  workspaces: WorkspaceCard[]
  activeWorkspaceId: string | null
  isLoading: boolean

  loadWorkspaces: (projectId: string) => Promise<void>
  setActive: (id: string | null) => void
  createWorkspace: (projectId: string, name: string, color?: string, icon?: string) => Promise<string | null>
  renameWorkspace: (projectId: string, id: string, name: string) => Promise<void>
  deleteWorkspace: (projectId: string, id: string) => Promise<void>
  updateWorkspaceColor: (projectId: string, id: string, color: string) => Promise<void>
  reset: () => void
}

export const useWorkspaceStore = create<WorkspaceStoreState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  isLoading: false,

  loadWorkspaces: async (projectId) => {
    if (!projectId) return
    set({ isLoading: true })
    try {
      const res = await fetch(`/api/projects/${projectId}/workspaces`)
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      const workspaces: WorkspaceCard[] = data.workspaces ?? []

      set({ workspaces, isLoading: false })

      // 如果没有工作区，自动创建一个默认的
      if (workspaces.length === 0) {
        const defaultId = await get().createWorkspace(projectId, '主工作区', 'teal', 'Box')
        if (defaultId) {
          set({ activeWorkspaceId: defaultId })
          // 通知 canvas store 切换工作区
          useCanvasStore.getState().setActiveWorkspace?.(defaultId)
        }
      } else if (!get().activeWorkspaceId) {
        // 默认激活第一个
        set({ activeWorkspaceId: workspaces[0].id })
        useCanvasStore.getState().setActiveWorkspace?.(workspaces[0].id)
      }
    } catch {
      set({ isLoading: false })
    }
  },

  setActive: (id) => {
    set({ activeWorkspaceId: id })
    // 通知 canvas store 过滤节点
    useCanvasStore.getState().setActiveWorkspace?.(id)
  },

  createWorkspace: async (projectId, name, color = 'teal', icon = 'Box') => {
    try {
      const res = await fetch(`/api/projects/${projectId}/workspaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, icon }),
      })
      if (!res.ok) return null
      const ws = await res.json()
      set((s) => ({
        workspaces: [...s.workspaces, ws],
      }))
      return ws.id
    } catch {
      return null
    }
  },

  renameWorkspace: async (projectId, id, name) => {
    try {
      await fetch(`/api/projects/${projectId}/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      set((s) => ({
        workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, name } : w)),
      }))
    } catch {}
  },

  deleteWorkspace: async (projectId, id) => {
    try {
      await fetch(`/api/projects/${projectId}/workspaces/${id}`, {
        method: 'DELETE',
      })
      const remaining = get().workspaces.filter((w) => w.id !== id)
      set({
        workspaces: remaining,
        activeWorkspaceId: get().activeWorkspaceId === id
          ? (remaining[0]?.id ?? null)
          : get().activeWorkspaceId,
      })
      // 切换到剩余的第一个
      if (remaining.length > 0) {
        get().setActive(remaining[0].id)
      }
    } catch {}
  },

  updateWorkspaceColor: async (projectId, id, color) => {
    try {
      await fetch(`/api/projects/${projectId}/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color }),
      })
      set((s) => ({
        workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, color } : w)),
      }))
    } catch {}
  },

  reset: () => set({ workspaces: [], activeWorkspaceId: null, isLoading: false }),
}))
