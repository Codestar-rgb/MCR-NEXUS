'use client'

/**
 * NexCube 环境探针面板
 *
 * 功能：
 *   1. 真实调用 capabilities.env 检测：
 *      - Java 运行环境
 *      - Git 版本控制
 *      - Gradle 构建工具
 *      - 网络连通性（阿里云镜像）
 *   2. 显示系统信息（平台 / 内存 / CPU）
 *   3. 缺失项提供"一键修复"按钮（toast 提示在桌面版启用自动下载）
 *   4. "重新测试"按钮重新执行检测
 *   5. 检测中显示 spinner
 *   6. 全部通过显示"环境就绪"总结
 *
 * 设计要点：
 *   - 深色主题，emerald 主色（无 indigo/blue）
 *   - 失败/缺失项使用 amber 警告色，不可达使用 destructive
 *   - 卡片样式与设置面板其他 Tab 保持一致
 */

import * as React from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  GitBranch,
  HardDrive,
  Loader2,
  MemoryStick,
  Network,
  Package,
  RefreshCw,
  Wrench,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { capabilities } from '@/lib/capabilities'
import type {
  NetworkStatus,
  SystemInfo,
  ToolStatus,
} from '@/lib/capabilities'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

type ToolKey = 'java' | 'git' | 'gradle' | 'network'

interface ToolCheckState {
  status: ToolStatus
  network?: NetworkStatus
  loading: boolean
  error?: string
}

