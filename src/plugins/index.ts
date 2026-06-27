/**
 * 插件加载入口
 *
 * 在应用启动时统一注册所有内置插件。
 * 由 layout.tsx 调用 initPlugins() 触发。
 *
 * 第三方插件可通过 registerPlugin() 动态注册。
 */

import { registerPlugin } from '@/lib/plugin-system'
import { magicPlugin } from './magic-system'

let initialized = false

export function initPlugins() {
  if (initialized) return
  initialized = true

  try {
    registerPlugin(magicPlugin)
  } catch (err) {
    console.error('[Plugins] Failed to load magic-system:', err)
  }
}
