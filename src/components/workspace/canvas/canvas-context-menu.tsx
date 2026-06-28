'use client'

/**
 * 画布右键上下文菜单（Task 2-C）
 *
 * 浮动在 contextMenu.x/y 位置，内容根据是否有 nodeId 区分：
 *
 * A) 空白右键（contextMenu.nodeId 为 undefined）：
 *   - 创建节点（按分类展开子菜单）
 *   - 全选
 *   - 清空画布
 *
 * B) 节点右键（contextMenu.nodeId 存在）：
 *   - 复制节点
 *   - 删除节点
 *   - 重命名（toast 提示阶段 3 接入）
 *   - 折叠 / 展开
 *   - ---
 *   - 打包为节点组（仅多选时）
 *   - 导出为函数节点（toast 提示阶段 4 接入）
 *
 * 点击创建节点：在右键位置（屏幕坐标转换为画布坐标）创建新节点。
 * 点击空白处或按 Esc 关闭菜单。
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Box,
  Trash2,
  Copy,
  CopyPlus,
  ClipboardPaste,
  Pencil,
  ChevronsUpDown,
  Group as GroupIcon,
  FunctionSquare,
  ChevronRight,
} from 'lucide-react'
import {
  getNodeTypesByCategory,
  getNodeTypeDefinition,
  type NodeCategory,
  type NodeTypeDefinition,
} from '@/lib/node-system'
import {
  useCanvasStore,
  createFlowNode,
} from '@/stores/canvas'
import { useWorkspaceStore } from '@/stores/workspace'
import { useClipboardStore } from '@/stores/clipboard'
import { cn } from '@/lib/utils'

/** Tailwind 色名 → hex 映射（用于菜单中显示节点类型颜色点） */
const TAILWIND_COLOR_HEX: Record<string, string> = {
  rose: '#f43f5e',
  amber: '#f59e0b',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  emerald: '#10b981',
  violet: '#8b5cf6',
  pink: '#ec4899',
  slate: '#64748b',
  zinc: '#71717a',
}

/** 节点分类中文标签 */
const CATEGORY_LABELS: Record<NodeCategory, string> = {
  core: '核心节点',
  advanced: '高级节点',
  logic: '逻辑节点',
}

/** 分类显示顺序 */
const CATEGORY_ORDER: NodeCategory[] = ['core', 'advanced', 'logic']

interface CategoryGroup {
  category: NodeCategory
  label: string
  items: NodeTypeDefinition[]
}

/** 模块级属性剪贴板（复制/粘贴属性用） */
let copiedProperties: Record<string, unknown> | null = null

