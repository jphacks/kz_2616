import { create } from 'zustand';

import type { ConnectionStatus, HaaSensitivity, SharedWeather, WeatherOverride } from '@/types';

export interface AppState {
  /** 同期チャンネルの接続状態 */
  connectionStatus: ConnectionStatus;
  /** 相手から受け取った天気。未受信なら null */
  remoteWeather: SharedWeather | null;
  /** デモ用の気象情報（'actual' は実際の天気） */
  weatherOverride: WeatherOverride;
  /** マイクの感度 */
  haaSensitivity: HaaSensitivity;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setRemoteWeather: (weather: SharedWeather | null) => void;
  setWeatherOverride: (weather: WeatherOverride) => void;
  setHaaSensitivity: (sensitivity: HaaSensitivity) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  connectionStatus: 'disconnected',
  remoteWeather: null,
  weatherOverride: 'actual',
  haaSensitivity: 'normal',
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setRemoteWeather: (weather) => set({ remoteWeather: weather }),
  setWeatherOverride: (weather) => set({ weatherOverride: weather }),
  setHaaSensitivity: (sensitivity) => set({ haaSensitivity: sensitivity }),
}));
