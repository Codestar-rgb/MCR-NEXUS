'use client'

import * as React from 'react'
import { HomePageV11 } from '@/components/home/home-page-v11'
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

  return (
    <>
      <HomePageV11 onCreate={handleCreate} onOpen={handleOpen} onImport={handleImport} />
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
    </>
  )
}
