import type { CardDef } from '../game';
import { CARD_TYPE_LABEL, RARITY_LABEL, RARITY_STARS } from '../game';

interface CardViewProps {
  def: CardDef;
  /** 手札以外の場所で使う小型表示 */
  compact?: boolean;
  dimmed?: boolean;
  playable?: boolean;
}

/** 数字を強調したリッチテキスト。 */
function renderText(text: string) {
  return text.split(/(\d+)/g).map((chunk, index) =>
    /^\d+$/.test(chunk) ? (
      <b key={`${chunk}-${index}`} className="card__num">
        {chunk}
      </b>
    ) : (
      <span key={`${chunk}-${index}`}>{chunk}</span>
    ),
  );
}

export function CardView({ def, compact, dimmed, playable }: CardViewProps) {
  const stars = RARITY_STARS[def.rarity];
  return (
    <div
      className={[
        'card',
        `card--${def.type}`,
        compact ? 'card--compact' : '',
        dimmed ? 'card--dimmed' : '',
        playable ? 'card--playable' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${def.name}。コスト${def.cost}。${def.text}`}
    >
      <div className="card__frame" aria-hidden />
      <div className="card__shine" aria-hidden />
      <div className="card__cost">
        <span>{def.cost}</span>
      </div>
      <div className="card__rarity" title={RARITY_LABEL[def.rarity]}>
        {Array.from({ length: stars }).map((_, index) => (
          <i key={index} />
        ))}
      </div>

      <div className="card__art">
        <span className="card__glyph" aria-hidden>
          {def.glyph}
        </span>
        <span className="card__type">{CARD_TYPE_LABEL[def.type]}</span>
      </div>

      <div className="card__body">
        <h3 className="card__name">{def.name}</h3>
        <p className="card__text">{renderText(def.text)}</p>
        {def.exhaust ? <span className="card__exhaust">除外</span> : null}
      </div>

      {def.type === 'trap' ? <span className="card__trap-mark">TRAP</span> : null}
    </div>
  );
}
