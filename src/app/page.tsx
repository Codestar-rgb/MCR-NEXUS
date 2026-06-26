'use client'

import * as React from 'react'
import { Sidebar } from '@/components/home/sidebar'
import { WelcomeHeader } from '@/components/home/welcome-header'
import { CreateCard } from '@/components/home/create-card'
import { OpenCard } from '@/components/home/open-card'
import { ImportCard } from '@/components/home/import-card'
import { ProjectWizard } from '@/components/home/project-wizard'

export default function Home() {
  const [wizardOpen, setWizardOpen] = React.useState(false)

  const handleCreate = React.useCallback(() => {
    setWizardOpen(true)
  }, [])

  const handleImport = React.useCallback(() => {
    console.log('[NexCube] onImport — 导入向导待接入')
  }, [])

  const handleOpen = React.useCallback((projectId: string) => {
    // 触摸最近打开时间
    fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ touch: true }),
    }).catch(() => {})
    console.log('[NexCube] onOpen — 工作区待接入（阶段 1），projectId =', projectId)
  }, [])

  const handleCreated = React.useCallback((projectId: string) => {
    console.log('[NexCube] 项目已创建，进入工作区，projectId =', projectId)
    // 阶段 1 接入工作区后这里会路由跳转，本阶段先关闭向导
    setWizardOpen(false)
  }, [])

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
    </div>
  )
}
