import { useCallback, useEffect, useRef } from 'react';

import type { RealtimeChannel } from '@supabase/supabase-js';

import { getSupabaseClient, SYNC_CHANNEL_NAME } from '@/lib/supabase';
import {
  type FogEvent,
  parseSyncEvent,
  type StrokeEvent,
  type WeatherEvent,
} from '@/schemas/events';
import { useAppStore } from '@/stores/useAppStore';
import type { Point, SharedWeather } from '@/types';

/** 受け取った天気から、天気の値だけを取り出す（タイムスタンプは使わない） */
function toSharedWeather(event: WeatherEvent): SharedWeather {
  return { weatherCode: event.weatherCode, sunrise: event.sunrise, sunset: event.sunset };
}

export interface SyncCallbacks {
  /** 相手の筆跡を受け取った */
  onRemoteStroke: (points: Point[]) => void;
  /** 相手が息を検出した */
  onRemoteFog: () => void;
  /** 相手の天気を受け取った（検証済み） */
  onRemoteWeather: (weather: SharedWeather) => void;
}

export interface UseSupabaseSyncResult {
  /** 自分の筆跡を相手に送る */
  sendStroke: (points: Point[]) => void;
  /** 自分の息の検出を相手に送る */
  sendFog: () => void;
  /** 自分の天気の値を相手に送る */
  sendWeather: (weather: SharedWeather) => void;
}

/**
 * 固定のチャンネルで、相手と筆跡・息を送り合う（Supabase Realtime の Broadcast）。
 * 受信したデータは必ず検証してから使う。接続状態は Zustand のストアに入れる。
 * 環境変数が設定されていなければ何もしない（1 台で動く）。
 */
export function useSupabaseSync(callbacks: SyncCallbacks): UseSupabaseSyncResult {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    const setConnectionStatus = useAppStore.getState().setConnectionStatus;
    setConnectionStatus('connecting');

    const channel = supabase
      .channel(SYNC_CHANNEL_NAME)
      .on('broadcast', { event: 'stroke' }, ({ payload }) => {
        const event = parseSyncEvent(payload);
        if (event?.type === 'stroke') {
          callbacksRef.current.onRemoteStroke(event.points);
        }
      })
      .on('broadcast', { event: 'fog' }, ({ payload }) => {
        const event = parseSyncEvent(payload);
        if (event?.type === 'fog') {
          callbacksRef.current.onRemoteFog();
        }
      })
      .on('broadcast', { event: 'weather' }, ({ payload }) => {
        const event = parseSyncEvent(payload);
        if (event?.type === 'weather') {
          callbacksRef.current.onRemoteWeather(toSharedWeather(event));
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('error');
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
        }
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
      setConnectionStatus('disconnected');
    };
  }, []);

  const sendStroke = useCallback((points: Point[]) => {
    const event: StrokeEvent = { type: 'stroke', points, timestamp: Date.now() };
    void channelRef.current?.send({ type: 'broadcast', event: 'stroke', payload: event });
  }, []);

  const sendFog = useCallback(() => {
    const event: FogEvent = { type: 'fog', timestamp: Date.now() };
    void channelRef.current?.send({ type: 'broadcast', event: 'fog', payload: event });
  }, []);

  const sendWeather = useCallback((weather: SharedWeather) => {
    const event: WeatherEvent = { type: 'weather', ...weather, timestamp: Date.now() };
    void channelRef.current?.send({ type: 'broadcast', event: 'weather', payload: event });
  }, []);

  return { sendStroke, sendFog, sendWeather };
}
