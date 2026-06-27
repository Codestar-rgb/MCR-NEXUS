'use client'

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Check, ChevronLeft, ChevronRight, ImagePlus, Loader2,
  FolderOpen, AlertCircle, CheckCircle2, X, Sparkles,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { capabilities } from '@/lib/capabilities'

/* ------------------------------------------------------------------ */
/* 类型与常量                                                           */
/* ------------------------------------------------------------------ */

interface ProjectWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (projectId: string) => void
}

interface WizardForm {
  modId: string
  name: string
  author: string
  version: string
  mcVersion: string
  forgeVersion: string
  loader: 'forge' | 'fabric' | 'neoforge'
  storagePath: string
  description: string
  iconDataUrl: string | null
}

const DEFAULT_FORM: WizardForm = {
  modId: '',
  name: '',
  author: '',
  version: '1.0.0',
  mcVersion: '1.20.1',
  forgeVersion: '47.3.7',
  loader: 'forge',
  storagePath: '',
  description: '',
  iconDataUrl: null,
}

const MC_VERSIONS = ['1.20.1', '1.20.2', '1.20.4', '1.19.2', '1.18.2']
const FORGE_VERSIONS: Record<string, string[]> = {
  '1.20.1': ['47.3.7', '47.3.0', '47.2.0'],
  '1.20.2': ['48.1.0'],
  '1.20.4': ['49.0.50'],
  '1.19.2': ['43.3.0'],
  '1.18.2': ['40.2.0'],
}

type PreflightStatus = 'idle' | 'checking' | 'ok' | 'warning' | 'error'

