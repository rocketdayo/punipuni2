import { useState } from 'react';
import { sfx } from '../audio/sfx';

export function SoundButton() {
  const [on, setOn] = useState(sfx.enabled);

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => setOn(sfx.toggle())}
      aria-label={on ? '効果音をオフにする' : '効果音をオンにする'}
      title={on ? '効果音オン' : '効果音オフ'}
    >
      <span aria-hidden>{on ? '🔊' : '🔇'}</span>
    </button>
  );
}
