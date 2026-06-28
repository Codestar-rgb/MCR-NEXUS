'use client'

/**
 * 快捷键帮助浮层
 *
 * 按 ? 键打开，显示所有可用快捷键。
 * ESC 关闭。
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace'

interface ShortcutGroup {
  title: string
  shortcuts: Array<{ keys: string; label: string }>
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: '全局',
    shortcuts: [
      { keys: 'Ctrl+P', label: '搜索节点' },
      { keys: 'Ctrl+Shift+P', label: '命令面板' },
      { keys: 'Ctrl+/', label: '切换节点/代码模式' },
      { keys: 'Ctrl+S', label: '保存（自动同步）' },
      { keys: 'F1', label: '帮助文档' },
      { keys: '?', label: '快捷键帮助' },
      { keys: 'Ctrl+H', label: '版本历史' },
    ],
  },
  {
    title: '节点操作',
    shortcuts: [
      { keys: 'Ctrl+C', label: '复制节点到剪贴板' },
      { keys: 'Ctrl+V', label: '粘贴节点' },
      { keys: 'Ctrl+D', label: '克隆选中节点' },
      { keys: 'Ctrl+Z', label: '撤销' },
      { keys: 'Ctrl+Shift+Z', label: '重做' },
      { keys: 'Delete', label: '删除选中节点' },
      { keys: 'Shift+点击', label: '多选节点' },
      { keys: '右键节点', label: '复制/粘贴属性、对齐' },
    ],
  },
  {
    title: '画布',
    shortcuts: [
      { keys: 'Ctrl+0', label: '适配视图' },
      { keys: 'Ctrl+=', label: '放大' },
      { keys: 'Ctrl+-', label: '缩小' },
      { keys: '右键画布', label: '添加节点 / 全选 / 清空' },
      { keys: '双击节点', label: '打开子图（函数节点）' },
      { keys: '选中 2+ 节点', label: '显示对齐工具栏' },
    ],
  },
  {
    title: '构建',
    shortcuts: [
      { keys: 'Ctrl+B', label: '构建 JAR' },
      { keys: 'Ctrl+E', label: '导出 ZIP' },
    ],
  },
]

export function ShortcutsHelp() {
  const [open, setOpen] = React.useState(false)

  // 监听 ? 键
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      // 输入框内不触发
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (target.closest('.monaco-editor')) return

      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* 帮助卡片 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-[101] w-[560px] max-h-[80vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/50 bg-popover/95 shadow-floating backdrop-blur-xl"
          >
            {/* 顶部渐变条 */}
            <div className="h-1 bg-gradient-brand" />

            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-border/30 px-5 py-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">键盘快捷键</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 快捷键分组 */}
            <div className="nexcube-scroll grid grid-cols-2 gap-x-4 gap-y-4 overflow-y-auto p-5">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {group.title}
                  </h3>
                  <div className="space-y-1.5">
                    {group.shortcuts.map((sc) => (
                      <div
                        key={sc.keys}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-[11px] text-muted-foreground">{sc.label}</span>
                        <kbd className="rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80">
                          {sc.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 底部提示 */}
            <div className="border-t border-border/30 px-5 py-2 text-center text-[10px] text-muted-foreground/50">
              按 <kbd className="rounded border border-border/40 px-1 font-mono">ESC</kbd> 或点击外部关闭
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
