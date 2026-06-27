/**
 * AST 同步引擎（简化版）—— Task 4-C
 *
 * 策略：模板特征匹配（不使用完整 Java AST 解析器）
 *
 * NexCube 的"节点为基准，代码为增强"原则下，代码 → 节点同步只做：
 *   - 提取 Forge 注册模式中的数值属性（生命值/攻击力/护甲/硬度/发光/堆叠）
 *   - 检测黑盒代码区域（用户写的、无法用节点表达的代码）
 *   - 检测高风险修改（类名变更 / mod ID 变更 / 注册删除），需要用户确认
 *
 * 不做：
 *   - 任意 Java AST 解析（太重，需要 JDK 依赖）
 *   - 创建/删除节点（节点只能由用户在画布上创建）
 *   - 子图节点逻辑同步（逻辑子节点的代码生成由后续阶段实现）
 *
 * 黑盒区域标记（必须与 code-generator.ts 一致）：
 *   // === NexCube 黑盒区域 ===
 *   ... 用户代码 ...
 *   // === NexCube 黑盒区域 结束 ===
 *
 * @see src/lib/codegen/code-generator.ts (Task 4-B)
 * @see src/hooks/use-bidirectional-sync.ts (Task 4-C)
 */

import type { FlowNode, NodeProperties } from '@/lib/node-system'

/* ------------------------------------------------------------------ */
/* 黑盒区域标记常量（与 code-generator.ts 共享）                         */
/* ------------------------------------------------------------------ */

export const BLACKBOX_START_MARKER = '// === NexCube 黑盒区域 ==='
export const BLACKBOX_END_MARKER = '// === NexCube 黑盒区域 结束 ==='

/* ------------------------------------------------------------------ */
/* 类型定义                                                            */
/* ------------------------------------------------------------------ */

/** 从代码解析出的黑盒代码块 */
export interface BlackboxBlock {
  /** 关联节点 ID（如黑盒代码片段归属于某个 entity/block/item 节点） */
  nodeId?: string
  /** 起始行号（1-based，包含开始标记） */
  startLine: number
  /** 结束行号（1-based，包含结束标记） */
  endLine: number
  /** 黑盒代码内容（不含标记行） */
  code: string
  /** 标题（默认"自定义代码"） */
  title: string
}

/** 节点属性变更（用于回写到画布节点） */
export interface NodeUpdate {
  nodeId: string
  properties: Partial<NodeProperties>
}

/** 高风险修改类型 */
export type HighRiskChangeType =
  | 'class_rename' // 类名被修改，可能影响 Forge 注册
  | 'mod_id_change' // @Mod("xxx") 中的 modId 被修改
  | 'registration_delete' // 注册调用被注释/删除

/** 高风险修改（不自动应用，等待用户确认） */
export interface HighRiskChange {
  type: HighRiskChangeType
  description: string
  nodeId?: string
  /** 行号（1-based） */
  line: number
}

/** 同步结果 */
export interface SyncResult {
  /** 从代码解析出的节点属性变更 */
  nodeUpdates: NodeUpdate[]
  /** 检测到的黑盒代码块 */
  blackboxBlocks: BlackboxBlock[]
  /** 高风险修改（需要用户确认） */
  highRiskChanges: HighRiskChange[]
}

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

/** registry_id → PascalCase 类名（如 ruby_golem → RubyGolem） */
export function toClassName(registryId: string): string {
  if (!registryId) return ''
  return registryId
    .split('_')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('')
}

/* ------------------------------------------------------------------ */
/* 黑盒区域检测                                                        */
/* ------------------------------------------------------------------ */

/**
 * 检测代码中的黑盒区域
 *
 * 匹配规则：
 *  - 起始标记：包含 BLACKBOX_START_MARKER 字符串，且不包含"结束"
 *  - 结束标记：包含 BLACKBOX_END_MARKER 字符串（即"=== NexCube 黑盒区域 结束 ==="）
 *  - 嵌套：不支持嵌套，遇到新的开始标记会重置当前块
 *
 * @param code 完整代码字符串
 * @param linkedNodeId 可选：将所有黑盒块关联到此节点 ID
 */
export function detectBlackboxBlocks(
  code: string,
  linkedNodeId?: string,
): BlackboxBlock[] {
  const blocks: BlackboxBlock[] = []
  const lines = code.split('\n')
  let inBlackbox = false
  let startLine = 0
  let codeContent = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const hasBlackboxMarker = line.includes('=== NexCube 黑盒区域')
    const isEndMarker = line.includes('结束')

    if (hasBlackboxMarker && !isEndMarker) {
      // 开始标记（如果已在黑盒中，重置当前块）
      inBlackbox = true
      startLine = i + 1 // 1-based
      codeContent = ''
    } else if (hasBlackboxMarker && isEndMarker && inBlackbox) {
      // 结束标记
      inBlackbox = false
      blocks.push({
        nodeId: linkedNodeId,
        startLine,
        endLine: i + 1, // 1-based
        code: codeContent.trim(),
        title: '自定义代码',
      })
    } else if (inBlackbox) {
      codeContent += line + '\n'
    }
  }

  // 如果文件末尾仍在黑盒中（缺少结束标记），仍然保留该块
  if (inBlackbox) {
    blocks.push({
      nodeId: linkedNodeId,
      startLine,
      endLine: lines.length,
      code: codeContent.trim(),
      title: '自定义代码',
    })
  }

  return blocks
}

