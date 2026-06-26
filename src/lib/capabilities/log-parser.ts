/**
 * NexCube 智能日志解析引擎
 *
 * 这是真实可用的规则匹配引擎（不是 mock），供 web.ts 与 electron.ts 共用。
 * 用于解析 Gradle / Forge / javac 等构建日志，输出结构化中文卡片。
 *
 * 设计原则：
 *   - 规则解耦：每条规则独立定义，便于扩展
 *   - 中文友好：所有标题、原因、建议均为中文，原文保留英文
 *   - 修复导向：可执行动作通过 action key 由前端 dispatch
 *   - 多行模式：支持跨行报错匹配
 */

import type { ParsedLogCard } from './types'

/** 解析规则定义 */
interface ParseRule {
  /** 规则 ID */
  id: string
  /** 严重等级 */
  level: 'error' | 'warn' | 'info'
  /** 匹配模式（支持多行） */
  pattern: RegExp
  /** 中文标题 */
  title: string
  /** 从匹配结果中提取原始文本 */
  extractOriginal: (match: RegExpMatchArray, fullLog: string) => string
  /** 中文原因分析（字符串或函数，函数时可使用匹配组） */
  analysis: string | ((match: RegExpMatchArray) => string)
  /** 中文建议（字符串或函数） */
  suggestion: string | ((match: RegExpMatchArray) => string)
  /** 可选修复动作 */
  fixAction?: (match: RegExpMatchArray) => ParsedLogCard['fixAction']
}

/** 统一处理 string | function 形式的字段 */
function resolveField(
  field: string | ((match: RegExpMatchArray) => string),
  match: RegExpMatchArray,
): string {
  return typeof field === 'function' ? field(match) : field
}

/**
 * 规则库：覆盖 Gradle / Forge / javac 常见报错模式
 * 100+ 条规则，覆盖 9 个类别：
 *   1. 依赖解析失败  2. JVM 内存  3. javac 编译  4. Forge 模组
 *   5. 网络/权限      6. 构建总览  7. 依赖扩展  8. JVM 扩展
 *   9. javac 扩展   10. Forge 扩展  11. Gradle 构建  12. 网络扩展
 *  13. ForgeGradle  14. 资源/数据包  15. 运行时
 */
