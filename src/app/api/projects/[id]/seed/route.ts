import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createDefaultProperties } from '@/lib/node-system/node-factory'
import { NODE_TYPE_REGISTRY, type NodeKind } from '@/lib/node-system/node-types'

/**
 * POST /api/projects/[id]/seed
 *   为新项目创建 3 个示例节点（实体/方块/物品）+ 2 条连线。
 *   - 用 NODE_TYPE_REGISTRY 的默认 properties
 *   - 物品 → 方块（itemstack 端口），方块 → 实体（block_out → trigger）
 *
 *   响应：{ ok: true, nodes: [...], connections: [...] }
 *   幂等：如果项目已有节点，直接返回已有数据，不重复创建。
 */

type RouteCtx = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = await params

    const project = await db.project.findUnique({ where: { id }, select: { id: true, modId: true } })
    if (!project) {
      return NextResponse.json({ error: 'project_not_found' }, { status: 404 })
    }

    // 幂等：已有节点则返回
    const existing = await db.node.findMany({ where: { projectId: id } })
    if (existing.length > 0) {
      const existingConns = await db.connection.findMany({ where: { projectId: id } })
      return NextResponse.json({
        ok: true,
        seeded: false,
        message: 'project_already_has_nodes',
        nodes: existing,
        connections: existingConns,
      })
    }

    // 3 个种子节点的定义：基于注册表的默认 properties，并稍作定制
    const modId = project.modId ?? 'example_mod'

    // 先创建一个默认工作区
    const workspace = await db.subGraph.create({
      data: {
        project: { connect: { id } },
        parentNodeId: null,
        name: '主工作区',
        type: 'workspace',
        color: 'teal',
        icon: 'Box',
        sortOrder: 0,
      },
    })

    const entityProps = createDefaultProperties('entity')
    entityProps.name = `${project.modId ?? 'Ruby'} Golem`
    entityProps.registryId = `${modId}_golem`
    entityProps.health = 80
    entityProps.attack = 12
    entityProps.armor = 4
    entityProps.aiType = 'melee'

    const blockProps = createDefaultProperties('block')
    blockProps.name = `${project.modId ?? 'Ruby'} Block`
    blockProps.registryId = `${modId}_block`
    blockProps.hardness = 5
    blockProps.resistance = 10
    blockProps.lightLevel = 7

    const itemProps = createDefaultProperties('item')
    itemProps.name = `${project.modId ?? 'Ruby'}`
    itemProps.registryId = `${modId}_gem`
    itemProps.maxStackSize = 64
    itemProps.rarity = 'uncommon'

    const sizes = (kind: NodeKind) => NODE_TYPE_REGISTRY[kind]?.defaultSize

    const created = await db.$transaction(async (tx) => {
      const entity = await tx.node.create({
        data: {
          project: { connect: { id } },
          subGraph: { connect: { id: workspace.id } },
          type: 'entity',
          title: String(entityProps.name),
          positionX: 560,
          positionY: 120,
          width: sizes('entity')?.width ?? 240,
          height: sizes('entity')?.height ?? 200,
          isCollapsed: false,
          properties: JSON.stringify(entityProps),
        },
      })

      const block = await tx.node.create({
        data: {
          project: { connect: { id } },
          subGraph: { connect: { id: workspace.id } },
          type: 'block',
          title: String(blockProps.name),
          positionX: 300,
          positionY: 120,
          width: sizes('block')?.width ?? 240,
          height: sizes('block')?.height ?? 220,
          isCollapsed: false,
          properties: JSON.stringify(blockProps),
        },
      })

      const item = await tx.node.create({
        data: {
          project: { connect: { id } },
          subGraph: { connect: { id: workspace.id } },
          type: 'item',
          title: String(itemProps.name),
          positionX: 60,
          positionY: 160,
          width: sizes('item')?.width ?? 240,
          height: sizes('item')?.height ?? 200,
          isCollapsed: false,
          properties: JSON.stringify(itemProps),
        },
      })

      // 连线 1: item.item_out → block.trigger （物品产出关联到方块）
      const conn1 = await tx.connection.create({
        data: {
          project: { connect: { id } },
          source: { connect: { id: item.id } },
          target: { connect: { id: block.id } },
          sourcePort: 'item_out',
          targetPort: 'trigger',
          dataType: 'itemstack',
        },
      })

      // 连线 2: block.block_out → entity.trigger （方块作为实体生成条件）
      const conn2 = await tx.connection.create({
        data: {
          project: { connect: { id } },
          source: { connect: { id: block.id } },
          target: { connect: { id: entity.id } },
          sourcePort: 'block_out',
          targetPort: 'trigger',
          dataType: 'itemstack',
        },
      })

      return { entity, block, item, conn1, conn2 }
    })

    return NextResponse.json({
      ok: true,
      seeded: true,
      nodes: [created.item, created.block, created.entity],
      connections: [created.conn1, created.conn2],
    })
  } catch (err) {
    console.error('[API] POST /api/projects/[id]/seed error:', err)
    return NextResponse.json({ error: 'failed_to_seed' }, { status: 500 })
  }
}

