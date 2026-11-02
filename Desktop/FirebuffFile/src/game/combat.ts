import {
  MAX_LOG_ENTRIES,
  VULNERABLE_MULTIPLIER,
  WEAK_MULTIPLIER,
} from './constants';
import type { Rng } from './rng';
import { STATUS_INFO } from './statuses';
import type {
  BattlePhase,
  BattleState,
  CombatantState,
  GameEvent,
  Side,
  StatusKey,
} from './types';

/**
 * 1回のアクションを解決するための「実行コンテキスト」。
 * 効果ハンドラはこの文脈に対してのみ作用し、外部状態には触れない。
 */
export interface Ctx {
  battle: BattleState;
  rng: Rng;
  events: GameEvent[];
  /** 現在の実行者 */
  actor: Side;
  /** 実行者自身 */
  self: CombatantState;
  /** 実行者から見た相手 */
  foe: CombatantState;
  /** 罠の反射ダメージ計算に使う「迫っている攻撃の基礎値」 */
  pendingAttack?: number;
}

export function otherSide(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player';
}

export function sideLabel(side: Side): string {
  return side === 'player' ? 'あなた' : '敵';
}

export function combatant(battle: BattleState, side: Side): CombatantState {
  return side === 'player' ? battle.player : battle.enemy;
}

export function statusOf(unit: CombatantState, key: StatusKey): number {
  return unit.statuses[key] ?? 0;
}

export function createCtx(battle: BattleState, actor: Side, rng: Rng): Ctx {
  return {
    battle,
    rng,
    events: [],
    actor,
    self: combatant(battle, actor),
    foe: combatant(battle, otherSide(actor)),
  };
}

/** 乱数状態をバトルへ書き戻し、イベント列を返す。 */
export function sealCtx(ctx: Ctx): GameEvent[] {
  ctx.battle.rngSeed = ctx.rng.seed;
  return ctx.events;
}

export function addLog(
  ctx: Ctx,
  text: string,
  tone: 'info' | 'good' | 'danger' | 'muted' = 'info',
): void {
  ctx.battle.log.push({
    id: (ctx.battle.log[ctx.battle.log.length - 1]?.id ?? 0) + 1,
    text,
    tone,
  });
  if (ctx.battle.log.length > MAX_LOG_ENTRIES) {
    ctx.battle.log.splice(0, ctx.battle.log.length - MAX_LOG_ENTRIES);
  }
}

/** 筋力・弱体・脆弱をすべて反映した攻撃ダメージ。 */
export function computeAttackDamage(
  base: number,
  attacker: CombatantState,
  defender: CombatantState,
): number {
  let damage = base + statusOf(attacker, 'strength');
  if (statusOf(attacker, 'weak') > 0) {
    damage = Math.floor(damage * WEAK_MULTIPLIER);
  }
  if (statusOf(defender, 'vulnerable') > 0) {
    damage = Math.floor(damage * VULNERABLE_MULTIPLIER);
  }
  return Math.max(0, damage);
}

export function computeBlockGain(base: number, actor: CombatantState): number {
  return Math.max(0, base + statusOf(actor, 'dexterity'));
}

/**
 * ダメージを適用する。ブロックが先に消費され、残りがHPを削る。
 * `ignoreBlock` は毒などブロックを貫通する効果に使う。
 */
export function applyDamage(
  ctx: Ctx,
  side: Side,
  rawAmount: number,
  options: { ignoreBlock?: boolean } = {},
): number {
  const target = combatant(ctx.battle, side);
  if (target.hp <= 0) return 0;

  const incoming = Math.max(0, Math.floor(rawAmount));
  const blocked = options.ignoreBlock ? 0 : Math.min(target.block, incoming);
  if (!options.ignoreBlock) {
    target.block -= blocked;
  }
  const lost = Math.min(target.hp, incoming - blocked);
  target.hp -= lost;

  if (side === 'enemy') ctx.battle.stats.damageDealt += lost;
  else ctx.battle.stats.damageTaken += lost;

  ctx.events.push({ type: 'damage', target: side, amount: lost, blocked });
  if (lost > 0) {
    ctx.events.push({ type: 'flash', target: side });
    if (lost >= 18) ctx.events.push({ type: 'shake', power: 3 });
    else if (lost >= 9) ctx.events.push({ type: 'shake', power: 2 });
    else ctx.events.push({ type: 'shake', power: 1 });
  }
  return lost;
}

export function gainBlock(ctx: Ctx, side: Side, base: number): number {
  const target = combatant(ctx.battle, side);
  const amount = computeBlockGain(base, target);
  if (amount <= 0) return 0;
  target.block += amount;
  ctx.events.push({ type: 'block', target: side, amount });
  addLog(ctx, `${sideLabel(side)}は${amount}のブロックを得た。`, 'good');
  return amount;
}

