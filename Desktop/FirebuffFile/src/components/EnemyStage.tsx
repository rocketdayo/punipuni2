import type { CSSProperties } from 'react';
import type { EnemyState } from '../game';
import { getEnemy, RANK_CLASS, RANK_LABEL } from '../game';
import { HealthBar } from './HealthBar';
import { IntentBadge } from './IntentBadge';
import { BlockBadge, StatusChips } from './StatusChips';

export function EnemyStage({ enemy }: { enemy: EnemyState }) {
  const def = getEnemy(enemy.defId);
  const style = { ['--tint' as string]: enemy.tint } as CSSProperties;

  return (
    <section className="enemy" data-fx-anchor="enemy" style={style}>
      <div className="enemy__intent-wrap">
        <IntentBadge intent={enemy.intent} />
      </div>

      <div className="enemy__presence">
        <div className="enemy__halo" aria-hidden />
        <div className="enemy__ring" aria-hidden>
          <span />
          <span />
        </div>
        <div className="enemy__sigil" aria-hidden>
          {enemy.glyph}
        </div>
      </div>

      <div className="enemy__heading">
        <h2>{enemy.name}</h2>
        <span className={`rank ${RANK_CLASS[enemy.rank]}`}>
          {RANK_LABEL[enemy.rank]}
        </span>
        <span className="enemy__epithet">{def.title}</span>
      </div>

      <div className="enemy__vitals">
        <HealthBar hp={enemy.hp} maxHp={enemy.maxHp} side="enemy" />
        <div className="enemy__badges">
          <BlockBadge value={enemy.block} />
          <StatusChips statuses={enemy.statuses} />
        </div>
      </div>
    </section>
  );
}
