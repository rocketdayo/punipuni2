import { useEffect } from 'react';
import { HAND_SIZE, MAX_TRAPS, START_MANA, STATUS_INFO, STATUS_ORDER } from '../game';

export function HelpModal({ onClose }: { onClose: () => void }) {
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
        className="modal modal--help"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="遊び方"
      >
        <header className="modal__head">
          <div>
            <p className="kicker">HOW TO PLAY</p>
            <h2>カード・コロシアム 遊び方</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </header>

        <div className="modal__body">
          <section className="help-section">
            <h3>勝つために</h3>
            <p>
              相手のHPを0にすれば勝利。自分のHPが0になると敗北だ。
              <strong>6人の闘士</strong>を順番に倒し、コロシアムの王を越えれば制覇となる。
              HPは戦闘をまたいで持ち越されるが、勝利するたびに少し回復する。
            </p>
          </section>

          <section className="help-section">
            <h3>ターンの流れ</h3>
            <ol className="help-steps">
              <li>
                <b>ターン開始</b>
                マナが{START_MANA}に回復し、カードを{HAND_SIZE}枚引く。ブロックは消える。
              </li>
              <li>
                <b>カードをプレイ</b>
                マナを支払い、手札から好きなだけ使う。攻撃・防御・強化、そして罠。
              </li>
              <li>
                <b>ターン終了</b>
                手札を捨て、敵の行動が解決される。敵の行動は<b>事前に可視化</b>されている。
              </li>
            </ol>
          </section>

          <section className="help-section">
            <h3>マナ</h3>
            <p>
              毎ターン{START_MANA}まで回復する、そのターンだけの資源。
              カード左上の数字がコストだ。使い切れなかったマナは持ち越せない。
            </p>
          </section>

          <section className="help-section">
            <h3>ブロック</h3>
            <p>
              ブロックはダメージを肩代わりする。自分のターン開始時にリセットされるため、
              敵の攻撃を読んで「先に」張るのが基本。盾アイコンと数字が現在値だ。
            </p>
          </section>

          <section className="help-section">
            <h3>敵の意図（インテント）</h3>
            <p>
              敵の頭上に、次の行動が表示される。剣なら攻撃、盾なら防御、炎なら強化、毒なら妨害。
              攻撃の数字は<b>筋力・弱体・脆弱を反映済み</b>の実効値だ。
              意図にカーソルを合わせると、その行動の内容と<b>AIがなぜそれを選んだか</b>まで読める。
            </p>
          </section>

          <section className="help-section">
            <h3>罠</h3>
            <p>
              罠カードはその場では発動せず、最大{MAX_TRAPS}つまで設置できる。
              敵が「攻撃」した瞬間に自動で発動し、被害を減らしたり反撃したりする。
              敵の意図が攻撃のときに置くとよい。
            </p>
          </section>

          <section className="help-section">
            <h3>状態異常と強化</h3>
            <ul className="help-status">
              {STATUS_ORDER.map((key) => {
                const info = STATUS_INFO[key];
                return (
                  <li key={key}>
                    <span className={`help-status__chip help-status__chip--${info.tone}`}>
                      {info.glyph} {info.name}
                    </span>
                    <span>{info.description}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="help-section">
            <h3>デッキを育てる</h3>
            <p>
              勝利後、3枚のカードから1枚を選んでデッキに加えられる。
              見送るとHPを大きく回復できる。レアリティは<b>コモン → アンコモン → レア</b>の3段階。
              強いカードを足すだけでなく、デッキの枚数を薄く保つことも戦略だ。
            </p>
          </section>

          <section className="help-section">
            <h3>操作</h3>
            <ul className="help-keys">
              <li><span className="keycap">1</span>–<span className="keycap">9</span> 手札をプレイ</li>
              <li><span className="keycap">SPACE</span> ターン終了</li>
              <li><span className="keycap">H</span> このヘルプ</li>
              <li><span className="keycap">ESC</span> モーダルを閉じる</li>
            </ul>
          </section>
        </div>

        <footer className="modal__foot">
          <button type="button" className="btn btn--gold" onClick={onClose}>
            理解した
          </button>
        </footer>
      </div>
    </div>
  );
}
