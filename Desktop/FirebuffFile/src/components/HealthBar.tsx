interface HealthBarProps {
  hp: number;
  maxHp: number;
  side: 'player' | 'enemy';
  compact?: boolean;
}

export function HealthBar({ hp, maxHp, side, compact }: HealthBarProps) {
  const ratio = maxHp <= 0 ? 0 : Math.max(0, Math.min(1, hp / maxHp));
  const percent = ratio * 100;
  const low = ratio <= 0.3;

  return (
    <div
      className={[
        'hp',
        `hp--${side}`,
        low ? 'hp--low' : '',
        compact ? 'hp--compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="meter"
      aria-valuenow={hp}
      aria-valuemin={0}
      aria-valuemax={maxHp}
      aria-label={`HP ${hp} / ${maxHp}`}
    >
      <div className="hp__track">
        <div className="hp__fill" style={{ width: `${percent}%` }}>
          <span className="hp__gloss" />
        </div>
      </div>
      <div className="hp__label">
        <span className="hp__heart" aria-hidden>
          {side === 'enemy' ? '☠' : '❤'}
        </span>
        <b>{hp}</b>
        <span>/ {maxHp}</span>
      </div>
    </div>
  );
}
