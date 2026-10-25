import { create } from 'zustand';

import type { ConnectionStatus, HaaSensitivity, WeatherOverride } from '@/types';

export interface AppState {
  /** 室温(℃)。ダミー値で、画面上のスライダーから入力する */
  roomTemperatureC: number;
  /** 同期チャンネルの接続状態 */
  connectionStatus: ConnectionStatus;
  /** デモ用の気象情報（'actual' は実際の天気） */
  weatherOverride: WeatherOverride;
  /** マイクの感度 */
  haaSensitivity: HaaSensitivity;
  setRoomTemperatureC: (temperatureC: number) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setWeatherOverride: (weather: WeatherOverride) => void;
  setHaaSensitivity: (sensitivity: HaaSensitivity) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  roomTemperatureC: 20,
  connectionStatus: 'disconnected',
  weatherOverride: 'actual',
  haaSensitivity: 'normal',
  setRoomTemperatureC: (temperatureC) => set({ roomTemperatureC: temperatureC }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setWeatherOverride: (weather) => set({ weatherOverride: weather }),
  setHaaSensitivity: (sensitivity) => set({ haaSensitivity: sensitivity }),
}));