const RULES: ParseRule[] = [
  // ---------------------------------------------------------------------------
  // 1. 依赖解析失败
  // ---------------------------------------------------------------------------
  {
    id: 'GRADLE-DEP-RESOLVE-FAIL',
    level: 'error',
    pattern: /Could not resolve\s+([^\n.]+?)[\n.]/m,
    title: '依赖解析失败',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      const line = fullLog.substring(idx, idx + 400).split('\n').slice(0, 6).join('\n')
      return line.trim()
    },
    analysis: (m) => `Gradle 无法解析依赖「${m[1].trim()}」，常见原因：仓库未配置、网络无法访问、版本号拼写错误、或本地缓存损坏。`,
    suggestion: '请检查 settings.gradle / build.gradle 的 repositories 块是否包含 mavenCentral() 与镜像源；确认网络通畅；可执行 ./gradlew --refresh-dependencies 强制刷新。',
    fixAction: () => ({
      label: '配置阿里云镜像',
      action: 'fix.configure-mirror',
      payload: { mirrorId: 'aliyun' },
    }),
  },
  {
    id: 'GRADLE-DEP-NOT-FOUND',
    level: 'error',
    pattern: /Could not find\s+([^\n.]+?)[\n.]/m,
    title: '依赖未找到',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 300).split('\n').slice(0, 5).join('\n').trim()
    },
    analysis: (m) => `Gradle 在所有已配置仓库中均未找到「${m[1].trim()}」。可能 group/artifact/version 拼写错误，或该构件不存在于公共仓库。`,
    suggestion: '请核对依赖坐标是否正确（可在 https://central.sonatype.com 搜索）；检查是否需要指定 classifier；确认 repositories 中包含 mavenCentral()。',
    fixAction: () => ({
      label: '查看 Maven 中央仓库',
      action: 'fix.search-maven',
    }),
  },
  // ---------------------------------------------------------------------------
  // 2. JVM 内存
  // ---------------------------------------------------------------------------
  {
    id: 'JVM-OOM-HEAP',
    level: 'error',
    pattern: /java\.lang\.OutOfMemoryError:\s*Java heap space/,
    title: 'JVM 堆内存不足',
    extractOriginal: (m) => m[0],
    analysis: () => 'JVM 堆内存耗尽，Gradle / javac 在编译大项目或大量类时需要的堆空间超过了 -Xmx 设置。',
    suggestion: '在 gradle.properties 中提高 org.gradle.jvmargs=-Xmx4G（建议至少 4G）；或为单个任务设置 --no-daemon 减少 Daemon 占用。',
    fixAction: () => ({
      label: '调整 JVM 内存',
      action: 'fix.adjust-jvm-memory',
      payload: { suggested: '-Xmx4G' },
    }),
  },
  {
    id: 'JVM-OOM-METASPACE',
    level: 'error',
    pattern: /OutOfMemoryError:\s*Metaspace/,
    title: '元空间（Metaspace）不足',
    extractOriginal: (m) => m[0],
    analysis: () => 'JVM Metaspace（存放类元数据）耗尽，通常因为加载了过多的类（如大量动态生成代理、反射场景）。',
    suggestion: '在 gradle.properties 中追加 -XX:MaxMetaspaceSize=1G；同时排查是否有类加载泄漏（如反复 reload Forge MDK）。',
    fixAction: () => ({
      label: '调整 Metaspace',
      action: 'fix.adjust-jvm-memory',
      payload: { suggested: '-XX:MaxMetaspaceSize=1G' },
    }),
  },
  {
    id: 'JVM-OOM-GC',
    level: 'warn',
    pattern: /OutOfMemoryError:\s*GC overhead limit exceeded/,
    title: 'GC 开销超限',
    extractOriginal: (m) => m[0],
    analysis: () => 'JVM 花费了过多时间进行垃圾回收（>98%）且仅回收很少内存，通常是堆内存不足或存在内存泄漏。',
    suggestion: '提高 -Xmx；或临时禁用 -XX:-UseGCOverheadLimit 不推荐；排查代码是否有大量静态集合持有对象。',
    fixAction: () => ({
      label: '查看内存分析指南',
      action: 'fix.show-memory-guide',
    }),
  },
  // ---------------------------------------------------------------------------
  // 3. 编译错误（javac）
  // ---------------------------------------------------------------------------
  {
    id: 'JAVAC-COMPILE-FAILURE',
    level: 'error',
    pattern: /Compilation failed[\s;]+(errors?:\s*\d+)?/i,
    title: 'Java 编译失败',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(Math.max(0, idx - 200), idx + 400).trim()
    },
    analysis: () => 'javac 编译失败，源码中存在语法或类型错误。请查看紧随其后的错误列表。',
    suggestion: '逐一修复后续的 error 行；可优先处理 "cannot find symbol" 与 "incompatible types" 类错误，往往一个错误会引发连锁报错。',
  },
  {
    id: 'JAVAC-CANNOT-FIND-SYMBOL',
    level: 'error',
    pattern: /cannot find symbol[\s\S]{0,200}?symbol:\s*([^\n]+)\n\s*location:\s*([^\n]+)/i,
    title: '找不到符号',
    extractOriginal: (m) => m[0].trim(),
    analysis: (m) => `编译器在「${m[2].trim()}」处找不到符号「${m[1].trim()}」。常见原因：未导入、类名拼写错误、或方法/字段不存在。`,
    suggestion: '检查 import 语句是否完整；确认引用的类已被声明为 public；如果使用了 Lombok，请确保注解处理器已启用。',
    fixAction: (m) => ({
      label: '查看符号定义',
      action: 'fix.goto-symbol',
      payload: { symbol: m[1].trim(), location: m[2].trim() },
    }),
  },
  {
    id: 'JAVAC-UNCLOSED-STRING',
    level: 'error',
    pattern: /unclosed string literal/i,
    title: '字符串字面量未闭合',
    extractOriginal: (m) => m[0],
    analysis: () => '源码中存在未闭合的字符串字面量（缺少右双引号），通常因为字符串中包含未转义的双引号或换行。',
    suggestion: '检查报错行，确保字符串以 \" 结尾；若字符串需要换行，请使用 \n 转义或使用文本块（""" ... """）。',
  },
  {
    id: 'JAVAC-ILLEGAL-START',
    level: 'error',
    pattern: /illegal start of (?:type|expression)/i,
    title: '类型/表达式非法起始',
    extractOriginal: (m) => m[0],
    analysis: () => '编译器在期望类型或表达式的位置遇到了非法 token，通常因为括号不匹配、多了分号、或修饰符顺序错误。',
    suggestion: '检查报错位置附近的括号配对、分号位置、泛型尖括号；从 IDE 的语法高亮中能快速发现错位。',
  },
  {
    id: 'JAVAC-INCOMPATIBLE-TYPES',
    level: 'error',
    pattern: /incompatible types:\s*(.+?)\n\s*(?:required|found):/i,
    title: '类型不兼容',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 300).split('\n').slice(0, 4).join('\n').trim()
    },
    analysis: (m) => `类型不兼容：${m[1].trim()}。赋值、传参或返回值的类型与目标类型不匹配。`,
    suggestion: '确认变量类型；必要时进行显式转换 (TargetType)；如果是泛型，注意类型擦除；检查是否使用了原始类型（raw type）。',
  },
  {
    id: 'JAVAC-PACKAGE-NOT-EXIST',
    level: 'error',
    pattern: /package\s+([\w.]+)\s+does not exist/i,
    title: '包不存在',
    extractOriginal: (m) => m[0],
    analysis: (m) => `编译器找不到包「${m[1]}」，可能因为：依赖未声明、版本冲突、或源码目录结构不符合 Maven 约定。`,
    suggestion: '检查 build.gradle 的 dependencies 块是否包含该包对应的依赖；执行 ./gradlew dependencies 查看依赖树；刷新 Gradle 同步。',
    fixAction: () => ({
      label: '查看依赖树',
      action: 'fix.show-dependency-tree',
    }),
  },
  {
    id: 'JAVAC-METHOD-APPLY',
    level: 'error',
    pattern: /method\s+(\w+)\s+in class\s+([\w.$]+)\s+cannot be applied to given types/i,
    title: '方法签名不匹配',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 280).split('\n').slice(0, 5).join('\n').trim()
    },
    analysis: (m) => `调用方法「${m[1]}」（位于类 ${m[2]}）时传入的参数与该方法任何一个重载签名都不匹配。`,
    suggestion: '查看该类源码或 javadoc，确认参数数量、类型、顺序；注意是否有 varargs 重载；如果是 Forge API，请确认版本对应。',
  },
  {
    id: 'JAVAC-SYNTAX-ERROR',
    level: 'error',
    pattern: /(?:error:\s*)?[Ss]yntax error/i,
    title: '语法错误',
    extractOriginal: (m) => m[0],
    analysis: () => '源码中存在语法错误，编译器无法解析。',
    suggestion: '检查报错位置附近的标点、关键字、运算符；IDE 通常会用红色波浪线标出。',
  },
  // ---------------------------------------------------------------------------
  // 4. Forge / 模组特定
  // ---------------------------------------------------------------------------
  {
    id: 'FORGE-MAPPING-NOT-FOUND',
    level: 'error',
    pattern: /Mapping not found\s+for\s+(\S+)/i,
    title: 'Forge 映射缺失',
    extractOriginal: (m) => m[0],
    analysis: (m) => `Forge 官方 mappings 中未找到「${m[1]}」，可能因为映射版本与 MC 版本不匹配，或使用了未发布的字段/方法名。`,
    suggestion: '在 build.gradle 的 minecraft { mappings channel: "official", version: "1.20.1" } 中确认映射版本；如使用 Parchment，请确认其已发布对应 MC 版本。',
    fixAction: () => ({
      label: '查看 mappings 文档',
      action: 'fix.show-mappings-doc',
    }),
  },
  {
    id: 'FORGE-MOD-LOADER-EXCEPTION',
    level: 'error',
    pattern: /(ModLoadingException|Failed to load mod)\b[^\n]*\n([\s\S]{0,400}?)(?:\n\n|\nCaused by)/i,
    title: '模组加载异常',
    extractOriginal: (m) => m[0].trim(),
    analysis: (m) => `Forge 在加载模组时抛出异常：${(m[2] || '').trim().split('\n')[0] || '未知'}。通常因为 @Mod 注解配置错误、构造函数抛异常、或入口类缺失。`,
    suggestion: '检查 @Mod 注解的 modid 是否与 mods.toml 一致；确认主类有公开无参构造；查看 Caused by 行定位根因。',
  },
  {
    id: 'FORGE-REGISTRY-DUPLICATE',
    level: 'error',
    pattern: /Registry name\s+"([^"]+)"\s+(?:is not valid|already exists|conflicts)/i,
    title: '注册名冲突',
    extractOriginal: (m) => m[0],
    analysis: (m) => `注册名「${m[1]}」冲突或非法。Forge 注册表要求所有 name 唯一且符合 [a-z0-9_]+ 模式。`,
    suggestion: '检查 DeferredRegister 注册的所有对象名；确保命名空间（modid）使用小写；不要使用大写或连字符。',
  },
  // ---------------------------------------------------------------------------
  // 5. 网络 / 权限
  // ---------------------------------------------------------------------------
  {
    id: 'NET-CONNECTION-REFUSED',
    level: 'error',
    pattern: /Connection refused/i,
    title: '连接被拒绝',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(Math.max(0, idx - 100), idx + 200).trim()
    },
    analysis: () => '目标地址主动拒绝连接，常见于：本地仓库未启动、端口被占用、防火墙拦截。',
    suggestion: '如果是 maven 仓库地址，请检查 URL 是否可访问；如果是本地服务（如 Nexus），请确认服务已启动；尝试切换镜像源。',
    fixAction: () => ({
      label: '切换镜像源',
      action: 'fix.configure-mirror',
    }),
  },
  {
    id: 'NET-CONNECTION-TIMEOUT',
    level: 'warn',
    pattern: /Connection (?:timed out|timeout)/i,
    title: '连接超时',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(Math.max(0, idx - 100), idx + 200).trim()
    },
    analysis: () => '网络连接超时，可能是网络不稳定、目标服务器响应慢、或处于受限网络环境。',
    suggestion: '检查网络代理设置；切换到国内镜像源（阿里云 / 清华）；为 Gradle 配置较长的超时时间。',
    fixAction: () => ({
      label: '使用国内镜像',
      action: 'fix.configure-mirror',
      payload: { mirrorId: 'aliyun' },
    }),
  },
  {
    id: 'PERM-DENIED',
    level: 'error',
    pattern: /Permission denied/i,
    title: '权限不足',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(Math.max(0, idx - 80), idx + 200).trim()
    },
    analysis: () => '文件或目录无访问权限，可能因为路径属主不是当前用户、或路径被其他进程占用。',
    suggestion: 'Linux/macOS 使用 chmod / chown 修正权限；Windows 检查文件是否被其他程序占用、以管理员身份运行。',
  },
  // ---------------------------------------------------------------------------
  // 6. 构建总览
  // ---------------------------------------------------------------------------
  {
    id: 'GRADLE-BUILD-FAILED',
    level: 'error',
    pattern: /BUILD FAILED\s+in\s+(\d+[sm]?)/i,
    title: '构建失败',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      // 取 BUILD FAILED 前 3 行 + 后 5 行作为上下文
      const before = fullLog.substring(Math.max(0, idx - 600), idx).split('\n').slice(-3).join('\n')
      const after = fullLog.substring(idx, idx + 500).split('\n').slice(0, 6).join('\n')
      return `${before}\n${after}`.trim()
    },
    analysis: (m) => `Gradle 构建在 ${m[1]} 内失败。请查看上方的具体错误信息。`,
    suggestion: '从日志顶部向下逐个修复 error；如出现 * What went wrong: 段落，重点阅读该段；可使用 --stacktrace 获取详细堆栈。',
    fixAction: () => ({
      label: '查看详细堆栈',
      action: 'fix.show-stacktrace',
    }),
  },
  {
    id: 'GRADLE-BUILD-SUCCESS',
    level: 'info',
    pattern: /BUILD SUCCESSFUL\s+in\s+(\d+[sm]?)/i,
    title: '构建成功',
    extractOriginal: (m) => m[0],
    analysis: (m) => `Gradle 构建成功，耗时 ${m[1]}。`,
    suggestion: '可继续下一步操作：导出 jar、运行游戏、生成映射等。',
  },

  // ===========================================================================
  // 7. 依赖解析失败（扩展，Task 8-C）
  // ===========================================================================
  {
    id: 'GRADLE-DEP-RESOLUTION-FAILED',
    level: 'error',
    pattern: /Dependency resolution failed[^\n]*/i,
    title: '依赖解析整体失败',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 280).split('\n').slice(0, 6).join('\n').trim()
    },
    analysis: () => 'Gradle 在解析整个配置（configuration）的依赖时整体失败，通常因为某个间接依赖无法下载、仓库返回错误或版本冲突。',
    suggestion: '查看紧随其后的具体依赖错误；尝试 ./gradlew --refresh-dependencies；检查网络与镜像源；如使用 SNAPSHOT，请确认仓库支持。',
    fixAction: () => ({
      label: '切换镜像源',
      action: 'fix.configure-mirror',
      payload: { mirrorId: 'aliyun' },
    }),
  },
  {
    id: 'GRADLE-DEP-MODULE-NOT-FOUND',
    level: 'error',
    pattern: /Module not found[^\n]*[:\s]+([^\n]+)/i,
    title: '模块未找到',
    extractOriginal: (m) => m[0],
    analysis: (m) => `Gradle 模块未找到：${m[1].trim()}。这通常是 POM 中声明的依赖在所有仓库中都不存在。`,
    suggestion: '核对 GAV（group:artifact:version）坐标；执行 ./gradlew dependencies 查看具体缺失模块；可能需要添加额外仓库。',
    fixAction: () => ({
      label: '查看依赖树',
      action: 'fix.show-dependency-tree',
    }),
  },
  {
    id: 'GRADLE-DEP-ARTIFACT-NOT-FOUND',
    level: 'error',
    pattern: /Artifact not found[^\n]*[:\s]+([^\n]+)/i,
    title: '构件未找到',
    extractOriginal: (m) => m[0],
    analysis: (m) => `Maven 构件未找到：${m[1].trim()}。仓库中可能存在 POM 但缺少对应的 jar 文件。`,
    suggestion: '检查是否需要指定 classifier（如 sources/javadoc）；确认该构件是否仅发布在某私有仓库；尝试切换镜像。',
    fixAction: () => ({
      label: '切换镜像源',
      action: 'fix.configure-mirror',
      payload: { mirrorId: 'aliyun' },
    }),
  },
  {
    id: 'GRADLE-DEP-POM-NOT-FOUND',
    level: 'error',
    pattern: /(?:POM|pom\.xml)\s+(?:dependency\s+)?not found/i,
    title: 'POM 未找到',
    extractOriginal: (m) => m[0],
    analysis: () => '依赖的 POM 文件在所有仓库中均未找到，Gradle 无法获取该依赖的元信息。',
    suggestion: '确认依赖坐标正确；可能该构件已被删除或从未发布；考虑替换为类似功能的其他库。',
  },
  {
    id: 'GRADLE-DEP-TRANSITIVE',
    level: 'warn',
    pattern: /transitive dependency[^\n]*[:\s]?([^\n]+)/i,
    title: '传递依赖问题',
    extractOriginal: (m) => m[0],
    analysis: (m) => `传递依赖出现问题${m[1] ? `：${m[1].trim()}` : ''}。直接依赖引入的间接依赖可能版本冲突或不存在。`,
    suggestion: '使用 ./gradlew dependencies --configuration <config> 查看依赖树；可在 dependencies 中强制指定版本。',
    fixAction: () => ({
      label: '查看依赖树',
      action: 'fix.show-dependency-tree',
    }),
  },
  {
    id: 'GRADLE-DEP-VERSION-CONFLICT',
    level: 'warn',
    pattern: /version conflict[^\n]*(?:between\s+([^\n]+))?/i,
    title: '依赖版本冲突',
    extractOriginal: (m) => m[0],
    analysis: (m) => `检测到依赖版本冲突${m[1] ? `：${m[1].trim()}` : ''}。Gradle 默认选取最新版本，可能导致部分模块不兼容。`,
    suggestion: '使用 ./gradlew dependencyInsight --dependency <name> 定位；用 constraints 或 resolutionStrategy.force 统一版本。',
    fixAction: () => ({
      label: '查看依赖树',
      action: 'fix.show-dependency-tree',
    }),
  },
  {
    id: 'GRADLE-DEP-CYCLE',
    level: 'error',
    pattern: /(?:dependency cycle|circular dependency)/i,
    title: '依赖循环',
    extractOriginal: (m) => m[0],
    analysis: () => '检测到依赖之间存在循环引用（A 依赖 B，B 又依赖 A），Gradle 无法构建依赖图。',
    suggestion: '检查自定义依赖声明是否引入了循环；使用 ./gradlew dependencies 查看依赖路径；重构模块拆分以打破循环。',
  },
  {
    id: 'GRADLE-DEP-EVICTED',
    level: 'info',
    pattern: /evicted (?:by|dependency)[^\n]*[:\s]?([^\n]+)/i,
    title: '依赖被驱逐',
    extractOriginal: (m) => m[0],
    analysis: (m) => `依赖被其他版本驱逐${m[1] ? `：${m[1].trim()}` : ''}。Gradle 选择了不同版本，原版本未参与最终构建。`,
    suggestion: '这是 Gradle 的默认行为；若需使用特定版本，请使用 resolutionStrategy.force 或 constraints 显式指定。',
  },
  {
    id: 'GRADLE-DEP-DEPRECATED',
    level: 'warn',
    pattern: /deprecated (?:dependency|artifact)/i,
    title: '依赖已弃用',
    extractOriginal: (m) => m[0],
    analysis: () => '依赖被标记为已弃用（deprecated），可能在后续版本中移除。',
    suggestion: '查看该依赖的官方文档，寻找替代品；计划迁移到新版本或新库；保留以观察其 changelog。',
  },
  {
    id: 'GRADLE-DEP-SNAPSHOT',
    level: 'warn',
    pattern: /SNAPSHOT (?:dependency|version)/i,
    title: '使用 SNAPSHOT 依赖',
    extractOriginal: (m) => m[0],
    analysis: () => '项目引用了 SNAPSHOT 版本依赖，该版本会随时间变化，可能导致构建不可重现。',
    suggestion: '生产环境建议使用 RELEASE 版本；如必须使用 SNAPSHOT，配置 maven { url = ...; mavenContent { snapshotsOnly() } }。',
  },
  {
    id: 'GRADLE-DEP-CLASSIFIER-NOT-FOUND',
    level: 'error',
    pattern: /classifier (?:not found|missing)/i,
    title: 'Classifier 未找到',
    extractOriginal: (m) => m[0],
    analysis: () => '依赖的指定 classifier（如 sources、javadoc、natives）在仓库中未找到对应构件。',
    suggestion: '检查依赖声明中 classifier 是否正确；某些库不发布 sources/javadoc；可移除 classifier 或换用其他构件。',
  },
  {
    id: 'GRADLE-DEP-EXTENSION-NOT-FOUND',
    level: 'error',
    pattern: /extension (?:not found|missing)/i,
    title: 'Extension 未找到',
    extractOriginal: (m) => m[0],
    analysis: () => '依赖的指定 extension（如 jar、war、aar）在仓库中未找到。',
    suggestion: '检查 ext 字段是否正确；通常 Java 项目使用 jar；Android 项目使用 aar。',
  },
  {
    id: 'GRADLE-DEP-METADATA-NOT-FOUND',
    level: 'warn',
    pattern: /(?:maven-metadata\.xml|metadata) (?:not found|missing|could not be (?:fetched|parsed))/i,
    title: 'Maven 元数据未找到',
    extractOriginal: (m) => m[0],
    analysis: () => 'Gradle 无法获取或解析 maven-metadata.xml，可能因为仓库响应异常、网络问题或该构件从未发布过版本元数据。',
    suggestion: '切换镜像源；检查仓库 URL 是否可达；如果是私有库，确认凭证配置；尝试 ./gradlew --refresh-dependencies。',
    fixAction: () => ({
      label: '切换镜像源',
      action: 'fix.configure-mirror',
      payload: { mirrorId: 'aliyun' },
    }),
  },
  {
    id: 'GRADLE-DEP-ALL-RESOLVE-FAIL',
    level: 'error',
    pattern: /Could not resolve all (?:dependencies|files|artifacts) for (?:configuration|task)\s+'([^']+)'/i,
    title: '整体解析失败',
    extractOriginal: (m) => m[0],
    analysis: (m) => `配置「${m[1]}」的所有依赖解析失败，通常因为仓库不可达或多个依赖同时出错。`,
    suggestion: '查看紧随其后的具体错误列表；优先修复第一个错误；检查仓库配置与网络。',
  },
  {
    id: 'GRADLE-DEP-CONFLICT-RESOLUTION',
    level: 'warn',
    pattern: /Conflict resolution (?:failed|for)/i,
    title: '依赖冲突解决失败',
    extractOriginal: (m) => m[0],
    analysis: () => 'Gradle 在解决依赖冲突时失败，可能因为版本约束矛盾或 resolutionStrategy 配置错误。',
    suggestion: '检查 build.gradle 中的 resolutionStrategy 块；使用 dependencyInsight 任务定位具体冲突。',
  },

  // ===========================================================================
  // 8. JVM 内存错误（扩展，Task 8-C）
  // ===========================================================================
  {
    id: 'JVM-OOM-DIRECT-BUFFER',
    level: 'error',
    pattern: /OutOfMemoryError:\s*Direct buffer memory/i,
    title: '直接内存缓冲区不足',
    extractOriginal: (m) => m[0],
    analysis: () => 'JVM 直接内存（Direct Buffer）耗尽，常见于 NIO / Netty 场景，Forge 网络层也可能大量使用。',
    suggestion: '在 gradle.properties 提高 -XX:MaxDirectMemorySize=2G；排查代码中是否有未释放的 ByteBuffer；减少直接内存分配。',
    fixAction: () => ({
      label: '调整 JVM 内存',
      action: 'fix.adjust-jvm-memory',
      payload: { suggested: '-XX:MaxDirectMemorySize=2G' },
    }),
  },
  {
    id: 'JVM-STACKOVERFLOW',
    level: 'error',
    pattern: /java\.lang\.StackOverflowError/i,
    title: '栈溢出',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 300).split('\n').slice(0, 8).join('\n').trim()
    },
    analysis: () => 'JVM 调用栈深度超过 -Xss 限制，通常因为无限递归、互相循环调用、或非常深的递归数据结构。',
    suggestion: '检查代码中是否存在无终止条件的递归；适当增加 -Xss2m；考虑将递归改写为迭代。',
    fixAction: () => ({
      label: '调整栈大小',
      action: 'fix.adjust-jvm-memory',
      payload: { suggested: '-Xss2m' },
    }),
  },
  {
    id: 'JVM-OOM-NATIVE-THREAD',
    level: 'error',
    pattern: /OutOfMemoryError:\s*unable to create (?:new )?native thread/i,
    title: '无法创建本地线程',
    extractOriginal: (m) => m[0],
    analysis: () => '操作系统拒绝创建新的本地线程，可能因为线程数已达上限、内存不足、或 ulimit 限制。',
    suggestion: '检查代码是否创建了过多线程（线程池配置）；Linux 上提高 ulimit -u；减少 -Xmx 给线程栈留更多内存。',
  },
  {
    id: 'JVM-OOM-HEAP-EXCEEDED',
    level: 'error',
    pattern: /(?:Java heap space exceeded|exceeded heap space limit|heap space limit exceeded)/i,
    title: '堆空间超限',
    extractOriginal: (m) => m[0],
    analysis: () => '堆内存超过设定上限，常出现在大文件读取、批量代码生成或大量节点序列化场景。',
    suggestion: '在 gradle.properties 提高 org.gradle.jvmargs=-Xmx4G；分批处理大数据；排查内存泄漏。',
    fixAction: () => ({
      label: '调整 JVM 内存',
      action: 'fix.adjust-jvm-memory',
      payload: { suggested: '-Xmx4G' },
    }),
  },
  {
    id: 'JVM-MEMORY-LEAK',
    level: 'warn',
    pattern: /memory leak detected/i,
    title: '检测到内存泄漏',
    extractOriginal: (m) => m[0],
    analysis: () => 'JVM 或工具检测到可能的内存泄漏，对象持续被引用无法被 GC 回收。',
    suggestion: '使用 jmap / VisualVM 进行堆 dump 分析；检查静态集合、缓存、监听器是否未释放；考虑使用 WeakHashMap。',
    fixAction: () => ({
      label: '查看内存分析指南',
      action: 'fix.show-memory-guide',
    }),
  },
  {
    id: 'JVM-METASPACE-EXHAUSTED',
    level: 'error',
    pattern: /Metaspace (?:exhausted|overflow)/i,
    title: 'Metaspace 耗尽',
    extractOriginal: (m) => m[0],
    analysis: () => '类元数据空间被耗尽，比"Metaspace 不足"更严重，通常因为类加载器泄漏或大量动态类生成。',
    suggestion: '提高 -XX:MaxMetaspaceSize=2G；排查是否反复重新加载类（如热部署、反射生成代理）。',
    fixAction: () => ({
      label: '调整 Metaspace',
      action: 'fix.adjust-jvm-memory',
      payload: { suggested: '-XX:MaxMetaspaceSize=2G' },
    }),
  },
  {
    id: 'JVM-THREAD-DEADLOCK',
    level: 'error',
    pattern: /deadlock detected/i,
    title: '线程死锁',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 400).split('\n').slice(0, 10).join('\n').trim()
    },
    analysis: () => 'JVM 检测到线程死锁，多个线程互相等待对方释放锁，导致整体挂起。',
    suggestion: '使用 jstack 获取线程转储；查看死锁图谱；按固定顺序获取锁；使用 tryLock 替代 synchronized。',
  },
  {
    id: 'JVM-GC-PAUSE',
    level: 'warn',
    pattern: /GC pause (?:too long|exceeded)/i,
    title: 'GC 暂停时间过长',
    extractOriginal: (m) => m[0],
    analysis: () => '垃圾回收暂停时间过长，影响应用响应性，常见于大堆 + 串行 GC。',
    suggestion: '切换到 G1GC：-XX:+UseG1GC；设置 -XX:MaxGCPauseMillis=200；优化对象分配模式。',
    fixAction: () => ({
      label: '调整 GC 策略',
      action: 'fix.adjust-jvm-memory',
      payload: { suggested: '-XX:+UseG1GC' },
    }),
  },

  // ===========================================================================
  // 9. javac 编译错误（扩展，Task 8-C）
  // ===========================================================================
  {
    id: 'JAVAC-PUBLIC-CLASS-FILE-NAME',
    level: 'error',
    pattern: /class\s+(\w+)\s+is public, should be declared in a file named\s+([\w.]+)/i,
    title: '公开类与文件名不匹配',
    extractOriginal: (m) => m[0],
    analysis: (m) => `公开类「${m[1]}」必须定义在名为「${m[2]}」的文件中。Java 规范要求每个 public 类的类名与文件名一致。`,
    suggestion: '重命名源文件使其与 public 类名完全一致（区分大小写）；或将多余 public 修饰符移除。',
  },
  {
    id: 'JAVAC-ANNOTATION-PROCESSING',
    level: 'error',
    pattern: /class names are only accepted if annotation processing is explicitly requested/i,
    title: '需显式启用注解处理',
    extractOriginal: (m) => m[0],
    analysis: () => 'javac 在仅传递类名时要求显式启用注解处理（-proc:full 或 -processor）。常见于 Lombok 等注解处理器配置不当。',
    suggestion: '在 build.gradle 中确保 annotationProcessor 配置正确；Lombok: annotationProcessor \'org.projectlombok:lombok\'。',
  },
  {
    id: 'JAVAC-SEMICOLON-EXPECTED',
    level: 'error',
    pattern: /error:\s*['"]?;['"]?\s*expected/i,
    title: '缺少分号',
    extractOriginal: (m) => m[0],
    analysis: () => '编译器期望分号 ; 但未找到，通常因为语句末尾漏写分号。',
    suggestion: '在报错位置行尾补上 ;。IDE 通常会用红色波浪线标出。',
  },
  {
    id: 'JAVAC-RPAREN-EXPECTED',
    level: 'error',
    pattern: /error:\s*['"]?\)['"]?\s*expected/i,
    title: '缺少右圆括号',
    extractOriginal: (m) => m[0],
    analysis: () => '编译器期望右圆括号 ) 但未找到，通常因为方法调用或表达式括号未闭合。',
    suggestion: '检查报错位置之前的 ( 是否都有对应的 )；从内向外配对括号。',
  },
  {
    id: 'JAVAC-RBRACE-EXPECTED',
    level: 'error',
    pattern: /error:\s*['"]?\}['"]?\s*expected/i,
    title: '缺少右大括号',
    extractOriginal: (m) => m[0],
    analysis: () => '编译器期望右大括号 } 但未找到，通常因为类/方法/块的 { 没有对应 }。',
    suggestion: '检查类、方法、控制结构的 { } 配对；IDE 的代码折叠功能可帮助识别未闭合块。',
  },
  {
    id: 'JAVAC-NOT-A-STATEMENT',
    level: 'error',
    pattern: /error:\s*not a statement/i,
    title: '非有效语句',
    extractOriginal: (m) => m[0],
    analysis: () => '编译器在该位置期望一条语句但找到了无法识别的内容，可能因为多余的字面量、运算符或拼写错误。',
    suggestion: '检查报错行是否有多余字符；确认赋值语句左侧是变量；查看是否误写了类似 5; 这样的语句。',
  },
  {
    id: 'JAVAC-VAR-NOT-INITIALIZED',
    level: 'error',
    pattern: /variable\s+(\w+)\s+might not have been initialized/i,
    title: '变量可能未初始化',
    extractOriginal: (m) => m[0],
    analysis: (m) => `局部变量「${m[1]}」在使用前可能未被赋值。Java 要求局部变量必须先赋值再使用。`,
    suggestion: '在变量声明时显式初始化（如 = null / = 0）；或确保所有代码路径在使用前都已赋值。',
  },
  {
    id: 'JAVAC-VAR-ALREADY-DEFINED',
    level: 'error',
    pattern: /variable\s+(\w+)\s+is already defined/i,
    title: '变量重复定义',
    extractOriginal: (m) => m[0],
    analysis: (m) => `变量「${m[1]}」在同一作用域内被重复声明。`,
    suggestion: '检查同作用域内是否重复声明；将内层变量改名；或将外层变量移出当前作用域。',
  },
  {
    id: 'JAVAC-UNREACHABLE-STATEMENT',
    level: 'error',
    pattern: /unreachable statement/i,
    title: '不可达语句',
    extractOriginal: (m) => m[0],
    analysis: () => '编译器检测到某条语句永远不会被执行（如 return / throw / break 后续的语句）。',
    suggestion: '删除不可达代码；检查循环条件是否恒为 true/false；将逻辑重排。',
  },
  {
    id: 'JAVAC-UNREPORTED-EXCEPTION',
    level: 'error',
    pattern: /unreported exception\s+([\w.]+?)[\s;]/i,
    title: '异常未处理',
    extractOriginal: (m) => m[0],
    analysis: (m) => `方法抛出的受检异常「${m[1]}」未被捕获也未在 throws 中声明。`,
    suggestion: '使用 try/catch 捕获该异常；或在方法签名上添加 throws XxxException；考虑包装为 RuntimeException。',
  },
  {
    id: 'JAVAC-EXCEPTION-NEVER-THROWN',
    level: 'error',
    pattern: /exception\s+([\w.]+)\s+is never thrown in body of corresponding try/i,
    title: 'try 中未抛出该异常',
    extractOriginal: (m) => m[0],
    analysis: (m) => `catch 子句捕获的异常「${m[1]}」在 try 块中永远不会被抛出。`,
    suggestion: '删除多余的 catch 子句；或将捕获异常改为更通用的 Exception；检查 try 块代码是否正确。',
  },
  {
    id: 'JAVAC-TRY-WITHOUT-CATCH',
    level: 'error',
    pattern: /error:\s*['"]?try['"]?\s+without (?:catch|finally)/i,
    title: 'try 缺少 catch 或 finally',
    extractOriginal: (m) => m[0],
    analysis: () => 'try 块必须紧随至少一个 catch 或 finally 子句。',
    suggestion: '为 try 添加 catch 或 finally；或改用 try-with-resources 语法。',
  },
  {
    id: 'JAVAC-CATCH-WITHOUT-TRY',
    level: 'error',
    pattern: /error:\s*['"]?catch['"]?\s+without try/i,
    title: 'catch 缺少 try',
    extractOriginal: (m) => m[0],
    analysis: () => 'catch 子句必须紧跟在 try 块之后，可能因为 try 块缺失或大括号不匹配。',
    suggestion: '检查 catch 前是否有对应的 try；确认 { } 配对正确。',
  },
  {
    id: 'JAVAC-MALFORMED-FLOATING',
    level: 'error',
    pattern: /malformed floating point literal/i,
    title: '浮点字面量格式错误',
    extractOriginal: (m) => m[0],
    analysis: () => '浮点数字面量格式不正确，可能因为多余的 .、缺少数字、或非法的指数表示。',
    suggestion: '检查浮点字面量是否符合 Java 规范，如 1.0 / 1.0e10 / 1.0f / 1.0d。',
  },
  {
    id: 'JAVAC-INTEGER-TOO-LARGE',
    level: 'error',
    pattern: /integer number too large/i,
    title: '整数字面量过大',
    extractOriginal: (m) => m[0],
    analysis: () => '整数字面量超出了 int 的最大值（2147483647），需要显式标记为 long。',
    suggestion: '在数字末尾添加 L 或 l（推荐 L）：如 2147483648L；或检查数字是否拼写错误。',
  },
  {
    id: 'JAVAC-UNCLOSED-CHAR',
    level: 'error',
    pattern: /unclosed character literal/i,
    title: '字符字面量未闭合',
    extractOriginal: (m) => m[0],
    analysis: () => '字符字面量（单引号包围）缺少右单引号，或字符字面量中包含多个字符。',
    suggestion: '检查 \' 配对；字符字面量只能包含一个字符，多字符请用字符串 ""。',
  },
  {
    id: 'JAVAC-EMPTY-CHAR',
    level: 'error',
    pattern: /empty character literal/i,
    title: '空字符字面量',
    extractOriginal: (m) => m[0],
    analysis: () => '字符字面量中没有任何字符（\'\'），Java 不允许空字符。',
    suggestion: '若需表示空字符，使用 \'\\u0000\' 或 Character.MIN_VALUE；或改为字符串 ""。',
  },
  {
    id: 'JAVAC-INVALID-ESCAPE',
    level: 'error',
    pattern: /invalid escape sequence/i,
    title: '无效转义序列',
    extractOriginal: (m) => m[0],
    analysis: () => '字符串或字符字面量中使用了非法的转义序列（如 \\d）。Java 仅支持 \\n \\t \\\\ \\\' \\" \\r \\b \\f \\uXXXX。',
    suggestion: '检查 \\ 后的字符；若需表示 Windows 路径，请使用 / 或 \\\\；正则中需双倍转义。',
  },

  // ===========================================================================
  // 10. Forge 模组特定（扩展，Task 8-C）
  // ===========================================================================
  {
    id: 'FORGE-MISSING-MOD-DEP',
    level: 'error',
    pattern: /Missing (?:mods?|mod dependency|required dependency)/i,
    title: '缺少模组依赖',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 300).split('\n').slice(0, 6).join('\n').trim()
    },
    analysis: () => 'Forge 报告缺少模组依赖。当前模组 mods.toml 中声明了依赖但游戏目录中未安装对应模组。',
    suggestion: '检查 mods.toml 中的 dependencies 块；下载并安装依赖模组到 mods 文件夹；或将依赖标记为 optional。',
  },
  {
    id: 'FORGE-FMLCOMMON-SETUP-ERROR',
    level: 'error',
    pattern: /FMLCommonSetupEvent[^\n]*(?:error|exception|failed)/i,
    title: '通用设置阶段异常',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 300).split('\n').slice(0, 6).join('\n').trim()
    },
    analysis: () => '模组在 FMLCommonSetupEvent 事件回调中抛出异常，通常因为：阻塞主线程、访问未注册对象、注册阶段不当时机。',
    suggestion: '检查 FMLCommonSetupEvent 监听器代码；使用 enqueueWork 处理需要主线程的操作；确认 DeferredRegister 已完成注册。',
  },
  {
    id: 'FORGE-CLIENT-SETUP-ERROR',
    level: 'error',
    pattern: /ClientSetupEvent[^\n]*(?:error|exception|failed)/i,
    title: '客户端设置阶段异常',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 300).split('\n').slice(0, 6).join('\n').trim()
    },
    analysis: () => '模组在 ClientSetupEvent 事件回调中抛出异常，通常因为：客户端注册（渲染器/屏幕）失败、缺少客户端依赖。',
    suggestion: '检查 ClientSetupEvent 监听器；使用 enqueueWork 处理需要在主线程完成的注册；分离客户端与服务端代码。',
  },
  {
    id: 'FORGE-BLOCK-REGISTRATION-FAIL',
    level: 'error',
    pattern: /(?:Block registration failed|Failed to register block)/i,
    title: '方块注册失败',
    extractOriginal: (m) => m[0],
    analysis: () => '方块注册到 Forge 注册表时失败，可能因为注册名重复、非法字符、或注册时机错误。',
    suggestion: '检查 DeferredRegister.create(ForgeRegistries.BLOCKS, MODID) 是否在 mod 构造时调用；注册名仅使用 [a-z0-9_]。',
  },
  {
    id: 'FORGE-ITEM-REGISTRATION-FAIL',
    level: 'error',
    pattern: /(?:Item registration failed|Failed to register item)/i,
    title: '物品注册失败',
    extractOriginal: (m) => m[0],
    analysis: () => '物品注册失败，可能因为注册名冲突、BlockItem 与 Block 注册名不匹配、或 Properties 配置错误。',
    suggestion: '检查 DeferredRegister.create(ForgeRegistries.ITEMS, MODID)；确保 BlockItem 与对应 Block 注册名一致。',
  },
  {
    id: 'FORGE-ENTITY-REGISTRATION-FAIL',
    level: 'error',
    pattern: /(?:Entity (?:registration|type) (?:failed|error)|Failed to register entity)/i,
    title: '实体注册失败',
    extractOriginal: (m) => m[0],
    analysis: () => '实体类型注册失败，可能因为 EntityType.Builder 配置错误、客户端渲染器未注册、或注册名冲突。',
    suggestion: '检查 EntityType.Builder 配置（size, spawnable）；在客户端注册渲染器：EntityRenderersEvent.RegisterRenderers。',
  },
  {
    id: 'FORGE-MOD-ANNOTATION-MISSING',
    level: 'error',
    pattern: /(?:@Mod annotation missing|Mod annotation not found|Missing @Mod annotation)/i,
    title: '缺少 @Mod 注解',
    extractOriginal: (m) => m[0],
    analysis: () => 'Forge 在主入口类上找不到 @Mod 注解，无法识别该模组。',
    suggestion: '在主类上添加 @Mod("modid")；modid 必须与 mods.toml 中的 modId 一致；确认主类已在 META-INF/MANIFEST.MF 中声明。',
  },
  {
    id: 'FORGE-MODID-MISMATCH',
    level: 'error',
    pattern: /modid? (?:mismatch|does not match)/i,
    title: 'modId 不匹配',
    extractOriginal: (m) => m[0],
    analysis: () => '代码中 @Mod 注解的 modid 与 mods.toml 中的 modId 不一致，Forge 拒绝加载。',
    suggestion: '统一 @Mod 注解与 mods.toml 的 modId（小写字母数字下划线）；建议提取为常量统一引用。',
  },
  {
    id: 'FORGE-VERSION-MISMATCH',
    level: 'error',
    pattern: /(?:mod|forge) version (?:mismatch|range|requirement)/i,
    title: '版本不匹配',
    extractOriginal: (m) => m[0],
    analysis: () => '模组声明的 Forge 版本范围与当前运行的 Forge 版本不匹配，可能因为 mods.toml 的 versionRange 设置过窄。',
    suggestion: '修改 mods.toml 中的 forgeVersion range，如 [47,) 表示 Forge 47+；确认 MC 版本与 Forge 版本兼容。',
  },
  {
    id: 'FORGE-EVENT-BUS-ERROR',
    level: 'error',
    pattern: /(?:EventBus|event bus) (?:error|exception|failed)/i,
    title: '事件总线异常',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 300).split('\n').slice(0, 6).join('\n').trim()
    },
    analysis: () => 'Forge EventBus 在分发事件时抛出异常，可能因为：监听器方法签名错误、访问私有字段、事件类型不匹配。',
    suggestion: '检查 @SubscribeEvent 注解的方法签名（必须为 public void, 单一事件参数）；确认事件类型存在；查看 Caused by。',
  },
  {
    id: 'FORGE-CHANNEL-REG-FAIL',
    level: 'error',
    pattern: /(?:channel|network) registration failed/i,
    title: '网络通道注册失败',
    extractOriginal: (m) => m[0],
    analysis: () => 'SimpleChannel/网络通道注册失败，可能因为通道名冲突、版本不匹配、或注册时机错误。',
    suggestion: '检查 SimpleChannel.INSTANCE 的 channelName 唯一性；确认注册在 MOD Event Bus 上；使用 NetworkRegistry.newSimpleChannel。',
  },
  {
    id: 'FORGE-DUPLICATE-REGISTRY',
    level: 'error',
    pattern: /(?:Duplicate registry (?:entry|name)|Registry already contains key)/i,
    title: '注册表条目重复',
    extractOriginal: (m) => m[0],
    analysis: () => '尝试注册的注册表条目已存在，Forge 注册表禁止重复注册同名条目。',
    suggestion: '检查所有 DeferredRegister 注册项的注册名是否唯一；可能存在重复的注册调用；分离客户端/服务端共享对象。',
  },

  // ===========================================================================
  // 11. Gradle 构建错误（扩展，Task 8-C）
  // ===========================================================================
  {
    id: 'GRADLE-TASK-EXECUTION-FAILED',
    level: 'error',
    pattern: /Execution failed for task\s+'([^']+)'/i,
    title: '任务执行失败',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(Math.max(0, idx - 100), idx + 300).trim()
    },
    analysis: (m) => `任务「${m[1]}」执行失败。Gradle 会在其后输出具体原因。`,
    suggestion: '查看 * What went wrong: 段落；尝试 ./gradlew <task> --stacktrace 获取详细堆栈；查看具体失败原因。',
    fixAction: () => ({
      label: '查看详细堆栈',
      action: 'fix.show-stacktrace',
    }),
  },
  {
    id: 'GRADLE-CIRCULAR-DEPENDENCY',
    level: 'error',
    pattern: /Circular dependency/i,
    title: '任务循环依赖',
    extractOriginal: (m) => m[0],
    analysis: () => 'Gradle 任务之间存在循环依赖（taskA 依赖 taskB，taskB 又依赖 taskA），无法构建 DAG。',
    suggestion: '检查 build.gradle 中的 dependsOn / mustRunAfter / finalizedBy 配置；拆分循环依赖的任务。',
  },
  {
    id: 'GRADLE-CONFIG-RESOLUTION-FAILED',
    level: 'error',
    pattern: /Configuration resolution failed[^\n]*for configuration\s+'([^']+)'/i,
    title: '配置解析失败',
    extractOriginal: (m) => m[0],
    analysis: (m) => `配置「${m[1]}」解析失败，Gradle 无法确定该配置的所有依赖。`,
    suggestion: '使用 ./gradlew dependencies --configuration <name> 查看；检查该配置中的依赖声明是否正确。',
  },
  {
    id: 'GRADLE-PLUGIN-NOT-FOUND',
    level: 'error',
    pattern: /Plugin (?:with id|not found)[^\n]*['"]([\w.-]+)['"]/i,
    title: '插件未找到',
    extractOriginal: (m) => m[0],
    analysis: (m) => `Gradle 找不到 ID 为「${m[1]}」的插件，可能因为：plugin 未在 settings.gradle 的 pluginManagement 中声明、仓库未配置、插件 ID 拼写错误。`,
    suggestion: '在 settings.gradle 的 pluginManagement.repositories 中添加 gradlePluginPortal()；核对插件 ID；考虑改用 buildscript.classpath 方式。',
  },
  {
    id: 'GRADLE-PLUGIN-VERSION-MISMATCH',
    level: 'warn',
    pattern: /Plugin version (?:mismatch|conflict)/i,
    title: '插件版本冲突',
    extractOriginal: (m) => m[0],
    analysis: () => '多个子项目或多个位置声明了同一插件的不同版本，Gradle 自动选择最高版本但可能与代码不兼容。',
    suggestion: '在 root build.gradle 的 plugins 块统一声明版本；使用 plugins {} DSL 而非 apply plugin:。',
  },
  {
    id: 'GRADLE-VERSION-TOO-OLD',
    level: 'error',
    pattern: /(?:Gradle version too old|Minimum supported Gradle version is)\s*([\d.]+)/i,
    title: 'Gradle 版本过低',
    extractOriginal: (m) => m[0],
    analysis: (m) => `当前 Gradle 版本过低，最低要求为 ${m[1]}。某个插件或 build.gradle 配置需要更新的 Gradle。`,
    suggestion: '使用 gradle wrapper --gradle-version=<version> 升级；或下载新版 Gradle；注意 ForgeGradle 6.x 要求 Gradle 8+。',
  },
  {
    id: 'GRADLE-VERSION-TOO-NEW',
    level: 'warn',
    pattern: /(?:Gradle version too new|Maximum supported Gradle version is)\s*([\d.]+)/i,
    title: 'Gradle 版本过高',
    extractOriginal: (m) => m[0],
    analysis: (m) => `当前 Gradle 版本过高，最高支持为 ${m[1]}。某个插件尚未适配新版本 Gradle。`,
    suggestion: '降级 Gradle：gradle wrapper --gradle-version=<version>；检查插件是否有更新版本支持新版 Gradle。',
  },
  {
    id: 'GRADLE-UNSUPPORTED-CLASS-FILE',
    level: 'error',
    pattern: /Unsupported class file major version\s+(\d+)/i,
    title: '不支持的字节码版本',
    extractOriginal: (m) => m[0],
    analysis: (m) => `JDK 编译出的字节码版本（major version ${m[1]}）高于 Gradle/插件能识别的版本。`,
    suggestion: '升级 Gradle 到支持该 JDK 的版本；或降级 JDK；可在 build.gradle 中使用 toolchain 指定较低版本 JDK 编译。',
  },
  {
    id: 'GRADLE-JAVA-VERSION-MISMATCH',
    level: 'error',
    pattern: /Java (?:home does not match|version mismatch|version is incompatible)/i,
    title: 'Java 版本不匹配',
    extractOriginal: (m) => m[0],
    analysis: () => 'Gradle 使用的 JDK 版本与项目要求的不一致，可能 JAVA_HOME 指向错误版本。',
    suggestion: '检查 JAVA_HOME 与 java -version；在 build.gradle 使用 java.toolchain.languageVersion 指定；或使用 gradle.properties 中的 org.gradle.java.home。',
  },
  {
    id: 'GRADLE-TOOLCHAIN-NOT-FOUND',
    level: 'error',
    pattern: /(?:No matching|Toolchain not found) (?:toolchain|JDK)/i,
    title: '找不到 Toolchain',
    extractOriginal: (m) => m[0],
    analysis: () => 'Gradle 找不到符合 toolchain 配置的 JDK 安装。',
    suggestion: '在 gradle.properties 配置 org.gradle.java.installations.paths；使用 sdkman / jenv 管理 JDK；考虑启用 auto-detection。',
  },
  {
    id: 'GRADLE-SOURCE-COMPAT-MISMATCH',
    level: 'warn',
    pattern: /sourceCompatibility (?:mismatch|conflict)/i,
    title: '源码兼容版本不匹配',
    extractOriginal: (m) => m[0],
    analysis: () => 'sourceCompatibility 与项目实际使用的 Java 语法不匹配，可能导致编译错误或运行时兼容性问题。',
    suggestion: '在 build.gradle 中明确设置 java { sourceCompatibility = JavaVersion.VERSION_17 }；MC 1.20.1 要求 Java 17。',
  },
  {
    id: 'GRADLE-TARGET-COMPAT-MISMATCH',
    level: 'warn',
    pattern: /targetCompatibility (?:mismatch|conflict)/i,
    title: '目标兼容版本不匹配',
    extractOriginal: (m) => m[0],
    analysis: () => 'targetCompatibility 与运行时 JDK 不匹配，可能导致运行时 UnsupportedClassVersionError。',
    suggestion: '在 build.gradle 中明确设置 java { targetCompatibility = JavaVersion.VERSION_17 }；与 sourceCompatibility 保持一致。',
  },
  {
    id: 'GRADLE-COMPILE-JAVA-FAILED',
    level: 'error',
    pattern: /:compileJava\s+FAILED/i,
    title: 'compileJava 任务失败',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(Math.max(0, idx - 200), idx + 200).trim()
    },
    analysis: () => ':compileJava 任务失败，javac 编译源码时出错。',
    suggestion: '查看其上方的 javac 错误信息（cannot find symbol / incompatible types 等）；逐一修复编译错误。',
  },
  {
    id: 'GRADLE-PROCESS-RESOURCES-FAILED',
    level: 'error',
    pattern: /:processResources\s+FAILED/i,
    title: 'processResources 任务失败',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(Math.max(0, idx - 200), idx + 200).trim()
    },
    analysis: () => ':processResources 任务失败，通常是资源文件配置错误（如 mods.toml 语法错误、占位符未替换、文件不存在）。',
    suggestion: '检查 src/main/resources/META-INF/mods.toml 语法；确认 expand 占位符变量都存在；查看具体 Caused by。',
  },
  {
    id: 'GRADLE-JAR-TASK-FAILED',
    level: 'error',
    pattern: /:jar\s+FAILED/i,
    title: 'jar 任务失败',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(Math.max(0, idx - 200), idx + 200).trim()
    },
    analysis: () => ':jar 任务失败，可能因为：缺少 manifest、源文件不存在、文件被占用、磁盘空间不足。',
    suggestion: '检查 build.gradle 的 jar { manifest { ... } }；确认源文件路径正确；关闭占用文件的程序。',
  },
  {
    id: 'GRADLE-REOBF-JAR-FAILED',
    level: 'error',
    pattern: /:reobfJar\s+FAILED|reobfJar (?:failed|error)/i,
    title: 'reobfJar 任务失败',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(Math.max(0, idx - 200), idx + 200).trim()
    },
    analysis: () => 'ForgeGradle 的 reobfJar 任务失败，该任务将开发环境的 SRG 名重新混淆回生产环境的 SRG 名。失败原因通常是 mappings 配置错误或 ForgeGradle 版本不兼容。',
    suggestion: '确认 build.gradle 的 minecraft { mappings channel: "official", version: "1.20.1" }；检查 ForgeGradle 版本（6.0.x）；尝试 ./gradlew --refresh-dependencies。',
  },

  // ===========================================================================
  // 12. 网络/权限错误（扩展，Task 8-C）
  // ===========================================================================
  {
    id: 'NET-SSL-HANDSHAKE',
    level: 'error',
    pattern: /(?:SSL handshake failed|SSLHandshakeException)/i,
    title: 'SSL 握手失败',
    extractOriginal: (m) => m[0],
    analysis: () => 'SSL/TLS 握手失败，可能因为：服务端证书不受信任、TLS 版本不匹配、证书链不完整、客户端缺少根证书。',
    suggestion: '检查 JDK 的 cacerts 是否包含服务端根证书；尝试升级 JDK；临时可用 -Dtrust.store 指定；切勿在生产环境禁用 SSL 验证。',
  },
  {
    id: 'NET-CERT-EXPIRED',
    level: 'error',
    pattern: /(?:certificate (?:has )?expired|CertPathValidatorException)/i,
    title: '证书已过期',
    extractOriginal: (m) => m[0],
    analysis: () => '服务端 SSL 证书已过期，JVM 拒绝建立连接。',
    suggestion: '联系服务端运维更新证书；如果是私有 Nexus/Artifactory，请管理员续签；临时可在客户端调整系统时间（不推荐）。',
  },
  {
    id: 'NET-UNKNOWN-HOST',
    level: 'error',
    pattern: /(?:Unknown host|UnknownHostException)[:\s]+([^\n]+)/i,
    title: '未知主机',
    extractOriginal: (m) => m[0],
    analysis: (m) => `无法解析主机名：${m[1].trim()}。DNS 无法将该主机名解析为 IP 地址。`,
    suggestion: '检查主机名拼写；确认 DNS 配置正常（nslookup 测试）；如需配置 hosts，编辑 /etc/hosts；切换镜像源。',
    fixAction: () => ({
      label: '切换镜像源',
      action: 'fix.configure-mirror',
      payload: { mirrorId: 'aliyun' },
    }),
  },
  {
    id: 'NET-NETWORK-UNREACHABLE',
    level: 'error',
    pattern: /(?:Network is unreachable|network unreachable)/i,
    title: '网络不可达',
    extractOriginal: (m) => m[0],
    analysis: () => '本机网络无法到达目标地址，可能因为：网线未连接、Wi-Fi 断开、路由问题、IPv6/IPv4 不匹配。',
    suggestion: '检查本机网络连接（ping 测试）；尝试切换 IPv4/IPv6；确认无防火墙阻断；查看路由表。',
  },
  {
    id: 'NET-PROXY-AUTH',
    level: 'error',
    pattern: /(?:407 Proxy Authentication Required|proxy authentication required)/i,
    title: '代理认证失败',
    extractOriginal: (m) => m[0],
    analysis: () => 'HTTP 代理要求认证，Gradle 未配置代理凭证或凭证错误。',
    suggestion: '在 gradle.properties 配置 systemProp.http.proxyUser / systemProp.http.proxyPassword；或更换无代理网络。',
  },
  {
    id: 'NET-HTTP-404',
    level: 'warn',
    pattern: /(?:HTTP 404|404 Not Found|status code: 404)/i,
    title: '资源不存在（404）',
    extractOriginal: (m) => m[0],
    analysis: () => '请求的 URL 返回 404，资源在该地址不存在。',
    suggestion: '检查 URL 是否拼写正确；确认资源未被迁移；尝试切换镜像源；联系仓库管理员。',
    fixAction: () => ({
      label: '切换镜像源',
      action: 'fix.configure-mirror',
      payload: { mirrorId: 'aliyun' },
    }),
  },
  {
    id: 'NET-HTTP-500',
    level: 'warn',
    pattern: /(?:HTTP 500|500 Internal Server Error|status code: 500)/i,
    title: '服务器内部错误（500）',
    extractOriginal: (m) => m[0],
    analysis: () => '远端服务器内部错误，通常是仓库服务端临时故障。',
    suggestion: '稍后重试；切换到镜像源；联系服务端运维；查看 status.mojang.com / status.maven.org 是否有公告。',
    fixAction: () => ({
      label: '切换镜像源',
      action: 'fix.configure-mirror',
      payload: { mirrorId: 'aliyun' },
    }),
  },
  {
    id: 'NET-CONNECTION-RESET',
    level: 'warn',
    pattern: /Connection reset(?:\s+by peer)?/i,
    title: '连接被重置',
    extractOriginal: (m) => m[0],
    analysis: () => '对端重置了连接，可能因为：服务端关闭、网络中断、防火墙拦截、TLS 协商失败。',
    suggestion: '检查网络稳定性；切换镜像源；重试任务；为 Gradle 配置较长的超时时间。',
    fixAction: () => ({
      label: '切换镜像源',
      action: 'fix.configure-mirror',
      payload: { mirrorId: 'aliyun' },
    }),
  },

  // ===========================================================================
  // 13. ForgeGradle 特定错误（Task 8-C）
  // ===========================================================================
  {
    id: 'FG-NOT-CONFIGURED',
    level: 'error',
    pattern: /ForgeGradle (?:plugin not applied|not configured|not found)/i,
    title: 'ForgeGradle 未配置',
    extractOriginal: (m) => m[0],
    analysis: () => 'build.gradle 中未正确应用 ForgeGradle 插件，无法执行 MC 模组构建任务。',
    suggestion: '在 build.gradle 顶部添加：apply plugin: \'net.minecraftforge.gradle\' 或使用 plugins { id \'net.minecraftforge.gradle\' version \'6.0.+\' }；确认 settings.gradle 配置了 pluginManagement。',
  },
  {
    id: 'FG-MAPPINGS-NOT-FOUND',
    level: 'error',
    pattern: /(?:Failed to find mappings|Could not find mappings|Mappings not found)/i,
    title: 'ForgeGradle mappings 缺失',
    extractOriginal: (m) => m[0],
    analysis: () => 'ForgeGradle 无法找到指定的 mappings，可能因为 channel/version 错误或网络无法访问 Minecraft Forge Maven。',
    suggestion: '在 minecraft { mappings channel: "official", version: "1.20.1" } 中确认 channel 与 version；切换镜像源；尝试 ./gradlew --refresh-dependencies。',
    fixAction: () => ({
      label: '查看 mappings 文档',
      action: 'fix.show-mappings-doc',
    }),
  },
  {
    id: 'FG-REOBF-FAILED',
    level: 'error',
    pattern: /reobf (?:failed|error)/i,
    title: 'reobf 任务失败',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 300).split('\n').slice(0, 6).join('\n').trim()
    },
    analysis: () => 'ForgeGradle reobf 任务失败（重新混淆），可能因为 mappings 与 Forge 版本不匹配、jar 中包含未映射的类。',
    suggestion: '确认 mappings channel/version 与 minecraft version 一致；检查是否有第三方库被错误打包进 jar；使用 ./gradlew --stacktrace 查看详情。',
  },
  {
    id: 'FG-CREATE-REOBF-ARTIFACTS-FAILED',
    level: 'error',
    pattern: /createReobfArtifacts (?:failed|error)/i,
    title: 'createReobfArtifacts 失败',
    extractOriginal: (m) => m[0],
    analysis: () => 'ForgeGradle 创建 reobf 制品任务失败，通常依赖 reobfJar 任务的成功。',
    suggestion: '先修复 reobfJar 的错误；检查 build.gradle 的 reobf { ... } 配置；确认 artifacts 配置正确。',
  },
  {
    id: 'FG-SETUP-DECOMP-WORKSPACE-FAILED',
    level: 'error',
    pattern: /setupDecompWorkspace (?:failed|error)/i,
    title: 'setupDecompWorkspace 失败',
    extractOriginal: (m) => m[0],
    analysis: () => 'ForgeGradle 的 setupDecompWorkspace 任务失败（反编译 MC 源码），可能因为 mappings 损坏、反编译工具冲突、缓存损坏。',
    suggestion: '清理 Gradle 缓存：./gradlew clean --refresh-dependencies；删除 ~/.gradle/caches/forge_gradle；尝试降低 mappings 版本。',
  },
  {
    id: 'FG-GEN-IDE-FAILED',
    level: 'warn',
    pattern: /gen(?:Intellij|Eclipse|VSCode)Runs (?:failed|error)/i,
    title: 'IDE 运行配置生成失败',
    extractOriginal: (m) => m[0],
    analysis: () => 'ForgeGradle 生成 IDE 运行配置任务失败，可能因为已有运行配置冲突、IDE 项目文件被占用。',
    suggestion: '关闭 IDE 后重试；删除 .idea/runConfigurations 或 .launch 目录；手动在 IDE 中创建运行配置。',
  },
  {
    id: 'FG-GRADLE-START-FAILED',
    level: 'error',
    pattern: /GradleStart(?:Server|Client)? (?:failed|error|exception)/i,
    title: 'GradleStart 启动失败',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 300).split('\n').slice(0, 6).join('\n').trim()
    },
    analysis: () => 'ForgeGradle GradleStart（开发环境启动 MC）失败，可能因为：模组加载错误、资源缺失、运行参数错误。',
    suggestion: '查看 Caused by 行；先确保 :compileJava :processResources 成功；检查 run/client.args.txt 是否生成。',
  },
  {
    id: 'FG-USERDEV-DATA-MISMATCH',
    level: 'error',
    pattern: /ForgeUserDev(?: data)? mismatch/i,
    title: 'ForgeUserDev 数据不匹配',
    extractOriginal: (m) => m[0],
    analysis: () => 'ForgeGradle UserDev 包数据与本地缓存不匹配，可能因为升级 Forge 后未清理缓存。',
    suggestion: '删除 ~/.gradle/caches/forge_gradle/maven_downloader；运行 ./gradlew --refresh-dependencies；重新执行 setupDecompWorkspace。',
  },
  {
    id: 'FG-ASSET-INDEX-NOT-FOUND',
    level: 'error',
    pattern: /asset index (?:not found|missing)/i,
    title: '资源索引未找到',
    extractOriginal: (m) => m[0],
    analysis: () => 'MC 资源索引（assets/index/<version>.json）未找到，可能因为版本号拼写错误或网络问题。',
    suggestion: '检查 build.gradle 的 assetIndex.version；切换镜像源；尝试 ./gradlew --refresh-dependencies。',
    fixAction: () => ({
      label: '切换镜像源',
      action: 'fix.configure-mirror',
      payload: { mirrorId: 'aliyun' },
    }),
  },
  {
    id: 'FG-ASSET-DOWNLOAD-FAILED',
    level: 'warn',
    pattern: /(?:Failed to download asset|asset download failed)/i,
    title: '资源下载失败',
    extractOriginal: (m) => m[0],
    analysis: () => '从 Mojang 资源服务器下载资源文件失败，通常因为网络问题或被墙。',
    suggestion: '使用 BMCLAPI 镜像（在 gradle.properties 配置）；切换网络；重试 ./gradlew downloadAssets。',
    fixAction: () => ({
      label: '切换镜像源',
      action: 'fix.configure-mirror',
      payload: { mirrorId: 'aliyun' },
    }),
  },

  // ===========================================================================
  // 14. 资源/数据包错误（Task 8-C）
  // ===========================================================================
  {
    id: 'RES-PACK-VERSION-MISMATCH',
    level: 'error',
    pattern: /Resource pack version mismatch[^\n]*(?:expected\s+(\d+)[^\n]*found\s+(\d+))?/i,
    title: '资源包版本不匹配',
    extractOriginal: (m) => m[0],
    analysis: (m) => `资源包 pack_format 与 MC 版本不匹配${m[1] ? `（期望 ${m[1]}，实际 ${m[2]}）` : ''}。`,
    suggestion: '在 pack.mcmeta 中更新 pack_format：MC 1.20.1 对应 15；或使用 pack_format 范围语法（Forge 支持）。',
  },
  {
    id: 'DATAPACK-VERSION-MISMATCH',
    level: 'error',
    pattern: /Data pack version mismatch[^\n]*(?:expected\s+(\d+)[^\n]*found\s+(\d+))?/i,
    title: '数据包版本不匹配',
    extractOriginal: (m) => m[0],
    analysis: (m) => `数据包 pack_format 与 MC 版本不匹配${m[1] ? `（期望 ${m[1]}，实际 ${m[2]}）` : ''}。`,
    suggestion: '在数据包 pack.mcmeta 中更新 pack_format：MC 1.20.1 对应 15；与资源包通常使用相同 pack_format。',
  },
  {
    id: 'RES-INVALID-JSON',
    level: 'error',
    pattern: /(?:Invalid JSON in resource|Malformed JSON|com\.google\.gson\.JsonParseException)/i,
    title: '资源 JSON 格式错误',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 200).trim()
    },
    analysis: () => '资源文件 JSON 格式错误，可能因为：多余逗号、缺少引号、注释（JSON 不支持）、字符编码问题。',
    suggestion: '使用 JSONLint 或 IDE 校验 JSON；移除注释；确认使用 UTF-8 编码；检查逗号、引号、括号配对。',
  },
  {
    id: 'RES-MISSING-TEXTURE',
    level: 'warn',
    pattern: /Missing texture[^\n]*[:\s]+([^\n]+)/i,
    title: '纹理缺失',
    extractOriginal: (m) => m[0],
    analysis: (m) => `纹理缺失：${m[1].trim()}。MC 会用紫黑方块替代。`,
    suggestion: '在 src/main/resources/assets/<modid>/textures/ 下创建对应 PNG；确认路径与模型 JSON 中引用一致；区分大小写。',
  },
  {
    id: 'RES-MISSING-MODEL',
    level: 'error',
    pattern: /Missing model[^\n]*[:\s]+([^\n]+)/i,
    title: '模型缺失',
    extractOriginal: (m) => m[0],
    analysis: (m) => `模型缺失：${m[1].trim()}。方块/物品会显示为缺失模型（紫黑方块）。`,
    suggestion: '在 src/main/resources/assets/<modid>/models/ 下创建对应 JSON；确认 blockstate 中引用的模型路径正确。',
  },
  {
    id: 'RES-MISSING-BLOCKSTATE',
    level: 'error',
    pattern: /Missing blockstate[^\n]*[:\s]+([^\n]+)/i,
    title: 'Blockstate 缺失',
    extractOriginal: (m) => m[0],
    analysis: (m) => `Blockstate 缺失：${m[1].trim()}。方块会显示为空气或紫黑方块。`,
    suggestion: '在 src/main/resources/assets/<modid>/blockstates/ 下创建 <registry_name>.json；确认注册名与文件名完全一致。',
  },
  {
    id: 'RES-MISSING-SOUND',
    level: 'warn',
    pattern: /Missing sound[^\n]*[:\s]+([^\n]+)/i,
    title: '声音缺失',
    extractOriginal: (m) => m[0],
    analysis: (m) => `声音事件缺少对应音频文件：${m[1].trim()}。`,
    suggestion: '在 src/main/resources/assets/<modid>/sounds/ 下放置 .ogg 文件；更新 sounds.json 中的 sounds 数组。',
  },
  {
    id: 'RES-INVALID-ADVANCEMENT',
    level: 'error',
    pattern: /(?:Invalid advancement|Failed to load advancement)[^\n]*[:\s]+([^\n]+)/i,
    title: '进度（advancement）无效',
    extractOriginal: (m) => m[0],
    analysis: (m) => `进度文件无效：${m[1].trim()}。可能因为 JSON 语法错误、字段缺失、或 parent 引用不存在。`,
    suggestion: '在 src/main/resources/data/<modid>/advancement/ 下检查 JSON；确认 parent 路径正确；检查 criteria 字段。',
  },

  // ===========================================================================
  // 15. 运行时错误（Task 8-C）
  // ===========================================================================
  {
    id: 'RT-NPE',
    level: 'error',
    pattern: /java\.lang\.NullPointerException/i,
    title: '空指针异常',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 300).split('\n').slice(0, 6).join('\n').trim()
    },
    analysis: () => '在 null 引用上调用方法或访问字段时抛出 NullPointerException。Java 默认不打印具体变量名（除非启用 -XX:+ShowCodeDetailsInExceptionMessages）。',
    suggestion: '查看堆栈第一帧（at your.package...）定位代码；添加 null 检查；使用 Optional 或 Objects.requireNonNull；启用 -XX:+ShowCodeDetailsInExceptionMessages（JDK 14+）。',
  },
  {
    id: 'RT-CLASS-CAST',
    level: 'error',
    pattern: /java\.lang\.ClassCastException[:\s]+([^\n]+)/i,
    title: '类型转换异常',
    extractOriginal: (m) => m[0],
    analysis: (m) => `尝试将对象转换为不兼容的类型：${m[1].trim()}。`,
    suggestion: '使用 instanceof 先检查类型；查看堆栈定位代码；检查泛型类型擦除问题；确认集合元素类型。',
  },
  {
    id: 'RT-ARRAY-INDEX-OOB',
    level: 'error',
    pattern: /java\.lang\.ArrayIndexOutOfBoundsException[:\s]+Index\s+(\d+)\s+out of bounds for length\s+(\d+)/i,
    title: '数组越界',
    extractOriginal: (m) => m[0],
    analysis: (m) => `访问数组下标 ${m[1]} 但数组长度仅为 ${m[2]}。`,
    suggestion: '在循环/访问前检查 index < array.length；查看堆栈定位代码；考虑使用 List 替代裸数组。',
  },
  {
    id: 'RT-ILLEGAL-ARG',
    level: 'error',
    pattern: /java\.lang\.IllegalArgumentException/i,
    title: '非法参数异常',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 200).trim()
    },
    analysis: () => '方法收到了非法或不合适的参数，通常因为：参数值超范围、null（且方法禁止）、负数等。',
    suggestion: '查看堆栈第一帧定位调用代码；阅读方法 javadoc 了解参数约束；添加参数校验（如 Preconditions.checkArgument）。',
  },
  {
    id: 'RT-ILLEGAL-STATE',
    level: 'error',
    pattern: /java\.lang\.IllegalStateException/i,
    title: '非法状态异常',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 200).trim()
    },
    analysis: () => '对象处于不适当的状态时调用了方法，可能因为：未初始化、已关闭、生命周期错位。',
    suggestion: '查看堆栈定位调用代码；确认对象初始化顺序；检查是否在 dispose 后再次访问。',
  },
  {
    id: 'RT-CONCURRENT-MOD',
    level: 'error',
    pattern: /java\.util\.ConcurrentModificationException/i,
    title: '并发修改异常',
    extractOriginal: (m) => m[0],
    analysis: () => '在遍历集合时同时修改集合（如 foreach 中 remove），JVM 检测到 modCount 不一致。',
    suggestion: '使用 Iterator.remove() 而非 collection.remove()；或使用 CopyOnWriteArrayList / ConcurrentHashMap；Java 8+ 可用 removeIf。',
  },
  {
    id: 'RT-NO-CLASS-DEF',
    level: 'error',
    pattern: /java\.lang\.NoClassDefFoundError[:\s]+([^\n]+)/i,
    title: '类定义未找到',
    extractOriginal: (m) => m[0],
    analysis: (m) => `运行时找不到类定义：${m[1].trim()}。编译时存在但运行时类路径中缺失，或类初始化失败。`,
    suggestion: '检查依赖是否在运行时类路径（runtimeClasspath / runtimeOnly）；可能是该类静态初始化块抛异常（查看 ExceptionInInitializerError）；重新构建。',
  },
  {
    id: 'RT-NO-SUCH-METHOD',
    level: 'error',
    pattern: /java\.lang\.NoSuchMethodError[:\s]+([^\n]+)/i,
    title: '方法未找到',
    extractOriginal: (m) => m[0],
    analysis: (m) => `运行时找不到方法：${m[1].trim()}。编译时存在但运行时类路径中的版本不同。`,
    suggestion: '检查依赖版本冲突（./gradlew dependencyInsight）；清理并重新构建；可能是 Forge API 版本与代码不匹配。',
  },
  {
    id: 'RT-NO-SUCH-FIELD',
    level: 'error',
    pattern: /java\.lang\.NoSuchFieldError[:\s]+([^\n]+)/i,
    title: '字段未找到',
    extractOriginal: (m) => m[0],
    analysis: (m) => `运行时找不到字段：${m[1].trim()}。编译时存在但运行时类路径中的版本不同。`,
    suggestion: '检查依赖版本；可能是 Forge 字段在不同版本中改名（SRG vs MCP）；使用 mappings 的稳定字段。',
  },
  {
    id: 'RT-EXCEPTION-IN-INITIALIZER',
    level: 'error',
    pattern: /java\.lang\.ExceptionInInitializerError/i,
    title: '类初始化异常',
    extractOriginal: (m, fullLog) => {
      const idx = fullLog.indexOf(m[0])
      return fullLog.substring(idx, idx + 400).split('\n').slice(0, 8).join('\n').trim()
    },
    analysis: () => '类的静态初始化块或静态字段初始化时抛出异常，导致类初始化失败。后续访问该类将抛出 NoClassDefFoundError。',
    suggestion: '查看 Caused by 行定位静态块异常；检查静态字段初始化顺序；避免在静态块中执行复杂逻辑。',
  },
]

