'use client'

/**
 * NexCube 左侧工程树 —— 递归渲染 + 展开/折叠 + 文件类型图标 + 右键菜单
 *
 * Task 1-B
 *
 * 特性：
 *  - 递归渲染 FileTreeNode
 *  - 目录可展开/折叠（顶部状态为 Set<string> expandedIds，便于"折叠全部"）
 *  - 文件按扩展名显示差异化图标和颜色
 *  - 选中文件高亮（emerald 浅色背景）
 *  - hover 显示浅色背景
 *  - 点击文件 → workspace store.selectFile(path)
 *  - 右键菜单：重命名 / 删除 / 复制路径 / 在资源管理器中显示
 *  - 缩进 padding-left = depth * 12px
 *  - 文件名过长 truncate
 *  - 折叠/展开图标 ChevronRight → ChevronDown 旋转动画（CSS transition）
 */

import * as React from 'react'
import {
  ChevronDown,
  ChevronRight,
  File,
  FileCode2,
  FileCog,
  FileImage,
  FileJson,
  FileText,
  FolderClosed,
  FolderOpen,
  Pencil,
  Trash2,
  Copy,
  FolderSearch,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  MOCK_FILE_TREE,
  cloneTreeWithDefaults,
  type FileTreeNode,
} from '@/lib/mock-file-tree'
import { useWorkspaceStore } from '@/stores/workspace'

/* ------------------------------------------------------------------ */
/* 文件类型 → 图标 + 颜色 映射                                          */
/* ------------------------------------------------------------------ */

interface FileIconMeta {
  Icon: LucideIcon
  /** Tailwind text-color class，仅作用于图标 */
  color: string
}

const DEFAULT_FILE_ICON: FileIconMeta = {
  Icon: File,
  color: 'text-muted-foreground',
}

const EXT_ICON_MAP: Record<string, FileIconMeta> = {
  java: { Icon: FileCode2, color: 'text-emerald-400' },
  toml: { Icon: FileText, color: 'text-amber-400' },
  json: { Icon: FileJson, color: 'text-teal-400' },
  png: { Icon: FileImage, color: 'text-cyan-400' },
  jpg: { Icon: FileImage, color: 'text-cyan-400' },
  jpeg: { Icon: FileImage, color: 'text-cyan-400' },
  gradle: { Icon: FileCog, color: 'text-amber-400' },
  properties: { Icon: FileText, color: 'text-muted-foreground' },
  md: { Icon: FileText, color: 'text-muted-foreground' },
  gitignore: { Icon: FileText, color: 'text-muted-foreground' },
  bat: { Icon: FileCog, color: 'text-amber-300' },
  // 空扩展名（如 gradlew）走默认
}

function getFileIconMeta(ext?: string): FileIconMeta {
  if (!ext) return DEFAULT_FILE_ICON
  return EXT_ICON_MAP[ext] ?? DEFAULT_FILE_ICON
}

/* ------------------------------------------------------------------ */
/* 上下文（避免逐层 prop drilling）                                     */
/* ------------------------------------------------------------------ */

interface FileTreeContextValue {
  expandedIds: Set<string>
  toggleExpanded: (id: string) => void
  collapseAll: () => void
  selectedFilePath: string | null
  onSelectFile: (path: string) => void
}

const FileTreeContext = React.createContext<FileTreeContextValue | null>(null)

function useFileTreeContext() {
  const ctx = React.useContext(FileTreeContext)
  if (!ctx) {
    throw new Error('FileTreeNodeView 必须在 <FileTree> 内部使用')
  }
  return ctx
}

/* ------------------------------------------------------------------ */
/* 单个节点渲染                                                        */
/* ------------------------------------------------------------------ */

interface FileTreeNodeViewProps {
  node: FileTreeNode
  depth: number
}

