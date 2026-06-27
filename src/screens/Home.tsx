import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Sparkles, BookOpen } from 'lucide-react';
import { useGame } from '../store/GameContext';
import { CHARACTERS } from '../data/characters';
import { STAGES } from '../data/stages';

const Home = () => {
  const navigate = useNavigate();
  const { characters, clearedStages } = useGame();

  const ownedCount   = Object.keys(characters).length;
  const totalCount   = CHARACTERS.length;
  const clearedCount = (clearedStages || []).length;
  const totalStages  = STAGES.length;

  // Progress percentage for visual bar
  const progressPct  = Math.round((clearedCount / totalStages) * 100);

  return (
    <div className="view-container" style={{ gap: '16px', padding: '20px' }}>

      {/* ── Progress Card ── */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          冒険の記録
        </h3>

        {/* Stage progress */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
            <span>⚔️ ステージクリア</span>
            <span style={{ color: '#ffd700', fontWeight: 'bold' }}>{clearedCount} / {totalStages}</span>
          </div>
          <div style={{ height: '10px', background: '#222', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #6c63ff, #ff6584)',
              borderRadius: '6px',
              transition: 'width 0.6s ease',
              boxShadow: '0 0 8px rgba(108,99,255,0.6)',
            }} />
          </div>
        </div>

        {/* Character count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
          <span>👾 コレクション</span>
          <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{ownedCount} / {totalCount} 体</span>
        </div>
      </div>

      {/* ── Main play button ── */}
      <button
        className="btn btn-primary glass-panel"
        style={{ padding: '30px', flexDirection: 'column', gap: '12px', fontSize: '1.4rem', background: 'linear-gradient(135deg, rgba(108,99,255,0.5), rgba(255,101,132,0.4))', border: '2px solid rgba(108,99,255,0.6)', boxShadow: '0 0 30px rgba(108,99,255,0.3)' }}
        onClick={() => navigate('/stages')}
      >
        <Play size={44} style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }} />
        <span style={{ fontWeight: '900', letterSpacing: '0.05em' }}>ステージへ出発！</span>
        {clearedCount > 0 && (
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
            最新: ステージ {clearedCount} クリア済み
          </span>
        )}
      </button>

      {/* ── Secondary buttons ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <button
          className="btn btn-secondary glass-panel"
          style={{ padding: '22px', flexDirection: 'column', gap: '10px' }}
          onClick={() => navigate('/team')}
        >
          <Users size={32} />
          <span>編成・強化</span>
        </button>
        <button
          className="btn btn-y-point glass-panel"
          style={{ padding: '22px', flexDirection: 'column', gap: '10px' }}
          onClick={() => navigate('/gacha')}
        >
          <Sparkles size={32} />
          <span>ガシャ</span>
        </button>
      </div>

      {/* ── Collection shortcut ── */}
      <button
        className="btn btn-secondary glass-panel"
        style={{ padding: '16px', gap: '12px', justifyContent: 'center' }}
        onClick={() => navigate('/collection')}
      >
        <BookOpen size={24} />
        <span>図鑑・コレクション ({ownedCount}/{totalCount})</span>
      </button>
    </div>
  );
};

export default Home;
