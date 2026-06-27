import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { ParsedLogCard } from '@/lib/capabilities/types'

/**
 * 单条构建详情 API（Task 5-C）
 *
 * GET /api/projects/[id]/builds/[buildId]
 *   - 返回单条构建的完整日志 + 解析卡片
 *
 * DELETE /api/projects/[id]/builds/[buildId]
 *   - 删除单条构建记录
 */

type RouteCtx = {
  params: Promise<{ id: string; buildId: string }>
}

interface BuildDetailResponse {
  id: string
  projectId: string
  status: string
  task: string
  output: string
  parsedCards: ParsedLogCard[]
  duration: number | null
  createdAt: string
}

function toResponse(row: {
  id: string
  projectId: string
  status: string
  task: string
  output: string
  parsedCards: string
  duration: number | null
  createdAt: Date
}): BuildDetailResponse {
  let cards: ParsedLogCard[] = []
  try {
    const parsed = JSON.parse(row.parsedCards || '[]') as unknown
    if (Array.isArray(parsed)) cards = parsed as ParsedLogCard[]
  } catch {
    cards = []
  }
  return {
    id: row.id,
    projectId: row.projectId,
    status: row.status,
    task: row.task,
    output: row.output,
    parsedCards: cards,
    duration: row.duration,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id, buildId } = await params

    const row = await db.buildLog.findUnique({
      where: { id: buildId },
    })

    if (!row || row.projectId !== id) {
      return NextResponse.json(
        { error: 'build_not_found' },
        { status: 404 },
      )
    }

    return NextResponse.json(toResponse(row))
  } catch (err) {
    console.error('[API] GET /api/projects/[id]/builds/[buildId] error:', err)
    return NextResponse.json(
      { error: 'failed_to_load_build_detail' },
      { status: 500 },
    )
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id, buildId } = await params

    const row = await db.buildLog.findUnique({
      where: { id: buildId },
      select: { projectId: true },
    })

    if (!row || row.projectId !== id) {
      return NextResponse.json(
        { error: 'build_not_found' },
        { status: 404 },
      )
    }

    await db.buildLog.delete({ where: { id: buildId } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API] DELETE /api/projects/[id]/builds/[buildId] error:', err)
    return NextResponse.json(
      { error: 'failed_to_delete_build' },
      { status: 500 },
    )
  }
}
