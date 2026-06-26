'use client'

/**
 * NexCube 底部终端面板（Task 1-C）
 *
 * 功能：
 *  - 多标签（默认 2 个："终端 1"、"构建输出"，点击 + 新增"终端 N"）
 *  - 每个标签独立 xterm 实例 + 独立命令历史 + 独立输出 buffer
 *  - 可折叠（点击 ▾/▴ 或 store.toggleTerminal）
 *      · 展开：terminalHeight（默认 192px ≈ h-48）
 *      · 折叠：仅 header（h-9 = 36px）
 *  - 构建按钮组（header 右侧）：
 *      · 构建 JAR（emerald，流式 Gradle 日志 → 切到"构建输出" tab）
 *      · 启动测试（teal，流式 MC 启动日志）
 *      · 停止（muted，仅构建/运行中可用）
 *      · 清理（ghost，清空当前 tab）
 *  - xterm.js：黑底（#0a0a0a）绿字（#10b981）+ 12px mono + cursorBlink
 *  - mock 命令：help / clear / build / run / nodes list / echo
 *  - 输入处理：累积字符 → \r 执行；Backspace 删除；↑/↓ 历史；Ctrl+C 中断
 *
 * 实现要点：
 *  - xterm 必须在 useEffect 中初始化（'use client' 组件仍会 SSR 预渲染）
 *  - 多 tab 切换时销毁旧实例、初始化新实例，并用 tab.buffer 还原显示内容
 *  - ResizeObserver 监听容器尺寸变化调用 FitAddon.fit()
 *  - 卸载时 dispose terminal + 断开 ResizeObserver
 */

import '@xterm/xterm/css/xterm.css'

import * as React from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import {
  ChevronDown,
  ChevronUp,
  Eraser,
  Hammer,
  Loader2,
  Play,
  Plus,
  ScrollText,
  Square,
  Terminal as TerminalIcon,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useWorkspaceStore } from '@/stores/workspace'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 类型与常量                                                          */
/* ------------------------------------------------------------------ */

type TabType = 'shell' | 'build'

interface TabState {
  id: string
  title: string
  type: TabType
  /** 累积输出 buffer（切换 tab 时用于 restore 显示） */
  buffer: string
  /** 命令历史（↑/↓ 切换） */
  history: string[]
}

const WELCOME_LINE = 'NexCube Terminal v0.1.0 — 输入 help 查看可用命令'
const PROMPT = '$ '
/** 终端 header 折叠态高度（h-9 = 36px），与 WorkspaceShell 中 motion.section 折叠高度对齐 */
export const TERMINAL_HEADER_HEIGHT = 36

const TERM_THEME = {
  background: '#0a0a0a',
  foreground: '#10b981',
  cursor: '#10b981',
  selectionBackground: '#10b98133',
  black: '#0a0a0a',
  green: '#10b981',
  brightGreen: '#34d399',
  white: '#e4e4e7',
  brightWhite: '#fafafa',
  yellow: '#fbbf24',
  red: '#f43f5e',
  cyan: '#22d3ee',
} as const

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

