'use client'

/**
 * NexCube 修复动作处理器（Task 5-A）
 *
 * 将日志卡片中触发的修复动作（fixAction.action 字符串 key）映射为实际执行逻辑。
 *
 * 支持的 action key（来自 log-parser.ts 的 21 条规则）：
 *  - fix.configure-mirror        切换镜像源（payload.mirrorId = aliyun | tuna | official）
 *  - fix.adjust-jvm-memory       调整 JVM 堆内存 / Metaspace（payload.suggested）
 *  - fix.search-maven            打开 Maven 中央仓库（手动）
 *  - fix.show-dependency-tree    显示依赖树（手动）
 *  - fix.show-mappings-doc       打开 mappings 文档（手动）
 *  - fix.show-stacktrace         显示详细堆栈（手动）
 *  - fix.show-memory-guide       显示内存分析指南（手动）
 *  - fix.goto-symbol             跳转到符号定义（手动）
 *
 * 别名（兼容任务文档示例命名）：
 *  - switch_mirror_aliyun        ≡ fix.configure-mirror + mirrorId=aliyun
 *  - switch_mirror_tuna          ≡ fix.configure-mirror + mirrorId=tuna
 *  - increase_memory             ≡ fix.adjust-jvm-memory
 *  - add_dependency              提示用户手动添加
 *
 * 返回 FixActionResult：
 *  - success=true   已自动完成（toast.success）
 *  - success=false  需用户手动操作（toast.info / toast.warning）
 */

import type { MirrorConfig } from '@/lib/capabilities'

export interface FixActionContext {
  /** 当前项目 ID（用于调用镜像切换 API） */
  projectId: string | null
  /** 当前镜像配置（可选，用于在切换前显示原镜像） */
  mirrorConfig?: MirrorConfig
  /** 项目根路径（Web 模式下可能为 undefined；Electron 模式下用于直接修改文件） */
  projectPath?: string
}

export interface FixActionResult {
  /** 是否已自动完成（true）或需要用户手动操作（false） */
  success: boolean
  /** 给用户的 toast 消息 */
  message: string
  /** toast 类型 */
  variant: 'success' | 'info' | 'warning' | 'error'
}

/**
 * 镜像 ID → 中文名
 */
function mirrorDisplayName(mirrorId: string): string {
  switch (mirrorId) {
    case 'aliyun':
      return '阿里云'
    case 'tuna':
      return '清华大学'
    case 'official':
      return '官方'
    default:
      return mirrorId
  }
}

/**
 * 执行修复动作
 *
 * 客户端调用，所有 API 请求使用相对路径（Caddy 网关会自动转发）。
 */
export async function executeFixAction(
  action: string,
  context: FixActionContext,
  payload?: Record<string, unknown>,
): Promise<FixActionResult> {
  switch (action) {
    /* ------------------------------------------------------------ */
    /* 镜像切换                                                       */
    /* ------------------------------------------------------------ */
    case 'fix.configure-mirror':
    case 'switch_mirror_aliyun':
    case 'switch_mirror_tuna': {
      const mirrorId =
        (payload?.mirrorId as string | undefined) ||
        (action === 'switch_mirror_aliyun'
          ? 'aliyun'
          : action === 'switch_mirror_tuna'
            ? 'tuna'
            : 'aliyun')

      if (!context.projectId) {
        return {
          success: false,
          message: '未检测到当前项目，无法切换镜像',
          variant: 'warning',
        }
      }

      try {
        const resp = await fetch(
          `/api/projects/${context.projectId}/mirror`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mirrorId }),
          },
        )
        if (!resp.ok) {
          return {
            success: false,
            message: `镜像切换失败：HTTP ${resp.status}`,
            variant: 'error',
          }
        }
        const data = (await resp.json()) as { ok?: boolean; mirrorId?: string }
        if (!data.ok) {
          return {
            success: false,
            message: '镜像切换 API 返回异常',
            variant: 'error',
          }
        }
        return {
          success: true,
          message: `已切换到「${mirrorDisplayName(mirrorId)}」镜像源，重新构建以生效`,
          variant: 'success',
        }
      } catch (err) {
        return {
          success: false,
          message: `镜像切换失败：${err instanceof Error ? err.message : '网络错误'}`,
          variant: 'error',
        }
      }
    }

    /* ------------------------------------------------------------ */
    /* JVM 内存调整                                                  */
    /* ------------------------------------------------------------ */
    case 'fix.adjust-jvm-memory':
    case 'increase_memory': {
      const suggested =
        (payload?.suggested as string | undefined) || '-Xmx4G'
      // Web 模式下无法直接修改 gradle.properties；返回 false 让用户手动操作
      // Electron 模式下可由后续任务通过 fs capability 直接写入
      return {
        success: false,
        message: `请在 gradle.properties 中设置：org.gradle.jvmargs=${suggested}`,
        variant: 'info',
      }
    }

    /* ------------------------------------------------------------ */
    /* 手动操作类（仅返回提示文案）                                   */
    /* ------------------------------------------------------------ */
    case 'fix.search-maven':
      return {
        success: false,
        message: '请访问 https://central.sonatype.com 搜索依赖坐标',
        variant: 'info',
      }

    case 'fix.show-dependency-tree':
      return {
        success: false,
        message: '请在终端运行：./gradlew dependencies 查看依赖树',
        variant: 'info',
      }

    case 'fix.show-mappings-doc':
      return {
        success: false,
        message:
          'Forge mappings 文档：https://docs.minecraftforge.net/en/1.20.x/',
        variant: 'info',
      }

    case 'fix.show-stacktrace':
      return {
        success: false,
        message: '请重新运行 ./gradlew build --stacktrace 获取详细堆栈',
        variant: 'info',
      }

    case 'fix.show-memory-guide':
      return {
        success: false,
        message:
          '内存调优：提高 -Xmx（建议 4G+）、关闭 Daemon（--no-daemon）、排查静态集合持有',
        variant: 'info',
      }

    case 'fix.goto-symbol': {
      const symbol = (payload?.symbol as string | undefined) || '未知'
      return {
        success: false,
        message: `请在代码编辑器中搜索符号：${symbol}（Ctrl+Shift+O）`,
        variant: 'info',
      }
    }

    case 'add_dependency':
      return {
        success: false,
        message: '请在 build.gradle 的 dependencies 块手动添加依赖',
        variant: 'info',
      }

    /* ------------------------------------------------------------ */
    /* 未识别                                                        */
    /* ------------------------------------------------------------ */
    default:
      return {
        success: false,
        message: `未识别的修复动作：${action}（请手动处理）`,
        variant: 'warning',
      }
  }
}
