'use client'

/**
 * 代码编辑器面板（阶段 4 整合）
 *
 * 整合 CodeToolbar + FileTabs + CodeEditor
 * 从 useBidirectionalSync 获取文件列表和同步状态
 */

import { useCallback, useEffect, useState } from 'react'
import { CodeEditor } from './code-editor'
import { FileTabs, type OpenFile } from './file-tabs'
import { CodeToolbar } from './code-toolbar'
import { useBidirectionalSync } from '@/hooks/use-bidirectional-sync'
import { useWorkspaceStore } from '@/stores/workspace'

interface CodeEditorPanelProps {
  className?: string
}

export function CodeEditorPanel({ className }: CodeEditorPanelProps) {
  const currentProjectId = useWorkspaceStore((s) => s.currentProjectId)
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)

  // 获取项目 modId（从 API 或 store）
  const [modId, setModId] = useState('example_mod')
  useEffect(() => {
    if (!currentProjectId) return
    fetch(`/api/projects/${currentProjectId}`)
      .then((r) => r.json())
      .then((d) => setModId(d.modId ?? 'example_mod'))
      .catch(() => {})
  }, [currentProjectId])

  const { files, syncCodeToNodes, syncResult, pendingSync, confirmSync, cancelSync } =
    useBidirectionalSync(currentProjectId, modId)

  // 文件列表变化 → 更新 openFiles
  useEffect(() => {
    if (files.length === 0) return
    const newFiles: OpenFile[] = files.map((f) => ({
      id: f.filePath,
      name: f.filePath.split('/').pop() ?? f.filePath,
      path: f.filePath,
      value: f.content,
      isDirty: false,
      isReadOnly: false,
      linkedNodeId: f.linkedNodeId,
    }))
    // 用微任务避免 effect 内同步 setState
    queueMicrotask(() => {
      setOpenFiles((prev) => {
        return newFiles.map((nf) => {
          const old = prev.find((pf) => pf.id === nf.id)
          return old ? { ...nf, value: old.value, isDirty: old.isDirty } : nf
        })
      })
      if (!activeFileId && newFiles.length > 0) {
        setActiveFileId(newFiles[0].id)
      }
    })
  }, [files, activeFileId])

  const activeFile = openFiles.find((f) => f.id === activeFileId) ?? null

  const handleFileChange = useCallback(
    (value: string) => {
      if (!activeFileId) return
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.id === activeFileId
            ? { ...f, value, isDirty: f.value !== value }
            : f,
        ),
      )
      // 触发代码→节点同步
      syncCodeToNodes(activeFile?.path ?? "", value)
    },
    [activeFileId, activeFile, syncCodeToNodes],
  )

  const handleCloseFile = useCallback(
    (id: string) => {
      setOpenFiles((prev) => prev.filter((f) => f.id !== id))
      if (activeFileId === id) {
        const remaining = openFiles.filter((f) => f.id !== id)
        setActiveFileId(remaining[0]?.id ?? null)
      }
    },
    [activeFileId, openFiles],
  )

  return (
    <div className={`flex h-full flex-col bg-background ${className ?? ''}`}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <CodeToolbar {...({ activeFile: activeFile ?? null, syncStatus: activeFile?.isDirty ? 'dirty' : 'synced', pendingSync, syncResult, onSyncToNodes: () => activeFile && syncCodeToNodes(activeFile.path ?? '', activeFile.value ?? ''), onConfirmSync: confirmSync, onCancelSync: cancelSync } as any)} />
      {openFiles.length > 0 && (
        <FileTabs {...({ files: openFiles, activeFileId, onSelectFile: setActiveFileId, onCloseFile: handleCloseFile } as any)} />
      )}
      <div className="min-h-0 flex-1">
        {activeFile ? (
          <CodeEditor
            value={activeFile.value ?? ""}
            onChange={handleFileChange}
            className="h-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            无打开的文件
          </div>
        )}
      </div>
    </div>
  )
}
