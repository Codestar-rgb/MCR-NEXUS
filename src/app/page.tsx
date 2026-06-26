'use client'

import * as React from 'react'
import { Sidebar } from '@/components/home/sidebar'
import { WelcomeHeader } from '@/components/home/welcome-header'
import { CreateCard } from '@/components/home/create-card'
import { OpenCard } from '@/components/home/open-card'
import { ImportCard } from '@/components/home/import-card'
import { ProjectWizard } from '@/components/home/project-wizard'
import { WorkspaceShell } from '@/components/workspace/workspace-shell'
import { SettingsDialog } from '@/components/settings/settings-dialog'
import { useWorkspaceStore } from '@/stores/workspace'

export default function Home() {
  const [wizardOpen, setWizardOpen] = React.useState(false)

  // 视图切换：home 显示主页，workspace 显示工作区
  const currentView = useWorkspaceStore((s) => s.currentView)
  const openProject = useWorkspaceStore((s) => s.openProject)
  const settingsOpen = useWorkspaceStore((s) => s.settingsOpen)
  const setSettingsOpen = useWorkspaceStore((s) => s.setSettingsOpen)

  // mount guard：避免 persist 中可能残留的 workspace 状态在 SSR 后
  // 由于 hydration 顺序问题导致闪烁；本任务中 currentView 不持久化，
  // 但仍加这一层保险
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const handleCreate = React.useCallback(() => {
    setWizardOpen(true)
  }, [])

  const handleImport = React.useCallback(() => {
    console.log('[NexCube] onImport — 导入向导待接入')
  }, [])

  const handleOpen = React.useCallback(
    (projectId: string) => {
      // 触摸最近打开时间
      fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ touch: true }),
      }).catch(() => {})
      // 切换到工作区
      openProject(projectId)
    },
    [openProject],
  )

  const handleCreated = React.useCallback(
    (projectId: string) => {
      // 关闭向导并进入工作区
      setWizardOpen(false)
      openProject(projectId)
    },
    [openProject],
  )

  // 全局设置对话框（主页 + 工作区共用）
  const settingsDialog = (
    <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
  )

  // 工作区视图：直接渲染 WorkspaceShell（占满整个视口）
  // 注意：需要等 mount 后再渲染工作区，避免 SSR/persist 闪烁
  if (mounted && currentView === 'workspace') {
    return (
      <>
        <WorkspaceShell />
        {settingsDialog}
      </>
    )
  }

  // 主页视图
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      {/* 左侧导航（桌面端纵向 / 移动端顶部条） */}
      <Sidebar />

      {/* 主内容区 */}
      <main className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 md:py-12">
          <WelcomeHeader />

          {/* 三张卡片：垂直排列，最大宽度 480 居中 */}
          <section
            aria-label="项目操作"
            className="mx-auto flex w-full max-w-[480px] flex-col gap-4"
          >
            <CreateCard onCreate={handleCreate} />
            <OpenCard onOpen={handleOpen} onCreate={handleCreate} />
            <ImportCard onImport={handleImport} />
          </section>

          {/* 底部信息 */}
          <footer className="mt-auto pt-6 text-center text-[11px] text-muted-foreground/60">
            <span>NexCube · 双轨制 MC 模组开发 IDE</span>
            <span className="mx-2" aria-hidden>·</span>
            <span>目标 MC 1.20.1 + Forge 47.3.x</span>
          </footer>
        </div>
      </main>

      {/* 创建项目向导 */}
      <ProjectWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onCreated={handleCreated}
      />

      {/* 全局设置对话框（主页 + 工作区共用） */}
      {settingsDialog}
    </div>
  )
}
