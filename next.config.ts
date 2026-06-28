import type { NextConfig } from "next";

const isElectronBuild = process.env.BUILD_TARGET === "electron";

const nextConfig: NextConfig = {
  output: isElectronBuild ? "export" : "standalone",
  images: isElectronBuild ? { unoptimized: true } : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Electron 静态导出时排除 API Routes
  ...(isElectronBuild ? {
    // Next.js 16 App Router: 使用 pageExtensions 排除 API routes
    pageExtensions: ['tsx', 'jsx'],
    // 排除 api 目录下的 route.ts
    experimental: {
      // 让 API routes 在导出时被忽略
    },
  } : {}),
};

export default nextConfig;
