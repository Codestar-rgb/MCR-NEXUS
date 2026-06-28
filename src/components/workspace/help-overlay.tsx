'use client'

/**
 * 帮助文档浮层
 *
 * 提供内嵌的快速上手指南和概念说明。
 * 可通过命令面板"帮助"或右上角帮助按钮打开。
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, BookOpen, Boxes, Workflow, Code2, Download,
  Lightbulb, ArrowRight, ChevronRight,
} from 'lucide-react'

interface HelpContent {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  steps?: string[]
}

const HELP_SECTIONS: HelpContent[] = [
  {
    icon: Boxes,
    title: '创建节点',
    desc: '添加自定义实体、方块、物品等模组元素',
    steps: [
      '右键画布空白处 → 选择节点类型',
      '或点击右侧工具栏"添加节点"按钮',
      '或按 Ctrl+Shift+P 打开命令面板创建',
    ],
  },
  {
    icon: Workflow,
    title: '连线建立逻辑',
    desc: '连接节点端口构建模组逻辑关系',
    steps: [
      '从节点右侧输出端口拖拽到另一节点左侧输入端口',
      '端口颜色代表数据类型（hover 查看详情）',
      '不兼容的连接会被拒绝并提示原因',
    ],
  },
  {
    icon: Code2,
    title: '查看生成代码',
    desc: '节点自动生成 Forge 1.20.1 Java 代码',
    steps: [
      '切换到"代码视图"查看所有生成的 Java 文件',
      '节点属性变化时代码实时更新',
      '代码视图支持编辑并同步回节点（AST 同步）',
    ],
  },
  {
    icon: Download,
    title: '导出模组',
    desc: '导出完整 Forge 项目 ZIP',
    steps: [
      '点击导出按钮生成 ZIP（含 build.gradle + Java 源码 + 资源）',
      '解压后运行 ./gradlew build 构建 JAR',
      '将 JAR 复制到 Minecraft mods/ 目录',
    ],
  },
]

const TIPS = [
  '按 Ctrl+P 快速搜索节点',
  '按 Ctrl+D 克隆选中节点',
  '按 ? 查看所有快捷键',
  '多选节点后可批量编辑属性',
  '右键节点可复制/粘贴属性到其他节点',
  '配方节点支持 3x3 网格编辑（crafting 类型）',
  '实体节点有 AI 行为 Tab 可视化编辑',
  '选中 2+ 节点时显示对齐工具栏',
]

export function HelpOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-[101] w-[560px] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/50 bg-popover/95 shadow-floating backdrop-blur-xl"
          >
            {/* 顶部渐变条 */}
            <div className="h-1 bg-gradient-brand" />

            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-border/30 px-5 py-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">快速上手</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 内容 */}
            <div className="nexcube-scroll overflow-y-auto p-5">
              {/* 核心流程 */}
              <div className="mb-5">
                <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  核心流程
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {HELP_SECTIONS.map((section, idx) => {
                    const Icon = section.icon
                    return (
                      <motion.div
                        key={section.title}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="rounded-lg border border-border/30 bg-card/20 p-3"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-[12px] font-semibold text-foreground">{section.title}</span>
                        </div>
                        <p className="mb-2 text-[10px] leading-relaxed text-muted-foreground">{section.desc}</p>
                        {section.steps && (
                          <ol className="space-y-1">
                            {section.steps.map((step, i) => (
                              <li key={i} className="flex gap-1.5 text-[10px] text-muted-foreground/70">
                                <span className="font-mono text-primary/60">{i + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* 使用技巧 */}
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <Lightbulb className="h-3 w-3 text-amber-400" />
                  使用技巧
                </h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {TIPS.map((tip, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 rounded border border-border/20 bg-card/10 px-2 py-1 text-[10px] text-muted-foreground"
                    >
                      <ChevronRight className="h-2.5 w-2.5 shrink-0 text-primary/50" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 底部 */}
            <div className="border-t border-border/30 px-5 py-2.5 text-center">
              <p className="text-[10px] text-muted-foreground/50">
                按 <kbd className="rounded border border-border/40 px-1 font-mono">ESC</kbd> 关闭 ·
                按 <kbd className="rounded border border-border/40 px-1 font-mono">?</kbd> 查看快捷键
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
