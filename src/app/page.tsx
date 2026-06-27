'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/home/sidebar'
import { HeroSection } from '@/components/home/hero-section'
import { QuickActions } from '@/components/home/quick-actions'
import { RecentProjects } from '@/components/home/recent-projects'
import { FeatureHighlights } from '@/components/home/feature-highlights'
import { ProjectWizard } from '@/components/home/project-wizard'
import { ImportDialog } from '@/components/home/import-dialog'
import { WorkspaceShell } from '@/components/workspace/workspace-shell'
import { SettingsDialog } from '@/components/settings/settings-dialog'
import { useWorkspaceStore } from '@/stores/workspace'

export default function Home() {
  const [wizardOpen, setWizardOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)

  const currentView = useWorkspaceStore((s) => s.currentView)
  const openProject = useWorkspaceStore((s) => s.openProject)
  const settingsOpen = useWorkspaceStore((s) => s.settingsOpen)
  const setSettingsOpen = useWorkspaceStore((s) => s.setSettingsOpen)

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const handleCreate = React.useCallback(() => setWizardOpen(true), [])
  const handleImport = React.useCallback(() => setImportOpen(true), [])

  const handleOpen = React.useCallback(
    (projectId: string) => {
      fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ touch: true }),
      }).catch(() => {})
      openProject(projectId)
    },
    [openProject],
  )

  const handleCreated = React.useCallback(
    (projectId: string) => {
      setWizardOpen(false)
      openProject(projectId)
    },
    [openProject],
  )

  const settingsDialog = (
    <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
  )

  if (mounted && currentView === 'workspace') {
    return (
      <>
        <WorkspaceShell />
        {settingsDialog}
      </>
    )
  }

  // 主页视图 v3.0 —— 全新布局
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* 左侧导航 */}
      <Sidebar />

      {/* 主内容区：滚动容器 */}
      <main className="flex-1 overflow-y-auto nexcube-scroll">
        <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8 md:px-12 md:py-12">
          {/* 英雄区：LOGO + 标题 + 副标题 + 主操作按钮 */}
          <HeroSection onCreate={handleCreate} onImport={handleImport} />

          {/* 快速操作区：创建/打开/导入 三列网格 */}
          <QuickActions
            onCreate={handleCreate}
            onOpen={handleOpen}
            onImport={handleImport}
          />

          {/* 最近项目区：独立大区块 */}
          <RecentProjects onOpen={handleOpen} onCreate={handleCreate} />

          {/* 特性亮点区：底部展示核心特性 */}
          <FeatureHighlights />

          {/* 底部信息 */}
          <footer className="mt-12 flex items-center justify-between border-t border-border/40 pt-6 text-[11px] text-muted-foreground/50">
            <span>NexCube · 双轨制 MC 模组开发 IDE</span>
            <span>v0.1.0 Alpha · MC 1.20.1 + Forge 47.3.x</span>
          </footer>
        </div>
      </main>

      {/* 对话框 */}
      <ProjectWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onCreated={handleCreated}
      />
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={handleCreated}
      />
      {settingsDialog}
    </div>
  )
}