/* ------------------------------------------------------------------ */
/* 主入口：解析代码 → 节点属性变更 / 黑盒块 / 高风险变更                 */
/* ------------------------------------------------------------------ */

/**
 * 解析 Java 代码，提取节点属性变更、黑盒块、高风险修改
 *
 * @param code 完整 Java 文件内容
 * @param linkedNodes 关联的画布节点（通常只有 1 个：linkedNodeId 对应的节点）
 */
export function parseCodeToNodeUpdates(
  code: string,
  linkedNodes: FlowNode[],
): SyncResult {
  const result: SyncResult = {
    nodeUpdates: [],
    blackboxBlocks: [],
    highRiskChanges: [],
  }

  const lines = code.split('\n')

  // 1. 检测黑盒区域
  //    若有 linkedNodeId（代码来自节点关联的文件），所有黑盒块归属此节点
  const linkedNodeId = linkedNodes[0]?.id
  const blackboxBlocks = detectBlackboxBlocks(code, linkedNodeId)
  result.blackboxBlocks.push(...blackboxBlocks)

  // 2. 检测类名变更（高风险）
  //    public class ClassName → 期望 ClassName === toClassName(registryId)
  const classMatch = code.match(/public\s+class\s+(\w+)/)
  if (classMatch) {
    const className = classMatch[1]
    for (const node of linkedNodes) {
      if (node.data.kind === 'group') continue
      const registryId = (node.data.properties?.registryId as string) ?? ''
      // 期望类名 = toClassName(registryId) + 节点类型后缀（Entity/Block/Item）
      const expectedClassName = toClassName(registryId)
      if (
        expectedClassName &&
        className !== expectedClassName &&
        !className.startsWith(expectedClassName) // 允许加后缀（如 RubyEntity）
      ) {
        const lineIdx = lines.findIndex((l) => l.includes(`class ${className}`))
        result.highRiskChanges.push({
          type: 'class_rename',
          description: `类名从 ${expectedClassName}* 改为 ${className}，可能影响 Forge 注册`,
          nodeId: node.id,
          line: lineIdx >= 0 ? lineIdx + 1 : 1,
        })
      }
    }
  }

  // 3. 提取节点属性变更（正则匹配 Forge 注册模式中的数值）
  for (const node of linkedNodes) {
    const props = node.data.properties ?? {}
    const updates: Partial<NodeProperties> = {}

    // 3.1 生命值：Attributes.MAX_HEALTH, XX.XF
    if (props.health !== undefined) {
      const m = code.match(/Attributes\.MAX_HEALTH,\s*([\d.]+)F/)
      if (m) {
        const newVal = parseFloat(m[1])
        if (!Number.isNaN(newVal) && newVal !== props.health) {
          updates.health = newVal
        }
      }
    }

    // 3.2 攻击力：Attributes.ATTACK_DAMAGE, XX.XF
    if (props.attack !== undefined) {
      const m = code.match(/Attributes\.ATTACK_DAMAGE,\s*([\d.]+)F/)
      if (m) {
        const newVal = parseFloat(m[1])
        if (!Number.isNaN(newVal) && newVal !== props.attack) {
          updates.attack = newVal
        }
      }
    }

    // 3.3 护甲：Attributes.ARMOR, XX.XF
    if (props.armor !== undefined) {
      const m = code.match(/Attributes\.ARMOR,\s*([\d.]+)F/)
      if (m) {
        const newVal = parseFloat(m[1])
        if (!Number.isNaN(newVal) && newVal !== props.armor) {
          updates.armor = newVal
        }
      }
    }

    // 3.4 护甲韧性：Attributes.ARMOR_TOUGHNESS, XX.XF
    if (props.armorToughness !== undefined) {
      const m = code.match(/Attributes\.ARMOR_TOUGHNESS,\s*([\d.]+)F/)
      if (m) {
        const newVal = parseFloat(m[1])
        if (!Number.isNaN(newVal) && newVal !== props.armorToughness) {
          updates.armorToughness = newVal
        }
      }
    }

    // 3.5 移动速度：Attributes.MOVEMENT_SPEED, XX.XXF
    if (props.movementSpeed !== undefined) {
      const m = code.match(/Attributes\.MOVEMENT_SPEED,\s*([\d.]+)F/)
      if (m) {
        const newVal = parseFloat(m[1])
        if (!Number.isNaN(newVal) && newVal !== props.movementSpeed) {
          updates.movementSpeed = newVal
        }
      }
    }

    // 3.6 硬度：.strength(X.XF, Y.YF) → 第一个参数是硬度
    if (props.hardness !== undefined) {
      const m = code.match(/\.strength\(([\d.]+)F,\s*([\d.]+)F\)/)
      if (m) {
        const newVal = parseFloat(m[1])
        if (!Number.isNaN(newVal) && newVal !== props.hardness) {
          updates.hardness = newVal
        }
      }
    }

    // 3.7 抗爆度：.strength(X.XF, Y.YF) → 第二个参数是抗爆度
    if (props.resistance !== undefined) {
      const m = code.match(/\.strength\(([\d.]+)F,\s*([\d.]+)F\)/)
      if (m) {
        const newVal = parseFloat(m[2])
        if (!Number.isNaN(newVal) && newVal !== props.resistance) {
          updates.resistance = newVal
        }
      }
    }

    // 3.8 发光等级：.lightLevel(state -> XX)
    if (props.lightLevel !== undefined) {
      const m = code.match(/\.lightLevel\(state\s*->\s*(\d+)\)/)
      if (m) {
        const newVal = parseInt(m[1], 10)
        if (!Number.isNaN(newVal) && newVal !== props.lightLevel) {
          updates.lightLevel = newVal
        }
      }
    }

    // 3.9 最大堆叠：.stacksTo(XX)
    if (props.maxStackSize !== undefined) {
      const m = code.match(/\.stacksTo\((\d+)\)/)
      if (m) {
        const newVal = parseInt(m[1], 10)
        if (!Number.isNaN(newVal) && newVal !== props.maxStackSize) {
          updates.maxStackSize = newVal
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      result.nodeUpdates.push({ nodeId: node.id, properties: updates })
    }
  }

  // 4. 检测 mod ID 变更（高风险）
  //    @Mod("mod_id") → 若与当前项目 modId 不一致，标记为高风险
  //    实际比对需调用方传入 expectedModId（见 parseCodeWithModId）
  const modIdMatch = code.match(/@Mod\("([^"]+)"\)/)
  if (modIdMatch) {
    // 仅记录存在，不直接判定（需要 expectedModId 比对）
    // 由 parseCodeWithModId 处理
  }

  return result
}

/**
 * 带 modId 校验的代码解析（高风险检测增强）
 *
 * @param code 完整 Java 文件内容
 * @param linkedNodes 关联的画布节点
 * @param expectedModId 项目当前 modId（用于检测 @Mod 注解变更）
 */
export function parseCodeWithModId(
  code: string,
  linkedNodes: FlowNode[],
  expectedModId: string,
): SyncResult {
  const result = parseCodeToNodeUpdates(code, linkedNodes)

  // 检测 @Mod("xxx") 是否变更
  const modIdMatch = code.match(/@Mod\("([^"]+)"\)/)
  if (modIdMatch && modIdMatch[1] !== expectedModId) {
    const lineIdx = code
      .split('\n')
      .findIndex((l) => l.includes(`@Mod("${modIdMatch[1]}")`))
    result.highRiskChanges.push({
      type: 'mod_id_change',
      description: `Mod ID 从 "${expectedModId}" 改为 "${modIdMatch[1]}"，可能影响所有注册`,
      line: lineIdx >= 0 ? lineIdx + 1 : 1,
    })
  }

  return result
}

/* ------------------------------------------------------------------ */
/* 代码行 → 节点定位（用于代码选中高亮节点）                            */
/* ------------------------------------------------------------------ */

/** 可定位到节点的文件（linkedNodeId 关联） */
export interface LinkableFile {
  filePath: string
  content: string
  linkedNodeId?: string
}

/**
 * 根据代码行号找到关联节点
 *
 * 策略：
 *  1. 优先返回当前选中文件的 linkedNodeId
 *  2. 若行号在某个黑盒区域中，也返回该黑盒块关联的 nodeId
 *
 * @param line 1-based 行号
 * @param files 所有生成的文件（含 linkedNodeId）
 * @param currentFilePath 当前选中的文件路径
 */
export function findNodeByCodeLine(
  line: number,
  files: LinkableFile[],
  currentFilePath?: string,
): { nodeId?: string; filePath: string } {
  const currentFile = currentFilePath
    ? files.find((f) => f.filePath === currentFilePath)
    : files[0]

  if (currentFile) {
    // 检查当前行是否在黑盒区域内
    const blackboxBlocks = detectBlackboxBlocks(currentFile.content, currentFile.linkedNodeId)
    const inBlackbox = blackboxBlocks.find(
      (b) => line >= b.startLine && line <= b.endLine,
    )
    if (inBlackbox?.nodeId) {
      return { nodeId: inBlackbox.nodeId, filePath: currentFile.filePath }
    }
    // 默认返回文件关联的节点
    if (currentFile.linkedNodeId) {
      return { nodeId: currentFile.linkedNodeId, filePath: currentFile.filePath }
    }
  }

  return { filePath: currentFile?.filePath ?? '' }
}
