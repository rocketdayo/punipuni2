/**
 * 決定的な乱数生成器 (mulberry32)。
 *
 * シードはゲーム状態に保存されるため、同じシードと同じ操作列からは
 * 必ず同じ結果が再現される。テスト・デバッグ・リプレイの土台。
 */
export class Rng {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0 || 0x9e3779b9;
  }

  /** 0以上1未満の乱数 */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** min以上max以下の整数 */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  /** 非破壊シャッフル (Fisher–Yates) */
  shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  get seed(): number {
    return this.s;
  }
}

/** 時間に依存する新しいシードを作る (UI層からのみ使用) */
export function randomSeed(): number {
  return ((Date.now() & 0xffffffff) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}
