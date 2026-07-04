import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { GameProvider } from './store/GameContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </GameProvider>
  </React.StrictMode>,
)
