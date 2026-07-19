import React, { useState } from 'react';
import { useGame } from '../store/GameContext';
import { CHARACTERS } from '../data/characters';
import type { Rank } from '../data/characters';
import { ArrowLeft, ArrowUpCircle, ChevronLeft, ChevronRight, Check, Star, Zap, Shield, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const rankMaxLevels: Record<Rank, number> = {
  'SS': 60, 'S': 50, 'A': 40, 'B': 30, 'C': 25, 'D': 20, 'E': 10
};
const rankCostMultipliers: Record<Rank, number> = {
  'SS': 500, 'S': 300, 'A': 200, 'B': 150, 'C': 100, 'D': 80, 'E': 50
};
const RANK_COLORS: Record<Rank, string> = {
  SS: '#ff22ff', S: '#ff2222', A: '#ffaa00', B: '#ff88bb', C: '#cc6666', D: '#55bb55', E: '#88cc88'
};
const CHARS_PER_PAGE = 12;

const StarRating = ({ count, max = 5 }: { count: number; max?: number }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[...Array(max)].map((_, i) => (
      <Star key={i} size={12} fill={i < count ? '#ffcc00' : 'none'} color={i < count ? '#ffcc00' : '#888'} />
    ))}
  </div>
);

const TeamBuilder = () => {
  const { characters, team, money, items, setTeam, upgradeCharacter, useExpItem, useSkillBook } = useGame();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'team' | 'items'>('team');

  const ownedChars = CHARACTERS.filter(c => characters[c.id]);
  const totalPages = Math.max(1, Math.ceil(ownedChars.length / CHARS_PER_PAGE));
  const currentChars = ownedChars.slice(currentPage * CHARS_PER_PAGE, (currentPage + 1) * CHARS_PER_PAGE);

  const getUpgradeCost = (rank: Rank, level: number) => level * rankCostMultipliers[rank];
  const getMaxLevel = (rank: Rank, limitBreak: number) => rankMaxLevels[rank] + limitBreak * 10;

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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/home')} style={{ padding: '8px 12px' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0 }}>チーム編成・育成</h2>
        {/* Items display */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', background: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem' }}>
          <span>🔮×{items?.expSmall ?? 0}</span>
          <span>✨×{items?.expLarge ?? 0}</span>
          <span>📖×{items?.skillBook ?? 0}</span>
        </div>
      </div>

      {/* Team Slots */}
      <div className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}>
        {[0, 1, 2, 3, 4].map(idx => {
          const charId = team[idx];
          if (charId) {
            const c = CHARACTERS.find(char => char.id === charId)!;
            const cData = characters[charId];
            return (
              <div key={`team-${idx}`} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setSelectedCharId(charId)}>
                <div className="char-icon" style={{
                  backgroundColor: c.color, width: '52px', height: '52px', fontSize: '1.4rem',
                  border: selectedCharId === charId ? '3px solid white' : `2px solid ${RANK_COLORS[c.rank]}`,
                }}>
                  {c.imageUrl ? <img src={c.imageUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : c.emoji}
                </div>
                {c.eventBoost && (
                  <div style={{ position: 'absolute', top: -5, right: -5, background: '#ff2255', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', color: 'white', fontWeight: 900, border: '1px solid white' }}>特</div>
                )}
              </div>
            );
          }
          return (
            <div key={`team-${idx}`} style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', border: '2px dashed rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#888' }}>空</div>
          );
        })}
      </div>

      {/* Characters Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', justifyItems: 'center', flex: 1, alignContent: 'start' }}>
            {currentChars.map(c => {
              const isSelected = selectedCharId === c.id;
              const inTeam = team.includes(c.id);
              return (
                <div key={c.id} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setSelectedCharId(c.id)}>
                  <div className="char-icon" style={{
                    backgroundColor: c.color, width: '60px', height: '60px', fontSize: '2rem',
                    border: isSelected ? '3px solid white' : 'none',
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 0 15px rgba(255,255,255,0.5)' : 'var(--glass-shadow)'
                  }}>
                    {c.imageUrl ? <img src={c.imageUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : c.emoji}
                  </div>
                  <span className="rank-badge" style={{ position: 'absolute', bottom: '-5px', right: '-5px', backgroundColor: RANK_COLORS[c.rank], fontSize: '0.65rem', padding: '1px 4px' }}>
                    {c.rank}
                  </span>
                  {inTeam && (
                    <div style={{ position: 'absolute', top: '-5px', left: '-5px', background: 'var(--primary-color)', borderRadius: '50%', padding: '2px' }}>
                      <Check size={12} color="white" />
                    </div>
                  )}
                  {c.eventBoost && (
                    <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ff2255', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.45rem', color: 'white', fontWeight: 900 }}>特</div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}><ChevronLeft size={20} /></button>
            <span style={{ fontSize: '0.9rem' }}>{currentPage + 1} / {totalPages}</span>
            <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1}><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      {/* Character Detail Panel */}
      <div className="glass-panel" style={{ marginTop: '10px', padding: '15px' }}>
        {selectedCharDef && selectedCharData ? (
          <>
            {/* Top: icon + stats */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div className="char-icon" style={{ backgroundColor: selectedCharDef.color, width: '64px', height: '64px', fontSize: '2rem' }}>
                  {selectedCharDef.imageUrl ? <img src={selectedCharDef.imageUrl} alt={selectedCharDef.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : selectedCharDef.emoji}
                </div>
                {selectedCharDef.eventBoost && (
                  <div style={{ position: 'absolute', top: -5, right: -5, background: '#ff2255', color: 'white', fontWeight: 900, fontSize: '0.55rem', padding: '2px 5px', borderRadius: '10px', border: '1.5px solid white', whiteSpace: 'nowrap' }}>特効中</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="rank-badge" style={{ backgroundColor: RANK_COLORS[selectedCharDef.rank] }}>{selectedCharDef.rank}</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedCharDef.name}</span>
                  {/* 限界突破 ★ */}
                  <StarRating count={selectedCharData.limitBreak || 0} />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
                  Lv.{selectedCharData.level}/{getMaxLevel(selectedCharDef.rank, selectedCharData.limitBreak || 0)}
                  &nbsp;|&nbsp;HP:{selectedCharDef.baseHp + selectedCharData.level * 10}
                  &nbsp;|&nbsp;ATK:{selectedCharDef.baseAtk + selectedCharData.level * 5}
                </div>
                {/* わざレベル */}
                {selectedCharDef.skill && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', fontSize: '0.75rem' }}>
                    <Zap size={12} color="#ffcc00" />
                    <span style={{ color: '#ffcc00' }}>{selectedCharDef.skill.name}</span>
                    <span style={{ color: '#aaa' }}>わざLv.</span>
                    <StarRating count={selectedCharData.skillLevel || 1} />
                  </div>
                )}
              </div>
            </div>

            {/* 特性 (Trait) + イベント特効情報 */}
            {(selectedCharDef.trait || selectedCharDef.eventBoost) && (
              <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedCharDef.trait && (
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '8px 12px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)', borderLeft: '3px solid rgba(255,255,255,0.4)' }}>
                    <span style={{ fontSize: '0.65rem', color: '#aaa', display: 'block', marginBottom: '2px' }}>📖 キャラ特性</span>
                    {selectedCharDef.trait}
                  </div>
                )}
                {selectedCharDef.eventBoost && selectedCharDef.eventBoostDesc && (
                  <div style={{ background: 'rgba(255,34,85,0.2)', borderRadius: '10px', padding: '8px 12px', fontSize: '0.8rem', color: '#ff88aa', borderLeft: '3px solid #ff2255' }}>
                    <span style={{ fontSize: '0.65rem', color: '#ff2255', display: 'block', marginBottom: '2px', fontWeight: 900 }}>🔥 イベント特効</span>
                    {selectedCharDef.eventBoostDesc}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* チーム編成 */}
              <button
                className={`btn ${team.includes(selectedCharDef.id) ? 'btn-secondary' : 'btn-primary'}`}
                style={{ padding: '10px', fontSize: '0.85rem' }}
                onClick={() => toggleTeamMember(selectedCharDef.id)}
                disabled={!team.includes(selectedCharDef.id) && team.length >= 5}
              >
                {team.includes(selectedCharDef.id) ? '編成から外す' : 'チームに入れる'}
              </button>

              {/* Yマネーで強化 */}
              {selectedCharData.level < getMaxLevel(selectedCharDef.rank, selectedCharData.limitBreak || 0) ? (
                <button
                  className={`btn ${money >= getUpgradeCost(selectedCharDef.rank, selectedCharData.level) ? 'btn-y-point' : 'btn-secondary'}`}
                  style={{ padding: '10px', fontSize: '0.85rem' }}
                  onClick={() => upgradeCharacter(selectedCharDef.id, getUpgradeCost(selectedCharDef.rank, selectedCharData.level))}
                  disabled={money < getUpgradeCost(selectedCharDef.rank, selectedCharData.level)}
                >
                  <ArrowUpCircle size={15} style={{ marginRight: '4px' }} />
                  強化💰{getUpgradeCost(selectedCharDef.rank, selectedCharData.level)}
                </button>
              ) : (
                <button className="btn btn-secondary" style={{ padding: '10px', fontSize: '0.85rem', color: '#ffcc00' }} disabled>Lv.MAX</button>
              )}

              {/* 小けいけんちだま */}
              <button
                className="btn btn-green"
                style={{ padding: '8px', fontSize: '0.8rem' }}
                onClick={() => useExpItem(selectedCharDef.id, 'expSmall')}
                disabled={(items?.expSmall ?? 0) <= 0 || selectedCharData.level >= getMaxLevel(selectedCharDef.rank, selectedCharData.limitBreak || 0)}
              >
                🔮 経験値だま小 ×{items?.expSmall ?? 0}
              </button>

              {/* 大けいけんちだま */}
              <button
                className="btn btn-green"
                style={{ padding: '8px', fontSize: '0.8rem' }}
                onClick={() => useExpItem(selectedCharDef.id, 'expLarge')}
                disabled={(items?.expLarge ?? 0) <= 0 || selectedCharData.level >= getMaxLevel(selectedCharDef.rank, selectedCharData.limitBreak || 0)}
              >
                ✨ 経験値だま大 ×{items?.expLarge ?? 0}
              </button>

              {/* 秘伝書 */}
              {selectedCharDef.skill && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px', fontSize: '0.8rem', gridColumn: 'span 2', background: (items?.skillBook ?? 0) > 0 && (selectedCharData.skillLevel || 1) < 5 ? 'linear-gradient(180deg, #9944ff 0%, #5500bb 100%)' : undefined }}
                  onClick={() => useSkillBook(selectedCharDef.id)}
                  disabled={(items?.skillBook ?? 0) <= 0 || (selectedCharData.skillLevel || 1) >= 5}
                >
                  📖 ひっさつ秘伝書 (わざLv.{selectedCharData.skillLevel || 1}→{Math.min(5, (selectedCharData.skillLevel || 1) + 1)}) ×{items?.skillBook ?? 0}
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            キャラクターを選択してください
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamBuilder;
