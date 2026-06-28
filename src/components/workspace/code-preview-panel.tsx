'use client'

/**
 * 实时代码预览面板
 *
 * 创新点：不切换模式，画布旁边实时显示选中节点生成的 Java 代码。
 * - 选中节点 → 实时生成对应 Java 代码（只读 Monaco）
 * - 属性变更 → 代码自动更新
 * - 黑盒区域用注释标注
 * - 一键切换完整代码模式
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Code2, ChevronRight, ChevronLeft, FileCode2, Copy, Expand } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useWorkspaceStore } from '@/stores/workspace'
import { useCanvasStore } from '@/stores/canvas'
import { useI18n } from '@/hooks/use-i18n'
import { generateProjectCode, type GeneratedFile } from '@/lib/codegen/code-generator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
      加载编辑器...
    </div>
  ),
})

interface CodePreviewPanelProps {
  onExpand: () => void
}

export function CodePreviewPanel({ onExpand }: CodePreviewPanelProps) {
  const selectedNodeId = useWorkspaceStore((s) => s.selectedNodeId)
  const nodes = useCanvasStore((s) => s.nodes)
  const currentProjectId = useWorkspaceStore((s) => s.currentProjectId)
  const { t } = useI18n()
  const [collapsed, setCollapsed] = React.useState(true)
  const [activeFile, setActiveFile] = React.useState<string | null>(null)
  const [files, setFiles] = React.useState<GeneratedFile[]>([])

  // 获取项目 modId
  const [modId, setModId] = React.useState('example_mod')
  React.useEffect(() => {
    if (!currentProjectId) return
    fetch(`/api/projects/${currentProjectId}`)
      .then((r) => r.json())
      .then((d) => setModId(d.modId ?? 'example_mod'))
      .catch(() => {})
  }, [currentProjectId])

  // 选中节点 + 节点变化 → 重新生成代码
  const selectedNode = React.useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )

  // 上一版本代码（用于 diff 高亮）
  const prevContentRef = React.useRef<string>('')
  const [changedLines, setChangedLines] = React.useState<Set<number>>(new Set())

  React.useEffect(() => {
    if (!selectedNode || !currentProjectId) {
      setFiles([])
      setActiveFile(null)
      setChangedLines(new Set())
      return
    }
    // 只为选中的节点生成代码
    const result = generateProjectCode(currentProjectId, modId, [selectedNode])
    const nodeFiles = result.files.filter(
      (f) => f.linkedNodeId === selectedNode.id || !f.linkedNodeId,
    )
    setFiles(nodeFiles)
    // 默认选中第一个有 linkedNodeId 的文件
    const linked = nodeFiles.find((f) => f.linkedNodeId === selectedNode.id)
    const newActiveFile = linked?.filePath ?? nodeFiles[0]?.filePath ?? null
    setActiveFile(newActiveFile)

    // 计算 diff：对比新旧代码，找出变化的行
    const newContent = linked?.content ?? nodeFiles[0]?.content ?? ''
    if (prevContentRef.current && newContent) {
      const oldLines = prevContentRef.current.split('\n')
      const newLines = newContent.split('\n')
      const changed = new Set<number>()
      const maxLen = Math.max(oldLines.length, newLines.length)
      for (let i = 0; i < maxLen; i++) {
        if (oldLines[i] !== newLines[i]) {
          changed.add(i + 1) // Monaco 行号从 1 开始
        }
      }
      setChangedLines(changed)
      // 3 秒后清除高亮
      setTimeout(() => setChangedLines(new Set()), 3000)
    } else {
      setChangedLines(new Set())
    }
    prevContentRef.current = newContent
  }, [selectedNode, currentProjectId, modId, nodes])

  const activeFileData = files.find((f) => f.filePath === activeFile)

  if (collapsed) {
    return (
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 40, opacity: 1 }}
        className="flex shrink-0 flex-col items-center border-l border-border/30 bg-sidebar/20 py-3"
      >
        <button
          onClick={() => setCollapsed(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/40 hover:text-primary"
          aria-label="展开代码预览"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="mt-3 flex flex-col items-center gap-2">
          <Code2 className="h-4 w-4 text-muted-foreground/50" />
          <span className="text-[9px] text-muted-foreground/40" style={{ writingMode: 'vertical-rl' }}>
            代码预览
          </span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex shrink-0 flex-col border-l border-border/30 bg-card/20"
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between border-b border-border/20 px-3 py-2">
        <div className="flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">{t('codePreview.title')}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* 复制 */}
          {activeFileData && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeFileData.content)
                toast.success(t('codePreview.copied'))
              }}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/60 hover:bg-accent/40 hover:text-foreground"
              aria-label="复制代码"
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
          {/* 展开到完整编辑器 */}
          <button
            onClick={onExpand}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/60 hover:bg-accent/40 hover:text-primary"
            aria-label="在编辑器中打开"
          >
            <Expand className="h-3 w-3" />
          </button>
          {/* 折叠 */}
          <button
            onClick={() => setCollapsed(true)}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/60 hover:bg-accent/40 hover:text-foreground"
            aria-label="折叠"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 文件标签 */}
      {files.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b border-border/20 px-2 py-1.5 nexcube-scroll">
          {files.map((f) => (
            <button
              key={f.filePath}
              onClick={() => setActiveFile(f.filePath)}
              className={cn(
                'shrink-0 rounded px-2 py-0.5 text-[10px] font-mono transition-colors',
                f.filePath === activeFile
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent/30',
              )}
            >
              {(f.filePath ?? '').split('/').pop() || 'unknown'}
            </button>
          ))}
        </div>
      )}

      {/* 代码内容 */}
      <div className="min-h-0 flex-1">
        {activeFileData ? (
          <MonacoEditor
            value={activeFileData.content}
            language="java"
            theme="nexcube-dark"
            onMount={(editor, monaco) => {
              // 用装饰器高亮变化的行
              if (changedLines.size > 0) {
                const decorations = editor.deltaDecorations(
                  [],
                  Array.from(changedLines).map((line) => ({
                    range: new monaco.Range(line, 1, line, 1),
                    options: {
                      isWholeLine: true,
                      className: 'code-changed-line',
                      glyphMarginClassName: 'code-changed-glyph',
                    },
                  })),
                )
                // 3 秒后清除
                setTimeout(() => {
                  editor.deltaDecorations(decorations, [])
                }, 3000)
              }
            }}
            options={{
              readOnly: true,
              fontSize: 11,
              fontFamily: 'ui-monospace, monospace',
              lineNumbers: 'on',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              folding: true,
              renderLineHighlight: 'all',
              scrollbar: { vertical: 'auto', horizontal: 'auto' },
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <FileCode2 className="h-8 w-8 text-muted-foreground/30" />
            <div>
              <p className="text-xs text-muted-foreground">
                {selectedNode ? t('codePreview.noCode') : t('codePreview.selectNode')}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                {selectedNode ? t('codePreview.noCode') : t('codePreview.selectNode')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 底部状态 */}
      {activeFileData && (
        <div className="border-t border-border/20 px-3 py-1.5">
          <div className="flex items-center justify-between text-[9px] text-muted-foreground/50">
            <span className="font-mono truncate">{activeFile}</span>
            <span className="shrink-0">{activeFileData.content.split('\n').length} 行</span>
          </div>
        </div>
      )}
    </motion.aside>
  )
}
