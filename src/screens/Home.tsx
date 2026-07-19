import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Sparkles, BookOpen, CalendarDays, Bell, Gift, X } from 'lucide-react';
import { useGame } from '../store/GameContext';
import { CHARACTERS } from '../data/characters';
import { STAGES } from '../data/stages';

const NEWS_ITEMS = [
  "🎉【新機能】ワールドマップ追加！ウラステージも探してみてね！",
  "🌟 ガシャで新SSキャラが確率アップ中！",
  "🎁 毎日ログインして豪華ボーナスをもらおう！",
];

const Home = () => {
  const navigate = useNavigate();
  const { characters, clearedStages } = useGame();

  const ownedCount   = Object.keys(characters).length;
  const totalCount   = CHARACTERS.length;
  const clearedCount = (clearedStages || []).length;
  const totalStages  = STAGES.filter(s => !s.isHidden).length;

  const progressPct  = Math.round((clearedCount / totalStages) * 100);

  const [newsIndex, setNewsIndex] = React.useState(0);
  const [showDaily, setShowDaily] = React.useState(false);
  const { addYPoints, addMoney } = useGame();

  React.useEffect(() => {
    const timer = setInterval(() => {
      setNewsIndex(p => (p + 1) % NEWS_ITEMS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const today = new Date().toLocaleDateString();
    const lastLogin = localStorage.getItem('lastLoginDate');
    if (lastLogin !== today) {
      setShowDaily(true);
      localStorage.setItem('lastLoginDate', today);
    }
  }, []);

  const claimDaily = () => {
    addYPoints(50);
    addMoney(100);
    setShowDaily(false);
  };

  return (
    <div className="view-container" style={{ gap: '15px', padding: '20px 20px', position: 'relative' }}>
      
      {/* ── News Banner ── */}
      <div style={{ background: 'rgba(0, 0, 0, 0.4)', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
        <Bell size={18} color="#ffcc00" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: '0.85rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {NEWS_ITEMS[newsIndex]}
        </div>
      </div>

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

      {/* ── Daily Login Modal ── */}
      {showDaily && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '80%', padding: '20px', textAlign: 'center', position: 'relative', animation: 'popIn 0.5s ease-out' }}>
            <button onClick={() => setShowDaily(false)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <Gift size={60} color="#ff2255" style={{ margin: '0 auto 10px', filter: 'drop-shadow(0 0 10px rgba(255,34,85,0.8))' }} />
            <h2 style={{ color: '#ffcc00', margin: '0 0 10px', fontSize: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>ログインボーナス！</h2>
            <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>今日も遊んでくれてありがとう！<br/>プレゼントを受け取ってね！</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,165,0,0.2)', padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>🔶</div>
                <div style={{ color: '#ffaa00', fontWeight: 'bold' }}>50 Ypt</div>
              </div>
              <div style={{ background: 'rgba(100,200,100,0.2)', padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>💰</div>
                <div style={{ color: '#88dd88', fontWeight: 'bold' }}>100 コイン</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={claimDaily} style={{ width: '100%', padding: '12px' }}>
              受け取る
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;
