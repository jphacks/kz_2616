"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WindowEvent } from "@/shared/schema";

// 通信なしで動かすためのモック版。Supabase版と同じ引数・戻り値にしてあり、差し替えるだけで使える
// 送ったイベントを自分に返す(実際の通信では自分には返らない=self: false と同じ動きにしたい場合は、この返却を外す)
export function useWindowChannel(
  roomCode: string,
  options: { onEvent: (event: WindowEvent) => void },
) {
  const [sourceId] = useState(() => crypto.randomUUID());

  // 最新のonEventを参照する。毎レンダーでエフェクトを張り直さないため
  const onEventRef = useRef(options.onEvent);
  useEffect(() => {
    onEventRef.current = options.onEvent;
  }, [options.onEvent]);

  const send = useCallback(
    (event: WindowEvent) => {
      // 送信前にも検証して、受信側と同じ条件で弾く
      const parsed = WindowEvent.safeParse(event);
      if (!parsed.success) {
        console.warn("[mock sync] 不正なイベントを捨てました", roomCode, parsed.error);
        return;
      }
      // 実際の通信に近づけるため、非同期で返す
      setTimeout(() => onEventRef.current(parsed.data), 0);
    },
    [roomCode],
  );

  // モックは常につながっている扱い
  return { send, sourceId, connected: true };
}
