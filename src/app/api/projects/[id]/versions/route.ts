import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/projects/[id]/versions
 * 获取项目版本历史（按时间倒序）
 *
 * POST /api/projects/[id]/versions
 * 保存当前项目快照（版本名 + 节点/连线 JSON）
 * body: { name, description? }
 */

/** 获取项目的版本历史（存储在 AppSetting 中，key = versions_<projectId>） */
function getVersionKey(projectId: string) {
  return `versions_${projectId}`
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const setting = await db.appSetting.findUnique({
      where: { key: getVersionKey(id) },
    })
    if (!setting) {
      return NextResponse.json({ versions: [] })
    }
    const versions = JSON.parse(setting.value)
    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Failed to load versions:', error)
    return NextResponse.json({ versions: [] })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 })
    }

    // 获取当前项目节点和连线
    const [nodes, connections] = await Promise.all([
      db.node.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'asc' },
      }),
      db.connection.findMany({
        where: { projectId: id },
      }),
    ])

    // 构建版本快照
    const version = {
      id: `ver_${Date.now()}`,
      name,
      description: description ?? '',
      createdAt: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: connections.length,
      snapshot: {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          positionX: n.positionX,
          positionY: n.positionY,
          properties: n.properties,
        })),
        edges: connections.map((c) => ({
          id: c.id,
          source: c.sourceNodeId,
          target: c.targetNodeId,
          sourcePort: c.sourcePort,
          targetPort: c.targetPort,
          dataType: c.dataType,
        })),
      },
    }

    // 读取现有版本列表
    const existing = await db.appSetting.findUnique({
      where: { key: getVersionKey(id) },
    })
    const versions: unknown[] = existing ? JSON.parse(existing.value) : []

    // 最多保留 20 个版本
    versions.unshift(version)
    const trimmed = versions.slice(0, 20)

    // 保存
    await db.appSetting.upsert({
      where: { key: getVersionKey(id) },
      create: { key: getVersionKey(id), value: JSON.stringify(trimmed) },
      update: { value: JSON.stringify(trimmed) },
    })

    return NextResponse.json({ ok: true, version })
  } catch (error) {
    console.error('Failed to save version:', error)
    return NextResponse.json({ error: 'Failed to save version' }, { status: 500 })
  }
}
