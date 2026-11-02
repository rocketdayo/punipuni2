import { sfx } from '../audio/sfx';
import { gameStore } from '../store/gameStore';
import { useGame } from '../store/useGame';

export function EndScreen() {
  const { run } = useGame();
  if (!run) return null;

  const victory = run.screen === 'victory';
  const start = () => {
    sfx.play('select');
    gameStore.startRun();
  };

  return (
    <div className={`screen end-screen ${victory ? 'end-screen--victory' : 'end-screen--defeat'}`}>
      <div className="end-rays" aria-hidden />
      <div className="end-panel">
        <p className="kicker">
          {victory ? 'CHAMPION OF THE COLISEUM' : 'FALLEN IN THE ARENA'}
        </p>
        <h1 className={`end-title ${victory ? 'end-title--gold' : 'end-title--blood'}`}>
          {victory ? '勝 利' : '敗 北'}
        </h1>
        <p className="end-lead">
          {victory
            ? '六つの試練を越え、あなたはコロシアムの頂点に立った。観客の叫びが、あなたの名を呼んでいる。'
            : '闘技場の砂が、あなたの血を吸っていく。だが、次に立つのは、もっと強いあなたのはずだ。'}
        </p>

        <dl className="end-stats">
          <div>
            <dt>撃破</dt>
            <dd>
              {run.battlesWon} <span>/ {run.encounters.length}</span>
            </dd>
          </div>
          <div>
            <dt>ターン</dt>
            <dd>{run.turnsPlayed}</dd>
          </div>
          <div>
            <dt>デッキ</dt>
            <dd>
              {run.deck.length} <span>枚</span>
            </dd>
          </div>
          <div>
            <dt>残りHP</dt>
            <dd>
              {run.hp} <span>/ {run.maxHp}</span>
            </dd>
          </div>
        </dl>

        <div className="end-actions">
          <button type="button" className="btn btn--gold btn--xl" onClick={start}>
            もう一度挑む
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => gameStore.returnToTitle()}
          >
            タイトルへ
          </button>
        </div>
      </div>
    </div>
  );
}
