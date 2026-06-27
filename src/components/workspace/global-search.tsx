'use client'

/**
 * 全局搜索面板（Ctrl+P）
 *
 * 快速搜索节点/文件/命令
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileCode2, Boxes, Box, Package, CornerDownLeft } from 'lucide-react'
import { useCanvasStore } from '@/stores/canvas'
import { useWorkspaceStore } from '@/stores/workspace'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const nodes = useCanvasStore((s) => s.nodes)
  const { t } = useI18n()
  const selectNode = useCanvasStore((s) => s.selectNode)
  const setSelectedNode = useWorkspaceStore((s) => s.setSelectedNode)

  React.useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const results = React.useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return nodes
      .filter((n) => n.data.title.toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, nodes])

  const handleSelect = (nodeId: string, kind: string, title: string) => {
    selectNode(nodeId)
    setSelectedNode(nodeId, kind as 'entity' | 'block' | 'item' | null, title)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-32 z-50 w-[480px] -translate-x-1/2 overflow-hidden rounded-xl border border-border/50 bg-popover/95 shadow-floating backdrop-blur-xl"
          >
            {/* 搜索框 */}
            <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose()
                  if (e.key === 'Enter' && results[0]) {
                    handleSelect(results[0].id, results[0].data.kind, results[0].data.title)
                  }
                }}
                placeholder={t('search.placeholder')}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
              <kbd className="rounded border border-border/40 px-1.5 py-0.5 text-[9px] text-muted-foreground/60">
                ESC
              </kbd>
            </div>

            {/* 结果列表 */}
            <div className="nexcube-scroll max-h-80 overflow-y-auto p-1">
              {results.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-muted-foreground/50">
                  {query ? t('search.noResults') : t('search.empty')}
                </div>
              ) : (
                results.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => handleSelect(node.id, node.data.kind, node.data.title)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent/40"
                  >
                    <NodeIcon kind={node.data.kind} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{node.data.title}</div>
                      <div className="text-[10px] text-muted-foreground/60">{node.data.kind}</div>
                    </div>
                    <CornerDownLeft className="h-3 w-3 text-muted-foreground/30" />
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

function NodeIcon({ kind }: { kind: string }) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    entity: Boxes,
    block: Box,
    item: Package,
  }
  const Icon = iconMap[kind] ?? FileCode2
  return <Icon className="h-4 w-4 text-muted-foreground" />
}
