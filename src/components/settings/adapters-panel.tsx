'use client'

/**
 * NexCube 版本适配器面板
 *
 * 功能：
 *   1. 从 /api/adapters 拉取适配器列表（首次自动初始化 3 个默认适配器）
 *   2. 每个适配器卡片展示：加载器图标 + 名称 + MC 版本 + 构建插件版本 + 状态徽章
 *   3. Forge 1.20.1 标记"已安装"（emerald）
 *   4. Fabric / NeoForge 标记"未安装"（amber）
 *   5. "安装"按钮：toast 提示 + 2 秒 mock 下载 + 调用 POST /api/adapters
 *   6. "查看详情"按钮：弹出详情对话框（展示支持的 API 列表）
 *
 * 设计要点：
 *   - 深色主题，emerald 主色（无 indigo/blue）
 *   - 卡片样式与设置面板其他 Tab 保持一致
 *   - 不同加载器使用不同颜色徽章（Forge 橙 / Fabric 紫 / NeoForge 黄）
 *   - 安装/卸载有 loading 状态
 */

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Boxes,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  Package,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

type LoaderKind = 'forge' | 'fabric' | 'neoforge'

interface AdapterDTO {
  id: string
  name: string
  loader: LoaderKind
  mcVersion: string
  loaderVersion: string
  gradlePlugin: string
  pluginVersion: string
  supportedApis: string[]
  description: string
  isInstalled: boolean
  isOfficial: boolean
}

interface AdaptersResponse {
  adapters: AdapterDTO[]
}

/* ------------------------------------------------------------------ */
/* 加载器配色与图标                                                    */
/* ------------------------------------------------------------------ */

const LOADER_THEME: Record<
  LoaderKind,
  { label: string; accent: string; badge: string; iconBg: string }
> = {
  forge: {
    label: 'Forge',
    accent: 'text-orange-400',
    badge: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
    iconBg: 'bg-orange-500/10 text-orange-400 border-orange-500/40',
  },
  fabric: {
    label: 'Fabric',
    accent: 'text-fuchsia-400',
    badge: 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-400',
    iconBg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/40',
  },
  neoforge: {
    label: 'NeoForge',
    accent: 'text-amber-400',
    badge: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
  },
}

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export function AdaptersPanel() {
  const queryClient = useQueryClient()
  const [detailAdapter, setDetailAdapter] = React.useState<AdapterDTO | null>(null)
  const [installing, setInstalling] = React.useState<Record<string, boolean>>({})

  // ---------- 拉取适配器列表 ----------
  const { data, isLoading, refetch, isFetching } = useQuery<AdaptersResponse>({
    queryKey: ['adapters'],
    queryFn: async () => {
      const res = await fetch('/api/adapters', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error('failed_to_load_adapters')
      }
      return res.json() as Promise<AdaptersResponse>
    },
    staleTime: 60_000,
  })

  const adapters = data?.adapters ?? []

  // ---------- 安装/卸载 mutation ----------
  const updateMutation = useMutation({
    mutationFn: async ({
      name,
      isInstalled,
    }: {
      name: string
      isInstalled: boolean
    }) => {
      const res = await fetch('/api/adapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, isInstalled }),
      })
      if (!res.ok) {
        throw new Error('failed_to_update_adapter')
      }
      return res.json()
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['adapters'] })
      const a = adapters.find((x) => x.name === vars.name)
      const label = a ? `${LOADER_THEME[a.loader].label} ${a.mcVersion}` : vars.name
      if (vars.isInstalled) {
        toast.success(`${label} 已安装`, {
          description: '现在可以为该加载器创建新项目了。',
        })
      } else {
        toast.info(`${label} 已卸载`)
      }
    },
    onError: (_err, vars) => {
      const a = adapters.find((x) => x.name === vars.name)
      const label = a ? `${LOADER_THEME[a.loader].label} ${a.mcVersion}` : vars.name
      toast.error('操作失败', {
        description: `${label} 状态更新失败，请稍后重试。`,
      })
    },
  })

  // ---------- mock 安装（2 秒下载动画） ----------
  const handleInstall = React.useCallback(
    async (adapter: AdapterDTO) => {
      setInstalling((prev) => ({ ...prev, [adapter.name]: true }))
      const label = `${LOADER_THEME[adapter.loader].label} ${adapter.mcVersion}`
      toast.info('正在下载适配器...', {
        description: `${label} · ${adapter.gradlePlugin} ${adapter.pluginVersion}`,
      })

      // mock 下载延时
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setInstalling((prev) => {
        const next = { ...prev }
        delete next[adapter.name]
        return next
      })

      updateMutation.mutate({ name: adapter.name, isInstalled: true })
    },
    [updateMutation],
  )

  // ---------- 卸载 ----------
  const handleUninstall = React.useCallback(
    (adapter: AdapterDTO) => {
      updateMutation.mutate({ name: adapter.name, isInstalled: false })
    },
    [updateMutation],
  )

  // ---------- 渲染 ----------
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        正在加载版本适配器...
      </div>
    )
  }

  const installedCount = adapters.filter((a) => a.isInstalled).length

  return (
    <div className="flex flex-col gap-4">
      {/* 顶部说明 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight">版本适配器</h3>
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-400"
            >
              {installedCount}/{adapters.length} 已安装
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            管理不同 Minecraft 版本和加载器的支持。每个适配器包含对应的 Gradle 插件、API 字典和项目模板。
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          刷新
        </Button>
      </div>

      {/* 适配器卡片网格 */}
      {adapters.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-card/20 text-sm text-muted-foreground">
          暂无可用适配器
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {adapters.map((a) => {
            const theme = LOADER_THEME[a.loader]
            const isInstalling = installing[a.name]
            return (
              <AdapterCard
                key={a.id}
                adapter={a}
                theme={theme}
                isInstalling={isInstalling}
                isToggling={updateMutation.isPending && !isInstalling}
                onInstall={() => handleInstall(a)}
                onUninstall={() => handleUninstall(a)}
                onViewDetail={() => setDetailAdapter(a)}
              />
            )
          })}
        </div>
      )}

      {/* 默认平台说明 */}
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.04] p-3">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div className="text-xs">
            <div className="font-medium text-emerald-400">NexCube 默认目标平台</div>
            <div className="mt-0.5 text-muted-foreground">
              Forge 1.20.1 · 47.3.x · ForgeGradle 6.0.x。新建项目时该适配器将作为推荐选项。
            </div>
          </div>
        </div>
      </div>

      {/* 详情对话框 */}
      <AdapterDetailDialog
        adapter={detailAdapter}
        onClose={() => setDetailAdapter(null)}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 适配器卡片                                                          */
