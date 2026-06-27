/**
 * NexCube 插件系统
 *
 * 允许第三方扩展 NexCube 的功能：
 * - 自定义节点类型
 * - 自定义工作区模板
 * - 自定义代码生成器
 * - 自定义日志解析规则
 *
 * 插件通过 registerPlugin() 注册，在应用启动时加载。
 */

import type { NodeTypeDefinition, PropertySchema, PortDefinition } from '@/lib/node-system'
import type { WorkspaceTemplate } from '@/lib/workspace-templates'

/** 插件清单 */
export interface PluginManifest {
  /** 插件唯一 ID */
  id: string
  /** 插件名称 */
  name: string
  /** 版本号 */
  version: string
  /** 作者 */
  author: string
  /** 描述 */
  description: string
  /** 图标（lucide 图标名） */
  icon?: string
  /** 主页 URL */
  homepage?: string
}

/** 插件接口 */
export interface NexCubePlugin {
  manifest: PluginManifest
  /** 自定义节点类型 */
  nodeTypes?: Record<string, NodeTypeDefinition>
  /** 自定义工作区模板 */
  templates?: WorkspaceTemplate[]
  /** 自定义代码生成器（kind → 生成函数） */
  codeGenerators?: Record<string, (node: any, modId: string) => string>
  /** 自定义日志解析规则 */
  logRules?: Array<{
    id: string
    pattern: RegExp
    title: string
    level: 'error' | 'warn' | 'info'
    analysis: string
    suggestion: string
  }>
  /** 插件初始化钩子 */
  onActivate?: (ctx: PluginContext) => void
  /** 插件卸载钩子 */
  onDeactivate?: () => void
}

/** 插件上下文（提供给插件 API） */
export interface PluginContext {
  /** 注册节点类型 */
  registerNodeType: (kind: string, def: NodeTypeDefinition) => void
  /** 注册工作区模板 */
  registerTemplate: (template: WorkspaceTemplate) => void
  /** 注册代码生成器 */
  registerCodeGenerator: (kind: string, fn: (node: any, modId: string) => string) => void
  /** 显示通知 */
  notify: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  /** 获取当前项目 ID */
  getProjectId: () => string | null
  /** 获取当前工作区 ID */
  getWorkspaceId: () => string | null
}

/** 已注册的插件列表 */
const registeredPlugins: NexCubePlugin[] = []

/** 自定义节点类型注册表 */
const customNodeTypes: Record<string, NodeTypeDefinition> = {}

/** 自定义模板注册表 */
const customTemplates: WorkspaceTemplate[] = []

/** 自定义代码生成器注册表 */
const customCodeGenerators: Record<string, (node: any, modId: string) => string> = {}

/**
 * 注册插件
 */
export function registerPlugin(plugin: NexCubePlugin): void {
  if (registeredPlugins.find((p) => p.manifest.id === plugin.manifest.id)) {
    console.warn(`[Plugin] 插件 ${plugin.manifest.id} 已注册，跳过`)
    return
  }

  registeredPlugins.push(plugin)

  // 注册节点类型
  if (plugin.nodeTypes) {
    Object.entries(plugin.nodeTypes).forEach(([kind, def]) => {
      customNodeTypes[kind] = def
    })
  }

  // 注册模板
  if (plugin.templates) {
    plugin.templates.forEach((t) => customTemplates.push(t))
  }

  // 注册代码生成器
  if (plugin.codeGenerators) {
    Object.entries(plugin.codeGenerators).forEach(([kind, fn]) => {
      customCodeGenerators[kind] = fn
    })
  }

  // 调用激活钩子
  if (plugin.onActivate) {
    const ctx: PluginContext = {
      registerNodeType: (kind, def) => { customNodeTypes[kind] = def },
      registerTemplate: (t) => { customTemplates.push(t) },
      registerCodeGenerator: (kind, fn) => { customCodeGenerators[kind] = fn },
      notify: (msg, type = 'info') => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Plugin:${plugin.manifest.id}] ${type}: ${msg}`)
        }
      },
      getProjectId: () => null, // 由运行时注入
      getWorkspaceId: () => null,
    }
    plugin.onActivate(ctx)
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Plugin] 已加载: ${plugin.manifest.name} v${plugin.manifest.version}`)
  }
}

/**
 * 卸载插件
 */
export function unregisterPlugin(pluginId: string): void {
  const idx = registeredPlugins.findIndex((p) => p.manifest.id === pluginId)
  if (idx === -1) return

  const plugin = registeredPlugins[idx]
  if (plugin.onDeactivate) plugin.onDeactivate()

  // 清理注册的类型
  if (plugin.nodeTypes) {
    Object.keys(plugin.nodeTypes).forEach((kind) => delete customNodeTypes[kind])
  }

  registeredPlugins.splice(idx, 1)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Plugin] 已卸载: ${plugin.manifest.name}`)
  }
}

/**
 * 获取所有已注册插件
 */
export function getRegisteredPlugins(): NexCubePlugin[] {
  return [...registeredPlugins]
}

/**
 * 获取自定义节点类型
 */
export function getCustomNodeTypes(): Record<string, NodeTypeDefinition> {
  return { ...customNodeTypes }
}

/**
 * 获取自定义模板
 */
export function getCustomTemplates(): WorkspaceTemplate[] {
  return [...customTemplates]
}

/**
 * 获取自定义代码生成器
 */
export function getCustomCodeGenerator(kind: string): ((node: any, modId: string) => string) | undefined {
  return customCodeGenerators[kind]
}

/**
 * 获取自定义日志规则
 */
export function getCustomLogRules() {
  const rules: Array<any> = []
  registeredPlugins.forEach((p) => {
    if (p.logRules) rules.push(...p.logRules)
  })
  return rules
}
