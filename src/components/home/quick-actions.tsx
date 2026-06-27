'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { FilePlus, FolderOpen, Download, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionsProps {
  onCreate: () => void
  onOpen: (projectId: string) => void
  onImport: () => void
}

interface ActionCardProps {
  icon: React.ElementType
  title: string
  description: string
  badge?: string
  onClick: () => void
  delay: number
  accent: 'primary' | 'teal' | 'cyan'
}

const ACCENT_STYLES = {
  primary: {
    iconBg: 'from-primary/20 to-primary/5',
    iconText: 'text-primary',
    ring: 'ring-primary/20',
    hoverBorder: 'hover:border-primary/40',
  },
  teal: {
    iconBg: 'from-teal-500/20 to-teal-500/5',
    iconText: 'text-teal-300',
    ring: 'ring-teal-500/20',
    hoverBorder: 'hover:border-teal-500/40',
  },
  cyan: {
    iconBg: 'from-cyan-500/20 to-cyan-500/5',
    iconText: 'text-cyan-300',
    ring: 'ring-cyan-500/20',
    hoverBorder: 'hover:border-cyan-500/40',
  },
}

function ActionCard({ icon: Icon, title, description, badge, onClick, delay, accent }: ActionCardProps) {
  const styles = ACCENT_STYLES[accent]
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-card/40 p-5 text-left transition-all duration-200',
        styles.hoverBorder,
        'hover:bg-card/80 hover:shadow-floating',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      )}
    >
      {/* hover 辉光 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ring-1 transition-transform group-hover:scale-110',
            styles.iconBg, styles.iconText, styles.ring,
          )}>
            <Icon className="h-5 w-5" />
          </div>
          {badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-primary/20">
              {badge}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 transition-colors group-hover:text-primary">
          <span>开始</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </motion.button>
  )
}

export function QuickActions({ onCreate, onImport }: QuickActionsProps) {
  return (
    <section className="mt-12" aria-label="快速操作">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          icon={FilePlus}
          title="创建项目"
          description="从零开始，引导式创建模组"
          badge="推荐"
          onClick={onCreate}
          delay={0.1}
          accent="primary"
        />
        <ActionCard
          icon={FolderOpen}
          title="打开项目"
          description="访问本地历史项目"
          onClick={() => {
            // 滚动到最近项目区
            document.getElementById('recent-projects')?.scrollIntoView({ behavior: 'smooth' })
          }}
          delay={0.15}
          accent="teal"
        />
        <ActionCard
          icon={Download}
          title="导入项目"
          description="GitHub/Gitee URL 或 ZIP"
          onClick={onImport}
          delay={0.2}
          accent="cyan"
        />
      </div>
    </section>
  )
}
