import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAndGetData, savePlayerData } from '../firebase';
import { CHARACTERS } from '../data/characters';
import type { PlayerData } from '../firebase';

interface GameState extends PlayerData {
  uid: string | null;
  loading: boolean;
  addMoney: (amount: number) => void;
  addYPoints: (amount: number) => void;
  unlockCharacter: (charId: string) => void;
  upgradeCharacter: (charId: string, moneyCost: number) => void;
  setTeam: (newTeam: string[]) => void;
  clearStage: (stageId: string, moneyReward: number, yPointReward: number) => void;
}

const GameContext = createContext<GameState | undefined>(undefined);

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PlayerData>({
    money: 0,
    yPoints: 0,
    characters: {},
    team: [],
    maxClearedStageId: '',
    clearedStages: [],
  });

  useEffect(() => {
    loginAndGetData((playerData, uid) => {
      // Ensure clearedStages exists (for old save data)
      if (!playerData.clearedStages) playerData.clearedStages = [];
      // Clean up invalid characters from old saves
      let validTeam = (playerData.team || []).filter(id => CHARACTERS.some(c => c.id === id));
      if (validTeam.length === 0) {
        // Fallback for broken saves
        validTeam = ['char_e_51'];
        if (!playerData.characters['char_e_51']) {
          playerData.characters['char_e_51'] = { level: 1 };
          savePlayerData(uid, { characters: playerData.characters });
        }
      }
      if (validTeam.length !== (playerData.team || []).length) {
        playerData.team = validTeam;
        savePlayerData(uid, { team: validTeam });
      }
      setData(playerData);
      setUid(uid);
      setLoading(false);
    });
  }, []);

  const mutateAndSave = (newData: Partial<PlayerData>) => {
    const updated = { ...data, ...newData };
    setData(updated);
    if (uid) {
      savePlayerData(uid, newData);
    }
  };

  useEffect(() => {
    // Expose debug tools to window for Developer Tools
    (window as any).addYPoints = (amount: number) => {
      setData(prev => {
        const newData = { yPoints: prev.yPoints + amount };
        if (uid) savePlayerData(uid, newData);
        return { ...prev, ...newData };
      });
      console.log(`Added ${amount} Y-points!`);
    };
    (window as any).addMoney = (amount: number) => {
      setData(prev => {
        const newData = { money: prev.money + amount };
        if (uid) savePlayerData(uid, newData);
        return { ...prev, ...newData };
      });
      console.log(`Added ${amount} Money!`);
    };
  }, [uid]);

  const addMoney = (amount: number) => {
    mutateAndSave({ money: data.money + amount });
  };

  const addYPoints = (amount: number) => {
    mutateAndSave({ yPoints: data.yPoints + amount });
  };

  const unlockCharacter = (charId: string) => {
    if (!data.characters[charId]) {
      mutateAndSave({
        characters: {
          ...data.characters,
          [charId]: { level: 1 }
        }
      });
    }
  };

  const upgradeCharacter = (charId: string, moneyCost: number) => {
    if (data.money >= moneyCost && data.characters[charId]) {
      const currentLevel = data.characters[charId].level;
      mutateAndSave({
        money: data.money - moneyCost,
        characters: {
          ...data.characters,
          [charId]: { level: currentLevel + 1 }
        }
      });
    }
  };

  const setTeam = (newTeam: string[]) => {
    mutateAndSave({ team: newTeam });
  };

  const clearStage = (stageId: string, moneyReward: number, yPointReward: number) => {
    const newCleared = data.clearedStages.includes(stageId)
      ? data.clearedStages
      : [...data.clearedStages, stageId];
    mutateAndSave({
      money: data.money + moneyReward,
      yPoints: data.yPoints + yPointReward,
      maxClearedStageId: stageId,
      clearedStages: newCleared,
    });
  };

  return (
    <GameContext.Provider value={{
      ...data,
      uid,
      loading,
      addMoney,
      addYPoints,
      unlockCharacter,
      upgradeCharacter,
      setTeam,
      clearStage
    }}>
      {children}
    </GameContext.Provider>
  );
};
