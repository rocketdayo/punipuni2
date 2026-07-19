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
import EventHome from './screens/EventHome';
import MissionList from './screens/MissionList';

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
                <div style={{ display: 'flex', gap: '5px' }}>
                  {/* Spirit (Stamina) */}
                  <div className="currency-badge">
                    <div className="currency-icon spirit-icon">+1</div>
                    <span style={{ fontSize: '0.9rem' }}>99</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <div className="currency-badge">
                    <div className="currency-icon money-icon">y</div>
                    {money}
                  </div>
                  <div className="currency-badge">
                    <div className="currency-icon y-point-icon">y</div>
                    {yPoints}
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
              <Route path="/event" element={<EventHome />} />
              <Route path="/missions" element={<MissionList />} />
            </Routes>
          </>
        } />
      </Routes>
    </div>
  );
};

export default App;
