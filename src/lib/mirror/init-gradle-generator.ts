/**
 * NexCube init.gradle 文件生成器
 *
 * 当用户切换镜像源后，NexCube 会基于当前激活的镜像源生成 init.gradle，
 * 该脚本会作为 `gradle --init-script init.gradle` 的初始化脚本注入构建过程，
 * 把所有从 mavenCentral / jcenter / gradlePluginPortal 的下载重定向到国内镜像，
 * 显著加速 MC 模组项目（ForgeGradle / NeoGradle）依赖拉取速度。
 *
 * 设计要点：
 *   - allprojects.repositories 阶段移除 repo1.maven.org / jcenter
 *   - 注入镜像源作为 Maven 仓库（含 Forge 专用镜像路径）
 *   - settingsEvaluated 阶段重定向 pluginManagement 仓库到镜像
 *   - 文件头部含生成元数据（镜像 ID / 名称 / 时间戳），便于排查
 *
 * 生成的脚本是合法的 Gradle DSL（Groovy 风格），适用于 Gradle 7/8。
 */

import type { MirrorConfig } from '@/lib/capabilities'

/**
 * 生成 init.gradle 文本内容
 *
 * @param mirror 当前激活的镜像源
 * @returns 完整的 init.gradle 文本
 */
export function generateInitGradle(mirror: MirrorConfig): string {
  const generatedAt = new Date().toISOString()

  return `// =============================================================
// NexCube 自动生成的 init.gradle
// -------------------------------------------------------------
// 镜像源 ID  : ${mirror.id}
// 镜像名称   : ${mirror.displayName}
// Maven URL  : ${mirror.mavenUrl}
// Gradle URL : ${mirror.gradleUrl}
// 生成时间   : ${generatedAt}
//
// 用法：
//   gradle --init-script init.gradle build
//   或将其放入 ~/.gradle/init.d/ 全局生效
// =============================================================

allprojects {
    repositories {
        // 清除默认仓库（mavenCentral / jcenter）
        all { ArtifactRepository repo ->
            if (repo instanceof MavenArtifactRepository) {
                def url = repo.url.toString()
                if (url.contains('repo1.maven.org') || url.contains('jcenter')) {
                    remove repo
                }
            }
        }

        // 添加国内 Maven 镜像
        maven {
            name = '${mirror.name}'
            url = '${mirror.mavenUrl}'
            allowInsecureProtocol = false
        }

        // Forge 专用镜像（如有独立路径）
        maven {
            name = 'forge'
            url = '${mirror.mavenUrl}/forge'
            allowInsecureProtocol = false
        }

        // 保留官方 Maven 作为兜底（镜像未命中时回源）
        mavenCentral()
    }
}

// Gradle 插件仓库重定向到镜像
settingsEvaluated { settings ->
    settings.pluginManagement {
        repositories {
            maven { url = '${mirror.gradleUrl}' }
            maven { url = '${mirror.mavenUrl}' }
            gradlePluginPortal()
        }
    }
}

// 下载加速：Gradle Distribution 也走镜像（用户需在 gradle.properties 中配置 distributionUrl）
// 此处仅做日志提示，不强制覆盖
gradle.taskGraph.beforeTask { task ->
    if (task.name == 'wrapper' && System.getenv('NEXCUBE_VERBOSE') != null) {
        println "[NexCube] 当前激活镜像：${mirror.displayName} (${mirror.mavenUrl})"
    }
}
`
}

/**
 * 生成 init.gradle 的默认文件名（含镜像 ID，便于多镜像共存时区分）
 */
export function getInitGradleFileName(mirror: MirrorConfig): string {
  return `init-${mirror.name}.gradle`
}

/**
 * 生成简短的镜像元数据卡片文本（用于在 UI 中预览关键信息）
 */
export function getMirrorSummary(mirror: MirrorConfig): string {
  const jdkList = mirror.jdks.length > 0
    ? mirror.jdks.map((j) => `JDK ${j.version}`).join(', ')
    : '无 JDK 镜像'
  return `${mirror.displayName} · ${mirror.mavenUrl} · ${jdkList}`
}