let tabSeq = 0
function nextTabId() {
  tabSeq += 1
  return `term-${Date.now().toString(36)}-${tabSeq}`
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/* ------------------------------------------------------------------ */
/* Mock 命令文本                                                       */
/* ------------------------------------------------------------------ */

const HELP_TEXT = [
  '可用命令：',
  '  help         显示此帮助信息',
  '  clear        清空当前终端',
  '  build        执行 Gradle 构建（流式输出）',
  '  run          启动 Minecraft 客户端（mock）',
  '  nodes list   列出当前工程节点',
  '  echo <text>  回显文本',
  '',
].join('\r\n')

const NODES_LIST = [
  '当前工程节点（3 个）：',
  '  \u2022 [entity] RubyGolem    nexcube:ruby_golem',
  '  \u2022 [block]  RubyBlock    nexcube:ruby_block',
  '  \u2022 [item]   Ruby         nexcube:ruby',
  '',
].join('\r\n')

const GRADLE_BUILD_LOG = [
  '> Configure project :',
  'ForgeGradle 6.0.21',
  'Loading Forge 1.20.1-47.3.7 (mapping official_1.20.1)',
  '> Task :compileJava',
  '> Task :processResources',
  '> Task :classes',
  '> Task :jar',
  '> Task :reobfJar',
  'BUILD SUCCESSFUL in 12s',
  '6 actionable tasks: 6 executed',
  '',
]

const RUN_LOG = [
  'Starting Minecraft 1.20.1 with Forge 47.3.7...',
  '[LaunchWrapper] Loading primary transform class',
  '[LaunchWrapper] Calling tweakers',
  '[FML] Forge Mod Loader version 47.3.7 for Minecraft 1.20.1 loading',
  '[FML] Java 21.0.5 detected',
  '[Client thread/INFO] Setting user: Player',
  '[Client thread/INFO] LWJGL Version: 3.3.1',
  '[Client thread/INFO] Created: 1024x1024 textures-atlas',
  '[Client thread/INFO] Stopping!',
  '',
]

/* ------------------------------------------------------------------ */
/* 默认 tab 列表（模块级常量，便于 useState / Map 共享同一份引用）       */
/* ------------------------------------------------------------------ */

const INITIAL_TABS: TabState[] = [
  {
    id: 'term-1',
    title: '终端 1',
    type: 'shell',
    buffer: '',
    history: [],
  },
  {
    id: 'build',
    title: '构建输出',
    type: 'build',
    buffer: '',
    history: [],
  },
]

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export function TerminalPanel() {
  const terminalOpen = useWorkspaceStore((s) => s.terminalOpen)
  const terminalHeight = useWorkspaceStore((s) => s.terminalHeight)
  const activeTabId = useWorkspaceStore((s) => s.activeTerminalTab)
  const setActiveTabId = useWorkspaceStore((s) => s.setActiveTerminalTab)
  const toggleTerminal = useWorkspaceStore((s) => s.toggleTerminal)

  /* ----- refs ----- */
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const termRef = React.useRef<Terminal | null>(null)
  const fitRef = React.useRef<FitAddon | null>(null)
  const roRef = React.useRef<ResizeObserver | null>(null)

  /**
   * 所有 tab 的状态（buffer / history）—— 跨 tab 切换持久化。
   * 使用 useState 懒初始化（而非 useRef）以避免在 render 阶段访问 ref.current
   * 触发 react-hooks/refs 规则。Map 引用稳定，mutate 不触发重渲染。
   */
  const [tabsMap] = React.useState<Map<string, TabState>>(
    () => new Map(INITIAL_TABS.map((t) => [t.id, t] as const)),
  )

  /** 当前输入行 */
  const inputRef = React.useRef<string>('')
  /** 历史浏览索引（-1 = 浏览到最新，未在历史中） */
  const histIdxRef = React.useRef<number>(-1)
  /** 进入历史浏览前的草稿输入 */
  const histDraftRef = React.useRef<string>('')

  /** 当前 active tab id（在 onData 回调里读取，避免闭包陈旧值） */
  const activeTabIdRef = React.useRef<string>(activeTabId)
  React.useEffect(() => {
    activeTabIdRef.current = activeTabId
  }, [activeTabId])

  /* ----- state ----- */
  const [tabsUi, setTabsUi] = React.useState<TabState[]>(INITIAL_TABS)

  const [isBuilding, setIsBuilding] = React.useState(false)
  const [isRunning, setIsRunning] = React.useState(false)
  /** 构建中断标志 */
  const cancelFlagRef = React.useRef<boolean>(false)

  /* ---------------------------------------------------------------- */
  /* 写入辅助                                                          */
  /* ---------------------------------------------------------------- */

  /** 写到当前 terminal + 当前 tab 的 buffer */
  const write = React.useCallback((text: string) => {
    const term = termRef.current
    if (term) term.write(text)
    const tab = tabsMap.get(activeTabIdRef.current)
    if (tab) tab.buffer += text
  }, [tabsMap])

  const writeLine = React.useCallback(
    (text: string) => {
      write(text + '\r\n')
    },
    [write],
  )

  const writePrompt = React.useCallback(() => {
    write(PROMPT)
  }, [write])

  /* ---------------------------------------------------------------- */
  /* 流式日志                                                          */
  /* ---------------------------------------------------------------- */

  /** 流式 Gradle 构建日志（写入当前 active tab） */
  const streamBuildLog = React.useCallback(
    async (targetTabId?: string) => {
      // 切到指定 tab（构建按钮触发时切到"构建输出"）
      if (targetTabId && targetTabId !== activeTabIdRef.current) {
        setActiveTabId(targetTabId)
        // 等待 useEffect 完成 xterm 初始化（一帧即可）
        await delay(60)
      }

      setIsBuilding(true)
      cancelFlagRef.current = false

      writeLine('')
      for (const line of GRADLE_BUILD_LOG) {
        if (cancelFlagRef.current) {
          writeLine('^CBuild interrupted')
          break
        }
        writeLine(line)
        await delay(randomBetween(400, 800))
      }

      setIsBuilding(false)
    },
    [setActiveTabId, writeLine],
  )

  /** 流式 runClient 日志 */
  const streamRunLog = React.useCallback(async () => {
    setIsRunning(true)
    cancelFlagRef.current = false

    writeLine('')
    for (const line of RUN_LOG) {
      if (cancelFlagRef.current) {
        writeLine('^CRun interrupted')
        break
      }
      writeLine(line)
      await delay(randomBetween(300, 600))
    }

    setIsRunning(false)
  }, [writeLine])

  /* ---------------------------------------------------------------- */
  /* 命令执行                                                          */
  /* ---------------------------------------------------------------- */

  const executeCommand = React.useCallback(
    async (raw: string) => {
      const cmd = raw.trim()
      const tab = tabsMap.get(activeTabIdRef.current)

      if (!cmd) {
        writePrompt()
        return
      }

      // 记录历史
      if (tab) tab.history.push(cmd)

      const [name, ...args] = cmd.split(/\s+/)

      switch (name) {
        case 'help':
          writeLine(HELP_TEXT)
          break
        case 'clear':
          if (termRef.current) termRef.current.clear()
          if (tab) tab.buffer = ''
          writePrompt()
          return
        case 'build':
          await streamBuildLog()
          break
        case 'run':
          await streamRunLog()
          break
        case 'nodes':
          if (args[0] === 'list' || !args[0]) {
            writeLine(NODES_LIST)
          } else {
            writeLine(
              `unknown subcommand: nodes ${args[0]}. Try 'nodes list'.`,
            )
          }
          break
        case 'echo':
          writeLine(args.join(' '))
          break
        default:
          writeLine(
            `command not found: ${name}. Type 'help' for available commands.`,
          )
      }
      writePrompt()
    },
    [streamBuildLog, streamRunLog, writeLine, writePrompt, tabsMap],
  )

  /* ---------------------------------------------------------------- */
  /* xterm 初始化（activeTabId / terminalOpen 变化时）                  */
  /* ---------------------------------------------------------------- */

  React.useEffect(() => {
    // 折叠状态下不持有 xterm 实例
    if (!terminalOpen) {
      if (termRef.current) {
        termRef.current.dispose()
        termRef.current = null
        fitRef.current = null
      }
      if (roRef.current) {
        roRef.current.disconnect()
        roRef.current = null
      }
      return
    }

    const container = containerRef.current
    if (!container) return

    // 销毁旧实例
    if (termRef.current) {
      termRef.current.dispose()
      termRef.current = null
      fitRef.current = null
    }

    // 重置输入态
    inputRef.current = ''
    histIdxRef.current = -1
    histDraftRef.current = ''

    const term = new Terminal({
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 12,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'bar',
      allowProposedApi: true,
      theme: TERM_THEME,
      scrollback: 1000,
      convertEol: false,
      disableStdin: false,
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(container)

    termRef.current = term
    fitRef.current = fitAddon

    // 还原 buffer
    const tab = tabsMap.get(activeTabId)
    if (tab) {
      if (tab.buffer) {
        term.write(tab.buffer)
      } else {
        // 首次打开：欢迎语
        const welcome = WELCOME_LINE + '\r\n\r\n'
        term.write(welcome)
        tab.buffer = welcome
      }
    }

    writePrompt()

    /* ----- onData：处理键盘输入 ----- */
    const disposable = term.onData((data) => {
      if (data === '\r') {
        // Enter
        term.write('\r\n')
        const cmd = inputRef.current
        inputRef.current = ''
        histIdxRef.current = -1
        histDraftRef.current = ''
        void executeCommand(cmd)
      } else if (data === '\u007F') {
        // Backspace
        if (inputRef.current.length > 0) {
          inputRef.current = inputRef.current.slice(0, -1)
          term.write('\b \b')
        }
      } else if (data === '\u0003') {
        // Ctrl+C
        term.write('^C\r\n')
        inputRef.current = ''
        histIdxRef.current = -1
        histDraftRef.current = ''
        writePrompt()
      } else if (data === '\u001b[A') {
        // ↑ 历史上一条
        const t = tabsMap.get(activeTabIdRef.current)
        if (t && t.history.length > 0) {
          if (histIdxRef.current === -1) {
            histIdxRef.current = t.history.length - 1
            histDraftRef.current = inputRef.current
          } else if (histIdxRef.current > 0) {
            histIdxRef.current -= 1
          }
          const hist = t.history[histIdxRef.current]
          // 清空当前输入行
          const len = inputRef.current.length
          for (let i = 0; i < len; i++) term.write('\b \b')
          inputRef.current = hist
          term.write(hist)
        }
      } else if (data === '\u001b[B') {
        // ↓ 历史下一条
        const t = tabsMap.get(activeTabIdRef.current)
        if (t && t.history.length > 0 && histIdxRef.current !== -1) {
          if (histIdxRef.current < t.history.length - 1) {
            histIdxRef.current += 1
            const hist = t.history[histIdxRef.current]
            const len = inputRef.current.length
            for (let i = 0; i < len; i++) term.write('\b \b')
            inputRef.current = hist
            term.write(hist)
          } else {
            // 回到 draft
            histIdxRef.current = -1
            const len = inputRef.current.length
            for (let i = 0; i < len; i++) term.write('\b \b')
            inputRef.current = histDraftRef.current
            term.write(histDraftRef.current)
          }
        }
      } else if (data === '\u001b[C' || data === '\u001b[D') {
        // 左/右箭头：暂不支持光标移动，忽略
      } else if (data.charCodeAt(0) >= 32) {
        // 可见字符
        inputRef.current += data
        term.write(data)
      }
    })

    /* ----- fit + ResizeObserver ----- */
    const doFit = () => {
      if (fitRef.current && termRef.current && container.clientHeight > 0) {
        try {
          fitRef.current.fit()
        } catch {
          /* 容器未可见时忽略 */
        }
      }
    }
    doFit()

    const ro = new ResizeObserver(() => doFit())
    ro.observe(container)
    roRef.current = ro

    // focus
    setTimeout(() => term.focus(), 50)

    return () => {
      disposable.dispose()
      ro.disconnect()
      roRef.current = null
      term.dispose()
      if (termRef.current === term) {
        termRef.current = null
        fitRef.current = null
      }
    }
  }, [activeTabId, terminalOpen, executeCommand, writePrompt, tabsMap])

  /* ---------------------------------------------------------------- */
  /* tab 操作                                                          */
  /* ---------------------------------------------------------------- */

  const handleAddTab = React.useCallback(() => {
    const id = nextTabId()
    const num = tabsUi.filter((t) => t.type === 'shell').length + 1
    const newTab: TabState = {
      id,
      title: `终端 ${num}`,
      type: 'shell',
      buffer: '',
      history: [],
    }
    tabsMap.set(id, newTab)
    setTabsUi((prev) => [...prev, newTab])
    setActiveTabId(id)
  }, [setActiveTabId, tabsUi, tabsMap])

  const handleCloseTab = React.useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      if (id === 'build') {
        toast.warning('构建输出标签不可关闭')
        return
      }
      if (tabsUi.length <= 1) {
        toast.warning('至少保留一个终端标签')
        return
      }
      tabsMap.delete(id)
      setTabsUi((prev) => {
        const next = prev.filter((t) => t.id !== id)
        // 如果关的是当前激活 tab，切到第一个
        if (activeTabId === id && next.length > 0) {
          setActiveTabId(next[0].id)
        }
        return next
      })
    },
    [activeTabId, setActiveTabId, tabsUi.length, tabsMap],
  )

  const handleClearCurrent = React.useCallback(() => {
    const tab = tabsMap.get(activeTabId)
    if (tab) tab.buffer = ''
    if (termRef.current) {
      termRef.current.clear()
    }
    writePrompt()
    toast.success('终端已清空')
  }, [activeTabId, writePrompt, tabsMap])

  /* ---------------------------------------------------------------- */
  /* 构建按钮组 handlers                                               */
  /* ---------------------------------------------------------------- */

  const handleBuild = React.useCallback(async () => {
    if (isBuilding) return
    if (!terminalOpen) toggleTerminal()
    // 切到"构建输出"标签，并流式输出
    await streamBuildLog('build')
  }, [isBuilding, terminalOpen, toggleTerminal, streamBuildLog])

  const handleRun = React.useCallback(async () => {
    if (isRunning) return
    if (!terminalOpen) toggleTerminal()
    await streamRunLog()
  }, [isRunning, terminalOpen, toggleTerminal, streamRunLog])

  const handleStop = React.useCallback(() => {
    if (!isBuilding && !isRunning) return
    cancelFlagRef.current = true
    toast.info('已发送停止信号')
  }, [isBuilding, isRunning])

  /* ---------------------------------------------------------------- */
  /* 渲染                                                              */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950">
      {/* ---------- Header：tab strip + action buttons ---------- */}
      <header
        className={cn(
          'flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border/60',
          'bg-zinc-900/80 pl-2 pr-1.5 backdrop-blur-sm',
        )}
        role="toolbar"
        aria-label="终端工具栏"
      >
        {/* tab strip */}
        <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto nexcube-scroll">
          {tabsUi.map((tab) => {
            const active = tab.id === activeTabId
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  'group flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5',
                  'text-[11px] font-medium transition-colors',
                  active
                    ? 'bg-emerald-500/15 text-emerald-300 shadow-[inset_0_0_0_1px_theme(colors.emerald.500/30)]'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
                aria-pressed={active}
                aria-label={tab.title}
              >
                {tab.type === 'build' ? (
                  <ScrollText className="h-3 w-3 shrink-0" />
                ) : (
                  <TerminalIcon className="h-3 w-3 shrink-0" />
                )}
                <span className="truncate">{tab.title}</span>
                {tab.type !== 'build' && (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className={cn(
                      'ml-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm',
                      'opacity-0 transition-opacity',
                      'hover:bg-rose-500/20 hover:text-rose-300',
                      'group-hover:opacity-60',
                    )}
                    aria-label={`关闭 ${tab.title}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </span>
                )}
              </button>
            )
          })}

          {/* + 新增 tab */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleAddTab}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                  'text-muted-foreground hover:bg-accent hover:text-emerald-300',
                )}
                aria-label="新建终端标签"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">新建终端</TooltipContent>
          </Tooltip>
        </div>

        {/* action buttons */}
        <div className="flex shrink-0 items-center gap-1">
          {/* 构建 JAR */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={handleBuild}
                disabled={isBuilding}
                aria-label="构建 JAR"
                className={cn(
                  'h-7 gap-1 rounded-md px-2 text-[11px] font-medium shadow-none',
                  'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
                  'hover:bg-emerald-500/25 hover:text-emerald-200',
                )}
              >
                {isBuilding ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Hammer className="h-3 w-3" />
                )}
                <span className="hidden md:inline">构建 JAR</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">构建 JAR（流式 Gradle 日志）</TooltipContent>
          </Tooltip>

          {/* 启动测试 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={handleRun}
                disabled={isRunning}
                aria-label="启动测试客户端"
                className={cn(
                  'h-7 gap-1 rounded-md px-2 text-[11px] font-medium shadow-none',
                  'border border-teal-500/30 bg-teal-500/15 text-teal-300',
                  'hover:bg-teal-500/25 hover:text-teal-200',
                )}
              >
                {isRunning ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                <span className="hidden md:inline">启动测试</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">启动 Minecraft 测试客户端</TooltipContent>
          </Tooltip>

          {/* 停止 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleStop}
                disabled={!isBuilding && !isRunning}
                aria-label="停止运行"
                className={cn(
                  'h-7 w-7 rounded-md p-0 text-[11px] font-medium',
                  'text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300',
                )}
              >
                <Square className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">停止构建 / 运行</TooltipContent>
          </Tooltip>

          {/* 清理 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearCurrent}
                aria-label="清空当前终端"
                className={cn(
                  'h-7 w-7 rounded-md p-0 text-[11px] font-medium',
                  'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Eraser className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">清空当前终端</TooltipContent>
          </Tooltip>

          {/* 折叠 / 展开 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleTerminal}
                aria-label={terminalOpen ? '折叠终端' : '展开终端'}
                aria-pressed={!terminalOpen}
                className={cn(
                  'h-7 w-7 rounded-md p-0',
                  'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {terminalOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {terminalOpen ? '折叠终端' : '展开终端'}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* ---------- Body：xterm 挂载点（仅展开时可见） ---------- */}
      {terminalOpen && (
        <div
          ref={containerRef}
          className={cn(
            'relative min-h-0 flex-1 overflow-hidden bg-zinc-950',
            'px-2 py-1',
          )}
          aria-label="xterm 终端输出区"
          // 防止父容器 overflow hidden 时 xterm 计算异常
          style={{ contain: 'strict' }}
        />
      )}
    </div>
  )
}
