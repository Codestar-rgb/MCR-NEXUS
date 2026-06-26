'use client'

/**
 * @deprecated 阶段 2-C 已完成完整 React Flow v12 画布。
 *
 * 该文件保留为薄包装，导出新的 NodeCanvas 组件。
 * WorkspaceShell 当前从此处导入 NodeCanvasPlaceholder（兼容旧引用）。
 * 主代理整合阶段可直接将 WorkspaceShell 的 import 改为指向 node-canvas.tsx。
 */

export { NodeCanvas as NodeCanvasPlaceholder } from './node-canvas'
