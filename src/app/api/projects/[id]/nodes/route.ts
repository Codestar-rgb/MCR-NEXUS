import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createDefaultProperties } from '@/lib/node-system/node-factory'

/**
 * GET /api/projects/[id]/nodes
 *   返回该项目所有节点 + 连线（一次加载，避免多次请求）
 *   响应：{ nodes: PrismaNode[], connections: PrismaConnection[] }
 *
 * POST /api/projects/[id]/nodes
 *   创建单个节点
 *   Body: { type, title, positionX, positionY, width?, height?, color?, properties? }
 *
 * DELETE /api/projects/[id]/nodes?ids=id1,id2,id3
 *   批量删除节点（关联连线由 Prisma onDelete: Cascade 自动清理）
 */

type RouteCtx = { params: Promise<{ id: string }> }

/** 检查项目存在性，返回 NextResponse.json 错误或 null（表示存在） */
async function ensureProject(id: string) {
  const project = await db.project.findUnique({ where: { id }, select: { id: true } })
  if (!project) {
    return NextResponse.json({ error: 'project_not_found' }, { status: 404 })
  }
  return null
}

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params
    const notFound = await ensureProject(id)
    if (notFound) return notFound

    const [nodes, connections] = await Promise.all([
      db.node.findMany({ where: { projectId: id } }),
      db.connection.findMany({ where: { projectId: id } }),
    ])

    return NextResponse.json({ nodes, connections })
  } catch (err) {
    console.error('[API] GET /api/projects/[id]/nodes error:', err)
    return NextResponse.json({ error: 'failed_to_load_nodes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params
    const notFound = await ensureProject(id)
    if (notFound) return notFound

    const body = await req.json()

    const type = String(body.type ?? '').trim()
    const title = String(body.title ?? '').trim()
    const positionX = Number(body.positionX)
    const positionY = Number(body.positionY)

    if (!type || !title) {
      return NextResponse.json(
        { error: 'missing_required_fields', fields: ['type', 'title'] },
        { status: 400 },
      )
    }
    if (Number.isNaN(positionX) || Number.isNaN(positionY)) {
      return NextResponse.json(
        { error: 'invalid_position', message: 'positionX / positionY 必须为数字' },
        { status: 400 },
      )
    }

    // properties：传入则用，否则按 type 从注册表生成默认值
    let propertiesRaw: string
    if (body.properties != null) {
      propertiesRaw =
        typeof body.properties === 'string'
          ? body.properties
          : JSON.stringify(body.properties)
    } else {
      propertiesRaw = JSON.stringify(createDefaultProperties(type))
    }

    const created = await db.node.create({
      data: {
        projectId: id,
        type,
        title,
        positionX,
        positionY,
        width: body.width != null ? Number(body.width) : null,
        height: body.height != null ? Number(body.height) : null,
        color: body.color != null ? String(body.color) : null,
        isCollapsed: Boolean(body.isCollapsed ?? false),
        parentId: body.parentId ? String(body.parentId) : null,
        subGraphId: body.subGraphId ? String(body.subGraphId) : null,
        properties: propertiesRaw,
        sourceCode: body.sourceCode ? String(body.sourceCode) : null,
        linkedFile: body.linkedFile ? String(body.linkedFile) : null,
        linkedLine: body.linkedLine != null ? Number(body.linkedLine) : null,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('[API] POST /api/projects/[id]/nodes error:', err)
    return NextResponse.json({ error: 'failed_to_create_node' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params
    const notFound = await ensureProject(id)
    if (notFound) return notFound

    const { searchParams } = new URL(req.url)
    const idsParam = searchParams.get('ids') ?? ''
    const ids = idsParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'missing_ids', message: '请通过 ?ids=id1,id2 提供待删除节点 ID' },
        { status: 400 },
      )
    }

    // onDelete: Cascade 会自动删除 connectionsAsSource / connectionsAsTarget
    const result = await db.node.deleteMany({
      where: { projectId: id, id: { in: ids } },
    })

    return NextResponse.json({ ok: true, deleted: result.count })
  } catch (err) {
    console.error('[API] DELETE /api/projects/[id]/nodes error:', err)
    return NextResponse.json({ error: 'failed_to_delete_nodes' }, { status: 500 })
  }
}
