/**
 * NexCube Gradle 构建模拟器（Task 5-C）
 *
 * 目标：在 Web 端模拟真实 Gradle 构建进程的流式输出，让用户在没有
 *      本地 JDK / Gradle 环境时也能体验完整的构建流程。
 *
 * 设计原则：
 *  - 真实时序：每个 Task 有独立 duration（ms），逐行 yield
 *  - 真实格式：日志与 Gradle 8.1.1 实际输出一致（> Task :xxx）
 *  - 随机失败：10% 概率触发已知错误模式（用于测试日志解析引擎）
 *  - AsyncGenerator：调用方 `for await (const chunk of simulateBuild(task))`
 *  - 可中断：返回的 generator 支持 `gen.return()` 提前结束
 *
 * 任务类型支持：
 *  - build        → 完整构建（compileJava → processResources → classes → jar → reobfJar）
 *  - runClient    → 启动 MC 客户端（compileJava + runClient task）
 *  - runServer    → 启动 MC 服务端
 *  - clean        → 清理产物
 */

/* ------------------------------------------------------------------ */
/* 类型与常量                                                          */
/* ------------------------------------------------------------------ */

export interface GradleTask {
  /** 任务名（不含冒号前缀） */
  name: string
  /** 任务持续时间（ms），用于在输出完后等待 */
  duration: number
  /** 该任务的输出行（按顺序逐行 yield） */
  output: string[]
}

/** 构建任务支持类型 */
export type BuildTaskType = 'build' | 'runClient' | 'runServer' | 'clean'

/* ------------------------------------------------------------------ */
/* 任务序列定义                                                        */
/* ------------------------------------------------------------------ */

/** 完整构建序列（build 任务） */
export const BUILD_TASKS: GradleTask[] = [
  {
    name: 'compileJava',
    duration: 2000,
    output: [
      '> Task :compileJava',
      '注: 某些输入文件使用了已过时或已移除的 API。',
      '注: 有关详细信息, 请使用 -Xlint:deprecation 重新编译。',
      '注: 某些输入文件使用了未经检查或不安全的操作。',
      '注: 有关详细信息, 请使用 -Xlint:unchecked 重新编译。',
    ],
  },
  {
    name: 'processResources',
    duration: 800,
    output: [
      '> Task :processResources',
      '> Task :processResources NO-SOURCE',
    ],
  },
  {
    name: 'classes',
    duration: 300,
    output: ['> Task :classes'],
  },
  {
    name: 'jar',
    duration: 1200,
    output: [
      '> Task :jar',
      'Building jar: /projects/nexcube/build/libs/nexcube-1.0.0.jar',
    ],
  },
  {
    name: 'reobfJar',
    duration: 1500,
    output: [
      '> Task :reobfJar',
      'Remapping jar with official mappings (MCP 1.20.1)...',
      'Remapping jar: nexcube-1.0.0.jar → nexcube-1.0.0-all.jar',
    ],
  },
]

/** 启动客户端序列（runClient 任务） */
export const RUN_CLIENT_TASKS: GradleTask[] = [
  {
    name: 'compileJava',
    duration: 1500,
    output: ['> Task :compileJava UP-TO-DATE'],
  },
  {
    name: 'processResources',
    duration: 400,
    output: ['> Task :processResources UP-TO-DATE'],
  },
  {
    name: 'classes',
    duration: 200,
    output: ['> Task :classes UP-TO-DATE'],
  },
  {
    name: 'runClient',
    duration: 4000,
    output: [
      '> Task :runClient',
      '[13:42:01] [main/INFO] [LaunchWrapper]: Loading primary transform class',
      '[13:42:01] [main/INFO] [LaunchWrapper]: Calling tweakers',
      '[13:42:02] [main/INFO] [FML]: Forge Mod Loader version 47.3.7 for Minecraft 1.20.1 loading',
      '[13:42:02] [main/INFO] [FML]: Java 17.0.9 detected',
      '[13:42:03] [main/INFO] [Client thread/INFO]: Setting user: Player',
      '[13:42:04] [main/INFO] [LWJGL Version]: LWJGL Version: 3.3.1',
      '[13:42:06] [main/INFO] [Minecraft]: Created: 1024x1024 textures-atlas',
      '[13:42:07] [main/INFO] [Stdout]: [NexCube] Mod loaded successfully',
      '[13:42:07] [main/INFO] [Stdout]: [NexCube] Registered 3 items, 2 blocks, 1 entity',
    ],
  },
]

