import type { EnemyIntent } from '../game';

const KIND_LABEL: Record<EnemyIntent['kind'], string> = {
  attack: '攻撃',
  defend: '防御',
  buff: '強化',
  debuff: '妨害',
  special: '特殊',
};

export function IntentBadge({ intent }: { intent: EnemyIntent }) {
  return (
    <div className={`intent intent--${intent.kind}`} tabIndex={0} aria-label={`敵の意図：${intent.name}`}>
      <span className="intent__pulse" aria-hidden />
      <span className="intent__icon" aria-hidden>
        {intent.icon}
      </span>
      <span className="intent__body">
        {intent.damage != null ? (
          <span className="intent__value intent__value--damage">
            {intent.damage}
            {intent.hits && intent.hits > 1 ? <small>×{intent.hits}</small> : null}
          </span>
        ) : intent.block != null ? (
          <span className="intent__value intent__value--block">🛡 {intent.block}</span>
        ) : (
          <span className="intent__value intent__value--text">{KIND_LABEL[intent.kind]}</span>
        )}
        <span className="intent__name">{intent.name}</span>
      </span>
      <span className="intent__hint" aria-hidden>
        ?
      </span>

      <div className="intent__pop" role="tooltip">
        <h4>
          <span aria-hidden>{intent.icon}</span> {intent.name}
        </h4>
        <p>{intent.text}</p>
        {intent.tags.length > 0 ? (
          <div className="intent__tags">
            {intent.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
        <p className="intent__reason">
          <span aria-hidden>🧠</span> 思考：{intent.reason}
        </p>
      </div>
    </div>
  );
}
