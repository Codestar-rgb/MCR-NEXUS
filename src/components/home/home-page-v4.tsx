'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Plus, FolderOpen, Download, Github, Settings, Sparkles, Clock } from 'lucide-react'
import { NexCubeLogo } from '@/components/nexcube-logo'
import { ThemeToggle } from '@/components/home/theme-toggle'
import { Button } from '@/components/ui/button'
import { useWorkspaceStore } from '@/stores/workspace'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { ModLoader, RecentProject } from '@/types'
import { cn } from '@/lib/utils'

interface HomePageV4Props {
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

export function HomePageV4({ onCreate, onOpen, onImport }: HomePageV4Props) {
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

  const projects = (recentProjects ?? []).slice(0, 4)

  return (
    <div className="relative flex min-h-screen bg-background">
      {/* 背景品牌色辉光（微妙） */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[120px]"
        aria-hidden
      />

      {/* 左侧窄导航栏 */}
      <aside className="relative z-10 flex w-16 flex-col items-center justify-between border-r border-border/30 bg-sidebar/30 py-6">
        <div className="flex flex-col items-center gap-3">
          <NexCubeLogo size={32} className="shadow-glow rounded-lg" />
        </div>
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

      {/* 主内容区 */}
      <main className="relative z-10 flex-1 overflow-y-auto nexcube-scroll">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col px-8 py-16 md:px-16 md:py-20">
          {/* 品牌区 */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-start gap-3"
          >
            <div className="flex items-center gap-2 rounded-full border border-border/40 bg-muted/20 px-3 py-1 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>下一代 Minecraft 模组开发 IDE</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground md:text-6xl">
              Nex<span className="text-gradient-brand">Cube</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              双轨协同 · 智能同步 · 极致本土化。为 Minecraft 模组开发者打造的现代化集成开发环境。
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground/60">
              <span className="rounded-full border border-border/40 px-2 py-0.5">v0.1.0 Alpha</span>
              <span>·</span>
              <span>MC 1.20.1 · Forge 47.3.x</span>
            </div>
          </motion.section>

          {/* 主操作区 */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="mt-12"
          >
            <button
              onClick={onCreate}
              className={cn(
                'group relative w-full overflow-hidden rounded-2xl border border-border/40 bg-card/40 p-6 text-left transition-all duration-300',
                'hover:border-primary/30 hover:bg-card/60 hover:shadow-floating',
              )}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-center gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/15 transition-transform group-hover:scale-105">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-foreground">创建新项目</h2>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">推荐</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    从零开始，引导式创建你的 Minecraft 模组项目
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground/30 transition-all group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </button>

            {/* 次要操作 */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => projects.length > 0 && onOpen(projects[0].id)}
                className={cn(
                  'group flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-4 transition-all duration-200',
                  'hover:border-border/60 hover:bg-card/50',
                )}
              >
                <FolderOpen className="h-5 w-5 shrink-0 text-teal-400" />
                <div className="text-left">
                  <div className="text-sm font-medium text-foreground">打开项目</div>
                  <div className="text-[11px] text-muted-foreground">从最近列表选择</div>
                </div>
              </button>
              <button
                onClick={onImport}
                className={cn(
                  'group flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-4 transition-all duration-200',
                  'hover:border-border/60 hover:bg-card/50',
                )}
              >
                <Download className="h-5 w-5 shrink-0 text-cyan-400" />
                <div className="text-left">
                  <div className="text-sm font-medium text-foreground">导入项目</div>
                  <div className="text-[11px] text-muted-foreground">GitHub/Gitee/ZIP</div>
                </div>
              </button>
            </div>
          </motion.section>

          {/* 最近项目 */}
          {projects.length > 0 ? (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
              className="mt-12"
            >
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  最近项目
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {projects.map((p, idx) => (
                  <RecentItem key={p.id} project={p} onOpen={onOpen} index={idx} />
                ))}
              </div>
            </motion.section>
          ) : null}

          {/* 底部特性条 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-auto pt-16"
          >
            <div className="grid grid-cols-2 gap-4 border-t border-border/30 pt-6 sm:grid-cols-4">
              {[
                { label: '双轨协同', desc: '节点+代码' },
                { label: '智能同步', desc: 'AST 映射' },
                { label: '开箱即用', desc: '零配置' },
                { label: '多加载器', desc: 'Forge/Fabric' },
              ].map((f) => (
                <div key={f.label} className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-foreground">{f.label}</span>
                  <span className="text-[10px] text-muted-foreground/60">{f.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
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
      transition={{ duration: 0.3, delay: 0.25 + index * 0.04 }}
      onClick={() => onOpen(project.id)}
      className={cn(
        'group flex items-center gap-3 rounded-lg border border-border/30 bg-card/20 p-3 transition-all duration-200',
        'hover:border-primary/20 hover:bg-card/40',
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 text-[10px] font-bold text-primary ring-1 ring-primary/10">
        {project.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{project.name}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
          <span>{LOADER_LABEL[project.loader]}</span>
          <span>·</span>
          <span>{openedLabel}</span>
        </div>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/20 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
    </motion.button>
  )
}
