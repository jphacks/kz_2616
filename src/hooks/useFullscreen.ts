import { useEffect, useState } from 'react';

import { toggleFullscreen } from '@/lib/fullscreen';

export interface UseFullscreenResult {
  /** 端末が全画面に対応しているか（表示の後に確かめる） */
  supported: boolean;
  /** いま全画面か */
  active: boolean;
  toggle: () => void;
}

/**
 * 画面全体（html 要素）の全画面を切り替える。
 * Esc などで全画面が解けたときも、表示を合わせる。
 */
export function useFullscreen(): UseFullscreenResult {
  // 窓はブラウザでだけ描くので、最初の値は直接読む
  const [supported] = useState(() => document.fullscreenEnabled === true);
  const [active, setActive] = useState(() => document.fullscreenElement !== null);

  useEffect(() => {
    const handleChange = () => setActive(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggle = () => {
    void toggleFullscreen(document, document.documentElement).then(setActive);
  };

  return { supported, active, toggle };
}
