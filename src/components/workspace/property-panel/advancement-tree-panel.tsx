'use client'

/**
 * 成就树可视化面板
 *
 * 在成就节点的属性面板中作为可视化展示：
 *  - 显示当前成就节点列表
 *  - 支持设置 parent 成就（形成树结构）
 *  - 可视化父子关系
 *
 * 成就的 parent 存储在 properties.parentAdvancement 中。
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { Trophy, ChevronRight, GitBranch } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvas'
import { cn } from '@/lib/utils'

const FRAME_STYLES: Record<string, { label: string; color: string }> = {
  task: { label: '普通', color: 'border-border/40 bg-card/30' },
  challenge: { label: '挑战', color: 'border-amber-500/40 bg-amber-500/10' },
  goal: { label: '目标', color: 'border-cyan-500/40 bg-cyan-500/10' },
}

interface AdvancementTreePanelProps {
  /** 当前选中的成就节点 ID */
  currentId: string
  /** 当前 parent 值 */
  parentAdvancement: string | null
  /** parent 变更回调 */
  onParentChange: (parentId: string | null) => void
}

export function AdvancementTreePanel({
  currentId,
  parentAdvancement,
  onParentChange,
}: AdvancementTreePanelProps) {
  const nodes = useCanvasStore((s) => s.nodes)
  const activeWorkspaceId = useCanvasStore((s) => s.activeWorkspaceId)

  // 获取所有成就节点
  const advancementNodes = React.useMemo(
    () => nodes.filter(
      (n) => n.data.kind === 'advancement' && n.data.subGraphId === activeWorkspaceId,
    ),
    [nodes, activeWorkspaceId],
  )

  // 构建父子关系树
  const tree = React.useMemo(() => {
    const nodeMap = new Map(advancementNodes.map((n) => [n.id, n]))
    const children = new Map<string | null, string[]>()

    for (const node of advancementNodes) {
      const parent = (node.data.properties?.parentAdvancement as string) ?? null
      if (!children.has(parent)) children.set(parent, [])
      children.get(parent)!.push(node.id)
    }

    // 找根节点（无 parent）
    const roots = advancementNodes.filter(
      (n) => !n.data.properties?.parentAdvancement,
    )

    return { nodeMap, children, roots }
  }, [advancementNodes])

  // 递归渲染节点
  const renderNode = (node: typeof advancementNodes[0], depth: number): React.ReactNode => {
    const p = (node.data.properties ?? {}) as Record<string, unknown>
    const frame = String(p.frame ?? 'task')
    const frameStyle = FRAME_STYLES[frame] ?? FRAME_STYLES.task
    const isCurrent = node.id === currentId
    const isParent = parentAdvancement === node.id
    const kids = tree.children.get(node.id) ?? []

    return (
      <div key={node.id} style={{ marginLeft: depth * 20 }}>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: depth * 0.03 }}
          className={cn(
            'group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 mb-1 transition-colors',
            frameStyle.color,
            isCurrent && 'ring-2 ring-primary/40',
            isParent && 'ring-2 ring-amber-400/40',
          )}
        >
          <Trophy className={cn(
            'h-3.5 w-3.5 shrink-0',
            isCurrent ? 'text-primary' : 'text-amber-400/60',
          )} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[11px] font-medium text-foreground">
                {node.data.title}
              </span>
              <span className={cn('rounded px-1 py-px text-[8px]', frameStyle.color)}>
                {frameStyle.label}
              </span>
            </div>
            <p className="truncate text-[9px] text-muted-foreground/60">
              {String(p.description ?? '')}
            </p>
          </div>

          {/* 设为 parent 按钮 */}
          {!isCurrent && (
            <button
              onClick={() => onParentChange(isParent ? null : node.id)}
              className={cn(
                'shrink-0 rounded px-1.5 py-0.5 text-[9px] transition-colors',
                isParent
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'opacity-0 group-hover:opacity-100 bg-muted/40 text-muted-foreground hover:text-primary',
              )}
            >
              {isParent ? '已设为前置' : '设为前置'}
            </button>
          )}
          {isCurrent && (
            <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-medium text-primary">
              当前
            </span>
          )}
        </motion.div>

        {/* 递归渲染子节点 */}
        {kids.length > 0 && (
          <div className="ml-3 border-l border-border/20 pl-2">
            {kids.map((kidId) => {
              const kid = tree.nodeMap.get(kidId)
              return kid ? renderNode(kid, depth + 1) : null
            })}
          </div>
        )}
      </div>
    )
  }

  if (advancementNodes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/30 bg-muted/10 p-4 text-center">
        <Trophy className="mx-auto mb-2 h-6 w-6 text-muted-foreground/30" />
        <p className="text-[11px] text-muted-foreground">尚无成就节点</p>
        <p className="text-[10px] text-muted-foreground/50">添加成就节点后可在此查看成就树</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <GitBranch className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-[11px] font-medium text-foreground">成就树</span>
        <span className="rounded-full bg-muted/40 px-1.5 py-px text-[9px] text-muted-foreground">
          {advancementNodes.length} 个成就
        </span>
      </div>

      {/* 当前前置成就 */}
      {parentAdvancement && (
        <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 text-[10px]">
          <ChevronRight className="h-3 w-3 text-amber-400" />
          <span className="text-muted-foreground">前置成就：</span>
          <span className="font-medium text-amber-300">
            {tree.nodeMap.get(parentAdvancement)?.data.title ?? '未知'}
          </span>
          <button
            onClick={() => onParentChange(null)}
            className="ml-auto text-muted-foreground/50 hover:text-red-400"
          >
            移除
          </button>
        </div>
      )}

      {/* 成就树 */}
      <div className="space-y-0.5">
        {tree.roots.map((node) => renderNode(node, 0))}
      </div>

      {/* 说明 */}
      <div className="rounded-lg border border-border/20 bg-muted/10 p-2 text-[9px] leading-relaxed text-muted-foreground/60">
        💡 点击成就右侧"设为前置"可建立父子关系。前置成就完成后才可解锁当前成就。
        普通成就（灰色）→ 挑战（金色）→ 目标（青色）按边框颜色区分。
      </div>
    </div>
  )
}