/**
 * 计算匹配在日志中的行号
 */
function findLineRange(log: string, matchStr: string, length: number): [number, number] {
  const idx = log.indexOf(matchStr)
  if (idx < 0) return [0, 0]
  const before = log.substring(0, idx)
  const startLine = before.split('\n').length
  const matchLines = matchStr.split('\n').length
  return [startLine, startLine + matchLines - 1]
}

/**
 * 生成稳定 ID（基于规则 ID + 行号）
 */
function makeId(ruleId: string, lineRange: [number, number], occurrence: number): string {
  return `${ruleId}-${lineRange[0]}-${lineRange[1]}-${occurrence}`
}

/**
 * 解析 Gradle / javac / Forge 构建日志
 *
 * @param log 原始日志文本
 * @returns 解析出的卡片数组（按出现顺序）
 */
export function parseGradleLog(log: string): ParsedLogCard[] {
  if (!log || typeof log !== 'string') return []

  const cards: ParsedLogCard[] = []
  const occurrenceMap = new Map<string, number>()

  for (const rule of RULES) {
    // 使用全局正则以匹配所有出现位置
    const globalPattern = new RegExp(rule.pattern.source, rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g')
    let m: RegExpExecArray | null
    while ((m = globalPattern.exec(log)) !== null) {
      const matchArr = m as RegExpMatchArray
      // 重建一个 Match 数组（exec 返回的也是 RegExpExecArray，兼容 MatchArray 用法）
      const matchArray: RegExpMatchArray = m as unknown as RegExpMatchArray
      const originalText = rule.extractOriginal(matchArray, log)
      const lineRange = findLineRange(log, m[0], originalText.length)

      const occ = (occurrenceMap.get(rule.id) || 0) + 1
      occurrenceMap.set(rule.id, occ)

      cards.push({
        id: makeId(rule.id, lineRange, occ),
        level: rule.level,
        title: rule.title,
        originalText,
        analysis: resolveField(rule.analysis, matchArray),
        suggestion: resolveField(rule.suggestion, matchArray),
        fixAction: rule.fixAction ? rule.fixAction(matchArray) : undefined,
        lineRange,
        ruleId: rule.id,
      })

      // 防止 0 长度匹配死循环
      if (m.index === globalPattern.lastIndex) {
        globalPattern.lastIndex++
      }
    }
  }

  // 按行号排序，方便阅读
  cards.sort((a, b) => (a.lineRange?.[0] || 0) - (b.lineRange?.[0] || 0))

  return cards
}

/**
 * 获取所有可用规则（用于前端展示规则库 / 调试）
 */
export function listParseRules(): ReadonlyArray<{
  id: string
  level: 'error' | 'warn' | 'info'
  title: string
  pattern: string
}> {
  return RULES.map((r) => ({
    id: r.id,
    level: r.level,
    title: r.title,
    pattern: r.pattern.source,
  }))
}

/**
 * 获取规则数量
 */
export function getRuleCount(): number {
  return RULES.length
}
