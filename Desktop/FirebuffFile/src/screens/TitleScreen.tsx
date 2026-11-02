import { sfx } from '../audio/sfx';
import { CardView } from '../components/CardView';
import { CARDS, getCard } from '../game';
import { gameStore } from '../store/gameStore';

const SHOWCASE = ['execution', 'sword_saint', 'absolute_ward'];

export function TitleScreen({ onHelp }: { onHelp: () => void }) {
  const start = () => {
    sfx.play('select');
    gameStore.startRun();
  };

  return (
    <div className="screen title-screen">
      <div className="title-rays" aria-hidden />
      <div className="title-inner">
        <p className="kicker kicker--wide">ROGUELIKE DECK BUILDER</p>

        <h1 className="title-logo">
          カード<span className="title-logo__dot">・</span>コロシアム
        </h1>
        <p className="title-roman">CARD COLISEUM</p>

        <div className="title-fan" aria-hidden>
          {SHOWCASE.map((id, index) => (
            <div key={id} className={`title-fan__item title-fan__item--${index}`}>
              <CardView def={getCard(id)} />
            </div>
          ))}
        </div>

        <p className="title-lead">
          マナを操り、カードを重ね、六人の闘士を越えろ。
          <br />
          これは、勝ち残るためのデッキ構築。
        </p>

        <div className="title-actions">
          <button type="button" className="btn btn--gold btn--xl" onClick={start}>
            闘技場へ挑む
            <span className="btn__shine" aria-hidden />
          </button>
          <button type="button" className="btn btn--ghost" onClick={onHelp}>
            遊び方
          </button>
        </div>

        <ul className="title-facts">
          <li>
            <b>{Object.keys(CARDS).length}</b>
            <span>種のカード</span>
          </li>
          <li>
            <b>6</b>
            <span>連戦</span>
          </li>
          <li>
            <b>AI</b>
            <span>手札を読む敵</span>
          </li>
        </ul>

        <p className="title-foot">HEAR THE ROAR. BUILD YOUR DECK.</p>
      </div>
    </div>
  );
}
