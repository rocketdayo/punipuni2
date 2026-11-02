import type { PlayerState, TrapState } from '../game';
import { MAX_TRAPS, getCard } from '../game';
import { HealthBar } from './HealthBar';
import { BlockBadge, StatusChips } from './StatusChips';

interface PlayerStageProps {
  player: PlayerState;
  traps: TrapState[];
}

export function PlayerStage({ player, traps }: PlayerStageProps) {
  return (
    <section className="player" data-fx-anchor="player">
      <div className="player__crest" aria-hidden>
        ⚔️
      </div>

      <div className="player__body">
        <div className="player__heading">
          <h3>剣闘士</h3>
          <span className="kicker">GLADIATOR</span>
        </div>
        <HealthBar hp={player.hp} maxHp={player.maxHp} side="player" compact />
        <div className="player__badges">
          <BlockBadge value={player.block} />
          <StatusChips statuses={player.statuses} />
        </div>
      </div>

      <div className="traps">
        <span className="traps__label">罠</span>
        <div className="traps__slots">
          {Array.from({ length: MAX_TRAPS }).map((_, index) => {
            const trap = traps[index];
            if (!trap) {
              return (
                <span key={`empty-${index}`} className="trap-slot trap-slot--empty">
                  <i aria-hidden>＋</i>
                  <em>空</em>
                </span>
              );
            }
            const def = getCard(trap.cardId);
            return (
              <span
                key={trap.uid}
                className="trap-slot trap-slot--filled"
                data-tip={`${def.name} — ${def.text}`}
                tabIndex={0}
              >
                <i aria-hidden>{trap.glyph}</i>
                <em>{def.name.replace('罠：', '')}</em>
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