/** 启动服务端序列（runServer 任务） */
export const RUN_SERVER_TASKS: GradleTask[] = [
  {
    name: 'compileJava',
    duration: 1500,
    output: ['> Task :compileJava UP-TO-DATE'],
  },
  {
    name: 'processResources',
    duration: 400,
    output: ['> Task :processResources UP-TO-DATE'],
  },
  {
    name: 'classes',
    duration: 200,
    output: ['> Task :classes UP-TO-DATE'],
  },
  {
    name: 'runServer',
    duration: 3500,
    output: [
      '> Task :runServer',
      '[13:42:01] [main/INFO] [LaunchWrapper]: Loading primary transform class',
      '[13:42:02] [main/INFO] [FML]: Forge Mod Loader version 47.3.7 for Minecraft 1.20.1 loading',
      '[13:42:03] [Server thread/INFO]: Starting minecraft server version 1.20.1',
      '[13:42:04] [Server thread/INFO]: Loading properties',
      '[13:42:04] [Server thread/INFO]: Default game type: SURVIVAL',
      '[13:42:05] [Server thread/INFO]: Preparing level "world"',
      '[13:42:06] [Server thread/INFO]: Done (3.142s)! For help, type "help"',
    ],
  },
]

/** 清理序列（clean 任务） */
export const CLEAN_TASKS: GradleTask[] = [
  {
    name: 'clean',
    duration: 600,
    output: [
      '> Task :clean',
      'Deleting build/libs/',
      'Deleting build/classes/',
      'Deleting build/resources/',
    ],
  },
]

/* ------------------------------------------------------------------ */
/* 随机失败场景（10% 概率，用于测试日志解析引擎）                       */
/* ------------------------------------------------------------------ */

export type BuildFailureScenario =
  | 'missing_dependency'
  | 'compile_error'
  | 'out_of_memory'
  | 'no_failure'

export interface BuildFailure {
  scenario: BuildFailureScenario
  /** 失败日志（多行，按顺序 yield） */
  output: string[]
}

/** 已知的失败场景列表 */
export const FAILURE_SCENARIOS: BuildFailure[] = [
  {
    scenario: 'missing_dependency',
    output: [
      '> Task :compileJava FAILED',
      '',
      'FAILURE: Build failed with an exception.',
      '',
      '* What went wrong:',
      "Could not resolve all files for configuration ':compileClasspath'.",
      '> Could not find net.minecraftforge:forge:1.20.1-47.3.7.',
      '  Searched in the following locations:',
      '    - https://maven.minecraftforge.net/net/minecraftforge/forge/1.20.1-47.3.7/forge-1.20.1-47.3.7.jar',
      '    - file:/home/user/.gradle/caches/modules-2/files-2.1/net.minecraftforge/forge/1.20.1-47.3.7/',
      '',
      '* Try:',
      '> Run with --stacktrace option to get the stack trace.',
      '> Run with --info or --debug option to get more log output.',
      '> Run with --scan to get full insights.',
      '',
      '* Get more help at https://help.gradle.org',
      '',
      'BUILD FAILED in 8s',
      '1 actionable task: 1 executed',
    ],
  },
  {
    scenario: 'compile_error',
    output: [
      '> Task :compileJava FAILED',
      '/projects/nexcube/src/main/java/com/example/mod/RubyGolemEntity.java:42: error: cannot find symbol',
      '    public static final EntityType<RubyGolemEntity> RUBY_GOLEM =',
      '                                                  ^',
      '  symbol:   class EntityType',
      '  location: class com.example.mod.RubyGolemEntity',
      '/projects/nexcube/src/main/java/com/example/mod/RubyGolemEntity.java:43: error: package ModEntities does not exist',
      '        ModEntities.RUBY_GOLEM.get().spawn(level, pos, MobSpawnType.TRIGGERED);',
      '                ^',
      '2 errors',
      '',
      '> Task :compileJava FAILED',
      'FAILURE: Build failed with an exception.',
      '',
      '* What went wrong:',
      "Execution failed for task ':compileJava'.",
      '> Compilation failed; see the compiler error output for details.',
      '',
      '* Try:',
      '> Run with --stacktrace option to get the stack trace.',
      '> Run with --info or --debug option to get more log output.',
      '> Run with --scan to get full insights.',
      '',
      '* Get more help at https://help.gradle.org',
      '',
      'BUILD FAILED in 6s',
      '1 actionable task: 1 executed',
    ],
  },
  {
    scenario: 'out_of_memory',
    output: [
      '> Task :compileJava',
      '注: 某些输入文件使用了已过时或已移除的 API。',
      '注: 有关详细信息, 请使用 -Xlint:deprecation 重新编译。',
      '',
      'FAILURE: Build failed with an exception.',
      '',
      '* What went wrong:',
      "Execution failed for task ':compileJava'.",
      '> Java heap space',
      '',
      '* Try:',
      '> Run with --stacktrace option to get the stack trace.',
      '> Run with --info or --debug option to get more log output.',
      '> Run with --scan to get full insights.',
      '',
      '* Get more help at https://help.gradle.org',
      '',
      'java.lang.OutOfMemoryError: Java heap space',
      '    at com.sun.tools.javac.jvm.Code.emitop(Code.java:138)',
      '    at com.sun.tools.javac.jvm.Items$Item.store(Item.java:228)',
      '    at com.sun.tools.javac.jvm.Gen.genDef(Gen.java:1204)',
      '    at com.sun.tools.javac.jvm.Gen.genClass(Gen.java:1134)',
      '',
      'BUILD FAILED in 12s',
      '1 actionable task: 1 executed',
    ],
  },
]

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** 根据 task 类型获取任务序列 */
function getTaskSequence(task: string): GradleTask[] {
  switch (task) {
    case 'build':
      return BUILD_TASKS
    case 'runClient':
      return RUN_CLIENT_TASKS
    case 'runServer':
      return RUN_SERVER_TASKS
    case 'clean':
      return CLEAN_TASKS
    default:
      return BUILD_TASKS
  }
}

