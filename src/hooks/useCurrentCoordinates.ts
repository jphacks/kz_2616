import { useEffect, useState } from 'react';

import { CONFIG } from '@/config';
import type { Coordinates } from '@/lib/weather';

/** 位置情報の取得を待つ時間(ms)。許可の確認で止まっても、過ぎたら代わりの座標を使う */
const GEOLOCATION_TIMEOUT_MS = 5000;

/**
 * 端末の現在地を取得する。取得できない（許可がない・未対応・時間切れ）場合は
 * CONFIG.FALLBACK_LOCATION を使う。取得が終わるまでは null。
 */
export function useCurrentCoordinates(): Coordinates | null {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  useEffect(() => {
    let settled = false;
    const settle = (next: Coordinates) => {
      if (!settled) {
        settled = true;
        setCoordinates(next);
      }
    };
    const applyFallback = () => settle({ ...CONFIG.FALLBACK_LOCATION });

    const timeoutId = setTimeout(applyFallback, GEOLOCATION_TIMEOUT_MS);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          settle({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        applyFallback,
        { timeout: GEOLOCATION_TIMEOUT_MS },
      );
    } else {
      applyFallback();
    }

    return () => clearTimeout(timeoutId);
  }, []);

  return coordinates;
}
