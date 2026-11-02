import { useEffect, useRef, useState } from 'react';
import { sfx } from '../audio/sfx';
import { CardView } from '../components/CardView';
import { SKIP_REWARD_HEAL, getCard } from '../game';
import { gameStore } from '../store/gameStore';
import { useGame } from '../store/useGame';

export function RewardScreen() {
  const { run } = useGame();
  const [picked, setPicked] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (!run) return null;

  const choose = (cardId: string) => {
    if (picked) return;
    setPicked(cardId);
    sfx.play('select');
    timer.current = window.setTimeout(() => gameStore.claimReward(cardId), 480);
  };

  const skip = () => {
    if (picked) return;
    sfx.play('click');
    gameStore.claimReward(null);
  };

  return (
    <div className="reward-screen">
      <div className="reward-rays" aria-hidden />
      <div className="reward-inner">
        <header className="reward-head">
          <p className="kicker">VICTORY — SPOILS</p>
          <h1 className="screen-title">戦利品</h1>
          <p className="reward-sub">
            {run.stageIndex + 1}人目の闘士を退けた。カードを1枚選び、デッキに加えよう。
          </p>
          <div className="reward-meta">
            <span>現在のHP <b>{run.hp}</b> / {run.maxHp}</span>
            <span>デッキ <b>{run.deck.length}</b> 枚</span>
          </div>
        </header>

        <div className="reward-cards">
          {run.rewardChoices.map((cardId, index) => {
            const def = getCard(cardId);
            return (
              <button
                type="button"
                key={cardId}
                className={`reward-card ${picked === cardId ? 'is-picked' : ''}`}
                onClick={() => choose(cardId)}
                style={{ ['--i' as string]: index }}
                aria-label={`${def.name}を獲得`}
              >
                <span className="reward-card__aura" aria-hidden />
                <CardView def={def} />
                <span className="reward-card__cta">獲得する</span>
              </button>
            );
          })}
        </div>

        <div className="reward-actions">
          <button type="button" className="btn btn--ghost" onClick={skip}>
            見送る <span className="reward-actions__heal">（HP +{SKIP_REWARD_HEAL}）</span>
          </button>
        </div>
      </div>
    </div>
  );
}
