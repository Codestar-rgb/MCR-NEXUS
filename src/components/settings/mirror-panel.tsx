'use client'

/**
 * NexCube 镜像源配置面板
 *
 * 功能：
 *   1. 从 /api/mirrors 拉取镜像源列表（首次访问自动初始化 3 个预定义镜像）
 *   2. RadioGroup 单选镜像源，当前激活高亮（emerald）
 *   3. 每个镜像可独立测速（POST /api/mirrors/test）
 *   4. 一键测试全部镜像
 *   5. 选择镜像后实时生成 init.gradle 预览
 *   6. 复制 init.gradle 到剪贴板
 *   7. 下载 init.gradle 文件（Blob + URL.createObjectURL）
 *   8. "应用并保存" 持久化到 DB + toast
 *
 * 设计要点：
 *   - 深色主题，emerald 主色（无 indigo/blue）
 *   - 移动端：纵向堆叠；桌面端：左侧镜像列表 + 右侧 init.gradle 预览
 *   - 速度测试结果：绿/黄/红 三色徽章
 */

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Copy,
  Download,
  Gauge,
  Loader2,
  RefreshCw,
  Save,
  Zap,
  ZapOff,
} from 'lucide-react'
import { toast } from 'sonner'

import type { MirrorConfig } from '@/lib/capabilities'
import { generateInitGradle, getInitGradleFileName } from '@/lib/mirror/init-gradle-generator'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

interface MirrorsResponse {
  mirrors: MirrorConfig[]
  activeMirrorId: string | null
}

interface TestResult {
  reachable: boolean
  latency: number
  url: string
  error?: string
  status?: number
}

