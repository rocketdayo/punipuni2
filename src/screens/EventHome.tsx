import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Zap } from 'lucide-react';
import { CURRENT_EVENTS } from '../data/events';
import { CHARACTERS } from '../data/characters';
import { useGame } from '../store/GameContext';

const EventHome = () => {
  const navigate = useNavigate();
  const { characters, missionProgress, completedMissions } = useGame();

  const eventBoostChars = CHARACTERS.filter(c => c.eventBoost);
  const ownedBoostChars = eventBoostChars.filter(c => characters[c.id]);

  return (
    <div className="view-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/home')} style={{ padding: '8px 12px' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0 }}>🎪 イベント</h2>
      </div>

      {CURRENT_EVENTS.map(event => {
        const allMissions = event.missions;
        const completedCount = allMissions.filter(m => completedMissions.includes(m.id)).length;

        return (
          <div key={event.id} style={{ marginBottom: '20px' }}>
            {/* Event Banner */}
            <div style={{
              background: `linear-gradient(135deg, ${event.color} 0%, ${event.colorEnd} 100%)`,
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '15px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Decorative bg text */}
              <div style={{ position: 'absolute', top: -10, right: -10, fontSize: '5rem', opacity: 0.15 }}>{event.emoji}</div>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>{event.emoji} {event.title}</div>
              <div style={{ fontSize: '0.9rem', color: '#ffcc00', fontWeight: 900, marginBottom: '8px' }}>{event.subtitle}</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{event.description}</div>

              {/* Progress */}
              <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem' }}>ミッション達成: {completedCount}/{allMissions.length}</span>
                <button
                  className="btn btn-primary"
                  style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                  onClick={() => navigate('/missions')}
                >
                  ミッション一覧
                </button>
              </div>
            </div>

            {/* 特効キャラ一覧 */}
            <div className="glass-panel" style={{ padding: '15px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Zap size={16} color="#ff2255" />
                <span style={{ fontWeight: 900, color: '#ff88aa' }}>イベント特効キャラ（{event.boostMultiplier}倍）</span>
              </div>
              {eventBoostChars.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: '0.85rem' }}>現在特効キャラはいません</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {eventBoostChars.map(c => {
                    const owned = !!characters[c.id];
                    return (
                      <div key={c.id} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        opacity: owned ? 1 : 0.4, position: 'relative',
                      }}>
                        <div className="char-icon" style={{
                          backgroundColor: c.color, width: '52px', height: '52px', fontSize: '1.5rem',
                          border: owned ? '2px solid #ff2255' : '2px dashed #888',
                          boxShadow: owned ? '0 0 10px rgba(255,34,85,0.5)' : 'none',
                        }}>
                          {c.imageUrl ? <img src={c.imageUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : c.emoji}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: owned ? 'white' : '#888', textAlign: 'center', maxWidth: '55px', lineHeight: 1.2 }}>{c.name}</span>
                        {!owned && (
                          <div style={{ position: 'absolute', top: -2, right: -2, background: '#888', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', color: 'white' }}>?</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {ownedBoostChars.length > 0 && (
                <div style={{ marginTop: '10px', background: 'rgba(255,34,85,0.15)', borderRadius: '10px', padding: '8px 12px', fontSize: '0.8rem', color: '#ff88aa' }}>
                  ✅ 特効キャラを{ownedBoostChars.length}体所持中！チームに編成すると攻撃力{event.boostMultiplier}倍！
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EventHome;
