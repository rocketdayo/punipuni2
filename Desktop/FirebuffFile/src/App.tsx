import { useCallback, useEffect, useState } from 'react';
import { DeckModal, type DeckSection } from './components/DeckModal';
import { EmberBackground } from './components/EmberBackground';
import { HelpModal } from './components/HelpModal';
import type { RunState } from './game';
import { BattleScreen } from './screens/BattleScreen';
import { EndScreen } from './screens/EndScreen';
import { MapScreen } from './screens/MapScreen';
import { RewardScreen } from './screens/RewardScreen';
import { TitleScreen } from './screens/TitleScreen';
import { useGame } from './store/useGame';

function deckSections(run: RunState): DeckSection[] {
  const battle = run.battle;
  if (run.screen === 'battle' && battle) {
    return [
      {
        label: '山札',
        cards: [...battle.drawPile].reverse(),
        emptyText: '山札は空。捨て札が再シャッフルされる。',
      },
      { label: '手札', cards: battle.hand },
      { label: '捨て札', cards: battle.discardPile },
      { label: '除外', cards: battle.exhaustPile },
    ];
  }
  return [
    {
      label: 'デッキ',
      cards: run.deck,
      emptyText: 'デッキは空だ。',
    },
  ];
}

export function App() {
  const { run } = useGame();
  const [helpOpen, setHelpOpen] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);

  const openHelp = useCallback(() => setHelpOpen(true), []);
  const openDeck = useCallback(() => setDeckOpen(true), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (event.key === 'Escape') {
        setHelpOpen(false);
        setDeckOpen(false);
        return;
      }
      if (event.key.toLowerCase() === 'h') {
        setHelpOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const modalOpen = helpOpen || deckOpen;

  return (
    <div className="app">
      <EmberBackground />
      <div className="app__grain" aria-hidden />
      <div className="app__content">
        {!run ? <TitleScreen onHelp={openHelp} /> : null}
        {run?.screen === 'map' ? (
          <MapScreen onHelp={openHelp} onDeck={openDeck} />
        ) : null}
        {run?.screen === 'battle' && run.battle ? (
          <BattleScreen
            onHelp={openHelp}
            onDeck={openDeck}
            modalOpen={modalOpen}
          />
        ) : null}
        {run?.screen === 'reward' ? <RewardScreen /> : null}
        {run?.screen === 'victory' || run?.screen === 'defeat' ? <EndScreen /> : null}
      </div>

      {helpOpen ? <HelpModal onClose={() => setHelpOpen(false)} /> : null}
      {deckOpen && run ? (
        <DeckModal
          title={run.screen === 'battle' ? '戦場のカード' : '所持カード'}
          subtitle={`デッキ ${run.deck.length} 枚`}
          sections={deckSections(run)}
          onClose={() => setDeckOpen(false)}
        />
      ) : null}
    </div>
  );
}
