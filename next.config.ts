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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // 窓が使う機能だけを、このサイト自身に許可する（マイク・位置情報・全画面・画面の点灯）
          {
            key: 'Permissions-Policy',
            value:
              'microphone=(self), geolocation=(self), fullscreen=(self), screen-wake-lock=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
