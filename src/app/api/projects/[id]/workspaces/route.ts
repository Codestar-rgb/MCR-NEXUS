import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/projects/[id]/workspaces
 *   返回项目所有工作区（type='workspace'）+ 节点/连线计数
 *
 * POST /api/projects/[id]/workspaces
 *   创建新工作区
 *   Body: { name, color?, icon? }
 */

type RouteCtx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params
    const project = await db.project.findUnique({ where: { id }, select: { id: true } })
    if (!project) return NextResponse.json({ error: 'project_not_found' }, { status: 404 })

    const workspaces = await db.subGraph.findMany({
      where: { projectId: id, type: 'workspace' },
      orderBy: { sortOrder: 'asc' },
    })

    const result = await Promise.all(
      workspaces.map(async (ws) => {
        const nodeCount = await db.node.count({
          where: { projectId: id, subGraphId: ws.id },
        })
        const nodeIds = await db.node.findMany({
          where: { projectId: id, subGraphId: ws.id },
          select: { id: true },
        })
        const ids = nodeIds.map((n) => n.id)
        const edgeCount = ids.length > 0
          ? await db.connection.count({
              where: {
                projectId: id,
                OR: [
                  { sourceNodeId: { in: ids } },
                  { targetNodeId: { in: ids } },
                ],
              },
            })
          : 0
        return {
          id: ws.id,
          name: ws.name,
          color: ws.color ?? 'teal',
          icon: ws.icon ?? 'Box',
          nodeCount,
          edgeCount,
          sortOrder: ws.sortOrder,
        }
      }),
    )

    return NextResponse.json({ workspaces: result })
  } catch (err) {
    console.error('[API] GET workspaces error:', err)
    return NextResponse.json({ error: 'failed_to_load_workspaces' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params
    const body = await req.json()
    const name = String(body.name ?? '新工作区').trim()
    if (!name) return NextResponse.json({ error: 'name_required' }, { status: 400 })

    const project = await db.project.findUnique({ where: { id }, select: { id: true } })
    if (!project) return NextResponse.json({ error: 'project_not_found' }, { status: 404 })

    const maxOrder = await db.subGraph.aggregate({
      where: { projectId: id, type: 'workspace' },
      _max: { sortOrder: true },
    })

    const workspace = await db.subGraph.create({
      data: {
        project: { connect: { id } },
        parentNodeId: null,
        name,
        type: 'workspace',
        color: String(body.color ?? 'teal'),
        icon: String(body.icon ?? 'Box'),
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    })

    // 如果指定了模板，创建模板节点
    const templateId = String(body.template ?? '')
    let nodeCount = 0
    let edgeCount = 0

    if (templateId && templateId !== 'blank') {
      const { WORKSPACE_TEMPLATES } = await import('@/lib/workspace-templates')
      const template = WORKSPACE_TEMPLATES.find((t) => t.id === templateId)
      if (template && template.nodes.length > 0) {
        const createdNodes: Array<{ id: string }> = []
        for (const tn of template.nodes) {
          const node = await db.node.create({
            data: {
              project: { connect: { id } },
              subGraph: { connect: { id: workspace.id } },
              type: tn.type,
              title: tn.title,
              positionX: tn.positionX,
              positionY: tn.positionY,
              isCollapsed: false,
              properties: JSON.stringify(tn.properties),
            },
          })
          createdNodes.push(node)
        }

        // 创建连线
        for (const te of template.edges) {
          const source = createdNodes[te.sourceIndex]
          const target = createdNodes[te.targetIndex]
          if (source && target) {
            await db.connection.create({
              data: {
                project: { connect: { id } },
                source: { connect: { id: source.id } },
                target: { connect: { id: target.id } },
                sourcePort: te.sourcePort,
                targetPort: te.targetPort,
                dataType: te.dataType,
              },
            })
          }
        }

        nodeCount = createdNodes.length
        edgeCount = template.edges.length
      }
    }

    return NextResponse.json({
      id: workspace.id,
      name: workspace.name,
      color: workspace.color,
      icon: workspace.icon,
      nodeCount,
      edgeCount,
      sortOrder: workspace.sortOrder,
    }, { status: 201 })
  } catch (err) {
    console.error('[API] POST workspace error:', err)
    return NextResponse.json({ error: 'failed_to_create_workspace' }, { status: 500 })
  }
}

