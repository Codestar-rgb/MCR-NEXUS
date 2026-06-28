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
      .filter((n) => {
        // 搜索标题
        if (n.data.title.toLowerCase().includes(q)) return true
        // 搜索节点类型
        if (n.data.kind.toLowerCase().includes(q)) return true
        // 搜索 registryId
        const regId = String(n.data.properties?.registryId ?? '').toLowerCase()
        if (regId.includes(q)) return true
        // 搜索属性值（数字/字符串）
        const props = n.data.properties ?? {}
        for (const v of Object.values(props)) {
          if (typeof v === 'string' && v.toLowerCase().includes(q)) return true
          if (typeof v === 'number' && String(v).includes(q)) return true
        }
        return false
      })
      .slice(0, 50) // 提高上限到 50，避免静默截断
  }, [query, nodes])

  const totalCount = React.useMemo(() => {
    if (!query.trim()) return 0
    const q = query.toLowerCase()
    return nodes.filter((n) => {
      if (n.data.title.toLowerCase().includes(q)) return true
      if (n.data.kind.toLowerCase().includes(q)) return true
      const regId = String(n.data.properties?.registryId ?? '').toLowerCase()
      if (regId.includes(q)) return true
      const props = n.data.properties ?? {}
      for (const v of Object.values(props)) {
        if (typeof v === 'string' && v.toLowerCase().includes(q)) return true
        if (typeof v === 'number' && String(v).includes(q)) return true
      }
      return false
    }).length
  }, [query, nodes])

  const handleSelect = (nodeId: string, kind: string, title: string) => {
    selectNode(nodeId)
    setSelectedNode(nodeId, kind as 'entity' | 'block' | 'item' | null, title)
    // 触发高亮动画
    useCanvasStore.getState().highlightNode(nodeId)
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
                results.map((node) => {
                  const regId = String(node.data.properties?.registryId ?? '')
                  return (
                    <button
                      key={node.id}
                      onClick={() => handleSelect(node.id, node.data.kind, node.data.title)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent/40"
                    >
                      <NodeIcon kind={node.data.kind} />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {node.data.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                          <span className="font-mono">{node.data.kind}</span>
                          {regId && (
                            <>
                              <span>·</span>
                              <span className="truncate">{regId}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <CornerDownLeft className="h-3 w-3 shrink-0 text-muted-foreground/30" />
                    </button>
                  )
                })
              )}
            </div>

            {/* 底部统计 */}
            {query && results.length > 0 && (
              <div className="border-t border-border/30 px-4 py-1.5 text-[10px] text-muted-foreground/50">
                {results.length === totalCount
                  ? `找到 ${totalCount} 个结果`
                  : `显示 ${results.length} / ${totalCount} 个结果`}
              </div>
            )}
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
