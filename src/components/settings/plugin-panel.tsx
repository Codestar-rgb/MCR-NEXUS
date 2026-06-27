'use client'

/**
 * 插件管理面板
 *
 * 在设置面板的「插件」Tab 中展示：
 * - 已注册插件列表（名称/版本/作者/描述）
 * - 启用/禁用开关
 * - 插件详情（提供的节点类型/模板数量）
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { Puzzle, Check, X, ExternalLink } from 'lucide-react'
import {
  getRegisteredPlugins,
  unregisterPlugin,
  type NexCubePlugin,
} from '@/lib/plugin-system'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function PluginPanel() {
  const [plugins, setPlugins] = React.useState<NexCubePlugin[]>([])
  const [enabledIds, setEnabledIds] = React.useState<Set<string>>(new Set())

  // 加载已注册插件
  React.useEffect(() => {
    const registered = getRegisteredPlugins()
    setPlugins(registered)
    // 默认全部启用
    setEnabledIds(new Set(registered.map((p) => p.manifest.id)))
  }, [])

  const handleToggle = (plugin: NexCubePlugin) => {
    const id = plugin.manifest.id
    if (enabledIds.has(id)) {
      unregisterPlugin(id)
      setEnabledIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setPlugins(getRegisteredPlugins())
      toast.success(`已禁用：${plugin.manifest.name}`)
    } else {
      // 重新注册需要重新 import（简化：提示用户刷新）
      toast.info(`请刷新页面以重新加载：${plugin.manifest.name}`)
    }
  }

  if (plugins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border/50 text-muted-foreground/40">
          <Puzzle className="h-7 w-7" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">暂无已安装插件</p>
          <p className="mt-1 text-xs text-muted-foreground">
            插件通过 <code className="rounded bg-muted/40 px-1 py-px font-mono text-[10px]">registerPlugin()</code> 注册
          </p>
        </div>
        <div className="mt-2 max-w-sm rounded-lg border border-border/30 bg-card/20 p-3 text-left">
          <p className="text-[11px] font-medium text-foreground">开发插件：</p>
          <ol className="mt-1 space-y-0.5 text-[10px] text-muted-foreground/70">
            <li>1. 创建 <code className="font-mono">src/plugins/my-plugin.ts</code></li>
            <li>2. 定义 <code className="font-mono">NexCubePlugin</code> 接口</li>
            <li>3. 调用 <code className="font-mono">registerPlugin()</code></li>
          </ol>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Puzzle className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">已安装插件</h3>
          <span className="rounded-full bg-muted/40 px-1.5 py-px text-[10px] text-muted-foreground">
            {plugins.length}
          </span>
        </div>
      </div>

      {plugins.map((plugin, idx) => {
        const isEnabled = enabledIds.has(plugin.manifest.id)
        const nodeCount = plugin.nodeTypes ? Object.keys(plugin.nodeTypes).length : 0
        const templateCount = plugin.templates?.length ?? 0
        const generatorCount = plugin.codeGenerators ? Object.keys(plugin.codeGenerators).length : 0

        return (
          <motion.div
            key={plugin.manifest.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.05 }}
            className={cn(
              'rounded-lg border p-4 transition-all',
              isEnabled
                ? 'border-border/40 bg-card/30'
                : 'border-border/20 bg-muted/10 opacity-60',
            )}
          >
            {/* 标题行 */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  isEnabled
                    ? 'bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20'
                    : 'bg-muted/40 text-muted-foreground/50',
                )}>
                  <Puzzle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{plugin.manifest.name}</h4>
                    <span className="rounded bg-muted/40 px-1.5 py-px font-mono text-[9px] text-muted-foreground">
                      v{plugin.manifest.version}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{plugin.manifest.description}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                    by {plugin.manifest.author}
                  </p>
                </div>
              </div>

              {/* 启用/禁用开关 */}
              <button
                onClick={() => handleToggle(plugin)}
                className={cn(
                  'flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
                  isEnabled ? 'bg-primary/30' : 'bg-muted/40',
                )}
                aria-label={isEnabled ? '禁用插件' : '启用插件'}
              >
                <div className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full transition-transform',
                  isEnabled ? 'translate-x-5 bg-primary text-primary-foreground' : 'translate-x-0 bg-muted-foreground/40',
                )}>
                  {isEnabled ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </div>
              </button>
            </div>

            {/* 统计信息 */}
            {isEnabled && (nodeCount > 0 || templateCount > 0 || generatorCount > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {nodeCount > 0 && (
                  <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">
                    {nodeCount} 节点类型
                  </span>
                )}
                {templateCount > 0 && (
                  <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-300">
                    {templateCount} 工作区模板
                  </span>
                )}
                {generatorCount > 0 && (
                  <span className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300">
                    {generatorCount} 代码生成器
                  </span>
                )}
              </div>
            )}

            {/* 主页链接 */}
            {plugin.manifest.homepage && (
              <a
                href={plugin.manifest.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-primary"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                {plugin.manifest.homepage}
              </a>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
