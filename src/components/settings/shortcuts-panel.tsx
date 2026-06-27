'use client'

/**
 * 快捷键编辑面板（Task 6-B）
 *
 * 分组显示快捷键 + 录制模式 + 冲突检测 + 持久化
 */

import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Edit3, Check, X, RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ShortcutItem {
  id: string
  label: string
  group: string
  defaultKeys: string
}

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  // 全局（已绑定）
  { id: 'undo', label: '撤销', group: '全局', defaultKeys: 'ctrl+z' },
  { id: 'redo', label: '重做', group: '全局', defaultKeys: 'ctrl+shift+z' },
  { id: 'save', label: '保存（自动同步）', group: '全局', defaultKeys: 'ctrl+s' },
  { id: 'toggleMode', label: '切换节点/代码模式', group: '全局', defaultKeys: 'ctrl+/' },
  // 工作区（已绑定）
  { id: 'search', label: '搜索节点', group: '工作区', defaultKeys: 'ctrl+p' },
  { id: 'command', label: '命令面板', group: '工作区', defaultKeys: 'ctrl+shift+p' },
  { id: 'clone', label: '克隆选中节点', group: '工作区', defaultKeys: 'ctrl+d' },
  { id: 'copy', label: '复制节点', group: '工作区', defaultKeys: 'ctrl+c' },
  { id: 'paste', label: '粘贴节点', group: '工作区', defaultKeys: 'ctrl+v' },
  { id: 'fitView', label: '适应视图', group: '工作区', defaultKeys: 'ctrl+0' },
  { id: 'zoomIn', label: '放大', group: '工作区', defaultKeys: 'ctrl+=' },
  { id: 'zoomOut', label: '缩小', group: '工作区', defaultKeys: 'ctrl+-' },
  { id: 'build', label: '构建', group: '工作区', defaultKeys: 'ctrl+b' },
  { id: 'export', label: '导出', group: '工作区', defaultKeys: 'ctrl+e' },
]

const GROUPS = ['全局', '工作区']

export function ShortcutsPanel() {
  const [shortcuts, setShortcuts] = useState<Record<string, string>>({})
  const [recordingId, setRecordingId] = useState<string | null>(null)

  // 加载快捷键
  const { data } = useQuery({
    queryKey: ['settings', 'shortcuts'],
    queryFn: async () => {
      const res = await fetch('/api/settings/shortcuts')
      if (!res.ok) return {}
      const d = await res.json()
      return d.shortcuts as Record<string, string>
    },
  })

  useEffect(() => {
    if (data) {
      const initial: Record<string, string> = {}
      for (const s of DEFAULT_SHORTCUTS) initial[s.id] = data[s.id] ?? s.defaultKeys
      queueMicrotask(() => setShortcuts(initial))
    }
  }, [data])

  // 保存 mutation
  const saveMutation = useMutation({
    mutationFn: async (s: Record<string, string>) => {
      const res = await fetch('/api/settings/shortcuts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortcuts: s }),
      })
      if (!res.ok) throw new Error('保存失败')
      return res.json()
    },
    onSuccess: () => toast.success('快捷键已保存'),
    onError: () => toast.error('保存失败'),
  })

  // 录制快捷键
  useEffect(() => {
    if (!recordingId) return
    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') {
        setRecordingId(null)
        return
      }
      const parts: string[] = []
      if (e.ctrlKey) parts.push('ctrl')
      if (e.altKey) parts.push('alt')
      if (e.shiftKey) parts.push('shift')
      if (e.metaKey) parts.push('meta')
      const key = e.key.toLowerCase()
      if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
        parts.push(key)
        const combo = parts.join('+')
        // 冲突检测
        const conflict = Object.entries(shortcuts).find(
          ([id, k]) => id !== recordingId && k === combo,
        )
        if (conflict) {
          toast.warning(`与"${DEFAULT_SHORTCUTS.find(s => s.id === conflict[0])?.label}"冲突`)
        }
        setShortcuts((prev) => ({ ...prev, [recordingId]: combo }))
        setRecordingId(null)
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [recordingId, shortcuts])

  const handleReset = useCallback(() => {
    const initial: Record<string, string> = {}
    for (const s of DEFAULT_SHORTCUTS) initial[s.id] = s.defaultKeys
    setShortcuts(initial)
    toast.info('已恢复默认，请点击保存')
  }, [])

  const handleSave = useCallback(() => {
    saveMutation.mutate(shortcuts)
  }, [shortcuts, saveMutation])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          点击"编辑"后按下快捷键组合录制，Esc 取消
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs">
            <RotateCcw className="mr-1 h-3 w-3" /> 恢复默认
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="h-7 bg-emerald-600 text-white hover:bg-emerald-500 text-xs"
          >
            {saveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            保存
          </Button>
        </div>
      </div>

      {GROUPS.map((group) => (
        <div key={group} className="space-y-1.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group}</h4>
          {DEFAULT_SHORTCUTS.filter((s) => s.group === group).map((s) => {
            const keys = shortcuts[s.id] ?? s.defaultKeys
            const isRecording = recordingId === s.id
            return (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2"
              >
                <span className="text-xs text-foreground">{s.label}</span>
                <div className="flex items-center gap-2">
                  {isRecording ? (
                    <span className="flex items-center gap-1 text-xs text-amber-400">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                      按下快捷键...
                    </span>
                  ) : (
                    <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                      {keys}
                    </kbd>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setRecordingId(isRecording ? null : s.id)}
                  >
                    {isRecording ? <X className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
