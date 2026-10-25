import { beforeEach, describe, expect, it } from 'vitest';

import { useAppStore } from './useAppStore';

const initialState = useAppStore.getState();

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true);
  });

  it('初期値は未接続', () => {
    expect(useAppStore.getState().connectionStatus).toBe('disconnected');
  });

  it('初期状態は未入室（合言葉は null）', () => {
    expect(useAppStore.getState().roomCode).toBeNull();
  });

  it('setRoomCode で合言葉を入れると入室状態になる', () => {
    useAppStore.getState().setRoomCode('はなこ');
    expect(useAppStore.getState().roomCode).toBe('はなこ');
  });

  it('相手の天気は未受信のときは null', () => {
    expect(useAppStore.getState().remoteWeather).toBeNull();
  });

  it('setRemoteWeather で相手の天気を更新できる', () => {
    useAppStore.getState().setRemoteWeather({ weatherCode: 61, sunrise: 'a', sunset: 'b' });
    expect(useAppStore.getState().remoteWeather?.weatherCode).toBe(61);
  });

  it('setConnectionStatus で接続状態を更新できる', () => {
    useAppStore.getState().setConnectionStatus('connected');
    expect(useAppStore.getState().connectionStatus).toBe('connected');
  });
});
