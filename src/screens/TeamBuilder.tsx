import React, { useState } from 'react';
import { useGame } from '../store/GameContext';
import { CHARACTERS } from '../data/characters';
import type { Rank } from '../data/characters';
import { ArrowLeft, ArrowUpCircle, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const rankMaxLevels: Record<Rank, number> = {
  'S': 50, 'A': 40, 'B': 30, 'C': 25, 'D': 20, 'E': 10
};

const rankCostMultipliers: Record<Rank, number> = {
  'S': 300, 'A': 200, 'B': 150, 'C': 100, 'D': 80, 'E': 50
};

const CHARS_PER_PAGE = 12; // 4 columns x 3 rows grid

const TeamBuilder = () => {
  const { characters, team, money, setTeam, upgradeCharacter } = useGame();
  const navigate = useNavigate();
  
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  const ownedChars = CHARACTERS.filter(c => characters[c.id]);
  const totalPages = Math.max(1, Math.ceil(ownedChars.length / CHARS_PER_PAGE));
  const currentChars = ownedChars.slice(currentPage * CHARS_PER_PAGE, (currentPage + 1) * CHARS_PER_PAGE);

  const getUpgradeCost = (rank: Rank, level: number) => level * rankCostMultipliers[rank];

  const toggleTeamMember = (charId: string) => {
    if (team.includes(charId)) {
      setTeam(team.filter(id => id !== charId));
    } else if (team.length < 5) {
      setTeam([...team, charId]);
    }
  };

  const selectedCharDef = selectedCharId ? CHARACTERS.find(c => c.id === selectedCharId) : null;
  const selectedCharData = selectedCharId ? characters[selectedCharId] : null;

  return (
    <div className="view-container" style={{ paddingBottom: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/home')}><ArrowLeft size={20} /></button>
        <h2>チーム編成 ({team.length}/5)</h2>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Team Slots (Top) */}
      <div className="glass-panel" style={{ padding: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {[0, 1, 2, 3, 4].map(idx => {
          const charId = team[idx];
          if (charId) {
            const c = CHARACTERS.find(char => char.id === charId)!;
            return (
              <div key={`team-${idx}`} className="char-icon" style={{ backgroundColor: c.color, width: '50px', height: '50px', fontSize: '1.5rem', border: '2px solid var(--primary-color)', cursor: 'pointer' }} onClick={() => setSelectedCharId(charId)}>
                {c.imageUrl ? <img src={c.imageUrl} alt={c.name} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} /> : c.emoji}
              </div>
            );
          } else {
            return (
              <div key={`team-${idx}`} style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', border: '2px dashed rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#888' }}>
                空
              </div>
            );
          }
        })}
      </div>

      {/* Owned Characters Grid (Middle) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '15px', 
            justifyItems: 'center',
            flex: 1,
            alignContent: 'start'
          }}>
            {currentChars.map(c => {
              const isSelected = selectedCharId === c.id;
              const inTeam = team.includes(c.id);
              return (
                <div key={c.id} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setSelectedCharId(c.id)}>
                  <div className="char-icon" style={{ 
                    backgroundColor: c.color, 
                    width: '60px', height: '60px', fontSize: '2rem',
                    border: isSelected ? '3px solid white' : 'none',
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 0 15px rgba(255,255,255,0.5)' : 'var(--glass-shadow)'
                  }}>
                    {c.imageUrl ? <img src={c.imageUrl} alt={c.name} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} /> : c.emoji}
                  </div>
                  <span className="rank-badge" style={{ position: 'absolute', bottom: '-5px', right: '-5px', backgroundColor: `var(--rank-${c.rank.toLowerCase()})`, fontSize: '0.7rem', padding: '1px 5px' }}>
                    {c.rank}
                  </span>
                  {inTeam && (
                    <div style={{ position: 'absolute', top: '-5px', left: '-5px', background: 'var(--primary-color)', borderRadius: '50%', padding: '2px' }}>
                      <Check size={12} color="white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>
              <ChevronLeft size={20} />
            </button>
            <span>{currentPage + 1} / {totalPages}</span>
            <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Character Detail Panel (Bottom) */}
      <div className="glass-panel" style={{ height: '180px', marginTop: '15px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
        {selectedCharDef && selectedCharData ? (
          <>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div className="char-icon" style={{ backgroundColor: selectedCharDef.color, width: '60px', height: '60px', fontSize: '2rem' }}>
                {selectedCharDef.imageUrl ? <img src={selectedCharDef.imageUrl} alt={selectedCharDef.name} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} /> : selectedCharDef.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="rank-badge" style={{ backgroundColor: `var(--rank-${selectedCharDef.rank.toLowerCase()})` }}>{selectedCharDef.rank}</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{selectedCharDef.name}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>
                  Lv. {selectedCharData.level} / {rankMaxLevels[selectedCharDef.rank]} | HP: {selectedCharDef.baseHp + selectedCharData.level * 10} | ATK: {selectedCharDef.baseAtk + selectedCharData.level * 5}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
              <button 
                className={`btn ${team.includes(selectedCharDef.id) ? 'btn-secondary' : 'btn-primary'}`} 
                style={{ flex: 1, padding: '10px' }}
                onClick={() => toggleTeamMember(selectedCharDef.id)}
                disabled={!team.includes(selectedCharDef.id) && team.length >= 5}
              >
                {team.includes(selectedCharDef.id) ? '編成から外す' : 'チームに入れる'}
              </button>
              
              {selectedCharData.level < rankMaxLevels[selectedCharDef.rank] ? (
                <button 
                  className={`btn ${money >= getUpgradeCost(selectedCharDef.rank, selectedCharData.level) ? 'btn-y-point' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '10px' }}
                  onClick={() => upgradeCharacter(selectedCharDef.id, getUpgradeCost(selectedCharDef.rank, selectedCharData.level))}
                  disabled={money < getUpgradeCost(selectedCharDef.rank, selectedCharData.level)}
                >
                  <ArrowUpCircle size={18} style={{ marginRight: '5px' }} />
                  強化 (💰{getUpgradeCost(selectedCharDef.rank, selectedCharData.level)})
                </button>
              ) : (
                <button className="btn btn-secondary" style={{ flex: 1, padding: '10px', color: '#ffcc00' }} disabled>
                  レベルMAX
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            キャラクターを選択してください
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamBuilder;
