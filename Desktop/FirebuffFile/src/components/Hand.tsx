import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { getCard, type CardDef, type CardInstance } from '../game';
import { CardView } from './CardView';

interface HandProps {
  cards: CardInstance[];
  mana: number;
  disabled: boolean;
  trapsFull: boolean;
  onPlay: (uid: number) => void;
}

interface Ghost {
  def: CardDef;
  rect: DOMRect;
}

/** 扇状に重なる手札。位置は絶対配置＋transformで計算し、CSS遷移で滑らかに動かす。 */
export function Hand({ cards, mana, disabled, trapsFull, onPlay }: HandProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(980);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const ghostTimer = useRef<number | null>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => setWidth(host.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (ghostTimer.current) window.clearTimeout(ghostTimer.current);
    };
  }, []);

  const handlePlay = useCallback(
    (event: MouseEvent<HTMLButtonElement>, instance: CardInstance, def: CardDef) => {
      if (disabled || def.cost > mana || (def.type === 'trap' && trapsFull)) return;
      const rect = event.currentTarget.getBoundingClientRect();
      setGhost({ def, rect });
      if (ghostTimer.current) window.clearTimeout(ghostTimer.current);
      ghostTimer.current = window.setTimeout(() => setGhost(null), 540);
      onPlay(instance.uid);
    },
    [disabled, mana, onPlay, trapsFull],
  );

  const count = cards.length;
  const cardWidth = width < 700 ? 128 : width < 900 ? 146 : 166;
  const usable = Math.max(0, width - cardWidth - 20);
  const step = count > 1 ? Math.min(cardWidth * 0.84, usable / (count - 1)) : 0;
  const middle = (count - 1) / 2;

  return (
    <div
      className="hand"
      ref={hostRef}
      style={{ ['--card-w' as string]: `${cardWidth}px` }}
    >
      <div className="hand__fan">
        {cards.map((instance, index) => {
          const def = getCard(instance.cardId);
          const offset = index - middle;
          const x = offset * step;
          const y = Math.pow(Math.abs(offset), 1.6) * 3.2;
          const rotation = offset * 2.4;
          const blockedByTrap = def.type === 'trap' && trapsFull;
          const playable = !disabled && def.cost <= mana && !blockedByTrap;

          return (
            <div
              key={instance.uid}
              className="hand__slot"
              style={{
                transform: `translateX(calc(-50% + ${x}px)) translateY(${y}px) rotate(${rotation}deg)`,
                zIndex: 10 + index,
                ['--i' as string]: index,
              }}
            >
              <button
                type="button"
                className={`hand__button ${playable ? 'is-playable' : 'is-disabled'}`}
                onClick={(event) => handlePlay(event, instance, def)}
                disabled={!playable}
                aria-label={`${def.name}（コスト${def.cost}）${def.text}${
                  playable ? '' : blockedByTrap ? ' 罠がいっぱいです' : ' マナが足りません'
                }`}
                title={
                  blockedByTrap
                    ? '罠は3つまでしか設置できません'
                    : def.cost > mana
                      ? 'マナが足りません'
                      : 'クリックしてプレイ'
                }
              >
                <CardView def={def} playable={playable} />
                <span className="hand__index" aria-hidden>
                  {index + 1}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {count === 0 ? <p className="hand__empty">手札は空だ。ターンを終えよう。</p> : null}

      {ghost
        ? createPortal(
            <div
              className="ghost"
              style={{
                left: ghost.rect.left,
                top: ghost.rect.top,
                width: ghost.rect.width,
                height: ghost.rect.height,
                ['--card-w' as string]: `${ghost.rect.width}px`,
              }}
              aria-hidden
            >
              <div className="ghost__inner">
                <CardView def={ghost.def} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
