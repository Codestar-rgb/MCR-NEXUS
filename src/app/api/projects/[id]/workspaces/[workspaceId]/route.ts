import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * PATCH /api/projects/[id]/workspaces/[workspaceId]
 *   更新工作区（name/color/icon/sortOrder）
 *
 * DELETE /api/projects/[id]/workspaces/[workspaceId]
 *   删除工作区（级联删除其下节点）
 */

type RouteCtx = { params: Promise<{ id: string; workspaceId: string }> }

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id, workspaceId } = await params
    const body = await req.json()

    const allowed = ['name', 'color', 'icon', 'sortOrder'] as const
    const data: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    const updated = await db.subGraph.update({
      where: { id: workspaceId },
      data,
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      color: updated.color,
      icon: updated.icon,
      sortOrder: updated.sortOrder,
    })
  } catch (err) {
    console.error('[API] PATCH workspace error:', err)
    return NextResponse.json({ error: 'failed_to_update_workspace' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id, workspaceId } = await params

    // 删除工作区下所有节点（及级联连线）
    await db.node.deleteMany({
      where: { projectId: id, subGraphId: workspaceId },
    })

    // 删除工作区本身
    await db.subGraph.delete({
      where: { id: workspaceId },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API] DELETE workspace error:', err)
    return NextResponse.json({ error: 'failed_to_delete_workspace' }, { status: 500 })
  }
}
