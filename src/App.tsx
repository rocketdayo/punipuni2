import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Coins, Star } from 'lucide-react';
import { useGame } from './store/GameContext';

import TitleScreen from './screens/TitleScreen';
import Home from './screens/Home';
import Gacha from './screens/Gacha';
import TeamBuilder from './screens/TeamBuilder';
import StageSelect from './screens/StageSelect';
import GameScene from './screens/GameScene';
import Collection from './screens/Collection';

const App = () => {
  const { loading, money, yPoints } = useGame();
  const navigate = useNavigate();

  if (loading) {
    return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  return (
    <div className="app-container">
      {/* Global Header (hidden on title screen and game scene) */}
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="*" element={
          <>
            <div className="header">
              <div style={{ fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => navigate('/home')}>
                ぷにクローン
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="currency-badge">
                  <Coins className="money-icon" size={16} /> {money}
                </div>
                <div className="currency-badge">
                  <Star className="y-point-icon" size={16} /> {yPoints}
                </div>
              </div>
            </div>
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/gacha" element={<Gacha />} />
              <Route path="/team" element={<TeamBuilder />} />
              <Route path="/stages" element={<StageSelect />} />
              <Route path="/stage/:stageId" element={<GameScene />} />
              <Route path="/collection" element={<Collection />} />
            </Routes>
          </>
        } />
      </Routes>
    </div>
  );
};

export default App;
