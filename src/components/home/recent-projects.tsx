'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { FolderOpen, Clock, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ModLoader, RecentProject } from '@/types'

interface RecentProjectsProps {
  onOpen: (projectId: string) => void
  onCreate: () => void
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

export function RecentProjects({ onOpen, onCreate }: RecentProjectsProps) {
  const { data, isLoading } = useQuery<RecentProject[]>({
    queryKey: ['projects', 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/projects?recent=true', { cache: 'no-store' })
      if (!res.ok) throw new Error('failed to load')
      return (await res.json()) as RecentProject[]
    },
    placeholderData: [],
    retry: false,
  })

  const projects = (data ?? []).slice(0, 6)

  return (
    <section id="recent-projects" className="mt-12 scroll-mt-4" aria-label="最近项目">
      {/* 标题栏 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">最近项目</h2>
          {projects.length > 0 && (
            <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground">
              {projects.length}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreate}
          className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-primary"
        >
          <Plus className="h-3 w-3" />
          新建
        </Button>
      </div>

      {/* 项目网格 */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border/40 bg-card/30" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* 空状态 */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/50 bg-card/20 py-12 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">还没有项目</p>
            <p className="mt-0.5 text-xs text-muted-foreground">创建你的第一个模组项目开始开发</p>
          </div>
          <Button
            size="sm"
            onClick={onCreate}
            className="mt-1 gap-1.5 rounded-lg bg-gradient-brand text-primary-foreground shadow-glow"
          >
            <Plus className="h-3.5 w-3.5" />
            创建项目
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, idx) => (
            <ProjectCard key={p.id} project={p} onOpen={onOpen} index={idx} />
          ))}
        </div>
      )}
    </section>
  )
}

function ProjectCard({
  project,
  onOpen,
  index,
}: {
  project: RecentProject
  onOpen: (id: string) => void
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
    <motion.button
      type="button"
      onClick={() => onOpen(project.id)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-card/40 p-4 text-left transition-all duration-200',
        'hover:border-primary/30 hover:bg-card/80 hover:shadow-floating',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      )}
    >
      <div className="flex items-start gap-3">
        {/* 项目缩略图 */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-bold text-primary ring-1 ring-primary/15">
          {project.name.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{project.name}</h3>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="tabular-nums">MC {project.mcVersion}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {openedLabel}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1',
                LOADER_STYLES[project.loader],
              )}
            >
              {LOADER_LABEL[project.loader]} {project.loaderVersion}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
        </div>
      </div>
    </motion.button>
  )
}
