'use client'

/**
 * 命令面板（Ctrl+Shift+P）
 *
 * 类 VSCode 命令面板，快速执行操作。
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, CornerDownLeft, Boxes, Box, Package, Zap,
  LayoutGrid, GitBranch, Save, Download, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

interface Command {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  category: 'node' | 'view' | 'action'
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onCreateNode: (kind: string) => void
  onAutoLayout: (type: 'grid' | 'spiral' | 'tree') => void
  onSave: () => void
  onExport: () => void
  onOpenSettings: () => void
}

export function CommandPalette({
  open, onClose, onCreateNode, onAutoLayout, onSave, onExport, onOpenSettings,
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState('')
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { t } = useI18n()

  React.useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const commands: Command[] = React.useMemo(() => [
    { id: 'create-entity', label: t('command.createEntity'), description: t('command.createEntityDesc'), icon: Boxes, category: 'node', action: () => { onCreateNode('entity'); onClose() } },
    { id: 'create-block', label: t('command.createBlock'), description: t('command.createBlockDesc'), icon: Box, category: 'node', action: () => { onCreateNode('block'); onClose() } },
    { id: 'create-item', label: t('command.createItem'), description: t('command.createItemDesc'), icon: Package, category: 'node', action: () => { onCreateNode('item'); onClose() } },
    { id: 'layout-grid', label: t('command.layoutGrid'), description: t('command.layoutGridDesc'), icon: LayoutGrid, category: 'view', action: () => { onAutoLayout('grid'); onClose() } },
    { id: 'layout-spiral', label: t('command.layoutSpiral'), description: t('command.layoutSpiralDesc'), icon: LayoutGrid, category: 'view', action: () => { onAutoLayout('spiral'); onClose() } },
    { id: 'layout-tree', label: t('command.layoutTree'), description: t('command.layoutTreeDesc'), icon: GitBranch, category: 'view', action: () => { onAutoLayout('tree'); onClose() } },
    { id: 'save', label: t('command.save'), description: t('command.saveDesc'), icon: Save, category: 'action', action: () => { onSave(); onClose() } },
    { id: 'export', label: t('command.export'), description: t('command.exportDesc'), icon: Download, category: 'action', action: () => { onExport(); onClose() } },
    { id: 'settings', label: t('command.settings'), description: t('command.settingsDesc'), icon: Settings, category: 'action', action: () => { onOpenSettings(); onClose() } },
  ], [onCreateNode, onAutoLayout, onSave, onExport, onOpenSettings, onClose, t])

  const filtered = React.useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter((c) =>
      c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
    )
  }, [query, commands])

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[selectedIndex]?.action()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const categoryLabels: Record<string, string> = {
    node: '节点',
    view: '视图',
    action: '操作',
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-1/4 z-50 w-[520px] -translate-x-1/2 overflow-hidden rounded-xl border border-border/50 bg-popover/95 shadow-floating backdrop-blur-xl"
          >
            {/* 搜索框 */}
            <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
              <Zap className="h-4 w-4 text-primary" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('command.placeholder')}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
              <kbd className="rounded border border-border/40 px-1.5 py-0.5 text-[9px] text-muted-foreground/60">
                ESC
              </kbd>
            </div>

            {/* 命令列表 */}
            <div className="nexcube-scroll max-h-80 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground/50">
                  {t('command.noResults')}
                </div>
              ) : (
                filtered.map((cmd, idx) => (
                  <button
                    key={cmd.id}
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                      idx === selectedIndex ? 'bg-primary/10' : 'hover:bg-accent/30',
                    )}
                  >
                    <cmd.icon className={cn(
                      'h-4 w-4 shrink-0',
                      idx === selectedIndex ? 'text-primary' : 'text-muted-foreground',
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{cmd.label}</div>
                      <div className="text-[10px] text-muted-foreground/60">{cmd.description}</div>
                    </div>
                    <span className="shrink-0 rounded bg-muted/40 px-1.5 py-px text-[9px] text-muted-foreground/50">
                      {categoryLabels[cmd.category]}
                    </span>
                    {idx === selectedIndex && (
                      <CornerDownLeft className="h-3 w-3 shrink-0 text-primary/60" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
