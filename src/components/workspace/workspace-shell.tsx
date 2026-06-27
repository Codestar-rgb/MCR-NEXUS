'use client'

/**
 * NexCube 工作区外壳层（阶段 1-A → 1-C 整合 · Task 6-C 响应式优化）
 *
 * 布局结构（桌面端）：
 *
 *   ┌───────────────────────────────────────────────────────┐
 *   │ 顶部仪表盘 (TopDashboard)                              │  h-14
 *   ├───────┬─────────────────────────────────┬─────────────┤
 *   │ 工程   │                                  │             │
 *   │ 树     │   节点画布 / 代码编辑器            │  属性面板    │
 *   │       │   (中间内容区)                     │             │
 *   │ w-64  │   [工程卡片]      [任务提示区]      │  w-80       │
 *   │       │                                  │             │
 *   │       │                    [小地图]        │             │
 *   ├───────┴─────────────────────────────────┴─────────────┤
 *   │ 底部终端 (TerminalPanel · 可折叠)                       │  h-48 / h-9
 *   └───────────────────────────────────────────────────────┘
 *                                       [右边缘工具栏] w-12
 *
 * Task 6-C 响应式三档：
 *  - mobile  (< 768px)  : 隐藏左/右栏，改为 Sheet 抽屉；终端默认折叠；工具栏图标变小
 *  - tablet  (768-1024) : 左栏可折叠；右栏固定 280px；工具栏常规
 *  - desktop (> 1024px) : 完整布局
 *
 * 整合情况：
 *  - 顶部：TopDashboard（Task 1-A）
 *  - 左侧：FileTreePanel（inline 桌面 / Sheet 抽屉移动）
 *  - 中间：NodeCanvasPlaceholder（Task 1-D）/ CodeEditorPanel（Task 2-E）
 *  - 右侧：PropertyPanel（inline 桌面 / Sheet 抽屉移动）
 *  - 底部：TerminalPanel（Task 1-C，xterm.js 多标签可折叠）
 *  - 右边缘：EdgeToolbar（Task 1-C，模式切换 + 工具 + 系统，始终全高）
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { TopDashboard } from '@/components/workspace/top-dashboard'
import { WorkspacePanel } from '@/components/workspace/workspace-panel'
import { GlobalSearch } from '@/components/workspace/global-search'
import { StatusBar } from '@/components/workspace/status-bar'
import { CodePreviewPanel } from '@/components/workspace/code-preview-panel'
import { NodeCanvasPlaceholder } from '@/components/workspace/canvas/node-canvas-placeholder'
import { CodeEditorPanel } from '@/components/workspace/code-editor/code-editor-panel'
import { PropertyPanel } from '@/components/workspace/property-panel/property-panel'
import {
  TerminalPanel,
  TERMINAL_HEADER_HEIGHT,
} from '@/components/workspace/terminal/terminal-panel'
import { EdgeToolbar } from '@/components/workspace/edge-toolbar'
import {
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useWorkspaceStore } from '@/stores/workspace'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* 常量                                                                */
/* ------------------------------------------------------------------ */

/** 平板端右栏固定宽度（px） */
const TABLET_RIGHT_PANEL_WIDTH = 280
/** 平板端左栏固定宽度（px） */
const TABLET_LEFT_SIDEBAR_WIDTH = 220

/* ------------------------------------------------------------------ */
/* 主组件                                                              */
/* ------------------------------------------------------------------ */

