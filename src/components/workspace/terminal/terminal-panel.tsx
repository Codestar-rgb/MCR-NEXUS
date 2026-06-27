'use client'

/**
 * NexCube 底部终端面板（Task 1-C + Task 5-C 增强）
 *
 * 功能：
 *  - 多标签（默认 2 个："终端 1"、"构建输出"，点击 + 新增"终端 N"）
 *  - 每个标签独立 xterm 实例 + 独立命令历史 + 独立输出 buffer
 *  - 可折叠（点击 ▾/▴ 或 store.toggleTerminal）
 *  - 构建按钮组（header 右侧）：
 *      · 构建 JAR（emerald，调用 gradle-simulator 流式输出 → 切到"构建输出" tab）
 *      · 启动测试（teal，模拟 runClient 日志流）
 *      · 构建历史（zinc，弹出 Sheet 显示历史列表 + 详情）
 *      · 停止（muted，仅构建/运行中可用）
 *      · 清理（ghost，清空当前 tab）
 *  - xterm.js：黑底（#0a0a0a）绿字（#10b981）+ 12px mono + cursorBlink
 *  - mock 命令：help / clear / build / run / nodes list / echo
 *  - 输入处理：累积字符 → \r 执行；Backspace 删除；↑/↓ 历史；Ctrl+C 中断
 *
 * Task 5-C 增强：
 *  - 构建状态用 Zustand store（idle/running/success/failed）
 *  - 流式日志由 gradle-simulator 的 async generator 生成（真实 Gradle 时序）
 *  - 10% 概率随机失败（missing_dependency / compile_error / out_of_memory）
 *  - 构建完成自动调用 parseGradleLog 生成解析卡片
 *  - 构建完成 POST /api/projects/[id]/builds 持久化到 DB
 *  - 构建历史按钮 → BuildHistoryPanel（Sheet）展示历史
 *  - 进度条（基于任务步骤估算）+ 解析卡片条（success/failed 时显示）
 */

import '@xterm/xterm/css/xterm.css'

import * as React from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eraser,
  Hammer,
  History,
  Loader2,
  Play,
  Plus,
  ScrollText,
  Sparkles,
  Square,
  Terminal as TerminalIcon,
  X,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useWorkspaceStore } from '@/stores/workspace'
import { useBuildStore, type BuildTask } from '@/stores/build'
import { simulateBuild, isBuildFailed } from '@/lib/build/gradle-simulator'
import { executeFixAction } from '@/lib/build/fix-actions'
import { parseGradleLog } from '@/lib/capabilities/log-parser'
import type { ParsedLogCard } from '@/lib/capabilities/types'
import { BuildHistoryPanel } from './build-history-panel'
import { LogCardsPanel } from './log-cards-panel'
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

const WELCOME_LINE = 'NexCube Terminal v0.2.0 — 输入 help 查看可用命令'
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

/** 各任务的预估步骤数（用于进度条估算） */
const TASK_TOTAL_STEPS: Record<string, number> = {
  build: 8, // configure + 5 tasks + success + summary
  runClient: 9,
  runServer: 9,
  clean: 4,
}

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

