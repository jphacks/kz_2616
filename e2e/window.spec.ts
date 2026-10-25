import { expect, type Page, test } from '@playwright/test';

const OPEN_METEO_PATTERN = /api\.open-meteo\.com/;

/** Open-Meteo の応答を固定し、天気の表示を再現できるようにする */
const WEATHER_RESPONSE = {
  current: { weather_code: 3 },
  daily: {
    sunrise: ['2026-10-24T05:55'],
    sunset: ['2026-10-24T16:55'],
  },
};

/** 入室画面で合言葉を入力し、窓に入る */
async function enterRoom(page: Page): Promise<void> {
  await page.goto('/');
  // テストごとに別の合言葉にして、並列に動くテスト同士が同じチャンネルに入らないようにする
  await page.getByLabel('合言葉').fill(`テスト-${Math.random().toString(36).slice(2)}`);
  await page.getByRole('button', { name: '入室' }).click();
  // 曇りの Canvas の大きさが決まるまで待つ（決まる前に描くと、拭き跡が付かないことがある）
  await page.waitForFunction(
    () => (document.querySelector<HTMLCanvasElement>('canvas[class*="FogLayer"]')?.width ?? 0) > 0,
  );
}

/** 窓の中の Canvas の種類。コンポーネントの class 名で選ぶ（天気の Canvas が増えても順番に依らない） */
type Layer = 'DrawingLayer' | 'FogLayer';

/** 窓の中の Canvas の、指定位置の透明度(0〜255) */
async function alphaAt(page: Page, layer: Layer, x: number, y: number): Promise<number> {
  return page.evaluate(
    ([name, px, py]) => {
      const canvas = document.querySelector<HTMLCanvasElement>(`canvas[class*="${name}"]`);
      const context = canvas?.getContext('2d');
      if (!canvas || !context) {
        throw new Error(`${name} の Canvas が見つかりません`);
      }
      const dpr = window.devicePixelRatio || 1;
      return context.getImageData(Math.round(px * dpr), Math.round(py * dpr), 1, 1).data[3] ?? -1;
    },
    [layer, x, y] as const,
  );
}

/** ガラス部分の中央（CSS px）。ガラスは窓枠の内側の要素 */
async function glassCenter(page: Page): Promise<{ x: number; y: number }> {
  const box = await page.locator('canvas[class*="FogLayer"]').boundingBox();
  if (!box) {
    throw new Error('窓の Canvas の位置が取得できません');
  }
  return { x: box.width / 2, y: box.height / 2 };
}

/** 窓の中央を横切るように、マウスでなぞる */
async function drawAcrossCenter(page: Page): Promise<void> {
  const box = await page.locator('canvas[class*="FogLayer"]').boundingBox();
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
    // 入力の処理が追いつくまで少し待つ（混雑時に、動きが読み取られる前に確かめてしまわないように）
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
  await page.waitForTimeout(50);
}

test.beforeEach(async ({ page }) => {
  await page.route(OPEN_METEO_PATTERN, (route) => route.fulfill({ json: WEATHER_RESPONSE }));
});

test('窓の画面が表示され、曇り・手書き・天気の Canvas がある', async ({ page }) => {
  await enterRoom(page);

  // 天気・手書き・曇りの 3 枚の Canvas
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
  await enterRoom(page);
  const center = await glassCenter(page);

  // 初期状態は曇っていない（息で曇らせるまで透明）
  expect(await alphaAt(page, 'FogLayer', center.x, center.y)).toBeLessThan(10);

  await drawAcrossCenter(page);

  // 拭けている（曇りの透明度が下がる）
  expect(await alphaAt(page, 'FogLayer', center.x, center.y)).toBeLessThan(50);
  // 手書きのインクは透明で、線は描かれない
  expect(await alphaAt(page, 'DrawingLayer', center.x, center.y)).toBeLessThan(10);
});

test('ブラウザの大きさが変わっても、拭いた跡は消えない', async ({ page }) => {
  await enterRoom(page);
  await drawAcrossCenter(page);

  // iPad のアドレスバーの出入りのように、大きさだけが変わる
  await page.setViewportSize({ width: 700, height: 820 });
  await expect
    .poll(async () => (await page.locator('canvas').nth(1).boundingBox())?.width)
    .toBe(700);

  const center = await glassCenter(page);
  expect(await alphaAt(page, 'FogLayer', center.x, center.y)).toBeLessThan(50);
});

