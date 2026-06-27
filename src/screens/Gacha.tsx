import React, { useState } from 'react';
import { useGame } from '../store/GameContext';
import { CHARACTERS } from '../data/characters';
import type { Character, Rank } from '../data/characters';
import { Sparkles, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GACHA_COST_1 = 50;
const GACHA_COST_10 = 500;

const rankWeights: Record<Rank, number> = {
  'S': 2,
  'A': 8,
  'B': 20,
  'C': 30,
  'D': 25,
  'E': 15
};

const Gacha = () => {
  const { yPoints, addYPoints, unlockCharacter } = useGame();
  const navigate = useNavigate();
  const [results, setResults] = useState<Character[] | null>(null);
  const [isPulling, setIsPulling] = useState(false);

  const pullGacha = (times: number) => {
    const cost = times === 10 ? GACHA_COST_10 : GACHA_COST_1;
    if (yPoints < cost || isPulling) return;
    
    setIsPulling(true);
    addYPoints(-cost);
    
    setTimeout(() => {
      const pulledChars: Character[] = [];
      
      for (let i = 0; i < times; i++) {
        let totalWeight = 0;
        for (const w of Object.values(rankWeights)) totalWeight += w;
        let rand = Math.random() * totalWeight;
        let pulledRank: Rank = 'E';
        for (const [r, w] of Object.entries(rankWeights)) {
          if (rand < w) {
            pulledRank = r as Rank;
            break;
          }
          rand -= w;
        }
        
        const rankChars = CHARACTERS.filter(c => c.rank === pulledRank);
        const pulledChar = rankChars[Math.floor(Math.random() * rankChars.length)];
        pulledChars.push(pulledChar);
        unlockCharacter(pulledChar.id);
      }
      
      setResults(pulledChars);
      setIsPulling(false);
    }, 1500); // Fake animation delay
  };

  return (
    <div className="view-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/home')}><ArrowLeft size={20} /></button>
        <h2>妖怪ガシャ</h2>
        <div style={{ width: 40 }}></div>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflowY: 'auto', padding: '20px' }}>
        {isPulling ? (
          <div className="animate-pulse" style={{ fontSize: '5rem' }}>✨</div>
        ) : results ? (
          <div style={{ textAlign: 'center', width: '100%', animation: 'float 2s ease-in-out infinite' }}>
            <h2 style={{ marginBottom: '20px' }}>ガシャ結果！</h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: results.length > 1 ? 'repeat(5, 1fr)' : '1fr', 
              gap: '10px', 
              justifyContent: 'center',
              marginBottom: '30px'
            }}>
              {results.map((result, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px',
                  border: `2px solid var(--rank-${result.rank.toLowerCase()})`
                }}>
                  <div className="char-icon" style={{ 
                    backgroundColor: result.color, 
                    width: results.length > 1 ? '50px' : '120px', 
                    height: results.length > 1 ? '50px' : '120px', 
                    fontSize: results.length > 1 ? '1.5rem' : '4rem',
                    marginBottom: '10px' 
                  }}>
                    {result.emoji}
                  </div>
                  <span className="rank-badge" style={{ backgroundColor: `var(--rank-${result.rank.toLowerCase()})`, marginBottom: '5px' }}>{result.rank}</span>
                  {results.length === 1 && <h3>{result.name}</h3>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setResults(null)}>戻る</button>
              <button 
                className={`btn ${yPoints >= (results.length === 10 ? GACHA_COST_10 : GACHA_COST_1) ? 'btn-y-point' : 'btn-secondary'}`}
                onClick={() => pullGacha(results.length)}
                disabled={yPoints < (results.length === 10 ? GACHA_COST_10 : GACHA_COST_1)}
              >
                <RefreshCw size={20} style={{ marginRight: '8px' }} />
                もう一度 ({results.length === 10 ? 10 : 1}連)
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '4rem', marginBottom: '30px', animation: 'float 3s infinite' }}>🔮</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <button 
                className={`btn ${yPoints >= GACHA_COST_1 ? 'btn-y-point' : 'btn-secondary'}`} 
                onClick={() => pullGacha(1)}
                disabled={yPoints < GACHA_COST_1}
                style={{ width: '80%', maxWidth: '300px' }}
              >
                <Sparkles size={20} style={{ marginRight: '8px' }} />
                単発 ({GACHA_COST_1} Ypt)
              </button>
              
              <button 
                className={`btn ${yPoints >= GACHA_COST_10 ? 'btn-y-point' : 'btn-secondary'}`} 
                onClick={() => pullGacha(10)}
                disabled={yPoints < GACHA_COST_10}
                style={{ width: '80%', maxWidth: '300px', background: yPoints >= GACHA_COST_10 ? 'linear-gradient(135deg, #ff0055, #ffb703)' : '' }}
              >
                <Sparkles size={20} style={{ marginRight: '8px' }} />
                10連 ({GACHA_COST_10} Ypt)
              </button>
            </div>
            
            {yPoints < GACHA_COST_1 && <p style={{ color: '#ff5555', marginTop: '20px' }}>Yポイントが足りません！</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gacha;
