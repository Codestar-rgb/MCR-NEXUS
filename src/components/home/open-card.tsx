'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { FolderOpen, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { ModLoader, RecentProject } from '@/types'

interface OpenCardProps {
  onOpen?: (projectId: string) => void
  onCreate?: () => void
}

const LOADER_STYLES: Record<ModLoader, string> = {
  forge: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  fabric: 'bg-teal-500/10 text-teal-300 ring-teal-500/20',
  neoforge: 'bg-cyan-500/10 text-cyan-300 ring-cyan-500/20',
  quilt: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
}

const LOADER_LABEL: Record<ModLoader, string> = {
  forge: 'Forge',
  fabric: 'Fabric',
  neoforge: 'NeoForge',
  quilt: 'Quilt',
}

export function OpenCard({ onOpen, onCreate }: OpenCardProps) {
  const { data, isLoading } = useQuery<RecentProject[]>({
    queryKey: ['projects', 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/projects?recent=true', { cache: 'no-store' })
      if (!res.ok) throw new Error('failed to load recent projects')
      return (await res.json()) as RecentProject[]
    },
    placeholderData: [],
    retry: false,
  })

  const projects = (data ?? []).slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/60 bg-card/50 p-5 transition-all duration-200',
        'hover:border-primary/30 hover:bg-card/80',
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-300 ring-1 ring-teal-500/15">
          <FolderOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground">打开项目</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            快速访问本地历史项目
          </p>
        </div>
      </div>

      <div className="my-4 h-px w-full bg-border/50" />

      {/* 最近列表 */}
      <div className="max-h-64 overflow-y-auto pr-1 nexcube-scroll">
        {isLoading ? (
          <RecentListSkeleton />
        ) : projects.length === 0 ? (
          <EmptyState onCreate={onCreate} />
        ) : (
          <ul className="flex flex-col gap-1">
            {projects.map((p, idx) => (
              <RecentItem key={p.id} project={p} onOpen={onOpen} index={idx} />
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}

function RecentItem({
  project,
  onOpen,
  index,
}: {
  project: RecentProject
  onOpen?: (id: string) => void
  index: number
}) {
  const openedLabel = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(project.lastOpenedAt), {
        addSuffix: true,
        locale: zhCN,
      })
    } catch {
      return '—'
    }
  }, [project.lastOpenedAt])

  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: 0.15 + index * 0.04 }}
    >
      <button
        type="button"
        onClick={() => onOpen?.(project.id)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-all duration-150',
          'hover:bg-accent/50 hover:shadow-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        )}
      >
        {/* 项目缩略图：渐变背景 + 首字母 */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/20 to-primary/5 text-[10px] font-bold text-primary ring-1 ring-primary/15">
          {project.name.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {project.name}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="tabular-nums">MC {project.mcVersion}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {openedLabel}
            </span>
          </div>
        </div>

        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1',
            LOADER_STYLES[project.loader],
          )}
        >
          {LOADER_LABEL[project.loader]} {project.loaderVersion}
        </span>
      </button>
    </motion.li>
  )
}

function RecentListSkeleton() {
  return (
    <ul className="flex flex-col gap-1.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 rounded-lg px-2.5 py-2">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-md bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted/70" />
          </div>
          <div className="h-5 w-16 shrink-0 animate-pulse rounded-full bg-muted" />
        </li>
      ))}
    </ul>
  )
}

function EmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
        <FolderOpen className="h-4 w-4" />
      </div>
      <p className="text-xs text-muted-foreground">暂无项目，点击上方创建</p>
      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-1 text-xs font-medium text-primary hover:text-primary/80 hover:underline"
        >
          立即创建 →
        </button>
      ) : null}
    </div>
  )
}
