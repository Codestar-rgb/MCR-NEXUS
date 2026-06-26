/**
 * 黑盒节点管理 —— Task 4-C
 *
 * 职责：
 *  - detectBlackboxBlocks: 从代码中检测黑盒区域（重导出自 ast-sync-engine）
 *  - createBlackboxNode: 从黑盒代码块创建画布节点（用于"代码 → 节点降级"）
 *  - extractUnparseableCode: 启发式判断代码是否无法被节点表达
 *
 * "节点为基准，代码为增强"原则下，黑盒节点是降级方案：
 *  - 当用户在代码编辑器中写了无法用 entity/block/item 节点表达的代码
 *    （如自定义渲染器、复杂事件订阅、Mixin 等），AST 同步引擎会把它
 *    包成黑盒节点放到画布上，避免丢失用户代码。
 *  - 黑盒节点不会自动创建（避免污染画布），只在用户主动"导入代码"
 *    或检测到高风险修改时提示用户。
 *
 * @see src/lib/codegen/ast-sync-engine.ts
 * @see src/hooks/use-bidirectional-sync.ts
 */

import type { FlowNode } from '@/lib/node-system'
import {
  detectBlackboxBlocks,
  type BlackboxBlock,
} from './ast-sync-engine'

// 重导出，便于外部从 blackbox-manager 单一入口访问
export { detectBlackboxBlocks }
export type { BlackboxBlock }

/* ------------------------------------------------------------------ */
/* 类型定义                                                            */
/* ------------------------------------------------------------------ */

/** 黑盒节点的画布数据（扩展自 FlowNodeData） */
export interface BlackboxNodeData {
  id: string
  title: string
  code: string
  sourceFile: string
  startLine: number
  endLine: number
}

/** 黑盒块最小输入形状（兼容 ast-sync-engine.BlackboxBlock） */
export interface BlackboxBlockInput {
  code: string
  startLine: number
  endLine: number
  title: string
  nodeId?: string
}

/* ------------------------------------------------------------------ */
/* 黑盒节点创建                                                        */
/* ------------------------------------------------------------------ */

/**
 * 从代码解析出的黑盒块创建一个画布黑盒节点
 *
 * 注意：本函数仅生成 FlowNode 对象，**不会**自动加入画布。
 * 调用方（如 useBidirectionalSync）应将其呈现给用户确认后
 * 再调 useCanvasStore.getState().addNode(node) 添加到画布。
 *
 * @param block 黑盒代码块
 * @param _projectId 项目 ID（保留参数）
 * @param position 节点位置（画布坐标）
 */
export function createBlackboxNode(
  block: BlackboxBlockInput,
  _projectId: string,
  position: { x: number; y: number },
): FlowNode {
  const id = `blackbox_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`
  return {
    id,
    type: 'blackbox',
    position,
    data: {
      kind: 'blackbox',
      title: block.title || '黑盒代码',
      properties: {
        name: block.title || '黑盒代码',
        sourceCode: block.code,
      },
      isCollapsed: false,
      color: 'zinc',
      // 黑盒节点附加元数据（供卡片显示源文件/行号）
      sourceFile: '',
      startLine: block.startLine,
      endLine: block.endLine,
    },
  }
}

/* ------------------------------------------------------------------ */
/* 不可解析代码启发式判断                                              */
/* ------------------------------------------------------------------ */

/**
 * 启发式判断一段代码是否"无法用节点表达"
 *
 * 规则（满足任一即视为黑盒候选）：
 *  - 包含 Mixin 注解（@Mixin / @Inject / @Redirect）
 *  - 包含事件订阅（@SubscribeEvent）且不在节点 schema 内
 *  - 包含反射 / Unsafe 调用
 *  - 包含 native 方法 / JNI
 *  - 包含自定义渲染器（RenderType / EntityRenderer）
 *  - 包含 import 第三方非 Forge API
 *
 * @returns 不可解析原因（数组，空数组表示可被节点表达）
 */
export function detectUnparseablePatterns(code: string): string[] {
  const reasons: string[] = []

  if (/@Mixin\s*\(/.test(code)) reasons.push('Mixin 注入（@Mixin）')
  if (/@Inject\s*\(/.test(code)) reasons.push('Mixin 注入（@Inject）')
  if (/@Redirect\s*\(/.test(code)) reasons.push('Mixin 重定向（@Redirect）')
  if (/@SubscribeEvent\s/.test(code)) reasons.push('事件订阅（@SubscribeEvent）')
  if (/\.getDeclaredField\s*\(/.test(code)) reasons.push('反射访问字段')
  if (/sun\.misc\.Unsafe/.test(code)) reasons.push('Unsafe 调用')
  if (/\bnative\s+\w+\s+\w+\s*\(/.test(code)) reasons.push('native 方法')
  if (/RenderType\.create\s*\(/.test(code)) reasons.push('自定义 RenderType')
  if (/extends\s+EntityRenderer\b/.test(code)) reasons.push('自定义实体渲染器')
  if (/implements\s+.*ICustomModel/.test(code)) reasons.push('自定义模型')

  return reasons
}

/**
 * 给定一个文件代码，提取其中所有"无法被节点表达"的代码块
 *
 * 优先返回黑盒区域标记内的代码；其次扫描整个文件检测不可解析模式。
 *
 * @param code 文件代码
 * @param linkedNodeId 关联节点 ID（用于归属）
 */
export function extractUnparseableBlocks(
  code: string,
  linkedNodeId?: string,
): BlackboxBlock[] {
  // 1. 显式黑盒区域（用户已用标记包裹的代码）
  const explicitBlocks = detectBlackboxBlocks(code, linkedNodeId)
  if (explicitBlocks.length > 0) return explicitBlocks

  // 2. 启发式扫描整个文件
  const reasons = detectUnparseablePatterns(code)
  if (reasons.length === 0) return []

  // 把整个文件视为一个黑盒块（粗粒度降级）
  const lines = code.split('\n')
  return [
    {
      nodeId: linkedNodeId,
      startLine: 1,
      endLine: lines.length,
      code: code,
      title: `黑盒代码（${reasons[0]}）`,
    },
  ]
}
