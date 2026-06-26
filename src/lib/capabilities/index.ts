/**
 * NexCube 能力层入口
 *
 * 职责：
 *   1. 运行时检测当前环境（Web / Electron），选择对应能力实现
 *   2. 导出预定义的镜像源配置（阿里云 / 清华 / 官方）
 *   3. 重导出所有类型，业务代码只需 `import { capabilities, PREDEFINED_MIRRORS } from '@/lib/capabilities'`
 *
 * 切换实现的原则：
 *   - 业务代码只依赖 Capabilities 接口，不直接依赖 web.ts / electron.ts
 *   - 当 Electron 启用时（preload 注入了 window.nexcube），自动切换到 electronCapabilities
 *   - 否则使用 webCapabilities（浏览器模拟）
 */

import type { Capabilities, MirrorConfig } from './types'
import { webCapabilities } from './web'
import { electronCapabilities } from './electron'

/**
 * 检测是否在 Electron 环境
 *
 * 判定条件：window.nexcube 由 preload 通过 contextBridge 注入
 */
const isElectron =
  typeof window !== 'undefined' &&
  typeof (window as unknown as { nexcube?: unknown }).nexcube !== 'undefined'

/**
 * 当前运行时的能力集
 *
 * 业务代码统一通过此变量访问系统能力，禁止直接 import web.ts / electron.ts
 */
export const capabilities: Capabilities = isElectron ? electronCapabilities : webCapabilities

/**
 * 预定义镜像源
 *
 * 国内推荐使用阿里云或清华镜像，可显著加速 Maven 依赖下载。
 * 官方源在大陆网络环境下较慢，仅在镜像不可用时降级使用。
 */
export const PREDEFINED_MIRRORS: MirrorConfig[] = [
  {
    id: 'aliyun',
    name: 'aliyun',
    displayName: '阿里云镜像',
    mavenUrl: 'https://maven.aliyun.com/repository/public',
    gradleUrl: 'https://mirrors.aliyun.com/gradle',
    jdks: [
      {
        version: '21',
        url: 'https://mirrors.aliyun.com/adoptium/21/jdk/x64/linux/',
        checksum: '',
      },
      {
        version: '17',
        url: 'https://mirrors.aliyun.com/adoptium/17/jdk/x64/linux/',
        checksum: '',
      },
    ],
  },
  {
    id: 'tuna',
    name: 'tuna',
    displayName: '清华大学镜像',
    mavenUrl: 'https://mirrors.tuna.tsinghua.edu.cn/maven',
    gradleUrl: 'https://mirrors.tuna.tsinghua.edu.cn/gradle',
    jdks: [],
  },
  {
    id: 'official',
    name: 'official',
    displayName: '官方源（较慢）',
    mavenUrl: 'https://repo1.maven.org/maven2',
    gradleUrl: 'https://services.gradle.org/distributions',
    jdks: [],
  },
]

/**
 * 默认镜像（阿里云）
 */
export const DEFAULT_MIRROR: MirrorConfig = PREDEFINED_MIRRORS[0]

/**
 * 根据 ID 查找镜像
 */
export function findMirror(id: string): MirrorConfig | undefined {
  return PREDEFINED_MIRRORS.find((m) => m.id === id)
}

// 重导出所有类型与工具
export * from './types'
export { parseGradleLog, listParseRules, getRuleCount } from './log-parser'
export { webCapabilities, electronCapabilities }