interface PreflightItem {
  name: string
  status: PreflightStatus
  detail?: string
}

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export function ProjectWizard({ open, onOpenChange, onCreated }: ProjectWizardProps) {
  const [step, setStep] = React.useState(0) // 0=基础信息, 1=路径预检, 2=完成
  const [form, setForm] = React.useState<WizardForm>(DEFAULT_FORM)
  const [preflight, setPreflight] = React.useState<PreflightItem[]>([])
  const queryClient = useQueryClient()

  // 关闭时重置
  const handleOpenChange = React.useCallback((next: boolean) => {
    if (!next) {
      // 延迟重置避免闪烁
      setTimeout(() => {
        setStep(0)
        setForm(DEFAULT_FORM)
        setPreflight([])
      }, 200)
    }
    onOpenChange(next)
  }, [onOpenChange])

  /* -------------------- 创建项目 mutation -------------------- */
  const createMutation = useMutation({
    mutationFn: async (payload: WizardForm) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modId: payload.modId,
          name: payload.name,
          author: payload.author,
          version: payload.version,
          mcVersion: payload.mcVersion,
          forgeVersion: payload.forgeVersion,
          loader: payload.loader,
          storagePath: payload.storagePath,
          description: payload.description,
          iconPath: payload.iconDataUrl,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || err.error || '创建失败')
      }
      return res.json() as Promise<{ id: string }>
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['projects', 'recent'] })
      // 自动为新项目种入示例节点（3 节点 + 2 连线）
      try {
        await fetch(`/api/projects/${data.id}/seed`, { method: 'POST' })
      } catch {
        // 种子失败不阻断流程，用户可手动创建节点
      }
      toast.success('项目创建成功', { description: `${form.name} (${form.modId})` })
      setStep(2) // 进入完成步骤
      // 1.2 秒后自动触发 onCreated
      setTimeout(() => {
        onCreated?.(data.id)
      }, 1200)
    },
    onError: (err: Error) => {
      toast.error('创建项目失败', { description: err.message })
      setStep(0)
    },
  })

  /* -------------------- 步骤切换 -------------------- */
  const canGoNext = React.useMemo(() => {
    if (step === 0) {
      return form.modId.trim() !== '' &&
        form.name.trim() !== '' &&
        form.storagePath.trim() !== '' &&
        /^[a-z][a-z0-9_]*$/.test(form.modId)
    }
    if (step === 1) {
      // 预检必须有结果且无 error
      return preflight.length > 0 && preflight.every((p) => p.status !== 'error')
    }
    return false
  }, [step, form, preflight])

  const handleNext = () => {
    if (step === 0) {
      setStep(1)
      runPreflight()
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  /* -------------------- 预检 -------------------- */
  const runPreflight = React.useCallback(async () => {
    setPreflight([
      { name: 'Java 运行环境', status: 'checking' },
      { name: 'Git 版本控制', status: 'checking' },
      { name: '本地存储路径', status: 'checking' },
      { name: '网络连通性（镜像源）', status: 'checking' },
    ])

    // Java
    try {
      const java = await capabilities.env.detectJava()
      setPreflight((prev) => prev.map((p, i) =>
        i === 0 ? {
          name: 'Java 运行环境',
          status: java.installed ? 'ok' : 'warning',
          detail: java.installed ? `已检测到 Java ${java.version}` : '未检测到 Java，将使用内置下载器',
        } : p,
      ))
    } catch {
      setPreflight((prev) => prev.map((p, i) =>
        i === 0 ? { name: 'Java 运行环境', status: 'warning', detail: '检测失败，可稍后配置' } : p,
      ))
    }

    // Git
    try {
      const git = await capabilities.env.detectGit()
      setPreflight((prev) => prev.map((p, i) =>
        i === 1 ? {
          name: 'Git 版本控制',
          status: git.installed ? 'ok' : 'warning',
          detail: git.installed ? `Git ${git.version}` : '未检测到 Git（可选）',
        } : p,
      ))
    } catch {
      setPreflight((prev) => prev.map((p, i) =>
        i === 1 ? { name: 'Git 版本控制', status: 'warning', detail: '检测失败' } : p,
      ))
    }

    // 路径
    try {
      const exists = await capabilities.fs.exists(form.storagePath)
      setPreflight((prev) => prev.map((p, i) =>
        i === 2 ? {
          name: '本地存储路径',
          status: exists ? 'warning' : 'ok',
          detail: exists ? '路径已存在，将复用' : '路径可用',
        } : p,
      ))
    } catch {
      setPreflight((prev) => prev.map((p, i) =>
        i === 2 ? { name: '本地存储路径', status: 'ok', detail: '路径已记录' } : p,
      ))
    }

    // 网络
    try {
      const net = await capabilities.env.detectNetwork('https://maven.aliyun.com')
      setPreflight((prev) => prev.map((p, i) =>
        i === 3 ? {
          name: '网络连通性（镜像源）',
          status: net.reachable ? 'ok' : 'error',
          detail: net.reachable ? `阿里云镜像可达 (${net.latency}ms)` : '无法访问镜像源，请检查网络',
        } : p,
      ))
    } catch {
      setPreflight((prev) => prev.map((p, i) =>
        i === 3 ? { name: '网络连通性（镜像源）', status: 'error', detail: '网络检测失败' } : p,
      ))
    }
  }, [form.storagePath])

  /* -------------------- 图标上传 -------------------- */
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件')
      return
    }
    if (file.size > 512 * 1024) {
      toast.error('图标不能超过 512KB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm((f) => ({ ...f, iconDataUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  /* -------------------- modId 自动生成 -------------------- */
  // 用 ref 跟踪用户是否手动编辑过 modId，避免被 name 变化覆盖
  const modIdManuallyEdited = React.useRef(false)
  const handleNameChange = (value: string) => {
    setForm((f) => {
      const next = { ...f, name: value }
      // 只有用户没手动改过 modId 时，才自动从 name 生成
      if (!modIdManuallyEdited.current) {
        next.modId = slugify(value)
      }
      return next
    })
  }
  const handleModIdChange = (value: string) => {
    modIdManuallyEdited.current = true
    setForm((f) => ({ ...f, modId: value }))
  }

  /* ------------------------------------------------------------------ */
  /* 渲染                                                                */
  /* ------------------------------------------------------------------ */

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border/60 bg-card/95 p-0 backdrop-blur-xl sm:max-w-[560px]">
        {/* 顶部渐变条 */}
        <div className="h-1 w-full bg-gradient-brand" />

        <DialogHeader className="px-6 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            创建新项目
          </DialogTitle>
          <DialogDescription className="text-xs">
            引导式创建 Minecraft 模组项目 · 目标 {form.mcVersion} + Forge {form.forgeVersion}
          </DialogDescription>
        </DialogHeader>

        {/* 步骤指示器 */}
        <div className="flex items-center gap-2 px-6 pb-3">
          {['基础信息', '环境预检', '完成'].map((label, i) => (
            <React.Fragment key={label}>
              <div className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                step === i
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : step > i
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50',
              )}>
                <div className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full border text-[9px]',
                  step === i ? 'border-emerald-500/50 bg-emerald-500/20' :
                  step > i ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' :
                  'border-border',
                )}>
                  {step > i ? <Check className="h-2.5 w-2.5" /> : i + 1}
                </div>
                {label}
              </div>
              {i < 2 && <div className="h-px w-4 bg-border" />}
            </React.Fragment>
          ))}
        </div>

        <Separator />

        {/* 步骤内容 */}
        <div className="px-6 py-5">
          {step === 0 && (
            <StepBasicInfo
              form={form}
              setForm={setForm}
              onNameChange={handleNameChange}
              onModIdChange={handleModIdChange}
              onIconUpload={handleIconUpload}
              fileInputRef={fileInputRef}
            />
          )}
          {step === 1 && (
            <StepPreflight preflight={preflight} onRerun={runPreflight} />
          )}
          {step === 2 && (
            <StepComplete form={form} />
          )}
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/20 px-6 py-3">
          <div className="text-[11px] text-muted-foreground">
            {step === 0 && '所有字段均可后续修改'}
            {step === 1 && '环境预检不阻断创建，仅提示'}
            {step === 2 && '项目已创建，即将进入工作区'}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && step < 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={createMutation.isPending}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                上一步
              </Button>
            )}
            {step === 0 && (
              <Button
                size="sm"
                onClick={handleNext}
                disabled={!canGoNext}
                className="bg-emerald-600 text-white hover:bg-emerald-500"
              >
                下一步
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
            {step === 1 && (
              <Button
                size="sm"
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending}
                className="bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {createMutation.isPending ? (
                  <><Loader2 className="mr-1 h-4 w-4 animate-spin" />创建中...</>
                ) : (
                  <><Check className="mr-1 h-4 w-4" />创建项目</>
                )}
              </Button>
            )}
            {step === 2 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                关闭
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* Step 1: 基础信息                                                     */
/* ------------------------------------------------------------------ */

function StepBasicInfo({
  form, setForm, onNameChange, onModIdChange, onIconUpload, fileInputRef,
}: {
  form: WizardForm
  setForm: React.Dispatch<React.SetStateAction<WizardForm>>
  onNameChange: (v: string) => void
  onModIdChange: (v: string) => void
  onIconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}) {
  const modIdValid = /^[a-z][a-z0-9_]*$/.test(form.modId)

  return (
    <div className="space-y-4">
      {/* 图标 + 模组 ID 双列 */}
      <div className="flex gap-4">
        {/* 图标上传 */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all',
              'hover:border-emerald-500/60 hover:bg-emerald-500/5',
              form.iconDataUrl ? 'border-solid border-emerald-500/40' : 'border-border',
            )}
          >
            {form.iconDataUrl ? (
              <img src={form.iconDataUrl} alt="mod icon" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <ImagePlus className="h-5 w-5" />
                <span className="text-[9px]">上传图标</span>
              </div>
            )}
            {form.iconDataUrl && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  setForm((f) => ({ ...f, iconDataUrl: null }))
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') {
                  e.stopPropagation()
                  setForm((f) => ({ ...f, iconDataUrl: null }))
                }}}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:bg-destructive hover:text-white"
              >
                <X className="h-3 w-3" />
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onIconUpload}
          />
          <span className="text-[9px] text-muted-foreground">建议 128×128</span>
        </div>

        {/* 模组 ID + 名称 */}
        <div className="flex-1 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="mod-name" className="text-xs">模组名称 <span className="text-destructive">*</span></Label>
            <Input
              id="mod-name"
              value={form.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="例如：Example Mod"
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mod-id" className="text-xs">
              模组 ID <span className="text-destructive">*</span>
              <span className="ml-1 text-[10px] text-muted-foreground">（小写字母/数字/下划线）</span>
            </Label>
            <Input
              id="mod-id"
              value={form.modId}
              onChange={(e) => onModIdChange(e.target.value)}
              placeholder="example_mod"
              className={cn('h-9 font-mono', !modIdValid && form.modId && 'border-destructive/60 focus-visible:ring-destructive/30')}
            />
            {form.modId && !modIdValid && (
              <p className="text-[10px] text-destructive">格式不正确</p>
            )}
          </div>
        </div>
      </div>

      {/* 作者 + 版本 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="mod-author" className="text-xs">作者</Label>
          <Input
            id="mod-author"
            value={form.author}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            placeholder="Your Name"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mod-version" className="text-xs">模组版本</Label>
          <Input
            id="mod-version"
            value={form.version}
            onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
            placeholder="1.0.0"
            className="h-9 font-mono"
          />
        </div>
      </div>

      {/* MC 版本 + Forge 版本 + 加载器 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">MC 版本</Label>
          <div className="flex flex-wrap gap-1">
            {MC_VERSIONS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setForm((f) => ({
                  ...f,
                  mcVersion: v,
                  forgeVersion: (FORGE_VERSIONS[v] || ['47.3.7'])[0],
                }))}
                className={cn(
                  'rounded-md border px-2 py-1 text-[10px] font-mono transition-colors',
                  form.mcVersion === v
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                    : 'border-border text-muted-foreground hover:border-emerald-500/30',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Forge 版本</Label>
          <select
            value={form.forgeVersion}
            onChange={(e) => setForm((f) => ({ ...f, forgeVersion: e.target.value }))}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs font-mono"
          >
            {(FORGE_VERSIONS[form.mcVersion] || ['47.3.7']).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">加载器</Label>
          <div className="flex h-9 items-center">
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400">
              Forge
            </Badge>
          </div>
        </div>
      </div>

      {/* 存储路径 */}
      <div className="space-y-1.5">
        <Label htmlFor="mod-path" className="text-xs">
          本地存储路径 <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="mod-path"
            value={form.storagePath}
            onChange={(e) => setForm((f) => ({ ...f, storagePath: e.target.value }))}
            placeholder="/home/user/NexCubeProjects/example_mod"
            className="h-9 font-mono text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 shrink-0"
            onClick={() => toast.info('文件选择器将在桌面版启用')}
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 描述 */}
      <div className="space-y-1.5">
        <Label htmlFor="mod-desc" className="text-xs">描述（可选）</Label>
        <textarea
          id="mod-desc"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="简单描述你的模组..."
          rows={2}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-xs"
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step 2: 环境预检                                                     */
/* ------------------------------------------------------------------ */

