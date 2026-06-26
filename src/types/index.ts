/**
 * NexCube 共享类型定义
 *
 * 与 Prisma 模型对应（Project 模型在后续任务中接入 schema）。
 * 加载器类型仅约束首期支持的 Forge / Fabric / NeoForge / Quilt。
 */

export type ModLoader = 'forge' | 'fabric' | 'neoforge' | 'quilt'

export type ProjectStatus =
  | 'draft'
  | 'initialized'
  | 'active'
  | 'building'
  | 'archived'

export interface Project {
  id: string
  name: string
  /** 项目根目录的绝对路径或相对工作区路径 */
  path: string
  /** 模组加载器类型 */
  loader: ModLoader
  /** 加载器版本，如 Forge 47.3.0 */
  loaderVersion: string
  /** 目标 Minecraft 版本，如 1.20.1 */
  mcVersion: string
  /** Java 工具链版本，如 17 */
  javaVersion: string
  /** 模组唯一 modId */
  modId: string
  /** 模组版本号 */
  modVersion: string
  /** 项目状态 */
  status: ProjectStatus
  /** 最近一次打开时间（ISO 字符串） */
  lastOpenedAt: string
  /** 创建时间（ISO 字符串） */
  createdAt: string
  /** 更新时间（ISO 字符串） */
  updatedAt: string
  /** 项目缩略图（可选，用于最近列表展示） */
  thumbnailUrl?: string | null
}

/** 用于在最近列表中展示的精简字段 */
export type RecentProject = Pick<
  Project,
  'id' | 'name' | 'loader' | 'loaderVersion' | 'mcVersion' | 'lastOpenedAt' | 'thumbnailUrl'
>
