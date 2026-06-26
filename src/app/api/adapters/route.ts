import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/adapters
 *
 * 返回所有版本适配器（Forge / Fabric / NeoForge 等）。
 * 如果 DB 中无任何适配器，自动用 3 个默认适配器初始化：
 *   - forge-1.20.1: Forge 47.3.7, ForgeGradle 6.0.x（已安装）
 *   - fabric-1.20.1: Fabric 0.15.x, Fabric Loom 1.x（未安装）
 *   - neoforge-1.20.1: NeoForge 47.x, NeoGradle 7.x（未安装）
 *
 * 响应体：
 *   {
 *     adapters: AdapterDTO[]
 *   }
 *
 * AdapterDTO 形状：
 *   {
 *     id: string,
 *     name: string,
 *     loader: 'forge' | 'fabric' | 'neoforge',
 *     mcVersion: string,
 *     loaderVersion: string,
 *     gradlePlugin: string,
 *     pluginVersion: string,
 *     isInstalled: boolean,
 *     isOfficial: boolean,
 *     supportedApis: string[],
 *     description: string,
 *   }
 */
export async function GET() {
  try {
    let rows = await db.adapter.findMany({
      orderBy: { createdAt: 'asc' },
    })

    // 首次访问：用默认适配器初始化
    if (rows.length === 0) {
      await db.adapter.createMany({
        data: DEFAULT_ADAPTERS.map((a) => ({
          name: a.name,
          loader: a.loader,
          mcVersion: a.mcVersion,
          loaderVersion: a.loaderVersion,
          gradlePlugin: a.gradlePlugin,
          isInstalled: a.isInstalled,
          isOfficial: a.isOfficial,
        })),
      })
      rows = await db.adapter.findMany({
        orderBy: { createdAt: 'asc' },
      })
    }

    // DB row → DTO（合并 supportedApis / pluginVersion 等元数据）
    const adapters = rows.map((r) => {
      const meta = ADAPTER_META[r.name] ?? ADAPTER_META_FALLBACK
      return {
        id: r.id,
        name: r.name,
        loader: r.loader as 'forge' | 'fabric' | 'neoforge',
        mcVersion: r.mcVersion,
        loaderVersion: r.loaderVersion,
        gradlePlugin: r.gradlePlugin,
        pluginVersion: meta.pluginVersion,
        supportedApis: meta.supportedApis,
        description: meta.description,
        isInstalled: r.isInstalled,
        isOfficial: r.isOfficial,
      }
    })

    return NextResponse.json({ adapters })
  } catch (err) {
    console.error('[API] GET /api/adapters error:', err)
    return NextResponse.json(
      { error: 'failed_to_load_adapters' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/adapters
 *
 * Body: { name: string, isInstalled: boolean }
 *
 * 安装或卸载适配器。当前为 mock：仅更新 DB 状态，不真实下载。
 *
 * 成功响应：{ success: true, adapter: AdapterDTO }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body.name ?? '').trim()
    const isInstalled = Boolean(body.isInstalled)

    if (!name) {
      return NextResponse.json(
        { error: 'missing_required_field', field: 'name' },
        { status: 400 },
      )
    }

    const target = await db.adapter.findUnique({ where: { name } })
    if (!target) {
      return NextResponse.json(
        { error: 'adapter_not_found', name },
        { status: 404 },
      )
    }

    const updated = await db.adapter.update({
      where: { name },
      data: { isInstalled },
    })

    const meta = ADAPTER_META[updated.name] ?? ADAPTER_META_FALLBACK
    const adapter = {
      id: updated.id,
      name: updated.name,
      loader: updated.loader as 'forge' | 'fabric' | 'neoforge',
      mcVersion: updated.mcVersion,
      loaderVersion: updated.loaderVersion,
      gradlePlugin: updated.gradlePlugin,
      pluginVersion: meta.pluginVersion,
      supportedApis: meta.supportedApis,
      description: meta.description,
      isInstalled: updated.isInstalled,
      isOfficial: updated.isOfficial,
    }

    return NextResponse.json({ success: true, adapter })
  } catch (err) {
    console.error('[API] POST /api/adapters error:', err)
    return NextResponse.json(
      { error: 'failed_to_update_adapter' },
      { status: 500 },
    )
  }
}

/* ------------------------------------------------------------------ */
/* 默认适配器与元数据                                                    */
/* ------------------------------------------------------------------ */

interface DefaultAdapter {
  name: string
  loader: 'forge' | 'fabric' | 'neoforge'
  mcVersion: string
  loaderVersion: string
  gradlePlugin: string
  isInstalled: boolean
  isOfficial: boolean
}

const DEFAULT_ADAPTERS: DefaultAdapter[] = [
  {
    name: 'forge-1.20.1',
    loader: 'forge',
    mcVersion: '1.20.1',
    loaderVersion: '47.3.7',
    gradlePlugin: 'net.minecraftforge.gradle',
    isInstalled: true,
    isOfficial: true,
  },
  {
    name: 'fabric-1.20.1',
    loader: 'fabric',
    mcVersion: '1.20.1',
    loaderVersion: '0.15.x',
    gradlePlugin: 'fabric-loom',
    isInstalled: false,
    isOfficial: true,
  },
  {
    name: 'neoforge-1.20.1',
    loader: 'neoforge',
    mcVersion: '1.20.1',
    loaderVersion: '47.x',
    gradlePlugin: 'neoforge-gradle',
    isInstalled: false,
    isOfficial: true,
  },
]

/** 适配器扩展元数据（不入库，仅用于 UI 展示） */
interface AdapterMeta {
  pluginVersion: string
  supportedApis: string[]
  description: string
}

const ADAPTER_META: Record<string, AdapterMeta> = {
  'forge-1.20.1': {
    pluginVersion: '6.0.x',
    supportedApis: [
      'net.minecraftforge.eventbus.api.Event',
      'net.minecraft.world.entity.Entity',
      'net.minecraft.world.level.block.Block',
      'net.minecraft.world.item.Item',
      'net.minecraftforge.fml.common.Mod',
      'net.minecraftforge.registries.DeferredRegister',
      'net.minecraftforge.fml.javafmlmod.FMLJavaModLoadingContext',
      'net.minecraftforge.network.NetworkRegistry',
    ],
    description:
      'Forge 是 Minecraft 模组社区最成熟的加载器，提供完整的事件总线、注册表与网络包 API。NexCube 默认目标平台。',
  },
  'fabric-1.20.1': {
    pluginVersion: '1.x',
    supportedApis: [
      'net.fabricmc.fabric.api.event.Event',
      'net.fabricmc.fabric.api.object.builder.v1.block.FabricBlockSettings',
      'net.fabricmc.fabric.api.itemgroup.v1.ItemGroupEvents',
      'net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking',
      'net.fabricmc.loader.api.FabricLoader',
      'net.minecraft.entity.Entity',
      'net.minecraft.block.Block',
    ],
    description:
      'Fabric 是轻量级加载器，启动快、API 简洁，适合追求性能和最小侵入的模组开发。',
  },
  'neoforge-1.20.1': {
    pluginVersion: '7.x',
    supportedApis: [
      'net.neoforged.bus.api.Event',
      'net.neoforged.neoforge.registries.DeferredRegister',
      'net.neoforged.fml.common.Mod',
      'net.neoforged.neoforge.network.NetworkRegistry',
      'net.minecraft.world.entity.Entity',
      'net.minecraft.world.level.block.Block',
    ],
    description:
      'NeoForge 是 Forge 的社区分叉，兼容 Forge API 同时引入了更现代的扩展机制与更快的迭代节奏。',
  },
}

const ADAPTER_META_FALLBACK: AdapterMeta = {
  pluginVersion: 'unknown',
  supportedApis: [],
  description: '该适配器暂无详细元数据。',
}
