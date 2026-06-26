'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { FolderOpen, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  listContainerVariants,
  listItemVariants,
  listItemTransition,
} from '@/components/providers/framer-provider'
import { cn } from '@/lib/utils'
import type { ModLoader, RecentProject } from '@/types'

interface OpenCardProps {
  /** 打开指定项目 */
  onOpen?: (projectId: string) => void
  /** 创建新项目（当列表为空时引导用户） */
  onCreate?: () => void
}

/** 加载器徽章颜色映射 —— 全部使用 emerald/teal/cyan/amber 体系 */
const LOADER_STYLES: Record<ModLoader, string> = {
  forge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  fabric: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
  neoforge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  quilt: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const LOADER_LABEL: Record<ModLoader, string> = {
  forge: 'Forge',
  fabric: 'Fabric',
  neoforge: 'NeoForge',
  quilt: 'Quilt',
}

/**
 * 打开项目卡片：包含「最近打开」列表。
 *
 * 数据来源：GET /api/projects?recent=true（尚未实现，先走 mock 降级）。
 */
export function OpenCard({ onOpen, onCreate }: OpenCardProps) {
  const { data, isLoading, isError } = useQuery<RecentProject[]>({
    queryKey: ['projects', 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/projects?recent=true', { cache: 'no-store' })
      if (!res.ok) throw new Error('failed to load recent projects')
      return (await res.json()) as RecentProject[]
    },
    // API 尚未实现时静默降级到空列表
    placeholderData: [],
    retry: false,
  })

  const projects = (data ?? []).slice(0, 5)

  return (
    <Card
      className={cn(
        'border bg-card p-5 transition-colors duration-200',
        'hover:border-emerald-500/40',
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300">
          <FolderOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground">打开项目</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            快速访问本地历史项目
          </p>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="my-4 h-px w-full bg-border" />

      {/* 最近列表 */}
      <div className="max-h-64 overflow-y-auto pr-1 nexcube-scroll">
        {isLoading ? (
          <RecentListSkeleton />
        ) : isError || projects.length === 0 ? (
          <EmptyState onCreate={onCreate} />
        ) : (
          <motion.ul
            className="flex flex-col gap-1.5"
            variants={listContainerVariants}
            initial="initial"
            animate="animate"
            style={{ willChange: 'transform, opacity' }}
          >
            <AnimatePresence initial={false}>
              {projects.map((p) => (
                <RecentItem key={p.id} project={p} onOpen={onOpen} />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>
    </Card>
  )
}

function RecentItem({
  project,
  onOpen,
}: {
  project: RecentProject
  onOpen?: (id: string) => void
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
      variants={listItemVariants}
      transition={listItemTransition}
      style={{ willChange: 'transform, opacity' }}
    >
      <button
        type="button"
        onClick={() => onOpen?.(project.id)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
          'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
        )}
      >
        {/* 项目缩略图占位（小圆角方块） */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-[10px] font-bold text-emerald-400">
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

        <Badge
          variant="outline"
          className={cn(
            'shrink-0 border text-[10px] font-medium',
            LOADER_STYLES[project.loader],
          )}
        >
          {LOADER_LABEL[project.loader]} {project.loaderVersion}
        </Badge>
      </button>
    </motion.li>
  )
}

function RecentListSkeleton() {
  return (
    <ul className="flex flex-col gap-1.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-lg px-2.5 py-2"
        >
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
          className="mt-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
        >
          立即创建 →
        </button>
      ) : null}
    </div>
  )
}
