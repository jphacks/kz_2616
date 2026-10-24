"use client";

import { useCallback, useState } from "react";
import { FogCanvas } from "@/features/fog-canvas/FogCanvas";
import { CONFIG } from "@/shared/config";
import type { Point, Stroke } from "@/shared/schema";

// 相手の線の代わりに描く円の分割数と大きさ(テスト用)
const DUMMY_CIRCLE_SEGMENTS = 48;
const DUMMY_CIRCLE_RADIUS = 0.12;

// 通信なしで「相手が書いた線」を作る。窓の中のランダムな位置に円を描く
function createDummyRemoteStroke(): Stroke {
  const cx = 0.2 + Math.random() * 0.6;
  const cy = 0.2 + Math.random() * 0.6;
  const points: Point[] = [];
  for (let i = 0; i <= DUMMY_CIRCLE_SEGMENTS; i++) {
    const angle = (i / DUMMY_CIRCLE_SEGMENTS) * Math.PI * 2;
    points.push({
      x: cx + Math.cos(angle) * DUMMY_CIRCLE_RADIUS,
      // 縦横比4:3なので、縦方向を伸ばして見た目を円にする
      y: cy + Math.sin(angle) * DUMMY_CIRCLE_RADIUS * CONFIG.WINDOW_ASPECT,
      t: i * 10,
    });
  }
  return { id: `dummy-${Date.now()}`, points, width: 0.02 };
}

// FogCanvasの単体確認ページ。「書ける・消える・曇りが戻る」を通信なしで確かめる
export default function FogTestPage() {
  const [remoteStrokes, setRemoteStrokes] = useState<Stroke[]>([]);
  const [fogTrigger, setFogTrigger] = useState(0);
  const [lastStroke, setLastStroke] = useState<Stroke | null>(null);
  const [localCount, setLocalCount] = useState(0);

  const handleLocalStroke = useCallback((stroke: Stroke) => {
    setLastStroke(stroke);
    setLocalCount((n) => n + 1);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-stone-700 p-4 text-white">
      <h1 className="text-lg font-bold">FogCanvas テスト</h1>

      <div
        className="relative w-full max-w-3xl overflow-hidden rounded border-8 border-amber-900"
        style={{ aspectRatio: CONFIG.WINDOW_ASPECT }}
      >
        {/* 天気表示の代わりの背景。拭くとこれが見える */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500 to-sky-200">
          <div className="absolute right-[15%] top-[15%] h-20 w-20 rounded-full bg-yellow-300" />
          <div className="absolute bottom-0 h-1/4 w-full bg-green-700" />
        </div>
        <FogCanvas
          remoteStrokes={remoteStrokes}
          fogTrigger={fogTrigger}
          onLocalStroke={handleLocalStroke}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-white px-4 py-2 text-stone-800"
          onClick={() => setFogTrigger(Date.now())}
        >
          はー(曇らせる)
        </button>
        <button
          type="button"
          className="rounded bg-white px-4 py-2 text-stone-800"
          onClick={() => setRemoteStrokes((prev) => [...prev, createDummyRemoteStroke()])}
        >
          相手が書いた(ダミー)
        </button>
      </div>

      <p className="text-sm">
        曇りが戻る時間: {CONFIG.FOG_RECOVER_MS / 1000}秒 / 自分のストローク: {localCount}本
        {lastStroke && ` / 直前の点数: ${lastStroke.points.length}`}
      </p>
    </div>
  );
}
