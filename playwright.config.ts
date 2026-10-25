import path from 'node:path';

import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

/** テスト用マイクに流す音源（息に近いノイズ） */
const FAKE_MIC_FILE = path.join(process.cwd(), 'e2e/fixtures/breath-noise.wav');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['microphone'],
        // マイクは本物の代わりにテスト用の音源を使う
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            `--use-file-for-fake-audio-capture=${FAKE_MIC_FILE}`,
          ],
        },
      },
    },
  ],
  webServer: {
    // 通常の開発サーバーとは別の出力先・ポートを使い、開発サーバーを止めずに実行できるようにする
    command: `NEXT_DIST_DIR=.next-e2e npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
  },
});
