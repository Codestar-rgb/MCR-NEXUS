'use client'

/**
 * NexCube 代码编辑器工具栏
 *
 * 功能：
 *  - 顶部工具栏：当前文件路径 + 格式化按钮 + 保存按钮 + 同步状态指示
 *  - "同步到节点" 按钮（emerald）—— 点击触发 AST 解析，将代码反向同步为节点
 *  - "从节点生成" 按钮（teal）—— 点击重新从节点画布生成代码
 *  - 同步状态徽章：synced / dirty / syncing / error
 *  - 光标位置（行:列）显示
 *
 * 集成点：
 *  - 位于 FileTabs 之上（h-10）
 *  - 与 code-editor.tsx 共享光标位置 + 文件路径
 *  - 同步/生成按钮通过 props 回调外发（Task 4-B 实现 AST 解析逻辑）
 */

import * as React from 'react'
import {
  Save,
  Wand2,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
  FileCode2,
  CircleDot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

/* ------------------------------------------------------------------ */
/* 类型定义                                                            */
/* ------------------------------------------------------------------ */

export type SyncStatus = 'synced' | 'dirty' | 'syncing' | 'error' | 'readonly'

export interface CodeToolbarProps {
  /** 当前文件完整路径 */
  filePath?: string | null
  /** 文件名 */
  fileName?: string | null
  /** 光标位置（行） */
  cursorLine?: number
  /** 光标位置（列） */
  cursorColumn?: number
  /** 文件总行数 */
  totalLines?: number
  /** 同步状态 */
  syncStatus?: SyncStatus
  /** 同步状态描述（用于 Tooltip） */
  syncMessage?: string
  /** 是否正在保存 */
  isSaving?: boolean
  /** 是否正在生成 */
  isGenerating?: boolean
  /** 是否正在同步 */
  isSyncing?: boolean
  /** 是否只读文件 */
  isReadOnly?: boolean
  /** 保存按钮回调 */
  onSave?: () => void
  /** 格式化按钮回调 */
  onFormat?: () => void
  /** 同步到节点按钮回调 */
  onSyncToNodes?: () => void
  /** 从节点生成按钮回调 */
  onGenerateFromNodes?: () => void
  className?: string
}

/* ------------------------------------------------------------------ */
/* 同步状态 → 徽章样式                                                 */
/* ------------------------------------------------------------------ */

function getSyncBadge(status: SyncStatus): {
  label: string
  className: string
  icon: React.ReactNode
} {
  switch (status) {
    case 'synced':
      return {
        label: '已同步',
        className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
        icon: <Check className="h-3 w-3" />,
      }
    case 'dirty':
      return {
        label: '未保存',
        className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
        icon: <CircleDot className="h-3 w-3" />,
      }
    case 'syncing':
      return {
        label: '同步中',
        className: 'border-teal-500/30 bg-teal-500/10 text-teal-400',
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
      }
    case 'error':
      return {
        label: '同步失败',
        className: 'border-red-500/30 bg-red-500/10 text-red-400',
        icon: <AlertCircle className="h-3 w-3" />,
      }
    case 'readonly':
      return {
        label: '只读',
        className: 'border-zinc-600/30 bg-zinc-700/20 text-zinc-400',
        icon: <FileCode2 className="h-3 w-3" />,
      }
    default:
      return {
        label: '未知',
        className: 'border-zinc-700 bg-zinc-800 text-zinc-400',
        icon: null,
      }
  }
}

/* ------------------------------------------------------------------ */
/* 工具按钮                                                            */
/* ------------------------------------------------------------------ */

interface ToolButtonProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'default' | 'emerald' | 'teal' | 'ghost' | 'outline'
  className?: string
}

function ToolButton({
  icon,
  label,
  onClick,
  disabled,
  loading,
  variant = 'ghost',
  className,
}: ToolButtonProps) {
  const variantClass =
    variant === 'emerald'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300'
      : variant === 'teal'
        ? 'border-teal-500/40 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 hover:text-teal-300'
        : variant === 'default'
          ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
          : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled || loading}
          className={cn(
            'h-8 gap-1.5 border px-2.5 text-xs font-medium',
            variantClass,
            className,
          )}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <span className="h-3.5 w-3.5">{icon}</span>
          )}
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export function CodeToolbar({
  filePath,
  fileName,
  cursorLine,
  cursorColumn,
  totalLines,
  syncStatus = 'synced',
  syncMessage,
  isSaving,
  isGenerating,
  isSyncing,
  isReadOnly,
  onSave,
  onFormat,
  onSyncToNodes,
  onGenerateFromNodes,
  className,
}: CodeToolbarProps) {
  // 显示路径（去掉常见前缀，更紧凑）
  const displayPath = React.useMemo(() => {
    if (!filePath) return null
    // 截断显示：保留最后两段路径
    const parts = filePath.split('/')
    if (parts.length <= 3) return filePath
    return `.../${parts.slice(-3).join('/')}`
  }, [filePath])

  const syncBadge = getSyncBadge(syncStatus)
  const tooltipText = syncMessage ?? syncBadge.label

  return (
    <div
      role="toolbar"
      aria-label="代码编辑器工具栏"
      className={cn(
        'flex h-10 w-full items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-3',
        className,
      )}
    >
      {/* 左侧：文件图标 + 路径 */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <FileCode2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
        <div className="flex min-w-0 flex-col">
          <span
            className="truncate text-xs font-medium text-zinc-200"
            title={filePath ?? undefined}
          >
            {fileName ?? '未选择文件'}
          </span>
          {displayPath && (
            <span
              className="truncate text-[10px] text-zinc-500"
              title={filePath ?? undefined}
            >
              {displayPath}
            </span>
          )}
        </div>

        {/* 同步状态徽章 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                'ml-1 gap-1 px-1.5 py-0 text-[10px] font-normal',
                syncBadge.className,
              )}
            >
              {syncBadge.icon}
              <span className="hidden md:inline">{syncBadge.label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* 光标位置 */}
        {typeof cursorLine === 'number' &&
          typeof cursorColumn === 'number' && (
            <span className="hidden select-none px-1.5 font-mono text-[10px] text-zinc-600 sm:inline">
              {cursorLine}:{cursorColumn}
              {typeof totalLines === 'number' ? ` / ${totalLines}` : ''}
            </span>
          )}

        {/* 分隔符 */}
        <span className="h-5 w-px bg-zinc-800" aria-hidden />

        {/* 格式化 */}
        <ToolButton
          icon={<Wand2 className="h-3.5 w-3.5" />}
          label="格式化"
          onClick={onFormat}
          disabled={isReadOnly}
          variant="outline"
        />

        {/* 保存 */}
        <ToolButton
          icon={<Save className="h-3.5 w-3.5" />}
          label={isSaving ? '保存中' : '保存'}
          onClick={onSave}
          disabled={isReadOnly}
          loading={isSaving}
          variant="default"
        />

        {/* 分隔符 */}
        <span className="h-5 w-px bg-zinc-800" aria-hidden />

        {/* 同步到节点（emerald）—— AST 解析反向同步 */}
        <ToolButton
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          label={isSyncing ? '同步中' : '同步到节点'}
          onClick={onSyncToNodes}
          loading={isSyncing}
          variant="emerald"
        />

        {/* 从节点生成（teal）—— 节点 → 代码 */}
        <ToolButton
          icon={<Wand2 className="h-3.5 w-3.5" />}
          label={isGenerating ? '生成中' : '从节点生成'}
          onClick={onGenerateFromNodes}
          loading={isGenerating}
          variant="teal"
        />
      </div>
    </div>
  )
}

export default CodeToolbar
