import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../store/GameContext';

const TitleScreen = () => {
  const navigate = useNavigate();
  const { loading } = useGame();
  const [tap, setTap] = useState(false);

  // Auto-navigate to home if already have save data loaded
  const handleStart = () => {
    setTap(true);
    setTimeout(() => navigate('/home'), 300);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%',
        background: 'linear-gradient(180deg, #55aaff 0%, #0044aa 100%)',
      }}>
        <div style={{ fontSize: '3rem', animation: 'pulse 1s infinite' }}>🌀</div>
        <p style={{ color: 'white', fontWeight: 900, fontSize: '1.2rem', marginTop: 16 }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%',
      background: 'linear-gradient(180deg, #55ddff 0%, #1199ff 50%, #0055cc 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative bubbles */}
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${30 + i * 15}px`,
          height: `${30 + i * 15}px`,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          border: '3px solid rgba(255,255,255,0.4)',
          top: `${10 + i * 10}%`,
          left: `${5 + (i % 3) * 35}%`,
          animation: `float ${2 + i * 0.4}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}

      {/* Logo */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        borderRadius: '30px',
        padding: '20px 40px',
        marginBottom: '30px',
        border: '6px solid #0055cc',
        boxShadow: '0 10px 0 #003388, 0 12px 20px rgba(0,0,0,0.4)',
        textAlign: 'center',
        zIndex: 1,
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0055cc', letterSpacing: '0.1em' }}>
          妖怪ウォッチ
        </div>
        <div style={{
          fontSize: '2.8rem', fontWeight: 900,
          color: '#ff6600',
          textShadow: '0 4px 0 #cc3300, 0 6px 10px rgba(0,0,0,0.3)',
          lineHeight: 1,
        }}>
          ぷにクローン
        </div>
      </div>

      {/* Character emoji as placeholder mascot */}
      <div style={{
        fontSize: '6rem',
        animation: 'float 2s ease-in-out infinite',
        marginBottom: '20px',
        filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.3))',
        zIndex: 1,
      }}>
        🐱
      </div>

      {/* Tap to start button */}
      <button
        className="btn btn-primary"
        onClick={handleStart}
        style={{
          fontSize: '1.4rem',
          padding: '18px 50px',
          opacity: tap ? 0.7 : 1,
          transition: 'opacity 0.3s',
          zIndex: 1,
          marginTop: '10px',
        }}
      >
        <span className="text-outline" style={{ fontSize: '1.4rem' }}>
          ▶ タップしてスタート
        </span>
      </button>

      <p style={{
        color: 'rgba(255,255,255,0.8)',
        fontSize: '0.8rem',
        marginTop: '30px',
        zIndex: 1,
        fontWeight: 700,
      }}>
        © 2025 ぷにクローン
      </p>
    </div>
  );
};

export default TitleScreen;
