'use client'

/**
 * 项目导入对话框（Task 6-B）
 *
 * 双 Tab：
 *  - URL 导入：GitHub/Gitee URL 解析（mock）→ 项目信息 → 导入
 *  - ZIP 上传：拖拽/选择 ZIP 文件 → mock 解析 → 导入
 */

import { useCallback, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Github, FileArchive, Loader2, FileCode2, Package,
  UploadCloud, Link as LinkIcon, CheckCircle2,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported?: (projectId: string) => void
}

interface ParsedProject {
  name: string
  modId: string
  loader: 'forge' | 'fabric' | 'neoforge'
  mcVersion: string
  forgeVersion: string
  fileCount: number
  storagePath: string
}

export function ImportDialog({ open, onOpenChange, onImported }: ImportDialogProps) {
  const [url, setUrl] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedProject | null>(null)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const reset = useCallback(() => {
    setUrl('')
    setParsed(null)
    setZipFile(null)
    setParsing(false)
    setDragOver(false)
  }, [])

  const handleOpenChange = useCallback((next: boolean) => {
    if (!next) setTimeout(reset, 200)
    onOpenChange(next)
  }, [onOpenChange, reset])

  // URL 解析（mock：从 URL 提取项目名）
  const handleParseUrl = useCallback(async () => {
    if (!url.trim()) {
      toast.warning('请输入 URL')
      return
    }
    setParsing(true)
    setParsed(null)
    await new Promise((r) => setTimeout(r, 1200))
    // 从 URL 提取项目名
    const match = url.match(/github\.com\/[^/]+\/([^/]+)/) || url.match(/gitee\.com\/[^/]+\/([^/]+)/)
    const repoName = match?.[1]?.replace(/\.git$/, '') ?? 'imported_mod'
    const modId = repoName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    const loaders: Array<'forge' | 'fabric' | 'neoforge'> = ['forge', 'fabric', 'neoforge']
    const loader = loaders[Math.floor(Math.random() * loaders.length)]
    const result: ParsedProject = {
      name: repoName.charAt(0).toUpperCase() + repoName.slice(1),
      modId,
      loader,
      mcVersion: '1.20.1',
      forgeVersion: loader === 'forge' ? '47.3.7' : loader === 'fabric' ? '0.15.x' : '47.x',
      fileCount: 20 + Math.floor(Math.random() * 40),
      storagePath: `/tmp/imported/${modId}`,
    }
    setParsed(result)
    setParsing(false)
    toast.success('项目解析成功')
  }, [url])

  // ZIP 上传处理
  const handleZipFile = useCallback((file: File) => {
    if (!file.name.endsWith('.zip')) {
      toast.error('请上传 .zip 文件')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('文件不能超过 50MB')
      return
    }
    setZipFile(file)
    // mock 解析
    setParsing(true)
    setParsed(null)
    setTimeout(() => {
      const modId = file.name.replace(/\.zip$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '_')
      setParsed({
        name: file.name.replace(/\.zip$/, ''),
        modId,
        loader: 'forge',
        mcVersion: '1.20.1',
        forgeVersion: '47.3.7',
        fileCount: 15 + Math.floor(Math.random() * 30),
        storagePath: `/tmp/imported/${modId}`,
      })
      setParsing(false)
      toast.success('ZIP 解析成功')
    }, 1500)
  }, [])

  // 导入 mutation
  const importMutation = useMutation({
    mutationFn: async (project: ParsedProject) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modId: project.modId,
          name: project.name,
          author: 'Imported',
          version: '1.0.0',
          mcVersion: project.mcVersion,
          forgeVersion: project.forgeVersion,
          loader: project.loader,
          storagePath: project.storagePath,
          description: `从 ${zipFile ? 'ZIP' : 'URL'} 导入`,
        }),
      })
      if (!res.ok) throw new Error('导入失败')
      return res.json() as Promise<{ id: string }>
    },
    onSuccess: async (data) => {
      // 自动 seed 节点
      try { await fetch(`/api/projects/${data.id}/seed`, { method: 'POST' }) } catch {}
      await queryClient.invalidateQueries({ queryKey: ['projects', 'recent'] })
      toast.success('项目导入成功', { description: parsed?.name })
      handleOpenChange(false)
      onImported?.(data.id)
    },
    onError: () => toast.error('导入失败'),
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[520px] border-border bg-card p-0">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <DialogHeader className="px-6 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-emerald-400" />
            导入项目
          </DialogTitle>
          <DialogDescription className="text-xs">
            从 GitHub/Gitee URL 或本地 ZIP 导入现有模组项目
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="url" className="px-6 pb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="text-xs">
              <LinkIcon className="mr-1.5 h-3.5 w-3.5" /> URL 导入
            </TabsTrigger>
            <TabsTrigger value="zip" className="text-xs">
              <FileArchive className="mr-1.5 h-3.5 w-3.5" /> ZIP 上传
            </TabsTrigger>
          </TabsList>

          {/* URL 导入 */}
          <TabsContent value="url" className="space-y-3 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">仓库 URL</label>
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/user/repo"
                  className="h-9 text-xs"
                  onKeyDown={(e) => e.key === 'Enter' && handleParseUrl()}
                />
                <Button
                  size="sm"
                  onClick={handleParseUrl}
                  disabled={parsing || !url.trim()}
                  className="h-9 shrink-0 bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : '解析'}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                支持 github.com / gitee.com 链接
              </p>
            </div>
            {parsed && <ParsedCard project={parsed} onImport={() => importMutation.mutate(parsed)} importing={importMutation.isPending} />}
          </TabsContent>

          {/* ZIP 上传 */}
          <TabsContent value="zip" className="space-y-3 pt-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const f = e.dataTransfer.files[0]
                if (f) handleZipFile(f)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors',
                dragOver ? 'border-emerald-500 bg-emerald-500/5' : 'border-border hover:border-emerald-500/40',
              )}
            >
              {zipFile ? (
                <div className="flex flex-col items-center gap-1">
                  <FileArchive className="h-6 w-6 text-emerald-400" />
                  <span className="text-xs font-medium">{zipFile.name}</span>
                  <span className="text-[10px] text-muted-foreground">{(zipFile.size / 1024).toFixed(0)} KB</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">拖拽 ZIP 文件到此</span>
                  <span className="text-[10px] text-muted-foreground/60">或点击选择文件 · 最大 50MB</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleZipFile(f) }}
              />
            </div>
            {parsing && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> 解析中...
              </div>
            )}
            {parsed && <ParsedCard project={parsed} onImport={() => importMutation.mutate(parsed)} importing={importMutation.isPending} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function ParsedCard({
  project, onImport, importing,
}: {
  project: ParsedProject
  onImport: () => void
  importing: boolean
}) {
  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span className="text-sm font-semibold">解析成功</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">项目名：</span>
          <span className="font-medium">{project.name}</span>
        </div>
        <div>
          <span className="text-muted-foreground">modId：</span>
          <code className="font-mono">{project.modId}</code>
        </div>
        <div>
          <span className="text-muted-foreground">加载器：</span>
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[9px]">
            {project.loader}
          </Badge>
        </div>
        <div>
          <span className="text-muted-foreground">MC 版本：</span>
          <span className="font-mono">{project.mcVersion}</span>
        </div>
        <div>
          <span className="text-muted-foreground">文件数：</span>
          <span className="font-mono">{project.fileCount}</span>
        </div>
      </div>
      <Button
        size="sm"
        className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
        onClick={onImport}
        disabled={importing}
      >
        {importing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Package className="mr-1 h-4 w-4" />}
        导入项目
      </Button>
    </div>
  )
}
