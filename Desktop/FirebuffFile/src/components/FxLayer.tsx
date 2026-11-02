import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { STATUS_INFO, type GameEvent, type Side } from '../game';
import { sfx } from '../audio/sfx';
import { useGameEvents } from '../store/useGame';

interface Popup {
  id: number;
  x: number;
  y: number;
  text: string;
  sub?: string;
  tone: 'damage' | 'heal' | 'block' | 'status' | 'mana' | 'buff';
  tilt: number;
}

interface Spark {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Banner {
  id: number;
  text: string;
  tone: 'info' | 'good' | 'danger' | 'gold';
}

/**
 * エンジンのイベント列を「演出」に翻訳する唯一の場所。
 * ゲームロジック側は一切のDOM/音/アニメーションを知らない。
 */
export function FxLayer({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const popupId = useRef(0);
  const timers = useRef<number[]>([]);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [banner, setBanner] = useState<Banner | null>(null);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  useEffect(() => {
    const ids = timers.current;
    return () => {
      ids.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const anchor = useCallback((side: Side): { x: number; y: number } => {
    const host = hostRef.current;
    if (!host) return { x: 0, y: 0 };
    const hostRect = host.getBoundingClientRect();
    const target = host.querySelector<HTMLElement>(`[data-fx-anchor="${side}"]`);
    if (target) {
      const rect = target.getBoundingClientRect();
      return {
        x: rect.left - hostRect.left + rect.width / 2,
        y: rect.top - hostRect.top + rect.height * 0.36,
      };
    }
    return {
      x: hostRect.width / 2,
      y: side === 'enemy' ? hostRect.height * 0.3 : hostRect.height * 0.68,
    };
  }, []);

  const addPopup = useCallback(
    (
      side: Side,
      text: string,
      tone: Popup['tone'],
      sub?: string,
    ) => {
      const base = anchor(side);
      const id = (popupId.current += 1);
      const popup: Popup = {
        id,
        x: base.x + (Math.random() - 0.5) * 90,
        y: base.y + (Math.random() - 0.5) * 18,
        text,
        sub,
        tone,
        tilt: (Math.random() - 0.5) * 10,
      };
      setPopups((current) => [...current.slice(-7), popup]);
      later(() => {
        setPopups((current) => current.filter((item) => item.id !== id));
      }, 1150);
    },
    [anchor, later],
  );

  const addSparks = useCallback(
    (side: Side, amount: number) => {
      const base = anchor(side);
      const created: Spark[] = Array.from({ length: amount }, () => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 26 + Math.random() * 54;
        return {
          id: (popupId.current += 1),
          x: base.x,
          y: base.y,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
        };
      });
      setSparks((current) => [...current.slice(-24), ...created]);
      const ids = new Set(created.map((spark) => spark.id));
      later(() => {
        setSparks((current) => current.filter((spark) => !ids.has(spark.id)));
      }, 620);
    },
    [anchor, later],
  );

  const shake = useCallback((power: number) => {
    const host = hostRef.current;
    if (!host) return;
    host.classList.remove('is-shaking', 'is-shaking--hard');
    void host.offsetWidth;
    host.classList.add(power >= 2 ? 'is-shaking--hard' : 'is-shaking');
    window.setTimeout(() => {
      host.classList.remove('is-shaking', 'is-shaking--hard');
    }, 460);
  }, []);

  const flash = useCallback((side: Side) => {
    const host = hostRef.current;
    const target = host?.querySelector<HTMLElement>(
      `[data-fx-anchor="${side}"]`,
    );
    if (target) {
      target.classList.remove('is-hit');
      void target.offsetWidth;
      target.classList.add('is-hit');
      window.setTimeout(() => target.classList.remove('is-hit'), 320);
    }
    const vignette = vignetteRef.current;
    if (vignette) {
      vignette.classList.remove('is-flashing');
      void vignette.offsetWidth;
      vignette.classList.add('is-flashing');
    }
  }, []);

  const showBanner = useCallback(
    (text: string, tone: Banner['tone']) => {
      const id = (popupId.current += 1);
      setBanner({ id, text, tone });
      later(() => {
        setBanner((current) => (current && current.id === id ? null : current));
      }, 1650);
    },
    [later],
  );

  useGameEvents((events: GameEvent[]) => {
    for (const event of events) {
      switch (event.type) {
        case 'damage': {
          if (event.amount > 0) {
            const sub = event.blocked > 0 ? `🛡 ${event.blocked} 軽減` : undefined;
            addPopup(event.target, `-${event.amount}`, 'damage', sub);
            addSparks(event.target, Math.min(9, 3 + Math.floor(event.amount / 4)));
            sfx.play('hit');
          } else {
            addPopup(event.target, 'BLOCK', 'block', `${event.blocked} 軽減`);
            sfx.play('block');
          }
          break;
        }
        case 'heal':
          addPopup(event.target, `+${event.amount}`, 'heal');
          sfx.play('heal');
          break;
        case 'block':
          addPopup(event.target, `+${event.amount}`, 'block', 'ブロック');
          sfx.play('block');
          break;
        case 'status': {
          const info = STATUS_INFO[event.status];
          addPopup(
            event.target,
            `${info.glyph} ${event.amount > 0 ? `+${event.amount}` : event.amount}`,
            'status',
            info.name,
          );
          sfx.play(info.tone === 'buff' ? 'buff' : 'debuff');
          break;
        }
        case 'mana':
          addPopup('player', `+${event.amount}`, 'mana', 'マナ');
          break;
        case 'draw':
          sfx.play('draw');
          break;
        case 'shake':
          shake(event.power);
          break;
        case 'flash':
          flash(event.target);
          break;
        case 'card':
          sfx.play('card');
          break;
        case 'trap':
          showBanner(`罠発動 — ${event.name}`, 'good');
          sfx.play('trap');
          break;
        case 'enemyMove':
          showBanner(`${event.icon} ${event.name}`, 'danger');
          sfx.play('turn');
          break;
        case 'banner':
          showBanner(event.text, event.tone);
          break;
        case 'victory':
          showBanner('勝利', 'gold');
          sfx.play('victory');
          break;
        case 'defeat':
          showBanner('敗北', 'danger');
          sfx.play('defeat');
          break;
        default:
          break;
      }
    }
  });

  return (
    <div className="fx-host" ref={hostRef}>
      <div className="fx-stage">{children}</div>

      {popups.map((popup) => (
        <div
          key={popup.id}
          className={`popup popup--${popup.tone}`}
          style={{
            left: `${popup.x}px`,
            top: `${popup.y}px`,
            ['--tilt' as string]: `${popup.tilt}deg`,
          }}
          aria-hidden
        >
          <span className="popup__main">{popup.text}</span>
          {popup.sub ? <span className="popup__sub">{popup.sub}</span> : null}
        </div>
      ))}

      {sparks.map((spark) => (
        <span
          key={spark.id}
          className="spark"
          style={{
            left: `${spark.x}px`,
            top: `${spark.y}px`,
            ['--dx' as string]: `${spark.dx}px`,
            ['--dy' as string]: `${spark.dy}px`,
          }}
          aria-hidden
        />
      ))}

      <div ref={vignetteRef} className="fx-vignette" aria-hidden />

      {banner ? (
        <div
          key={banner.id}
          ref={bannerRef}
          className={`banner banner--${banner.tone}`}
          role="status"
        >
          <span className="banner__line" aria-hidden />
          <span className="banner__text">{banner.text}</span>
          <span className="banner__line" aria-hidden />
        </div>
      ) : null}
    </div>
  );
}
