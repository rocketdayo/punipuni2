export interface Stage {
  id: string;
  name: string;
  enemyName: string;
  enemyHp: number;
  enemyAtk: number;
  enemyColor: string;
  enemyEmoji: string;
  rewardMoney: number;
  rewardYPoints: number;
  isHidden?: boolean;
}

const generateStages = (count: number): Stage[] => {
  const stages: Stage[] = [];
  const emojis = ['👿', '👺', '👻', '💀', '👽', '👾', '🤖', '🎃', '👹'];
  
  for (let i = 1; i <= count; i++) {
    // Scaling formulas
    const hp = Math.floor(500 * Math.pow(1.15, i - 1));
    const atk = Math.floor(10 * Math.pow(1.1, i - 1));
    const money = Math.floor(50 + i * 20);
    const yPoints = Math.floor(10 + i * 5);
    const emoji = emojis[(i - 1) % emojis.length];

    stages.push({
      id: `stage_${i}`,
      name: `ステージ ${i}`,
      enemyName: `ボス怪魔 Lv.${i}`,
      enemyHp: hp,
      enemyAtk: atk,
      enemyColor: '#330000',
      enemyEmoji: emoji,
      rewardMoney: money,
      rewardYPoints: yPoints,
    });

    // Add a hidden stage every 10 stages
    if (i % 10 === 0) {
      stages.push({
        id: `stage_hidden_${i/10}`,
        name: `ウラステージ ${i/10}`,
        enemyName: `真・怪魔 Lv.${i/10}`,
        enemyHp: hp * 2.5,
        enemyAtk: atk * 1.5,
        enemyColor: '#110022',
        enemyEmoji: '🐉',
        rewardMoney: money * 3,
        rewardYPoints: yPoints * 3,
        isHidden: true,
      });
    }
  }
  return stages;
};

export const STAGES = generateStages(50);
