import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { ModLoader, RecentProject } from '@/types'

/**
 * GET /api/projects
 *   - ?recent=true  → 返回最近打开的 5 个项目（精简字段）
 *   - 默认          → 返回全部项目列表
 *
 * 字段映射：Prisma 模型 → 前端 Project 类型
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const recent = searchParams.get('recent') === 'true'

    if (recent) {
      const rows = await db.project.findMany({
        orderBy: { lastOpenedAt: 'desc' },
        take: 5,
      })
      const recentList: RecentProject[] = rows.map((p) => ({
        id: p.id,
        name: p.name,
        loader: p.loader as ModLoader,
        loaderVersion: p.forgeVersion,
        mcVersion: p.mcVersion,
        lastOpenedAt: p.lastOpenedAt.toISOString(),
        thumbnailUrl: p.iconPath ?? null,
      }))
      return NextResponse.json(recentList)
    }

    const all = await db.project.findMany({
      orderBy: { lastOpenedAt: 'desc' },
    })
    return NextResponse.json(all)
  } catch (err) {
    console.error('[API] GET /api/projects error:', err)
    return NextResponse.json(
      { error: 'failed_to_load_projects' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/projects
 * Body: { modId, name, author, version, mcVersion, forgeVersion, loader, iconPath?, storagePath, description? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 基础校验
    const modId = String(body.modId ?? '').trim()
    const name = String(body.name ?? '').trim()
    const storagePath = String(body.storagePath ?? '').trim()

    if (!modId || !name || !storagePath) {
      return NextResponse.json(
        { error: 'missing_required_fields', fields: ['modId', 'name', 'storagePath'] },
        { status: 400 },
      )
    }

    // modId 必须小写+下划线/数字
    if (!/^[a-z][a-z0-9_]*$/.test(modId)) {
      return NextResponse.json(
        { error: 'invalid_mod_id', message: 'modId 必须以小写字母开头，仅含小写字母/数字/下划线' },
        { status: 400 },
      )
    }

    const created = await db.project.create({
      data: {
        modId,
        name,
        author: String(body.author ?? 'Unknown').trim(),
        version: String(body.version ?? '1.0.0').trim(),
        mcVersion: String(body.mcVersion ?? '1.20.1').trim(),
        forgeVersion: String(body.forgeVersion ?? '47.3.7').trim(),
        loader: String(body.loader ?? 'forge').trim(),
        iconPath: body.iconPath ? String(body.iconPath) : null,
        storagePath,
        description: body.description ? String(body.description) : null,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('[API] POST /api/projects error:', err)
    return NextResponse.json(
      { error: 'failed_to_create_project' },
      { status: 500 },
    )
  }
}

