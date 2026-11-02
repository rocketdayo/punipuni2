import { planEnemyIntent, summarizeEffects } from './ai';
import { getCard } from './cards';
import {
  addLog,
  applyStatus,
  createCtx,
  decayCombatStatuses,
  sealCtx,
  settleBattle,
  tickPoison,
  tickRegen,
  type Ctx,
} from './combat';
import { HAND_SIZE, MAX_TRAPS, START_MANA } from './constants';
import { resolveEffects } from './effects';
import { getEnemy, getEnemyMove } from './enemies';
import { discardHand, drawCards } from './piles';
import { Rng } from './rng';
import type {
  BattleState,
  CardInstance,
  EnemyState,
  GameEvent,
  PlayerState,
} from './types';

export interface ActionResult {
  battle: BattleState;
  events: GameEvent[];
}

export interface CreateBattleConfig {
  deck: readonly CardInstance[];
  enemyId: string;
  stageIndex: number;
  battleId: number;
  hp: number;
  maxHp: number;
  seed: number;
}

function cloneBattle(battle: BattleState): BattleState {
  return structuredClone(battle);
}

function placeholderIntent(): EnemyState['intent'] {
  return {
    moveId: '',
    name: '',
    icon: '❔',
    kind: 'special',
    tags: [],
    text: '',
    reason: '',
  };
}

function makeEnemy(enemyId: string, hpOverride?: number): EnemyState {
  const def = getEnemy(enemyId);
  const hp = hpOverride ?? def.hp;
  return {
    defId: def.id,
    name: def.name,
    glyph: def.glyph,
    rank: def.rank,
    hp,
    maxHp: hp,
    block: 0,
    statuses: {},
    intent: placeholderIntent(),
    availableMoves: def.moves.map((move) => move.id),
    moveHistory: [],
    cooldowns: {},
    enraged: false,
    tint: def.tint,
  };
}

function makePlayer(hp: number, maxHp: number): PlayerState {
  return {
    hp,
    maxHp,
    block: 0,
    statuses: {},
    mana: START_MANA,
    maxMana: START_MANA,
  };
}

/** 新しい戦闘を構築し、初期手札と敵の意図まで用意する。 */
export function createBattle(config: CreateBattleConfig): ActionResult {
  const rng = new Rng(config.seed);
  const enemy = makeEnemy(config.enemyId);

  const deck: CardInstance[] = config.deck.map((card, index) => ({
    uid: index + 1,
    cardId: card.cardId,
  }));

  const battle: BattleState = {
    id: config.battleId,
    stageIndex: config.stageIndex,
    turn: 1,
    phase: 'player',
    player: makePlayer(config.hp, config.maxHp),
    enemy,
    drawPile: rng.shuffle(deck),
    hand: [],
    discardPile: [],
    exhaustPile: [],
    traps: [],
    handSize: HAND_SIZE,
    nextUid: deck.length + 1,
    rngSeed: config.seed,
    log: [],
    stats: {
      damageDealt: 0,
      damageTaken: 0,
      cardsPlayed: 0,
      trapsTriggered: 0,
    },
  };

  const ctx = createCtx(battle, 'player', rng);
  addLog(ctx, `${enemy.name}（${getEnemy(enemy.defId).title}）が立ちはだかる。`, 'danger');
  drawCards(ctx, battle.handSize);
  planEnemyIntent(battle, rng);

  ctx.events.push({ type: 'banner', text: '戦闘開始', tone: 'gold' });
  return { battle, events: sealCtx(ctx) };
}

/** 敵の激昂（HPが一定以下で覚醒）を確認する。 */
function checkEnrage(battle: BattleState, ctx: Ctx): void {
  const enemy = battle.enemy;
  const def = getEnemy(enemy.defId);
  if (!def.enrage || enemy.enraged) return;
  if (enemy.hp <= 0) return;
  if (enemy.hp / enemy.maxHp > def.enrage.hpPct) return;

  enemy.enraged = true;
  applyStatus(ctx, 'enemy', 'strength', def.enrage.strength);
  for (const moveId of def.enrage.unlock) {
    if (!enemy.availableMoves.includes(moveId)) {
      enemy.availableMoves.push(moveId);
    }
  }
  ctx.events.push({ type: 'banner', text: def.enrage.text, tone: 'danger' });
  addLog(ctx, def.enrage.text, 'danger');
}

/** 敵の攻撃直前に、設置された罠をすべて起動する。 */
function triggerTraps(ctx: Ctx, incomingDamage: number): void {
  const battle = ctx.battle;
  if (battle.traps.length === 0) return;

  const traps = [...battle.traps];
  battle.traps = [];

  for (const trap of traps) {
    const def = getCard(trap.cardId);
    ctx.events.push({ type: 'trap', name: def.name, glyph: def.glyph });
    addLog(ctx, `罠「${def.name}」が発動した！`, 'good');

    const trapCtx: Ctx = {
      ...ctx,
      actor: 'player',
      self: battle.player,
      foe: battle.enemy,
      pendingAttack: incomingDamage,
    };
    resolveEffects(def.effects, trapCtx);
    battle.discardPile.push({ uid: trap.uid, cardId: trap.cardId });
    battle.stats.trapsTriggered += 1;

    if (battle.enemy.hp <= 0) break;
  }
}

