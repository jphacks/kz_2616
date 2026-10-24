"use client";

import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { CONFIG } from "@/shared/config";
import type { Point, Stroke } from "@/shared/schema";

// 見た目の調整値。この部品の中だけで使うのでここに置く(他の担当と共有が必要になったらCONFIGへ移す)
const FOG_RGB = "222, 230, 236"; // 曇りの色。真っ白より少し青みがある方が窓らしい
const FOG_ALPHA_BASE = 0.75; // 普段の曇りの濃さ。薄いと拭いた跡との差が分かりにくい
const FOG_ALPHA_HAA = 0.92; // 「はー」直後の曇りの濃さ
const LOCAL_STROKE_WIDTH = 0.025; // 線の太さ(窓の幅に対する比率)。指で拭く幅に近づける
const MIN_POINT_DISTANCE = 0.003; // これより近い点は記録しない(送るデータ量を抑えるため)
const MAX_POINTS = 2000; // schemaのStroke.pointsの上限と合わせる

type FogCanvasProps = {
  remoteStrokes: Stroke[]; // 相手が書いたストローク(受信分)
  fogTrigger: number; // 値が変わるたびに窓を曇らせる(Date.now()を渡す)
  onLocalStroke: (stroke: Stroke) => void; // 自分が書き終えたときに呼ぶ
};

// 拭いた跡。拭いた時刻からの経過で曇りを戻す
type Wipe = { stroke: Stroke; wipedAt: number };
// 書いている途中のストローク。tを「開始からのms」にするため開始時刻を持つ
type ActiveStroke = { stroke: Stroke; startedAt: number };

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

// crypto.randomUUIDはHTTPS/localhostでしか使えないため、LAN内のhttp接続でも動くよう代替を用意する
function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// 正規化座標のストロークを、Canvasの実ピクセルに戻して曇りを消す
function eraseStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, alpha: number) {
  const { points } = stroke;
  if (points.length === 0 || alpha <= 0) return;
  const { width: w, height: h } = ctx.canvas;
  const lineWidth = stroke.width * w;
  ctx.globalAlpha = alpha;

  // 長さ0の線は描画されないので、タップだけの場合は点として消す
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x * w, points[0].y * h, lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // 1本のパスとして描くと、線の重なりで二重に消えずムラが出ない
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(points[0].x * w, points[0].y * h);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x * w, points[i].y * h);
  }
  ctx.stroke();
}

/**
 * 曇った窓。指でなぞると曇りが拭われ、CONFIG.FOG_RECOVER_MSかけて曇りが戻る。
 * 親要素に position: relative を付け、天気表示の上に重ねて使う。
 */
