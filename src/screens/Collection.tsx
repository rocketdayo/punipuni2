import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGame } from '../store/GameContext';
import { CHARACTERS } from '../data/characters';
import type { Rank } from '../data/characters';

const RANKS: Rank[] = ['S', 'A', 'B', 'C', 'D', 'E'];
const RANK_COLORS: Record<Rank, string> = {
  S: '#ff2222', A: '#ffaa00', B: '#ff88aa', C: '#aa5555', D: '#55aa55', E: '#88cc88'
};
const PER_PAGE = 20;

const Collection = () => {
  const navigate = useNavigate();
  const { characters } = useGame();
  const [filterRank, setFilterRank] = useState<Rank | 'ALL'>('ALL');
  const [page, setPage] = useState(0);

  const filtered = filterRank === 'ALL'
    ? CHARACTERS
    : CHARACTERS.filter(c => c.rank === filterRank);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageChars  = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const ownedCount = CHARACTERS.filter(c => characters[c.id]).length;

  const handleFilterChange = (rank: Rank | 'ALL') => {
    setFilterRank(rank);
    setPage(0);
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <button className="btn btn-secondary" style={{ padding: 8 }} onClick={() => navigate('/home')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ margin: 0 }}>図鑑</h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            {ownedCount} / {CHARACTERS.length} 体
          </div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Overall progress bar */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ height: '8px', background: '#222', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(ownedCount / CHARACTERS.length) * 100}%`,
            background: 'linear-gradient(90deg, #6c63ff, #ff6584)',
            transition: 'width 0.4s',
          }} />
        </div>
      </div>

      {/* Rank filter tabs */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flexShrink: 0, paddingBottom: '4px' }}>
        {(['ALL', ...RANKS] as (Rank | 'ALL')[]).map(rank => (
          <button
            key={rank}
            onClick={() => handleFilterChange(rank)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              background: filterRank === rank
                ? (rank === 'ALL' ? 'var(--primary-color)' : RANK_COLORS[rank as Rank])
                : 'rgba(255,255,255,0.1)',
              color: 'white',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {rank}
          </button>
        ))}
      </div>

      {/* Character grid */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '10px',
          padding: '4px',
        }}>
          {pageChars.map(c => {
            const owned = !!characters[c.id];
            return (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div
                  className="char-icon"
                  style={{
                    width: '52px',
                    height: '52px',
                    fontSize: '1.8rem',
                    backgroundColor: owned ? c.color : '#222',
                    border: `2px solid ${owned ? RANK_COLORS[c.rank] : '#333'}`,
                    filter: owned ? 'none' : 'grayscale(100%) brightness(0.3)',
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                >
                  {owned ? (
                    c.imageUrl ? (
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        style={{
                          width: '100%', height: '100%',
                          objectFit: 'cover',
                          borderRadius: '50%'
                        }}
                      />
                    ) : (
                      c.emoji
                    )
                  ) : (
                    '❓'
                  )}
                  {/* Rank badge */}
                  <span style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    backgroundColor: RANK_COLORS[c.rank],
                    color: 'white',
                    fontSize: '0.55rem',
                    fontWeight: 'bold',
                    padding: '1px 4px',
                    borderRadius: '4px',
                  }}>
                    {c.rank}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.6rem',
                  color: owned ? 'var(--text-color)' : '#444',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  maxWidth: '52px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {owned ? c.name : '？？？'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, paddingTop: '8px' }}>
        <button className="btn btn-secondary" style={{ padding: 8 }} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {page + 1} / {totalPages}
        </span>
        <button className="btn btn-secondary" style={{ padding: 8 }} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Collection;
