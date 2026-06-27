import { NextRequest, NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { PREDEFINED_MIRRORS } from '@/lib/capabilities'

/**
 * GET /api/projects/[id]/mirror
 *   返回项目当前镜像源（默认 aliyun；Task 5-B 将持久化到 Project 表）
 *
 * POST /api/projects/[id]/mirror
 *   Body: { mirrorId: 'aliyun' | 'tuna' | 'official' }
 *   设置项目镜像源（Task 5-A 仅返回确认；Task 5-B 将实际写入 settings.gradle）
 */

const VALID_MIRROR_IDS = new Set(PREDEFINED_MIRRORS.map((m) => m.id))

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const project = await db.project.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'project_not_found' }, { status: 404 })
    }
    // 项目级镜像配置（后续扩展）
    return NextResponse.json({
      mirrorId: 'aliyun',
      mirror: PREDEFINED_MIRRORS[0],
    })
  } catch (err) {
    console.error('[API] GET /api/projects/[id]/mirror error:', err)
    return NextResponse.json(
      { error: 'failed_to_get_mirror' },
      { status: 500 },
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const mirrorId = typeof body?.mirrorId === 'string' ? body.mirrorId : null

    if (!mirrorId || !VALID_MIRROR_IDS.has(mirrorId)) {
      return NextResponse.json(
        {
          error: 'invalid_mirror_id',
          allowed: Array.from(VALID_MIRROR_IDS),
        },
        { status: 400 },
      )
    }

    const project = await db.project.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'project_not_found' }, { status: 404 })
    }

    // 镜像源更新（后续扩展）
    //   1. 持久化 mirrorId 到 Project 表（需扩展 schema）
    //   2. 重写项目根目录下 settings.gradle 的 pluginManagement / dependencyResolutionManagement repositories 块
    //   3. 触发 Gradle refresh

    const mirror = PREDEFINED_MIRRORS.find((m) => m.id === mirrorId)
    return NextResponse.json({
      ok: true,
      mirrorId,
      mirror,
      message: `镜像已切换为 ${mirror?.displayName ?? mirrorId}（Task 5-B 将写入 settings.gradle）`,
    })
  } catch (err) {
    console.error('[API] POST /api/projects/[id]/mirror error:', err)
    return NextResponse.json(
      { error: 'failed_to_set_mirror' },
      { status: 500 },
    )
  }
}
