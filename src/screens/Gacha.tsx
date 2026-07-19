import React, { useState, useRef } from 'react';
import { useGame } from '../store/GameContext';
import { CHARACTERS } from '../data/characters';
import type { Character, Rank } from '../data/characters';
import { ArrowLeft, RefreshCw, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GACHA_COST_1 = 50;
const GACHA_COST_10 = 500;
const GACHA_COST_100 = 5000;
const GACHA_COST_500 = 25000;

const RANK_ORDER: Record<Rank, number> = { SS: 0, S: 1, A: 2, B: 3, C: 4, D: 5, E: 6 };
const RANK_COLORS: Record<Rank, string> = {
  SS: '#ff22ff', S: '#ff2222', A: '#ffaa00', B: '#ff88bb', C: '#cc6666', D: '#55bb55', E: '#88cc88'
};

// 恒常ガシャ (Permanent)
const normalRankWeights: Record<Rank, number> = {
  'SS': 0, 'S': 2, 'A': 8, 'B': 20, 'C': 30, 'D': 25, 'E': 15
};

// イベントガシャ (Event)
const eventRankWeights: Record<Rank, number> = {
  'SS': 1, 'S': 5, 'A': 10, 'B': 20, 'C': 24, 'D': 25, 'E': 15
};

type GachaType = 'normal' | 'event';

const Gacha = () => {
  const { yPoints, addYPoints, unlockCharacter, trackMission } = useGame();
  const navigate = useNavigate();
  const [results, setResults] = useState<Character[] | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [currentGacha, setCurrentGacha] = useState<GachaType>('normal');
  const [showRates, setShowRates] = useState(false);
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  const pullGacha = (times: number) => {
    let cost = GACHA_COST_1;
    if (times === 10) cost = GACHA_COST_10;
    if (times === 100) cost = GACHA_COST_100;
    if (times === 500) cost = GACHA_COST_500;

    if (yPoints < cost || isPulling) return;
    
    setIsPulling(true);
    addYPoints(-cost);
    trackMission('gacha_pull', times);
    
    setTimeout(() => {
      const pulledChars: Character[] = [];
      const weights = currentGacha === 'event' ? eventRankWeights : normalRankWeights;
      
      for (let i = 0; i < times; i++) {
        let totalWeight = 0;
        for (const w of Object.values(weights)) totalWeight += w;
        let rand = Math.random() * totalWeight;
        let pulledRank: Rank = 'E';
        for (const [r, w] of Object.entries(weights)) {
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
      
      pulledChars.sort((a, b) => RANK_ORDER[a.rank] - RANK_ORDER[b.rank]);
      setResults(pulledChars);
      setIsPulling(false);
    }, 2000); // 2 second animation
  };

  const handleScroll = () => {
    if (swipeContainerRef.current) {
      const scrollLeft = swipeContainerRef.current.scrollLeft;
      const width = swipeContainerRef.current.clientWidth;
      if (scrollLeft > width / 2) {
        setCurrentGacha('event');
      } else {
        setCurrentGacha('normal');
      }
    }
  };

  const scrollToEvent = () => {
    if (swipeContainerRef.current) {
      swipeContainerRef.current.scrollTo({ left: swipeContainerRef.current.clientWidth, behavior: 'smooth' });
    }
  };

  const scrollToNormal = () => {
    if (swipeContainerRef.current) {
      swipeContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const GachaButton = ({ times, cost, color }: { times: number, cost: number, color?: string }) => (
    <button 
      className={`btn ${color || 'btn-primary'}`}
      onClick={() => pullGacha(times)}
      disabled={yPoints < cost}
      style={{ 
        width: '100%', padding: '12px', flexDirection: 'column', gap: '2px', borderRadius: '30px', boxShadow: '0 6px 0 rgba(0,0,0,0.2)'
      }}
    >
      <span className="text-outline" style={{ fontSize: '1.2rem', lineHeight: 1.2 }}>{times === 1 ? '単発' : `${times}連`}でまわす！</span>
      <span style={{ 
        background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px'
      }}>
        <div className="currency-icon y-point-icon" style={{width: 14, height: 14, fontSize: '0.6rem'}}>y</div>
        {cost} Ypt
      </span>
    </button>
  );

  const RatesModal = () => (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
        <h3 className="text-outline" style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '20px' }}>
          {currentGacha === 'event' ? 'イベントガシャ' : '恒常ガシャ'} 提供割合
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.entries(currentGacha === 'event' ? eventRankWeights : normalRankWeights)
            .filter(([_, weight]) => weight > 0)
            .map(([rank, weight]) => (
            <div key={rank} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.5)', borderRadius: '10px' }}>
              <span className="rank-badge" style={{ background: RANK_COLORS[rank as Rank] }}>{rank}</span>
              <span style={{ fontWeight: 900, fontSize: '1.2rem' }}>{weight}%</span>
            </div>
          ))}
        </div>
        <button className="btn btn-secondary" style={{ width: '100%', marginTop: '20px', padding: '15px' }} onClick={() => setShowRates(false)}>
          とじる
        </button>
      </div>
    </div>
  );

  return (
    <div className="view-container" style={{ background: 'url(https://img.game8.jp/323860/a62ab2ed8e11a6f87ea4952093557e03.png/show) center/cover no-repeat', paddingBottom: 0 }}>
      {showRates && <RatesModal />}

      {/* Absolute Header matching reference */}
      <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/home')}
          style={{ padding: '8px 15px', borderRadius: '20px' }}
        >
          <ArrowLeft size={18} style={{ marginRight: '5px' }} />
          もどる
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={() => setShowRates(true)}
          style={{ padding: '8px 15px', borderRadius: '20px', background: 'linear-gradient(180deg, #aa66ff 0%, #6600cc 100%)', color: 'white' }}
        >
          <Info size={18} style={{ marginRight: '5px' }} />
          ガシャなかみ
        </button>
      </div>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {isPulling ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-shake" style={{
              width: '240px', height: '300px', background: 'linear-gradient(180deg, #557755 0%, #224422 100%)', borderRadius: '20px 20px 10px 10px', border: '8px solid #112211', boxShadow: '0 20px 0 rgba(0,0,0,0.4)', position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 30, left: 20, right: 20, height: 120, background: 'rgba(255,255,255,0.2)', borderRadius: 10, border: '4px solid #112211', overflow: 'hidden' }}>
                {/* Spinning capsules */}
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse" style={{
                    position: 'absolute', width: 40, height: 40, borderRadius: '50%', background: i % 2 === 0 ? '#333' : '#aa0000', border: '2px solid #000', top: Math.random() * 80, left: Math.random() * 120, animationDuration: `${0.2 + Math.random() * 0.3}s`
                  }}>
                    <div style={{ width: '100%', height: '50%', background: 'rgba(255,255,255,0.2)', borderRadius: '20px 20px 0 0' }}></div>
                  </div>
                ))}
              </div>
              <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', width: 60, height: 60, background: '#112211', borderRadius: '50%', border: '4px solid #333' }}></div>
            </div>
          </div>
        ) : results ? (
          <div style={{ flex: 1, overflowY: 'auto', textAlign: 'center', width: '100%', padding: '80px 0 40px', animation: 'float 2s ease-in-out infinite' }}>
            <h2 className="text-outline" style={{ marginBottom: '20px', fontSize: '2rem' }}>ガシャ結果！</h2>
            
            <div style={{ 
              display: 'flex', flexWrap: 'wrap', gap: results.length > 10 ? '4px' : '10px', justifyContent: 'center', marginBottom: '30px', padding: '0 10px'
            }}>
              {results.map((result, idx) => {
                const iconSize = results.length > 50 ? 40 : results.length > 10 ? 60 : results.length > 1 ? 80 : 140;
                const fontSize = results.length > 50 ? '1rem' : results.length > 10 ? '1.5rem' : results.length > 1 ? '2rem' : '4rem';
                return (
                  <div key={idx} style={{ 
                    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.9)', padding: results.length > 50 ? '3px' : '8px', borderRadius: '14px', border: `3px solid ${RANK_COLORS[result.rank]}`, width: `${iconSize + (results.length > 50 ? 6 : 16)}px`, boxShadow: result.rank === 'S' || result.rank === 'SS' ? `0 0 15px ${RANK_COLORS[result.rank]}` : 'none',
                  }}>
                    <div className="char-icon" style={{ backgroundColor: result.color, width: `${iconSize}px`, height: `${iconSize}px`, fontSize }}>
                      {result.imageUrl ? <img src={result.imageUrl} alt={result.name} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} /> : result.emoji}
                    </div>
                    <div style={{
                      position: 'absolute', top: '-4px', right: '-4px', background: RANK_COLORS[result.rank], color: 'white', fontWeight: 900, fontSize: results.length > 50 ? '0.5rem' : '0.7rem', padding: results.length > 50 ? '1px 3px' : '2px 5px', borderRadius: '8px', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', lineHeight: 1.2,
                    }}>
                      {result.rank}
                    </div>
                    {results.length === 1 && <p style={{ margin: '6px 0 0', fontSize: '1rem', fontWeight: 900, color: '#333' }}>{result.name}</p>}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" style={{ padding: '15px 30px' }} onClick={() => setResults(null)}>
                OK
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Swipable Banners */}
            <div style={{ position: 'relative', marginTop: '60px', flex: 1 }}>
              {currentGacha === 'event' && <div onClick={scrollToNormal} style={{position:'absolute', left: 10, top: '40%', zIndex: 5, animation: 'pulse 2s infinite', cursor: 'pointer'}}><ChevronLeft size={40} color="white" /></div>}
              {currentGacha === 'normal' && <div onClick={scrollToEvent} style={{position:'absolute', right: 10, top: '40%', zIndex: 5, animation: 'pulse 2s infinite', cursor: 'pointer'}}><ChevronRight size={40} color="white" /></div>}
              
              <div 
                ref={swipeContainerRef}
                className="gacha-swipe-container"
                onScroll={handleScroll}
                style={{ height: '100%', scrollBehavior: 'smooth' }}
              >
                {/* Normal Gacha Page */}
                <div className="gacha-swipe-item">
                  <div style={{ 
                    width: '200px', height: '240px', background: 'linear-gradient(180deg, #336633 0%, #113311 100%)', borderRadius: '20px 20px 10px 10px', border: '6px solid #112211', boxShadow: '0 15px 0 rgba(0,0,0,0.3)', position: 'relative', marginTop: '20px'
                  }}>
                    <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', background: '#331155', border: '3px solid #ffcc00', padding: '5px 20px', borderRadius: '20px', color: 'white', fontWeight: 900, whiteSpace: 'nowrap', boxShadow: '0 4px 0 rgba(0,0,0,0.5)' }}>
                      妖怪ガシャ
                    </div>
                    <div style={{ position: 'absolute', top: 30, left: 20, right: 20, height: 100, background: 'rgba(255,255,255,0.2)', borderRadius: 10, border: '4px solid #112211' }}>
                      <div style={{ fontSize: '3rem', marginTop: 10, textAlign: 'center' }}>🔮</div>
                    </div>
                    <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', width: 50, height: 50, background: '#112211', borderRadius: '50%', border: '4px solid #333' }}></div>
                  </div>
                </div>

                {/* Event Gacha Page */}
                <div className="gacha-swipe-item">
                  <div className="animate-float" style={{ 
                    width: '200px', height: '240px', background: 'linear-gradient(180deg, #ff3366 0%, #990033 100%)', borderRadius: '20px 20px 10px 10px', border: '6px solid #550011', boxShadow: '0 15px 0 rgba(0,0,0,0.3), 0 0 30px rgba(255,50,100,0.5)', position: 'relative', marginTop: '20px'
                  }}>
                    <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', background: '#ffcc00', border: '3px solid #ff3300', padding: '5px 20px', borderRadius: '20px', color: '#ff0000', fontWeight: 900, whiteSpace: 'nowrap', boxShadow: '0 4px 0 rgba(0,0,0,0.5)' }}>
                      イベントガシャ
                    </div>
                    <div style={{ position: 'absolute', top: 30, left: 20, right: 20, height: 100, background: 'rgba(255,255,255,0.2)', borderRadius: 10, border: '4px solid #550011' }}>
                      <div style={{ fontSize: '3rem', marginTop: 10, textAlign: 'center', filter: 'hue-rotate(180deg)' }}>🔮</div>
                    </div>
                    <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', width: 50, height: 50, background: '#550011', borderRadius: '50%', border: '4px solid #333' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: currentGacha === 'normal' ? 'white' : 'rgba(255,255,255,0.3)', border: '2px solid rgba(0,0,0,0.3)' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: currentGacha === 'event' ? 'white' : 'rgba(255,255,255,0.3)', border: '2px solid rgba(0,0,0,0.3)' }} />
            </div>
            
            {/* Buttons Area */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '30px 30px 0 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <GachaButton times={1} cost={GACHA_COST_1} color="btn-primary" />
                <GachaButton times={10} cost={GACHA_COST_10} color="btn-secondary" />
                <GachaButton times={100} cost={GACHA_COST_100} color="btn-green" />
                <GachaButton times={500} cost={GACHA_COST_500} color="btn-y-point" />
              </div>
              
              {yPoints < GACHA_COST_1 && (
                <p className="text-outline" style={{ color: '#ff2255', textAlign: 'center', margin: 0, fontSize: '1rem' }}>Yポイントが足りません！</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gacha;
