/**
 * 代码生成器 —— 类型定义（Task 4-D）
 *
 * NexCube 节点画布 → Forge 1.20.1 项目代码生成
 *
 * 设计目标：
 *  - 输入：Prisma Project + Node[]（从画布快照中读取）
 *  - 输出：GeneratedFile[]（相对路径 + 文本内容）
 *  - 不直接读写文件系统，由调用方（ZIP 导出 API / 代码视图）决定落盘方式
 *  - 纯函数，可重入，便于测试与缓存
 *
 * 任务边界：
 *  Task 4-B 计划提供更丰富的 generateProjectCode 实现（AST 同步、双向编辑）。
 *  本文件先提供「能跑通 gradlew build」的最小骨架版本：
 *    - 主类 @Mod
 *    - DeferredRegister 注册 entity / block / item
 *    - 客户端模型注册（EntityRenderer / BlockItem）
 *  4-B 可在不破坏 4-D 导出 API 的前提下替换内部实现。
 */

/** 生成文件的最小描述单元 */
export interface GeneratedFile {
  /** 相对 ZIP 根的 POSIX 路径，如 "src/main/java/com/example/examplemod/ExampleMod.java" */
  path: string
  /** 文件文本内容（UTF-8）。脚本类文件如 gradlew 用 LF 换行 */
  content: string
  /** 是否为可执行脚本（仅用于元信息，不影响 ZIP 写入） */
  executable?: boolean
}

/** 节点最小快照（避免直接依赖 Prisma 类型，便于在客户端 mock） */
export interface CodegenNode {
  id: string
  /** 节点大类型：entity / block / item / blackbox / function / logic_* */
  type: string
  title: string
  /** JSON 字符串，存储节点属性 */
  properties: string
  /** 黑盒节点的内联 Java 代码 */
  sourceCode?: string | null
}

/** 项目最小快照 */
export interface CodegenProject {
  id: string
  modId: string
  name: string
  author: string
  version: string
  mcVersion: string
  forgeVersion: string
  loader: string
  description?: string | null
}

/** 导出选项（由 UI 传入，控制是否包含 gradle wrapper / README 等） */
export interface CodegenOptions {
  /** 包含 gradlew / gradlew.bat / gradle-wrapper.properties */
  includeGradleWrapper?: boolean
  /** 包含 README.md */
  includeReadme?: boolean
  /** 包含 .gitignore */
  includeGitignore?: boolean
}
