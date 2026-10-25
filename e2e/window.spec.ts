import { expect, type Page, test } from '@playwright/test';

const OPEN_METEO_PATTERN = /api\.open-meteo\.com/;

/** Open-Meteo の応答を固定し、天気の表示を再現できるようにする */
const WEATHER_RESPONSE = {
  current: { temperature_2m: 15.3, weather_code: 3 },
  daily: {
    sunrise: ['2026-10-24T05:55'],
    sunset: ['2026-10-24T16:55'],
  },
};

/** 窓の中の Canvas（DOM の順: 手書き・曇り・天気）の、指定位置の透明度(0〜255) */
async function alphaAt(page: Page, canvasIndex: number, x: number, y: number): Promise<number> {
  return page.evaluate(
    ([index, px, py]) => {
      const canvas = document.querySelectorAll('canvas')[index];
      const context = canvas?.getContext('2d');
      if (!canvas || !context) {
        throw new Error(`canvas ${index} が見つかりません`);
      }
      const dpr = window.devicePixelRatio || 1;
      return context.getImageData(Math.round(px * dpr), Math.round(py * dpr), 1, 1).data[3] ?? -1;
    },
    [canvasIndex, x, y] as const,
  );
}

/** ガラス部分の中央（CSS px）。ガラスは窓枠の内側の要素 */
async function glassCenter(page: Page): Promise<{ x: number; y: number }> {
  const box = await page.locator('canvas').first().boundingBox();
  if (!box) {
    throw new Error('窓の Canvas の位置が取得できません');
  }
  return { x: box.width / 2, y: box.height / 2 };
}

/** 窓の中央を横切るように、マウスでなぞる */
async function drawAcrossCenter(page: Page): Promise<void> {
  const box = await page.locator('canvas').first().boundingBox();
  if (!box) {
    throw new Error('窓の Canvas の位置が取得できません');
  }
  const y = box.y + box.height / 2;
  const startX = box.x + box.width / 2 - 60;
  const endX = box.x + box.width / 2 + 60;

  await page.mouse.move(startX, y);
  await page.mouse.down();
  for (let step = 1; step <= 12; step += 1) {
    await page.mouse.move(startX + ((endX - startX) * step) / 12, y);
  }
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.route(OPEN_METEO_PATTERN, (route) => route.fulfill({ json: WEATHER_RESPONSE }));
});

test('窓の画面が表示され、曇り・手書き・天気の Canvas がある', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText(/室温 20\.0℃/)).toBeVisible();
  // 手書き・曇りの 2 枚に加え、天気の粒子用 Canvas が出る
  await expect(page.locator('canvas')).toHaveCount(3);

  // 窓は画面全体を覆い、余白がない
  const viewport = page.viewportSize();
  const box = await page.locator('canvas').nth(1).boundingBox();
  expect(box?.x).toBe(0);
  expect(box?.y).toBe(0);
  expect(box?.width).toBe(viewport?.width);
  expect(box?.height).toBe(viewport?.height);
});

test('なぞった部分の曇りが拭けるが、黒い線は出ない', async ({ page }) => {
  await page.goto('/');
  const center = await glassCenter(page);

  // 初期状態は曇っていない（息で曇らせるまで透明）
  expect(await alphaAt(page, 1, center.x, center.y)).toBeLessThan(10);

  await drawAcrossCenter(page);

  // 拭けている（曇りの透明度が下がる）
  expect(await alphaAt(page, 1, center.x, center.y)).toBeLessThan(50);
  // 手書きのインクは透明で、線は描かれない
  expect(await alphaAt(page, 0, center.x, center.y)).toBeLessThan(10);
});

test('ブラウザの大きさが変わっても、拭いた跡は消えない', async ({ page }) => {
  await page.goto('/');
  await drawAcrossCenter(page);

  // iPad のアドレスバーの出入りのように、大きさだけが変わる
  await page.setViewportSize({ width: 700, height: 820 });
  await expect
    .poll(async () => (await page.locator('canvas').nth(1).boundingBox())?.width)
    .toBe(700);

  const center = await glassCenter(page);
  expect(await alphaAt(page, 1, center.x, center.y)).toBeLessThan(50);
});

test.describe('タッチ操作（iPad 相当）', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 1024, height: 1366 } });

  test('指でなぞると曇りが拭ける', async ({ page }) => {
    await page.goto('/');
    const center = await glassCenter(page);
    // 初期状態は曇っていない
    expect(await alphaAt(page, 1, center.x, center.y)).toBeLessThan(10);

    // タッチ入力を直接送る（Chromium の DevTools プロトコル）
    const cdp = await page.context().newCDPSession(page);
    const startX = center.x - 60;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y: center.y }],
    });
    for (let step = 1; step <= 12; step += 1) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + (120 * step) / 12, y: center.y }],
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    expect(await alphaAt(page, 1, center.x, center.y)).toBeLessThan(50);
  });
});

test('息を聞くボタンでマイクを開き、止めると閉じる', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('マイクはオフです')).toBeVisible();

  await page.getByRole('button', { name: '息を聞く（マイクをオン）' }).click();
  // マイクの初期化は並列実行時に時間がかかることがあるため、待ち時間を長めにとる
  await expect(page.getByRole('status')).toHaveText('聞いています', { timeout: 15000 });

  await page.getByRole('button', { name: 'マイクを止める' }).click();
  await expect(page.getByRole('status')).toHaveText('マイクはオフです');
});

test('「はー」の息を検出すると、拭いた跡の上に曇りが戻る', async ({ page }) => {
  await page.goto('/');
  const center = await glassCenter(page);

  // 先に拭いておき、マイクの音で曇りが戻るかを確かめる
  await drawAcrossCenter(page);
  expect(await alphaAt(page, 1, center.x, center.y)).toBeLessThan(50);

  await page.getByRole('button', { name: '息を聞く（マイクをオン）' }).click();

  // テスト用マイクの息（ノイズ）を検出して、曇りが張り直される
  await expect
    .poll(() => alphaAt(page, 1, center.x, center.y), { timeout: 15000 })
    .toBeGreaterThan(200);
});

test('設定で気象情報を変えると、天気の表示が切り替わる', async ({ page }) => {
  await page.goto('/');
  // 手書き・曇りの 2 枚の Canvas（天気は含まない）
  await expect(page.locator('canvas')).toHaveCount(3);

  await page.getByRole('button', { name: /設定/ }).click();
  await page.getByLabel('気象情報').selectOption('clear');
  await expect(page.locator('canvas')).toHaveCount(2);

  await page.getByLabel('気象情報').selectOption('rain');
  await expect(page.locator('canvas')).toHaveCount(3);
});