/** 手札のカードをプレイする。 */
export function playCard(battle: BattleState, uid: number): ActionResult {
  if (battle.phase !== 'player') return { battle, events: [] };

  const index = battle.hand.findIndex((card) => card.uid === uid);
  if (index < 0) return { battle, events: [] };

  const instance = battle.hand[index];
  const def = getCard(instance.cardId);
  if (def.cost > battle.player.mana) return { battle, events: [] };
  if (def.type === 'trap' && battle.traps.length >= MAX_TRAPS) {
    return { battle, events: [] };
  }

  const draft = cloneBattle(battle);
  const ctx = createCtx(draft, 'player', new Rng(draft.rngSeed));

  draft.hand.splice(index, 1);
  draft.player.mana -= def.cost;
  draft.stats.cardsPlayed += 1;

  ctx.events.push({
    type: 'card',
    cardId: def.id,
    name: def.name,
    cardType: def.type,
  });
  addLog(ctx, `「${def.name}」を使った。`, 'info');

  if (def.type === 'trap') {
    draft.traps.push({
      uid: instance.uid,
      cardId: def.id,
      name: def.name,
      glyph: def.glyph,
    });
    addLog(ctx, `${def.name}を設置した。敵の攻撃を待ち構える。`, 'good');
  } else {
    resolveEffects(def.effects, ctx);
    if (def.exhaust) draft.exhaustPile.push(instance);
    else draft.discardPile.push(instance);
  }

  checkEnrage(draft, ctx);
  settleBattle(ctx);
  return { battle: draft, events: sealCtx(ctx) };
}

/** プレイヤーのターンを終了し、敵フェーズへ渡す。 */
export function endPlayerTurn(battle: BattleState): ActionResult {
  if (battle.phase !== 'player') return { battle, events: [] };

  const draft = cloneBattle(battle);
  const ctx = createCtx(draft, 'player', new Rng(draft.rngSeed));

  discardHand(ctx);
  tickRegen(ctx, 'player');
  decayCombatStatuses(ctx, 'player');
  addLog(ctx, 'ターンを終了した。', 'muted');
  draft.phase = 'enemy';
  ctx.events.push({ type: 'banner', text: '敵のターン', tone: 'danger' });

  return { battle: draft, events: sealCtx(ctx) };
}

/** 敵の行動を解決する（ブロックのリセット・毒・クールダウンも含む）。 */
export function enemyAct(battle: BattleState): ActionResult {
  if (battle.phase !== 'enemy') return { battle, events: [] };

  const draft = cloneBattle(battle);
  const ctx = createCtx(draft, 'enemy', new Rng(draft.rngSeed));
  const enemy = draft.enemy;
  const def = getEnemy(enemy.defId);
  const move =
    getEnemyMove(def, enemy.intent.moveId) ?? def.moves[0];

  // ターン開始処理
  enemy.block = 0;
  for (const [key, value] of Object.entries(enemy.cooldowns)) {
    enemy.cooldowns[key] = Math.max(0, value - 1);
  }
  tickPoison(ctx, 'enemy');

  ctx.events.push({
    type: 'enemyMove',
    moveId: move.id,
    name: move.name,
    icon: move.icon,
  });
  addLog(ctx, `${enemy.name}の「${move.name}」！`, 'danger');

  if (enemy.hp > 0) {
    const summary = summarizeEffects(move.effects);
    if (summary.hasAttack) {
      triggerTraps(ctx, summary.damage * (summary.hits || 1));
    }
    if (enemy.hp > 0) {
      resolveEffects(move.effects, ctx);
    }
    enemy.cooldowns[move.id] = move.cooldown ?? 0;
    enemy.moveHistory.push(move.id);
    if (enemy.moveHistory.length > 6) enemy.moveHistory.shift();

    tickRegen(ctx, 'enemy');
    decayCombatStatuses(ctx, 'enemy');
    checkEnrage(draft, ctx);
  }

  settleBattle(ctx);
  return { battle: draft, events: sealCtx(ctx) };
}

/** プレイヤーの新しいターンを開始する（マナ回復・ドロー・敵意図の更新）。 */
export function beginPlayerTurn(battle: BattleState): ActionResult {
  if (battle.phase !== 'enemy') return { battle, events: [] };

  const draft = cloneBattle(battle);
  const ctx = createCtx(draft, 'player', new Rng(draft.rngSeed));

  draft.turn += 1;
  draft.player.block = 0;
  draft.player.mana = draft.player.maxMana;

  tickPoison(ctx, 'player');

  if (draft.player.hp > 0) {
    drawCards(ctx, draft.handSize);
    planEnemyIntent(draft, ctx.rng);
    draft.phase = 'player';
    addLog(ctx, `第${draft.turn}ターン開始。`, 'info');
    ctx.events.push({ type: 'banner', text: 'あなたのターン', tone: 'info' });
  } else {
    settleBattle(ctx);
  }

  return { battle: draft, events: sealCtx(ctx) };
}
