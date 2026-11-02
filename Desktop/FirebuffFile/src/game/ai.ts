import { getCard } from './cards';
import { computeAttackDamage, statusOf } from './combat';
import type { EnemyDef, EnemyMoveDef } from './enemies';
import { getEnemy } from './enemies';
import type { Rng } from './rng';
import type {
  BattleState,
  CardDef,
  Effect,
  EnemyIntent,
  EnemyState,
  IntentKind,
  PlayerState,
} from './types';

/* ------------------------------------------------------------------ */
/* 効果の要約                                                          */
/* ------------------------------------------------------------------ */

export interface MoveSummary {
  /** 単一攻撃効果の1ヒット基礎値 */
  damage: number;
  /** その攻撃のヒット数 */
  hits: number;
  /** 基礎ダメージ合計 (修飾前) */
  damageTotal: number;
  block: number;
  heal: number;
  strength: number;
  dexterity: number;
  thorns: number;
  regen: number;
  weak: number;
  vulnerable: number;
  poison: number;
  hasAttack: boolean;
}

export function emptySummary(): MoveSummary {
  return {
    damage: 0,
    hits: 1,
    damageTotal: 0,
    block: 0,
    heal: 0,
    strength: 0,
    dexterity: 0,
    thorns: 0,
    regen: 0,
    weak: 0,
    vulnerable: 0,
    poison: 0,
    hasAttack: false,
  };
}

/** 効果列をAI・意図表示用の数値に要約する。 */
export function summarizeEffects(
  effects: readonly Effect[],
  summary: MoveSummary = emptySummary(),
): MoveSummary {
  for (const effect of effects) {
    switch (effect.kind) {
      case 'damage': {
        const hits = effect.hits ?? 1;
        summary.damage = effect.amount;
        summary.hits = hits;
        summary.damageTotal += effect.amount * hits;
        summary.hasAttack = true;
        break;
      }
      case 'block':
        summary.block += effect.amount;
        break;
      case 'heal':
        summary.heal += effect.amount;
        break;
      case 'status':
        if (effect.target === 'self') {
          if (effect.status === 'strength') summary.strength += effect.amount;
          if (effect.status === 'dexterity') summary.dexterity += effect.amount;
          if (effect.status === 'thorns') summary.thorns += effect.amount;
          if (effect.status === 'regen') summary.regen += effect.amount;
        } else {
          if (effect.status === 'weak') summary.weak += effect.amount;
          if (effect.status === 'vulnerable') summary.vulnerable += effect.amount;
          if (effect.status === 'poison') summary.poison += effect.amount;
        }
        break;
      case 'conditional':
        // 条件分岐は基礎値のみを見積もる（分岐後は含めない）
        summarizeEffects(effect.then, summary);
        break;
      case 'damageEqualToBlock':
        summary.hasAttack = true;
        break;
      case 'counterDamage':
        summary.hasAttack = true;
        break;
      default:
        break;
    }
  }
  return summary;
}

/* ------------------------------------------------------------------ */
/* プレイヤーの脅威推定                                                */
/* ------------------------------------------------------------------ */

function estimateCardDamage(
  def: CardDef,
  attacker: PlayerState,
  defender: EnemyState,
): number {
  let total = 0;
  const walk = (effects: readonly Effect[]): void => {
    for (const effect of effects) {
      if (effect.kind === 'damage') {
        const hits = effect.hits ?? 1;
        total += computeAttackDamage(effect.amount, attacker, defender) * hits;
      } else if (effect.kind === 'damageEqualToBlock') {
        total += computeAttackDamage(attacker.block, attacker, defender);
      } else if (effect.kind === 'conditional') {
        const condition = effect.condition;
        const hpPct = (defender.hp / defender.maxHp) * 100;
        if (condition.kind === 'foeHpBelowPct') {
          if (hpPct < condition.pct) walk(effect.then);
        } else if (condition.kind === 'blockAtLeast') {
          if (attacker.block >= condition.amount) walk(effect.then);
        } else {
          walk(effect.then);
        }
      }
    }
  };
  walk(def.effects);
  return total;
}

/**
 * 敵から見た「次のプレイヤーターンに叩き出せる最大火力」。
 * 手札・マナ・筋力・弱体をすべて読み、マナ効率の良い順に貪欲に積む。
 */
