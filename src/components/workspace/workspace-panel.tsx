'use client'

/**
 * 左侧工作区栏 v2.0
 *
 * 替代旧的"节点分类"栏。
 *
 * 功能：
 * - 工作区卡片列表（每个工作区是独立节点视图）
 * - 点击切换工作区 → 画布过滤到该工作区的节点
 * - 新建工作区（+ 按钮）
 * - 右键工作区卡片：重命名/删除/改色
 * - 显示每个工作区的节点数和连线数
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Box, Boxes, Package, Shield, Swords, Apple,
  Trees, Castle, Globe, FlaskConical, MoreVertical,
  Trash2, Edit3, Check, X,
} from 'lucide-react'
import { useWorkspaceStore as useWsStore } from '@/stores/workspace-store'
import { useWorkspaceStore } from '@/stores/workspace'
import { useCanvasStore } from '@/stores/canvas'
import { WORKSPACE_TEMPLATES } from '@/lib/workspace-templates'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const COLORS = ['teal', 'cyan', 'emerald', 'amber', 'rose', 'violet', 'pink', 'slate']
const COLOR_HEX: Record<string, string> = {
  teal: '#2dd4bf',
  cyan: '#22d3ee',
  emerald: '#34d399',
  amber: '#fbbf24',
  rose: '#fb7185',
  violet: '#a78bfa',
  pink: '#f472b6',
  slate: '#94a3b8',
}

export function WorkspacePanel({ className }: { className?: string }) {
  const currentProjectId = useWorkspaceStore((s) => s.currentProjectId)
  const { workspaces, activeWorkspaceId, loadWorkspaces, createWorkspace, setActive, isLoading } = useWsStore()
  const [templateDialogOpen, setTemplateDialogOpen] = React.useState(false)

  // 加载工作区
  React.useEffect(() => {
    if (currentProjectId) {
      loadWorkspaces(currentProjectId)
    }
  }, [currentProjectId, loadWorkspaces])

  const handleCreateFromTemplate = async (templateId: string, name: string, color: string, icon: string) => {
    if (!currentProjectId) return
    // 调用 API 创建带模板的工作区
    const res = await fetch(`/api/projects/${currentProjectId}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color, icon, template: templateId }),
    })
    if (!res.ok) {
      toast.error('创建失败')
      return
    }
    const ws = await res.json()
    // 刷新工作区列表
    await loadWorkspaces(currentProjectId)
    setActive(ws.id)
    toast.success('工作区已创建', { description: `${name} · ${ws.nodeCount} 节点` })
    setTemplateDialogOpen(false)
  }

  return (
    <aside
      className={cn(
        'flex h-full w-[220px] shrink-0 flex-col border-r border-border/30 bg-sidebar/20',
        className,
      )}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          工作区
        </h3>
        <button
          onClick={() => setTemplateDialogOpen(true)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/40 hover:text-primary"
          aria-label="新建工作区"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 工作区列表 */}
      <div className="nexcube-scroll flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          <div className="space-y-2 px-1">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg border border-border/30 bg-muted/20" />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence>
              {workspaces.map((ws) => (
                <WorkspaceCard
                  key={ws.id}
                  workspace={ws}
                  isActive={ws.id === activeWorkspaceId}
                  onClick={() => setActive(ws.id)}
                  projectId={currentProjectId}
                />
              ))}
            </AnimatePresence>

            {/* 空状态 */}
            {workspaces.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Box className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-[11px] text-muted-foreground">点击 + 创建工作区</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="border-t border-border/20 px-4 py-2">
        <p className="text-[9px] text-muted-foreground/40">
          {workspaces.length} 个工作区 · 右键管理
        </p>
      </div>

      {/* 模板选择对话框 */}
      <TemplateDialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        onCreate={handleCreateFromTemplate}
      />
    </aside>
  )
}