export function CanvasContextMenu() {
  const contextMenu = useCanvasStore((s) => s.contextMenu)
  const closeContextMenu = useCanvasStore((s) => s.closeContextMenu)
  const addNode = useCanvasStore((s) => s.addNode)
  const removeNodes = useCanvasStore((s) => s.removeNodes)
  const cloneNodeById = useCanvasStore((s) => s.cloneNodeById)
  const toggleNodeCollapsed = useCanvasStore((s) => s.toggleNodeCollapsed)
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds)
  const groupingSelection = useCanvasStore((s) => s.groupingSelection)
  const nodes = useCanvasStore((s) => s.nodes)
  const clearCanvas = useCanvasStore((s) => s.clearCanvas)
  const groupSelected = useCanvasStore((s) => s.groupSelected)

  const [expandedCategory, setExpandedCategory] = useState<NodeCategory | null>(
    null,
  )
  const menuRef = useRef<HTMLDivElement>(null)

  /* 按分类分组可创建节点类型 */
  const groupedTypes = useMemo<CategoryGroup[]>(() => {
    const map = getNodeTypesByCategory()
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      items: map[cat],
    })).filter((g) => g.items.length > 0)
  }, [])

  /* 监听 Esc 关闭菜单 */
  useEffect(() => {
    if (!contextMenu?.visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContextMenu()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [contextMenu, closeContextMenu])

  if (!contextMenu?.visible) return null

  const targetNode = contextMenu.nodeId
    ? nodes.find((n) => n.id === contextMenu.nodeId)
    : null

  const canvasPos = contextMenu.canvasPosition ?? { x: 0, y: 0 }

  /* 调整位置防止溢出视口 */
  const menuWidth = 220
  const menuMaxHeight = 480
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
  const viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : 1080
  const left = Math.min(contextMenu.x, viewportWidth - menuWidth - 16)
  const top = Math.min(contextMenu.y, viewportHeight - menuMaxHeight - 16)

  /* 创建节点 */
  const handleCreateNode = (kind: string) => {
    const node = createFlowNode(kind, canvasPos)
    addNode(node)
    closeContextMenu()
    const def = getNodeTypeDefinition(kind)
    toast.success(`已创建 ${def?.label ?? kind} 节点`, {
      description: `ID: ${node.id.slice(0, 16)}…`,
    })
  }

  /* 复制节点到剪贴板 */
  const handleCopy = () => {
    if (!contextMenu.nodeId) return
    const ids =
      selectedNodeIds.length > 1 && selectedNodeIds.includes(contextMenu.nodeId)
        ? selectedNodeIds
        : [contextMenu.nodeId]
    const selectedNodes = nodes.filter((n) => ids.includes(n.id))
    if (selectedNodes.length === 0) return
    useClipboardStore.getState().copy(selectedNodes)
    closeContextMenu()
    toast.success(`已复制 ${selectedNodes.length} 个节点到剪贴板`)
  }

  /* 克隆节点（就地复制，偏移 20px） */
  const handleClone = () => {
    if (!contextMenu.nodeId) return
    const ids =
      selectedNodeIds.length > 1 && selectedNodeIds.includes(contextMenu.nodeId)
        ? selectedNodeIds
        : [contextMenu.nodeId]
    useClipboardStore.getState().pushUndo(nodes, useCanvasStore.getState().edges, '克隆节点')
    const clonedIds: string[] = []
    for (const id of ids) {
      const cloned = cloneNodeById(id)
      if (cloned) clonedIds.push(cloned.id)
    }
    if (clonedIds.length > 0) {
      useCanvasStore.getState().setGroupingSelection(clonedIds)
    }
    closeContextMenu()
    toast.success(`已克隆 ${clonedIds.length} 个节点`)
  }

  /* 复制属性（存储到模块级剪贴板） */
  const handleCopyProperties = () => {
    if (!contextMenu.nodeId) return
    const node = nodes.find((n) => n.id === contextMenu.nodeId)
    if (!node) return
    copiedProperties = { ...(node.data.properties ?? {}) }
    // 不复制 name 和 registryId（唯一属性）
    delete copiedProperties.name
    delete copiedProperties.registryId
    closeContextMenu()
    toast.success(`已复制属性（${Object.keys(copiedProperties).length} 个字段）`)
  }

  /* 粘贴属性（应用到当前节点，跳过不兼容的 key） */
  const handlePasteProperties = () => {
    if (!contextMenu.nodeId || !copiedProperties) return
    const node = nodes.find((n) => n.id === contextMenu.nodeId)
    if (!node) return

    // 合并属性：保留 name/registryId，粘贴其他
    const newProperties = {
      ...(node.data.properties ?? {}),
      ...copiedProperties,
      name: node.data.properties?.name, // 保留原 name
      registryId: node.data.properties?.registryId, // 保留原 registryId
    }

    useCanvasStore.getState().updateNode(node.id, {
      data: { ...node.data, properties: newProperties },
    })
    closeContextMenu()
    toast.success(`已粘贴属性到「${node.data.title}」`)
  }

  /* 删除节点（含多选） */
  const handleDelete = () => {
    if (!contextMenu.nodeId) return
    const ids =
      selectedNodeIds.length > 1 && selectedNodeIds.includes(contextMenu.nodeId)
        ? selectedNodeIds
        : [contextMenu.nodeId]
    removeNodes(ids)
    closeContextMenu()
    toast.success(`已删除 ${ids.length} 个节点`)
  }

  /* 重命名：选中节点并把焦点移到属性面板的名称字段 */
  const handleRename = () => {
    if (!contextMenu.nodeId) {
      closeContextMenu()
      return
    }
    // 选中该节点 → 右侧属性面板自动显示，用户可在"名称"字段直接编辑
    const node = useCanvasStore.getState().nodes.find((n) => n.id === contextMenu.nodeId)
    if (node) {
      useCanvasStore.getState().selectNode(contextMenu.nodeId)
      useWorkspaceStore.getState().setSelectedNode(
        contextMenu.nodeId,
        node.data.kind,
        node.data.title,
      )
    }
    closeContextMenu()
    toast.success('已在属性面板选中"名称"字段，可直接编辑')
  }

  /* 折叠 / 展开 */
  const handleToggleCollapse = () => {
    if (!contextMenu.nodeId) return
    toggleNodeCollapsed(contextMenu.nodeId)
    closeContextMenu()
  }

  /* 打包为节点组 */
  const handleGroup = () => {
    const ids =
      selectedNodeIds.length > 1 ? selectedNodeIds : groupingSelection
    if (ids.length < 2) {
      toast.warning('请先选择至少 2 个节点（按住 Shift 多选）')
      closeContextMenu()
      return
    }
    useCanvasStore.setState({ groupingSelection: ids })
    const groupId = groupSelected(
      `节点组 ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`,
      '#71717a',
    )
    closeContextMenu()
    if (groupId) {
      toast.success('已打包为节点组', {
        description: `包含 ${ids.length} 个节点`,
      })
    }
  }

  /* 导出为函数节点（多选时显示，触发封装对话框） */
  const handleExportFunction = () => {
    const ids =
      selectedNodeIds.length > 1 ? selectedNodeIds : groupingSelection
    if (ids.length < 2) {
      toast.warning('请先选择至少 2 个节点（按住 Shift 多选）')
      closeContextMenu()
      return
    }
    // 触发封装对话框（FunctionEncapsulator 监听此 counter）
    useCanvasStore.getState().openEncapsulatorDialog()
    closeContextMenu()
  }

  /* 全选 */
  const handleSelectAll = () => {
    const allIds = nodes.map((n) => n.id)
    useCanvasStore.setState({ selectedNodeIds: allIds })
    closeContextMenu()
    toast.success(`已选中全部 ${allIds.length} 个节点`)
  }

  /* 清空画布 */
  const handleClear = () => {
    if (nodes.length === 0) {
      closeContextMenu()
      return
    }
    clearCanvas()
    closeContextMenu()
    toast.success('已清空画布')
  }

  return (
    <>
      {/* 透明遮罩：点击外部关闭 */}
      <div
        className="fixed inset-0 z-[100]"
        onClick={closeContextMenu}
        onContextMenu={(e) => {
          e.preventDefault()
          closeContextMenu()
        }}
      />

      {/* 浮动菜单 */}
      <div
        ref={menuRef}
        role="menu"
        aria-orientation="vertical"
        className={cn(
          'fixed z-[101] min-w-[220px] max-w-[280px] rounded-lg border border-border bg-popover/95 p-1 shadow-2xl backdrop-blur-md',
          'animate-in fade-in-0 zoom-in-95',
        )}
        style={{ left, top, maxHeight: menuMaxHeight }}
      >
        {targetNode ? (
          /* B) 节点右键菜单 */
          <>
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              节点操作 · {targetNode.data.title}
            </div>
            <MenuItem
              icon={<Copy className="h-3.5 w-3.5" />}
              label="复制节点"
              shortcut="Ctrl+C"
              onClick={handleCopy}
            />
            <MenuItem
              icon={<CopyPlus className="h-3.5 w-3.5" />}
              label="克隆节点"
              shortcut="Ctrl+D"
              onClick={handleClone}
            />
            <MenuItem
              icon={<Pencil className="h-3.5 w-3.5" />}
              label="重命名"
              onClick={handleRename}
            />
            <MenuSeparator />
            <MenuItem
              icon={<Copy className="h-3.5 w-3.5" />}
              label="复制属性"
              onClick={handleCopyProperties}
            />
            <MenuItem
              icon={<ClipboardPaste className="h-3.5 w-3.5" />}
              label="粘贴属性"
              onClick={handlePasteProperties}
              disabled={!copiedProperties}
            />
            <MenuSeparator />
            <MenuItem
              icon={<ChevronsUpDown className="h-3.5 w-3.5" />}
              label={targetNode.data.isCollapsed ? '展开节点' : '折叠节点'}
              onClick={handleToggleCollapse}
            />
            <MenuSeparator />
            <MenuItem
              icon={<GroupIcon className="h-3.5 w-3.5" />}
              label="打包为节点组"
              hint={
                selectedNodeIds.length > 1
                  ? `${selectedNodeIds.length} 个节点`
                  : undefined
              }
              onClick={handleGroup}
            />
            <MenuItem
              icon={<FunctionSquare className="h-3.5 w-3.5" />}
              label="封装为函数节点"
              hint={
                selectedNodeIds.length > 1
                  ? `${selectedNodeIds.length} 个节点`
                  : undefined
              }
              onClick={handleExportFunction}
            />
            <MenuSeparator />
            <MenuItem
              icon={<Trash2 className="h-3.5 w-3.5" />}
              label="删除节点"
              destructive
              shortcut="Delete"
              onClick={handleDelete}
            />
          </>
        ) : (
          /* A) 空白右键菜单 */
          <>
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              画布操作
            </div>

            {/* 创建节点 —— 分类展开 */}
            <div className="px-2 py-1.5">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
                onClick={() =>
                  setExpandedCategory((c) => (c === null ? 'core' : null))
                }
              >
                <Plus className="h-3.5 w-3.5 text-emerald-400" />
                <span className="flex-1 text-left">创建节点</span>
                <ChevronRight
                  className={cn(
                    'h-3.5 w-3.5 text-muted-foreground transition-transform',
                    expandedCategory && 'rotate-90',
                  )}
                />
              </button>

              {/* 分类列表 */}
              <div className="mt-1 max-h-[320px] space-y-2 overflow-y-auto pl-1 nexcube-scroll">
                {groupedTypes.map((group) => (
                  <div key={group.category} className="space-y-1">
                    <button
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors',
                        expandedCategory === group.category
                          ? 'bg-accent/60 text-emerald-300'
                          : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground',
                      )}
                      onClick={() =>
                        setExpandedCategory((c) =>
                          c === group.category ? null : group.category,
                        )
                      }
                    >
                      <ChevronRight
                        className={cn(
                          'h-3 w-3 transition-transform',
                          expandedCategory === group.category && 'rotate-90',
                        )}
                      />
                      {group.label}
                      <span className="ml-auto text-[9px] opacity-60">
                        {group.items.length}
                      </span>
                    </button>

                    {expandedCategory === group.category && (
                      <div className="space-y-0.5 pl-3">
                        {group.items.map((def) => (
                          <CreateNodeItem
                            key={def.kind}
                            def={def}
                            onCreate={() => handleCreateNode(def.kind)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <MenuSeparator />
            <MenuItem
              icon={<Box className="h-3.5 w-3.5" />}
              label="全选"
              shortcut="Ctrl+A"
              onClick={handleSelectAll}
            />
            <MenuItem
              icon={<Trash2 className="h-3.5 w-3.5" />}
              label="清空画布"
              destructive
              onClick={handleClear}
              disabled={nodes.length === 0}
            />
          </>
        )}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* 子组件                                                              */
/* ------------------------------------------------------------------ */

interface MenuItemProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  shortcut?: string
  destructive?: boolean
  disabled?: boolean
  hint?: string
}

function MenuItem({
  icon,
  label,
  onClick,
  shortcut,
  destructive,
  disabled,
  hint,
}: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-40'
          : destructive
            ? 'text-rose-300 hover:bg-rose-500/10'
            : 'text-foreground hover:bg-accent',
      )}
      onClick={onClick}
    >
      <span className="flex h-3.5 w-3.5 items-center justify-center">
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {hint ? (
        <span className="text-[10px] text-muted-foreground">{hint}</span>
      ) : null}
      {shortcut ? (
        <kbd className="text-[10px] font-mono text-muted-foreground">
          {shortcut}
        </kbd>
      ) : null}
    </button>
  )
}

function MenuSeparator() {
  return <div className="my-1 h-px bg-border/60" />
}

function CreateNodeItem({
  def,
  onCreate,
}: {
  def: NodeTypeDefinition
  onCreate: () => void
}) {
  const colorHex: string = TAILWIND_COLOR_HEX[def.color] ?? '#71717a'
  return (
    <button
      type="button"
      role="menuitem"
      className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs text-foreground transition-colors hover:bg-accent"
      onClick={onCreate}
      title={def.description}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: colorHex }}
      />
      <span className="flex-1 text-left">{def.label}</span>
      <span className="text-[9px] text-muted-foreground">{def.kind}</span>
    </button>
  )
}