interface CheckRowProps {
  icon: React.ElementType
  title: string
  state: ToolCheckState
  /** 仅在缺失或可选安装时显示的修复按钮文案 */
  fixLabel?: string
  onFix?: () => void
  /** 网络检测行才显示"重新测试" */
  onRetest?: () => void
  retestLabel?: string
}

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export function EnvironmentPanel() {
  const [javaState, setJavaState] = React.useState<ToolCheckState>({
    status: { name: 'java', installed: false },
    loading: true,
  })
  const [gitState, setGitState] = React.useState<ToolCheckState>({
    status: { name: 'git', installed: false },
    loading: true,
  })
  const [gradleState, setGradleState] = React.useState<ToolCheckState>({
    status: { name: 'gradle', installed: false },
    loading: true,
  })
  const [networkState, setNetworkState] = React.useState<ToolCheckState>({
    status: { name: 'network', installed: false },
    loading: true,
  })
  const [systemInfo, setSystemInfo] = React.useState<SystemInfo | null>(null)
  const [systemLoading, setSystemLoading] = React.useState(true)
  const [retesting, setRetesting] = React.useState(false)

  // ---------- 执行所有检测 ----------
  const runAllChecks = React.useCallback(async () => {
    setRetesting(true)
    setJavaState({ status: { name: 'java', installed: false }, loading: true })
    setGitState({ status: { name: 'git', installed: false }, loading: true })
    setGradleState({ status: { name: 'gradle', installed: false }, loading: true })
    setNetworkState({ status: { name: 'network', installed: false }, loading: true })
    setSystemLoading(true)
    setSystemInfo(null)

    // Java
    try {
      const status = await capabilities.env.detectJava()
      setJavaState({ status, loading: false })
    } catch (err) {
      setJavaState({
        status: { name: 'java', installed: false },
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // Git
    try {
      const status = await capabilities.env.detectGit()
      setGitState({ status, loading: false })
    } catch (err) {
      setGitState({
        status: { name: 'git', installed: false },
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // Gradle
    try {
      const status = await capabilities.env.detectGradle()
      setGradleState({ status, loading: false })
    } catch (err) {
      setGradleState({
        status: { name: 'gradle', installed: false },
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // Network — 探测阿里云镜像
    try {
      const network = await capabilities.env.detectNetwork(
        'https://maven.aliyun.com/repository/public',
      )
      setNetworkState({
        status: {
          name: 'network',
          installed: network.reachable,
          version: network.reachable ? `${network.latency}ms` : undefined,
        },
        network,
        loading: false,
      })
    } catch (err) {
      setNetworkState({
        status: { name: 'network', installed: false },
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    // 系统信息
    try {
      const info = await capabilities.env.getSystemInfo()
      setSystemInfo(info)
    } catch (err) {
      console.warn('[env] getSystemInfo failed:', err)
    } finally {
      setSystemLoading(false)
    }

    setRetesting(false)
  }, [])

  // 初次挂载时检测一次
  React.useEffect(() => {
    runAllChecks()
  }, [runAllChecks])

  // ---------- 一键修复 ----------
  const handleFix = React.useCallback((tool: ToolKey) => {
    const toolNames: Record<ToolKey, string> = {
      java: 'Java 运行环境',
      git: 'Git 版本控制',
      gradle: 'Gradle 构建工具',
      network: '网络连通性',
    }
    toast.info(`将在桌面版启用自动下载`, {
      description: `${toolNames[tool]} 的自动安装需要 Electron 桌面端权限，Web 版仅做检测。`,
    })
  }, [])

  // ---------- 重新测试网络 ----------
  const handleRetestNetwork = React.useCallback(async () => {
    setNetworkState((prev) => ({ ...prev, loading: true }))
    try {
      const network = await capabilities.env.detectNetwork(
        'https://maven.aliyun.com/repository/public',
      )
      setNetworkState({
        status: {
          name: 'network',
          installed: network.reachable,
          version: network.reachable ? `${network.latency}ms` : undefined,
        },
        network,
        loading: false,
      })
      if (network.reachable) {
        toast.success(`网络可达 · ${network.latency}ms`)
      } else {
        toast.warning('网络不可达', {
          description: network.error ?? '请检查代理或防火墙设置。',
        })
      }
    } catch (err) {
      setNetworkState({
        status: { name: 'network', installed: false },
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      })
      toast.error('网络测试失败')
    }
  }, [])

  // ---------- 总结：是否全部通过 ----------
  const allLoaded =
    !javaState.loading &&
    !gitState.loading &&
    !gradleState.loading &&
    !networkState.loading
  const allReady =
    allLoaded &&
    javaState.status.installed &&
    gitState.status.installed &&
    gradleState.status.installed &&
    networkState.status.installed
  const missingCount = [javaState, gitState, gradleState, networkState].filter(
    (s) => !s.loading && !s.status.installed,
  ).length

  return (
    <div className="flex flex-col gap-4">
      {/* 顶部说明 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight">环境探针</h3>
            <Badge
              variant="outline"
              className={cn(
                'border-emerald-500/40 text-[10px]',
                allReady
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : allLoaded
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                    : 'text-muted-foreground',
              )}
            >
              {allReady
                ? '环境就绪'
                : allLoaded
                  ? `${missingCount} 项缺失`
                  : '检测中'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            检测 Java / Git / Gradle 等开发工具，并提供修复建议。NexCube 默认使用 Gradle Wrapper，全局 Gradle 缺失不影响构建。
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runAllChecks}
          disabled={retesting}
        >
          {retesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          重新检测
        </Button>
      </div>

      {/* 全部就绪总结条 */}
      {allReady && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">环境就绪</span>
          <span className="text-emerald-400/70">
            · 所有开发工具与网络均可用，可以开始构建模组项目。
          </span>
        </div>
      )}

      {/* 检测项卡片列表 */}
      <div className="flex flex-col gap-2">
        <CheckRow
          icon={Package}
          title="Java 运行环境"
          state={javaState}
          fixLabel="一键修复"
          onFix={() => handleFix('java')}
        />
        <CheckRow
          icon={GitBranch}
          title="Git 版本控制"
          state={gitState}
          fixLabel="一键修复"
          onFix={() => handleFix('git')}
        />
        <CheckRow
          icon={Package}
          title="Gradle 构建工具"
          state={gradleState}
          fixLabel="下载 Gradle 8.1.1"
          onFix={() => handleFix('gradle')}
        />
        <CheckRow
          icon={Network}
          title="网络连通性"
          state={networkState}
          onRetest={handleRetestNetwork}
          retestLabel="重新测试"
        />
      </div>

      {/* 系统信息 */}
      <SystemInfoSection info={systemInfo} loading={systemLoading} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 单项检测行                                                          */
/* ------------------------------------------------------------------ */

function CheckRow({
  icon: Icon,
  title,
  state,
  fixLabel,
  onFix,
  onRetest,
  retestLabel,
}: CheckRowProps) {
  const { status, network, loading, error } = state

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between',
        loading
          ? 'border-border bg-card/30'
          : status.installed
            ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
            : 'border-amber-500/40 bg-amber-500/[0.04]',
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {/* 图标 + 状态点 */}
        <div className="relative mt-0.5 shrink-0">
          <Icon
            className={cn(
              'h-5 w-5',
              loading
                ? 'text-muted-foreground'
                : status.installed
                  ? 'text-emerald-400'
                  : 'text-amber-400',
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{title}</span>
            {loading ? (
              <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                检测中
              </Badge>
            ) : status.installed ? (
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-400"
              >
                <CheckCircle2 className="h-3 w-3" />
                {status.version ? status.version : '已安装'}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-400"
              >
                <AlertTriangle className="h-3 w-3" />
                未检测到
              </Badge>
            )}
          </div>

          {/* 详情行 */}
          <div className="mt-1 text-[11px] text-muted-foreground">
            {loading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                正在检测...
              </span>
            ) : error ? (
              <span className="text-destructive">{error}</span>
            ) : status.installed ? (
              <span className="inline-flex flex-col gap-0.5">
                {status.path && (
                  <span className="truncate font-mono">{status.path}</span>
                )}
                {status.fixHint && (
                  <span className="text-emerald-400/70">{status.fixHint}</span>
                )}
              </span>
            ) : network ? (
              <span className="inline-flex flex-col gap-0.5">
                <span>
                  不可达 · {network.latency}ms
                  {network.error ? ` · ${network.error}` : ''}
                </span>
                <span className="truncate font-mono text-muted-foreground/70">
                  {network.url}
                </span>
              </span>
            ) : (
              <span>{status.fixHint ?? '未在系统 PATH 中找到该工具。'}</span>
            )}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
        {!loading && !status.installed && onFix && fixLabel && (
          <Button size="sm" variant="outline" onClick={onFix} className="h-7 px-2 text-xs">
            <Wrench className="h-3 w-3" />
            {fixLabel}
          </Button>
        )}
        {!loading && onRetest && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetest}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-emerald-400"
          >
            <RefreshCw className="h-3 w-3" />
            {retestLabel ?? '重新测试'}
          </Button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 系统信息区                                                          */
/* ------------------------------------------------------------------ */

function SystemInfoSection({
  info,
  loading,
}: {
  info: SystemInfo | null
  loading: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Cpu className="h-4 w-4 text-emerald-400" />
        <h4 className="text-xs font-medium uppercase tracking-wider text-emerald-400">
          系统信息
        </h4>
        {loading && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-md border border-border bg-muted/40"
            />
          ))}
        </div>
      ) : info ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoCard
            icon={Cpu}
            label="平台"
            value={`${platformLabel(info.platform)} ${info.arch}`}
          />
          <InfoCard
            icon={MemoryStick}
            label="内存"
            value={`${formatBytes(info.totalMemory)} / 可用 ${formatBytes(info.freeMemory)}`}
          />
          <InfoCard
            icon={HardDrive}
            label="CPU 核心"
            value={`${info.cpus} 核`}
          />
          <InfoCard
            icon={Cpu}
            label="主机名"
            value={info.hostname}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-amber-400">
          <XCircle className="h-3 w-3" />
          系统信息获取失败
        </div>
      )}
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="truncate text-sm font-medium text-foreground" title={value}>
        {value}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

function platformLabel(p: SystemInfo['platform']): string {
  switch (p) {
    case 'windows':
      return 'Windows'
    case 'macos':
      return 'macOS'
    case 'linux':
      return 'Linux'
    default:
      return String(p)
  }
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) {
    return gb >= 100
      ? `${Math.round(gb)}GB`
      : `${gb.toFixed(1).replace(/\.0$/, '')}GB`
  }
  const mb = bytes / (1024 * 1024)
  return `${Math.round(mb)}MB`
}