/* ------------------------------------------------------------------ */

interface AdapterCardProps {
  adapter: AdapterDTO
  theme: (typeof LOADER_THEME)[LoaderKind]
  isInstalling: boolean
  isToggling: boolean
  onInstall: () => void
  onUninstall: () => void
  onViewDetail: () => void
}

function AdapterCard({
  adapter,
  theme,
  isInstalling,
  isToggling,
  onInstall,
  onUninstall,
  onViewDetail,
}: AdapterCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border p-4 transition-colors',
        adapter.isInstalled
          ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
          : 'border-border bg-card/40 hover:border-emerald-500/30',
      )}
    >
      {/* 头部：图标 + 名称 + 状态 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
              theme.iconBg,
            )}
          >
            <Boxes className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">
                {theme.label} {adapter.mcVersion}
              </span>
              <Badge variant="outline" className={cn('text-[9px]', theme.badge)}>
                {theme.label}
              </Badge>
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {adapter.gradlePlugin} {adapter.pluginVersion} · {adapter.loaderVersion}
            </div>
          </div>
        </div>

        {/* 状态徽章 */}
        {adapter.isInstalled ? (
          <Badge
            variant="outline"
            className="shrink-0 border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-400"
          >
            <CheckCircle2 className="h-3 w-3" />
            已安装
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="shrink-0 border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-400"
          >
            <Download className="h-3 w-3" />
            未安装
          </Badge>
        )}
      </div>

      {/* 描述 */}
      <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
        {adapter.description}
      </p>

      {/* 操作按钮 */}
      <div className="mt-auto flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewDetail}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-emerald-400"
        >
          <Eye className="h-3 w-3" />
          查看详情
        </Button>

        {adapter.isInstalled ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onUninstall}
            disabled={isToggling}
            className="ml-auto h-7 px-2 text-xs"
          >
            {isToggling ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            卸载
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onInstall}
            disabled={isInstalling}
            className="ml-auto h-7 px-2 text-xs bg-emerald-500 text-white hover:bg-emerald-600"
          >
            {isInstalling ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            {isInstalling ? '安装中...' : '安装'}
          </Button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 详情对话框                                                          */
/* ------------------------------------------------------------------ */

function AdapterDetailDialog({
  adapter,
  onClose,
}: {
  adapter: AdapterDTO | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!adapter} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        {adapter && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md border',
                    LOADER_THEME[adapter.loader].iconBg,
                  )}
                >
                  <Boxes className="h-4 w-4" />
                </div>
                {LOADER_THEME[adapter.loader].label} {adapter.mcVersion}
                {adapter.isInstalled ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-400"
                  >
                    已安装
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-400"
                  >
                    未安装
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {adapter.description}
              </DialogDescription>
            </DialogHeader>

            {/* 元信息 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetaItem label="MC 版本" value={adapter.mcVersion} />
              <MetaItem
                label={`${LOADER_THEME[adapter.loader].label} 版本`}
                value={adapter.loaderVersion}
              />
              <MetaItem label="Gradle 插件" value={adapter.gradlePlugin} />
              <MetaItem label="插件版本" value={adapter.pluginVersion} />
            </div>

            {/* API 列表 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-emerald-400">
                <Package className="h-3 w-3" />
                支持的 API（{adapter.supportedApis.length}）
              </div>
              {adapter.supportedApis.length > 0 ? (
                <ScrollArea className="h-56 rounded-lg border border-border bg-zinc-950/60">
                  <ul className="nexcube-scroll flex flex-col p-3">
                    {adapter.supportedApis.map((api) => (
                      <li
                        key={api}
                        className="border-b border-border/40 py-1.5 font-mono text-[11px] text-zinc-300 last:border-b-0"
                      >
                        <span className="text-emerald-400/70">●</span>{' '}
                        {api}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border bg-card/20 text-xs text-muted-foreground">
                  暂无 API 字典数据
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                关闭
              </Button>
              {!adapter.isInstalled && (
                <Button
                  size="sm"
                  onClick={onClose}
                  className="bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  <Download className="h-3 w-3" />
                  立即安装
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* 子组件：元信息项                                                    */
/* ------------------------------------------------------------------ */

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card/40 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-medium text-foreground" title={value}>
        {value}
      </div>
    </div>
  )
}
