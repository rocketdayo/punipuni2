import { getCard } from './cards';
import { addLog, type Ctx } from './combat';
import { HAND_LIMIT } from './constants';
import type { CardInstance } from './types';

/** 山札からカードを引く。山札が尽きたら捨て札を再シャッフルする。 */
export function drawCards(ctx: Ctx, amount: number): number {
  let drawn = 0;
  for (let i = 0; i < amount; i += 1) {
    if (ctx.battle.drawPile.length === 0) {
      if (ctx.battle.discardPile.length === 0) break;
      ctx.battle.drawPile = ctx.rng.shuffle(ctx.battle.discardPile);
      ctx.battle.discardPile = [];
      addLog(ctx, '捨て札を山札に戻してシャッフルした。', 'muted');
    }
    const card = ctx.battle.drawPile.pop();
    if (!card) break;
    if (ctx.battle.hand.length >= HAND_LIMIT) {
      ctx.battle.discardPile.push(card);
      addLog(ctx, `手札がいっぱいで${cardName(card)}は捨てられた。`, 'muted');
      continue;
    }
    ctx.battle.hand.push(card);
    drawn += 1;
  }
  if (drawn > 0) {
    ctx.events.push({ type: 'draw', amount: drawn });
    addLog(ctx, `カードを${drawn}枚引いた。`, 'muted');
  }
  return drawn;
}

function cardName(card: CardInstance): string {
  return getCard(card.cardId).name;
}

export function discardHand(ctx: Ctx): void {
  if (ctx.battle.hand.length === 0) return;
  const count = ctx.battle.hand.length;
  ctx.battle.discardPile.push(...ctx.battle.hand);
  ctx.battle.hand = [];
  addLog(ctx, `手札${count}枚を捨てた。`, 'muted');
}
