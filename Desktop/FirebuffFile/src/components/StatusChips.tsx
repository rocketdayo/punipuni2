import type { Statuses } from '../game';
import { STATUS_INFO, STATUS_ORDER } from '../game';

interface StatusChipsProps {
  statuses: Statuses;
}

export function StatusChips({ statuses }: StatusChipsProps) {
  const entries = STATUS_ORDER.filter((key) => (statuses[key] ?? 0) !== 0);
  if (entries.length === 0) return null;

  return (
    <div className="statuses">
      {entries.map((key) => {
        const info = STATUS_INFO[key];
        const value = statuses[key] ?? 0;
        return (
          <span
            key={key}
            className={`status status--${info.tone}`}
            data-tip={`${info.name} ${value} — ${info.description}`}
            tabIndex={0}
          >
            <span aria-hidden>{info.glyph}</span>
            <b>{value}</b>
          </span>
        );
      })}
    </div>
  );
}

interface BlockBadgeProps {
  value: number;
}

export function BlockBadge({ value }: BlockBadgeProps) {
  if (value <= 0) return null;
  return (
    <span
      className="block-badge"
      data-tip="ブロック：ダメージを肩代わりする。自分のターン開始時に消える。"
      tabIndex={0}
    >
      <span aria-hidden>🛡</span>
      <b>{value}</b>
    </span>
  );
}
