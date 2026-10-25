import { describe, expect, it } from 'vitest';

import {
  computeRms,
  computeSpectralFlatness,
  createHaaDetector,
  frequencyToBin,
  HAA_FLATNESS_THRESHOLD,
  HAA_MIN_DURATION_MS,
  HAA_RMS_THRESHOLD,
  HAA_SENSITIVITY_THRESHOLDS,
  type AudioFrame,
} from './haaDetection';

/** 決まった系列を返す擬似乱数（テストを再現可能にする） */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** 息のようなノイズ状のフレーム（平坦度が高く、音量が十分） */
function breathFrame(timeMs: number): AudioFrame {
  return { timeMs, rms: HAA_RMS_THRESHOLD * 2, flatness: HAA_FLATNESS_THRESHOLD + 0.3 };
}

/** 無音に近いフレーム */
function silentFrame(timeMs: number): AudioFrame {
  return { timeMs, rms: 0, flatness: 0 };
}

describe('computeRms', () => {
  it('正弦波の実効値は振幅の 1/√2 になる', () => {
    const samples = Array.from({ length: 1000 }, (_, i) => Math.sin((2 * Math.PI * i) / 100));
    expect(computeRms(samples)).toBeCloseTo(1 / Math.SQRT2, 2);
  });

  it('空の入力は 0', () => {
    expect(computeRms([])).toBe(0);
  });
});

describe('computeSpectralFlatness', () => {
  it('均一なノイズは平坦度が高い', () => {
    const random = seededRandom(1);
    const powers = Array.from({ length: 200 }, () => 0.5 + random() * 0.5);

    expect(computeSpectralFlatness(powers, 0, powers.length)).toBeGreaterThan(0.8);
  });

  it('1 か所だけにピークがあると平坦度は低い', () => {
    const powers = Array.from({ length: 200 }, () => 1e-6);
    powers[50] = 1;

    expect(computeSpectralFlatness(powers, 0, powers.length)).toBeLessThan(0.1);
  });

  it('範囲外のビンは使わない', () => {
    const powers = [1e-6, 1e-6, 1, 1, 1];
    expect(computeSpectralFlatness(powers, 2, 5)).toBeCloseTo(1, 5);
  });
});

describe('frequencyToBin', () => {
  it('周波数をビン番号に変換する（48kHz・FFT 2048）', () => {
    // 1 ビン = 48000 / 2048 ≈ 23.4Hz
    expect(frequencyToBin(4000, 48000, 2048)).toBe(171);
  });
});

describe('createHaaDetector', () => {
  it('息が必要な時間続くと 1 度だけ検出する', () => {
    const detector = createHaaDetector();
    const detections: number[] = [];

    for (let t = 0; t <= HAA_MIN_DURATION_MS + 200; t += 20) {
      if (detector.push(breathFrame(t))) {
        detections.push(t);
      }
    }

    expect(detections).toHaveLength(1);
    expect(detections[0]).toBeGreaterThanOrEqual(HAA_MIN_DURATION_MS);
  });

  it('短すぎる息では検出しない', () => {
    const detector = createHaaDetector();

    for (let t = 0; t < HAA_MIN_DURATION_MS - 20; t += 20) {
      expect(detector.push(breathFrame(t))).toBe(false);
    }
    expect(detector.push(silentFrame(HAA_MIN_DURATION_MS))).toBe(false);
  });

  it('長く続く息でも、1 回の息につき 1 度だけ検出する', () => {
    const detector = createHaaDetector();
    const detections: boolean[] = [];

    for (let t = 0; t <= 3000; t += 20) {
      detections.push(detector.push(breathFrame(t)));
    }

    expect(detections.filter(Boolean)).toHaveLength(1);
  });

  it('音量が足りない、または平坦度が低い音は息とみなさない', () => {
    const detector = createHaaDetector();

    for (let t = 0; t <= HAA_MIN_DURATION_MS * 2; t += 20) {
      expect(detector.push({ timeMs: t, rms: 0.001, flatness: 0.9 })).toBe(false);
      expect(detector.push({ timeMs: t, rms: 0.5, flatness: 0.05 })).toBe(false);
    }
  });

  it('息が途切れた後の新しい息は、もう一度検出する', () => {
    const detector = createHaaDetector();
    let count = 0;

    for (let t = 0; t <= HAA_MIN_DURATION_MS + 100; t += 20) {
      if (detector.push(breathFrame(t))) count += 1;
    }
    detector.push(silentFrame(1000));
    for (let t = 2000; t <= 2000 + HAA_MIN_DURATION_MS + 100; t += 20) {
      if (detector.push(breathFrame(t))) count += 1;
    }

    expect(count).toBe(2);
  });
});

describe('HAA_SENSITIVITY_THRESHOLDS', () => {
  it('感度が高いほど基準が低い', () => {
    expect(HAA_SENSITIVITY_THRESHOLDS.high.rms).toBeLessThan(HAA_SENSITIVITY_THRESHOLDS.normal.rms);
    expect(HAA_SENSITIVITY_THRESHOLDS.low.rms).toBeGreaterThan(
      HAA_SENSITIVITY_THRESHOLDS.normal.rms,
    );
    expect(HAA_SENSITIVITY_THRESHOLDS.high.flatness).toBeLessThan(
      HAA_SENSITIVITY_THRESHOLDS.normal.flatness,
    );
  });

  it('感度が高いと、標準では届かない小さな息でも検出する', () => {
    const weakBreath = {
      rms: HAA_SENSITIVITY_THRESHOLDS.normal.rms * 0.8,
      flatness: HAA_SENSITIVITY_THRESHOLDS.normal.flatness,
    };
    const frame = (timeMs: number) => ({ timeMs, ...weakBreath });

    const normal = createHaaDetector();
    const high = createHaaDetector();
    let normalDetected = false;
    let highDetected = false;
    for (let t = 0; t <= HAA_MIN_DURATION_MS + 100; t += 20) {
      normalDetected = normal.push(frame(t), HAA_SENSITIVITY_THRESHOLDS.normal) || normalDetected;
      highDetected = high.push(frame(t), HAA_SENSITIVITY_THRESHOLDS.high) || highDetected;
    }

    expect(normalDetected).toBe(false);
    expect(highDetected).toBe(true);
  });
});
