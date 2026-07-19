import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { STAGES } from '../data/stages';
import { ArrowLeft, Map as MapIcon, Lock, Check } from 'lucide-react';
import { useGame } from '../store/GameContext';

const StageSelect = () => {
  const navigate = useNavigate();
  const { team, clearedStages } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const normalStages = STAGES.filter(s => !s.isHidden);
  
  const isUnlocked = (stageId: string, index: number, isHidden: boolean = false) => {
    if (isHidden) {
      // Hidden stage unlocked if the parent normal stage is cleared
      const parentNormal = normalStages[index]; // index is the index of the normal stage it branches from
      return clearedStages.includes(parentNormal.id);
    }
    // Normal stage unlocked if it's the first, or the previous normal stage is cleared
    if (index === 0) return true;
    const prevNormal = normalStages[index - 1];
    return clearedStages.includes(prevNormal.id);
  };

  useEffect(() => {
    if (containerRef.current) {
      // Find highest unlocked normal stage to center
      let highestIndex = 0;
      for (let i = 0; i < normalStages.length; i++) {
        if (isUnlocked(normalStages[i].id, i)) {
          highestIndex = i;
        } else {
          break;
        }
      }
      const scrollPos = highestIndex * 160 - window.innerWidth / 2 + 80;
      setTimeout(() => {
        containerRef.current?.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
      }, 100);
    }
  }, [clearedStages]);

  const STAGE_WIDTH = 160;

  return (
    <div className="view-container" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/home')} style={{ padding: '8px 12px' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          <MapIcon /> ワールドマップ
        </h2>
        <div style={{ width: 40 }}></div>
      </div>

      {team.length === 0 && (
        <div style={{ position: 'absolute', top: 70, left: 20, right: 20, padding: '10px', backgroundColor: 'rgba(255,0,0,0.8)', borderRadius: '8px', color: 'white', textAlign: 'center', zIndex: 10, fontWeight: 'bold' }}>
          チームが編成されていません！
        </div>
      )}

      {/* Scrollable Map Area */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          overflowX: 'auto', 
          overflowY: 'hidden', 
          backgroundColor: '#2a4b7c', // Ocean/Sky map background
          backgroundImage: 'radial-gradient(circle at 50% 50%, #3a5b8c 0%, #1a2b4c 100%)',
          position: 'relative'
        }}
      >
        <div style={{ 
          position: 'relative', 
          width: `${normalStages.length * STAGE_WIDTH + 100}px`, 
          height: '100%',
          minHeight: '100%'
        }}>
          {/* Draw connecting lines SVG */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
            {normalStages.map((stage, i) => {
              if (i === normalStages.length - 1) return null;
              
              const x1 = i * STAGE_WIDTH + STAGE_WIDTH / 2 + 50;
              const y1 = 50 + Math.sin(i) * 20 + 20; // 50% height approx
              const x2 = (i + 1) * STAGE_WIDTH + STAGE_WIDTH / 2 + 50;
              const y2 = 50 + Math.sin(i + 1) * 20 + 20;
              
              const isLineActive = clearedStages.includes(stage.id);

              return (
                <g key={`line-${i}`}>
                  <line 
                    x1={`${x1}px`} y1={`${y1}%`} 
                    x2={`${x2}px`} y2={`${y2}%`} 
                    stroke={isLineActive ? '#ffcc00' : 'rgba(255,255,255,0.2)'} 
                    strokeWidth="6" 
                    strokeDasharray={isLineActive ? "0" : "10,10"}
                    strokeLinecap="round"
                  />
                  {/* Branch to hidden stage */}
                  {((i + 1) % 10 === 0) && (
                    <line 
                      x1={`${x1}px`} y1={`${y1}%`} 
                      x2={`${x1}px`} y2={`${y1 > 50 ? 20 : 80}%`} 
                      stroke={clearedStages.includes(stage.id) ? '#ff22ff' : 'rgba(255,0,255,0.2)'} 
                      strokeWidth="6" 
                      strokeDasharray={clearedStages.includes(stage.id) ? "0" : "10,10"}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Draw nodes */}
          {normalStages.map((stage, i) => {
            const x = i * STAGE_WIDTH + 50;
            const y = 50 + Math.sin(i) * 20; // fluctuate y position between 30% and 70%
            
            const unlocked = isUnlocked(stage.id, i);
            const cleared = clearedStages.includes(stage.id);
            
            const hiddenStageId = `stage_hidden_${(i + 1) / 10}`;
            const hiddenStage = ((i + 1) % 10 === 0) ? STAGES.find(s => s.id === hiddenStageId) : null;

            return (
              <React.Fragment key={stage.id}>
                {/* Normal Node */}
                <div 
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `calc(${y}% - 35px)`, // center the node
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    opacity: unlocked ? 1 : 0.5,
                    filter: unlocked ? 'none' : 'grayscale(100%)',
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                    transform: unlocked ? 'scale(1)' : 'scale(0.9)',
                    transition: 'all 0.3s'
                  }}
                  onClick={() => {
                    if (unlocked && team.length > 0) navigate(`/stage/${stage.id}`);
                  }}
                >
                  <div style={{
                    width: '70px', height: '70px', borderRadius: '50%',
                    background: cleared ? 'linear-gradient(135deg, #ffcc00, #ff8800)' : unlocked ? 'linear-gradient(135deg, #4488ff, #2255cc)' : '#555',
                    border: `4px solid ${cleared ? '#fff' : unlocked ? '#aaddff' : '#333'}`,
                    boxShadow: unlocked ? '0 5px 15px rgba(0,0,0,0.5)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', position: 'relative'
                  }}>
                    {unlocked ? stage.enemyEmoji : <Lock size={28} color="#aaa" />}
                    {cleared && (
                      <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#22cc22', borderRadius: '50%', padding: '2px', border: '2px solid white' }}>
                        <Check size={16} color="white" />
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    marginTop: '8px', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', 
                    borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.2)',
                    whiteSpace: 'nowrap'
                  }}>
                    {stage.name}
                  </div>
                </div>

                {/* Hidden Node */}
                {hiddenStage && (
                  <div 
                    style={{
                      position: 'absolute',
                      left: `${x}px`,
                      top: `calc(${y > 50 ? 20 : 80}% - 35px)`,
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      opacity: cleared ? 1 : 0, // completely hide if normal stage not cleared
                      pointerEvents: cleared ? 'auto' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.5s'
                    }}
                    onClick={() => {
                      if (cleared && team.length > 0) navigate(`/stage/${hiddenStage.id}`);
                    }}
                  >
                    <div style={{
                      width: '70px', height: '70px', borderRadius: '30%', // different shape for hidden
                      background: clearedStages.includes(hiddenStage.id) ? 'linear-gradient(135deg, #ff22ff, #880088)' : 'linear-gradient(135deg, #ff5555, #aa0000)',
                      border: `4px solid #fff`,
                      boxShadow: '0 0 20px rgba(255,0,255,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2.2rem', position: 'relative', transform: 'rotate(45deg)' // diamond shape
                    }}>
                      <div style={{ transform: 'rotate(-45deg)' }}>{hiddenStage.enemyEmoji}</div>
                      {clearedStages.includes(hiddenStage.id) && (
                        <div style={{ position: 'absolute', bottom: -10, right: 20, background: '#22cc22', borderRadius: '50%', padding: '2px', border: '2px solid white', transform: 'rotate(-45deg)' }}>
                          <Check size={16} color="white" />
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      marginTop: '15px', background: 'rgba(255,0,100,0.6)', padding: '4px 10px', 
                      borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #ffaaee',
                      whiteSpace: 'nowrap', color: '#ffccff'
                    }}>
                      {hiddenStage.name}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StageSelect;
