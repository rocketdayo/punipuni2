import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { GameEvent } from '../game';
import { gameStore, type GameSnapshot } from './gameStore';

export function useGame(): GameSnapshot {
  return useSyncExternalStore(
    gameStore.subscribe,
    gameStore.getSnapshot,
    gameStore.getSnapshot,
  );
}

/** エンジンイベントを購読する。ハンドラは毎回の再購読なしで最新版が使われる。 */
export function useGameEvents(handler: (events: GameEvent[]) => void): void {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    return gameStore.onEvents((events) => {
      ref.current(events);
    });
  }, []);
}
