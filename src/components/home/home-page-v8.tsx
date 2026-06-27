'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Plus, FolderOpen, Download, Github, Settings, Clock,
  ChevronRight, FileCode2, GitBranch,
} from 'lucide-react'
import { WaterOrb } from '@/components/water-orb'
import { ThemeToggle } from '@/components/home/theme-toggle'
import { Button } from '@/components/ui/button'
import { useWorkspaceStore } from '@/stores/workspace'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { ModLoader, RecentProject } from '@/types'
import { cn } from '@/lib/utils'

interface HomePageV8Props {
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

export function HomePageV8({ onCreate, onOpen, onImport }: HomePageV8Props) {
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

  const projects = (recentProjects ?? []).slice(0, 8)

  return (
    <div className="relative flex h-screen bg-background">
      {/* 顶部工具栏 */}
      <header className="absolute right-0 top-0 z-20 flex items-center gap-1 px-6 py-4">
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
      </header>

      {/* 主内容区：左右两栏 */}
      <main className="flex flex-1 overflow-hidden">
        {/* 左栏：品牌 + 操作（占 55%） */}
        <div className="flex flex-1 flex-col justify-center px-16 py-12 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md"
          >
            {/* 品牌标识 */}
            <div className="mb-8 flex items-center gap-4">
              <WaterOrb size={56} />
              <div>
                <div className="text-lg font-semibold tracking-tight text-foreground">NexCube</div>
                <div className="text-[11px] text-muted-foreground/60">Minecraft Mod IDE</div>
              </div>
            </div>

            {/* 标题 */}
            <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-foreground">
              构建你的<br />
              <span className="text-gradient-brand">Minecraft 模组</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              节点可视化与代码 IDE 双轨协同，从零到构建仅需几分钟。
            </p>

            {/* 版本信息 */}
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground/50">
              <span className="rounded border border-border/40 px-1.5 py-0.5 font-mono">v0.1.0 Alpha</span>
              <GitBranch className="h-3 w-3" />
              <span className="font-mono">MC 1.20.1 · Forge 47.3.x</span>
            </div>
          </motion.div>

          {/* 操作区 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 max-w-md"
          >
            {/* 创建新项目 */}
            <motion.button
              onClick={onCreate}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group mb-2 flex w-full items-center gap-4 rounded-xl border border-border/40 bg-card/40 p-4 text-left transition-all hover:border-primary/30 hover:bg-card/60 hover:shadow-floating"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 transition-transform group-hover:scale-105">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">新建项目</div>
                <div className="text-[11px] text-muted-foreground">引导式创建模组项目</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </motion.button>

            {/* 打开 + 导入 */}
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                onClick={onImport}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="group flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 p-3 text-left transition-all hover:border-border/60 hover:bg-card/50"
              >
                <FolderOpen className="h-4 w-4 shrink-0 text-teal-400" />
                <div>
                  <div className="text-xs font-medium text-foreground">打开项目</div>
                  <div className="text-[10px] text-muted-foreground">本地目录</div>
                </div>
              </motion.button>
              <motion.button
                onClick={onImport}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="group flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 p-3 text-left transition-all hover:border-border/60 hover:bg-card/50"
              >
                <Download className="h-4 w-4 shrink-0 text-cyan-400" />
                <div>
                  <div className="text-xs font-medium text-foreground">导入项目</div>
                  <div className="text-[10px] text-muted-foreground">GitHub / ZIP</div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* 右栏：最近项目（占 45%） */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-[420px] shrink-0 flex-col border-l border-border/30 bg-sidebar/10 lg:w-[480px]"
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between border-b border-border/20 px-6 py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">最近项目</h2>
              {projects.length > 0 && (
                <span className="rounded-full bg-muted/40 px-1.5 py-px text-[10px] text-muted-foreground">
                  {projects.length}
                </span>
              )}
            </div>
          </div>

          {/* 列表 */}
          <div className="nexcube-scroll flex-1 overflow-y-auto px-3 py-2">
            {projects.length === 0 ? (
              <EmptyState onCreate={onCreate} />
            ) : (
              <div className="flex flex-col gap-0.5">
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
        className="pointer-events-none absolute left-1/3 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/[0.03] blur-[140px]"
        aria-hidden
      />
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-border/40 text-muted-foreground/40">
        <FileCode2 className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">没有最近项目</p>
        <p className="mt-0.5 text-xs text-muted-foreground">创建或导入一个项目开始</p>
      </div>
      <motion.button
        onClick={onCreate}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="mt-1 flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow"
      >
        <Plus className="h-3 w-3" />
        新建项目
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.3 + index * 0.03 }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onOpen(project.id)}
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 text-[10px] font-bold text-primary ring-1 ring-primary/10">
        {project.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{project.name}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
          <span className="rounded bg-muted/40 px-1 py-px font-medium">{LOADER_LABEL[project.loader]}</span>
          <span>·</span>
          <span className="font-mono">MC {project.mcVersion}</span>
          <span>·</span>
          <span>{openedLabel}</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/0 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
    </motion.button>
  )
}
