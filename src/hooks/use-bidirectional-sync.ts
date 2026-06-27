'use client'

/**
 * 双向联动 Hook —— Task 4-C
 *
 * 实现"节点 ↔ 代码"双向同步：
 *
 *  ┌──────────────┐                    ┌──────────────┐
 *  │  画布节点     │ ──节点变更──→      │  生成代码     │
 *  │ (canvas store)│ ←─代码编辑──      │ (files state)│
 *  └──────────────┘                    └──────────────┘
 *         ↑                                   ↑
 *         │                                   │
 *         └───── AST 同步引擎（正则匹配） ────┘
 *
 * 同步方向：
 *  1. 节点 → 代码：监听 canvas store.nodes，调用 generateProjectCode
 *     重新生成所有文件，更新 files state（用户在代码编辑器看到新代码）
 *  2. 代码 → 节点：用户在 Monaco 编辑器编辑代码后，调用 syncCodeToNodes
 *     解析代码 → 更新节点属性（仅属性，不创建/删除节点）
 *
 * 双向联动（高亮）：
 *  - 代码选中行 → 通过 findNodeByCodeLine 找到对应节点 → canvas.selectNode
 *  - 节点选中 → workspace.selectedNodeId → 滚动到对应文件 + 行
 *
 * 高风险拦截：
 *  - 类名变更 / mod ID 变更 / 注册删除 → 不自动应用
 *  - 通过 useSyncStore.showRiskDialog 弹出 AlertDialog 让用户确认
 *
 * @see src/lib/codegen/ast-sync-engine.ts
 * @see src/lib/codegen/code-generator.ts
 * @see src/stores/sync.ts
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useCanvasStore } from '@/stores/canvas'
import { useWorkspaceStore } from '@/stores/workspace'
import { useSyncStore, applyNodeUpdates } from '@/stores/sync'
import {
  generateProjectCode,
  type GeneratedFile,
} from '@/lib/codegen/code-generator'
import {
  parseCodeWithModId,
  findNodeByCodeLine,
  type SyncResult,
} from '@/lib/codegen/ast-sync-engine'

/* ------------------------------------------------------------------ */
/* Hook 实现                                                           */
/* ------------------------------------------------------------------ */

export interface UseBidirectionalSyncReturn {
  /** 当前生成的所有文件 */
  files: GeneratedFile[]
  /** 当前打开的文件路径 */
  activeFile: string | null
  /** 设置当前打开的文件 */
  setActiveFile: (path: string | null) => void
  /** 最近同步结果（也可从 useSyncStore 获取） */
  syncResult: SyncResult | null
  /** 是否有高风险变更待确认 */
  pendingSync: boolean
  /** 用户编辑代码 → 触发代码 → 节点同步 */
  syncCodeToNodes: (filePath: string, newContent: string) => void
  /** 代码选中行变化 → 高亮对应节点 */
  highlightNodeFromCode: (filePath: string, line: number) => void
  /** 节点选中变化 → 滚动代码到对应文件 */
  scrollCodeToNode: (nodeId: string) => void
  /** 确认应用高风险变更 + 节点更新 */
  confirmSync: () => void
  /** 取消应用，丢弃所有 nodeUpdates */
  cancelSync: () => void
}

