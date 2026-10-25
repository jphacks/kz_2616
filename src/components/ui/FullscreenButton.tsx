import styles from './FullscreenButton.module.css';

interface FullscreenButtonProps {
  /** 端末が全画面に対応しているか。対応していなければ何も出さない */
  supported: boolean;
  /** いま全画面か */
  active: boolean;
  onToggle: () => void;
}

/** 全画面の切り替えボタン */
export function FullscreenButton({ supported, active, onToggle }: FullscreenButtonProps) {
  if (!supported) {
    return null;
  }
  return (
    <button type="button" className={styles.button} onClick={onToggle}>
      {active ? '全画面を終える' : '全画面'}
    </button>
  );
}