function StepPreflight({
  preflight, onRerun,
}: {
  preflight: PreflightItem[]
  onRerun: () => void
}) {
  const doneCount = preflight.filter((p) => p.status !== 'checking' && p.status !== 'idle').length
  const percent = preflight.length > 0 ? (doneCount / preflight.length) * 100 : 0
  const hasError = preflight.some((p) => p.status === 'error')

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">正在检测系统环境...</span>
          <span className="font-mono tabular-nums">{doneCount}/{preflight.length}</span>
        </div>
        <Progress value={percent} className="h-1.5 bg-muted" />
      </div>

      <div className="space-y-2">
        {preflight.map((item) => (
          <div
            key={item.name}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
              item.status === 'ok' && 'border-emerald-500/30 bg-emerald-500/5',
              item.status === 'warning' && 'border-amber-500/30 bg-amber-500/5',
              item.status === 'error' && 'border-destructive/40 bg-destructive/5',
              item.status === 'checking' && 'border-border bg-muted/30',
              item.status === 'idle' && 'border-border',
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
              {item.status === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {item.status === 'ok' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              {item.status === 'warning' && <AlertCircle className="h-4 w-4 text-amber-500" />}
              {item.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
              {item.status === 'idle' && <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">{item.name}</div>
              {item.detail && (
                <div className="text-[11px] text-muted-foreground">{item.detail}</div>
              )}
            </div>
            {item.status === 'error' && (
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => toast.info('自动修复功能将在桌面版启用')}>
                一键修复
              </Button>
            )}
          </div>
        ))}
      </div>

      {hasError && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-600 dark:text-amber-400">
          ⚠ 存在环境问题，但不影响项目创建。可在项目创建后通过设置面板配置。
        </div>
      )}

      <Button variant="ghost" size="sm" className="w-full" onClick={onRerun}>
        <Loader2 className="mr-1 h-3.5 w-3.5" />
        重新检测
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step 3: 完成                                                         */
/* ------------------------------------------------------------------ */

function StepComplete({ form }: { form: WizardForm }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-8 ring-emerald-500/5">
        <Check className="h-8 w-8 text-emerald-500" />
      </div>
      <div>
        <h3 className="text-base font-semibold">项目创建成功</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          即将进入工作区...
        </p>
      </div>
      <div className="w-full rounded-lg border border-border bg-muted/30 px-4 py-3 text-left text-[11px]">
        <Row label="模组名称" value={form.name} />
        <Row label="模组 ID" value={form.modId} mono />
        <Row label="目标版本" value={`MC ${form.mcVersion} + Forge ${form.forgeVersion}`} />
        <Row label="存储路径" value={form.storagePath} mono />
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('text-foreground', mono && 'font-mono')}>{value}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^[0-9]+/, '')
    .slice(0, 32) || 'mod'
}