export function healTarget(ctx: Ctx, side: Side, amount: number): number {
  const target = combatant(ctx.battle, side);
  const healed = Math.min(target.maxHp - target.hp, Math.max(0, Math.floor(amount)));
  if (healed <= 0) return 0;
  target.hp += healed;
  ctx.events.push({ type: 'heal', target: side, amount: healed });
  addLog(ctx, `${sideLabel(side)}は${healed}回復した。`, 'good');
  return healed;
}

export function loseHp(ctx: Ctx, side: Side, amount: number): void {
  const target = combatant(ctx.battle, side);
  const lost = Math.min(target.hp, Math.max(0, Math.floor(amount)));
  if (lost <= 0) return;
  target.hp -= lost;
  if (side === 'enemy') ctx.battle.stats.damageDealt += lost;
  else ctx.battle.stats.damageTaken += lost;
  ctx.events.push({ type: 'damage', target: side, amount: lost, blocked: 0 });
  addLog(ctx, `${sideLabel(side)}は${lost}のHPを失った。`, 'danger');
}

export function applyStatus(
  ctx: Ctx,
  side: Side,
  status: StatusKey,
  amount: number,
): void {
  if (amount === 0) return;
  const target = combatant(ctx.battle, side);
  const next = Math.max(0, (target.statuses[status] ?? 0) + amount);
  if (next <= 0) {
    delete target.statuses[status];
  } else {
    target.statuses[status] = next;
  }
  ctx.events.push({ type: 'status', target: side, status, amount });
  const info = STATUS_INFO[status];
  const verb = amount > 0 ? '付与' : '減少';
  addLog(
    ctx,
    `${sideLabel(side)}の${info.name}が${verb}された（${amount > 0 ? `+${amount}` : amount}）。`,
    info.tone === 'buff' ? 'good' : 'danger',
  );
}

/** 1ヒットずつ攻撃を解決し、棘の反撃も処理する。 */
export function performAttack(ctx: Ctx, base: number, hits = 1): void {
  const targetSide = otherSide(ctx.actor);
  for (let i = 0; i < hits; i += 1) {
    const target = combatant(ctx.battle, targetSide);
    if (target.hp <= 0) break;
    const damage = computeAttackDamage(base, ctx.self, target);
    applyDamage(ctx, targetSide, damage);

    const thorns = statusOf(ctx.foe, 'thorns');
    if (thorns > 0 && ctx.self.hp > 0) {
      applyDamage(ctx, ctx.actor, thorns);
      addLog(ctx, `棘が${sideLabel(ctx.actor)}に${thorns}ダメージを与えた。`, 'danger');
    }
  }
}

/** ターン開始時の毒。ブロックを無視する。 */
export function tickPoison(ctx: Ctx, side: Side): void {
  const target = combatant(ctx.battle, side);
  const poison = statusOf(target, 'poison');
  if (poison <= 0) return;
  target.statuses.poison = poison - 1;
  if ((target.statuses.poison ?? 0) <= 0) delete target.statuses.poison;
  applyDamage(ctx, side, poison, { ignoreBlock: true });
  addLog(ctx, `毒が${sideLabel(side)}を蝕む（${poison}ダメージ）。`, 'danger');
}

/** ターン終了時の再生。 */
export function tickRegen(ctx: Ctx, side: Side): void {
  const target = combatant(ctx.battle, side);
  const regen = statusOf(target, 'regen');
  if (regen <= 0) return;
  target.statuses.regen = regen - 1;
  if ((target.statuses.regen ?? 0) <= 0) delete target.statuses.regen;
  healTarget(ctx, side, regen);
}

/** 脆弱・弱体の残りターンを1減らす。 */
export function decayCombatStatuses(ctx: Ctx, side: Side): void {
  const target = combatant(ctx.battle, side);
  for (const key of ['vulnerable', 'weak'] as const) {
    const value = statusOf(target, key);
    if (value <= 0) continue;
    if (value - 1 <= 0) delete target.statuses[key];
    else target.statuses[key] = value - 1;
  }
}

/** 勝敗を確定させ、一度だけイベントを発行する。 */
export function settleBattle(ctx: Ctx): BattlePhase {
  const { battle } = ctx;
  if (battle.phase === 'won' || battle.phase === 'lost') return battle.phase;
  if (battle.enemy.hp <= 0) {
    battle.enemy.hp = 0;
    battle.phase = 'won';
    ctx.events.push({ type: 'victory' });
    addLog(ctx, `${battle.enemy.name}を打ち倒した！`, 'good');
  } else if (battle.player.hp <= 0) {
    battle.player.hp = 0;
    battle.phase = 'lost';
    ctx.events.push({ type: 'defeat' });
    addLog(ctx, 'あなたは倒れた……。', 'danger');
  }
  return battle.phase;
}
