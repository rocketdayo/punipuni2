import {
  beginPlayerTurn,
  claimReward as claimRunReward,
  completeBattle,
  createRun,
  endPlayerTurn,
  enemyAct,
  playCard as playBattleCard,
  startBattle as startBattleRun,
  type GameEvent,
  type RunState,
} from '../game';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export interface GameSnapshot {
  run: RunState | null;
  /** 敵ターン演出など、入力を受け付けてはいけない時間帯 */
  busy: boolean;
}

/**
 * Reactに依存しないストア。
 *
 * - 状態更新はエンジンの純粋関数に委譲する
 * - エンジンが返したイベント列を購読者（演出レイヤー）へ配信する
 * - 敵ターンの「間」だけをここで演出する
 */
class GameStore {
  private snapshot: GameSnapshot = { run: null, busy: false };
  private listeners = new Set<() => void>();
  private eventListeners = new Set<(events: GameEvent[]) => void>();
  private token = 0;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): GameSnapshot => this.snapshot;

  onEvents = (listener: (events: GameEvent[]) => void): (() => void) => {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  };

  private commit(run: RunState | null, events: GameEvent[], busy: boolean): void {
    this.snapshot = { run, busy };
    if (events.length > 0) {
      for (const listener of this.eventListeners) listener(events);
    }
    for (const listener of this.listeners) listener();
  }

  private setBusy(busy: boolean): void {
    this.commit(this.snapshot.run, [], busy);
  }

  startRun(seed?: number): void {
    this.token += 1;
    this.commit(createRun(seed), [], false);
  }

  returnToTitle(): void {
    this.token += 1;
    this.commit(null, [], false);
  }

  startBattle(): void {
    const run = this.snapshot.run;
    if (!run || run.screen !== 'map' || this.snapshot.busy) return;
    const result = startBattleRun(run);
    if (result.run === run) return;
    this.commit(result.run, result.events, false);
  }

  playCard(uid: number): void {
    const run = this.snapshot.run;
    if (!run?.battle || this.snapshot.busy || run.battle.phase !== 'player') return;

    const result = playBattleCard(run.battle, uid);
    if (result.battle === run.battle) return;

    this.commit({ ...run, battle: result.battle }, result.events, false);

    if (result.battle.phase === 'won' || result.battle.phase === 'lost') {
      void this.finishBattle(result.battle.phase);
    }
  }

  endTurn(): void {
    void this.runEnemyPhase();
  }

  claimReward(cardId: string | null): void {
    const run = this.snapshot.run;
    if (!run || run.screen !== 'reward' || this.snapshot.busy) return;
    this.commit(claimRunReward(run, cardId), [], false);
  }

  private isCurrent(token: number): boolean {
    return this.token === token;
  }

  /** プレイヤーの終了 → 敵の行動 → 次ターン開始 を間を置いて進行する。 */
  private async runEnemyPhase(): Promise<void> {
    const snapshot = this.snapshot;
    const run = snapshot.run;
    if (!run?.battle || run.battle.phase !== 'player' || snapshot.busy) return;

    const token = ++this.token;
    this.setBusy(true);

    const ended = endPlayerTurn(run.battle);
    this.commit({ ...run, battle: ended.battle }, ended.events, true);
    await sleep(640);
    if (!this.isCurrent(token)) return;

    const current = this.snapshot.run;
    if (!current?.battle) return;

    const acted = enemyAct(current.battle);
    this.commit({ ...current, battle: acted.battle }, acted.events, true);
    await sleep(980);
    if (!this.isCurrent(token)) return;

    const after = this.snapshot.run;
    if (!after?.battle) return;

    if (after.battle.phase === 'won' || after.battle.phase === 'lost') {
      void this.finishBattle(after.battle.phase);
      return;
    }

    const began = beginPlayerTurn(after.battle);
    this.commit({ ...after, battle: began.battle }, began.events, false);
    if (began.battle.phase === 'won' || began.battle.phase === 'lost') {
      void this.finishBattle(began.battle.phase);
    }
  }

  private async finishBattle(phase: 'won' | 'lost'): Promise<void> {
    const token = ++this.token;
    this.setBusy(true);
    await sleep(phase === 'won' ? 1150 : 1450);
    if (!this.isCurrent(token)) return;

    const run = this.snapshot.run;
    if (!run?.battle) return;

    const result = completeBattle(run);
    this.commit(result.run, result.events, false);
  }
}

export const gameStore = new GameStore();
