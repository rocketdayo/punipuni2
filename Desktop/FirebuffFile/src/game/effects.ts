import {
  addLog,
  applyStatus,
  gainBlock,
  healTarget,
  loseHp,
  otherSide,
  performAttack,
  sideLabel,
  statusOf,
  type Ctx,
} from './combat';
import { drawCards } from './piles';
import { STATUS_INFO } from './statuses';
import type { Condition, Effect, Side } from './types';

/** 条件式を現在の戦況で評価する。 */
export function evaluateCondition(condition: Condition, ctx: Ctx): boolean {
  switch (condition.kind) {
    case 'foeHpBelowPct':
      return (ctx.foe.hp / ctx.foe.maxHp) * 100 < condition.pct;
    case 'blockAtLeast':
      return ctx.self.block >= condition.amount;
    case 'statusAtLeast': {
      const target = condition.target === 'self' ? ctx.self : ctx.foe;
      return statusOf(target, condition.status) >= condition.amount;
    }
    default:
      return false;
  }
}

function targetSide(effectTarget: 'self' | 'foe', ctx: Ctx): Side {
  return effectTarget === 'self' ? ctx.actor : otherSide(ctx.actor);
}

/**
 * 効果1つを解決する。
 * 新しい効果を追加する場合は、このswitchにケースを足す（網羅性は型で保証される）。
 */
export function resolveEffect(effect: Effect, ctx: Ctx): void {
  switch (effect.kind) {
    case 'damage': {
      performAttack(ctx, effect.amount, effect.hits ?? 1);
      break;
    }
    case 'block': {
      gainBlock(ctx, ctx.actor, effect.amount);
      break;
    }
    case 'draw': {
      if (ctx.actor === 'player') drawCards(ctx, effect.amount);
      break;
    }
    case 'mana': {
      if (ctx.actor === 'player') {
        ctx.battle.player.mana += effect.amount;
        ctx.events.push({ type: 'mana', amount: effect.amount });
        addLog(ctx, `マナを${effect.amount}得た。`, 'good');
      }
      break;
    }
    case 'heal': {
      healTarget(ctx, ctx.actor, effect.amount);
      break;
    }
    case 'loseHp': {
      loseHp(ctx, ctx.actor, effect.amount);
      break;
    }
    case 'status': {
      applyStatus(ctx, targetSide(effect.target, ctx), effect.status, effect.amount);
      break;
    }
    case 'clearStatus': {
      const side = targetSide(effect.target, ctx);
      const target = side === 'player' ? ctx.battle.player : ctx.battle.enemy;
      if (statusOf(target, effect.status) > 0) {
        delete target.statuses[effect.status];
        addLog(
          ctx,
          `${sideLabel(side)}の${STATUS_INFO[effect.status].name}を取り除いた。`,
          'good',
        );
      }
      break;
    }
    case 'damageEqualToBlock': {
      performAttack(ctx, ctx.self.block);
      break;
    }
    case 'counterDamage': {
      performAttack(ctx, (ctx.pendingAttack ?? 0) + effect.bonus);
      break;
    }
    case 'conditional': {
      const passed = evaluateCondition(effect.condition, ctx);
      if (passed) {
        resolveEffects(effect.then, ctx);
      } else if (effect.otherwise) {
        resolveEffects(effect.otherwise, ctx);
      }
      break;
    }
    default: {
      const exhaustive: never = effect;
      return exhaustive;
    }
  }
}

/** 効果列を順番に解決する。 */
export function resolveEffects(effects: readonly Effect[], ctx: Ctx): void {
  for (const effect of effects) {
    resolveEffect(effect, ctx);
  }
}
