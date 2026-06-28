'use client'

/**
 * 组内节点管理面板
 *
 * 选中组节点时，在属性面板中显示组内节点列表：
 *  - 列出所有 parentId === groupId 的节点
 *  - 点击节点名称 → 选中该节点
 *  - 点击移除按钮 → 从组中移除（parentId = null）
 *  - 显示节点类型图标
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { Layers, ChevronRight, X, Box } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvas'
import { useWorkspaceStore } from '@/stores/workspace'
import { getNodeTypeDefinition } from '@/lib/node-system'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface GroupMemberListProps {
  groupId: string
}

export function GroupMemberList({ groupId }: GroupMemberListProps) {
  const nodes = useCanvasStore((s) => s.nodes)
  const updateNode = useCanvasStore((s) => s.updateNode)
  const selectNode = useCanvasStore((s) => s.selectNode)
  const setSelectedNode = useWorkspaceStore((s) => s.setSelectedNode)

  const members = React.useMemo(
    () => nodes.filter((n) => n.data.parentId === groupId),
    [nodes, groupId],
  )

  const handleRemove = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    updateNode(nodeId, {
      data: { ...node.data, parentId: null },
    })
    toast.success('节点已从组中移除')
  }

  const handleSelect = (nodeId: string, kind: string, title: string) => {
    selectNode(nodeId)
    setSelectedNode(nodeId, kind, title)
  }

  return (
    <div className="space-y-3">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <Layers className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-medium text-foreground">组内节点</span>
        <span className="rounded-full bg-primary/10 px-1.5 py-px text-[9px] font-medium text-primary">
          {members.length}
        </span>
      </div>

      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/30 bg-muted/10 py-6 text-center">
          <Box className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground/20" />
          <p className="text-[10px] text-muted-foreground/50">暂无子节点</p>
          <p className="text-[9px] text-muted-foreground/40">拖拽节点到组内即可添加</p>
        </div>
      ) : (
        <div className="space-y-1">
          {members.map((node, idx) => {
            const def = getNodeTypeDefinition(node.data.kind)
            const Icon = def
              ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[def.icon] ?? Box
              : Box
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="group flex items-center gap-2 rounded-lg border border-border/30 bg-card/20 px-2 py-1.5 transition-colors hover:border-primary/30"
              >
                {/* 图标 */}
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-3 w-3" />
                </div>

                {/* 名称 + 类型 */}
                <button
                  onClick={() => handleSelect(node.id, node.data.kind, node.data.title)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="truncate text-[11px] font-medium text-foreground">
                    {node.data.title}
                  </div>
                  <div className="truncate text-[9px] text-muted-foreground/60">
                    {def?.label ?? node.data.kind}
                  </div>
                </button>

                {/* 选中箭头 */}
                <ChevronRight className="h-3 w-3 text-muted-foreground/20 transition-colors group-hover:text-primary" />

                {/* 移除按钮 */}
                <button
                  onClick={() => handleRemove(node.id)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground/30 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  aria-label="从组中移除"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* 提示 */}
      <div className="text-[9px] text-muted-foreground/40">
        💡 拖拽节点到组区域内可添加，拖出可移除。点击节点名可跳转选中。
      </div>
    </div>
  )
}
