'use client'

/**
 * 项目统计仪表盘
 *
 * 显示当前项目的统计数据：
 *  - 节点数量（按类型分布）
 *  - 生成文件数
 *  - 代码行数
 *  - 项目版本
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { Boxes, FileCode2, Code2, Layers, GitBranch } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvas'
import { getNodeTypeDefinition } from '@/lib/node-system'
import { cn } from '@/lib/utils'

const TYPE_COLORS: Record<string, string> = {
  entity: 'bg-rose-500/15 text-rose-300',
  block: 'bg-amber-500/15 text-amber-300',
  item: 'bg-teal-500/15 text-teal-300',
  equipment: 'bg-orange-500/15 text-orange-300',
  weapon: 'bg-red-500/15 text-red-300',
  food: 'bg-lime-500/15 text-lime-300',
  biome: 'bg-emerald-500/15 text-emerald-300',
  structure: 'bg-stone-500/15 text-stone-300',
  dimension: 'bg-purple-500/15 text-purple-300',
  potion: 'bg-pink-500/15 text-pink-300',
  enchantment: 'bg-violet-500/15 text-violet-300',
  advancement: 'bg-amber-500/15 text-amber-300',
  recipe: 'bg-orange-500/15 text-orange-300',
  blackbox: 'bg-zinc-500/15 text-zinc-300',
  spell: 'bg-cyan-500/15 text-cyan-300',
}

export function ProjectStats({ onOpen }: { onOpen?: () => void }) {
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const activeWorkspaceId = useCanvasStore((s) => s.activeWorkspaceId)

  const wsNodes = React.useMemo(
    () => nodes.filter((n) => n.data.subGraphId === activeWorkspaceId),
    [nodes, activeWorkspaceId],
  )

  const wsNodeIds = React.useMemo(
    () => new Set(wsNodes.map((n) => n.id)),
    [wsNodes],
  )

  const wsEdges = React.useMemo(
    () => edges.filter((e) => wsNodeIds.has(e.source) && wsNodeIds.has(e.target)),
    [edges, wsNodeIds],
  )

  // 按类型统计
  const typeStats = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const n of wsNodes) {
      map.set(n.data.kind, (map.get(n.data.kind) ?? 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [wsNodes])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
          <GitBranch className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">项目统计</p>
          <p className="text-[10px] text-muted-foreground">当前工作区数据概览</p>
        </div>
      </div>

      {/* 概览数字 */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={Boxes} value={wsNodes.length} label="节点" color="text-primary" />
        <StatCard icon={Layers} value={wsEdges.length} label="连线" color="text-cyan-400" />
        <StatCard icon={FileCode2} value={typeStats.length} label="类型" color="text-violet-400" />
      </div>

      {/* 类型分布 */}
      {typeStats.length > 0 && (
        <div className="rounded-lg border border-border/30 bg-card/20 p-2.5">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            类型分布
          </p>
          <div className="space-y-1">
            {typeStats.map(([kind, count]) => {
              const def = getNodeTypeDefinition(kind)
              const label = def?.label ?? kind
              const percentage = (count / wsNodes.length) * 100
              return (
                <div key={kind} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 truncate text-[10px] text-muted-foreground">
                    {label}
                  </span>
                  <div className="relative h-4 flex-1 overflow-hidden rounded bg-muted/20">
                    <div
                      className={cn('h-full rounded transition-all', TYPE_COLORS[kind] ?? 'bg-muted/40')}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right font-mono text-[10px] font-semibold text-foreground">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 代码生成预估 */}
      <div className="rounded-lg border border-border/30 bg-card/20 p-2.5">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Code2 className="h-3 w-3 text-primary" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            导出预估
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Java 文件</span>
            <span className="font-mono font-semibold text-foreground">
              ~{Math.ceil(wsNodes.length * 1.5) + 5}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">JSON 文件</span>
            <span className="font-mono font-semibold text-foreground">
              ~{wsNodes.length + 3}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">代码行数</span>
            <span className="font-mono font-semibold text-foreground">
              ~{wsNodes.length * 40 + 200}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">ZIP 大小</span>
            <span className="font-mono font-semibold text-foreground">
              ~{Math.ceil((wsNodes.length * 40 + 200) / 1024)} KB
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
  color: string
}) {
  return (
    <div className="rounded-lg border border-border/30 bg-card/20 p-2 text-center">
      <Icon className={cn('mx-auto mb-1 h-4 w-4', color)} />
      <div className={cn('font-mono text-lg font-bold', color)}>{value}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  )
}
