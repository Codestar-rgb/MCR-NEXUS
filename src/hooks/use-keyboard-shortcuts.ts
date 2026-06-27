'use client'

/**
 * 全局键盘快捷键（Task 4-D）
 *
 * 监听 document 级别的 keydown，派发到已注册的处理器：
 *
 *   Ctrl+Z              → undo
 *   Ctrl+Shift+Z / Y    → redo
 *   Ctrl+S              → save（触发画布同步 + 写一条 Git commit）
 *   Ctrl+B              → build（构建 JAR）
 *   Ctrl+E              → export（打开导出对话框）
 *   Ctrl+/              → toggleMode（节点 ↔ 代码视图）
 *
 * 与 Monaco 编辑器的冲突处理：
 *   Monaco 自带 Ctrl+Z / Ctrl+Shift+Z / Ctrl+S，监听器会在
 *   document.activeElement 位于 .monaco-editor 容器内时跳过本派发。
 *   Monaco 内部的编辑快捷键不受影响。
 *
 * 与 INPUT/TEXTAREA 的冲突处理：
 *   当 e.target 是 input/textarea/select 或 [contenteditable] 时跳过，
 *   避免打断用户在属性面板/搜索框中的输入。
 *
 * 使用方式：
 *   useKeyboardShortcuts({
 *     onUndo: () => ...,
 *     onExport: () => setExportOpen(true),
 *     ...
 *   })
 *
 * 处理器可随时变化（每次渲染重新传入），hook 内部用 ref 缓存最新引用，
 *   避免不必要的 add/removeEventListener。
 */

import * as React from 'react'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

export type ShortcutAction =
  | 'undo'
  | 'redo'
  | 'save'
  | 'build'
  | 'export'
  | 'toggleMode'

export interface ShortcutHandlers {
  onUndo?: () => void
  onRedo?: () => void
  onSave?: () => void
  onBuild?: () => void
  onExport?: () => void
  onToggleMode?: () => void
}

export interface UseKeyboardShortcutsOptions {
  /** 是否启用全局监听（默认 true，可在模态对话框打开时设为 false） */
  enabled?: boolean
  /** 当某个 action 没有注册 handler 时，是否显示默认 toast 提示 */
  showDefaultToast?: boolean
}

/* ------------------------------------------------------------------ */
/* 工具：判断事件目标是否处于"输入态"                                   */
/* ------------------------------------------------------------------ */

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function isInEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  // 1) 标准表单元素
  if (INPUT_TAGS.has(target.tagName)) return true

  // 2) contenteditable
  if (target.isContentEditable) return true

  // 3) Monaco 编辑器：检查祖先链中是否有 .monaco-editor
  //    Monaco 的实际 textarea 是 .monaco-editor 的子节点
  if (target.closest('.monaco-editor')) return true

  // 4) xterm 终端容器：终端有自己的输入处理
  if (target.closest('.xterm')) return true

  return false
}

/* ------------------------------------------------------------------ */
/* Hook 主体                                                           */
/* ------------------------------------------------------------------ */

export function useKeyboardShortcuts(
  handlers: ShortcutHandlers,
  options: UseKeyboardShortcutsOptions = {},
): void {
  const { enabled = true, showDefaultToast = true } = options

  // 用 ref 保存最新 handlers，避免 effect 依赖频繁变化。
  // ref 必须在 effect 内同步（React 19 严格禁止在 render 中变更 ref）。
  const handlersRef = React.useRef(handlers)
  const optsRef = React.useRef({ enabled, showDefaultToast })
  React.useEffect(() => {
    handlersRef.current = handlers
  })
  React.useEffect(() => {
    optsRef.current = { enabled, showDefaultToast }
  })

  React.useEffect(() => {
    if (!enabled) return

    function onKeyDown(e: KeyboardEvent) {
      const opts = optsRef.current
      if (!opts.enabled) return

      // 仅响应 Ctrl（Win/Linux）或 Cmd（macOS）
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return

      // 输入态跳过（避免与 Monaco/属性面板/终端冲突）
      if (isInEditable(e.target)) return

      // Shift 状态用于区分 Z 与 Shift+Z
      const shift = e.shiftKey
      const key = e.key.toLowerCase()

      let action: ShortcutAction | null = null

      // Ctrl+Z / Ctrl+Shift+Z
      if (key === 'z' && !shift) action = 'undo'
      else if (key === 'z' && shift) action = 'redo'
      else if (key === 'y') action = 'redo' // Ctrl+Y
      else if (key === 's') action = 'save'
      else if (key === 'b') action = 'build'
      else if (key === 'e') action = 'export'
      else if (key === '/') action = 'toggleMode'

      if (!action) return

      // 阻止浏览器默认行为：
      //   Ctrl+S（保存网页）/ Ctrl+B（书签）/ Ctrl+E（搜索）等
      e.preventDefault()
      e.stopPropagation()

      dispatchAction(action, handlersRef.current, opts.showDefaultToast)
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [enabled])
}

/* ------------------------------------------------------------------ */
/* 派发逻辑                                                            */
/* ------------------------------------------------------------------ */

const ACTION_LABELS: Record<ShortcutAction, string> = {
  undo: '撤销',
  redo: '重做',
  save: '保存',
  build: '构建',
  export: '导出',
  toggleMode: '切换视图',
}

function dispatchAction(
  action: ShortcutAction,
  handlers: ShortcutHandlers,
  showDefaultToast: boolean,
): void {
  let handler: (() => void) | undefined
  switch (action) {
    case 'undo': handler = handlers.onUndo; break
    case 'redo': handler = handlers.onRedo; break
    case 'save': handler = handlers.onSave; break
    case 'build': handler = handlers.onBuild; break
    case 'export': handler = handlers.onExport; break
    case 'toggleMode': handler = handlers.onToggleMode; break
  }

  if (handler) {
    try {
      handler()
    } catch (err) {
      console.error(`[Shortcut] ${action} handler error:`, err)
      toast.error(`${ACTION_LABELS[action]}失败`, {
        description: err instanceof Error ? err.message : String(err),
      })
    }
    return
  }

  // 无 handler → 显示默认提示（仅在 showDefaultToast=true 时）
  if (showDefaultToast) {
    toast.info(`快捷键：${ACTION_LABELS[action]}`, {
      description: '该动作暂未绑定具体行为',
      duration: 1500,
    })
  }
}

/* ------------------------------------------------------------------ */
/* 便捷工具：列出所有可用快捷键（用于 UI 帮助面板）                     */
/* ------------------------------------------------------------------ */

export interface ShortcutDescriptor {
  action: ShortcutAction
  keys: string[]
  description: string
}

export const SHORTCUT_LIST: ShortcutDescriptor[] = [
  { action: 'undo', keys: ['Ctrl', 'Z'], description: '撤销上一步操作' },
  { action: 'redo', keys: ['Ctrl', 'Shift', 'Z'], description: '重做（也可 Ctrl+Y）' },
  { action: 'save', keys: ['Ctrl', 'S'], description: '保存并同步到数据库' },
  { action: 'build', keys: ['Ctrl', 'B'], description: '构建 JAR' },
  { action: 'export', keys: ['Ctrl', 'E'], description: '打开导出对话框' },
  { action: 'toggleMode', keys: ['Ctrl', '/'], description: '切换节点/代码视图' },
]

/** 格式化快捷键组合为人类可读字符串 */
export function formatShortcut(keys: string[]): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  const sep = isMac ? '' : '+'
  const mods = isMac
    ? keys.map((k) => k.replace('Ctrl', '⌘').replace('Shift', '⇧'))
    : keys
  return mods.join(sep)
}
