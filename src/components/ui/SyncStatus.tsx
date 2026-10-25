import type { ConnectionStatus } from '@/types';

import styles from './SyncStatus.module.css';

/** 接続状態の表示文言。入室画面と窓で同じ文言を使う */
export const SYNC_STATUS_LABEL: Record<ConnectionStatus, string> = {
  disconnected: '同期していません',
  connecting: '接続しています…',
  connected: '同期中（相手と共有）',
  error: '同期に失敗しました',
};

interface SyncStatusProps {
  status: ConnectionStatus;
}

/** 同期の接続状態。色の点と文言で、今どの状態かを示す */
export function SyncStatus({ status }: SyncStatusProps) {
  return (
    <p className={styles.status} role="status" data-status={status}>
      <span className={`${styles.dot} ${styles[status]}`} aria-hidden="true" />
      {SYNC_STATUS_LABEL[status]}
    </p>
  );
}
