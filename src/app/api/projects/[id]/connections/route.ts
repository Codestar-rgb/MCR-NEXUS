import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/projects/[id]/connections
 *   返回该项目所有连线
 *
 * POST /api/projects/[id]/connections
 *   创建连线
 *   Body: { sourceNodeId, targetNodeId, sourcePort?, targetPort?, dataType? }
 *   注：sourcePort/targetPort 缺省时存空串；dataType 缺省时默认 'any'
 */

type RouteCtx = { params: Promise<{ id: string }> }

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

    const connections = await db.connection.findMany({ where: { projectId: id } })
    return NextResponse.json(connections)
  } catch (err) {
    console.error('[API] GET /api/projects/[id]/connections error:', err)
    return NextResponse.json({ error: 'failed_to_load_connections' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params
    const notFound = await ensureProject(id)
    if (notFound) return notFound

    const body = await req.json()

    const sourceNodeId = String(body.sourceNodeId ?? '').trim()
    const targetNodeId = String(body.targetNodeId ?? '').trim()

    if (!sourceNodeId || !targetNodeId) {
      return NextResponse.json(
        { error: 'missing_required_fields', fields: ['sourceNodeId', 'targetNodeId'] },
        { status: 400 },
      )
    }

    // 校验 source/target 节点存在且属于该项目
    const [src, tgt] = await Promise.all([
      db.node.findFirst({ where: { id: sourceNodeId, projectId: id }, select: { id: true } }),
      db.node.findFirst({ where: { id: targetNodeId, projectId: id }, select: { id: true } }),
    ])
    if (!src || !tgt) {
      return NextResponse.json(
        { error: 'invalid_endpoints', message: 'sourceNodeId 或 targetNodeId 不存在或不属于该项目' },
        { status: 400 },
      )
    }

    // 自环禁止
    if (sourceNodeId === targetNodeId) {
      return NextResponse.json(
        { error: 'self_connection_not_allowed' },
        { status: 400 },
      )
    }

    const created = await db.connection.create({
      data: {
        projectId: id,
        sourceNodeId,
        targetNodeId,
        sourcePort: body.sourcePort != null ? String(body.sourcePort) : '',
        targetPort: body.targetPort != null ? String(body.targetPort) : '',
        dataType: body.dataType ? String(body.dataType) : 'any',
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('[API] POST /api/projects/[id]/connections error:', err)
    return NextResponse.json({ error: 'failed_to_create_connection' }, { status: 500 })
  }
}

