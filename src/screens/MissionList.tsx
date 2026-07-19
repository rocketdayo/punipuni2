import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Gift } from 'lucide-react';
import { CURRENT_EVENTS } from '../data/events';
import { useGame } from '../store/GameContext';

const MissionList = () => {
  const navigate = useNavigate();
  const { missionProgress, completedMissions, claimMission } = useGame();
  const allMissions = CURRENT_EVENTS.flatMap(e => e.missions.map(m => ({ ...m, eventTitle: e.title, eventEmoji: e.emoji })));

  return (
    <div className="view-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/event')} style={{ padding: '8px 12px' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0 }}>📋 ミッション一覧</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {allMissions.map(mission => {
          const progress = missionProgress[mission.id] || 0;
          const isClaimed = completedMissions.includes(mission.id);
          const isComplete = progress >= mission.goal;
          const pct = Math.min(100, (progress / mission.goal) * 100);

          return (
            <div key={mission.id} className="glass-panel" style={{
              padding: '15px',
              opacity: isClaimed ? 0.6 : 1,
              border: isComplete && !isClaimed ? '2px solid #ffcc00' : '2px solid transparent',
              transition: 'all 0.3s',
            }}>
              {/* Mission Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#aaa', marginBottom: '2px' }}>{mission.eventEmoji} {mission.eventTitle}</div>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>{mission.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>{mission.description}</div>
                </div>
                {isClaimed ? (
                  <div style={{ background: '#55bb55', borderRadius: '20px', padding: '6px 12px', fontSize: '0.8rem', color: 'white', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <Check size={14} /> 受取済
                  </div>
                ) : isComplete ? (
                  <button
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.85rem', flexShrink: 0, animation: 'pulse 1.5s infinite' }}
                    onClick={() => claimMission(mission.id)}
                  >
                    <Gift size={14} style={{ marginRight: '4px' }} />
                    受け取る
                  </button>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#aaa', flexShrink: 0 }}>
                    {progress}/{mission.goal}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: isClaimed ? '#55bb55' : isComplete ? '#ffcc00' : 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease',
                }} />
              </div>

              {/* Rewards */}
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {mission.rewardYPoints && (
                  <div style={{ background: 'rgba(255,165,0,0.2)', borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem', color: '#ffaa00' }}>
                    🔶 {mission.rewardYPoints} Ypt
                  </div>
                )}
                {mission.rewardMoney && (
                  <div style={{ background: 'rgba(100,200,100,0.2)', borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem', color: '#88dd88' }}>
                    💰 {mission.rewardMoney}
                  </div>
                )}
                {mission.rewardItems?.expSmall && (
                  <div style={{ background: 'rgba(100,100,255,0.2)', borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem', color: '#aaaaff' }}>
                    🔮 経験値だま小×{mission.rewardItems.expSmall}
                  </div>
                )}
                {mission.rewardItems?.expLarge && (
                  <div style={{ background: 'rgba(150,100,255,0.2)', borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem', color: '#cc88ff' }}>
                    ✨ 経験値だま大×{mission.rewardItems.expLarge}
                  </div>
                )}
                {mission.rewardItems?.skillBook && (
                  <div style={{ background: 'rgba(255,200,0,0.2)', borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem', color: '#ffcc00' }}>
                    📖 秘伝書×{mission.rewardItems.skillBook}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MissionList;
