'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Plus, FolderOpen, Download, Github, Settings, Clock,
  ChevronRight, Search, Boxes, Box, Package, Swords, Trees,
  FileCode2, Zap, GitBranch, Layers, Terminal, Sparkles,
  ArrowRight, Star,
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

interface HomePageV10Props {
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

const LOADER_COLOR: Record<ModLoader, string> = {
  forge: 'text-orange-400 bg-orange-500/10',
  fabric: 'text-violet-400 bg-violet-500/10',
  neoforge: 'text-amber-400 bg-amber-500/10',
  quilt: 'text-pink-400 bg-pink-500/10',
}

// 快速模板 — 统一使用品牌色系，通过图标差异化
const QUICK_TEMPLATES = [
  { id: 'entity', name: '实体系统', desc: '自定义生物 + AI 行为', icon: Boxes },
  { id: 'block', name: '方块系统', desc: '自定义方块 + 掉落物', icon: Box },
  { id: 'item', name: '物品系统', desc: '自定义物品 + 食物', icon: Package },
  { id: 'combat', name: '战斗系统', desc: '武器 + 装备 + 药水', icon: Swords },
  { id: 'worldgen', name: '世界生成', desc: '群系 + 结构 + 维度', icon: Trees },
  { id: 'blank', name: '空白工作区', desc: '从零开始自由构建', icon: FileCode2 },
] as const

const FEATURES = [
  { icon: Layers, title: '节点可视化', desc: '13 种节点类型，拖拽连线构建模组逻辑' },
  { icon: GitBranch, title: 'AST 双向同步', desc: '节点与 Java 代码实时双向同步' },
  { icon: Zap, title: '镜像极速构建', desc: '阿里云/清华镜像，下载速度提升 10x' },
  { icon: Terminal, title: '双轨制 IDE', desc: '节点画布 + Monaco 代码编辑器协同' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function HomePageV10({ onCreate, onOpen, onImport }: HomePageV10Props) {
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

  const projects = (recentProjects ?? []).slice(0, 6)
  const hasProjects = projects.length > 0

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background">
      {/* === 背景装饰层 === */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-[140px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[15%] top-[40%] h-[300px] w-[300px] rounded-full bg-teal-500/[0.03] blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[15%] top-[30%] h-[250px] w-[250px] rounded-full bg-cyan-500/[0.03] blur-[90px]"
        aria-hidden
      />
      {/* 网格背景 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
        aria-hidden
      />

      {/* === 顶部栏 === */}
      <header className="relative z-30 flex shrink-0 items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <WaterOrb size={28} />
          <span className="text-sm font-semibold tracking-tight text-foreground">NexCube</span>
          <span className="ml-0.5 rounded-full border border-border/40 bg-card/40 px-2 py-0.5 font-mono text-[9px] text-muted-foreground/70">
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

      {/* === 主内容区 === */}
      <main className="nexcube-scroll relative z-10 flex-1 overflow-y-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto flex min-h-full max-w-5xl flex-col px-6 pb-10 pt-4"
        >
          {/* === 英雄区 === */}
          <motion.section
            variants={itemVariants}
            className="relative flex flex-col items-center pb-12 pt-6 text-center"
          >
            {/* 3D 水球 + 辉光 */}
            <div className="relative mb-6">
              <div
                className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-[60px]"
                aria-hidden
              />
              <div className="relative">
                <WaterOrb size={96} />
              </div>
            </div>

            {/* 标题 */}
            <h1 className="text-[3.5rem] font-bold leading-none tracking-tight">
              <span className="text-gradient-brand">NexCube</span>
            </h1>
            <p className="mt-4 text-lg font-medium text-foreground/90">
              {t('home.subtitle')}
            </p>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
              {t('home.desc')}
            </p>

            {/* 版本徽章 */}
            <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground/60">
              <span className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card/40 px-3 py-1 font-mono backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 nexcube-pulse" />
                MC 1.20.1
              </span>
              <span className="rounded-full border border-border/40 bg-card/40 px-3 py-1 font-mono backdrop-blur-sm">
                Forge 47.3.7
              </span>
              <span className="rounded-full border border-border/40 bg-card/40 px-3 py-1 font-mono backdrop-blur-sm">
                Java 17
              </span>
            </div>

            {/* 主操作按钮 */}
            <div className="mt-7 flex items-center gap-3">
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCreate}
                className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-brand px-7 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:shadow-glow-strong"
              >
                <Plus className="h-4 w-4" />
                {t('home.create')}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={onImport}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 px-6 py-3 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-card/60"
              >
                <Download className="h-4 w-4 text-muted-foreground" />
                {t('home.import')}
              </motion.button>
            </div>
          </motion.section>

          {/* === 快速模板 === */}
          <motion.section variants={itemVariants} className="pb-10">
            <SectionHeader
              icon={Sparkles}
              title="快速开始"
              subtitle="选择模板快速创建"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {QUICK_TEMPLATES.map((tpl, idx) => {
                const Icon = tpl.icon
                return (
                  <motion.button
                    key={tpl.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + idx * 0.05 }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onCreate}
                    className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-xl border border-border/30 bg-card/30 p-4 text-left transition-all duration-200 hover:border-primary/40 hover:bg-card/50 hover:shadow-lg hover:shadow-primary/5"
                  >
                    {/* hover 顶部高光 */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/15 transition-all group-hover:scale-110 group-hover:bg-primary/15">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-foreground">{tpl.name}</div>
                      <div className="mt-0.5 truncate text-[10px] leading-relaxed text-muted-foreground/70">{tpl.desc}</div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.section>

          {/* === 最近项目 === */}
          <motion.section variants={itemVariants} className="pb-10">
            <SectionHeader
              icon={Clock}
              title={t('home.recent')}
              subtitle={hasProjects ? `${projects.length} 个项目` : undefined}
              action={
                hasProjects ? (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/40" />
                    <input
                      type="text"
                      placeholder="搜索项目..."
                      className="h-7 w-36 rounded-md border border-border/40 bg-card/30 pl-7 pr-2 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none"
                    />
                  </div>
                ) : undefined
              }
            />

            {hasProjects ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p, idx) => (
                  <ProjectCard key={p.id} project={p} onOpen={onOpen} index={idx} />
                ))}
              </div>
            ) : (
              <EmptyProjects onCreate={onCreate} onImport={onImport} />
            )}
          </motion.section>

          {/* === 核心特性 === */}
          <motion.section variants={itemVariants} className="mt-auto pb-2">
            <SectionHeader
              icon={Star}
              title="核心特性"
              subtitle="为现代模组开发而生"
            />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {FEATURES.map((f, idx) => {
                const Icon = f.icon
                return (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + idx * 0.05 }}
                    className="group relative flex flex-col gap-2.5 overflow-hidden rounded-xl border border-border/30 bg-card/20 p-4 transition-all hover:border-primary/30 hover:bg-card/40"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/15 transition-transform group-hover:scale-110">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-foreground">{f.title}</div>
                      <div className="mt-1 text-[10px] leading-relaxed text-muted-foreground/70">{f.desc}</div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.section>

          {/* 底部信息 */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex items-center justify-between border-t border-border/20 pt-4 text-[10px] text-muted-foreground/50"
          >
            <span className="font-mono">NexCube · Next-gen Minecraft Mod IDE</span>
            <span className="flex items-center gap-3">
              <span>© 2026 Codestar</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 nexcube-pulse" />
                系统正常
              </span>
            </span>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

// === 区块标题 ===
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between border-b border-border/20 pb-2.5">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle && (
          <span className="text-[10px] text-muted-foreground/50">· {subtitle}</span>
        )}
      </div>
      {action}
    </div>
  )
}

// === 项目卡片 ===
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 + index * 0.04 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onOpen(project.id)}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border/30 bg-card/30 p-4 text-left transition-all hover:border-primary/40 hover:bg-card/50 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* hover 顶部高光 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      {/* 顶部：图标 + 加载器标签 */}
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-[12px] font-bold text-primary ring-1 ring-inset ring-primary/10">
          {project.name.slice(0, 2).toUpperCase()}
        </div>
        <span className={cn('rounded-md px-2 py-0.5 text-[9px] font-medium', LOADER_COLOR[project.loader])}>
          {LOADER_LABEL[project.loader]}
        </span>
      </div>

      {/* 名称 */}
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold text-foreground">{project.name}</div>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
          <span className="font-mono">{project.mcVersion}</span>
          <span>·</span>
          <span>{openedLabel}</span>
        </div>
      </div>

      {/* hover 箭头 */}
      <ChevronRight className="absolute bottom-4 right-4 h-3.5 w-3.5 text-transparent transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
    </motion.button>
  )
}

// === 空状态 ===
function EmptyProjects({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="relative flex flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-dashed border-border/40 bg-card/20 px-6 py-14 text-center"
    >
      {/* 装饰背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent" aria-hidden />

      {/* 装饰图形 */}
      <div className="relative">
        <div className="absolute inset-0 -m-6 rounded-full bg-primary/8 blur-2xl" aria-hidden />
        <div className="relative flex h-18 w-18 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <Boxes className="h-8 w-8 text-primary" />
        </div>
      </div>

      <div className="relative">
        <p className="text-[15px] font-semibold text-foreground">还没有项目</p>
        <p className="mt-1.5 max-w-xs text-[11px] leading-relaxed text-muted-foreground">
          从模板快速创建，或导入已有的模组项目开始开发
        </p>
      </div>

      <div className="relative flex items-center gap-2.5">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCreate}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-brand px-4 py-2 text-[12px] font-semibold text-primary-foreground shadow-glow"
        >
          <Plus className="h-3.5 w-3.5" />
          创建第一个项目
        </motion.button>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onImport}
          className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/40 px-4 py-2 text-[12px] font-medium text-foreground transition-colors hover:border-primary/40"
        >
          <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
          导入项目
        </motion.button>
      </div>
    </motion.div>
  )
}
