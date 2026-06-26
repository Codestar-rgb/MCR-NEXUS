import type { NextConfig } from "next";

/**
 * 条件化静态导出
 * ---
 * - 默认（Web 开发/部署）：`output: 'standalone'`，保留 API Routes + SSR
 * - `BUILD_TARGET=electron` 时：`output: 'export'`，生成纯静态到 `out/`，
 *   供 Electron 加载本地 file:// 或自定义 protocol
 *
 * 注意：永久开启 `output: 'export'` 会破坏所有 API Routes（导出时不存在服务端），
 * 因此**必须**用环境变量控制。
 */
const isElectronBuild = process.env.BUILD_TARGET === "electron";

const nextConfig: NextConfig = {
  output: isElectronBuild ? "export" : "standalone",
  // 静态导出时图片优化不可用（需要服务端）
  images: isElectronBuild ? { unoptimized: true } : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
