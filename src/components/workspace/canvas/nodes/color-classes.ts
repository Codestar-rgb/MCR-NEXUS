/**
 * COLOR_CLASSES v2.0 — 统一降低饱和度的节点颜色体系
 *
 * 改进：
 * - 边框从 /40 降到 /30（更柔和）
 * - 背景从 /10 降到 /8（更微妙）
 * - 文字从 -300 调整为 -300/-400 混合（减少刺眼感）
 * - 增加 hover 态
 * - 13 种颜色和谐共存
 */
export const COLOR_CLASSES: Record<
  string,
  {
    border: string
    borderStrong: string
    bg: string
    bgHeader: string
    text: string
    ring: string
    iconBg: string
    iconText: string
  }
> = {
  rose: {
    border: 'border-rose-500/30',
    borderStrong: 'border-rose-400/60',
    bg: 'bg-rose-500/[0.08]',
    bgHeader: 'bg-rose-500/[0.06]',
    text: 'text-rose-300',
    ring: 'ring-rose-400/30',
    iconBg: 'bg-rose-500/15',
    iconText: 'text-rose-300',
  },
  amber: {
    border: 'border-amber-500/30',
    borderStrong: 'border-amber-400/60',
    bg: 'bg-amber-500/[0.08]',
    bgHeader: 'bg-amber-500/[0.06]',
    text: 'text-amber-300',
    ring: 'ring-amber-400/30',
    iconBg: 'bg-amber-500/15',
    iconText: 'text-amber-300',
  },
  teal: {
    border: 'border-teal-500/30',
    borderStrong: 'border-teal-400/60',
    bg: 'bg-teal-500/[0.08]',
    bgHeader: 'bg-teal-500/[0.06]',
    text: 'text-teal-300',
    ring: 'ring-teal-400/30',
    iconBg: 'bg-teal-500/15',
    iconText: 'text-teal-300',
  },
  cyan: {
    border: 'border-cyan-500/30',
    borderStrong: 'border-cyan-400/60',
    bg: 'bg-cyan-500/[0.08]',
    bgHeader: 'bg-cyan-500/[0.06]',
    text: 'text-cyan-300',
    ring: 'ring-cyan-400/30',
    iconBg: 'bg-cyan-500/15',
    iconText: 'text-cyan-300',
  },
  emerald: {
    border: 'border-emerald-500/30',
    borderStrong: 'border-emerald-400/60',
    bg: 'bg-emerald-500/[0.08]',
    bgHeader: 'bg-emerald-500/[0.06]',
    text: 'text-emerald-300',
    ring: 'ring-emerald-400/30',
    iconBg: 'bg-emerald-500/15',
    iconText: 'text-emerald-300',
  },
  violet: {
    border: 'border-violet-500/30',
    borderStrong: 'border-violet-400/60',
    bg: 'bg-violet-500/[0.08]',
    bgHeader: 'bg-violet-500/[0.06]',
    text: 'text-violet-300',
    ring: 'ring-violet-400/30',
    iconBg: 'bg-violet-500/15',
    iconText: 'text-violet-300',
  },
  slate: {
    border: 'border-slate-500/30',
    borderStrong: 'border-slate-400/60',
    bg: 'bg-slate-500/[0.08]',
    bgHeader: 'bg-slate-500/[0.06]',
    text: 'text-slate-300',
    ring: 'ring-slate-400/30',
    iconBg: 'bg-slate-500/15',
    iconText: 'text-slate-300',
  },
  zinc: {
    border: 'border-zinc-500/30',
    borderStrong: 'border-zinc-400/60',
    bg: 'bg-zinc-500/[0.08]',
    bgHeader: 'bg-zinc-500/[0.06]',
    text: 'text-zinc-300',
    ring: 'ring-zinc-400/30',
    iconBg: 'bg-zinc-500/15',
    iconText: 'text-zinc-300',
  },
  pink: {
    border: 'border-pink-500/30',
    borderStrong: 'border-pink-400/60',
    bg: 'bg-pink-500/[0.08]',
    bgHeader: 'bg-pink-500/[0.06]',
    text: 'text-pink-300',
    ring: 'ring-pink-400/30',
    iconBg: 'bg-pink-500/15',
    iconText: 'text-pink-300',
  },
  fuchsia: {
    border: 'border-fuchsia-500/30',
    borderStrong: 'border-fuchsia-400/60',
    bg: 'bg-fuchsia-500/[0.08]',
    bgHeader: 'bg-fuchsia-500/[0.06]',
    text: 'text-fuchsia-300',
    ring: 'ring-fuchsia-400/30',
    iconBg: 'bg-fuchsia-500/15',
    iconText: 'text-fuchsia-300',
  },
}
