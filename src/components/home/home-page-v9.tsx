'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Plus, FolderOpen, Download, Github, Settings, Clock,
  ChevronRight, FileCode2, GitBranch, Search,
} from 'lucide-react'
import { WaterOrb } from '@/components/water-orb'
import { ThemeToggle } from '@/components/home/theme-toggle'
import { Button } from '@/components/ui/button'
import { useWorkspaceStore } from '@/stores/workspace'
import { useI18n } from '@/hooks/use-i18n'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { ModLoader, RecentProject } from '@/types'
import { cn } from '@/lib/utils'

interface HomePageV9Props {
  onCreate: () => void
  onOpen: (projectId: string) => void
  onImport: () => void
}

const LOADER_LABEL: Record<ModLoader, string> = {
  forge: 'Forge',
  fabric: 'Fabric',
  neoforge: 'NeoForge',
  quilt: 'Quilt',
}

export function HomePageV9({ onCreate, onOpen, onImport }: HomePageV9Props) {
  const openSettings = useWorkspaceStore((s) => s.openSettings)
  const { t } = useI18n()

  const { data: recentProjects } = useQuery<RecentProject[]>({
    queryKey: ['projects', 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/projects?recent=true', { cache: 'no-store' })
      if (!res.ok) return []
      return (await res.json()) as RecentProject[]
    },
    placeholderData: [],
    retry: false,
  })

  const projects = (recentProjects ?? []).slice(0, 8)

  return (
    <div className="relative flex h-screen flex-col bg-background">
      {/* 顶部栏 */}
      <header className="relative z-20 flex shrink-0 items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <WaterOrb size={32} />
          <span className="text-sm font-semibold tracking-tight text-foreground">NexCube</span>
          <span className="ml-1 rounded border border-border/40 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/60">
            v0.1.0
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="GitHub"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => window.open('https://github.com/Codestar-rgb/MCR-NEXUS', '_blank')}
          >
            <Github className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="设置"
            onClick={openSettings}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex min-h-0 flex-1 overflow-hidden">
        {/* 左栏：欢迎 + 操作 */}
        <div className="flex flex-1 flex-col justify-center px-16 py-8 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg"
          >
            {/* 水球 */}
            <div className="mb-6">
              <WaterOrb size={64} />
            </div>

            {/* 标题 */}
            <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-foreground">
              {t('home.welcome')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('home.subtitle')} · {t('home.desc')}
            </p>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground/50">
              <GitBranch className="h-3 w-3" />
              <span className="font-mono">MC 1.20.1 · Forge 47.3.7</span>
            </div>
          </motion.div>

          {/* 操作区 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 max-w-lg space-y-2"
          >
            <ActionButton
              icon={Plus}
              title={t('home.create')}
              desc={t('home.createDesc')}
              onClick={onCreate}
              primary
            />
            <ActionButton
              icon={FolderOpen}
              title={t('home.open')}
              desc={t('home.openDesc')}
              onClick={onImport}
            />
            <ActionButton
              icon={Download}
              title={t('home.import')}
              desc={t('home.importDesc')}
              onClick={onImport}
            />
          </motion.div>
        </div>

        {/* 右栏：最近项目 */}
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex w-[380px] shrink-0 flex-col border-l border-border/30 bg-card/20 lg:w-[420px]"
        >
          {/* 标题 + 搜索 */}
          <div className="border-b border-border/20 px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('home.recent')}
              </h2>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="搜索项目..."
                className="h-7 w-full rounded-md border border-border/40 bg-background/50 pl-7 pr-2 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none"
              />
            </div>
          </div>

          {/* 列表 */}
          <div className="nexcube-scroll flex-1 overflow-y-auto py-1">
            {projects.length === 0 ? (
              <EmptyState onCreate={onCreate} />
            ) : (
              <div>
                {projects.map((p, idx) => (
                  <RecentItem key={p.id} project={p} onOpen={onOpen} index={idx} />
                ))}
              </div>
            )}
          </div>
        </motion.aside>
      </main>

      {/* 背景装饰 */}
      <div
        className="pointer-events-none absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-primary/[0.02] blur-[160px]"
        aria-hidden
      />
    </div>
  )
}

function ActionButton({
  icon: Icon,
  title,
  desc,
  onClick,
  primary = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200',
        primary
          ? 'border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10'
          : 'border-border/40 bg-card/30 hover:border-border/60 hover:bg-card/50',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105',
          primary
            ? 'bg-primary/15 text-primary ring-1 ring-primary/20'
            : 'bg-muted/40 text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/20 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
    </motion.button>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
      <FileCode2 className="h-8 w-8 text-muted-foreground/30" />
      <div>
        <p className="text-xs font-medium text-foreground">暂无项目</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">创建或导入项目开始开发</p>
      </div>
      <button
        onClick={onCreate}
        className="mt-1 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
      >
        <Plus className="h-3 w-3" />
        新建项目
      </button>
    </div>
  )
}

function RecentItem({
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.2 + index * 0.03 }}
      onClick={() => onOpen(project.id)}
      className="group flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-accent/30"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/12 to-primary/3 text-[9px] font-bold text-primary ring-1 ring-primary/10">
        {project.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-foreground">{project.name}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
          <span>{LOADER_LABEL[project.loader]}</span>
          <span>·</span>
          <span className="font-mono">{project.mcVersion}</span>
          <span>·</span>
          <span>{openedLabel}</span>
        </div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-transparent transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
    </motion.button>
  )
}
