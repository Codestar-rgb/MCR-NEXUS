import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PREDEFINED_MIRRORS } from '@/lib/capabilities'
import type { JdkMirror, MirrorConfig } from '@/lib/capabilities'

/**
 * GET /api/mirrors
 *
 * 返回所有镜像源列表（DB + isActive 标记）。如果 DB 中无任何镜像源，
 * 自动用 PREDEFINED_MIRRORS（阿里云 / 清华 / 官方）初始化，
 * 并把第一个（阿里云）标记为激活。
 *
 * 响应体：
 *   {
 *     mirrors: MirrorConfig[],          // 与能力层 MirrorConfig 同形
 *     activeMirrorId: string | null     // 当前激活镜像 ID
 *   }
 */
export async function GET() {
  try {
    let rows = await db.mirrorConfig.findMany({
      orderBy: { createdAt: 'asc' },
    })

    // 首次访问：用预定义镜像初始化
    if (rows.length === 0) {
      await db.mirrorConfig.createMany({
        data: PREDEFINED_MIRRORS.map((m, idx) => ({
          name: m.name,
          displayName: m.displayName,
          mavenUrl: m.mavenUrl,
          gradleUrl: m.gradleUrl,
          jdks: JSON.stringify(m.jdks),
          // 默认激活第一个（阿里云）
          isActive: idx === 0,
        })),
      })
      rows = await db.mirrorConfig.findMany({
        orderBy: { createdAt: 'asc' },
      })
    }

    // DB row → MirrorConfig（jdks 字段反序列化）
    const mirrors: MirrorConfig[] = rows.map((r) => ({
      id: r.name, // 用 name 作为对外暴露的稳定 ID（与 PREDEFINED_MIRRORS 对齐）
      name: r.name,
      displayName: r.displayName,
      mavenUrl: r.mavenUrl,
      gradleUrl: r.gradleUrl,
      jdks: safeParseJdks(r.jdks),
    }))

    const activeRow = rows.find((r) => r.isActive)
    const activeMirrorId = activeRow ? activeRow.name : null

    return NextResponse.json({ mirrors, activeMirrorId })
  } catch (err) {
    console.error('[API] GET /api/mirrors error:', err)
    return NextResponse.json(
      { error: 'failed_to_load_mirrors' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/mirrors
 *
 * Body: { id: string, isActive: true }
 *
 * 激活某个镜像源。策略：先把所有镜像的 isActive 置为 false，
 * 再把目标镜像置为 true（保证全局唯一激活）。
 *
 * 成功响应：{ success: true, activeMirrorId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = String(body.id ?? '').trim()

    if (!id) {
      return NextResponse.json(
        { error: 'missing_required_field', field: 'id' },
        { status: 400 },
      )
    }

    const target = await db.mirrorConfig.findUnique({
      where: { name: id },
    })

    if (!target) {
      return NextResponse.json(
        { error: 'mirror_not_found', id },
        { status: 404 },
      )
    }

    // 先全部置为 false，再激活目标（事务保证原子性）
    await db.$transaction([
      db.mirrorConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      }),
      db.mirrorConfig.update({
        where: { name: id },
        data: { isActive: true },
      }),
    ])

    return NextResponse.json({ success: true, activeMirrorId: id })
  } catch (err) {
    console.error('[API] POST /api/mirrors error:', err)
    return NextResponse.json(
      { error: 'failed_to_activate_mirror' },
      { status: 500 },
    )
  }
}

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

function safeParseJdks(raw: string): JdkMirror[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed as JdkMirror[]
    }
    return []
  } catch {
    return []
  }
}
