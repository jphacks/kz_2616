import { useEffect, useRef, useState } from 'react';

import { getAudioContext } from '@/lib/audio';
import {
  computeRms,
  computeSpectralFlatness,
  createHaaDetector,
  frequencyToBin,
  HAA_BAND_HZ,
  type HaaThresholds,
} from '@/lib/haaDetection';

const FFT_SIZE = 2048;

/** 画面の数値を更新する間隔(ms)。毎フレームだと再描画が多すぎるため */
const LEVEL_REPORT_INTERVAL_MS = 200;

export interface UseHaaDetectionOptions {
  /** false の間はマイクを使わない */
  enabled: boolean;
  /** true の間は音を無視する。マイクのトラックを無効にし、開き直さない */
  muted: boolean;
  /** 息と判定する基準（感度） */
  thresholds: HaaThresholds;
  /** 「はー」を検出したときに呼ばれる */
  onDetect: () => void;
}

export interface AudioLevels {
  /** 音量(RMS) */
  rms: number;
  /** スペクトルの平坦度（息ならこの値が高い） */
  flatness: number;
}

export interface UseHaaDetectionResult {
  isListening: boolean;
  error: Error | null;
  /** 直近の測定値。調整のために画面に表示する */
  levels: AudioLevels | null;
}

/**
 * マイクの音から「はー」（息のノイズ）を検出する。
 * 音は保存せず、フレームごとの音量とスペクトルの平坦度だけを使う。
 */
export function useHaaDetection({
  enabled,
  muted,
  thresholds,
  onDetect,
}: UseHaaDetectionOptions): UseHaaDetectionResult {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [levels, setLevels] = useState<AudioLevels | null>(null);
  const onDetectRef = useRef(onDetect);
  const mutedRef = useRef(muted);
  const thresholdsRef = useRef(thresholds);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  useEffect(() => {
    thresholdsRef.current = thresholds;
  }, [thresholds]);

  useEffect(() => {
    mutedRef.current = muted;
    // マイクのトラックを無効にすると、音は無音として扱われる
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }, [muted]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    let frameId: number | null = null;
    let stream: MediaStream | null = null;
    let sourceNode: MediaStreamAudioSourceNode | null = null;

    const stop = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      sourceNode?.disconnect();
      stream?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsListening(false);
      setLevels(null);
    };

    const start = async () => {
      try {
        // HTTPS でないとマイクは使えない（iPad で IP アドレスに直接アクセスした場合など）
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('HTTPS でアクセスしてください');
        }
        // 息のノイズを消されないよう、ノイズ抑制・自動音量調整をオフにする
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = mediaStream;
        streamRef.current = mediaStream;
        mediaStream.getAudioTracks().forEach((track) => {
          track.enabled = !mutedRef.current;
        });

        // AudioContext はタップの中で作って再開してある（unlockAudio）
        const context = getAudioContext();
        if (context.state !== 'running') {
          throw new Error('マイクの音声が再生されていません。もう一度タップしてください');
        }

        const analyser = context.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        sourceNode = context.createMediaStreamSource(mediaStream);
        sourceNode.connect(analyser);

        const timeData = new Float32Array(analyser.fftSize);
        const freqData = new Float32Array(analyser.frequencyBinCount);
        const powers = new Float32Array(freqData.length);
        const startBin = frequencyToBin(HAA_BAND_HZ.min, context.sampleRate, FFT_SIZE);
        const endBin = frequencyToBin(HAA_BAND_HZ.max, context.sampleRate, FFT_SIZE);
        const detector = createHaaDetector();
        let lastReportMs = 0;

        const tick = () => {
          analyser.getFloatTimeDomainData(timeData);
          analyser.getFloatFrequencyData(freqData);
          // dB を線形のパワーに戻す
          for (let bin = 0; bin < freqData.length; bin += 1) {
            powers[bin] = 10 ** ((freqData[bin] ?? -Infinity) / 10);
          }

          const nowMs = performance.now();
          const frame = {
            timeMs: nowMs,
            rms: computeRms(timeData),
            flatness: computeSpectralFlatness(powers, startBin, endBin),
          };

          if (detector.push(frame, thresholdsRef.current)) {
            onDetectRef.current();
          }
          if (nowMs - lastReportMs >= LEVEL_REPORT_INTERVAL_MS) {
            lastReportMs = nowMs;
            setLevels({ rms: frame.rms, flatness: frame.flatness });
          }
          frameId = requestAnimationFrame(tick);
        };

        setError(null);
        setIsListening(true);
        frameId = requestAnimationFrame(tick);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught : new Error(String(caught)));
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [enabled]);

  return { isListening, error, levels };
}
