import type { HaaSensitivity } from '@/types';

/** 音量(RMS)がこの値以上なら「息がかかっている」とみなす */
export const HAA_RMS_THRESHOLD = 0.01;

/**
 * スペクトルの平坦度(0〜1)がこの値以上なら「ノイズ状（息）」とみなす。
 * 声や笛のような音は特定の周波数にピークがあり、平坦度が低くなる。
 */
export const HAA_FLATNESS_THRESHOLD = 0.1;

/** 息がこの時間続いたら「はー」とみなす(ms) */
export const HAA_MIN_DURATION_MS = 200;

/** 息と判定する基準（感度に応じて変える） */
export interface HaaThresholds {
  rms: number;
  flatness: number;
}

/** 感度ごとの基準。高いほど小さな息でも反応する */
export const HAA_SENSITIVITY_THRESHOLDS: Record<HaaSensitivity, HaaThresholds> = {
  high: { rms: HAA_RMS_THRESHOLD / 2, flatness: HAA_FLATNESS_THRESHOLD / 2 },
  normal: { rms: HAA_RMS_THRESHOLD, flatness: HAA_FLATNESS_THRESHOLD },
  low: { rms: HAA_RMS_THRESHOLD * 2, flatness: HAA_FLATNESS_THRESHOLD * 3 },
};

/** 息の成分を調べる周波数帯(Hz) */
export const HAA_BAND_HZ = { min: 300, max: 4000 } as const;

const EPSILON = 1e-12;

/** 時間領域のサンプルから音量(RMS)を求める */
export function computeRms(samples: ArrayLike<number>): number {
  if (samples.length === 0) {
    return 0;
  }
  let sumOfSquares = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index] ?? 0;
    sumOfSquares += sample * sample;
  }
  return Math.sqrt(sumOfSquares / samples.length);
}

/**
 * 指定したビン範囲（[startBin, endBin)）のスペクトルの平坦度を求める。
 * 幾何平均 ÷ 算術平均。1 に近いほど全体が均一なノイズ、0 に近いほど特定の周波数にピークがある。
 * powers は線形のパワー値（dB ではない）。
 */
export function computeSpectralFlatness(
  powers: ArrayLike<number>,
  startBin: number,
  endBin: number,
): number {
  const count = endBin - startBin;
  if (count <= 0) {
    return 0;
  }

  let logSum = 0;
  let linearSum = 0;
  for (let bin = startBin; bin < endBin; bin += 1) {
    const power = Math.max(powers[bin] ?? 0, 0) + EPSILON;
    logSum += Math.log(power);
    linearSum += power;
  }

  const geometricMean = Math.exp(logSum / count);
  const arithmeticMean = linearSum / count;
  return geometricMean / arithmeticMean;
}

/** 周波数(Hz)を、AnalyserNode のビン番号に変換する */
export function frequencyToBin(hz: number, sampleRate: number, fftSize: number): number {
  return Math.round((hz * fftSize) / sampleRate);
}

/** 1 フレーム分の測定結果 */
export interface AudioFrame {
  /** 時刻(ms) */
  timeMs: number;
  rms: number;
  flatness: number;
}

export interface HaaDetector {
  /** フレームを渡す。「はー」を確定させたフレームで true を返す */
  push: (frame: AudioFrame, thresholds?: HaaThresholds) => boolean;
}

/**
 * 息が HAA_MIN_DURATION_MS 続いた時点で「はー」と判定する。
 * 1 回の息につき 1 度だけ true を返す。息が途切れるとリセットされる。
 * 反応を速くするため、息がどれだけ続くかは待たずに判定する。
 */
export function createHaaDetector(): HaaDetector {
  let breathStartMs: number | null = null;
  let emitted = false;

  return {
    push: ({ timeMs, rms, flatness }, thresholds = HAA_SENSITIVITY_THRESHOLDS.normal) => {
      const isBreath = rms >= thresholds.rms && flatness >= thresholds.flatness;

      if (!isBreath) {
        breathStartMs = null;
        emitted = false;
        return false;
      }

      if (breathStartMs === null) {
        breathStartMs = timeMs;
      }

      if (!emitted && timeMs - breathStartMs >= HAA_MIN_DURATION_MS) {
        emitted = true;
        return true;
      }
      return false;
    },
  };
}
