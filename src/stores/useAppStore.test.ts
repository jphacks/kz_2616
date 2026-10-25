import { beforeEach, describe, expect, it } from 'vitest';

import { useAppStore } from './useAppStore';

const initialState = useAppStore.getState();

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true);
  });

  it('初期値は室温20℃・未接続', () => {
    const state = useAppStore.getState();
    expect(state.roomTemperatureC).toBe(20);
    expect(state.connectionStatus).toBe('disconnected');
  });

  it('setRoomTemperatureC で室温を更新できる', () => {
    useAppStore.getState().setRoomTemperatureC(-3);
    expect(useAppStore.getState().roomTemperatureC).toBe(-3);
  });

  it('setConnectionStatus で接続状態を更新できる', () => {
    useAppStore.getState().setConnectionStatus('connected');
    expect(useAppStore.getState().connectionStatus).toBe('connected');
  });
});