export function useBidirectionalSync(
  projectId: string | null,
  modId: string,
): UseBidirectionalSyncReturn {
  const nodes = useCanvasStore((s) => s.nodes)
  const updateNodeData = useCanvasStore((s) => s.updateNodeData)
  const selectNode = useCanvasStore((s) => s.selectNode)

  const setSelectedNode = useWorkspaceStore((s) => s.setSelectedNode)
  const selectedNodeId = useWorkspaceStore((s) => s.selectedNodeId)

  const setSyncResult = useSyncStore((s) => s.setSyncResult)
  const setPendingSync = useSyncStore((s) => s.setPendingSync)
  const setShowRiskDialog = useSyncStore((s) => s.setShowRiskDialog)
  const clearSync = useSyncStore((s) => s.clearSync)
  const syncResult = useSyncStore((s) => s.syncResult)
  const pendingSync = useSyncStore((s) => s.pendingSync)

  const [files, setFiles] = useState<GeneratedFile[]>([])
  const [activeFile, setActiveFile] = useState<string | null>(null)

  /**
   * "正在更新文件内容"标志：防止节点变更 → 重新生成代码 → 触发 Monaco
   * onChange → 又触发 syncCodeToNodes → 死循环。
   * 用 ref 而非 state 避免无谓重渲染。
   */
  const isRegeneratingRef = useRef(false)

  /* ---------------------------------------------------------------- */
  /* 节点变更 → 重新生成代码                                            */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!projectId || nodes.length === 0) {
      setFiles([])
      return
    }
    isRegeneratingRef.current = true
    try {
      const result = generateProjectCode(projectId, modId, nodes)
      setFiles(result.files)
      // 如果当前 activeFile 不在新文件列表中，自动选中第一个
      setActiveFile((prev) => {
        if (prev && result.files.some((f) => f.filePath === prev)) return prev
        return result.files[0]?.filePath ?? null
      })
    } finally {
      // 异步释放标志（让 Monaco onChange 在本轮事件循环后再生效）
      setTimeout(() => {
        isRegeneratingRef.current = false
      }, 0)
    }
  }, [projectId, modId, nodes])

  /* ---------------------------------------------------------------- */
  /* 代码 → 节点 同步                                                  */
  /* ---------------------------------------------------------------- */
  const syncCodeToNodes = useCallback(
    (filePath: string, newContent: string) => {
      // 防止节点变更触发的代码重生成又回流到节点
      if (isRegeneratingRef.current) return
      if (!projectId) return

      // 1. 更新本地文件内容
      setFiles((prev) =>
        prev.map((f) =>
          f.filePath === filePath ? { ...f, content: newContent } : f,
        ),
      )

      // 2. 找到关联节点
      const file = files.find((f) => f.filePath === filePath)
      if (!file) return

      const linkedNodes = file.linkedNodeId
        ? nodes.filter((n) => n.id === file.linkedNodeId)
        : []

      // 3. 解析代码（带 modId 校验）
      const result = parseCodeWithModId(
        newContent,
        linkedNodes,
        modId,
      )

      // 4. 推送到 sync store（驱动任务提示区显示）
      setSyncResult(result, filePath)

      // 5. 如果有高风险变更，不自动应用，等待用户确认
      if (result.highRiskChanges.length > 0) {
        setPendingSync(true)
        setShowRiskDialog(true)
        return
      }

      // 6. 自动应用节点更新（仅属性，不创建/删除节点）
      if (result.nodeUpdates.length > 0) {
        applyNodeUpdates(
          result.nodeUpdates,
          updateNodeData,
          (id) => {
            const n = useCanvasStore.getState().nodes.find((x) => x.id === id)
            return n as
              | { data: { properties?: Record<string, unknown> } }
              | undefined
          },
        )
      }
    },
    [projectId, modId, files, nodes, updateNodeData, setSyncResult, setPendingSync, setShowRiskDialog],
  )

  /* ---------------------------------------------------------------- */
  /* 代码选中行 → 高亮节点                                             */
  /* ---------------------------------------------------------------- */
  const highlightNodeFromCode = useCallback(
    (filePath: string, line: number) => {
      const { nodeId } = findNodeByCodeLine(
        line,
        files.map((f) => ({
          filePath: f.filePath,
          content: f.content,
          linkedNodeId: f.linkedNodeId,
        })),
        filePath,
      )
      if (nodeId) {
        // 同步到 canvas store + workspace store
        selectNode(nodeId)
        const node = useCanvasStore.getState().nodes.find((n) => n.id === nodeId)
        const type = (node?.data.kind as 'entity' | 'block' | 'item' | null) ?? null
        const name = node?.data.title ?? null
        setSelectedNode(nodeId, type, name)
      }
    },
    [files, selectNode, setSelectedNode],
  )

  /* ---------------------------------------------------------------- */
  /* 节点选中 → 滚动代码到对应文件                                     */
  /* ---------------------------------------------------------------- */
  const scrollCodeToNode = useCallback(
    (nodeId: string) => {
      const file = files.find((f) => f.linkedNodeId === nodeId)
      if (file) {
        setActiveFile(file.filePath)
        // 实际 Monaco 滚动到对应行需要编辑器 ref，由消费方（MonacoEditor）实现
        // 这里通过 CustomEvent 通知 Monaco 组件
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('nexcube:scroll-to-node', {
              detail: { nodeId, filePath: file.filePath },
            }),
          )
        }
      }
    },
    [files],
  )

  // 监听 workspace store 的 selectedNodeId 变化 → 触发 scrollCodeToNode
  useEffect(() => {
    if (!selectedNodeId) return
    scrollCodeToNode(selectedNodeId)
  }, [selectedNodeId, scrollCodeToNode])

  /* ---------------------------------------------------------------- */
  /* 确认 / 取消高风险同步                                             */
  /* ---------------------------------------------------------------- */
  const confirmSync = useCallback(() => {
    if (!syncResult) return
    // 应用所有节点更新
    if (syncResult.nodeUpdates.length > 0) {
      applyNodeUpdates(
        syncResult.nodeUpdates,
        updateNodeData,
        (id) => {
          const n = useCanvasStore.getState().nodes.find((x) => x.id === id)
          return n as
            | { data: { properties?: Record<string, unknown> } }
            | undefined
        },
      )
    }
    // 高风险变更不应用（用户已确认看到，但代码改动保留）
    setPendingSync(false)
    setShowRiskDialog(false)
    clearSync()
  }, [syncResult, updateNodeData, setPendingSync, setShowRiskDialog, clearSync])

  const cancelSync = useCallback(() => {
    // 丢弃所有 nodeUpdates，恢复节点状态（代码改动保留）
    setPendingSync(false)
    setShowRiskDialog(false)
    clearSync()
  }, [setPendingSync, setShowRiskDialog, clearSync])

  /* ---------------------------------------------------------------- */
  /* 切换项目时清理同步状态                                            */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!projectId) {
      clearSync()
      setFiles([])
      setActiveFile(null)
    }
  }, [projectId, clearSync])

  return {
    files,
    activeFile,
    setActiveFile,
    syncResult,
    pendingSync,
    syncCodeToNodes,
    highlightNodeFromCode,
    scrollCodeToNode,
    confirmSync,
    cancelSync,
  }
}
