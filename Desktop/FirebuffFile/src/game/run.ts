import { createBattle } from './battle';
import { getCard, REWARD_POOL, STARTER_DECK } from './cards';
import {
  SKIP_REWARD_HEAL,
  START_HP,
  VICTORY_HEAL,
} from './constants';
import { ENCOUNTER_SEQUENCE, getEnemy } from './enemies';
import { randomSeed, Rng } from './rng';
import type {
  CardInstance,
  EncounterPlan,
  GameEvent,
  Rarity,
  RunState,
} from './types';

const REWARD_COUNT = 3;

function buildStarterDeck(): { deck: CardInstance[]; nextUid: number } {
  const deck: CardInstance[] = [];
  let uid = 1;
  for (const entry of STARTER_DECK) {
    for (let i = 0; i < entry.count; i += 1) {
      deck.push({ uid, cardId: entry.cardId });
      uid += 1;
    }
  }
  return { deck, nextUid: uid };
}

function buildEncounters(): EncounterPlan[] {
  return ENCOUNTER_SEQUENCE.map((enemyId) => {
    const def = getEnemy(enemyId);
    return { enemyId, label: def.title, rank: def.rank };
  });
}

/** 新しいラン（連戦）を開始する。 */
export function createRun(seed: number = randomSeed()): RunState {
  const { deck, nextUid } = buildStarterDeck();
  return {
    seed,
    screen: 'map',
    stageIndex: 0,
    encounters: buildEncounters(),
    deck,
    hp: START_HP,
    maxHp: START_HP,
    battle: null,
    rewardChoices: [],
    battlesWon: 0,
    turnsPlayed: 0,
    nextUid,
    rngSeed: (seed ^ 0x85ebca6b) >>> 0,
  };
}

/** 現在のステージの対戦相手。 */
export function currentEncounter(run: RunState): EncounterPlan | null {
  return run.encounters[run.stageIndex] ?? null;
}

/** 次の戦闘を開始する。 */
export function startBattle(run: RunState): {
  run: RunState;
  events: GameEvent[];
} {
  if (run.screen !== 'map') return { run, events: [] };
  const encounter = currentEncounter(run);
  if (!encounter) return { run, events: [] };

  const next = structuredClone(run);
  const { battle, events } = createBattle({
    deck: next.deck,
    enemyId: encounter.enemyId,
    stageIndex: next.stageIndex,
    battleId: next.battlesWon + 1,
    hp: next.hp,
    maxHp: next.maxHp,
    seed: next.rngSeed,
  });

  next.battle = battle;
  next.screen = 'battle';
  next.rngSeed = (next.rngSeed + 0x9e3779b9) >>> 0;

  return { run: next, events };
}

/* ------------------------------------------------------------------ */
/* 報酬                                                                */
/* ------------------------------------------------------------------ */

const RARITY_WEIGHTS: Record<Exclude<Rarity, 'starter'>, number> = {
  common: 58,
  uncommon: 32,
  rare: 10,
};

function rollRarity(rng: Rng, stageIndex: number): Exclude<Rarity, 'starter'> {
  const weights = {
    common: Math.max(24, RARITY_WEIGHTS.common - stageIndex * 5),
    uncommon: RARITY_WEIGHTS.uncommon + stageIndex * 2,
    rare: RARITY_WEIGHTS.rare + stageIndex * 3,
  };
  const total = weights.common + weights.uncommon + weights.rare;
  let roll = rng.next() * total;
  if ((roll -= weights.common) < 0) return 'common';
  if ((roll -= weights.uncommon) < 0) return 'uncommon';
  return 'rare';
}

function rollRewards(rng: Rng, stageIndex: number): string[] {
  const picks: string[] = [];
  const pool = [...REWARD_POOL];

  while (picks.length < REWARD_COUNT && pool.length > 0) {
    const rarity = rollRarity(rng, stageIndex);
    let candidates = pool.filter((id) => getCard(id).rarity === rarity);
    if (candidates.length === 0) candidates = pool;
    const pick = rng.pick(candidates);
    picks.push(pick);
    pool.splice(pool.indexOf(pick), 1);
  }
  return picks;
}

/** 戦闘終了を反映し、勝利なら報酬を用意する。 */
export function completeBattle(run: RunState): {
  run: RunState;
  events: GameEvent[];
} {
  const battle = run.battle;
  if (!battle || run.screen !== 'battle') return { run, events: [] };

  if (battle.phase === 'lost') {
    const next = structuredClone(run);
    next.hp = 0;
    next.screen = 'defeat';
    return { run: next, events: [] };
  }
  if (battle.phase !== 'won') return { run, events: [] };

  const next = structuredClone(run);
  next.hp = Math.min(next.maxHp, battle.player.hp + VICTORY_HEAL);
  next.battlesWon += 1;
  next.turnsPlayed += battle.turn;

  const rng = new Rng(next.rngSeed);
  next.rewardChoices = rollRewards(rng, next.stageIndex);
  next.rngSeed = rng.seed;
  next.screen = 'reward';

  return { run: next, events: [] };
}

/** 報酬カードを1枚選ぶ。nullなら見送ってHPを回復する。 */
export function claimReward(run: RunState, cardId: string | null): RunState {
  if (run.screen !== 'reward') return run;

  const next = structuredClone(run);
  if (cardId && next.rewardChoices.includes(cardId)) {
    next.deck.push({ uid: next.nextUid, cardId });
    next.nextUid += 1;
  } else {
    next.hp = Math.min(next.maxHp, next.hp + SKIP_REWARD_HEAL);
  }

  next.rewardChoices = [];
  next.stageIndex += 1;
  next.battle = null;
  next.screen =
    next.stageIndex >= next.encounters.length ? 'victory' : 'map';

  return next;
}
