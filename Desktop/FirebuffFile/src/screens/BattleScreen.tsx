import { useCallback, useEffect } from 'react';
import { sfx } from '../audio/sfx';
import { CombatLog } from '../components/CombatLog';
import { EnemyStage } from '../components/EnemyStage';
import { FxLayer } from '../components/FxLayer';
import { Hand } from '../components/Hand';
import { ManaGauge } from '../components/ManaGauge';
import { PlayerStage } from '../components/PlayerStage';
import { SoundButton } from '../components/SoundButton';
import type { EnemyIntent } from '../game';
import { gameStore } from '../store/gameStore';
import { useGame } from '../store/useGame';

interface BattleScreenProps {
  onHelp: () => void;
  onDeck: () => void;
  modalOpen: boolean;
}

function intentHint(intent: EnemyIntent): string {
  if (intent.damage != null) {
    return `${intent.damage}${intent.hits && intent.hits > 1 ? `×${intent.hits}` : ''} ダメージ`;
  }
  if (intent.block != null) return `${intent.block} ブロック`;
  return intent.name;
}

export function BattleScreen({ onHelp, onDeck, modalOpen }: BattleScreenProps) {
  const { run, busy } = useGame();
  const battle = run?.battle;

  useEffect(() => {
    if (!battle) return;

    const handleKey = (event: KeyboardEvent) => {
      if (modalOpen) return;
      if (!battle || battle.phase !== 'player' || busy) return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        sfx.play('click');
        gameStore.endTurn();
        return;
      }
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < 9) {
        const card = battle.hand[index];
        if (card) gameStore.playCard(card.uid);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [battle, busy, modalOpen]);

  const playCard = useCallback((uid: number) => {
    gameStore.playCard(uid);
  }, []);

  const endTurn = useCallback(() => {
    sfx.play('click');
    gameStore.endTurn();
  }, []);

  if (!run || !battle) return null;

  const playerTurn = battle.phase === 'player' && !busy;

  return (
    <div className="battle-screen">
      <FxLayer>
        <div className="battle-frame">
          <header className="battle-top">
            <div className="stage-chip">
              <span className="stage-chip__label">STAGE</span>
              <b>{run.stageIndex + 1}</b>
              <span className="stage-chip__total">/ {run.encounters.length}</span>
            </div>

            <div className="battle-top__center">
              <span className="turn-chip">TURN {battle.turn}</span>
              <span className={`turn-chip turn-chip--ghost ${playerTurn ? 'is-active' : ''}`}>
                {playerTurn ? 'あなたの手番' : '敵の手番'}
              </span>
            </div>

            <div className="battle-top__actions">
              <button type="button" className="pile-btn" onClick={onDeck} title="山札と捨て札を確認">
                <span aria-hidden>🂠</span>
                <span>山札 <b>{battle.drawPile.length}</b></span>
                <span className="pile-btn__sep" aria-hidden />
                <span>捨て札 <b>{battle.discardPile.length}</b></span>
              </button>
              <button type="button" className="icon-btn" onClick={onDeck} title="デッキを見る">
                <span aria-hidden>📚</span>
              </button>
              <button type="button" className="icon-btn" onClick={onHelp} title="遊び方">
                <span aria-hidden>？</span>
              </button>
              <SoundButton />
            </div>
          </header>

          <div className="arena">
            <CombatLog log={battle.log} />
            <div className="arena__rays" aria-hidden />
            <EnemyStage enemy={battle.enemy} />
            <div className="arena__floor" aria-hidden />

            <div className="arena__bottom">
              <PlayerStage player={battle.player} traps={battle.traps} />
              <div className="arena__mana">
                <ManaGauge player={battle.player} />
              </div>
            </div>
          </div>

          <div className="dock">
            <div className="dock__hand">
              <Hand
                cards={battle.hand}
                mana={battle.player.mana}
                disabled={!playerTurn}
                trapsFull={battle.traps.length >= 3}
                onPlay={playCard}
              />
            </div>

            <div className="dock__side">
              <div className="dock__hint">
                <span>カードをクリック</span>
                <span className="keycap">1</span>
                <span className="keycap">2</span>
                <span className="keycap">3</span>
                <span>で発動</span>
              </div>
              <button
                type="button"
                className={`end-turn ${busy ? 'is-busy' : ''}`}
                onClick={endTurn}
                disabled={!playerTurn}
              >
                <span className="end-turn__main">
                  {busy ? '敵の手番…' : 'ターン終了'}
                </span>
                <span className="end-turn__sub">
                  {busy ? 'ENEMY TURN' : `次: ${intentHint(battle.enemy.intent)}`}
                </span>
                <span className="end-turn__key">SPACE</span>
              </button>
            </div>
          </div>
        </div>
      </FxLayer>
    </div>
  );
}
