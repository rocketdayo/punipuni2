import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { STAGES } from '../data/stages';
import { ArrowLeft, Swords, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGame } from '../store/GameContext';

const STAGES_PER_PAGE = 5;

const StageSelect = () => {
  const navigate = useNavigate();
  const { team } = useGame();
  
  // Calculate max cleared stage index to auto-scroll or start at the right page
  // For simplicity, just start at page 0 and let user navigate
  const [currentPage, setCurrentPage] = useState(0);
  
  const totalPages = Math.ceil(STAGES.length / STAGES_PER_PAGE);
  const currentStages = STAGES.slice(currentPage * STAGES_PER_PAGE, (currentPage + 1) * STAGES_PER_PAGE);

  return (
    <div className="view-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/home')}><ArrowLeft size={20} /></button>
        <h2>ステージ選択</h2>
        <div style={{ width: 40 }}></div>
      </div>

      {team.length === 0 && (
        <div style={{ padding: '10px', backgroundColor: 'rgba(255,0,0,0.2)', borderRadius: '8px', color: '#ffaaaa', textAlign: 'center' }}>
          チームが編成されていません！
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>
          <ChevronLeft size={20} />
        </button>
        <span>Page {currentPage + 1} / {totalPages}</span>
        <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {currentStages.map(stage => (
          <div key={stage.id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ fontSize: '3rem' }}>{stage.enemyEmoji}</div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{stage.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{stage.enemyName} (HP: {stage.enemyHp} / ATK: {stage.enemyAtk})</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--money-color)' }}>報酬: {stage.rewardMoney} コイン</span>
                  <span style={{ color: 'var(--y-point-color)' }}>{stage.rewardYPoints} Yポイント</span>
                </div>
              </div>
            </div>
            <button 
              className="btn btn-primary" 
              disabled={team.length === 0}
              onClick={() => navigate(`/stage/${stage.id}`)}
              style={{ borderRadius: '50%', width: '50px', height: '50px', padding: '0' }}
            >
              <Swords size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StageSelect;
