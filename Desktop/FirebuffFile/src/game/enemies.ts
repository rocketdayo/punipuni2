import type { Effect, EnemyRank } from './types';

/** 敵の性格。AIの評価関数の重み付けに使う。 */
export interface AiPersonality {
  /** 攻撃を好む度合い */
  aggression: number;
  /** 防御を好む度合い */
  defense: number;
  /** 強化・弱体という「時間を稼ぐ」手を好む度合い */
  cunning: number;
}

export interface EnemyMoveDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  effects: Effect[];
  /** 使用後、このターン数は選択不可になる */
  cooldown?: number;
  /** 評価スコアへの固定倍率 (技の個性付け) */
  baseWeight?: number;
}

export interface EnemyEnrage {
  hpPct: number;
  strength: number;
  text: string;
  unlock: string[];
}

export interface EnemyDef {
  id: string;
  name: string;
  title: string;
  glyph: string;
  hp: number;
  rank: EnemyRank;
  /** UIのテーマカラー */
  tint: string;
  flavor: string;
  ai: AiPersonality;
  moves: EnemyMoveDef[];
  enrage?: EnemyEnrage;
}

export const ENEMIES: Record<string, EnemyDef> = {
  treneus: {
    id: 'treneus',
    name: 'トレニアス',
    title: '見習い剣闘士',
    glyph: '🗡️',
    hp: 46,
    rank: 'normal',
    tint: '#e2a35c',
    flavor: '「先輩、見ててください。ぼく、ちゃんと戦えますから」',
    ai: { aggression: 1.05, defense: 0.85, cunning: 0.55 },
    moves: [
      {
        id: 'slash',
        name: '斬りつけ',
        icon: '⚔️',
        description: '7ダメージを与える。',
        effects: [{ kind: 'damage', amount: 7 }],
      },
      {
        id: 'brace',
        name: '構え',
        icon: '🛡️',
        description: '7ブロックを得る。',
        effects: [{ kind: 'block', amount: 7 }],
      },
      {
        id: 'spirit',
        name: '気合',
        icon: '🔥',
        description: '筋力2を得る。',
        effects: [{ kind: 'status', status: 'strength', amount: 2, target: 'self' }],
      },
    ],
  },

  gard: {
    id: 'gard',
    name: 'ガルド',
    title: '双刃の傭兵',
    glyph: '🪓',
    hp: 56,
    rank: 'normal',
    tint: '#d97a5a',
    flavor: '「二本あるのは伊達じゃない。どっちから来ると思う？」',
    ai: { aggression: 1.25, defense: 0.7, cunning: 0.8 },
    moves: [
      {
        id: 'twin_fang',
        name: '双刃斬り',
        icon: '⚔️',
        description: '5ダメージを2回与える。',
        effects: [{ kind: 'damage', amount: 5, hits: 2 }],
      },
      {
        id: 'feint',
        name: '陽動',
        icon: '💨',
        description: '6ブロックを得て、弱体2を付与する。',
        effects: [
          { kind: 'block', amount: 6 },
          { kind: 'status', status: 'weak', amount: 2, target: 'foe' },
        ],
      },
      {
        id: 'frenzy',
        name: '猛り',
        icon: '🔥',
        description: '筋力3を得る。',
        effects: [{ kind: 'status', status: 'strength', amount: 3, target: 'self' }],
      },
    ],
  },

  barbus: {
    id: 'barbus',
    name: 'バルバス',
    title: '鉄壁の番人',
    glyph: '🛡️',
    hp: 68,
    rank: 'normal',
    tint: '#7fa6b8',
    flavor: '「この門は、俺が死ぬまで開かん」',
    ai: { aggression: 0.85, defense: 1.5, cunning: 0.9 },
    moves: [
      {
        id: 'bash',
        name: '盾打ち',
        icon: '💥',
        description: '8ダメージを与え、脆弱2を付与する。',
        effects: [
          { kind: 'damage', amount: 8 },
          { kind: 'status', status: 'vulnerable', amount: 2, target: 'foe' },
        ],
      },
      {
        id: 'fortify',
        name: '要塞化',
        icon: '🏰',
        description: '12ブロックを得る。',
        effects: [{ kind: 'block', amount: 12 }],
      },
      {
        id: 'spikes',
        name: '棘鎧',
        icon: '🌵',
        description: '6ブロックを得て、棘3を得る。',
        effects: [
          { kind: 'block', amount: 6 },
          { kind: 'status', status: 'thorns', amount: 3, target: 'self' },
        ],
      },
    ],
  },

  serpen: {
    id: 'serpen',
    name: 'セルペン',
    title: '毒蛇の呪術師',
    glyph: '🐍',
    hp: 60,
    rank: 'normal',
    tint: '#8fc46f',
    flavor: '「急ぐな。毒は、ゆっくりと効くものだ」',
    ai: { aggression: 0.9, defense: 0.85, cunning: 1.45 },
    moves: [
      {
        id: 'venom_breath',
        name: '毒の息',
        icon: '☠️',
        description: '毒5を付与する。',
        effects: [{ kind: 'status', status: 'poison', amount: 5, target: 'foe' }],
      },
      {
        id: 'hex',
        name: '呪詛',
        icon: '🕯️',
        description: '弱体2と脆弱2を付与する。',
        effects: [
          { kind: 'status', status: 'weak', amount: 2, target: 'foe' },
          { kind: 'status', status: 'vulnerable', amount: 2, target: 'foe' },
        ],
      },
      {
        id: 'drain',
        name: '吸命',
        icon: '🩸',
        description: '7ダメージを与え、5HP回復する。',
        effects: [
          { kind: 'damage', amount: 7 },
          { kind: 'heal', amount: 5 },
        ],
      },
    ],
  },

  mold: {
    id: 'mold',
    name: 'モルド',
    title: '亡霊の将軍',
    glyph: '💀',
    hp: 84,
    rank: 'elite',
    tint: '#a99bd4',
    flavor: '「死してなお、戦場は俺のものだ」',
    ai: { aggression: 1.15, defense: 0.95, cunning: 1.1 },
    moves: [
      {
        id: 'reap',
        name: '魂刈り',
        icon: '⚔️',
        description: '7ダメージを2回与える。',
        effects: [{ kind: 'damage', amount: 7, hits: 2 }],
      },
      {
        id: 'nightmare',
        name: '悪夢',
        icon: '🌑',
        description: '毒4と弱体2を付与する。',
        effects: [
          { kind: 'status', status: 'poison', amount: 4, target: 'foe' },
          { kind: 'status', status: 'weak', amount: 2, target: 'foe' },
        ],
      },
      {
        id: 'warcry',
        name: '戦慄の号令',
        icon: '📢',
        description: '8ブロックを得て、筋力3を得る。',
        effects: [
          { kind: 'block', amount: 8 },
          { kind: 'status', status: 'strength', amount: 3, target: 'self' },
        ],
      },
    ],
  },

  asterion: {
    id: 'asterion',
    name: 'アステリオン',
    title: 'コロシアムの王',
    glyph: '🦁',
    hp: 110,
    rank: 'boss',
    tint: '#e9c46a',
    flavor: '「この玉座に座るのは、勝者だけだ。お前は――どうだ？」',
    ai: { aggression: 1.25, defense: 1.0, cunning: 1.2 },
    moves: [
      {
        id: 'royal_cleave',
        name: '王家の一閃',
        icon: '⚔️',
        description: '11ダメージを与え、脆弱2を付与する。',
        effects: [
          { kind: 'damage', amount: 11 },
          { kind: 'status', status: 'vulnerable', amount: 2, target: 'foe' },
        ],
      },
      {
        id: 'bulwark',
        name: '黄金の守り',
        icon: '🛡️',
        description: '14ブロックを得て、筋力2を得る。',
        effects: [
          { kind: 'block', amount: 14 },
          { kind: 'status', status: 'strength', amount: 2, target: 'self' },
        ],
      },
      {
        id: 'judgment',
        name: '断罪',
        icon: '⚡',
        description: '18ダメージを与える。',
        effects: [{ kind: 'damage', amount: 18 }],
        cooldown: 3,
        baseWeight: 1.15,
      },
      {
        id: 'lion_fury',
        name: '獅子の連撃',
        icon: '🦁',
        description: '6ダメージを3回与える。',
        effects: [{ kind: 'damage', amount: 6, hits: 3 }],
        cooldown: 1,
      },
    ],
    enrage: {
      hpPct: 0.5,
      strength: 3,
      text: '王の鬨が、コロシアムを震わせた……！',
      unlock: ['lion_fury'],
    },
  },
};

export function getEnemy(id: string): EnemyDef {
  const enemy = ENEMIES[id];
  if (!enemy) throw new Error(`未知の敵ID: ${id}`);
  return enemy;
}

export function getEnemyMove(def: EnemyDef, moveId: string): EnemyMoveDef | undefined {
  return def.moves.find((move) => move.id === moveId);
}

/** 連戦のロードマップ。ここを差し替えるだけでキャンペーンを再構成できる。 */
export const ENCOUNTER_SEQUENCE: readonly string[] = [
  'treneus',
  'gard',
  'barbus',
  'serpen',
  'mold',
  'asterion',
];