type ResultMap = Record<string, TestResult | 'loading'>

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export function MirrorPanel() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<ResultMap>({})

  // ---------- 拉取镜像源列表 ----------
  const { data, isLoading } = useQuery<MirrorsResponse>({
    queryKey: ['mirrors'],
    queryFn: async () => {
      const res = await fetch('/api/mirrors', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error('failed_to_load_mirrors')
      }
      return res.json() as Promise<MirrorsResponse>
    },
    staleTime: 60_000,
  })

  // 同步 activeMirrorId 到本地 selectedId
  React.useEffect(() => {
    if (data) {
      setSelectedId(data.activeMirrorId ?? data.mirrors[0]?.id ?? null)
    }
  }, [data])

  const mirrors = data?.mirrors ?? []
  const selectedMirror = mirrors.find((m) => m.id === selectedId) ?? null
  const initGradle = selectedMirror ? generateInitGradle(selectedMirror) : ''

  // ---------- 测速单个镜像 ----------
  const testMirrorMutation = useMutation({
    mutationFn: async (url: string): Promise<TestResult> => {
      const res = await fetch('/api/mirrors/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) {
        throw new Error('failed_to_test')
      }
      return res.json() as Promise<TestResult>
    },
    onMutate: (url) => {
      const id = mirrors.find((m) => m.mavenUrl === url)?.id
      if (id) {
        setResults((prev) => ({ ...prev, [id]: 'loading' }))
      }
    },
    onSuccess: (result, url) => {
      const id = mirrors.find((m) => m.mavenUrl === url)?.id
      if (id) {
        setResults((prev) => ({ ...prev, [id]: result }))
      }
    },
    onError: (_err, url) => {
      const id = mirrors.find((m) => m.mavenUrl === url)?.id
      if (id) {
        setResults((prev) => ({
          ...prev,
          [id]: {
            reachable: false,
            latency: 0,
            url,
            error: '请求失败',
          },
        }))
      }
    },
  })

  // ---------- 测试所有镜像 ----------
  const testAllMutation = useMutation({
    mutationFn: async (mirrorList: MirrorConfig[]) => {
      // 串行测速避免镜像源限流
      const out: Record<string, TestResult> = {}
      for (const m of mirrorList) {
        const res = await fetch('/api/mirrors/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: m.mavenUrl }),
        })
        if (res.ok) {
          out[m.id] = await res.json() as TestResult
        } else {
          out[m.id] = { reachable: false, latency: 0, url: m.mavenUrl, error: '请求失败' }
        }
      }
      return out
    },
    onMutate: (mirrorList) => {
      const loading: ResultMap = {}
      mirrorList.forEach((m) => { loading[m.id] = 'loading' })
      setResults(loading)
    },
    onSuccess: (out) => {
      setResults(out)
      const reachableCount = Object.values(out).filter((r) => r.reachable).length
      toast.success(`测速完成：${reachableCount}/${mirrors.length} 个镜像可用`)
    },
  })

  // ---------- 激活并保存 ----------
  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/mirrors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: true }),
      })
      if (!res.ok) throw new Error('failed_to_activate')
      return res.json()
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['mirrors'] })
      const m = mirrors.find((x) => x.id === id)
      toast.success(`已激活镜像：${m?.displayName ?? id}`, {
        description: 'init.gradle 已重新生成，下次构建自动应用。',
      })
    },
    onError: () => {
      toast.error('保存失败', { description: '请稍后重试。' })
    },
  })

  // ---------- 复制 init.gradle ----------
  const [copied, setCopied] = React.useState(false)
  const handleCopy = React.useCallback(async () => {
    if (!initGradle) return
    try {
      await navigator.clipboard.writeText(initGradle)
      setCopied(true)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败', { description: '浏览器可能拒绝了剪贴板权限。' })
    }
  }, [initGradle])

  // ---------- 下载 init.gradle ----------
  const handleDownload = React.useCallback(() => {
    if (!selectedMirror || !initGradle) return
    const blob = new Blob([initGradle], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = getInitGradleFileName(selectedMirror)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`已下载 ${getInitGradleFileName(selectedMirror)}`)
  }, [selectedMirror, initGradle])

  // ---------- 渲染 ----------
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        正在加载镜像源配置...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 顶部说明 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight">镜像源配置</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            国内推荐使用阿里云或清华镜像，可显著加速 ForgeGradle / NeoGradle 依赖下载。
            切换镜像后，init.gradle 会自动重新生成。
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => testAllMutation.mutate(mirrors)}
          disabled={testAllMutation.isPending}
        >
          {testAllMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Gauge className="h-4 w-4" />
          )}
          全部测速
        </Button>
      </div>

      {/* 镜像选择列表 */}
      <RadioGroup
        value={selectedId ?? undefined}
        onValueChange={(v) => setSelectedId(v)}
        className="gap-2"
      >
        {mirrors.map((m) => {
          const isActive = data?.activeMirrorId === m.id
          const isSelected = selectedId === m.id
          const result = results[m.id]
          return (
            <label
              key={m.id}
              htmlFor={`mirror-${m.id}`}
              className={cn(
                'group relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all',
                'hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]',
                isActive
                  ? 'border-emerald-500/50 bg-emerald-500/[0.06]'
                  : 'border-border bg-card/40',
                isSelected && !isActive && 'border-emerald-500/30 bg-emerald-500/[0.03]',
              )}
            >
              <RadioGroupItem
                id={`mirror-${m.id}`}
                value={m.id}
                className="mt-1 data-[state=checked]:border-emerald-500 data-[state=checked]:text-emerald-500"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.displayName}</span>
                    {m.id === 'aliyun' && (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px]">
                        推荐
                      </Badge>
                    )}
                    {isActive && (
                      <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        当前激活
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-emerald-400"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      testMirrorMutation.mutate(m.mavenUrl)
                    }}
                    disabled={result === 'loading'}
                  >
                    {result === 'loading' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="h-3 w-3" />
                    )}
                    测速
                  </Button>
                </div>
                <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                  {m.mavenUrl}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                  <SpeedBadge result={result} />
                  {m.jdks.length > 0 && (
                    <span className="text-muted-foreground">
                      · JDK 镜像：{m.jdks.map((j) => j.version).join(' / ')}
                    </span>
                  )}
                </div>
              </div>
            </label>
          )
        })}
      </RadioGroup>

      {/* init.gradle 预览 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            init.gradle 预览
          </Label>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleCopy}
              disabled={!initGradle}
            >
              {copied ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? '已复制' : '复制'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleDownload}
              disabled={!initGradle}
            >
              <Download className="h-3 w-3" />
              下载
            </Button>
          </div>
        </div>
        <ScrollArea className="h-64 rounded-lg border border-border bg-zinc-950/60">
          <pre className="nexcube-scroll px-4 py-3 font-mono text-[12px] leading-relaxed text-zinc-200 whitespace-pre">
            {initGradle || '// 请先选择镜像源'}
          </pre>
        </ScrollArea>
        <p className="text-[11px] text-muted-foreground">
          放入 <code className="rounded bg-muted px-1 py-0.5 font-mono text-emerald-400">~/.gradle/init.d/</code>
          {' '}目录可全局生效，或在构建时使用
          {' '}<code className="rounded bg-muted px-1 py-0.5 font-mono text-emerald-400">gradle --init-script</code>。
        </p>
      </div>

      {/* 底部应用按钮 */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          切换后请重新构建项目以应用新镜像
        </div>
        <Button
          onClick={() => {
            if (!selectedId) return
            activateMutation.mutate(selectedId)
          }}
          disabled={!selectedId || activateMutation.isPending || (data?.activeMirrorId === selectedId)}
          className="bg-emerald-500 text-white hover:bg-emerald-600"
        >
          {activateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          应用并保存
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 子组件：速度徽章                                                    */
/* ------------------------------------------------------------------ */

function SpeedBadge({ result }: { result: TestResult | 'loading' | undefined }) {
  if (result === undefined) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <ZapOff className="h-3 w-3" />
        未测试
      </span>
    )
  }
  if (result === 'loading') {
    return (
      <span className="inline-flex items-center gap-1 text-amber-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        测试中...
      </span>
    )
  }
  if (!result.reachable) {
    return (
      <span className="inline-flex items-center gap-1 text-destructive">
        <ZapOff className="h-3 w-3" />
        不可达 {result.error ? `(${result.error})` : ''}
      </span>
    )
  }
  // 三档：≤300ms 绿，300-1000ms 黄，>1000ms 橙
  const latency = result.latency
  const color = latency <= 300 ? 'text-emerald-400' : latency <= 1000 ? 'text-amber-400' : 'text-orange-400'
  return (
    <span className={cn('inline-flex items-center gap-1', color)}>
      <Zap className="h-3 w-3" />
      {latency}ms ✓
    </span>
  )
}
