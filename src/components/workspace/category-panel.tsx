'use client'

/**
 * 左侧分类卡片栏 v2.0
 *
 * 替代旧的工程文件树。按分类展示节点卡片列表：
 * - 实体（Entity）
 * - 方块（Block）
 * - 物品（Item）
 * - 装备（Equipment）
 * - 武器（Weapon）
 * - 食物（Food）
 * - 群系（Biome）
 * - 结构（Structure）
 * - 维度（Dimension）
 * - 药水（Potion）
 *
 * 功能：
 * - 点击分类筛选画布上的节点
 * - 每个分类显示节点数量
 * - 可创建新节点（点击 + 按钮）
 * - 可折叠/展开
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Boxes, Box, Package, Shield, Swords, Apple,
  Trees, Castle, Globe, FlaskConical,
  Plus, ChevronDown, ChevronRight, Search,
} from 'lucide-react'
import { useCanvasStore } from '@/stores/canvas'
import { useWorkspaceStore } from '@/stores/workspace'
import { getNodeColorHex } from '@/stores/canvas'
import { cn } from '@/lib/utils'

interface CategoryDef {
  kind: string
  label: string
  icon: React.ElementType
  color: string
}

const CATEGORIES: CategoryDef[] = [
  { kind: 'entity', label: '实体', icon: Boxes, color: 'rose' },
  { kind: 'block', label: '方块', icon: Box, color: 'amber' },
  { kind: 'item', label: '物品', icon: Package, color: 'teal' },
  { kind: 'equipment', label: '装备', icon: Shield, color: 'cyan' },
  { kind: 'weapon', label: '武器', icon: Swords, color: 'rose' },
  { kind: 'food', label: '食物', icon: Apple, color: 'amber' },
  { kind: 'biome', label: '群系', icon: Trees, color: 'emerald' },
  { kind: 'structure', label: '结构', icon: Castle, color: 'violet' },
  { kind: 'dimension', label: '维度', icon: Globe, color: 'teal' },
  { kind: 'potion', label: '药水', icon: FlaskConical, color: 'pink' },
]

interface CategoryCardPanelProps {
  className?: string
}

export function CategoryCardPanel({ className }: CategoryCardPanelProps) {
  const nodes = useCanvasStore((s) => s.nodes)
  const selectNode = useCanvasStore((s) => s.selectNode)
  const setSelectedNode = useWorkspaceStore((s) => s.setSelectedNode)
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = React.useState('')

  const toggleCategory = (kind: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }

  const handleNodeClick = (nodeId: string, kind: string, title: string) => {
    selectNode(nodeId)
    setSelectedNode(nodeId, kind as 'entity' | 'block' | 'item' | null, title)
  }

  // 按分类分组节点
  const nodesByCategory = React.useMemo(() => {
    const map = new Map<string, typeof nodes>()
    for (const cat of CATEGORIES) {
      const filtered = nodes.filter((n) => n.data.kind === cat.kind)
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return filtered.filter((n) => n.data.title.toLowerCase().includes(q))
      }
      map.set(cat.kind, filtered)
    }
    return map
  }, [nodes, searchQuery])

  return (
    <aside
      data-slot="category-card-panel"
      className={cn(
        'flex h-full flex-col border-r border-border/40 bg-sidebar/50',
        className,
      )}
    >
      {/* 标题栏 */}
      <div className="border-b border-border/40 px-3 py-2.5">
        <h3 className="text-xs font-semibold text-foreground">节点分类</h3>
      </div>

      {/* 搜索框 */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索节点..."
            className="h-7 w-full rounded-md border border-border/50 bg-muted/30 pl-7 pr-2 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none"
          />
        </div>
      </div>

      {/* 分类列表 */}
      <div className="nexcube-scroll flex-1 overflow-y-auto px-2 pb-3">
        {CATEGORIES.map((cat) => {
          const catNodes = nodesByCategory.get(cat.kind) ?? nodes.filter((n) => n.data.kind === cat.kind)
          const count = catNodes.length
          const isExpanded = expandedCategories.has(cat.kind) || (!!searchQuery && count > 0)
          const Icon = cat.icon

          return (
            <div key={cat.kind} className="mb-0.5">
              {/* 分类标题 */}
              <button
                onClick={() => toggleCategory(cat.kind)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                  'hover:bg-accent/50',
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                )}
                <Icon className={cn('h-3.5 w-3.5 shrink-0')} style={{ color: getNodeColorHex(cat.kind) }} />
                <span className="flex-1 text-[11px] font-medium text-foreground">{cat.label}</span>
                {count > 0 && (
                  <span className="rounded-full bg-muted/60 px-1.5 py-px text-[9px] font-mono text-muted-foreground">
                    {count}
                  </span>
                )}
              </button>

              {/* 展开的节点列表 */}
              {isExpanded && count > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.15 }}
                  className="ml-5 border-l border-border/30 pl-2"
                >
                  {catNodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => handleNodeClick(node.id, node.data.kind, node.data.title)}
                      className={cn(
                        'flex w-full items-center gap-1.5 rounded px-2 py-1 text-left transition-colors',
                        'hover:bg-accent/40',
                      )}
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: getNodeColorHex(node.data.kind) }}
                      />
                      <span className="truncate text-[10px] text-muted-foreground">
                        {node.data.title}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      {/* 底部：创建提示 */}
      <div className="border-t border-border/40 px-3 py-2">
        <p className="text-[9px] text-muted-foreground/50">
          右键画布创建新节点
        </p>
      </div>
    </aside>
  )
}
