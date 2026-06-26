# NexCube 开发工作日志

> 项目：NexCube — Minecraft 模组双轨制 IDE
> 架构：Web 优先 (Next.js 16) + Electron 桌面资产 + 能力抽象层
> 目标：MC 1.20.1 + Forge 47.3.x
> 工作流：每阶段 → Agent Browser 自验证 → 更新本日志 → 等用户确认

---

## 全局配置锁定

| 项 | 值 |
|----|----|
| 框架 | Next.js 16 App Router + TypeScript 5 strict |
| 样式 | Tailwind CSS 4 + shadcn/ui (New York) |
| 主题 | 深色默认，next-themes 支持切换 |
| 节点画布 | @xyflow/react v12 |
| 代码编辑器 | @monaco-editor/react |
| 终端 | @xterm/xterm + @xterm/addon-fit |
| 状态 | Zustand v5 + TanStack Query v5 |
| 数据库 | Prisma + SQLite |
| 实时 | socket.io mini-service @ 3003 |
| 桌面 | Electron 42 + electron-builder |
| MC 版本 | 1.20.1 + Forge 47.3.x (ForgeGradle 6.0.x) |
| 节点类型 | 实体 / 方块 / 物品（首期） |
| 性能目标 | 万级节点（虚拟渲染 + WebGL + 聚合模式） |

## 阶段顺序

0. 架构地基（Prisma + 能力层 + 主页 + 创建向导）
1. 核心工作区壳层
2. 节点画布核心功能（React Flow + 三类节点 + 万级优化）
3. 属性面板与子节点逻辑
4. 代码模式与双向同步（Monaco + AST + 黑盒降级）
5. 终端与构建 UX（xterm + 日志翻译引擎 + Mod 导出）
6. 打磨与高级特性
7. Electron 桌面外壳（代码资产）

## 持续迭代优先级

1. 节点类型扩展（装备/武器/食物/群系/结构/维度/药水）
2. Forge API 字典扩展（200→500+ 类）
3. 日志规则库扩展（30→100+ 条）

---

## 工作记录区

（各 Task 按以下模板追加，不要覆盖已有内容）

```markdown
---
Task ID: <id>
Agent: <agent name>
Task: <description>

Work Log:
- step 1
- step 2

Stage Summary:
- key results
```

---
Task ID: 0-A
Agent: full-stack-developer
Task: 设计 NexCube 完整 Prisma Schema 并推送到 SQLite

Work Log:
- 读取 worklog.md 了解项目背景（NexCube MC 模组双轨制 IDE）
- 读取现有 prisma/schema.prisma（仅含示例 User/Post）
- 确认 .env: DATABASE_URL=file:/home/z/my-project/db/custom.db
- 用 Write 工具完全替换 schema.prisma，写入 9 个数据模型
- 运行 `bunx prisma db push --accept-data-loss` 推送 schema（成功，30ms）
- 运行 `bun run db:generate` 生成 Prisma Client（v6.19.2）
- 用 Python sqlite3 验证 9 张表均已创建：Adapter / AppSetting / BuildLog / CodeFile / Connection / MirrorConfig / Node / Project / SubGraph
- 修复点：为 Node 自关系 parent 添加 onDelete: SetNull（删除父节点组时子节点置空），为 Node.subGraph 添加 onDelete: SetNull（删除子图时节点解绑），避免级联冲突

Stage Summary:
- 完成模型：Project, Node, Connection, CodeFile, BuildLog, MirrorConfig, Adapter, SubGraph, AppSetting
- 数据库已创建于 /home/z/my-project/db/custom.db（143KB）
- Prisma Client v6.19.2 已生成，可 `import { db } from '@/lib/db'` 使用
- 外键级联策略：Project → 子表全部 Cascade；Node.parent / Node.subGraph 为 SetNull；Connection.source/target 为 Cascade
- 索引已建立：projectId / parentId / subGraphId / sourceNodeId / targetNodeId / parentNodeId
- 唯一约束：CodeFile(projectId, filePath)、MirrorConfig.name、Adapter.name、AppSetting.key
- SQLite 无 enum，所有枚举字段使用 String 类型（应用层校验）

---
Task ID: 0-C
Agent: full-stack-developer
Task: 实现 NexCube 启动主页 UI

