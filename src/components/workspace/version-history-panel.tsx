'use client'

/**
 * 版本历史面板
 *
 * 显示在设置对话框或独立浮层中。
 * 功能：
 *  - 保存当前项目快照为版本
 *  - 查看版本历史（时间线）
 *  - 恢复到指定版本（回滚节点+连线）
 *
 * 版本数据存储在 AppSetting 表（key = versions_<projectId>）。
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History, Save, RotateCcw, Trash2, GitCommit, X, Loader2,
} from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace'
import { useCanvasStore } from '@/stores/canvas'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface VersionSnapshot {
  nodes: Array<{
    id: string; type: string; title: string
    positionX: number; positionY: number; properties: string
  }>
  edges: Array<{
    id: string; source: string; target: string
    sourcePort: string; targetPort: string; dataType: string
  }>
}

interface Version {
  id: string
  name: string
  description: string
  createdAt: string
  nodeCount: number
  edgeCount: number
  snapshot: VersionSnapshot
}

interface VersionHistoryPanelProps {
  open: boolean
  onClose: () => void
}

export function VersionHistoryPanel({ open, onClose }: VersionHistoryPanelProps) {
  const projectId = useWorkspaceStore((s) => s.currentProjectId)
  const loadFromProject = useCanvasStore((s) => s.loadFromProject)
  const [versions, setVersions] = React.useState<Version[]>([])
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [restoreId, setRestoreId] = React.useState<string | null>(null)
  const [versionName, setVersionName] = React.useState('')

  // 加载版本列表
  const loadVersions = React.useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`)
      if (res.ok) {
        const data = await res.json()
        setVersions(data.versions ?? [])
      }
    } catch {
      // 忽略
    } finally {
      setLoading(false)
    }
  }, [projectId])

  React.useEffect(() => {
    if (open) {
      loadVersions()
    }
  }, [open, loadVersions])

  // 保存版本
  const handleSave = async () => {
    if (!projectId || !versionName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: versionName.trim() }),
      })
      if (!res.ok) throw new Error('保存失败')
      toast.success('版本快照已保存')
      setVersionName('')
      loadVersions()
    } catch {
      toast.error('保存版本失败')
    } finally {
      setSaving(false)
    }
  }

  // 恢复版本
  const handleRestore = async (version: Version) => {
    if (!projectId) return
    if (!window.confirm(`确认恢复到版本「${version.name}」？当前未保存的更改将丢失。`)) return
    setRestoreId(version.id)
    try {
      const { snapshot } = version
      // 转换快照为 FlowNode[] + FlowEdge[]
      const flowNodes = snapshot.nodes.map((n) => {
        let props: Record<string, unknown> = {}
        try { props = JSON.parse(n.properties || '{}') } catch { props = {} }
        return {
          id: n.id,
          type: n.type,
          position: { x: n.positionX, y: n.positionY },
          data: {
            kind: n.type,
            title: n.title,
            properties: props,
            isCollapsed: false,
          },
        }
      })
      const flowEdges = snapshot.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourcePort || null,
        targetHandle: e.targetPort || null,
        data: { dataType: e.dataType },
      }))

      loadFromProject(flowNodes as never, flowEdges as never)
      toast.success(`已恢复到版本「${version.name}」`)
    } catch {
      toast.error('恢复版本失败')
    } finally {
      setRestoreId(null)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-[101] w-[480px] max-h-[80vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/50 bg-popover/95 shadow-floating backdrop-blur-xl"
          >
            <div className="h-1 bg-gradient-brand" />

            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-border/30 px-5 py-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">版本历史</h2>
                <span className="rounded-full bg-muted/40 px-1.5 py-px text-[9px] text-muted-foreground">
                  {versions.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="nexcube-scroll max-h-[60vh] overflow-y-auto p-5">
              {/* 保存新版本 */}
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  placeholder="版本名称（如：添加武器系统后）"
                  className="flex-1 rounded-lg border border-border/40 bg-card/30 px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none"
                />
                <button
                  onClick={handleSave}
                  disabled={!versionName.trim() || saving}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-2 text-[12px] font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  保存
                </button>
              </div>

              {/* 版本列表 */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <GitCommit className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-[12px] font-medium text-foreground">暂无版本</p>
                  <p className="text-[10px] text-muted-foreground">保存版本快照以记录开发进度</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((version, idx) => (
                    <motion.div
                      key={version.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={cn(
                        'group flex items-start gap-3 rounded-lg border p-3 transition-colors',
                        idx === 0
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border/30 bg-card/20 hover:border-border/50',
                      )}
                    >
                      {/* 版本图标 */}
                      <div className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                        idx === 0 ? 'bg-primary/15 text-primary' : 'bg-muted/30 text-muted-foreground',
                      )}>
                        <GitCommit className="h-4 w-4" />
                      </div>

                      {/* 版本信息 */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[12px] font-semibold text-foreground">
                            {version.name}
                          </span>
                          {idx === 0 && (
                            <span className="rounded bg-primary/15 px-1 py-px text-[8px] font-bold uppercase text-primary">
                              最新
                            </span>
                          )}
                        </div>
                        {version.description && (
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                            {version.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-[9px] text-muted-foreground/60">
                          <span>{version.nodeCount} 节点 · {version.edgeCount} 连线</span>
                          <span>·</span>
                          <span>
                            {(() => {
                              try {
                                return formatDistanceToNow(new Date(version.createdAt), { addSuffix: true, locale: zhCN })
                              } catch {
                                return '—'
                              }
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* 恢复按钮 */}
                      <button
                        onClick={() => handleRestore(version)}
                        disabled={restoreId === version.id}
                        className="shrink-0 rounded-md border border-border/40 px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                      >
                        {restoreId === version.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <span className="flex items-center gap-1">
                            <RotateCcw className="h-3 w-3" />
                            恢复
                          </span>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部提示 */}
            <div className="border-t border-border/30 px-5 py-2.5 text-center text-[10px] text-muted-foreground/50">
              最多保留 20 个版本 · 恢复会覆盖当前画布（已保存到数据库的不受影响）
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
