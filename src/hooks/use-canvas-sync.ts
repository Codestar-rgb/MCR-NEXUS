'use client'

/**
 * 画布同步 Hook
 *
 * 职责：
 *  1. 加载项目节点/连线到 Zustand store（首次加载）
 *  2. 监听 store 中的 nodes / edges 变化，debounce 500ms 后 diff 并
 *     通过 /api/projects/[id]/sync 批量持久化到 SQLite
 *  3. 切换项目时清理画布并重置快照
 *
 * 用法：
 *   const { isLoading } = useCanvasSync(projectId)
 *
 * 设计：
 *  - 查询缓存 staleTime: Infinity —— 本地状态是 source of truth，避免自动重新拉取
 *  - 仅在 store.isInitialized 之后才开始 diff；首次加载完成前不触发持久化
 *  - diff 用 JSON.stringify 比对，简单可靠（节点数据量小）
 *  - 拖拽时 UI 实时由 Zustand 更新，松手 500ms 后写库
 *  - lastSynced 快照存于 module-level Map（按 projectId 隔离），
 *    避免在 effect 依赖中修改 ref 触发 react-hooks/immutability
 */

import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCanvasStore } from '@/stores/canvas'
import {
  flowNodeToPrismaNode,
  prismaNodeToFlowNode,
  type FlowNode,
  type FlowEdge,
} from '@/lib/node-system/types'
import {
  flowEdgeToPrismaConnection,
  prismaConnectionToFlowEdge,
  type PrismaNodeDTO,
  type PrismaConnectionDTO,
} from '@/lib/node-system/persistence'

const DEBOUNCE_MS = 500

interface NodesResponse {
  nodes: PrismaNodeDTO[]
  connections: PrismaConnectionDTO[]
}

interface SyncPayload {
  upsertNodes: PrismaNodeDTO[]
  deleteNodeIds: string[]
  upsertConnections: PrismaConnectionDTO[]
  deleteConnectionIds: string[]
}

interface SyncResponse {
  ok: boolean
  syncedAt: string
  stats: {
    upsertedNodes: number
    deletedNodes: number
    upsertedConnections: number
    deletedConnections: number
  }
}

