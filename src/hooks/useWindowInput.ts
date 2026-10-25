import { type PointerEvent, useRef } from 'react';

import type { Point } from '@/types';

export interface WindowInputCallbacks {
  /** 指・マウス・ペンで押し始めた */
  onInputStart: (point: Point, pointerType: string) => void;
  /** 直前の点から今の点まで動いた */
  onInputMove: (from: Point, to: Point) => void;
  /** 指・マウス・ペンを離した */
  onInputEnd: () => void;
}

export interface WindowInputHandlers {
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
}

/**
 * 窓のガラス部分で、指・マウス・ペンの入力を Pointer Events で統一して扱う。
 * 1 本の指（ポインタ）だけを追跡し、別の指の操作は無視する。
 */
export function useWindowInput(callbacks: WindowInputCallbacks): WindowInputHandlers {
  const activePointerIdRef = useRef<number | null>(null);
  const lastPointRef = useRef<Point | null>(null);

  const toPoint = (event: PointerEvent<HTMLDivElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      // 筆圧が取れるのはペンだけ。それ以外は速度から推定する
      pressure: event.pointerType === 'pen' ? event.pressure : undefined,
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // マウスは左ボタンだけで反応する
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerIdRef.current = event.pointerId;

    const point = toPoint(event);
    lastPointRef.current = point;
    callbacks.onInputStart(point, event.pointerType);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const from = lastPointRef.current;
    if (activePointerIdRef.current !== event.pointerId || from === null) {
      return;
    }

    const to = toPoint(event);
    callbacks.onInputMove(from, to);
    lastPointRef.current = to;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    activePointerIdRef.current = null;
    lastPointRef.current = null;
    callbacks.onInputEnd();
  };

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
  };
}
