import { useEffect, useState } from 'react';

import { type Coordinates, fetchWeather } from '@/lib/weather';
import type { WeatherSnapshot } from '@/types';

export interface UseWeatherResult {
  weather: WeatherSnapshot | null;
  error: Error | null;
  isLoading: boolean;
}

interface FetchState {
  /** この結果がどの座標に対応するか */
  key: string;
  weather: WeatherSnapshot | null;
  error: Error | null;
}

const IDLE_RESULT: UseWeatherResult = { weather: null, error: null, isLoading: false };

/**
 * 座標に対応する天気を取得する。座標が null のときは取得しない。
 * 座標が変わると前の取得を中断して再取得する。
 */
export function useWeather(coordinates: Coordinates | null): UseWeatherResult {
  const [state, setState] = useState<FetchState | null>(null);
  const latitude = coordinates?.latitude;
  const longitude = coordinates?.longitude;
  const key = latitude === undefined || longitude === undefined ? null : `${latitude},${longitude}`;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined || key === null) {
      return;
    }

    const controller = new AbortController();

    fetchWeather({ latitude, longitude }, controller.signal)
      .then((weather) => {
        if (!controller.signal.aborted) {
          setState({ key, weather, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            key,
            weather: null,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      });

    return () => controller.abort();
  }, [key, latitude, longitude]);

  if (key === null) {
    return IDLE_RESULT;
  }
  // 現在の座標に対応する結果がまだなければ取得中とみなす
  if (state === null || state.key !== key) {
    return { weather: null, error: null, isLoading: true };
  }
  return { weather: state.weather, error: state.error, isLoading: false };
}
