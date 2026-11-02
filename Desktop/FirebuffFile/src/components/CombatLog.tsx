import { useEffect, useRef } from 'react';
import type { LogEntry } from '../game';

export function CombatLog({ log }: { log: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (host) host.scrollTop = host.scrollHeight;
  }, [log.length]);

  return (
    <aside className="log" aria-label="戦闘ログ">
      <span className="log__title">戦況</span>
      <div className="log__body" ref={ref}>
        {log.slice(-18).map((entry) => (
          <p key={entry.id} className={`log__line log__line--${entry.tone}`}>
            {entry.text}
          </p>
        ))}
      </div>
    </aside>
  );
}
