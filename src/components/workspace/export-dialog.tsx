'use client'

/**
 * 导出对话框（Task 4-D）
 *
 * 功能：
 *  - 选择导出选项（gradle wrapper / README / .gitignore）
 *  - 显示文件清单预览（GET /api/projects/[id]/export）
 *  - 显示总文件数 + 估算字节数
 *  - 「导出 ZIP」按钮（emerald 主题）触发 POST /api/projects/[id]/export
 *  - 导出中显示进度
 *  - 完成后浏览器自动下载，并显示「再次下载」链接
 *
 * 调用方：
 *  - 顶部仪表盘 / 工程卡片 → 触发 ExportDialog open
 *  - useKeyboardShortcuts Ctrl+E → 触发 ExportDialog open
 */

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  FileArchive,
  Loader2,
  CheckCircle2,
  Folder,
  FileText,
  Settings,
  AlertTriangle,
  RefreshCw,
  Terminal,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

interface ExportPreviewFile {
  path: string
  bytes: number
  executable: boolean
}

interface ExportPreview {
  projectId: string
  modId: string
  version: string
  totalFiles: number
  totalBytes: number
  files: ExportPreviewFile[]
}

interface ExportDialogProps {
  /** 是否打开 */
  open: boolean
  /** 关闭 */
  onOpenChange: (v: boolean) => void
  /** 项目 ID（由 workspace store 提供） */
  projectId: string | null
}

/* ------------------------------------------------------------------ */
/* 工具                                                                */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/** 从文件路径返回图标类型（dir/file/script） */
function classifyFile(path: string): 'script' | 'config' | 'java' | 'resource' | 'doc' | 'file' {
  if (path.endsWith('.java')) return 'java'
  if (path.endsWith('.gradle') || path.endsWith('.properties')) return 'config'
  if (path.endsWith('.toml') || path.endsWith('.mcmeta') || path.endsWith('.json')) return 'resource'
  if (path.endsWith('.md')) return 'doc'
  if (path.startsWith('gradlew')) return 'script'
  return 'file'
}

