import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/projects/[id]
 * PATCH /api/projects/[id]   更新项目字段；body.touch=true 时更新最近打开时间
 * DELETE /api/projects/[id]  级联删除
 */
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
    return NextResponse.json(project)
  } catch (err) {
    console.error('[API] GET /api/projects/[id] error:', err)
    return NextResponse.json({ error: 'failed_to_load_project' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await req.json()

    const allowed = [
      'name', 'author', 'version', 'mcVersion', 'forgeVersion',
      'loader', 'iconPath', 'storagePath', 'description',
    ] as const

    const data: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    if (body.touch === true) {
      data.lastOpenedAt = new Date()
    }

    const updated = await db.project.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[API] PATCH /api/projects/[id] error:', err)
    return NextResponse.json({ error: 'failed_to_update_project' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await db.project.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API] DELETE /api/projects/[id] error:', err)
    return NextResponse.json({ error: 'failed_to_delete_project' }, { status: 500 })
  }
}
