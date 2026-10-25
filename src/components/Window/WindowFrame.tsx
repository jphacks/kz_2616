import type { HTMLAttributes, ReactNode } from 'react';

import styles from './WindowFrame.module.css';

interface WindowFrameProps {
  /** ガラス部分に付けるイベントハンドラなど */
  glassProps?: HTMLAttributes<HTMLDivElement>;
  children?: ReactNode;
}

/** 画面全体を覆う窓。余白は作らず、ガラスが枠の内側いっぱいに広がる */
export function WindowFrame({ glassProps, children }: WindowFrameProps) {
  return (
    <div className={styles.frame}>
      <div {...glassProps} className={styles.glass}>
        {children}
      </div>
    </div>
  );
}
