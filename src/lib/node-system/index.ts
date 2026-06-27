/**
 * 节点系统 barrel 导出
 *
 * 统一入口：import { PORT_TYPES, NODE_TYPE_REGISTRY, ... } from '@/lib/node-system'
 *
 * 包含：
 *  - 端口类型系统（5 种端口数据类型 + 颜色编码 + 兼容性校验）
 *  - 节点类型注册表（6 种节点类型 + 属性 schema）
 *  - 节点工厂（创建新节点 + 默认 properties）
 *  - FlowNode/FlowEdge 类型 + Prisma 双向转换
 */

export * from './port-types'
export * from './node-types'
export * from './node-factory'
export * from './types'