test.describe('タッチ操作（iPad 相当）', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 1024, height: 1366 } });

  test('指でなぞると曇りが拭ける', async ({ page }) => {
    await enterRoom(page);
    const center = await glassCenter(page);
    // 初期状態は曇っていない
    expect(await alphaAt(page, 'FogLayer', center.x, center.y)).toBeLessThan(10);

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

    expect(await alphaAt(page, 'FogLayer', center.x, center.y)).toBeLessThan(50);
  });
});

test('息を聞くボタンでマイクを開き、止めると閉じる', async ({ page }) => {
  await enterRoom(page);
  await expect(page.getByText('マイクはオフです')).toBeVisible();

  await page.getByRole('button', { name: '息を聞く（マイクをオン）' }).click();
  // マイクの初期化は並列実行時に時間がかかることがあるため、待ち時間を長めにとる
  await expect(page.getByRole('status').filter({ hasText: '聞いています' })).toBeVisible({
    timeout: 15000,
  });

  await page.getByRole('button', { name: 'マイクを止める' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'マイク' })).toHaveText(
    'マイクはオフです',
  );
});

test('「はー」の息を検出すると、拭いた跡の上に曇りが戻る', async ({ page }) => {
  await enterRoom(page);
  const center = await glassCenter(page);

  // 先に拭いておき、マイクの音で曇りが戻るかを確かめる
  await drawAcrossCenter(page);
  expect(await alphaAt(page, 'FogLayer', center.x, center.y)).toBeLessThan(50);

  await page.getByRole('button', { name: '息を聞く（マイクをオン）' }).click();

  // テスト用マイクの息（ノイズ）を検出して、曇りが張り直される
  await expect
    .poll(() => alphaAt(page, 'FogLayer', center.x, center.y), { timeout: 15000 })
    .toBeGreaterThan(200);
});

test('設定で気象情報を変えると、天気の背景の色が切り替わる', async ({ page }) => {
  await enterRoom(page);
  // 天気の背景（CSS の空）の色を読む
  const sky = page.locator('div[class*="__sky"]').first();
  await expect(sky).toHaveAttribute('style', /background/);
  const before = await sky.getAttribute('style');

  await page.getByRole('button', { name: /設定/ }).click();
  await page.getByLabel('気象情報').selectOption('rain');
  await expect.poll(async () => sky.getAttribute('style')).not.toBe(before);
});

test('合言葉が空のままでは、窓に入れない', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '入室' }).click();

  await expect(page.locator('p[role="alert"]')).toHaveText('合言葉を入力してください');
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('窓に入ると同期の状態が出て、退室すると入室画面に戻る', async ({ page }) => {
  await enterRoom(page);

  // 接続中か同期中のどちらかの文言が出る（同期の設定がない環境では、同期していませんになる）
  await expect(page.locator('p[role="status"][data-status]')).toHaveText(
    /接続しています|同期中|同期していません/,
  );

  await page.getByRole('button', { name: '退室' }).click();
  await expect(page.getByLabel('合言葉')).toBeVisible();
  await expect(page.locator('p[role="status"][data-status]')).toHaveText('同期していません');
});

test.describe('画面の常時点灯', () => {
  test.use({ permissions: ['screen-wake-lock'] });

  test('許可されていると、窓を開いている間は画面の点灯を保つ', async ({ page }) => {
    // 窓が頼んだ点灯（番兵）の状態を、読めるように記録しておく
    await page.addInitScript(() => {
      const request = navigator.wakeLock.request.bind(navigator.wakeLock);
      Object.assign(window, { __held: false });
      navigator.wakeLock.request = async (type) => {
        const sentinel = await request(type);
        (window as unknown as { __held: boolean }).__held = !sentinel.released;
        return sentinel;
      };
    });
    await page.goto('/');
    await page.getByLabel('合言葉').fill(`点灯-${Math.random().toString(36).slice(2)}`);
    await page.getByRole('button', { name: '入室' }).click();

    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __held: boolean }).__held))
      .toBe(true);
  });
});
