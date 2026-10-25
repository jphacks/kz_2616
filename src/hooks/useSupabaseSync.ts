import { useCallback, useEffect, useRef } from 'react';

import type { RealtimeChannel } from '@supabase/supabase-js';

import { CONFIG } from '@/config';
import { getSupabaseClient } from '@/lib/supabase';
import { isRoomFull } from '@/lib/room';
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
  /** 定員を超えて入ったので、この窓は入室できない */
  onRoomFull: () => void;
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
 * 合言葉から決まったチャンネルで、相手と筆跡・息・天気を送り合う（Supabase Realtime の Broadcast）。
 * 受信したデータは必ず検証してから使う。接続状態は Zustand のストアに入れる。
 * 環境変数が設定されていなければ何もしない（1 台で動く）。
 */
export function useSupabaseSync(
  callbacks: SyncCallbacks,
  channelName: string,
): UseSupabaseSyncResult {
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

    // この窓を区別するキーと、入室の時刻。定員の判定に使う（presence）
    const presenceKey = crypto.randomUUID();
    const channel = supabase.channel(channelName, { config: { presence: { key: presenceKey } } });
    let fullNotified = false;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ joinedAt: number }>();
        const members = Object.entries(state).flatMap(([key, metas]) =>
          metas.map((meta) => ({ key, joinedAt: meta.joinedAt })),
        );
        if (!fullNotified && isRoomFull(members, presenceKey, CONFIG.ROOM_MAX_MEMBERS)) {
          fullNotified = true;
          callbacksRef.current.onRoomFull();
        }
      })
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
          // 入室の時刻を知らせる（先に入った窓が優先される）
          void channel.track({ joinedAt: Date.now() });
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
  }, [channelName]);

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
