export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

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
  rankImage: string;  // path to rank-based sprite image
  baseHp: number;
  baseAtk: number;
  skill?: Skill;
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
    'S': '/puni_s.png',
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
        baseHp: baseHp + i * 5,
        baseAtk: baseAtk + i * 2,
      };
      if (rank === 'S') {
        char.skill = {
          name: i % 2 === 0 ? '超爆裂波' : '癒やしの極み',
          type: i % 2 === 0 ? 'damage' : 'heal',
          power: i % 2 === 0 ? 15 : 500, // 15x damage multiplier or 500 flat heal
        };
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

  return chars;
};

export const CHARACTERS = generateCharacters();
