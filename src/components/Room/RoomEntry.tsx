'use client';

import { type FormEvent, useState } from 'react';

import { SyncStatus } from '@/components/ui/SyncStatus';
import { validatePassphrase } from '@/lib/passphrase';
import { useAppStore } from '@/stores/useAppStore';

import styles from './RoomEntry.module.css';

/** 入室画面。お互いに同じ合言葉を入力すると、同じ窓に入る */
export function RoomEntry() {
  const setRoomCode = useAppStore((state) => state.setRoomCode);
  const connectionStatus = useAppStore((state) => state.connectionStatus);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validatePassphrase(input);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setError(null);
    setRoomCode(result.passphrase);
  };

  return (
    <main className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>窓</h1>
        <p className={styles.description}>相手と同じ合言葉を入力すると、同じ窓に入ります。</p>
        <label className={styles.label} htmlFor="passphrase">
          合言葉
        </label>
        <input
          id="passphrase"
          className={styles.input}
          type="text"
          value={input}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          onChange={(event) => setInput(event.target.value)}
        />
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <button type="submit" className={styles.button}>
          入室
        </button>
      </form>
      <SyncStatus status={connectionStatus} />
    </main>
  );
}
