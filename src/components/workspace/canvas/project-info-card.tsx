'use client'

/**
 * 工程信息悬浮卡片
 *
 * 浮动在节点画布左上角（由父容器 absolute 定位，本组件只关心内容）。
 * - 项目名 + modId（mono 小字）
 * - 加载器徽章（Forge amber）+ MC 版本
 * - 当前 Git 分支
 * - 节点数量统计（mock 3）
 * - 最后保存时间（mock "2 分钟前"）
 * - 可折叠/展开
 * - hover 微微上浮
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, Boxes, Clock, ChevronDown, Hammer, Package, FolderOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/stores/workspace'

interface ProjectInfoCardProps {
  /** 项目显示名称 */
  projectName?: string
  /** modId */
  modId?: string
  /** MC 版本 */
  mcVersion?: string
  /** 加载器版本 */
  loaderVersion?: string
  /** 当前分支 */
  branch?: string
  /** 节点数量 */
  nodeCount?: number
  /** 最后保存时间（相对描述） */
  lastSaved?: string
}

export function ProjectInfoCard({
  projectName = 'NexCube Example',
  modId = 'nexcube_example',
  mcVersion = '1.20.1',
  loaderVersion = '47.3.7',
  branch = 'main',
  nodeCount = 3,
  lastSaved = '2 分钟前',
}: ProjectInfoCardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const currentProjectId = useWorkspaceStore((s) => s.currentProjectId)

  // 打开工程文件窗口（新标签页）
  const handleOpenProjectFiles = () => {
    if (currentProjectId) {
      window.open(`/?projectId=${currentProjectId}&view=files`, '_blank', 'width=1200,height=800')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className={cn(
        'w-72 overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-lg backdrop-blur-md',
        'transition-shadow hover:shadow-xl',
      )}
    >
      {/* 标题栏：可点击折叠 */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
        aria-expanded={!collapsed}
        aria-label={collapsed ? '展开工程信息' : '折叠工程信息'}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-300">
          <Package className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{projectName}</div>
          <code className="block truncate font-mono text-[10px] text-muted-foreground">{modId}</code>
        </div>
        <Badge
          variant="outline"
          className="shrink-0 border-amber-500/40 bg-amber-500/15 text-[10px] font-semibold text-amber-300"
        >
          <Hammer className="h-2.5 w-2.5" />
          Forge
        </Badge>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
            collapsed ? '-rotate-90' : 'rotate-0',
          )}
        />
      </button>

      {/* 展开内容 */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="space-y-2 px-3 py-2.5 text-xs">
              {/* 加载器 + MC 版本 */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">加载器</span>
                <span className="font-mono text-foreground">
                  Forge <span className="text-amber-300">{loaderVersion}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Minecraft</span>
                <span className="font-mono text-foreground">{mcVersion}</span>
              </div>

              {/* 分支 */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <GitBranch className="h-3 w-3" />
                  分支
                </span>
                <span className="font-mono text-teal-300">{branch}</span>
              </div>

              {/* 节点统计 */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Boxes className="h-3 w-3" />
                  节点
                </span>
                <span className="font-mono font-semibold text-emerald-300">{nodeCount}</span>
              </div>

              {/* 最后保存 */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  保存
                </span>
                <span className="font-mono text-muted-foreground">{lastSaved}</span>
              </div>

              {/* 打开工程文件按钮 */}
              <button
                onClick={handleOpenProjectFiles}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                打开工程文件
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
