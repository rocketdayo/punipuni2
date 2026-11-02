import { useEffect } from 'react';
import { CARD_TYPE_LABEL, getCard, type CardInstance } from '../game';

export interface DeckSection {
  label: string;
  cards: CardInstance[];
  emptyText?: string;
}

interface DeckModalProps {
  title: string;
  subtitle?: string;
  sections: DeckSection[];
  onClose: () => void;
}

export function DeckModal({ title, subtitle, sections, onClose }: DeckModalProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal modal--deck"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal__head">
          <div>
            <p className="kicker">YOUR CARDS</p>
            <h2>{title}</h2>
            {subtitle ? <p className="modal__sub">{subtitle}</p> : null}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </header>

        <div className="modal__body deck-body">
          {sections.map((section) => (
            <section className="deck-section" key={section.label}>
              <h3>
                {section.label}
                <span>{section.cards.length}</span>
              </h3>
              {section.cards.length === 0 ? (
                <p className="deck-empty">{section.emptyText ?? 'カードはない。'}</p>
              ) : (
                <ul className="deck-list">
                  {section.cards.map((instance) => {
                    const def = getCard(instance.cardId);
                    return (
                      <li className={`deck-row deck-row--${def.type}`} key={instance.uid}>
                        <span className="deck-row__cost">{def.cost}</span>
                        <span className="deck-row__glyph" aria-hidden>
                          {def.glyph}
                        </span>
                        <span className="deck-row__main">
                          <span className="deck-row__name">
                            {def.name}
                            <em>{CARD_TYPE_LABEL[def.type]}</em>
                          </span>
                          <span className="deck-row__text">{def.text}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
