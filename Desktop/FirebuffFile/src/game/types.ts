/**
 * カード・コロシアム — ドメイン型定義
 *
 * このファイルはゲームの「語彙」を定義する。エンジン・AI・UIはすべて
 * ここで定義された純粋なデータだけをやり取りする。ReactにもDOMにも依存しない。
 */

export type Side = 'player' | 'enemy';

export type CardType = 'attack' | 'skill' | 'power' | 'trap';

export type Rarity = 'starter' | 'common' | 'uncommon' | 'rare';

export type TargetKind = 'enemy' | 'self' | 'none';

export type StatusKey =
  | 'strength'
  | 'dexterity'
  | 'vulnerable'
  | 'weak'
  | 'poison'
  | 'regen'
  | 'thorns';

export type Statuses = Partial<Record<StatusKey, number>>;

/* ------------------------------------------------------------------ */
/* 効果 (Effect)                                                       */
/* ------------------------------------------------------------------ */

/** 条件付き効果の判定式。拡張はユニオンに1ケース追加するだけで済む。 */
export type Condition =
  | { kind: 'foeHpBelowPct'; pct: number }
  | { kind: 'blockAtLeast'; amount: number }
  | { kind: 'statusAtLeast'; status: StatusKey; target: 'self' | 'foe'; amount: number };

/**
 * カード/敵行動が引き起こす効果の基本単位。
 * `self` は「実行者」、`foe` は「相手」を指す相対表現。
 */
export type Effect =
  | { kind: 'damage'; amount: number; hits?: number }
  | { kind: 'block'; amount: number }
  | { kind: 'draw'; amount: number }
  | { kind: 'mana'; amount: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'loseHp'; amount: number }
  | { kind: 'status'; status: StatusKey; amount: number; target: 'self' | 'foe' }
  | { kind: 'clearStatus'; status: StatusKey; target: 'self' | 'foe' }
  | { kind: 'damageEqualToBlock' }
  | { kind: 'counterDamage'; bonus: number }
  | { kind: 'conditional'; condition: Condition; then: Effect[]; otherwise?: Effect[] };

/* ------------------------------------------------------------------ */
/* カード                                                              */
/* ------------------------------------------------------------------ */

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  rarity: Rarity;
  cost: number;
  target: TargetKind;
  /** カード中央に表示する紋章 (絵文字) */
  glyph: string;
  /** 効果説明。数字はUI側で強調表示される。 */
  text: string;
  effects: Effect[];
  /** 使用後に除外されるか */
  exhaust?: boolean;
  flavor?: string;
}

/** デッキ内のカード1枚。定義はIDで参照し、状態に実体を持たない。 */
export interface CardInstance {
  uid: number;
  cardId: string;
}

/* ------------------------------------------------------------------ */
/* 戦闘                                                                */
/* ------------------------------------------------------------------ */

export interface CombatantState {
  hp: number;
  maxHp: number;
  block: number;
  statuses: Statuses;
}

export interface PlayerState extends CombatantState {
  mana: number;
  maxMana: number;
}

export type IntentKind = 'attack' | 'defend' | 'buff' | 'debuff' | 'special';

export type EnemyRank = 'normal' | 'elite' | 'boss';

/** 敵が「次のターンに何をするつもりか」の完全なスナップショット。 */
export interface EnemyIntent {
  moveId: string;
  name: string;
  icon: string;
  kind: IntentKind;
  /** 1ヒットあたりの実効ダメージ (強化/弱体/脆弱を反映済み) */
  damage?: number;
  hits?: number;
  /** 得られるブロック (敏捷を反映済み) */
  block?: number;
  /** 「弱体 2」「毒 5」など補助情報のチップ */
  tags: string[];
  text: string;
  /** AIがなぜこの行動を選んだかの言語化 */
  reason: string;
}

export interface EnemyState extends CombatantState {
  defId: string;
  name: string;
  glyph: string;
  rank: EnemyRank;
  intent: EnemyIntent;
  /** 現在使用可能な技ID (激昂で追加される) */
  availableMoves: string[];
  moveHistory: string[];
  /** 技ID -> 残りクールダウンターン */
  cooldowns: Record<string, number>;
  enraged: boolean;
  tint: string;
}

export interface TrapState {
  uid: number;
  cardId: string;
  name: string;
  glyph: string;
}

export type BattlePhase = 'player' | 'enemy' | 'won' | 'lost';

export interface LogEntry {
  id: number;
  text: string;
  tone: 'info' | 'good' | 'danger' | 'muted';
}

export interface BattleStats {
  damageDealt: number;
  damageTaken: number;
  cardsPlayed: number;
  trapsTriggered: number;
}

export interface BattleState {
  id: number;
  stageIndex: number;
  turn: number;
  phase: BattlePhase;
  player: PlayerState;
  enemy: EnemyState;
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  traps: TrapState[];
  handSize: number;
  nextUid: number;
  rngSeed: number;
  log: LogEntry[];
  stats: BattleStats;
}

/* ------------------------------------------------------------------ */
/* 演出イベント                                                        */
/* ------------------------------------------------------------------ */

/**
 * エンジンが発行する「起きたこと」の記録。
 * UIはこれを解釈して、ダメージポップアップ・揺れ・効果音などに変換する。
 * エンジン自身は演出を一切知らない。
 */
export type GameEvent =
  | { type: 'damage'; target: Side; amount: number; blocked: number }
  | { type: 'heal'; target: Side; amount: number }
  | { type: 'block'; target: Side; amount: number }
  | { type: 'status'; target: Side; status: StatusKey; amount: number }
  | { type: 'mana'; amount: number }
  | { type: 'draw'; amount: number }
  | { type: 'shake'; power: 1 | 2 | 3 }
  | { type: 'flash'; target: Side }
  | { type: 'card'; cardId: string; name: string; cardType: CardType }
  | { type: 'trap'; name: string; glyph: string }
  | { type: 'enemyMove'; moveId: string; name: string; icon: string }
  | { type: 'banner'; text: string; tone: 'info' | 'good' | 'danger' | 'gold' }
  | { type: 'victory' }
  | { type: 'defeat' };

/* ------------------------------------------------------------------ */
/* ラン (連戦)                                                         */
/* ------------------------------------------------------------------ */

export type Screen = 'map' | 'battle' | 'reward' | 'victory' | 'defeat';

export interface EncounterPlan {
  enemyId: string;
  label: string;
  rank: EnemyRank;
}

export interface RunState {
  seed: number;
  screen: Screen;
  /** 次に戦う (または現在戦っている) ステージのインデックス */
  stageIndex: number;
  encounters: EncounterPlan[];
  deck: CardInstance[];
  hp: number;
  maxHp: number;
  battle: BattleState | null;
  rewardChoices: string[];
  battlesWon: number;
  turnsPlayed: number;
  nextUid: number;
  rngSeed: number;
}
