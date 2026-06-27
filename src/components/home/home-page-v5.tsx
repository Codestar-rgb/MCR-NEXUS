'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight, Plus, FolderOpen, Download, Github, Settings,
  Sparkles, Clock, ChevronRight,
} from 'lucide-react'
import { NexCubeLogo } from '@/components/nexcube-logo'
import { ThemeToggle } from '@/components/home/theme-toggle'
import { Button } from '@/components/ui/button'
import { useWorkspaceStore } from '@/stores/workspace'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { ModLoader, RecentProject } from '@/types'
import { cn } from '@/lib/utils'

interface HomePageV5Props {
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

export function HomePageV5({ onCreate, onOpen, onImport }: HomePageV5Props) {
  const openSettings = useWorkspaceStore((s) => s.openSettings)

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

  const projects = (recentProjects ?? []).slice(0, 5)

  return (
    <div className="relative flex h-screen bg-background">
      {/* 左侧窄导航栏 */}
      <aside className="relative z-10 flex w-16 shrink-0 flex-col items-center justify-between border-r border-border/30 bg-sidebar/20 py-6">
        <NexCubeLogo size={32} className="shrink-0 rounded-lg" />
        <div className="flex flex-col items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="GitHub"
            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
            onClick={() => window.open('https://github.com/Codestar-rgb/MCR-NEXUS', '_blank')}
          >
            <Github className="h-[18px] w-[18px]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="设置"
            onClick={openSettings}
            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary"
          >
            <Settings className="h-[18px] w-[18px]" />
          </Button>
        </div>
      </aside>

      {/* 主内容区：左右两栏 */}
      <main className="relative z-10 flex flex-1 overflow-hidden">
        {/* 左栏：品牌 + 主操作（占 55%） */}
        <div className="flex flex-1 flex-col justify-center px-12 py-12 md:px-16 lg:px-20">
          {/* 品牌区 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg"
          >
            <div className="mb-4 flex items-center gap-2">
              <NexCubeLogo size={40} className="rounded-lg" />
              <span className="text-sm font-medium tracking-wider text-muted-foreground">
                NEXCUBE
              </span>
            </div>
            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl">
              构建你的<br />
              <span className="text-gradient-brand">Minecraft 模组</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              节点可视化与代码 IDE 双轨协同，从零到构建仅需几分钟。
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground/50">
              <span className="rounded-full border border-border/40 px-2 py-0.5">v0.1.0 Alpha</span>
              <span>·</span>
              <span>MC 1.20.1 · Forge 47.3.x</span>
            </div>
          </motion.div>

          {/* 主操作按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex items-center gap-3"
          >
            <motion.button
              onClick={onCreate}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow transition-shadow hover:shadow-glow-strong"
            >
              <Plus className="h-4 w-4" />
              创建新项目
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </motion.button>
            <motion.button
              onClick={onImport}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/30 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-border/80 hover:bg-card/50"
            >
              <Download className="h-4 w-4 text-cyan-400" />
              导入项目
            </motion.button>
          </motion.div>
        </div>

        {/* 右栏：最近项目列表（占 45%） */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-[420px] shrink-0 flex-col border-l border-border/30 bg-sidebar/10 px-6 py-12 md:w-[480px]"
        >
          {/* 标题 */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">最近项目</h2>
            </div>
            {projects.length > 0 && (
              <span className="text-[11px] text-muted-foreground/50">{projects.length} 个项目</span>
            )}
          </div>

          {/* 项目列表 */}
          <div className="nexcube-scroll flex-1 overflow-y-auto">
            {projects.length === 0 ? (
              <EmptyState onCreate={onCreate} />
            ) : (
              <div className="flex flex-col gap-2">
                {projects.map((p, idx) => (
                  <RecentItem key={p.id} project={p} onOpen={onOpen} index={idx} />
                ))}
              </div>
            )}
          </div>

          {/* 底部：快速打开 */}
          {projects.length > 0 && (
            <div className="mt-4 border-t border-border/20 pt-4">
              <button
                onClick={onImport}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:bg-accent/30 hover:text-foreground"
              >
                <span>从 GitHub/Gitee/ZIP 导入更多项目</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </motion.div>
      </main>

      {/* 背景装饰：微妙渐变 */}
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/[0.03] blur-[120px]"
        aria-hidden
      />
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border/50 text-muted-foreground/50">
        <FolderOpen className="h-7 w-7" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">还没有项目</p>
        <p className="mt-1 text-xs text-muted-foreground">创建你的第一个模组项目开始开发</p>
      </div>
      <motion.button
        onClick={onCreate}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="mt-2 flex items-center gap-1.5 rounded-lg bg-gradient-brand px-4 py-2 text-xs font-medium text-primary-foreground shadow-glow"
      >
        <Plus className="h-3.5 w-3.5" />
        创建项目
      </motion.button>
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onOpen(project.id)}
      className={cn(
        'group flex items-center gap-3 rounded-xl border border-border/30 bg-card/30 p-3.5 text-left transition-all duration-200',
        'hover:border-primary/20 hover:bg-card/50',
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 text-xs font-bold text-primary ring-1 ring-primary/10">
        {project.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{project.name}</div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
          <span className="rounded bg-muted/40 px-1 py-px font-medium">{LOADER_LABEL[project.loader]}</span>
          <span>·</span>
          <span>MC {project.mcVersion}</span>
          <span>·</span>
          <span>{openedLabel}</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/20 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
    </motion.button>
  )
}
