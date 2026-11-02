import { useMemo } from 'react';

interface Ember {
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
}

/** 闘技場の空気を漂う火の粉。CSSのみで動く軽量な装飾。 */
export function EmberBackground() {
  const embers = useMemo<Ember[]>(
    () =>
      Array.from({ length: 28 }, () => ({
        left: Math.random() * 100,
        size: 1 + Math.random() * 3,
        delay: -Math.random() * 22,
        duration: 14 + Math.random() * 18,
        drift: (Math.random() - 0.5) * 90,
      })),
    [],
  );

  return (
    <div className="embers" aria-hidden>
      {embers.map((ember, index) => (
        <span
          key={index}
          className="ember"
          style={{
            left: `${ember.left}%`,
            width: `${ember.size}px`,
            height: `${ember.size}px`,
            animationDelay: `${ember.delay}s`,
            animationDuration: `${ember.duration}s`,
            ['--drift' as string]: `${ember.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
