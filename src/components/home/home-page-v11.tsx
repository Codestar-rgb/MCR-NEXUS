'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Plus, FolderOpen, Download, Github, Settings, Clock,
  ChevronRight, Search, Boxes, Box, Package, Swords, Trees,
  FileCode2, GitBranch,
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

interface HomePageV11Props {
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

const LOADER_BADGE: Record<ModLoader, string> = {
  forge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  fabric: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  neoforge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  quilt: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
}

// 快速模板
const QUICK_TEMPLATES = [
  { id: 'entity', name: '实体系统', desc: '自定义生物', icon: Boxes },
  { id: 'block', name: '方块系统', desc: '自定义方块', icon: Box },
  { id: 'item', name: '物品系统', desc: '自定义物品', icon: Package },
  { id: 'combat', name: '战斗系统', desc: '武器装备', icon: Swords },
  { id: 'worldgen', name: '世界生成', desc: '群系维度', icon: Trees },
  { id: 'blank', name: '空白工作区', desc: '自由构建', icon: FileCode2 },
] as const

export function HomePageV11({ onCreate, onOpen, onImport }: HomePageV11Props) {
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

  const projects = (recentProjects ?? []).slice(0, 12)
  const hasProjects = projects.length > 0
  const [search, setSearch] = React.useState('')
  const filteredProjects = React.useMemo(() => {
    if (!search.trim()) return projects
    const q = search.toLowerCase()
    return projects.filter((p) => p.name.toLowerCase().includes(q) || p.loader.toLowerCase().includes(q))
  }, [projects, search])

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background">
      {/* 顶部栏 */}
      <header className="relative z-30 flex shrink-0 items-center justify-between border-b border-border/30 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <WaterOrb size={24} />
          <span className="text-[13px] font-semibold tracking-tight text-foreground">NexCube</span>
          <span className="rounded border border-border/40 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/60">
            v0.1.0
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="GitHub"
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => window.open('https://github.com/Codestar-rgb/MCR-NEXUS', '_blank')}
          >
            <Github className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="设置"
            onClick={openSettings}
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* 主内容区 — 左右分栏 */}
      <main className="flex min-h-0 flex-1 overflow-hidden">
        {/* === 左栏：欢迎 + 操作 + 模板 === */}
        <section className="flex w-[55%] min-w-[420px] flex-col overflow-y-auto nexcube-scroll border-r border-border/30 bg-card/10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="px-6 py-5"
          >
            {/* 欢迎语 */}
            <div className="mb-5">
              <h1 className="text-[22px] font-bold leading-tight tracking-tight text-foreground">
                {t('home.welcome')}
              </h1>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {t('home.subtitle')} · {t('home.desc')}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                <GitBranch className="h-3 w-3" />
                <span className="font-mono">MC 1.20.1 · Forge 47.3.7 · Java 17</span>
              </div>
            </div>

            {/* 开始 — 3 个操作 */}
            <div className="mb-5">
              <SectionLabel>{t('home.create') === '新建项目' ? '开始' : 'Start'}</SectionLabel>
              <div className="space-y-1.5">
                <ActionRow
                  icon={Plus}
                  title={t('home.create')}
                  desc={t('home.createDesc')}
                  onClick={onCreate}
                  primary
                />
                <ActionRow
                  icon={FolderOpen}
                  title={t('home.open')}
                  desc={t('home.openDesc')}
                  onClick={onImport}
                />
                <ActionRow
                  icon={Download}
                  title={t('home.import')}
                  desc={t('home.importDesc')}
                  onClick={onImport}
                />
              </div>
            </div>

            {/* 从模板开始 */}
            <div>
              <SectionLabel>从模板开始</SectionLabel>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_TEMPLATES.map((tpl, idx) => {
                  const Icon = tpl.icon
                  return (
                    <motion.button
                      key={tpl.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 + idx * 0.03 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onCreate}
                      className="group flex items-center gap-2.5 rounded-lg border border-border/30 bg-card/30 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-card/50"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-inset ring-primary/15 transition-transform group-hover:scale-110">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-foreground">{tpl.name}</div>
                        <div className="truncate text-[10px] text-muted-foreground/60">{tpl.desc}</div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </section>

        {/* === 右栏：最近项目 === */}
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex w-[45%] min-w-[360px] flex-col bg-background"
        >
          {/* 标题 + 搜索 */}
          <div className="shrink-0 border-b border-border/30 px-5 py-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <h2 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('home.recent')}
                </h2>
                {hasProjects && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                    {projects.length}
                  </span>
                )}
              </div>
            </div>
            {hasProjects && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索项目..."
                  className="h-7 w-full rounded-md border border-border/40 bg-card/30 pl-7 pr-2 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* 列表 */}
          <div className="nexcube-scroll flex-1 overflow-y-auto py-1">
            {hasProjects ? (
              filteredProjects.length > 0 ? (
                <div>
                  {filteredProjects.map((p, idx) => (
                    <RecentItem key={p.id} project={p} onOpen={onOpen} index={idx} />
                  ))}
                </div>
              ) : (
                <div className="px-5 py-8 text-center text-[11px] text-muted-foreground/50">
                  未找到匹配的项目
                </div>
              )
            ) : (
              <EmptyState onCreate={onCreate} onImport={onImport} />
            )}
          </div>

          {/* 底部状态 */}
          <div className="shrink-0 border-t border-border/30 px-5 py-2 text-[9px] text-muted-foreground/40">
            <div className="flex items-center justify-between font-mono">
              <span>NexCube · Next-gen Mod IDE</span>
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                就绪
              </span>
            </div>
          </div>
        </motion.aside>
      </main>
    </div>
  )
}

// === 区块小标题 ===
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {children}
      </h3>
      <div className="h-px flex-1 bg-border/20" />
    </div>
  )
}

