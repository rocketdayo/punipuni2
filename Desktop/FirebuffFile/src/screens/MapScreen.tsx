import type { CSSProperties } from 'react';
import { sfx } from '../audio/sfx';
import { HealthBar } from '../components/HealthBar';
import { SoundButton } from '../components/SoundButton';
import {
  RANK_CLASS,
  RANK_LABEL,
  currentEncounter,
  getEnemy,
} from '../game';
import { gameStore } from '../store/gameStore';
import { useGame } from '../store/useGame';

interface MapScreenProps {
  onHelp: () => void;
  onDeck: () => void;
}

export function MapScreen({ onHelp, onDeck }: MapScreenProps) {
  const { run } = useGame();
  if (!run) return null;

  const encounter = currentEncounter(run);
  const nextEnemy = encounter ? getEnemy(encounter.enemyId) : null;

  const march = () => {
    sfx.play('select');
    gameStore.startBattle();
  };

  return (
    <div className="screen map-screen">
      <header className="map-head">
        <div>
          <p className="kicker">THE GAUNTLET</p>
          <h1 className="screen-title">闘技場の道</h1>
        </div>
        <div className="map-head__actions">
          <button type="button" className="icon-btn icon-btn--wide" onClick={onDeck}>
            <span aria-hidden>🂠</span> デッキ <b>{run.deck.length}</b>
          </button>
          <button type="button" className="icon-btn" onClick={onHelp} title="遊び方">
            <span aria-hidden>？</span>
          </button>
          <SoundButton />
        </div>
      </header>

      <div className="map-grid">
        <section className="panel path" aria-label="連戦の道">
          <div className="path__rail" aria-hidden />
          {run.encounters.map((plan, index) => {
            const enemy = getEnemy(plan.enemyId);
            const state =
              index < run.stageIndex
                ? 'done'
                : index === run.stageIndex
                  ? 'current'
                  : 'locked';
            const style = { ['--tint' as string]: enemy.tint } as CSSProperties;

            return (
              <article key={`${plan.enemyId}-${index}`} className={`node node--${state}`} style={style}>
                <div className="node__badge">
                  {state === 'done' ? '✓' : String(index + 1).padStart(2, '0')}
                </div>
                <div className="node__glyph" aria-hidden>
                  {enemy.glyph}
                </div>
                <div className="node__body">
                  <div className="node__row">
                    <h3>{enemy.name}</h3>
                    <span className={`rank ${RANK_CLASS[plan.rank]}`}>
                      {RANK_LABEL[plan.rank]}
                    </span>
                  </div>
                  <p className="node__meta">
                    {plan.label} ・ HP {enemy.hp}
                  </p>
                  {state === 'current' ? (
                    <p className="node__flavor">「{enemy.flavor.replace(/^「|」$/g, '')}」</p>
                  ) : null}
                </div>
                {state === 'done' ? <span className="node__done">撃破</span> : null}
                {state === 'current' ? <span className="node__now">次の相手</span> : null}
              </article>
            );
          })}
        </section>

        <aside className="map-side">
          <section className="panel gladiator">
            <p className="kicker">YOUR GLADIATOR</p>
            <div className="gladiator__crest" aria-hidden>
              ⚔️
            </div>
            <h2>剣闘士</h2>
            <HealthBar hp={run.hp} maxHp={run.maxHp} side="player" />
            <dl className="stat-list">
              <div>
                <dt>デッキ</dt>
                <dd>{run.deck.length} 枚</dd>
              </div>
              <div>
                <dt>撃破</dt>
                <dd>
                  {run.battlesWon} / {run.encounters.length}
                </dd>
              </div>
              <div>
                <dt>到達</dt>
                <dd>STAGE {Math.min(run.stageIndex + 1, run.encounters.length)}</dd>
              </div>
            </dl>
            <button type="button" className="btn btn--gold btn--block" onClick={march}>
              出陣する <span aria-hidden>→</span>
            </button>
            <p className="gladiator__note">
              勝利するとHPを少し回復し、カードを1枚獲得できる。
            </p>
          </section>

          {nextEnemy ? (
            <section className="panel next-opponent" style={{ ['--tint' as string]: nextEnemy.tint } as CSSProperties}>
              <p className="kicker">NEXT OPPONENT</p>
              <div className="next-opponent__glyph" aria-hidden>
                {nextEnemy.glyph}
              </div>
              <h3>{nextEnemy.name}</h3>
              <p className="next-opponent__title">{nextEnemy.title}</p>
              <p className="next-opponent__flavor">「{nextEnemy.flavor.replace(/^「|」$/g, '')}」</p>
              <div className="next-opponent__tags">
                <span>HP {nextEnemy.hp}</span>
                <span>{nextEnemy.moves.length} 種の技</span>
                <span>思考型AI</span>
              </div>
            </section>
          ) : null}

          <button
            type="button"
            className="link-btn"
            onClick={() => gameStore.returnToTitle()}
          >
            闘技場を去る（タイトルへ）
          </button>
        </aside>
      </div>
    </div>
  );
}
