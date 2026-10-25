import { useEffect, useRef } from 'react';

import { CONFIG } from '@/config';
import type { Point } from '@/types';

/** 水滴の跡の太さ(px)。拭き跡の 1/3 ほどの細さ */
const DRIP_RADIUS_PX = 6;
/** 水滴の元にする、なぞった点の数の上限 */
const MAX_ORIGINS = 300;
/** 元の点から横にずらす幅(px)。同じ線からまっすぐ落ちすぎないように */
const ORIGIN_JITTER_PX = 2;

interface Drip {
  head: Point;
  /** あと何 px 落ちるか */
  remaining: number;
  /** 落ちた跡。時刻つきで、相手の画面にも同じ速さで再生する */
  path: Point[];
}

interface DripState {
  /** 今の息の間になぞった点。水滴はここから落ちる */
  origins: Point[];
  drips: Drip[];
  endAt: number;
  nextSpawnAt: number;
  lastMs: number;
  frame: number | null;
}

type Wipe = (from: Point | null, to: Point) => void;
type GlassSize = () => { width: number; height: number };
type Drop = (path: Point[]) => void;

function randomBetween(min: number, max: number): number {
  return min + (max - min) * Math.random();
}

function nextSpawnDelay(): number {
  return randomBetween(CONFIG.DRIP_INTERVAL_MIN_MS, CONFIG.DRIP_INTERVAL_MAX_MS);
}

/** 1 フレーム分、水滴を生んで落とす。落ち切った水滴は drop に渡す */
function runDrips(state: DripState, now: number, wipe: Wipe, drop: Drop): void {
  // なぞった場所がなければ、水滴は生まれない
  if (now < state.endAt && now >= state.nextSpawnAt && state.origins.length > 0) {
    const origin = state.origins[Math.floor(Math.random() * state.origins.length)];
    const head = {
      x: origin.x + randomBetween(-ORIGIN_JITTER_PX, ORIGIN_JITTER_PX),
      y: origin.y,
      t: 0,
      r: DRIP_RADIUS_PX,
    };
    state.drips.push({
      head,
      remaining: randomBetween(CONFIG.DRIP_LENGTH_MIN_PX, CONFIG.DRIP_LENGTH_MAX_PX),
      path: [head],
    });
    state.nextSpawnAt = now + nextSpawnDelay();
  }

  const elapsedMs = now - state.lastMs;
  const distance = CONFIG.DRIP_SPEED_PX_PER_SEC * (elapsedMs / 1000);
  state.lastMs = now;
  state.drips = state.drips.filter((drip) => {
    const previous = drip.head;
    const next = {
      x: previous.x,
      y: previous.y + distance,
      t: (previous.t ?? 0) + elapsedMs,
      r: DRIP_RADIUS_PX,
    };
    wipe(previous, next);
    drip.head = next;
    drip.path.push(next);
    drip.remaining -= distance;
    if (drip.remaining > 0) {
      return true;
    }
    drop(drip.path);
    return false;
  });

  if (now < state.endAt || state.drips.length > 0) {
    state.frame = requestAnimationFrame((next) => runDrips(state, next, wipe, drop));
  } else {
    state.frame = null;
  }
}

/**
 * 曇りが濃いとき、なぞった線から水滴が垂れて細い跡を残す。
 * 水滴は拭き跡と同じ扱いで消す。ユーザーの操作ではないので、再曇りの待ち時間は動かさない。
 * start を呼ぶと、その息のあいだ、なぞった点から水滴が生まれる（なぞっていなければ生まれない）。
 * 落ち切った水滴の跡は drop に渡す（相手の画面にも送るため）。
 */
export function useWaterDrips(
  wipe: Wipe,
  getSize: GlassSize,
  drop: Drop,
): { start: (durationMs: number) => void; markDrawn: (point: Point) => void } {
  const wipeRef = useRef(wipe);
  const sizeRef = useRef(getSize);
  const dropRef = useRef(drop);
  const stateRef = useRef<DripState>({
    origins: [],
    drips: [],
    endAt: 0,
    nextSpawnAt: 0,
    lastMs: 0,
    frame: null,
  });

  useEffect(() => {
    wipeRef.current = wipe;
    sizeRef.current = getSize;
    dropRef.current = drop;
  }, [wipe, getSize, drop]);

  useEffect(() => {
    const state = stateRef.current;
    return () => {
      if (state.frame !== null) {
        cancelAnimationFrame(state.frame);
        state.frame = null;
      }
    };
  }, []);

  const start = (durationMs: number) => {
    const state = stateRef.current;
    const now = performance.now();
    state.endAt = now + durationMs;
    // 息のたびに、なぞった場所を数え直す
    state.origins = [];
    if (state.frame === null) {
      state.lastMs = now;
      state.nextSpawnAt = now + nextSpawnDelay();
      state.frame = requestAnimationFrame((next) =>
        runDrips(
          state,
          next,
          (...args) => wipeRef.current(...args),
          (path) => dropRef.current(path),
        ),
      );
    }
  };

  // なぞった点を、水滴の元として覚えておく
  const markDrawn = (point: Point) => {
    const state = stateRef.current;
    state.origins.push(point);
    if (state.origins.length > MAX_ORIGINS) {
      state.origins.shift();
    }
  };

  return { start, markDrawn };
}
