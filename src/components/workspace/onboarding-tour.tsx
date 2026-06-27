'use client'

/**
 * 新手引导浮层
 *
 * 首次进入工作区时显示 3 步引导，帮助新用户理解核心流程：
 *  1. 添加节点（右键/工具栏）
 *  2. 连线（拖拽端口）
 *  3. 查看代码（切换代码视图）
 *
 * 用 localStorage 标记已看过，不重复显示。
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Workflow, Code2, X, ChevronRight } from 'lucide-react'

const STORAGE_KEY = 'nexcube:onboarding-completed'

const STEPS = [
  {
    icon: Plus,
    title: '添加节点',
    desc: '右键画布空白处，或点击右侧工具栏的"添加节点"按钮，选择节点类型创建。',
    color: 'text-teal-400',
  },
  {
    icon: Workflow,
    title: '连线建立逻辑',
    desc: '从节点的输出端口拖拽到另一个节点的输入端口，端口颜色代表数据类型。不兼容的连接会被拒绝并提示原因。',
    color: 'text-cyan-400',
  },
  {
    icon: Code2,
    title: '查看生成代码',
    desc: '切换到"代码视图"查看自动生成的 Java 代码，或点击右侧属性面板的代码预览。节点属性变化时代码实时更新。',
    color: 'text-violet-400',
  },
] as const

export function OnboardingTour() {
  const [visible, setVisible] = React.useState(false)
  const [step, setStep] = React.useState(0)

  React.useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY)
      if (!done) {
        // 延迟显示，等画布加载完成
        const t = setTimeout(() => setVisible(true), 1500)
        return () => clearTimeout(t)
      }
    } catch {
      // localStorage 不可用时跳过
    }
  }, [])

  const handleDismiss = React.useCallback(() => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
  }, [])

  const handleNext = React.useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      handleDismiss()
    }
  }, [step, handleDismiss])

  const current = STEPS[step]
  const Icon = current.icon

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* 引导卡片 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-[101] w-[400px] -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-popover/95 shadow-floating backdrop-blur-xl">
              {/* 顶部渐变条 */}
              <div className="h-1 bg-gradient-brand" />

              {/* 关闭按钮 */}
              <button
                onClick={handleDismiss}
                className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="关闭引导"
              >
                <X className="h-4 w-4" />
              </button>

              {/* 步骤内容 */}
              <div className="p-6">
                {/* 步骤指示器 */}
                <div className="mb-5 flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === step
                          ? 'w-8 bg-primary'
                          : i < step
                            ? 'w-4 bg-primary/40'
                            : 'w-4 bg-muted/50'
                      }`}
                    />
                  ))}
                </div>

                {/* 图标 */}
                <div className="mb-4 flex justify-center">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 ${current.color}`}>
                    <Icon className="h-8 w-8" strokeWidth={1.5} />
                  </div>
                </div>

                {/* 标题 + 描述 */}
                <div className="text-center">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    第 {step + 1} 步 / 共 {STEPS.length} 步
                  </p>
                  <h3 className="text-lg font-bold text-foreground">{current.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {current.desc}
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="mt-5 flex items-center justify-between">
                  <button
                    onClick={handleDismiss}
                    className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground"
                  >
                    跳过引导
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-brand px-4 py-2 text-[12px] font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
                  >
                    {step < STEPS.length - 1 ? '下一步' : '开始使用'}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
