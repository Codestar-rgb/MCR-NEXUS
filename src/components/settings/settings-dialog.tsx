'use client'

/**
 * NexCube 全局设置对话框
 *
 * 大型设置面板（max-w-4xl），左侧导航 + 右侧内容：
 *
 *   ┌─────────────────────────────────────────────────┐
 *   │ 设置                                         [X] │
 *   ├──────────┬──────────────────────────────────────┤
 *   │ 📦 镜像源 │  [镜像源配置 / 主题 / 快捷键 / 插件 / 环境]  │
 *   │ 🎨 主题   │                                      │
 *   │ ⌨️ 快捷键 │                                      │
 *   │ 🔌 插件   │                                      │
 *   │ 🛠️ 环境   │                                      │
 *   └──────────┴──────────────────────────────────────┘
 *
 * 设计要点：
 *   - 深色主题默认，emerald 主色（无 indigo/blue）
 *   - 移动端：导航折叠为顶部横向 Tab；桌面端：左侧纵向
 *   - 通过 props.open 受控打开/关闭
 *   - 5 个 Tab：镜像源 / 主题 / 快捷键 / 插件 / 环境
 *     - 镜像源 → MirrorPanel（已实现）
 *     - 主题 → next-themes 切换深色/浅色
 *     - 快捷键 → 只读列表
 *     - 插件 → 占位（Task 6 实现）
 *     - 环境 → 占位（Task 6 实现）
 */

import * as React from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  Box,
  Cpu,
  Keyboard,
  Monitor,
  Moon,
  Package,
  Palette,
  Sun,
  type LucideIcon,
} from 'lucide-react'

import { MirrorPanel } from '@/components/settings/mirror-panel'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 初始打开时定位的 Tab，默认 'mirror' */
  defaultTab?: SettingsTab
}

export type SettingsTab = 'mirror' | 'theme' | 'shortcuts' | 'plugins' | 'env'

const NAV_ITEMS: Array<{
  id: SettingsTab
  label: string
  Icon: LucideIcon
  description: string
  soon?: boolean
}> = [
  { id: 'mirror', label: '镜像源', Icon: Box, description: 'Maven / Gradle 加速' },
  { id: 'theme', label: '主题', Icon: Palette, description: '深色 / 浅色切换' },
  { id: 'shortcuts', label: '快捷键', Icon: Keyboard, description: '键位映射' },
  { id: 'plugins', label: '插件', Icon: Package, description: '版本适配器', soon: true },
  { id: 'env', label: '环境', Icon: Cpu, description: '环境探针', soon: true },
]

