export type MissionType = 'kill_enemy' | 'complete_stage' | 'gacha_pull' | 'level_up';

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  goal: number;
  rewardYPoints?: number;
  rewardMoney?: number;
  rewardItems?: { expSmall?: number; expLarge?: number; skillBook?: number };
}

export interface GameEvent {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  color: string;       // gradient top color
  colorEnd: string;    // gradient bottom color
  boostMultiplier: number;  // 特効キャラのダメージ倍率
  missions: Mission[];
}

export const CURRENT_EVENTS: GameEvent[] = [
  {
    id: 'event_yokai_chaos',
    title: '妖怪大乱！',
    subtitle: 'SSランク特効キャラ大活躍！',
    description: 'イベント特効のSSキャラを編成すると攻撃力が3倍！限定ミッションもクリアしてアイテムをゲットしよう！',
    emoji: '👹',
    color: '#cc0055',
    colorEnd: '#660033',
    boostMultiplier: 3.0,
    missions: [
      {
        id: 'yokai_kill_10',
        title: 'ステージ敵を10回倒す',
        description: 'どのステージでもOK！敵を合計10回倒そう',
        type: 'kill_enemy',
        goal: 10,
        rewardYPoints: 100,
        rewardItems: { expSmall: 2 },
      },
      {
        id: 'yokai_stage_3',
        title: 'ステージを3回クリア',
        description: 'ステージをクリアするたびにカウントアップ',
        type: 'complete_stage',
        goal: 3,
        rewardMoney: 500,
        rewardItems: { expSmall: 1, skillBook: 1 },
      },
      {
        id: 'yokai_gacha_5',
        title: 'ガシャを5回引く',
        description: '恒常・イベントどちらでもOK',
        type: 'gacha_pull',
        goal: 5,
        rewardYPoints: 200,
        rewardItems: { expLarge: 1 },
      },
      {
        id: 'yokai_levelup_3',
        title: 'キャラを3回レベルアップ',
        description: 'アイテムやYマネーでキャラを強化しよう',
        type: 'level_up',
        goal: 3,
        rewardMoney: 300,
        rewardItems: { skillBook: 1 },
      },
    ],
  },
];
