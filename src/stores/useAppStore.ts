import { create } from 'zustand';

import { CONFIG } from '@/config';
import type { ConnectionStatus, HaaSensitivity, SharedWeather, WeatherOverride } from '@/types';

export interface AppState {
  /** 同期チャンネルの接続状態 */
  connectionStatus: ConnectionStatus;
  /** 入室に使った合言葉。未入室なら null */
  roomCode: string | null;
  /** 入室できなかった理由（満員など）。入室画面に出す */
  joinError: string | null;
  /** 相手から受け取った天気。未受信なら null */
  remoteWeather: SharedWeather | null;
  /** デモ用の気象情報（'actual' は実際の天気） */
  weatherOverride: WeatherOverride;
  /** マイクの感度 */
  haaSensitivity: HaaSensitivity;
  /** 息のあと、曇りが透明に戻るまでの時間(ms)。撮影用に設定から変えられる */
  fogFadeOutMs: number;
  /** 息のあと、水滴が垂れる時間(ms)。撮影用に設定から変えられる */
  dripActiveMs: number;
  /** 背景に使う撮影用の時刻("HH:mm")。null なら実際の時刻 */
  demoTime: string | null;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setRemoteWeather: (weather: SharedWeather | null) => void;
  setRoomCode: (roomCode: string | null) => void;
  setJoinError: (message: string | null) => void;
  setWeatherOverride: (weather: WeatherOverride) => void;
  setHaaSensitivity: (sensitivity: HaaSensitivity) => void;
  setFogFadeOutMs: (ms: number) => void;
  setDripActiveMs: (ms: number) => void;
  setDemoTime: (time: string | null) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  connectionStatus: 'disconnected',
  roomCode: null,
  joinError: null,
  remoteWeather: null,
  weatherOverride: 'actual',
  haaSensitivity: 'normal',
  fogFadeOutMs: CONFIG.BREATH_FOG_FADE_OUT_MS,
  dripActiveMs: CONFIG.DRIP_ACTIVE_MS,
  demoTime: null,
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setRemoteWeather: (weather) => set({ remoteWeather: weather }),
  setRoomCode: (roomCode) => set({ roomCode, joinError: null }),
  setJoinError: (message) => set({ joinError: message }),
  setWeatherOverride: (weather) => set({ weatherOverride: weather }),
  setHaaSensitivity: (sensitivity) => set({ haaSensitivity: sensitivity }),
  setFogFadeOutMs: (ms) => set({ fogFadeOutMs: ms }),
  setDripActiveMs: (ms) => set({ dripActiveMs: ms }),
  setDemoTime: (time) => set({ demoTime: time }),
}));
