'use client';

import { WindowScene } from '@/components/Window/WindowScene';
import { useAppStore } from '@/stores/useAppStore';

import { RoomEntry } from './RoomEntry';

/** 合言葉を入力するまでは入室画面、入力したら窓を表示する */
export function RoomGate() {
  const roomCode = useAppStore((state) => state.roomCode);
  return roomCode === null ? <RoomEntry /> : <WindowScene roomCode={roomCode} />;
}
