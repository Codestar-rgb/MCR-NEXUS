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
 * 至少 18 条规则，后续可继续扩展（工作日志优先级 3 提到要扩展到 100+ 条）
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
