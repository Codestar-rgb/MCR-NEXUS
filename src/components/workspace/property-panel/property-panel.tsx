'use client'

/**
 * 右侧属性面板（阶段 3 完整版）
 *
 * - 顶部 header：动态标题（根据选中节点类型切换）
 * - Tabs：[基础属性] [行为逻辑]
 *   - 基础属性：PropertyForm（Schema 驱动真实表单 + 实时同步）
 *   - 行为逻辑：SubgraphEditor（嵌套 React Flow 画布）
 *     - 仅当节点 supportsSubLogic=true 时显示 Tab
 * - 没选中节点时：空状态插画
 * - 底部：贴图纹理拖拽上传区（TextureField 已在 PropertyForm 内，此处保留快捷入口）
 */

import { useCallback, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { MousePointerClick } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspace'
import { useCanvasStore } from '@/stores/canvas'
import { getNodeTypeDefinition } from '@/lib/node-system'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { PropertyForm } from './property-form'
import {
  SubgraphEditor,
  SubgraphEditorEmpty,
} from '@/components/workspace/property-panel/subgraph-editor'

const TYPE_LABEL: Record<string, string> = {
  entity: '实体属性',
  block: '方块属性',
  item: '物品属性',
  group: '节点组属性',
  blackbox: '黑盒代码',
  function: '函数节点',
}

const TYPE_COLOR: Record<string, string> = {
  entity: 'text-rose-300',
  block: 'text-amber-300',
  item: 'text-teal-300',
  group: 'text-slate-300',
  blackbox: 'text-zinc-300',
  function: 'text-cyan-300',
}

export function PropertyPanel() {
  const width = useWorkspaceStore((s) => s.rightPanelWidth)
  const selectedNodeId = useWorkspaceStore((s) => s.selectedNodeId)
  const selectedNodeName = useWorkspaceStore((s) => s.selectedNodeName)
  const setSelectedNode = useWorkspaceStore((s) => s.setSelectedNode)

  const nodes = useCanvasStore((s) => s.nodes)
  const updateNode = useCanvasStore((s) => s.updateNode)

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null),
    [nodes, selectedNodeId],
  )

  const nodeDef = useMemo(() => {
    if (!selectedNode) return null
    return getNodeTypeDefinition(selectedNode.data.kind) ?? null
  }, [selectedNode])

  const hasSelection = !!selectedNode
  const kind = selectedNode?.data.kind ?? ''
  const typeLabel = TYPE_LABEL[kind] ?? '节点属性'
  const typeColor = TYPE_COLOR[kind] ?? 'text-foreground'
  const supportsSubLogic = nodeDef?.supportsSubLogic === true

  const headerTitle = hasSelection
    ? `${typeLabel} - ${selectedNodeName ?? selectedNode.data.title}`
    : '属性面板'

  const defaultTab = supportsSubLogic ? 'behavior' : 'basic'

  // 属性变更：立即更新 store + debounce 持久化
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handlePropertyChange = useCallback(
    (key: string, value: unknown) => {
      if (!selectedNode) return
      const newProperties = { ...selectedNode.data.properties, [key]: value }
      // 立即更新 canvas store（UI 即时反馈）
      updateNode(selectedNode.id, {
        data: { ...selectedNode.data, properties: newProperties },
      })
      // 如果改的是 name 字段，同步更新 title
      if (key === 'name') {
        updateNode(selectedNode.id, {
          data: { ...selectedNode.data, properties: newProperties, title: String(value) },
        })
        setSelectedNode(selectedNode.id, kind as 'entity' | 'block' | 'item' | null, String(value))
      }
      // debounce 持久化由 useCanvasSync 的 interval 自动处理（检测 nodes 变化）
    },
    [selectedNode, updateNode, kind, setSelectedNode],
  )

  return (
    <aside
      style={{ width }}
      className="flex h-full shrink-0 flex-col border-l border-border bg-card/40"
      aria-label="右侧属性面板"
    >
      <header className="border-b border-border px-4 py-3">
        <h2 className="truncate text-sm font-semibold text-foreground">{headerTitle}</h2>
        {!hasSelection && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">点击节点查看属性</p>
        )}
        {hasSelection && (
          <p className={cn('mt-0.5 text-[11px] font-medium', typeColor)}>
            当前选中：{selectedNodeName ?? selectedNode.data.title}
          </p>
        )}
      </header>

      <div className="flex-1 overflow-y-auto nexcube-scroll">
        {hasSelection ? (
          <Tabs defaultValue={defaultTab} className="flex flex-col gap-0">
            <div className="border-b border-border px-3 pt-3">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="basic" className="text-xs">
                  基础属性
                </TabsTrigger>
                {supportsSubLogic && (
                  <TabsTrigger value="behavior" className="text-xs">
                    行为逻辑
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="basic" className="m-0 p-3">
              <PropertyForm
                nodeKind={kind}
                properties={selectedNode.data.properties ?? {}}
                onChange={handlePropertyChange}
              />
            </TabsContent>

            {supportsSubLogic && selectedNodeId && (
              <TabsContent value="behavior" className="m-0 p-3">
                <SubgraphEditor
                  parentNodeId={selectedNodeId}
                  parentNodeName={selectedNodeName ?? selectedNode.data.title}
                  parentNodeKind={selectedNode.data.kind}
                  height={420}
                />
              </TabsContent>
            )}

            {!supportsSubLogic && (
              <TabsContent value="behavior" className="m-0 p-4">
                <SubgraphEditorEmpty />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30"
            >
              <MousePointerClick className="h-7 w-7 text-muted-foreground/60" />
            </motion.div>
            <div>
              <p className="text-xs font-medium text-foreground">选中节点开始编辑</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                在画布上点击任意节点，<br />其属性将在此处显示
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