function FileTreeNodeView({ node, depth }: FileTreeNodeViewProps) {
  const ctx = useFileTreeContext()
  const isDir = node.type === 'directory'
  const isExpanded = ctx.expandedIds.has(node.id)
  const isSelected = ctx.selectedFilePath === node.path

  const paddingLeft = 8 + depth * 12

  const handleClick = React.useCallback(() => {
    if (isDir) {
      ctx.toggleExpanded(node.id)
    } else {
      ctx.onSelectFile(node.path)
    }
  }, [ctx, isDir, node.id, node.path])

  const handleCopyPath = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(node.path)
      toast.success('已复制路径到剪贴板', { description: node.path })
    } catch {
      toast.error('复制失败', { description: '请检查浏览器剪贴板权限' })
    }
  }, [node.path])

  const handleNotImplemented = React.useCallback(
    (action: string) => {
      toast.info(`${action}功能开发中`, {
        description: `目标：${node.name}`,
      })
    },
    [node.name],
  )

  const meta = getFileIconMeta(node.ext)
  const FileIcon = meta.Icon

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          role="treeitem"
          aria-selected={isSelected}
          aria-expanded={isDir ? isExpanded : undefined}
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleClick()
            }
          }}
          className={cn(
            'group flex h-7 cursor-pointer items-center gap-1.5 rounded-sm pr-2 text-[13px] leading-none outline-none transition-colors',
            'hover:bg-accent/60 hover:text-accent-foreground',
            'focus-visible:ring-1 focus-visible:ring-emerald-500/40',
            isSelected && [
              'bg-emerald-500/15 text-emerald-100',
              'hover:bg-emerald-500/20',
            ],
            !isSelected && 'text-foreground/85',
          )}
          style={{ paddingLeft }}
        >
          {/* 折叠箭头（仅目录） */}
          <span
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground transition-transform duration-150',
              !isDir && 'invisible',
            )}
            aria-hidden={!isDir}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>

          {/* 文件/目录图标 */}
          {isDir ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-amber-300/90" />
            ) : (
              <FolderClosed className="h-4 w-4 shrink-0 text-amber-300/80" />
            )
          ) : (
            <FileIcon
              className={cn('h-4 w-4 shrink-0', meta.color)}
              strokeWidth={1.75}
            />
          )}

          {/* 名称 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate select-none">{node.name}</span>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[280px]">
              <span className="font-mono text-[11px] break-all">{node.path}</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52">
        {isDir ? (
          <>
            <ContextMenuItem onSelect={() => handleNotImplemented('新建文件')}>
              <File className="mr-2 h-4 w-4" />
              新建文件
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => handleNotImplemented('新建文件夹')}>
              <FolderClosed className="mr-2 h-4 w-4" />
              新建文件夹
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => handleNotImplemented('重命名')}>
              <Pencil className="mr-2 h-4 w-4" />
              重命名
            </ContextMenuItem>
            <ContextMenuItem
              variant="destructive"
              onSelect={() => handleNotImplemented('删除')}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={handleCopyPath}>
              <Copy className="mr-2 h-4 w-4" />
              复制路径
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => handleNotImplemented('在资源管理器中显示')}>
              <FolderSearch className="mr-2 h-4 w-4" />
              在资源管理器中显示
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuItem onSelect={() => handleNotImplemented('打开')}>
              <File className="mr-2 h-4 w-4" />
              打开
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => handleNotImplemented('重命名')}>
              <Pencil className="mr-2 h-4 w-4" />
              重命名
            </ContextMenuItem>
            <ContextMenuItem
              variant="destructive"
              onSelect={() => handleNotImplemented('删除')}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={handleCopyPath}>
              <Copy className="mr-2 h-4 w-4" />
              复制路径
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => handleNotImplemented('在资源管理器中显示')}>
              <FolderSearch className="mr-2 h-4 w-4" />
              在资源管理器中显示
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

/* ------------------------------------------------------------------ */
/* 递归容器                                                            */
/* ------------------------------------------------------------------ */

interface FileTreeBranchProps {
  nodes: FileTreeNode[]
  depth: number
}

function FileTreeBranch({ nodes, depth }: FileTreeBranchProps) {
  return (
    <>
      {nodes.map((node) => (
        <React.Fragment key={node.id}>
          <FileTreeNodeView node={node} depth={depth} />
          {node.type === 'directory' &&
            node.children &&
            node.children.length > 0 && <FileTreeBranch nodes={node.children} depth={depth + 1} />}
        </React.Fragment>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* 文件树根容器                                                        */
/* ------------------------------------------------------------------ */

export interface FileTreeHandle {
  /** 折叠全部目录 */
  collapseAll: () => void
  /** 重新加载（mock 阶段：恢复默认展开） */
  refresh: () => void
}

interface FileTreeProps {
  /** 外部可拿到 collapseAll / refresh 句柄（可选） */
  handleRef?: React.RefObject<FileTreeHandle | null>
}

function FileTreeImpl({ handleRef }: FileTreeProps) {
  // 初始化：克隆 mock，从 isExpanded 字段构建 Set
  const buildInitialExpanded = React.useCallback(() => {
    const set = new Set<string>()
    const walk = (nodes: FileTreeNode[]) => {
      for (const n of nodes) {
        if (n.type === 'directory' && n.isExpanded) {
          set.add(n.id)
        }
        if (n.children) walk(n.children)
      }
    }
    walk(MOCK_FILE_TREE)
    return set
  }, [])

  const [tree] = React.useState(() => cloneTreeWithDefaults(MOCK_FILE_TREE))
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() =>
    buildInitialExpanded(),
  )

  const selectedFilePath = useWorkspaceStore((s) => s.selectedFilePath)
  const selectFile = useWorkspaceStore((s) => s.selectFile)

  const toggleExpanded = React.useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const collapseAll = React.useCallback(() => {
    setExpandedIds(new Set())
    toast.success('已折叠全部目录')
  }, [])

  const refresh = React.useCallback(() => {
    setExpandedIds(buildInitialExpanded())
    toast.success('已刷新文件树')
  }, [buildInitialExpanded])

  // 暴露命令给 header
  React.useEffect(() => {
    if (handleRef) {
      handleRef.current = { collapseAll, refresh }
    }
  }, [handleRef, collapseAll, refresh])

  const ctxValue = React.useMemo<FileTreeContextValue>(
    () => ({
      expandedIds,
      toggleExpanded,
      collapseAll,
      selectedFilePath,
      onSelectFile: selectFile,
    }),
    [expandedIds, toggleExpanded, collapseAll, selectedFilePath, selectFile],
  )

  return (
    <FileTreeContext.Provider value={ctxValue}>
      <div
        role="tree"
        aria-label="工程文件树"
        className="flex flex-col gap-0.5 px-1.5 py-2"
      >
        <FileTreeBranch nodes={tree} depth={0} />
      </div>
    </FileTreeContext.Provider>
  )
}

export const FileTree = React.memo(FileTreeImpl)
