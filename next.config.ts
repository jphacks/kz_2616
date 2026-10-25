import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // テスト用の開発サーバーが、通常の開発サーバーと出力先を分けられるように
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  turbopack: {
    root: process.cwd(),
  },
  // 開発中に iPad などの端末から開けるように、LAN と Tailscale のアドレスを許可する（開発サーバーのみ）
  allowedDevOrigins: ['10.*.*.*', '172.*.*.*', '192.168.*.*', '100.*.*.*', '**.ts.net'],
};

export default nextConfig;
