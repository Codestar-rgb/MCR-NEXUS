import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * DELETE /api/projects/[id]/connections/[connectionId]
 *   删除单条连线
 */

type RouteCtx = { params: Promise<{ id: string; connectionId: string }> }

export async function DELETE(
  _req: NextRequest,
  { params }: RouteCtx,
) {
  try {
    const { id, connectionId } = await params

    const existing = await db.connection.findFirst({
      where: { id: connectionId, projectId: id },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'connection_not_found' },
        { status: 404 },
      )
    }

    await db.connection.delete({ where: { id: connectionId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API] DELETE /api/projects/[id]/connections/[connectionId] error:', err)
    return NextResponse.json({ error: 'failed_to_delete_connection' }, { status: 500 })
  }
}