export function WorkspaceShell() {
  const mode = useWorkspaceStore((s) => s.mode)
  const leftSidebarOpen = useWorkspaceStore((s) => s.leftSidebarOpen)
  const leftSidebarWidth = useWorkspaceStore((s) => s.leftSidebarWidth)
  const rightPanelOpen = useWorkspaceStore((s) => s.rightPanelOpen)
  const rightPanelWidth = useWorkspaceStore((s) => s.rightPanelWidth)
  const terminalOpen = useWorkspaceStore((s) => s.terminalOpen)
  const terminalHeight = useWorkspaceStore((s) => s.terminalHeight)
  const setTerminalHeight = useWorkspaceStore((s) => s.setTerminalHeight)
  const toggleTerminal = useWorkspaceStore((s) => s.toggleTerminal)

  /* 全局搜索（Ctrl+P） */
  const [searchOpen, setSearchOpen] = React.useState(false)

  /* 代码预览面板（仅节点模式显示） */
  const setMode = useWorkspaceStore((s) => s.setMode)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const breakpoint = useBreakpoint()
  const isMobile = breakpoint === 'mobile'
  const isTablet = breakpoint === 'tablet'

  /* 移动端：终端默认折叠（首次进入工作区时强制折叠，避免占用过多空间）
   * 仅在断点切换到 mobile 时触发一次，桌面回到 mobile 不会反复触发 */
  const prevBreakpointRef = React.useRef(breakpoint)
  React.useEffect(() => {
    const prev = prevBreakpointRef.current
    if (prev !== 'mobile' && breakpoint === 'mobile') {
      // 进入移动端：如果终端是打开的，折叠它（但保留高度供下次展开）
      if (useWorkspaceStore.getState().terminalOpen) {
        toggleTerminal()
      }
    }
    prevBreakpointRef.current = breakpoint
  }, [breakpoint, toggleTerminal])

  /* 平板端：限制终端最大高度（避免压扁画布） */
  const effectiveTerminalHeight = isTablet
    ? Math.min(terminalHeight, 180)
    : terminalHeight

  /* 平板端：强制更窄的左右栏宽度 */
  const effectiveLeftWidth = isTablet
    ? TABLET_LEFT_SIDEBAR_WIDTH
    : leftSidebarWidth
  const effectiveRightWidth = isTablet
    ? TABLET_RIGHT_PANEL_WIDTH
    : rightPanelWidth

  /* 移动端：限制终端高度为视口 30%（避免占据全屏） */
  React.useEffect(() => {
    if (isMobile && terminalOpen) {
      const maxHeight = Math.floor(window.innerHeight * 0.35)
      if (terminalHeight > maxHeight) {
        setTerminalHeight(Math.max(120, maxHeight))
      }
    }
  }, [isMobile, terminalOpen, terminalHeight, setTerminalHeight])

  /* 桌面/平板：inline 渲染左右栏
   * 移动端：转为 Sheet 抽屉（不 inline 渲染） */
  const renderInlineLeftSidebar = !isMobile
  const renderInlineRightPanel = !isMobile

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
        {/* 顶部仪表盘 */}
        <TopDashboard />

        {/* 主体：[左+中+右 + 终端] + 右边缘工具栏 */}
        <div className="flex min-h-0 flex-1">
          {/* 左+中+右 + 终端 的垂直容器（终端全宽于左侧三栏） */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* 上半部分：左文件树 + 中画布 + 右属性面板 */}
            <div className="flex min-h-0 flex-1">
              {/* 左侧文件树（桌面/平板 inline，移动端走 Sheet） */}
              {renderInlineLeftSidebar ? (
                <AnimatePresence initial={false}>
                  {leftSidebarOpen ? (
                    <motion.aside
                      key="left-sidebar"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: effectiveLeftWidth, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="shrink-0 overflow-hidden border-r border-border bg-sidebar/30"
                      aria-label="工程文件树"
                    >
                      <WorkspacePanel className="h-full border-0" />
                    </motion.aside>
                  ) : null}
                </AnimatePresence>
              ) : null}

              {/* 中间内容区（节点画布 / 代码编辑器）+ 浮层（工程卡片、任务提示、小地图） */}
              <main className="relative flex min-w-0 flex-1 flex-col">
                <div className="relative min-h-0 flex-1">
                  <AnimatePresence mode="wait">
                    {mode === 'node' ? (
                      <motion.div
                        key="node-canvas"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0"
                      >
                        {/* 节点画布 + 代码预览侧栏 */}
                        <div className="flex h-full">
                          <div className="min-w-0 flex-1">
                            <NodeCanvasPlaceholder />
                          </div>
                          {/* 实时代码预览（仅桌面端） */}
                          {breakpoint !== 'mobile' && (
                            <CodePreviewPanel onExpand={() => setMode('code')} />
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="code-editor"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0"
                      >
                        <CodeEditorPanel className="h-full" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </main>

              {/* 右侧属性面板（桌面/平板 inline，移动端走 Sheet） */}
              {renderInlineRightPanel ? (
                <AnimatePresence initial={false}>
                  {rightPanelOpen ? (
                    <motion.aside
                      key="right-panel"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: effectiveRightWidth, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="shrink-0 overflow-hidden border-l border-border bg-sidebar/30"
                      aria-label="属性面板"
                    >
                      {/* Task 1-D 属性面板（动态标题 + Tabs + 拖拽贴图区） */}
                      <PropertyPanel />
                    </motion.aside>
                  ) : null}
                </AnimatePresence>
              ) : null}
            </div>

            {/* 下半部分：底部终端（全宽于左+中+右三栏，可折叠） */}
            <motion.section
              key="terminal"
              initial={false}
              animate={{
                height: terminalOpen ? effectiveTerminalHeight : TERMINAL_HEADER_HEIGHT,
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="shrink-0 overflow-hidden border-t border-border bg-background"
              aria-label="终端面板"
            >
              {/* Task 1-C 终端面板（xterm.js 多标签 + 构建按钮组 + mock 命令） */}
              <TerminalPanel />
            </motion.section>
          </div>

          {/* 右边缘工具栏（Task 1-C，模式切换 + 视图控制 + 工具 + 系统，始终全高） */}
          <EdgeToolbar />
        </div>

        {/* 移动端抽屉：左侧文件树 */}
        <Sheet
          open={isMobile && leftSidebarOpen}
          onOpenChange={(open) => {
            if (!open) {
              useWorkspaceStore.getState().toggleLeftSidebar()
            }
          }}
        >
          <SheetContent
            side="left"
            className="w-[85vw] max-w-sm p-0 sm:max-w-sm"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>工程文件树</SheetTitle>
              <SheetDescription>项目文件与目录结构</SheetDescription>
            </SheetHeader>
            <WorkspacePanel className="h-full border-0" />
          </SheetContent>
        </Sheet>

        {/* 移动端抽屉：右侧属性面板（底部抽屉） */}
        <Sheet
          open={isMobile && rightPanelOpen}
          onOpenChange={(open) => {
            if (!open) {
              useWorkspaceStore.getState().toggleRightPanel()
            }
          }}
        >
          <SheetContent
            side="bottom"
            className="h-[60vh] max-h-[480px] rounded-t-xl p-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>属性面板</SheetTitle>
              <SheetDescription>节点属性编辑</SheetDescription>
            </SheetHeader>
            <PropertyPanel />
          </SheetContent>
        </Sheet>
      </div>

      {/* 底部状态栏 */}
      <StatusBar />

      {/* 全局搜索（Ctrl+P） */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </TooltipProvider>
  )
}

/* ------------------------------------------------------------------ */
/* 子组件：占位面板                                                    */
/* ------------------------------------------------------------------ */

interface PanelPlaceholderProps {
  title: string
  hint: string
  taskId: string
  icon: React.ReactNode
  className?: string
}

function PanelPlaceholder({
  title,
  hint,
  taskId,
  icon,
  className,
}: PanelPlaceholderProps) {
  return (
    <div className={cn('relative h-full w-full', className)}>
      {/* 主体占位 */}
      <div
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-3',
          'border-2 border-dashed border-border/60 bg-muted/5 p-6 text-center',
        )}
      >
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            'border border-emerald-500/20 bg-emerald-500/5 text-emerald-400/80',
          )}
          aria-hidden
        >
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{hint}</p>
          <p className="text-[10px] text-muted-foreground/60">
            待 <span className="text-emerald-400/80">{taskId}</span> 实现
          </p>
        </div>
      </div>
    </div>
  )
}
