import type { StatusKey } from './types';

export interface StatusInfo {
  name: string;
  glyph: string;
  description: string;
  tone: 'buff' | 'debuff';
}

/** 状態異常・強化の表示メタデータ。UI・ログ・ヘルプが共有する。 */
export const STATUS_INFO: Record<StatusKey, StatusInfo> = {
  strength: {
    name: '筋力',
    glyph: '💪',
    description: '与えるダメージが1ヒットごとに+Nされる。',
    tone: 'buff',
  },
  dexterity: {
    name: '敏捷',
    glyph: '🍃',
    description: '得られるブロックが+Nされる。',
    tone: 'buff',
  },
  vulnerable: {
    name: '脆弱',
    glyph: '💔',
    description: '受けるダメージが50%増加する。自分のターン終了時に1減少。',
    tone: 'debuff',
  },
  weak: {
    name: '弱体',
    glyph: '🥀',
    description: '与えるダメージが25%減少する。自分のターン終了時に1減少。',
    tone: 'debuff',
  },
  poison: {
    name: '毒',
    glyph: '🧪',
    description: 'ターン開始時にブロックを無視してNダメージを受け、Nが1減る。',
    tone: 'debuff',
  },
  regen: {
    name: '再生',
    glyph: '🌿',
    description: 'ターン終了時にN回復し、Nが1減る。',
    tone: 'buff',
  },
  thorns: {
    name: '棘',
    glyph: '🌵',
    description: '攻撃を受けるたび、攻撃者にNダメージを与える。',
    tone: 'buff',
  },
};

export const STATUS_ORDER: StatusKey[] = [
  'strength',
  'dexterity',
  'thorns',
  'regen',
  'vulnerable',
  'weak',
  'poison',
];