/** 流式 chunk 转为存储用（\r\n → \n） */
function normalizeForStore(chunk: string): string {
  return chunk.replace(/\r\n/g, '\n')
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
  const activeTabId = useWorkspaceStore((s) => s.activeTerminalTab)
  const setActiveTabId = useWorkspaceStore((s) => s.setActiveTerminalTab)
  const toggleTerminal = useWorkspaceStore((s) => s.toggleTerminal)
  const currentProjectId = useWorkspaceStore((s) => s.currentProjectId)

  /* ----- build store ----- */
  const buildStatus = useBuildStore((s) => s.status)
  const buildTask = useBuildStore((s) => s.task)
  const parsedCards = useBuildStore((s) => s.parsedCards)
  const buildDuration = useBuildStore((s) => s.duration)
  const startBuild = useBuildStore((s) => s.startBuild)
  const appendOutput = useBuildStore((s) => s.appendOutput)
  const finishBuild = useBuildStore((s) => s.finishBuild)

  /* ----- query client for cache invalidation ----- */
  const queryClient = useQueryClient()

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
  /** 构建进度（0-100） */
  const [progress, setProgress] = React.useState(0)
  /** 构建历史 Sheet 开合 */
  const [historyOpen, setHistoryOpen] = React.useState(false)
  /** 解析卡片是否展开（在 build tab 显示） */
  const [cardsExpanded, setCardsExpanded] = React.useState(false)

  /** 构建中断标志 */
  const cancelFlagRef = React.useRef<boolean>(false)
  /** 当前正在迭代的 generator（用于中断） */
  const generatorRef = React.useRef<AsyncGenerator<string> | null>(null)

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
  /* 构建任务核心（流式 simulator + store + 持久化）                    */
  /* ---------------------------------------------------------------- */

  const runBuildTask = React.useCallback(
    async (task: NonNullable<BuildTask>) => {
      if (buildStatus === 'running') {
        toast.warning('已有构建正在进行中')
        return
      }
      if (!currentProjectId) {
        toast.warning('请先选择一个项目')
        return
      }
      if (!terminalOpen) toggleTerminal()

      // 切到"构建输出"tab
      if (activeTabIdRef.current !== 'build') {
        setActiveTabId('build')
        // 等待 useEffect 完成 xterm 初始化（一帧即可）
        await delay(80)
      }

      // 清空 build tab 内容
      const buildTab = tabsMap.get('build')
      if (buildTab) buildTab.buffer = ''
      if (termRef.current) termRef.current.clear()

      // 重置 store + UI
      startBuild(task)
      setProgress(0)
      setCardsExpanded(false)
      cancelFlagRef.current = false

      // 输出命令头
      writeLine(`$ ./gradlew ${task}`)
      writeLine('')

      const totalSteps = TASK_TOTAL_STEPS[task] ?? 8
      let currentStep = 0

      const gen = simulateBuild(task)
      generatorRef.current = gen

      try {
        for await (const chunk of gen) {
          if (cancelFlagRef.current) {
            writeLine('^CBuild interrupted')
            break
          }
          write(chunk)
          appendOutput(normalizeForStore(chunk))
          currentStep = Math.min(currentStep + 1, totalSteps)
          setProgress(Math.round((currentStep / totalSteps) * 95))
        }
      } catch (e) {
        writeLine(
          `Error: ${e instanceof Error ? e.message : String(e)}`,
        )
      } finally {
        generatorRef.current = null
      }

      // 读取最终输出（含失败日志）
      const storeState = useBuildStore.getState()
      const finalOutput = storeState.output
      const failed = isBuildFailed(finalOutput)
      const cards: ParsedLogCard[] = parseGradleLog(finalOutput)
      const duration = storeState.startTime
        ? Date.now() - storeState.startTime
        : 0

      // 完成构建（写入 store 历史）
      finishBuild(!failed, cards, duration)
      setProgress(100)
      // 自动展开解析卡片（如果有）
      setCardsExpanded(cards.length > 0)

      // 持久化到 DB
      try {
        const res = await fetch(
          `/api/projects/${currentProjectId}/builds`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task,
              status: failed ? 'failed' : 'success',
              output: finalOutput,
              parsedCards: cards,
              duration,
            }),
          },
        )
        if (!res.ok) {
          console.warn('Failed to persist build log:', await res.text())
        } else {
          await queryClient.invalidateQueries({
            queryKey: ['builds', currentProjectId],
          })
        }
      } catch (e) {
        console.error('Failed to persist build log:', e)
      }

      // Toast 反馈
      if (cancelFlagRef.current) {
        toast.info('构建已中断')
      } else if (failed) {
        toast.error(
          `构建失败 · ${cards.length} 个问题待解决`,
        )
      } else {
        toast.success(
          `构建成功 · 耗时 ${(duration / 1000).toFixed(1)}s`,
        )
      }
    },
    [
      buildStatus,
      currentProjectId,
      terminalOpen,
      toggleTerminal,
      setActiveTabId,
      tabsMap,
      write,
      writeLine,
      startBuild,
      appendOutput,
      finishBuild,
      queryClient,
    ],
  )

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
          await runBuildTask('build')
          break
        case 'run':
          await runBuildTask('runClient')
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
    [runBuildTask, writeLine, writePrompt, tabsMap],
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
      } else if (tab.type !== 'build') {
        // 首次打开（非 build tab）：欢迎语
        const welcome = WELCOME_LINE + '\r\n\r\n'
        term.write(welcome)
        tab.buffer = welcome
      }
    }

    // build tab 不显示 prompt（输出专用）
    if (activeTabId !== 'build') {
      writePrompt()
    }

    /* ----- onData：处理键盘输入 ----- */
    const disposable = term.onData((data) => {
      // build tab 只读，不接收输入
      if (activeTabIdRef.current === 'build') return

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
    if (activeTabId !== 'build') {
      writePrompt()
    }
    toast.success('终端已清空')
  }, [activeTabId, writePrompt, tabsMap])

  /* ---------------------------------------------------------------- */
  /* 构建按钮组 handlers                                               */
  /* ---------------------------------------------------------------- */

  const handleBuild = React.useCallback(async () => {
    await runBuildTask('build')
  }, [runBuildTask])

  const handleRun = React.useCallback(async () => {
    await runBuildTask('runClient')
  }, [runBuildTask])

  const handleStop = React.useCallback(() => {
    if (buildStatus !== 'running') return
    cancelFlagRef.current = true
    if (generatorRef.current) {
      void generatorRef.current.return(undefined).catch(() => {
        /* ignore */
      })
    }
    toast.info('已发送停止信号')
  }, [buildStatus])

  /* ---------------------------------------------------------------- */
  /* 日志卡片：修复动作处理（Task 5-A）                                 */
  /* ---------------------------------------------------------------- */

  /** 一键修复按钮回调：根据 fixAction.action 调用 executeFixAction */
  const handleFixAction = React.useCallback(
    async (card: ParsedLogCard) => {
      if (!card.fixAction) return
      const result = await executeFixAction(
        card.fixAction.action,
        { projectId: currentProjectId },
        card.fixAction.payload,
      )
      switch (result.variant) {
        case 'success':
          toast.success(result.message)
          break
        case 'error':
          toast.error(result.message)
          break
        case 'warning':
          toast.warning(result.message)
          break
        default:
          toast.info(result.message)
      }
    },
    [currentProjectId],
  )

  /** 清空所有卡片：重置 build store 的 parsedCards */
  const handleClearCards = React.useCallback(() => {
    useBuildStore.setState({ parsedCards: [] })
  }, [])

  /* ---------------------------------------------------------------- */
  /* 渲染                                                              */
  /* ---------------------------------------------------------------- */

  const isBuilding = buildStatus === 'running'
  const showCards =
    activeTabId === 'build' &&
    parsedCards.length > 0 &&
    (buildStatus === 'success' || buildStatus === 'failed')

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
                  buildStatus === 'success' &&
                    !isBuilding &&
                    'border-emerald-500/50',
                  buildStatus === 'failed' &&
                    !isBuilding &&
                    'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
                )}
              >
                {isBuilding ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : buildStatus === 'success' ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : buildStatus === 'failed' ? (
                  <XCircle className="h-3 w-3" />
                ) : (
                  <Hammer className="h-3 w-3" />
                )}
                <span className="hidden md:inline">构建 JAR</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              构建 JAR（流式 Gradle 日志）
            </TooltipContent>
          </Tooltip>

          {/* 启动测试 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={handleRun}
                disabled={isBuilding}
                aria-label="启动测试客户端"
                className={cn(
                  'h-7 gap-1 rounded-md px-2 text-[11px] font-medium shadow-none',
                  'border border-teal-500/30 bg-teal-500/15 text-teal-300',
                  'hover:bg-teal-500/25 hover:text-teal-200',
                )}
              >
                {isBuilding && buildTask === 'runClient' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                <span className="hidden md:inline">启动测试</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              启动 Minecraft 测试客户端
            </TooltipContent>
          </Tooltip>

          {/* 构建历史 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setHistoryOpen(true)}
                aria-label="构建历史"
                className={cn(
                  'h-7 w-7 rounded-md p-0',
                  'text-muted-foreground hover:bg-accent hover:text-emerald-300',
                )}
              >
                <History className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">构建历史</TooltipContent>
          </Tooltip>

          {/* 停止 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleStop}
                disabled={!isBuilding}
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

      {/* ---------- 进度条（构建中显示） ---------- */}
      {isBuilding && (
        <div className="flex h-1 shrink-0 items-center bg-zinc-900 px-0">
          <Progress
            value={progress}
            className="h-1 rounded-none bg-zinc-900 [&>[data-slot=progress-indicator]]:bg-emerald-500"
          />
        </div>
      )}

      {/* ---------- 构建状态条（构建完成显示，含耗时与解析卡片切换） ---------- */}
      {activeTabId === 'build' &&
        !isBuilding &&
        (buildStatus === 'success' || buildStatus === 'failed') &&
        buildTask && (
          <div
            className={cn(
              'flex h-7 shrink-0 items-center gap-2 border-b px-2 text-[11px]',
              buildStatus === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
                : 'border-rose-500/20 bg-rose-500/5 text-rose-300',
            )}
          >
            {buildStatus === 'success' ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            <span className="font-medium">
              {buildStatus === 'success' ? '构建成功' : '构建失败'}
            </span>
            <span className="text-muted-foreground">
              · 耗时 {(buildDuration / 1000).toFixed(1)}s
            </span>
            {parsedCards.length > 0 && (
              <button
                type="button"
                onClick={() => setCardsExpanded((v) => !v)}
                className="ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] hover:bg-zinc-800"
                aria-expanded={cardsExpanded}
              >
                <Sparkles className="h-2.5 w-2.5" />
                {parsedCards.length} 张解析卡片
                <span className="text-muted-foreground">
                  {cardsExpanded ? '▾' : '▸'}
                </span>
              </button>
            )}
          </div>
        )}

      {/* ---------- 解析卡片展开区（在 build tab 内，Task 5-A LogCardsPanel） ---------- */}
      {showCards && cardsExpanded && (
        <div className="h-[45%] max-h-[420px] min-h-[140px] shrink-0 border-b border-zinc-800/60 bg-zinc-950">
          <LogCardsPanel
            cards={parsedCards}
            onFix={handleFixAction}
            onClearAll={handleClearCards}
          />
        </div>
      )}

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

      {/* ---------- 构建历史 Sheet ---------- */}
      <BuildHistoryPanel
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        projectId={currentProjectId}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 文件结束                                                            */
/* ------------------------------------------------------------------ */
