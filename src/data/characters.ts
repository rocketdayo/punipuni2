export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';

export interface Skill {
  name: string;
  type: 'damage' | 'heal';
  power: number; // multiplier for damage or flat heal
}

export interface Character {
  id: string;
  name: string;
  rank: Rank;
  color: string;
  emoji: string;
  rankImage: string;
  imageUrl?: string;
  baseHp: number;
  baseAtk: number;
  skill?: Skill;
  trait?: string;           // キャラ特性（フレーバーテキスト）
  eventBoost?: boolean;     // イベント特効キャラか
  eventBoostDesc?: string;  // 特効の説明文
}

const generateCharacters = (): Character[] => {
  const chars: Character[] = [];
  let idCounter = 1;

  const rankImageMap: Record<Rank, string> = {
    'E': '/puni_e.png',
    'D': '/puni_d.png',
    'C': '/puni_c.png',
    'B': '/puni_b.png',
    'A': '/puni_a.png',
    'S': import.meta.env.BASE_URL + 'puni_s.png',
    'SS': import.meta.env.BASE_URL + 'puni_s.png', // Fallback to S rank icon
  };

  const createSet = (rank: Rank, baseHp: number, baseAtk: number, color: string, animals: {name: string, emoji: string}[]) => {
    animals.forEach((a, i) => {
      const char: Character = {
        id: `char_${rank.toLowerCase()}_${idCounter++}`,
        name: `${a.name}プニ`,
        rank,
        color,
        emoji: a.emoji,
        rankImage: rankImageMap[rank],
        imageUrl: import.meta.env.BASE_URL + `puni_${rank.toLowerCase()}_${i + 1}.png`,
        baseHp: baseHp + i * 5,
        baseAtk: baseAtk + i * 2,
      };
      if (rank === 'S' || rank === 'SS') {
        const isSS = rank === 'SS';
        char.skill = {
          name: isSS ? (i % 2 === 0 ? '究極破壊砲' : '神の祝福') : (i % 2 === 0 ? '超爆裂波' : '癒やしの極み'),
          type: i % 2 === 0 ? 'damage' : 'heal',
          power: isSS ? (i % 2 === 0 ? 30 : 1500) : (i % 2 === 0 ? 15 : 500),
        };
        // キャラ特性の設定
        char.trait = isSS
          ? (i % 2 === 0 ? '伝説の破壊神。その一撃は山をも砕く。' : '天より降り注ぐ癒やしの力を持つ存在。')
          : (i % 2 === 0 ? '妖怪界に名を轟かす強者。' : '不思議な力で仲間を守る。');
        // イベント特効キャラ（SSランクの奇数番目）
        if (isSS && i % 3 === 0) {
          char.eventBoost = true;
          char.eventBoostDesc = '今週のイベント「妖怪大乱！」で攻撃力が3倍になる！';
        }
      } else {
        // A/B/C/D/E ランクの特性
        const traitsByRank: Record<string, string[]> = {
          'A': ['妖怪界の猛者。鍛えればSランク以上の力を発揮することも。', '素早い動きで相手を翻弄する。', '頼れる実力者。'],
          'B': ['努力家。毎日の鍛練を欠かさない。', '仲間想いの優しい妖怪。', '普通に見えて実は凄腕。'],
          'C': ['まだまだ成長途中の若手妖怪。', '元気いっぱいでやる気は満点！', 'いつかSランクになるのが夢。'],
          'D': ['ひょうきん者で場を和ませる。', '食いしん坊だが憎めない。', '意外な才能の持ち主かもしれない。'],
          'E': ['まだまだ駆け出しの妖怪。', 'のんびり屋だが根は優しい。', '夢はいつか大妖怪になること。'],
        };
        const traits = traitsByRank[rank];
        if (traits) char.trait = traits[i % traits.length];
      }
      chars.push(char);
    });
  };

  const eAnimals = [
    {name: 'スライム', emoji: '💧'}, {name: 'どろ', emoji: '💩'}, {name: 'きのこ', emoji: '🍄'}, {name: 'ねずみ', emoji: '🐭'}, {name: 'かえる', emoji: '🐸'},
    {name: 'いもむし', emoji: '🐛'}, {name: 'あり', emoji: '🐜'}, {name: 'はえ', emoji: '🪰'}, {name: 'かたつむり', emoji: '🐌'}, {name: 'みみず', emoji: '🪱'}
  ];
  createSet('E', 100, 10, '#88cc88', eAnimals);

  const dAnimals = [
    {name: 'かっぱ', emoji: '🥒'}, {name: 'おばけ', emoji: '👻'}, {name: 'こぞう', emoji: '👦'}, {name: 'うさぎ', emoji: '🐰'}, {name: 'かめ', emoji: '🐢'},
    {name: 'かに', emoji: '🦀'}, {name: 'さかな', emoji: '🐟'}, {name: 'いか', emoji: '🦑'}, {name: 'たこ', emoji: '🐙'}, {name: 'えび', emoji: '🦐'}
  ];
  createSet('D', 150, 15, '#55aa55', dAnimals);

  const cAnimals = [
    {name: 'からかさ', emoji: '☂️'}, {name: 'ろくろ', emoji: '🦒'}, {name: 'のっぺら', emoji: '😶'}, {name: 'ぶた', emoji: '🐷'}, {name: 'さる', emoji: '🐵'},
    {name: 'ひつじ', emoji: '🐑'}, {name: 'やぎ', emoji: '🐐'}, {name: 'うし', emoji: '🐮'}, {name: 'うま', emoji: '🐴'}, {name: 'いのしし', emoji: '🐗'}
  ];
  createSet('C', 200, 25, '#aa5555', cAnimals);

  const bAnimals = [
    {name: 'ねこ', emoji: '🐱'}, {name: 'いぬ', emoji: '🐶'}, {name: 'とり', emoji: '🐦'}, {name: 'ぺんぎん', emoji: '🐧'}, {name: 'ふくろう', emoji: '🦉'},
    {name: 'はと', emoji: '🕊️'}, {name: 'あひる', emoji: '🦆'}, {name: 'わし', emoji: '🦅'}, {name: 'こうもり', emoji: '🦇'}, {name: 'はち', emoji: '🐝'}
  ];
  createSet('B', 300, 40, '#ff88aa', bAnimals);

  const aAnimals = [
    {name: 'きつね', emoji: '🦊'}, {name: 'たぬき', emoji: '🦝'}, {name: 'てんぐ', emoji: '👺'}, {name: 'くま', emoji: '🐻'}, {name: 'とら', emoji: '🐯'},
    {name: 'らいおん', emoji: '🦁'}, {name: 'ぞう', emoji: '🐘'}, {name: 'さい', emoji: '🦏'}, {name: 'かば', emoji: '🦛'}, {name: 'ごりら', emoji: '🦍'}
  ];
  createSet('A', 450, 60, '#ffaa00', aAnimals);

  const sAnimals = [
    {name: 'おに', emoji: '👹'}, {name: 'りゅう', emoji: '🐉'}, {name: 'かみ', emoji: '✨'}, {name: 'えんま', emoji: '👑'}, {name: 'きゅうび', emoji: '🦊'},
    {name: 'おろち', emoji: '🐍'}, {name: 'ぬらり', emoji: '👽'}, {name: 'あしゅら', emoji: '👿'}, {name: 'てんし', emoji: '👼'}, {name: 'あくま', emoji: '😈'}
  ];
  createSet('S', 700, 100, '#ff2222', sAnimals);

  const ssAnimals = [
    {name: '覚醒おに', emoji: '👹'}, {name: '神龍', emoji: '🐉'}, {name: '創造神', emoji: '✨'}, {name: '大王えんま', emoji: '👑'}, {name: '白金きゅうび', emoji: '🦊'},
    {name: '八岐おろち', emoji: '🐍'}, {name: 'ぬらり神', emoji: '👽'}, {name: '覇王あしゅら', emoji: '👿'}, {name: '大天使', emoji: '👼'}, {name: '大魔王', emoji: '😈'}
  ];
  createSet('SS', 1200, 250, '#ff22ff', ssAnimals);

  return chars;
};

export const CHARACTERS = generateCharacters();