export function FogCanvas({ remoteStrokes, fogTrigger, onLocalStroke }: FogCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 描画用の状態はReactのstateにしない(毎フレーム変わるので再レンダーを避ける)
  const wipesRef = useRef<Wipe[]>([]);
  const activeRef = useRef<Map<number, ActiveStroke>>(new Map());
  const seenRemoteIdsRef = useRef<Set<string>>(new Set());
  const haaAtRef = useRef(Number.NEGATIVE_INFINITY);
  const dirtyRef = useRef(true);
  const prevFogTriggerRef = useRef(fogTrigger);
  const onLocalStrokeRef = useRef(onLocalStroke);

  useEffect(() => {
    onLocalStrokeRef.current = onLocalStroke;
  }, [onLocalStroke]);

  // 内部サイズ(width/height属性)を表示サイズ×devicePixelRatioに合わせ、タブレットでも線をくっきりさせる
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      dirtyRef.current = true;
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // 毎フレーム「曇りで塗る→拭いた跡を薄く消す」を描き直す。座標は正規化済みなのでリサイズにも強い
  useEffect(() => {
    let frameId = 0;
    const render = () => {
      frameId = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const now = performance.now();
      const recoverMs = CONFIG.FOG_RECOVER_MS;
      wipesRef.current = wipesRef.current.filter((wipe) => now - wipe.wipedAt < recoverMs);
      // 「はー」の直後は濃く、FOG_RECOVER_MSかけて普段の濃さへ戻す
      const haaRatio = Math.max(0, 1 - (now - haaAtRef.current) / recoverMs);

      // 変化が無いフレームは描かない(常時表示の端末の負荷を下げるため)
      const animating = wipesRef.current.length > 0 || activeRef.current.size > 0 || haaRatio > 0;
      if (!animating && !dirtyRef.current) return;
      dirtyRef.current = false;

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fogAlpha = FOG_ALPHA_BASE + (FOG_ALPHA_HAA - FOG_ALPHA_BASE) * haaRatio;
      ctx.fillStyle = `rgba(${FOG_RGB}, ${fogAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // destination-outで描いた所だけ曇りが透明になり、後ろの天気が見える
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "#000";
      ctx.fillStyle = "#000";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const wipe of wipesRef.current) {
        // 経過時間に比例して消す強さを弱め、曇りが均一な速さで戻るようにする
        eraseStroke(ctx, wipe.stroke, 1 - (now - wipe.wipedAt) / recoverMs);
      }
      for (const active of activeRef.current.values()) {
        eraseStroke(ctx, active.stroke, 1);
      }
    };
    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // 新しく届いた相手のストロークだけを、受信した時刻から曇り直すように登録する
  useEffect(() => {
    const now = performance.now();
    for (const stroke of remoteStrokes) {
      if (seenRemoteIdsRef.current.has(stroke.id)) continue;
      seenRemoteIdsRef.current.add(stroke.id);
      wipesRef.current.push({ stroke, wipedAt: now });
    }
  }, [remoteStrokes]);

  // fogTriggerが変わったら窓を一気に曇らせる(書いてあった文字も消える)
  useEffect(() => {
    if (prevFogTriggerRef.current === fogTrigger) return;
    prevFogTriggerRef.current = fogTrigger;
    haaAtRef.current = performance.now();
    wipesRef.current = [];
  }, [fogTrigger]);

  const toPoint = (clientX: number, clientY: number, timeStamp: number, startedAt: number): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0, t: 0 };
    // 指が窓の外へ出ても、schemaの0〜1に収める
    return {
      x: clamp01((clientX - rect.left) / rect.width),
      y: clamp01((clientY - rect.top) / rect.height),
      t: Math.max(0, Math.round(timeStamp - startedAt)),
    };
  };

  const finishStroke = (pointerId: number) => {
    const active = activeRef.current.get(pointerId);
    if (!active) return;
    activeRef.current.delete(pointerId);
    wipesRef.current.push({ stroke: active.stroke, wipedAt: performance.now() });
    onLocalStrokeRef.current(active.stroke);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    // 窓の外まで指が出ても線を追い続けるため
    e.currentTarget.setPointerCapture(e.pointerId);
    const startedAt = e.timeStamp;
    activeRef.current.set(e.pointerId, {
      stroke: {
        id: createId(),
        points: [toPoint(e.clientX, e.clientY, e.timeStamp, startedAt)],
        width: LOCAL_STROKE_WIDTH,
      },
      startedAt,
    });
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const native = e.nativeEvent;
    // 速くなぞったときに線が角ばらないよう、間引かれたイベントも拾う(未対応ブラウザは1点だけ)
    const coalesced = typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : [];
    const events = coalesced.length > 0 ? coalesced : [native];

    for (const ev of events) {
      const active = activeRef.current.get(e.pointerId);
      if (!active) return;
      const point = toPoint(ev.clientX, ev.clientY, ev.timeStamp, active.startedAt);
      const last = active.stroke.points[active.stroke.points.length - 1];
      if (Math.hypot(point.x - last.x, point.y - last.y) < MIN_POINT_DISTANCE) continue;
      active.stroke.points.push(point);

      // schemaの上限に達したら一度送り、同じ位置から新しいストロークとして続ける
      if (active.stroke.points.length >= MAX_POINTS) {
        finishStroke(e.pointerId);
        activeRef.current.set(e.pointerId, {
          stroke: { id: createId(), points: [{ ...point, t: 0 }], width: LOCAL_STROKE_WIDTH },
          startedAt: ev.timeStamp,
        });
      }
    }
  };

  const handlePointerEnd = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    finishStroke(e.pointerId);
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full select-none"
      // touch-action: none で、なぞったときに画面がスクロール・ズームしないようにする
      style={{ touchAction: "none", WebkitTouchCallout: "none" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      // 長押しでメニューが出ると書く操作が途切れるため
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
