import React, { useState } from 'react';
import { useGame } from '../store/GameContext';
import { CHARACTERS } from '../data/characters';
import type { Character, Rank } from '../data/characters';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GACHA_COST_1 = 50;
const GACHA_COST_10 = 500;
const GACHA_COST_100 = 5000;
const GACHA_COST_500 = 25000;

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
    let cost = GACHA_COST_1;
    if (times === 10) cost = GACHA_COST_10;
    if (times === 100) cost = GACHA_COST_100;
    if (times === 500) cost = GACHA_COST_500;

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
      
      // If 100 or 500, we don't animate all of them heavily, but just show them in a grid.
      // But 500 characters is a lot of DOM elements! We might just show top rarities if it's too much,
      // but for now let's just render them small.
      setResults(pulledChars);
      setIsPulling(false);
    }, 1500);
  };

  const GachaButton = ({ times, cost, color }: { times: number, cost: number, color?: string }) => (
    <button 
      className={`btn ${color || 'btn-primary'}`}
      onClick={() => pullGacha(times)}
      disabled={yPoints < cost}
      style={{ 
        width: '100%', 
        padding: '15px',
        flexDirection: 'column',
        gap: '4px',
        borderRadius: '30px'
      }}
    >
      <span className="text-outline" style={{ fontSize: '1.4rem' }}>{times === 1 ? '単発' : `${times}連`}でまわす！</span>
      <span style={{ 
        background: 'rgba(0,0,0,0.5)', 
        padding: '2px 10px', 
        borderRadius: '20px', 
        fontSize: '0.9rem',
        border: '1px solid rgba(255,255,255,0.5)'
      }}>
        {cost} Ypt
      </span>
    </button>
  );

  return (
    <div className="view-container">
      {/* Absolute back button matching reference */}
      <button 
        className="btn btn-secondary" 
        onClick={() => navigate('/home')}
        style={{ position: 'absolute', bottom: '20px', left: '20px', padding: '10px 20px', zIndex: 10 }}
      >
        <ArrowLeft size={18} style={{ marginRight: '5px' }} />
        もどる
      </button>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflowY: 'auto' }}>
        {isPulling ? (
          <div className="animate-pulse" style={{ fontSize: '8rem', textShadow: '0 0 40px rgba(255,255,255,0.8)' }}>✨</div>
        ) : results ? (
          <div style={{ textAlign: 'center', width: '100%', padding: '20px 0 80px', animation: 'float 2s ease-in-out infinite' }}>
            <h2 className="text-outline" style={{ marginBottom: '20px', fontSize: '2rem' }}>ガシャ結果！</h2>
            
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: results.length > 10 ? '4px' : '10px', 
              justifyContent: 'center',
              marginBottom: '30px',
              padding: '0 10px'
            }}>
              {results.map((result, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  background: 'rgba(255,255,255,0.8)', 
                  padding: results.length > 50 ? '2px' : '6px', 
                  borderRadius: '12px',
                  border: `3px solid var(--rank-${result.rank.toLowerCase()})`,
                  width: results.length > 50 ? '40px' : results.length > 10 ? '60px' : results.length > 1 ? '80px' : '140px'
                }}>
                  <div className="char-icon" style={{ 
                    backgroundColor: result.color, 
                    width: '100%', 
                    aspectRatio: '1/1',
                    fontSize: results.length > 50 ? '1rem' : results.length > 10 ? '1.5rem' : results.length > 1 ? '2rem' : '4rem',
                    marginBottom: '4px' 
                  }}>
                    {result.imageUrl ? <img src={result.imageUrl} alt={result.name} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} /> : result.emoji}
                  </div>
                  {results.length <= 10 && (
                    <span className="rank-badge" style={{ backgroundColor: `var(--rank-${result.rank.toLowerCase()})`, marginBottom: '5px', fontSize: '0.8rem' }}>
                      {result.rank}
                    </span>
                  )}
                  {results.length === 1 && <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>{result.name}</h3>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" style={{ padding: '15px 30px' }} onClick={() => setResults(null)}>
                OK
              </button>
              <button 
                className="btn btn-primary"
                style={{ padding: '15px 30px' }}
                onClick={() => pullGacha(results.length)}
                disabled={yPoints < (results.length === 100 ? GACHA_COST_100 : results.length === 500 ? GACHA_COST_500 : results.length === 10 ? GACHA_COST_10 : GACHA_COST_1)}
              >
                <RefreshCw size={20} style={{ marginRight: '8px' }} />
                もう一度 ({results.length}連)
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Gacha Machine Placeholder */}
            <div style={{ 
              width: '180px', height: '220px', 
              background: 'linear-gradient(180deg, #336633 0%, #113311 100%)', 
              borderRadius: '20px 20px 10px 10px',
              border: '6px solid #112211',
              boxShadow: '0 15px 0 rgba(0,0,0,0.2)',
              marginBottom: '40px',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 20, left: 20, right: 20, height: 100, background: 'rgba(255,255,255,0.2)', borderRadius: 10, border: '4px solid #112211' }}>
                <div style={{ fontSize: '3rem', marginTop: 10 }}>🔮</div>
              </div>
              <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', width: 40, height: 40, background: '#112211', borderRadius: '50%' }}></div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '90%', maxWidth: '400px' }}>
              <GachaButton times={1} cost={GACHA_COST_1} color="btn-primary" />
              <GachaButton times={10} cost={GACHA_COST_10} color="btn-primary" />
              <GachaButton times={100} cost={GACHA_COST_100} color="btn-green" />
              <GachaButton times={500} cost={GACHA_COST_500} color="btn-secondary" />
            </div>
            
            {yPoints < GACHA_COST_1 && (
              <p className="text-outline" style={{ color: '#ff2255', marginTop: '20px', fontSize: '1.2rem' }}>Yポイントが足りません！</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gacha;