export function SettingsDialog({ open, onOpenChange, defaultTab = 'mirror' }: SettingsDialogProps) {
  const [tab, setTab] = React.useState<SettingsTab>(defaultTab)

  // 每次打开时重置为 defaultTab
  React.useEffect(() => {
    if (open) {
      setTab(defaultTab)
    }
  }, [open, defaultTab])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[85vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Monitor className="h-4 w-4 text-emerald-400" />
            NexCube 设置
          </DialogTitle>
          <DialogDescription className="text-xs">
            配置镜像源、主题、快捷键、插件与环境
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* 左侧导航 */}
          <nav
            className="flex shrink-0 flex-row gap-1 overflow-x-auto border-b border-border bg-muted/20 p-2 md:w-52 md:flex-col md:overflow-y-auto md:border-b-0 md:border-r"
            aria-label="设置导航"
          >
            {NAV_ITEMS.map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                    'md:w-full md:shrink',
                    active
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <item.Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden md:inline">{item.label}</span>
                  <span className="md:hidden">{item.label}</span>
                  {item.soon && (
                    <Badge
                      variant="outline"
                      className="ml-auto hidden border-amber-500/40 bg-amber-500/10 px-1.5 py-0 text-[9px] text-amber-400 md:inline-flex"
                    >
                      即将上线
                    </Badge>
                  )}
                </button>
              )
            })}
          </nav>

          {/* 右侧内容 */}
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {tab === 'mirror' && <MirrorPanel />}
            {tab === 'theme' && <ThemePanel />}
            {tab === 'shortcuts' && <ShortcutsPanel />}
            {tab === 'plugins' && <PluginsPlaceholder />}
            {tab === 'env' && <EnvPlaceholder />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* 主题面板                                                            */
/* ------------------------------------------------------------------ */

function ThemePanel() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const isDark = mounted ? resolvedTheme === 'dark' : true

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold tracking-tight">主题</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          切换深色 / 浅色模式。NexCube 默认使用深色主题，适合长时间编码。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ThemeCard
          label="深色"
          description="默认 · 推荐"
          active={isDark}
          onClick={() => setTheme('dark')}
          Icon={Moon}
        />
        <ThemeCard
          label="浅色"
          description="明亮环境适用"
          active={!isDark}
          onClick={() => setTheme('light')}
          Icon={Sun}
        />
      </div>

      <div className="rounded-lg border border-border bg-card/40 p-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">跟随系统</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              根据操作系统主题自动切换（启用后手动选择将被覆盖）
            </p>
          </div>
          <Switch
            checked={false}
            onCheckedChange={(v) => {
              if (v) {
                setTheme('system')
                toast.info('已切换到跟随系统主题')
              } else {
                setTheme('dark')
                toast.success('已切换到深色主题')
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

function ThemeCard({
  label,
  description,
  active,
  onClick,
  Icon,
}: {
  label: string
  description: string
  active: boolean
  onClick: () => void
  Icon: LucideIcon
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col gap-2 rounded-lg border p-4 transition-all',
        active
          ? 'border-emerald-500/50 bg-emerald-500/[0.06] text-emerald-400'
          : 'border-border bg-card/40 text-muted-foreground hover:border-emerald-500/30 hover:bg-emerald-500/[0.03]',
      )}
    >
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5" />
        {active && (
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px]">
            当前
          </Badge>
        )}
      </div>
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className="text-[11px] text-muted-foreground">{description}</div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* 快捷键面板（只读）                                                  */
/* ------------------------------------------------------------------ */

const SHORTCUTS: Array<{ group: string; items: Array<{ keys: string; desc: string }> }> = [
  {
    group: '全局',
    items: [
      { keys: 'Ctrl/Cmd + K', desc: '打开命令面板' },
      { keys: 'Ctrl/Cmd + ,', desc: '打开设置' },
      { keys: 'Ctrl/Cmd + P', desc: '快速打开文件' },
      { keys: 'Ctrl/Cmd + Shift + P', desc: '显示所有命令' },
    ],
  },
  {
    group: '工作区',
    items: [
      { keys: 'Ctrl/Cmd + 1', desc: '切换到节点视图' },
      { keys: 'Ctrl/Cmd + 2', desc: '切换到代码视图' },
      { keys: 'Ctrl/Cmd + B', desc: '切换左侧文件树' },
      { keys: 'Ctrl/Cmd + J', desc: '切换底部终端' },
    ],
  },
  {
    group: '编辑器',
    items: [
      { keys: 'Ctrl/Cmd + S', desc: '保存当前文件' },
      { keys: 'Ctrl/Cmd + Shift + F', desc: '全局搜索' },
      { keys: 'Alt + F12', desc: '快速查看定义' },
      { keys: 'F2', desc: '重命名符号' },
    ],
  },
  {
    group: '节点画布',
    items: [
      { keys: 'Space + 拖拽', desc: '平移画布' },
      { keys: 'Ctrl/Cmd + 滚轮', desc: '缩放画布' },
      { keys: 'Ctrl/Cmd + D', desc: '复制选中节点' },
      { keys: 'Delete', desc: '删除选中节点' },
    ],
  },
]

function ShortcutsPanel() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold tracking-tight">快捷键</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          键位映射（只读）。自定义快捷键将在 Task 6 中实现。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SHORTCUTS.map((group) => (
          <div
            key={group.group}
            className="rounded-lg border border-border bg-card/40 p-3"
          >
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald-400">
              {group.group}
            </h4>
            <ul className="flex flex-col gap-1.5">
              {group.items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="text-muted-foreground">{item.desc}</span>
                  <kbd
                    className={cn(
                      'inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5',
                      'font-mono text-[10px] text-foreground',
                    )}
                  >
                    {item.keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 占位面板：插件 / 环境                                              */
/* ------------------------------------------------------------------ */

function PluginsPlaceholder() {
  return (
    <PlaceholderPanel
      title="版本适配器"
      description="管理 Forge / Fabric / NeoForge 等不同加载器的版本适配器。"
      bullets={[
        '自动检测已安装的 ForgeGradle / NeoGradle / Fabric Loom',
        '一键安装缺失的适配器',
        '切换默认加载器',
        '导出对应版本的项目骨架',
      ]}
      tag="Task 6 实现"
    />
  )
}

function EnvPlaceholder() {
  return (
    <PlaceholderPanel
      title="环境探针"
      description="检测 Java / Gradle / Git 等开发环境，并提供修复建议。"
      bullets={[
        'Java 17 / 21 版本检测',
        'Gradle Wrapper 完整性校验',
        'Git 凭据缓存检查',
        '系统 PATH 与 JAVA_HOME 验证',
      ]}
      tag="Task 6 实现"
    />
  )
}

function PlaceholderPanel({
  title,
  description,
  bullets,
  tag,
}: {
  title: string
  description: string
  bullets: string[]
  tag: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-400">
            {tag}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-card/20 p-6">
        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-2 text-xs text-amber-400">
          <Package className="h-3 w-3" />
          即将上线，敬请期待
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 兼容导出：默认导出方便 lazy load                                    */
/* ------------------------------------------------------------------ */

export default SettingsDialog

/** 用于在父组件中复用的按钮（方便其他模块快速打开设置） */
export function SettingsOpenButton({
  onOpen,
  children,
}: {
  onOpen: () => void
  children?: React.ReactNode
}) {
  return (
    <Button variant="ghost" size="sm" onClick={onOpen}>
      {children ?? '设置'}
    </Button>
  )
}
