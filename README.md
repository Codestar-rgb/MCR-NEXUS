# NexCube

> 下一代 Minecraft 模组开发 IDE · 双轨协同 · 开箱即用

NexCube 是一款面向 Minecraft 模组开发的现代化集成开发环境，融合了节点可视化与代码 IDE 双轨协同、AST 智能同步、国内镜像极速构建等核心特性。

## 核心特性

### 🎯 双轨协同开发
- **节点视图**：拖拽式可视化编程，新手友好
- **代码 IDE**：Monaco 编辑器 + Java 语法高亮 + 577 个 MC API 智能提示
- **AST 双向同步**：节点 ↔ 代码实时映射，黑盒降级机制保护自定义代码

### 📦 工作区系统
- 多工作区隔离，每个工作区独立节点视图
- 6 种预置模板（实体/方块/物品/战斗/世界生成/空白）
- 工作区间滑动切换过渡

### 🔧 构建与调试
- Gradle 构建模拟器（真实流式输出）
- 节点级编译状态可视化（绿=成功/红=失败/黄=编译中）
- 126 条日志解析规则（英文报错 → 中文卡片 + 一键修复）
- 镜像源配置（阿里云/清华/官方）

### 🎨 设计系统
- 深蓝黑 + teal 品牌色配色
- 3D 水球（Three.js 真实球体 + 不规则表面）
- Framer Motion 统一动效系统
- 玻璃拟态 + 品牌辉光

### ⚡ 智能功能
- 实时代码预览侧栏（不切模式即可看生成代码）
- 命令面板（Ctrl+Shift+P，类 VSCode）
- 全局搜索（Ctrl+P）
- AI 节点推荐 + 自动布局（网格/螺旋/树形）
- 13 种节点类型（实体/方块/物品/装备/武器/食物/群系/结构/维度/药水等）

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5 (strict) |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 节点画布 | @xyflow/react v12 |
| 代码编辑器 | @monaco-editor/react |
| 终端 | @xterm/xterm |
| 3D | three.js + @react-three/fiber |
| 状态 | Zustand + TanStack Query |
| 数据库 | Prisma + SQLite |
| 桌面 | Electron 42 (代码资产) |

## 快速开始

```bash
# 安装依赖
bun install

# 推送数据库
bun run db:push

# 启动开发
bun run dev
```

访问 `http://localhost:3000`

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (项目/节点/连线/构建/镜像/适配器/设置)
│   └── page.tsx           # 主页入口
├── components/
│   ├── home/              # 主页组件
│   ├── workspace/         # 工作区组件
│   │   ├── canvas/        # 节点画布
│   │   ├── code-editor/   # Monaco 代码编辑器
│   │   ├── property-panel/# 属性面板
│   │   ├── terminal/      # xterm 终端
│   │   └── settings/      # 设置面板
│   └── ui/                # shadcn/ui 组件
├── lib/
│   ├── codegen/           # 代码生成引擎
│   ├── capabilities/      # 能力抽象层 (Web/Electron)
│   ├── node-system/       # 节点类型系统
│   └── ...
├── stores/                # Zustand 状态管理
├── hooks/                 # 自定义 Hooks
└── electron/              # Electron 桌面外壳（代码资产）
```

## Electron 桌面版

详见 [ELECTRON.md](./ELECTRON.md)

## 目标平台

- Minecraft 1.20.1
- Forge 47.3.7 (ForgeGradle 6.0.x)
- Java 17+

## License

MIT