export function estimatePlayerThreat(battle: BattleState): number {
  const player = battle.player;
  const enemy = battle.enemy;
  let mana = player.mana;
  const plays: Array<{ cost: number; damage: number }> = [];

  for (const instance of battle.hand) {
    const def = getCard(instance.cardId);
    if (def.cost > mana) continue;
    const damage = estimateCardDamage(def, player, enemy);
    if (damage > 0) {
      plays.push({ cost: def.cost, damage });
    }
  }

  plays.sort((a, b) => {
    const ratioA = a.damage / Math.max(0.5, a.cost);
    const ratioB = b.damage / Math.max(0.5, b.cost);
    return ratioB - ratioA;
  });

  let total = 0;
  for (const play of plays) {
    if (play.cost <= mana) {
      mana -= play.cost;
      total += play.damage;
    }
  }
  return Math.round(total);
}

/* ------------------------------------------------------------------ */
/* 行動の評価                                                          */
/* ------------------------------------------------------------------ */

interface ScoredMove {
  move: EnemyMoveDef;
  score: number;
  attack: number;
  defend: number;
  buff: number;
  debuff: number;
  netDamage: number;
  lethal: boolean;
  preventedLethal: boolean;
  threat: number;
  summary: MoveSummary;
}

function scoreMove(
  def: EnemyDef,
  move: EnemyMoveDef,
  battle: BattleState,
  rng: Rng,
  threat: number,
): ScoredMove {
  const enemy = battle.enemy;
  const player = battle.player;
  const summary = summarizeEffects(move.effects);

  const hpFrac = enemy.hp / enemy.maxHp;
  const playerHpFrac = player.hp / player.maxHp;

  const perHit = summary.hasAttack
    ? computeAttackDamage(summary.damage, enemy, player)
    : 0;
  const effectiveDamage = perHit * (summary.hits || 1);
  const netDamage = Math.min(
    player.hp,
    Math.max(0, effectiveDamage - player.block),
  );
  const lethal = summary.hasAttack && netDamage >= player.hp;

  let attack = 0;
  if (summary.hasAttack) {
    attack = netDamage * 1.05;
    if (lethal) attack += 600;
    attack += netDamage * (1 - playerHpFrac) * 0.65;
    attack += (summary.hits - 1) * statusOf(enemy, 'strength') * 2.5;
    attack *= 0.9 + 0.25 * def.ai.aggression;
  }

  const effectiveBlock = summary.block
    ? summary.block + statusOf(enemy, 'dexterity')
    : 0;
  const defenseNeed = Math.max(0, threat - enemy.block);
  const preventedLethal =
    effectiveBlock > 0 && threat >= enemy.hp + enemy.block;

  let defend = 0;
  if (effectiveBlock > 0 || summary.heal > 0) {
    defend +=
      Math.min(effectiveBlock, defenseNeed + 3) * 1.2 * def.ai.defense;
    defend += summary.heal * 1.15;
    if (preventedLethal) defend += 70 * def.ai.defense;
    if (hpFrac < 0.35) defend += 8;
    if (defenseNeed <= 0 && summary.heal === 0) defend -= 12;
    if (summary.thorns > 0) defend += summary.thorns * 2.2 * def.ai.defense;
  }

  const buffPower =
    summary.strength * 12 + summary.dexterity * 7 + summary.regen * 5;
  let buff = 0;
  if (buffPower > 0) {
    buff =
      buffPower *
      (battle.turn <= 5 ? 1.25 : 0.75) *
      (hpFrac > 0.45 ? 1.15 : 0.5) *
      def.ai.cunning;
  }

  const debuffPower =
    summary.weak * 9 + summary.vulnerable * 8 + summary.poison * 8;
  let debuff = 0;
  if (debuffPower > 0) {
    debuff = debuffPower * def.ai.cunning;
    if (playerHpFrac <= 0.25) debuff *= 0.55;
    if (summary.poison > 0 && playerHpFrac > 0.6) debuff *= 1.2;
  }

  const raw = attack + defend + buff + debuff;

  let repetition = 1;
  const history = enemy.moveHistory;
  const last = history[history.length - 1];
  if (last === move.id) repetition *= 0.5;
  if (history.length >= 2 && last === move.id && history[history.length - 2] === move.id) {
    repetition *= 0.45;
  }

  const jitter = 0.88 + rng.next() * 0.24;
  const score = (raw + 1) * (move.baseWeight ?? 1) * repetition * jitter;

  return {
    move,
    score,
    attack,
    defend,
    buff,
    debuff,
    netDamage,
    lethal,
    preventedLethal,
    threat,
    summary,
  };
}

