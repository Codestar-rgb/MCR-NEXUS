/**
 * 代码生成器入口（Task 4-D）
 *
 * 对外暴露：
 *  - generateProjectCode(project, nodes, options?) → GeneratedFile[]
 *  - GeneratedFile / CodegenProject / CodegenNode / CodegenOptions 类型
 *
 * 该函数被以下位置调用：
 *  - ZIP 导出 API：POST /api/projects/[id]/export
 *  - 代码视图（阶段 4-B 接入，可替换内部实现）
 *
 * 设计原则：
 *  - 纯函数：输入相同时输出严格相同（便于缓存）
 *  - 无副作用：不读写文件系统
 *  - 可测试：每个子模块独立可测
 */

import { generateJavaSources } from './java-sources'
import { generateProjectFiles, generateGradleWrapper } from './project-files'
import type {
  CodegenNode,
  CodegenOptions,
  CodegenProject,
  GeneratedFile,
} from './types'

export type { CodegenNode, CodegenOptions, CodegenProject, GeneratedFile }

/**
 * 生成完整 Forge 项目源码
 *
 * @param project  Prisma Project 的最小快照
 * @param nodes    Prisma Node[] 的最小快照
 * @param options  导出选项（默认全包含）
 * @returns GeneratedFile[] —— path + content
 */
export function generateProjectCode(
  project: CodegenProject,
  nodes: CodegenNode[],
  options: CodegenOptions = {},
): GeneratedFile[] {
  const {
    includeGradleWrapper = true,
    includeReadme = true,
    includeGitignore = true,
  } = options

  const files: GeneratedFile[] = []

  // 1. 项目骨架文件（build.gradle, gradle.properties, mods.toml, ...）
  const projectBundle = generateProjectFiles(project, {
    includeReadme,
    includeGitignore,
  })
  files.push(...projectBundle.files)

  // 2. Java 源码（主类 + 注册中心 + 自定义类）
  const javaBundle = generateJavaSources(project, nodes)
  files.push(...javaBundle.files)

  // 3. Gradle wrapper（可选）
  if (includeGradleWrapper) {
    files.push(...generateGradleWrapper())
  }

  return files
}

/** 仅导出文件清单（用于 UI 预览，不生成实际内容） */
export function listProjectFiles(
  project: CodegenProject,
  nodes: CodegenNode[],
  options: CodegenOptions = {},
): string[] {
  return generateProjectCode(project, nodes, options).map((f) => f.path)
}
