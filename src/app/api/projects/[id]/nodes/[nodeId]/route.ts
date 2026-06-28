import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * PATCH /api/projects/[id]/nodes/[nodeId]
 *   支持部分更新：positionX/positionY/width/height/color/title/
 *   isCollapsed/properties/sourceCode/linkedFile/linkedLine/parentId/subGraphId
 *
 * DELETE /api/projects/[id]/nodes/[nodeId]
 *   删除单个节点（关联连线由 Prisma onDelete: Cascade 自动清理）
 */

type RouteCtx = { params: Promise<{ id: string; nodeId: string }> }

export async function PATCH(
  req: NextRequest,
  { params }: RouteCtx,
) {
  try {
    const { id, nodeId } = await params
    const body = await req.json()

    // 确认节点存在且属于该项目
    const existing = await db.node.findFirst({
      where: { id: nodeId, projectId: id },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'node_not_found' },
        { status: 404 },
      )
    }

    const data: Record<string, unknown> = {}

    if (body.positionX !== undefined) data.positionX = Number(body.positionX)
    if (body.positionY !== undefined) data.positionY = Number(body.positionY)
    if (body.width !== undefined) data.width = body.width == null ? null : Number(body.width)
    if (body.height !== undefined) data.height = body.height == null ? null : Number(body.height)
    if (body.color !== undefined) data.color = body.color == null ? null : String(body.color)
    if (body.title !== undefined) data.title = String(body.title)
    if (body.type !== undefined) data.type = String(body.type)
    if (body.isCollapsed !== undefined) data.isCollapsed = Boolean(body.isCollapsed)
    if (body.parentId !== undefined) data.parentId = body.parentId == null ? null : String(body.parentId)
    if (body.subGraphId !== undefined) data.subGraphId = body.subGraphId == null ? null : String(body.subGraphId)
    if (body.sourceCode !== undefined) data.sourceCode = body.sourceCode == null ? null : String(body.sourceCode)
    if (body.linkedFile !== undefined) data.linkedFile = body.linkedFile == null ? null : String(body.linkedFile)
    if (body.linkedLine !== undefined) data.linkedLine = body.linkedLine == null ? null : Number(body.linkedLine)

    if (body.properties !== undefined) {
      data.properties =
        typeof body.properties === 'string'
          ? body.properties
          : JSON.stringify(body.properties)
    }

    const updated = await db.node.update({ where: { id: nodeId }, data })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[API] PATCH /api/projects/[id]/nodes/[nodeId] error:', err)
    return NextResponse.json({ error: 'failed_to_update_node' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteCtx,
) {
  try {
    const { id, nodeId } = await params

    // 确认归属后删除；onDelete: Cascade 会清理相关 connections
    const existing = await db.node.findFirst({
      where: { id: nodeId, projectId: id },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'node_not_found' },
        { status: 404 },
      )
    }

    await db.node.delete({ where: { id: nodeId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API] DELETE /api/projects/[id]/nodes/[nodeId] error:', err)
    return NextResponse.json({ error: 'failed_to_delete_node' }, { status: 500 })
  }
}