const FILE_ICON_COLOR: Record<string, string> = {
  script: 'text-emerald-300',
  config: 'text-amber-300',
  java: 'text-cyan-300',
  resource: 'text-violet-300',
  doc: 'text-teal-300',
  file: 'text-muted-foreground',
}

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export function ExportDialog({
  open,
  onOpenChange,
  projectId,
}: ExportDialogProps) {
  // 选项
  const [includeWrapper, setIncludeWrapper] = React.useState(true)
  const [includeReadme, setIncludeReadme] = React.useState(true)
  const [includeGitignore, setIncludeGitignore] = React.useState(true)

  // 导出状态
  const [isExporting, setIsExporting] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null)
  const [exportedAt, setExportedAt] = React.useState<number | null>(null)

  // 预览查询（仅在 open 时触发）
  const { data: preview, isLoading: previewLoading } = useQuery<ExportPreview>({
    queryKey: ['export-preview', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('no_project')
      const res = await fetch(`/api/projects/${projectId}/export`, { cache: 'no-store' })
      if (!res.ok) throw new Error('preview_failed')
      return (await res.json()) as ExportPreview
    },
    enabled: open && !!projectId,
    staleTime: 30_000,
  })

  // 重置状态：每次打开对话框时清空上次结果
  React.useEffect(() => {
    if (open) {
      setDownloadUrl(null)
      setExportedAt(null)
      setProgress(0)
      setIsExporting(false)
    }
  }, [open])

  // 清理 ObjectURL
  React.useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    }
  }, [downloadUrl])

  // 模拟进度更新（API 一次性返回，UI 上以阶梯进度反馈）
  const startFakeProgress = React.useCallback(() => {
    setProgress(8)
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p
        return p + Math.random() * 12
      })
    }, 220)
    return () => clearInterval(timer)
  }, [])

  const handleExport = React.useCallback(async () => {
    if (!projectId || isExporting) return
    setIsExporting(true)
    setProgress(0)
    const stopProgress = startFakeProgress()

    try {
      const res = await fetch(`/api/projects/${projectId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeGradleWrapper: includeWrapper,
          includeReadme,
          includeGitignore,
          commitMessage: `Export project ${preview?.modId ?? ''} v${preview?.version ?? ''}`.trim(),
        }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.message || `HTTP ${res.status}`)
      }

      const blob = await res.blob()
      // 旧 URL 释放
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)

      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      setExportedAt(Date.now())
      stopProgress()
      setProgress(100)

      const fileCount = res.headers.get('X-NexCube-File-Count') ?? '?'
      const filename = res.headers
        .get('Content-Disposition')
        ?.match(/filename\*=UTF-8''([^;]+)/)?.[1]

      // 自动触发浏览器下载
      const a = document.createElement('a')
      a.href = url
      a.download = filename ? decodeURIComponent(filename) : `export.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()

      toast.success('导出成功', {
        description: `共 ${fileCount} 个文件，ZIP 已自动下载`,
      })
    } catch (err) {
      stopProgress()
      setProgress(0)
      toast.error('导出失败', {
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setIsExporting(false)
    }
  }, [
    projectId,
    isExporting,
    startFakeProgress,
    includeWrapper,
    includeReadme,
    includeGitignore,
    preview,
    downloadUrl,
  ])

  const filteredFiles = React.useMemo(() => {
    if (!preview) return []
    return preview.files.filter((f) => {
      if (!includeWrapper && (f.path === 'gradlew' || f.path === 'gradlew.bat' || f.path.startsWith('gradle/wrapper/'))) {
        return false
      }
      if (!includeReadme && f.path === 'README.md') return false
      if (!includeGitignore && f.path === '.gitignore') return false
      return true
    })
  }, [preview, includeWrapper, includeReadme, includeGitignore])

  const filteredBytes = React.useMemo(
    () => filteredFiles.reduce((s, f) => s + f.bytes, 0),
    [filteredFiles],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
              <FileArchive className="h-4 w-4" />
            </span>
            导出 Forge 项目
          </DialogTitle>
          <DialogDescription>
            生成完整 Forge 1.20.1 项目 ZIP，解压后可直接运行{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">./gradlew build</code>
          </DialogDescription>
        </DialogHeader>

        {/* 选项区 */}
        <div className="grid gap-2.5 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Settings className="h-3.5 w-3.5" />
            导出选项
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Checkbox
              checked={includeWrapper}
              onCheckedChange={(v) => setIncludeWrapper(v === true)}
            />
            <span className="flex-1">包含 Gradle Wrapper</span>
            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
              gradlew / gradlew.bat
            </Badge>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Checkbox
              checked={includeReadme}
              onCheckedChange={(v) => setIncludeReadme(v === true)}
            />
            <span className="flex-1">包含 README.md</span>
            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
              使用说明
            </Badge>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Checkbox
              checked={includeGitignore}
              onCheckedChange={(v) => setIncludeGitignore(v === true)}
            />
            <span className="flex-1">包含 .gitignore</span>
            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
              Git 忽略规则
            </Badge>
          </label>
        </div>

        {/* 文件预览区 */}
        <div className="rounded-lg border">
          <div className="flex items-center justify-between border-b px-3 py-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Folder className="h-3.5 w-3.5" />
              文件清单预览
            </div>
            <div className="flex items-center gap-2">
              {previewLoading ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {filteredFiles.length} 文件
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {formatBytes(filteredBytes)}
                  </Badge>
                </>
              )}
            </div>
          </div>
          <ScrollArea className="max-h-64">
            <ul className="divide-y">
              <AnimatePresence initial={false}>
                {filteredFiles.map((f) => {
                  const kind = classifyFile(f.path)
                  return (
                    <motion.li
                      key={f.path}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent/30"
                    >
                      <FileText className={cn('h-3 w-3 shrink-0', FILE_ICON_COLOR[kind])} />
                      <code className="flex-1 truncate font-mono text-foreground/90">{f.path}</code>
                      <span className="shrink-0 text-muted-foreground">{formatBytes(f.bytes)}</span>
                      {f.executable ? (
                        <span
                          title="可执行"
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                        />
                      ) : null}
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          </ScrollArea>
        </div>

        {/* 进度条 */}
        <AnimatePresence>
          {isExporting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {progress < 20 ? '正在生成 Java 源码…'
                    : progress < 50 ? '正在生成资源文件…'
                    : progress < 80 ? '正在打包 ZIP…'
                    : '即将完成…'}
                </span>
                <span className="font-mono">{Math.min(100, Math.round(progress))}%</span>
              </div>
              <Progress value={progress} className="h-1.5 transition-all duration-300" />
              {/* 阶段指示器 */}
              <div className="flex items-center justify-between px-0.5 text-[9px] text-muted-foreground/40">
                <span className={progress >= 8 ? 'text-primary' : ''}>源码</span>
                <span className={progress >= 35 ? 'text-primary' : ''}>资源</span>
                <span className={progress >= 65 ? 'text-primary' : ''}>打包</span>
                <span className={progress >= 95 ? 'text-primary' : ''}>完成</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 完成提示 */}
        <AnimatePresence>
          {downloadUrl && !isExporting && (
            <>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <div className="flex-1 space-y-1">
                <div className="font-medium text-emerald-300">导出成功</div>
                <div className="text-xs text-muted-foreground">
                  ZIP 已自动下载到浏览器默认目录
                  {exportedAt && (
                    <>
                      {' · '}
                      {new Date(exportedAt).toLocaleTimeString()}
                    </>
                  )}
                </div>
              </div>
              <a
                href={downloadUrl}
                download={`export.zip`}
                className="shrink-0"
              >
                <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
                  <RefreshCw className="h-3 w-3" />
                  再次下载
                </Button>
              </a>
            </motion.div>

            {/* 构建指引 */}
            <div className="rounded-lg border border-border/40 bg-card/30 p-3 text-xs">
              <div className="mb-2 flex items-center gap-1.5 font-medium text-foreground">
                <Terminal className="h-3.5 w-3.5 text-primary" />
                如何构建并运行
              </div>
              <ol className="space-y-1.5 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="shrink-0 font-mono text-primary">1.</span>
                  <span>解压 ZIP 到本地目录</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-mono text-primary">2.</span>
                  <span>确保已安装 JDK 17（<code className="rounded bg-muted/40 px-1 font-mono text-[10px]">java -version</code>）</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-mono text-primary">3.</span>
                  <span>运行 <code className="rounded bg-muted/40 px-1 font-mono text-[10px]">./gradlew build</code> 构建 JAR</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-mono text-primary">4.</span>
                  <span>运行 <code className="rounded bg-muted/40 px-1 font-mono text-[10px]">./gradlew runClient</code> 启动游戏测试</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-mono text-primary">5.</span>
                  <span>JAR 输出在 <code className="rounded bg-muted/40 px-1 font-mono text-[10px]">build/libs/</code>，复制到 Minecraft <code className="rounded bg-muted/40 px-1 font-mono text-[10px]">mods/</code> 目录</span>
                </li>
              </ol>
              <div className="mt-2 rounded border border-amber-500/20 bg-amber-500/5 px-2 py-1.5 text-[10px] text-amber-300/80">
                首次构建需下载 Gradle 和 Forge 依赖，可能耗时 5-15 分钟。后续构建会快很多。
              </div>
            </div>
            </>
          )}
        </AnimatePresence>

        {/* 提示信息 */}
        <div className="flex items-start gap-2 rounded-md bg-amber-500/5 p-2.5 text-xs text-amber-300/80">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            首次运行 <code className="font-mono">./gradlew build</code> 时将自动下载 Gradle 8.1.1（约 120 MB）。
            确保本机已安装 <strong>JDK 17+</strong>。
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            className="text-xs"
          >
            关闭
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !projectId || filteredFiles.length === 0}
            className={cn(
              'gap-1.5 bg-emerald-500/15 text-emerald-300 shadow-none',
              'border border-emerald-500/30 hover:bg-emerald-500/25',
              'hover:text-emerald-200',
            )}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? '导出中…' : '导出 ZIP'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