/** 10% 概率随机返回一个失败场景（无失败时返回 null） */
function pickRandomFailure(): BuildFailure | null {
  // 10% 概率失败
  if (Math.random() >= 0.1) return null
  const idx = Math.floor(Math.random() * FAILURE_SCENARIOS.length)
  return FAILURE_SCENARIOS[idx]
}

/** 根据总耗时生成最终 SUCCESS 行 */
function makeSuccessLine(totalMs: number): string {
  const sec = Math.max(1, Math.round(totalMs / 1000))
  return `BUILD SUCCESSFUL in ${sec}s`
}

/* ------------------------------------------------------------------ */
/* 核心：AsyncGenerator                                                */
/* ------------------------------------------------------------------ */

export interface SimulateBuildOptions {
  /** 强制失败场景（用于测试），undefined 时按 10% 随机 */
  forceFailure?: BuildFailureScenario
  /** 强制成功（禁用随机失败），默认 false */
  forceSuccess?: boolean
}

/**
 * 模拟 Gradle 构建的流式日志输出。
 *
 * 用法：
 *   for await (const chunk of simulateBuild('build')) {
 *     term.write(chunk)
 *   }
 *
 * 返回 chunk 为单行文本（含 \r\n，便于 xterm 直接渲染）。
 *
 * 失败时（10% 概率）：在 compileJava 任务输出后插入错误日志，
 * 并 yield `BUILD FAILED in Xs` 行。
 *
 * 支持中断：调用方调用 `gen.return()` 可立即停止迭代。
 */
export async function* simulateBuild(
  task: string,
  options: SimulateBuildOptions = {},
): AsyncGenerator<string, void, unknown> {
  const tasks = getTaskSequence(task)
  const startTime = Date.now()

  // 输出 Configure project 头部
  yield '> Configure project :\r\n'
  await sleep(200 + Math.random() * 300)

  yield 'ForgeGradle 6.0.21\r\n'
  await sleep(150)
  yield 'Loading Forge 1.20.1-47.3.7 (mapping official_1.20.1)\r\n'
  await sleep(300)

  // 决定是否失败（compileJava 之后注入失败）
  let failure: BuildFailure | null = null
  if (options.forceSuccess !== true) {
    if (options.forceFailure) {
      failure =
        FAILURE_SCENARIOS.find((f) => f.scenario === options.forceFailure) ??
        null
    } else {
      failure = pickRandomFailure()
    }
  }

  // 逐 task 输出
  for (const t of tasks) {
    // 在 compileJava 之上：若是失败点，先输出 compileJava 正常日志
    // 再注入 FAILED 行 + 失败堆栈，并立即返回
    if (
      failure &&
      t.name === 'compileJava' &&
      // 仅 build / runClient / runServer 在 compileJava 失败；clean 不失败
      task !== 'clean'
    ) {
      for (const line of t.output) {
        yield line + '\r\n'
        await sleep(50 + Math.random() * 200)
      }
      await sleep(t.duration)
      // 注入失败日志
      for (const line of failure.output) {
        yield line + '\r\n'
        await sleep(30 + Math.random() * 150)
      }
      // 失败后立即返回
      return
    }

    // 正常输出整个 task
    for (const line of t.output) {
      yield line + '\r\n'
      await sleep(50 + Math.random() * 200)
    }
    await sleep(t.duration)
  }

  // 成功结束
  const elapsed = Date.now() - startTime
  yield makeSuccessLine(elapsed) + '\r\n'
  await sleep(200)
  yield `${tasks.length} actionable tasks: ${tasks.length} executed\r\n`
}

/**
 * 同步版本：返回完整的日志字符串（用于测试或一次性渲染）。
 * 不含时序延迟。
 */
export function simulateBuildSync(task: string): string {
  const tasks = getTaskSequence(task)
  const lines: string[] = [
    '> Configure project :',
    'ForgeGradle 6.0.21',
    'Loading Forge 1.20.1-47.3.7 (mapping official_1.20.1)',
  ]
  for (const t of tasks) {
    lines.push(...t.output)
  }
  lines.push('BUILD SUCCESSFUL in 8s')
  lines.push(`${tasks.length} actionable tasks: ${tasks.length} executed`)
  return lines.join('\n')
}

/**
 * 检测日志文本是否包含失败标记
 */
export function isBuildFailed(log: string): boolean {
  return /BUILD FAILED/i.test(log)
}