interface SyncSnapshot {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

/**
 * module-level 快照存储：按 projectId 隔离，避免在 effect 依赖中修改 ref。
 * 切换项目时旧快照自动保留（无内存泄漏风险，Map 仅按活跃项目数量增长）。
 */
const lastSyncedMap = new Map<string, SyncSnapshot>()

function getLastSynced(projectId: string): SyncSnapshot {
  return lastSyncedMap.get(projectId) ?? { nodes: [], edges: [] }
}

function setLastSynced(projectId: string, snapshot: SyncSnapshot) {
  lastSyncedMap.set(projectId, snapshot)
}

function clearLastSynced(projectId: string) {
  lastSyncedMap.delete(projectId)
}

/** 浅比较两个 node/edge 是否需要 upsert（基于 JSON 序列化） */
function isSame(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function useCanvasSync(projectId: string | null) {
  const queryClient = useQueryClient()
  const loadFromProject = useCanvasStore((s) => s.loadFromProject)
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)

  // ============================================================
  // 1) 加载项目节点（仅首次进入时拉取一次）
  // ============================================================
  const { data, isLoading } = useQuery<NodesResponse>({
    queryKey: ['project', projectId, 'nodes'],
    queryFn: async () => {
      if (!projectId) return { nodes: [], connections: [] }
      const res = await fetch(`/api/projects/${projectId}/nodes`)
      if (!res.ok) {
        throw new Error(`failed_to_load_nodes: ${res.status}`)
      }
      return (await res.json()) as NodesResponse
    },
    enabled: !!projectId,
    staleTime: Infinity, // 本地是 source of truth，不自动重拉
    retry: 1,
  })

  // 首次加载完成 → 写入 store
  useEffect(() => {
    if (!data || !projectId) return
    const state = useCanvasStore.getState()
    if (state.isInitialized) return // 已初始化（避免重复加载）

    const flowNodes: FlowNode[] = data.nodes.map((n) => prismaNodeToFlowNode(n as unknown as import('@/lib/node-system/types').PrismaNodeShape))
    const flowEdges: FlowEdge[] = data.connections.map(prismaConnectionToFlowEdge)
    loadFromProject(flowNodes, flowEdges)

    // 加载工作区列表（会自动设置 activeWorkspaceId）
    import('@/stores/workspace-store').then(({ useWorkspaceStore }) => {
      useWorkspaceStore.getState().loadWorkspaces(projectId)
    })

    // 初始化 lastSynced 快照（避免紧接着触发一次全量 upsert）
    setLastSynced(projectId, { nodes: flowNodes, edges: flowEdges })
  }, [data, projectId, loadFromProject])

  // ============================================================
  // 2) 定期同步（setInterval 方案，避免 effect 闭包和 timer 清除问题）
  // ============================================================
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 定期检查是否有变更需要同步
  const isSyncingRef = useRef(false)
  useEffect(() => {
    if (!projectId) return

    const intervalId = setInterval(async () => {
      if (isSyncingRef.current) return
      if (!useCanvasStore.getState().isInitialized) return

      const currentState = useCanvasStore.getState()
      const currentNodesList = currentState.nodes
      const currentEdgesList = currentState.edges
      const snapshot = getLastSynced(projectId)

      const lastNodes = new Map(snapshot.nodes.map((n) => [n.id, n]))
      const currentNodes = new Map(currentNodesList.map((n) => [n.id, n]))

      const upsertNodes: PrismaNodeDTO[] = []
      const deleteNodeIds: string[] = []

      for (const [id, node] of currentNodes) {
        const last = lastNodes.get(id)
        if (!last || !isSame(last, node)) {
          upsertNodes.push(flowNodeToPrismaNode(node, projectId))
        }
      }
      for (const [id] of lastNodes) {
        if (!currentNodes.has(id)) deleteNodeIds.push(id)
      }

      const lastEdges = new Map(snapshot.edges.map((e) => [e.id, e]))
      const currentEdges = new Map(currentEdgesList.map((e) => [e.id, e]))

      const upsertConnections: PrismaConnectionDTO[] = []
      const deleteConnectionIds: string[] = []

      for (const [id, edge] of currentEdges) {
        const last = lastEdges.get(id)
        if (!last || !isSame(last, edge)) {
          upsertConnections.push(flowEdgeToPrismaConnection(edge, projectId))
        }
      }
      for (const [id] of lastEdges) {
        if (!currentEdges.has(id)) deleteConnectionIds.push(id)
      }

      const hasChanges =
        upsertNodes.length > 0 ||
        deleteNodeIds.length > 0 ||
        upsertConnections.length > 0 ||
        deleteConnectionIds.length > 0

      if (!hasChanges) return

      isSyncingRef.current = true
      try {
        const res = await fetch(`/api/projects/${projectId}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upsertNodes, deleteNodeIds, upsertConnections, deleteConnectionIds }),
        })
        if (res.ok) {
          // 同步成功后更新快照
          setLastSynced(projectId, {
            nodes: useCanvasStore.getState().nodes,
            edges: useCanvasStore.getState().edges,
          })
          queryClient.invalidateQueries({ queryKey: ['project', projectId, 'nodes'] })
        }
      } catch (err) {
        console.error('[useCanvasSync] sync error:', err)
      } finally {
        isSyncingRef.current = false
      }
    }, DEBOUNCE_MS)

    return () => clearInterval(intervalId)
  }, [projectId, queryClient])

  // ============================================================
  // 3) 切换项目 → 清理画布 + 重置快照 + 失效缓存
  // ============================================================
  useEffect(() => {
    return () => {
      // 卸载或 projectId 变化时执行
      const state = useCanvasStore.getState()
      state.clearCanvas?.()
      if (projectId) clearLastSynced(projectId)
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
        debounceTimer.current = null
      }
    }
  }, [projectId])

  // projectId 切换时显式失效 query（配合 staleTime:Infinity，下次进入会重拉）
  useEffect(() => {
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: ['project', projectId, 'nodes'] })
    }
  }, [projectId, queryClient])

  return { isLoading }
}
