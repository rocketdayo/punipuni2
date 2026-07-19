import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Sparkles, BookOpen, CalendarDays } from 'lucide-react';
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

  const progressPct  = Math.round((clearedCount / totalStages) * 100);

  return (
    <div className="view-container" style={{ gap: '20px', padding: '30px 20px' }}>

      {/* ── Progress Card ── */}
      <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.95)' }}>
        <h3 className="text-outline" style={{ margin: '0 0 15px', fontSize: '1.2rem', color: '#ff7700', letterSpacing: '0.05em' }}>
          冒険の記録
        </h3>

        {/* Stage progress */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '1rem', fontWeight: 'bold', color: '#004488' }}>
            <span>⚔️ ステージクリア</span>
            <span style={{ color: '#ff3366' }}>{clearedCount} / {totalStages}</span>
          </div>
          <div style={{ height: '14px', background: '#bbddff', borderRadius: '10px', overflow: 'hidden', border: '2px solid #0088cc' }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #ffaa00, #ff3366)',
              borderRadius: '8px',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* Character count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', fontWeight: 'bold', color: '#004488' }}>
          <span>👾 ぷにコレクション</span>
          <span style={{ color: '#ff9900' }}>{ownedCount} / {totalCount} 体</span>
        </div>
      </div>

      {/* ── Main play button ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button
          className="btn btn-primary"
          style={{ 
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            flexDirection: 'column', 
            gap: '12px', 
            borderWidth: '8px',
            boxShadow: '0 12px 0 var(--btn-orange-border), 0 15px 10px rgba(0,0,0,0.4)',
            marginBottom: '10px'
          }}
          onClick={() => navigate('/stages')}
        >
          <Play size={60} fill="white" style={{ filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.3))', marginLeft: '10px' }} />
          <span className="text-outline" style={{ fontWeight: '900', fontSize: '2rem', marginTop: '-10px' }}>プレイ！</span>
          {clearedCount > 0 && (
            <span style={{ fontSize: '0.9rem', color: '#fff', background: 'rgba(0,0,0,0.4)', padding: '4px 10px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.5)' }}>
              ステージ {clearedCount} までクリア
            </span>
          )}
        </button>
      </div>

      {/* ── Secondary buttons ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <button
          className="btn btn-secondary"
          style={{ padding: '15px 5px', flexDirection: 'column', gap: '8px' }}
          onClick={() => navigate('/team')}
        >
          <Users size={28} />
          <span className="text-outline" style={{ fontSize: '0.9rem' }}>妖怪ぷに</span>
        </button>
        
        <button
          className="btn btn-primary"
          style={{ padding: '15px 5px', flexDirection: 'column', gap: '8px' }}
          onClick={() => navigate('/gacha')}
        >
          <Sparkles size={28} />
          <span className="text-outline" style={{ fontSize: '0.9rem' }}>妖怪ガシャ</span>
        </button>
        
        <button
          className="btn btn-green"
          style={{ padding: '15px 5px', flexDirection: 'column', gap: '8px' }}
          onClick={() => navigate('/collection')}
        >
          <BookOpen size={28} />
          <span className="text-outline" style={{ fontSize: '0.9rem' }}>大辞典</span>
        </button>

        <button
          className="btn btn-y-point"
          style={{ padding: '15px 5px', flexDirection: 'column', gap: '8px', position: 'relative' }}
          onClick={() => navigate('/event')}
        >
          <div style={{ position: 'absolute', top: -5, right: -5, background: '#ff2255', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900, border: '2px solid white' }}>NEW</div>
          <CalendarDays size={28} />
          <span className="text-outline" style={{ fontSize: '0.9rem' }}>イベント</span>
        </button>
      </div>

    </div>
  );
};

export default Home;