function WorkspaceCard({
  workspace,
  isActive,
  onClick,
  projectId,
}: {
  workspace: {
    id: string
    name: string
    color: string
    icon: string
    nodeCount: number
    edgeCount: number
  }
  isActive: boolean
  onClick: () => void
  projectId: string | null
}) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [renaming, setRenaming] = React.useState(false)
  const [name, setName] = React.useState(workspace.name)
  const { renameWorkspace, deleteWorkspace } = useWsStore()

  const colorHex = COLOR_HEX[workspace.color] ?? COLOR_HEX.teal

  const handleRename = async () => {
    if (!name.trim() || !projectId) return
    await renameWorkspace(projectId, workspace.id, name.trim())
    setRenaming(false)
  }

  const handleDelete = async () => {
    if (!projectId) return
    if (workspace.nodeCount > 0) {
      if (!confirm(`"${workspace.name}" 包含 ${workspace.nodeCount} 个节点，确定删除？`)) return
    }
    await deleteWorkspace(projectId, workspace.id)
    toast.success('工作区已删除')
    setMenuOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onContextMenu={(e) => {
          e.preventDefault()
          setMenuOpen(!menuOpen)
        }}
        className={cn(
          'group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200',
          isActive
            ? 'border-primary/30 bg-primary/5 shadow-sm'
            : 'border-border/30 bg-card/20 hover:border-border/50 hover:bg-card/40',
        )}
      >
        {/* 颜色标识条 */}
        <div
          className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full opacity-60"
          style={{ backgroundColor: colorHex, display: isActive ? 'block' : 'none' }}
        />

        {/* 图标 */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
          style={{
            backgroundColor: `${colorHex}15`,
            color: colorHex,
            boxShadow: `inset 0 0 0 1px ${colorHex}20`,
          }}
        >
          <Box className="h-4 w-4" />
        </div>

        {/* 名称 + 统计 */}
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded border border-primary/40 bg-background px-1 text-xs text-foreground focus:outline-none"
            />
          ) : (
            <div className="truncate text-xs font-medium text-foreground">{workspace.name}</div>
          )}
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <span>{workspace.nodeCount} 节点</span>
            <span>·</span>
            <span>{workspace.edgeCount} 连线</span>
          </div>
        </div>

        {/* 更多按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 opacity-0 transition-opacity hover:bg-accent/40 hover:text-foreground group-hover:opacity-100"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </button>

      {/* 右键菜单 */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-2 top-12 z-50 w-32 rounded-lg border border-border/50 bg-popover p-1 shadow-floating"
          >
            <button
              onClick={() => { setRenaming(true); setMenuOpen(false) }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] text-foreground transition-colors hover:bg-accent/40"
            >
              <Edit3 className="h-3 w-3" />
              重命名
            </button>
            <button
              onClick={handleDelete}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
              删除
            </button>
          </motion.div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 模板选择对话框                                                      */
/* ------------------------------------------------------------------ */

function TemplateDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (templateId: string, name: string, color: string, icon: string) => void
}) {
  const [selected, setSelected] = React.useState('blank')
  const [name, setName] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setSelected('blank')
      setName('')
    }
  }, [open])

  const templates = WORKSPACE_TEMPLATES

  const handleCreate = () => {
    const template = templates.find((t) => t.id === selected)
    if (!template) return
    onCreate(template.id, name.trim() || template.name, template.color, template.icon)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className="fixed left-1/2 top-1/2 z-50 w-[520px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-border/50 bg-popover/95 shadow-floating backdrop-blur-xl"
      >
        {/* 标题 */}
        <div className="border-b border-border/30 px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">新建工作区</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">选择模板快速创建</p>
        </div>

        {/* 名称输入 */}
        <div className="px-5 py-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="工作区名称（留空使用模板名）"
            className="h-8 w-full rounded-md border border-border/40 bg-background/50 px-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none"
          />
        </div>

        {/* 模板列表 */}
        <div className="nexcube-scroll max-h-64 overflow-y-auto px-3 pb-3">
          <div className="grid grid-cols-1 gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 text-left transition-all',
                  selected === t.id
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border/30 bg-card/20 hover:border-border/50 hover:bg-card/40',
                )}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                  style={{
                    backgroundColor: `${COLOR_HEX[t.color] ?? '#94a3b8'}15`,
                    color: COLOR_HEX[t.color] ?? '#94a3b8',
                  }}
                >
                  <Box className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.description}</div>
                </div>
                {selected === t.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex justify-end gap-2 border-t border-border/30 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent/40"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            className="rounded-md bg-gradient-brand px-4 py-1.5 text-xs font-medium text-primary-foreground shadow-glow"
          >
            创建
          </button>
        </div>
      </motion.div>
    </>
  )
}
