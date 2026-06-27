'use client'

/**
 * 插件初始化组件
 *
 * 在客户端挂载时加载所有内置插件。
 * 放在 layout 中，确保所有路由都能使用插件贡献的节点类型/模板/codegen。
 */

import { useEffect } from 'react'
import { initPlugins } from '@/plugins'

export function PluginInit() {
  useEffect(() => {
    initPlugins()
  }, [])
  return null
}
