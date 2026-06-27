/**
 * NexCube 示例插件：魔法系统扩展
 *
 * 演示如何使用插件系统扩展 NexCube：
 * - 新增 "spell" 节点类型（魔法技能）
 * - 新增 "魔法系统" 工作区模板
 * - 新增 spell 代码生成器
 */

import {
  registerPlugin,
  type NexCubePlugin,
} from '@/lib/plugin-system'
import type { NodeTypeDefinition } from '@/lib/node-system'
import type { WorkspaceTemplate } from '@/lib/workspace-templates'

/** 魔法技能节点类型 */
const spellNodeType: NodeTypeDefinition = {
  kind: 'spell' as any,
  label: '魔法技能',
  category: 'core',
  icon: 'Wand2',
  color: 'violet',
  description: '自定义魔法技能（投射物/AOE/增益/减益）',
  defaultSize: { width: 240, height: 200 },
  inputPorts: [
    { id: 'trigger', label: '触发', dataType: 'boolean', direction: 'input' },
  ],
  outputPorts: [
    { id: 'spell_out', label: '效果', dataType: 'entity', direction: 'output' },
  ],
  supportsSubLogic: true,
  propertiesSchema: [
    { key: 'name', label: '名称', type: 'string', defaultValue: '新魔法', group: '基础' },
    { key: 'registryId', label: '注册 ID', type: 'string', defaultValue: 'new_spell', group: '基础' },
    { key: 'spellType', label: '魔法类型', type: 'select', defaultValue: 'projectile', group: '基础', options: [
      { label: '投射物', value: 'projectile' },
      { label: '范围伤害 (AOE)', value: 'aoe' },
      { label: '增益', value: 'buff' },
      { label: '减益', value: 'debuff' },
    ]},
    { key: 'damage', label: '伤害', type: 'number', defaultValue: 10, min: 0, max: 1000, step: 1, group: '效果' },
    { key: 'manaCost', label: '法力消耗', type: 'number', defaultValue: 20, min: 0, max: 500, step: 1, group: '效果' },
    { key: 'cooldown', label: '冷却 (tick)', type: 'number', defaultValue: 100, min: 0, max: 6000, step: 20, group: '效果' },
    { key: 'range', label: '射程', type: 'number', defaultValue: 16, min: 1, max: 64, step: 1, group: '效果' },
    { key: 'particleColor', label: '粒子颜色', type: 'color', defaultValue: '8B5CF6', group: '视觉' },
  ],
}

/** 魔法系统工作区模板 */
const magicTemplate: WorkspaceTemplate = {
  id: 'magic',
  name: '魔法系统',
  description: '魔法技能 + 法力系统 + 粒子效果',
  icon: 'Wand2',
  color: 'violet',
  nodes: [
    {
      type: 'spell',
      title: '火球术',
      positionX: 200,
      positionY: 200,
      properties: {
        name: '火球术',
        registryId: 'fireball',
        spellType: 'projectile',
        damage: 15,
        manaCost: 20,
        cooldown: 100,
        range: 16,
        particleColor: 'FF6B35',
      },
    },
  ],
  edges: [],
}

/** spell 代码生成器 */
function generateSpellCode(node: any, modId: string): string {
  const p = node.data?.properties ?? {}
  const className = String(p.registryId ?? 'new_spell')
    .split('_')
    .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')

  return `package com.${modId.replace(/_/g, '')}.spell;

import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.projectile.Projectile;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.Vec3;
import net.minecraft.core.particles.ParticleTypes;

/**
 * ${p.name ?? 'Custom Spell'} - 由 NexCube 插件生成
 * 类型: ${p.spellType}
 * 伤害: ${p.damage}
 * 法力消耗: ${p.manaCost}
 */
public class ${className} extends Projectile {

    public ${className}(EntityType<? extends Projectile> type, Level level) {
        super(type, level);
    }

    @Override
    public void tick() {
        super.tick();
        // 粒子效果
        this.level.addParticle(ParticleTypes.FLAME,
            this.getX(), this.getY(), this.getZ(),
            0, 0, 0);
    }

    @Override
    protected void onHit(Vec3 hitPos) {
        // 造成伤害
        this.level.explode(null, hitPos.x, hitPos.y, hitPos.z,
            ${p.damage}F, Level.ExplosionInteraction.MOB);
        this.discard();
    }

    public float getDamage() { return ${p.damage}F; }
    public int getManaCost() { return ${p.manaCost}; }
    public int getCooldown() { return ${p.cooldown}; }
    public float getRange() { return ${p.range}F; }
}
`
}

/** 插件定义 */
export const magicPlugin: NexCubePlugin = {
  manifest: {
    id: 'nexcube.magic',
    name: '魔法系统扩展',
    version: '1.0.0',
    author: 'NexCube',
    description: '添加魔法技能节点类型 + 模板 + 代码生成器',
    icon: 'Wand2',
    homepage: 'https://github.com/Codestar-rgb/MCR-NEXUS',
  },
  nodeTypes: {
    spell: spellNodeType,
  },
  templates: [magicTemplate],
  codeGenerators: {
    spell: generateSpellCode,
  },
  onActivate: (ctx) => {
    ctx.notify('魔法系统扩展已激活', 'success')
  },
}

// 注册插件（由 plugins/index.ts 在应用启动时统一加载）
// registerPlugin(magicPlugin)

export default magicPlugin
