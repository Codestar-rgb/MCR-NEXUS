import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { ParsedLogCard } from '@/lib/capabilities/types'

/**
 * 构建历史 API（Task 5-C）
 *
 * GET  /api/projects/[id]/builds
 *   - 返回该项目最近 20 条构建历史（按 createdAt DESC）
 *   - output 字段截取前 200 字符作为 preview，避免响应过大
 *
 * POST /api/projects/[id]/builds
 *   - Body: { task, status, output, parsedCards, duration }
 *   - 创建一条构建记录
 *   - 返回完整记录（含 id / createdAt）
 *
 * DELETE /api/projects/[id]/builds
 *   - 清空该项目的全部构建历史
 */

type RouteCtx = { params: Promise<{ id: string }> }

/* ------------------------------------------------------------------ */
/* 响应类型                                                            */
/* ------------------------------------------------------------------ */

export interface BuildHistoryResponseItem {
  id: string
  projectId: string
  status: string
  task: string
  duration: number | null
  createdAt: string
  /** 日志前 200 字符预览（已截断） */
  outputPreview: string
  /** 解析卡片数量（不返回卡片详情，列表页只显示数量） */
  cardCount: number
}

export interface BuildDetailResponseItem extends BuildHistoryResponseItem {
  /** 完整日志 */
  output: string
  /** 完整解析卡片 */
  parsedCards: ParsedLogCard[]
}

/* ------------------------------------------------------------------ */
/* 工具                                                                */
/* ------------------------------------------------------------------ */

const OUTPUT_PREVIEW_LEN = 200

function makePreview(output: string): string {
  if (!output) return ''
  return output
    .slice(0, OUTPUT_PREVIEW_LEN)
    .replace(/\r?\n/g, ' ⏎ ')
    .trim()
}

function toListItem(row: {
  id: string
  projectId: string
  status: string
  task: string
  output: string
  parsedCards: string
  duration: number | null
  createdAt: Date
}): BuildHistoryResponseItem {
  let cardCount = 0
  try {
    const parsed = JSON.parse(row.parsedCards || '[]') as unknown
    if (Array.isArray(parsed)) cardCount = parsed.length
  } catch {
    cardCount = 0
  }
  return {
    id: row.id,
    projectId: row.projectId,
    status: row.status,
    task: row.task,
    duration: row.duration,
    createdAt: row.createdAt.toISOString(),
    outputPreview: makePreview(row.output),
    cardCount,
  }
}

function toDetailItem(row: {
  id: string
  projectId: string
  status: string
  task: string
  output: string
  parsedCards: string
  duration: number | null
  createdAt: Date
}): BuildDetailResponseItem {
  let cards: ParsedLogCard[] = []
  try {
    const parsed = JSON.parse(row.parsedCards || '[]') as unknown
    if (Array.isArray(parsed)) cards = parsed as ParsedLogCard[]
  } catch {
    cards = []
  }
  return {
    ...toListItem(row),
    output: row.output,
    parsedCards: cards,
  }
}

/* ------------------------------------------------------------------ */
/* GET                                                                  */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params

    // 校验项目存在
    const exists = await db.project.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json(
        { error: 'project_not_found' },
        { status: 404 },
      )
    }

    const rows = await db.buildLog.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json(rows.map(toListItem))
  } catch (err) {
    console.error('[API] GET /api/projects/[id]/builds error:', err)
    return NextResponse.json(
      { error: 'failed_to_load_build_history' },
      { status: 500 },
    )
  }
}

/* ------------------------------------------------------------------ */
/* POST                                                                 */
/* ------------------------------------------------------------------ */

interface CreateBuildBody {
  task: string
  status: string // "success" | "failed"
  output: string
  parsedCards?: ParsedLogCard[]
  duration?: number
}

export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params

    // 校验项目存在
    const exists = await db.project.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json(
        { error: 'project_not_found' },
        { status: 404 },
      )
    }

    let body: CreateBuildBody
    try {
      body = (await req.json()) as CreateBuildBody
    } catch {
      return NextResponse.json(
        { error: 'invalid_json_body' },
        { status: 400 },
      )
    }

    const task = String(body.task ?? '').trim()
    const status = String(body.status ?? '').trim()
    const output = String(body.output ?? '')
    const parsedCards: ParsedLogCard[] = Array.isArray(body.parsedCards)
      ? body.parsedCards
      : []
    const duration =
      typeof body.duration === 'number' && Number.isFinite(body.duration)
        ? Math.max(0, Math.floor(body.duration))
        : null

    if (!task || !status) {
      return NextResponse.json(
        { error: 'missing_required_fields', fields: ['task', 'status'] },
        { status: 400 },
      )
    }

    // 仅接受 success / failed / running / pending（与 schema 一致）
    const allowedStatus = new Set(['success', 'failed', 'running', 'pending'])
    if (!allowedStatus.has(status)) {
      return NextResponse.json(
        { error: 'invalid_status', status },
        { status: 400 },
      )
    }

    const created = await db.buildLog.create({
      data: {
        projectId: id,
        task,
        status,
        output,
        parsedCards: JSON.stringify(parsedCards),
        duration,
      },
    })

    return NextResponse.json(toDetailItem(created), { status: 201 })
  } catch (err) {
    console.error('[API] POST /api/projects/[id]/builds error:', err)
    return NextResponse.json(
      { error: 'failed_to_create_build_log' },
      { status: 500 },
    )
  }
}

/* ------------------------------------------------------------------ */
/* DELETE                                                               */
/* ------------------------------------------------------------------ */

export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params

    // 校验项目存在
    const exists = await db.project.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json(
        { error: 'project_not_found' },
        { status: 404 },
      )
    }

    await db.buildLog.deleteMany({ where: { projectId: id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[API] DELETE /api/projects/[id]/builds error:', err)
    return NextResponse.json(
      { error: 'failed_to_clear_build_history' },
      { status: 500 },
    )
  }
}