Work Log:
- 读取 worklog.md 了解项目背景
- 配置 next-themes ThemeProvider（深色默认，attribute=class，enableSystem=false，disableTransitionOnChange）
- 新增 QueryProvider（TanStack Query v5，staleTime 30s）于 src/components/providers.tsx
- 更新 src/app/layout.tsx：包裹 ThemeProvider + QueryProvider，metadata 改为 NexCube 文案，lang=zh-CN
- 创建 src/types/index.ts：定义 Project / RecentProject / ModLoader / ProjectStatus 类型
- 创建 src/components/nexcube-logo.tsx：等距视角立方体 SVG，三面 emerald/teal 渐变，支持 size/className
- 创建 src/components/home/sidebar.tsx：桌面端 64px 纵向条 + 移动端顶部条，LOGO 顶部、设置齿轮底部（toast 提示"设置功能开发中"）
- 创建 src/components/home/welcome-header.tsx：渐变标题 + 副标题 + 版本号 v0.1.0 Alpha + MC/Forge 标注 + 右上角主题切换
- 创建 src/components/home/create-card.tsx：FilePlus 图标，hover 上浮 + emerald 边框 + 阴影，暴露 onCreate
- 创建 src/components/home/open-card.tsx：FolderOpen + TanStack Query 拉 /api/projects?recent=true（404 降级到空列表），最近列表 max-h-64 自定义滚动条，加载器徽章四色（forge=amber/fabric=teal/neoforge=cyan/quilt=emerald），date-fns 相对时间中文，暴露 onOpen/onCreate
- 创建 src/components/home/import-card.tsx：Download + Github 图标，GitHub/Gitee/ZIP 标注，暴露 onImport
- 创建 src/components/home/theme-toggle.tsx：Sun/Moon 切换，Tooltip 提示，mount 防水合闪烁
- 修改 src/app/page.tsx：整合 Sidebar + WelcomeHeader + 三卡片 + 底部 footer，三卡片 max-w-480px 居中，min-h-screen flex 布局，footer mt-auto 贴底
- globals.css 追加 .nexcube-scroll 自定义滚动条样式（6px 圆角半透明）
- 运行 bun run lint：0 errors / 0 warnings（清理 3 条 unused eslint-disable）
- 检查 dev.log：✓ Compiled，GET / 200 正常渲染；/api/projects?recent=true 返回 404（预期，OpenCard 已降级到 EmptyState）

Stage Summary:
- 主页完整 UI 完成，深色主题默认应用
- 三卡片（创建/打开/导入）hover 效果流畅，emerald 主色无 indigo/blue
- 最近项目列表走 TanStack Query，API 未就绪时降级到"暂无项目"空状态 + 引导创建
- LOGO 为 isometric cube 风格，emerald/teal 三面渐变
- 响应式：桌面 md+ 左导航+右内容；移动端导航收为顶部条，内容全宽
- 所有交互 callback（onCreate/onOpen/onImport）已暴露，console.log 占位待向导组件接入（Task 0-D）
- 类型定义 Project 与未来 Prisma 模型对齐，含 loader/mcVersion/modId 等字段

---
Task ID: 0-B
Agent: full-stack-developer
Task: 设计能力抽象层（Capability Layer）接口与实现

Work Log:
- 读取 worklog.md 了解项目背景
- 创建 src/lib/capabilities/ 目录
- 写入 types.ts（接口定义）
- 写入 web.ts（Web 实现，含模拟数据）
- 写入 electron.ts（Electron 实现，调用 preload IPC）
- 写入 index.ts（运行时选择 + 预定义镜像源）
- 写入 log-parser.ts（15+ 条真实 Gradle 报错规则）
- 运行 bun run lint 验证

Stage Summary:
- 能力层完整可用：fs/build/jdk/process/env
- Web 实现模拟，Electron 实现占位（代码资产）
- 日志解析引擎真实可用（15+ 规则）
- 预定义 3 个镜像源（阿里云/清华/官方）
- 统一导入入口：@/lib/capabilities

---
Task ID: 0-D (主代理亲自完成)
Agent: main (Z.ai Code)
Task: 创建项目向导 + Projects API + 接入主页 + 阶段 0 验收

Work Log:
- 创建 src/app/api/projects/route.ts (GET 列表/最近, POST 创建)
- 创建 src/app/api/projects/[id]/route.ts (GET/PATCH/DELETE)
- 创建 src/components/home/project-wizard.tsx (三步向导：基础信息→环境预检→完成)
  - 基础信息：图标上传(拖拽+圆角预览)、模组名称/ID(自动slugify)、作者、版本、MC版本选择、Forge版本联动、加载器徽章、存储路径、描述
  - 环境预检：Java/Git/路径/网络(阿里云镜像) 四项真实检测，调用 capabilities.env
  - 完成：成功动画 + 项目信息摘要
- 修改 src/app/page.tsx 接入向导，onCreated 关闭向导并触摸最近打开时间
- 运行 bun run lint：0 errors
- Agent Browser 自验证：
  * 主页渲染正常，深色主题，三卡片可见
  * 点击"创建项目"→向导打开
  * 填写表单→modId 自动生成 my_awesome_mod
  * 下一步→预检四项全部通过(Java 21.0.5, Git 2.43.0, 路径可用, 阿里云674ms)
  * 创建项目→数据库记录正确写入
  * 主页最近列表显示新项目
  * 移动端响应式正常
- VLM 视觉评审：专业、简洁、符合科技产品调性，无明显视觉缺陷
- 清理测试数据

Stage Summary:
- 阶段 0 全部完成 ✅
- Prisma 9 个模型 + 数据库已建 (Task 0-A)
- 能力抽象层完整(fs/build/jdk/process/env) + 21 条日志解析规则 (Task 0-B)
- 主页 UI 完整(深色+三卡片+最近列表+主题切换+设置入口) (Task 0-C)
- 项目创建向导完整(三步骤+图标上传+真实预检+表单校验) (Task 0-D)
- Projects API 完整 CRUD
- lint 通过，dev server 无 fatal error
- Agent Browser + VLM 双重验证通过
- 已具备进入阶段 1 (核心工作区壳层) 的条件
