import type { CardType, EnemyRank, Rarity } from './types';

export const CARD_TYPE_LABEL: Record<CardType, string> = {
  attack: '攻撃',
  skill: 'スキル',
  power: 'パワー',
  trap: '罠',
};

export const CARD_TYPE_GLYPH: Record<CardType, string> = {
  attack: '⚔',
  skill: '✦',
  power: '❖',
  trap: '◈',
};

export const RARITY_LABEL: Record<Rarity, string> = {
  starter: '初期',
  common: 'コモン',
  uncommon: 'アンコモン',
  rare: 'レア',
};

export const RARITY_STARS: Record<Rarity, number> = {
  starter: 1,
  common: 1,
  uncommon: 2,
  rare: 3,
};

export const RANK_LABEL: Record<EnemyRank, string> = {
  normal: '通常',
  elite: '精鋭',
  boss: '王者',
};

export const RANK_CLASS: Record<EnemyRank, string> = {
  normal: 'rank--normal',
  elite: 'rank--elite',
  boss: 'rank--boss',
};
