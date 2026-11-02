import type { PlayerState } from '../game';

export function ManaGauge({ player }: { player: PlayerState }) {
  const overflow = player.mana > player.maxMana;
  const orbCount = Math.max(player.maxMana, player.mana);

  return (
    <div className="mana" aria-label={`マナ ${player.mana} / ${player.maxMana}`}>
      <div className="mana__orbs" aria-hidden>
        {Array.from({ length: orbCount }).map((_, index) => (
          <span
            key={index}
            className={[
              'mana__orb',
              index < player.mana ? 'is-full' : '',
              index >= player.maxMana ? 'is-bonus' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <i />
          </span>
        ))}
      </div>
      <div className="mana__label">
        <b>{player.mana}</b>
        <span>{overflow ? `MANA (+${player.mana - player.maxMana})` : `/ ${player.maxMana} MANA`}</span>
      </div>
    </div>
  );
}