/* ------------------------------------------------------------------ */
/* 意図の構築                                                          */
/* ------------------------------------------------------------------ */

function intentKind(summary: MoveSummary): IntentKind {
  if (summary.hasAttack) return 'attack';
  if (summary.block > 0) return 'defend';
  if (
    summary.strength > 0 ||
    summary.dexterity > 0 ||
    summary.thorns > 0 ||
    summary.regen > 0
  ) {
    return 'buff';
  }
  if (summary.weak > 0 || summary.vulnerable > 0 || summary.poison > 0) {
    return 'debuff';
  }
  return 'special';
}

function buildTags(summary: MoveSummary): string[] {
  const tags: string[] = [];
  if (summary.strength > 0) tags.push(`筋力 +${summary.strength}`);
  if (summary.dexterity > 0) tags.push(`敏捷 +${summary.dexterity}`);
  if (summary.thorns > 0) tags.push(`棘 ${summary.thorns}`);
  if (summary.regen > 0) tags.push(`再生 ${summary.regen}`);
  if (summary.weak > 0) tags.push(`弱体 ${summary.weak}`);
  if (summary.vulnerable > 0) tags.push(`脆弱 ${summary.vulnerable}`);
  if (summary.poison > 0) tags.push(`毒 ${summary.poison}`);
  return tags;
}

function buildReason(candidate: ScoredMove, battle: BattleState): string {
  if (candidate.lethal) {
    return `あと${battle.player.hp}で沈む。この一撃で終わらせる。`;
  }
  if (candidate.preventedLethal) {
    return `次に受けるのは推定${candidate.threat}。ここで守らねば死ぬ。`;
  }
  const { attack, defend, buff, debuff } = candidate;
  if (defend >= attack && defend >= buff && defend >= debuff) {
    return `相手の手札から推定${candidate.threat}の反撃を読み、被害を最小化する。`;
  }
  if (buff >= attack && buff >= debuff) {
    return '長期戦を見据え、ここで力を蓄える。';
  }
  if (debuff >= attack) {
    return '相手の火力を削ぐのが、最も効く手だと判断した。';
  }
  return `推定${candidate.threat}の反撃とブロックを計算し、攻撃が最も効率的と判断。`;
}

function buildIntent(
  candidate: ScoredMove,
  battle: BattleState,
): EnemyIntent {
  const { move, summary } = candidate;
  const enemy = battle.enemy;
  const player = battle.player;
  const kind = intentKind(summary);
  const tags = buildTags(summary);
  const damage = summary.hasAttack
    ? computeAttackDamage(summary.damage, enemy, player)
    : undefined;
  const block =
    summary.block > 0
      ? summary.block + statusOf(enemy, 'dexterity')
      : undefined;

  return {
    moveId: move.id,
    name: move.name,
    icon: move.icon,
    kind,
    damage,
    hits: summary.hasAttack ? summary.hits : undefined,
    block,
    tags,
    text: move.description,
    reason: buildReason(candidate, battle),
  };
}

/* ------------------------------------------------------------------ */
/* 公開API                                                             */
/* ------------------------------------------------------------------ */

/**
 * 敵の次の行動を決定し、`enemy.intent` を更新する。
 * 使用可能な技をすべて評価し、状況に応じた最善手を選ぶ。
 */
export function planEnemyIntent(battle: BattleState, rng: Rng): EnemyIntent {
  const enemy = battle.enemy;
  const def = getEnemy(enemy.defId);
  const threat = estimatePlayerThreat(battle);

  let moves = def.moves.filter(
    (move) =>
      enemy.availableMoves.includes(move.id) &&
      (enemy.cooldowns[move.id] ?? 0) <= 0,
  );
  if (moves.length === 0) {
    moves = def.moves.filter((move) => enemy.availableMoves.includes(move.id));
  }

  const candidates = moves.map((move) =>
    scoreMove(def, move, battle, rng, threat),
  );
  candidates.sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const intent = buildIntent(best, battle);
  enemy.intent = intent;
  return intent;
}