// === 操作行（紧凑列表样式） ===
function ActionRow({
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
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-150',
        primary
          ? 'border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10'
          : 'border-border/30 bg-card/20 hover:border-border/50 hover:bg-card/40',
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105',
          primary
            ? 'bg-primary/15 text-primary ring-1 ring-primary/20'
            : 'bg-muted/30 text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-medium text-foreground">{title}</div>
        <div className="text-[10px] text-muted-foreground/70">{desc}</div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
    </motion.button>
  )
}

// === 最近项目行（密集列表） ===
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
      transition={{ duration: 0.2, delay: 0.15 + index * 0.02 }}
      onClick={() => onOpen(project.id)}
      className="group flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-accent/30"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 text-[9px] font-bold text-primary ring-1 ring-inset ring-primary/10">
        {project.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-medium text-foreground">{project.name}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
          <span className="font-mono">{project.mcVersion}</span>
          <span>·</span>
          <span>{openedLabel}</span>
        </div>
      </div>
      <span className={cn(
        'shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-medium',
        LOADER_BADGE[project.loader],
      )}>
        {LOADER_LABEL[project.loader]}
      </span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-transparent transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
    </motion.button>
  )
}

// === 空状态 ===
function EmptyState({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="relative">
        <div className="absolute inset-0 -m-3 rounded-full bg-primary/8 blur-xl" aria-hidden />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
          <Boxes className="h-6 w-6 text-primary" />
        </div>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-foreground">{t_empty('title')}</p>
        <p className="mt-1 max-w-[240px] text-[11px] leading-relaxed text-muted-foreground">
          {t_empty('desc')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCreate}
          className="flex items-center gap-1.5 rounded-md bg-gradient-brand px-3.5 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-glow"
        >
          <Plus className="h-3 w-3" />
          {t_empty('create')}
        </motion.button>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onImport}
          className="flex items-center gap-1.5 rounded-md border border-border/50 bg-card/40 px-3 py-1.5 text-[11px] font-medium text-foreground hover:border-primary/40"
        >
          <FolderOpen className="h-3 w-3 text-muted-foreground" />
          {t_empty('import')}
        </motion.button>
      </div>
    </div>
  )
}

function t_empty(key: 'title' | 'desc' | 'create' | 'import') {
  const map = {
    title: '还没有项目',
    desc: '从模板快速创建，或导入已有的模组项目开始开发',
    create: '创建第一个项目',
    import: '导入项目',
  }
  return map[key]
}
