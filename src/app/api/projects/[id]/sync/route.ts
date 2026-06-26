import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { PrismaNodeDTO, PrismaConnectionDTO } from '@/lib/node-system/persistence'

/**
 * POST /api/projects/[id]/sync
 *   批量同步节点 + 连线（用于画布 debounce 持久化）。
 *
 *   Body: {
 *     upsertNodes: PrismaNodeDTO[],          // 创建或更新
 *     deleteNodeIds: string[],
 *     upsertConnections: PrismaConnectionDTO[],
 *     deleteConnectionIds: string[],
 *   }
 *
 *   - 所有变更在单一 $transaction 内执行（原子）
 *   - upsert 使用 prisma.node.upsert / prisma.connection.upsert
 *   - 删除节点时级联删除相关连线（Prisma onDelete: Cascade 已配置）
 *   - 响应：{ ok: true, syncedAt: ISO, stats: { upsertedNodes, deletedNodes, upsertedConnections, deletedConnections } }
 */

type RouteCtx = { params: Promise<{ id: string }> }

/** 将 PrismaNodeDTO 拆分为 upsert 的 create / update 数据 */
function nodeDtoToData(dto: PrismaNodeDTO) {
  return {
    projectId: dto.projectId,
    type: dto.type,
    title: dto.title,
    positionX: Number(dto.positionX),
    positionY: Number(dto.positionY),
    width: dto.width != null ? Number(dto.width) : null,
    height: dto.height != null ? Number(dto.height) : null,
    color: dto.color ?? null,
    isCollapsed: Boolean(dto.isCollapsed),
    parentId: dto.parentId ?? null,
    subGraphId: dto.subGraphId ?? null,
    properties:
      typeof dto.properties === 'string' ? dto.properties : JSON.stringify(dto.properties ?? {}),
    sourceCode: dto.sourceCode ?? null,
    linkedFile: dto.linkedFile ?? null,
    linkedLine: dto.linkedLine != null ? Number(dto.linkedLine) : null,
  }
}

function connectionDtoToData(dto: PrismaConnectionDTO) {
  return {
    projectId: dto.projectId,
    sourceNodeId: dto.sourceNodeId,
    targetNodeId: dto.targetNodeId,
    sourcePort: dto.sourcePort ?? '',
    targetPort: dto.targetPort ?? '',
    dataType: dto.dataType ?? 'any',
  }
}

export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params

    const project = await db.project.findUnique({ where: { id }, select: { id: true } })
    if (!project) {
      return NextResponse.json({ error: 'project_not_found' }, { status: 404 })
    }

    const body = await req.json()
    const upsertNodes: PrismaNodeDTO[] = Array.isArray(body.upsertNodes) ? body.upsertNodes : []
    const deleteNodeIds: string[] = Array.isArray(body.deleteNodeIds) ? body.deleteNodeIds : []
    const upsertConnections: PrismaConnectionDTO[] = Array.isArray(body.upsertConnections) ? body.upsertConnections : []
    const deleteConnectionIds: string[] = Array.isArray(body.deleteConnectionIds) ? body.deleteConnectionIds : []

    // 安全校验：所有 DTO 的 projectId 必须与 URL 中的 id 一致
    const badNode = upsertNodes.find((n) => n.projectId !== id)
    if (badNode) {
      return NextResponse.json(
        { error: 'projectId_mismatch', message: 'upsertNodes 中存在 projectId 与路径不一致的节点' },
        { status: 400 },
      )
    }
    const badConn = upsertConnections.find((c) => c.projectId !== id)
    if (badConn) {
      return NextResponse.json(
        { error: 'projectId_mismatch', message: 'upsertConnections 中存在 projectId 与路径不一致的连线' },
        { status: 400 },
      )
    }

    const stats = await db.$transaction(async (tx) => {
      // 1) 删除连线（先删连线，避免删除节点时引用悬空虽 Cascade 但语义更清晰）
      let deletedConnections = 0
      if (deleteConnectionIds.length > 0) {
        const r = await tx.connection.deleteMany({
          where: { projectId: id, id: { in: deleteConnectionIds } },
        })
        deletedConnections = r.count
      }

      // 2) 删除节点（Cascade 会带走相关 connections）
      let deletedNodes = 0
      if (deleteNodeIds.length > 0) {
        const r = await tx.node.deleteMany({
          where: { projectId: id, id: { in: deleteNodeIds } },
        })
        deletedNodes = r.count
      }

      // 3) upsert 节点
      let upsertedNodes = 0
      for (const dto of upsertNodes) {
        const data = nodeDtoToData(dto)
        await tx.node.upsert({
          where: { id: dto.id },
          create: { id: dto.id, ...data },
          update: data,
        })
        upsertedNodes += 1
      }

      // 4) upsert 连线
      let upsertedConnections = 0
      for (const dto of upsertConnections) {
        const data = connectionDtoToData(dto)
        await tx.connection.upsert({
          where: { id: dto.id },
          create: { id: dto.id, ...data },
          update: data,
        })
        upsertedConnections += 1
      }

      return { upsertedNodes, deletedNodes, upsertedConnections, deletedConnections }
    })

    return NextResponse.json({
      ok: true,
      syncedAt: new Date().toISOString(),
      stats,
    })
  } catch (err) {
    console.error('[API] POST /api/projects/[id]/sync error:', err)
    return NextResponse.json({ error: 'failed_to_sync' }, { status: 500 })
  }
}
