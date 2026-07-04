import React from 'react';
import { useNavigate } from 'react-router-dom';

const TitleScreen = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%',
      background: 'radial-gradient(circle at top, #2a0a2a, #0a001a)'
    }}>
      <h1 className="animate-float" style={{ 
        fontSize: '4rem', 
        background: '-webkit-linear-gradient(#e94560, #ffb703)', 
        WebkitBackgroundClip: 'text', 
        WebkitTextFillColor: 'transparent',
        marginBottom: '40px',
        textShadow: '0 10px 20px rgba(0,0,0,0.5)'
      }}>
        ぷにクローン
      </h1>
      
      <button className="btn btn-primary animate-pulse" onClick={() => navigate('/home')} style={{ fontSize: '1.5rem', padding: '15px 40px' }}>
        TAP TO START
      </button>
    </div>
  );
};

export default TitleScreen;
