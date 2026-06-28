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
  Lightbulb, ArrowRight, ChevronRight, AlertTriangle,
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
              <div className="mb-5">
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

              {/* FAQ */}
              <div className="mb-5">
                <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <BookOpen className="h-3 w-3 text-primary" />
                  常见问题
                </h3>
                <div className="space-y-2">
                  <FAQItem
                    q="如何创建自定义实体？"
                    a="添加实体节点 → 右侧属性面板编辑生命值/攻击力/AI 类型/碰撞箱 → 切换到 AI Tab 选择行为模板 → 切换到碰撞箱 Tab 调整大小"
                  />
                  <FAQItem
                    q="如何连接两个节点？"
                    a="从节点右侧输出端口拖拽到另一节点左侧输入端口。端口颜色需兼容（hover 端口查看兼容类型）。不兼容的连接会被拒绝并提示原因。"
                  />
                  <FAQItem
                    q="如何导出模组？"
                    a="点击导出按钮 → 生成 ZIP（含 build.gradle + Java + 资源文件）→ 解压 → 运行 ./gradlew build 构建 JAR → 复制到 mods/ 目录"
                  />
                  <FAQItem
                    q="如何使用节点组？"
                    a="选中多个节点 → 右键'打包为节点组' → 拖拽节点进出组区域自动添加/移除 → 选中组后在'组成员'Tab 管理成员"
                  />
                  <FAQItem
                    q="如何编辑配方？"
                    a="添加配方节点 → 选择配方类型（合成/熔炉/切石）→ 合成类型显示 3x3 网格编辑器 → 熔炉类型显示输入→火焰→产物预览 → 可从画布拖物品节点到网格"
                  />
                </div>
              </div>

              {/* 节点类型详解 */}
              <div className="mb-5">
                <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <Boxes className="h-3 w-3 text-primary" />
                  节点类型详解
                </h3>
                <div className="space-y-1.5">
                  <NodeTypeDesc name="实体" desc="自定义生物，支持 AI 目标/碰撞箱/属性/掉落/生怪蛋" color="text-rose-300" />
                  <NodeTypeDesc name="方块" desc="自定义方块，支持硬度/发光/BlockState 属性/掉落" color="text-amber-300" />
                  <NodeTypeDesc name="物品/装备/武器/食物" desc="自定义物品，Tier/ArmorMaterial/FoodProperties" color="text-teal-300" />
                  <NodeTypeDesc name="群系/结构/维度" desc="世界生成元素，数据包 JSON 格式" color="text-emerald-300" />
                  <NodeTypeDesc name="附魔" desc="自定义附魔，适用物品限制/冲突检查" color="text-violet-300" />
                  <NodeTypeDesc name="成就" desc="自定义进度，6 种触发/成就树" color="text-amber-300" />
                  <NodeTypeDesc name="配方" desc="合成/熔炉/切石，3x3 网格编辑器" color="text-orange-300" />
                </div>
              </div>

              {/* 导出结构 */}
              <div className="mb-5">
                <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <Download className="h-3 w-3 text-primary" />
                  导出结构说明
                </h3>
                <div className="rounded-lg border border-border/20 bg-card/10 p-3 font-mono text-[9px] leading-relaxed text-muted-foreground">
                  <div>mod.zip/</div>
                  <div className="pl-3">├── build.gradle <span className="text-muted-foreground/40">{'// Gradle 构建'}</span></div>
                  <div className="pl-3">├── gradle.properties</div>
                  <div className="pl-3">├── src/main/java/</div>
                  <div className="pl-6">├── ExampleMod.java <span className="text-muted-foreground/40">{'// 主类'}</span></div>
                  <div className="pl-6">├── item/ModItems.java <span className="text-muted-foreground/40">{'// 物品注册'}</span></div>
                  <div className="pl-6">├── block/ModBlocks.java <span className="text-muted-foreground/40">{'// 方块注册'}</span></div>
                  <div className="pl-6">├── entity/ModEntities.java <span className="text-muted-foreground/40">{'// 实体注册'}</span></div>
                  <div className="pl-6">├── enchantment/ <span className="text-muted-foreground/40">{'// 附魔'}</span></div>
                  <div className="pl-6">├── event/ModEventHandlers.java</div>
                  <div className="pl-3">├── src/main/resources/</div>
                  <div className="pl-6">├── data/ <span className="text-muted-foreground/40">{'// 数据包'}</span></div>
                  <div className="pl-9">├── recipes/ <span className="text-muted-foreground/40">{'// 配方'}</span></div>
                  <div className="pl-9">├── loot_tables/ <span className="text-muted-foreground/40">{'// 掉落'}</span></div>
                  <div className="pl-9">├── advancements/ <span className="text-muted-foreground/40">{'// 成就'}</span></div>
                  <div className="pl-9">├── tags/ <span className="text-muted-foreground/40">{'// 标签'}</span></div>
                  <div className="pl-6">├── assets/ <span className="text-muted-foreground/40">{'// 资源'}</span></div>
                  <div className="pl-9">├── lang/ <span className="text-muted-foreground/40">{'// 语言'}</span></div>
                  <div className="pl-9">├── textures/ <span className="text-muted-foreground/40">{'// 贴图'}</span></div>
                </div>
              </div>

              {/* 进阶技巧 */}
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <Lightbulb className="h-3 w-3 text-amber-400" />
                  进阶技巧
                </h3>
                <div className="space-y-1.5">
                  <div className="rounded border border-border/20 bg-card/10 px-2.5 py-1.5 text-[10px]">
                    <span className="font-medium text-primary">版本历史</span>
                    <span className="text-muted-foreground"> → Ctrl+H 保存快照，可回滚到任意版本</span>
                  </div>
                  <div className="rounded border border-border/20 bg-card/10 px-2.5 py-1.5 text-[10px]">
                    <span className="font-medium text-primary">复制/粘贴属性</span>
                    <span className="text-muted-foreground"> → 右键节点 → 复制属性 → 右键另一节点 → 粘贴</span>
                  </div>
                  <div className="rounded border border-border/20 bg-card/10 px-2.5 py-1.5 text-[10px]">
                    <span className="font-medium text-primary">MC 原版贴图</span>
                    <span className="text-muted-foreground"> → 贴图字段点击 'MC贴图' 选择原版物品图标</span>
                  </div>
                  <div className="rounded border border-border/20 bg-card/10 px-2.5 py-1.5 text-[10px]">
                    <span className="font-medium text-primary">插件系统</span>
                    <span className="text-muted-foreground"> → 设置 → 插件 Tab 查看已加载插件</span>
                  </div>
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

/** FAQ 条目（可展开/折叠） */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="rounded-lg border border-border/20 bg-card/10 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-card/20"
      >
        <ChevronRight className={`h-3 w-3 shrink-0 text-primary/50 transition-transform ${open ? 'rotate-90' : ''}`} />
        <span className="text-[11px] font-medium text-foreground">{q}</span>
      </button>
      {open && (
        <div className="px-2.5 pb-2 pl-7">
          <p className="text-[10px] leading-relaxed text-muted-foreground">{a}</p>
        </div>
      )}
    </div>
  )
}

/** 节点类型描述行 */
function NodeTypeDesc({ name, desc, color }: { name: string; desc: string; color: string }) {
  return (
    <div className="flex items-start gap-2 rounded border border-border/20 bg-card/10 px-2.5 py-1.5">
      <span className={`shrink-0 text-[10px] font-bold ${color}`}>{name}</span>
      <span className="text-[10px] leading-relaxed text-muted-foreground">{desc}</span>
    </div>
  )
}
