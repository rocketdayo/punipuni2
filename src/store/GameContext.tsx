import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAndGetData, savePlayerData } from '../firebase';
import { CHARACTERS } from '../data/characters';
import { CURRENT_EVENTS } from '../data/events';
import type { PlayerData } from '../firebase';

interface GameState extends PlayerData {
  uid: string | null;
  loading: boolean;
  addMoney: (amount: number) => void;
  addYPoints: (amount: number) => void;
  unlockCharacter: (charId: string) => void;
  upgradeCharacter: (charId: string, moneyCost: number) => void;
  useExpItem: (charId: string, itemType: 'expSmall' | 'expLarge') => void;
  useSkillBook: (charId: string) => void;
  setTeam: (newTeam: string[]) => void;
  clearStage: (stageId: string, moneyReward: number, yPointReward: number) => void;
  trackMission: (type: string, amount?: number) => void;
  claimMission: (missionId: string) => void;
}

const GameContext = createContext<GameState | undefined>(undefined);

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
};

const DEFAULT_ITEMS = { expSmall: 3, expLarge: 1, skillBook: 0 };

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
    items: DEFAULT_ITEMS,
    missionProgress: {},
    completedMissions: [],
  });

  useEffect(() => {
    loginAndGetData((playerData, uid) => {
      if (!playerData.clearedStages) playerData.clearedStages = [];
      if (!playerData.items) playerData.items = DEFAULT_ITEMS;
      if (!playerData.missionProgress) playerData.missionProgress = {};
      if (!playerData.completedMissions) playerData.completedMissions = [];

      // Migrate old character saves (add missing fields)
      const migratedChars: PlayerData['characters'] = {};
      Object.entries(playerData.characters || {}).forEach(([id, c]) => {
        migratedChars[id] = {
          level: c.level || 1,
          skillLevel: (c as any).skillLevel || 1,
          limitBreak: (c as any).limitBreak || 0,
          duplicates: (c as any).duplicates || 0,
        };
      });
      playerData.characters = migratedChars;

      let validTeam = (playerData.team || []).filter(id => CHARACTERS.some(c => c.id === id));
      if (validTeam.length === 0) {
        validTeam = ['char_e_51'];
        if (!playerData.characters['char_e_51']) {
          playerData.characters['char_e_51'] = { level: 1, skillLevel: 1, limitBreak: 0, duplicates: 0 };
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
    if (uid) savePlayerData(uid, newData);
  };

  // Debug tools
  useEffect(() => {
    (window as any).addYPoints = (amount: number) => {
      setData(prev => {
        const newData = { yPoints: prev.yPoints + amount };
        if (uid) savePlayerData(uid, newData);
        return { ...prev, ...newData };
      });
    };
    (window as any).addMoney = (amount: number) => {
      setData(prev => {
        const newData = { money: prev.money + amount };
        if (uid) savePlayerData(uid, newData);
        return { ...prev, ...newData };
      });
    };
    (window as any).addItems = (type: string, amount: number) => {
      setData(prev => {
        const newItems = { ...prev.items, [type]: (prev.items as any)[type] + amount };
        if (uid) savePlayerData(uid, { items: newItems });
        return { ...prev, items: newItems };
      });
    };
  }, [uid]);

  const addMoney = (amount: number) => mutateAndSave({ money: data.money + amount });
  const addYPoints = (amount: number) => mutateAndSave({ yPoints: data.yPoints + amount });

  const unlockCharacter = (charId: string) => {
    const existing = data.characters[charId];
    if (!existing) {
      // 新しいキャラのアンロック
      mutateAndSave({
        characters: {
          ...data.characters,
          [charId]: { level: 1, skillLevel: 1, limitBreak: 0, duplicates: 1 }
        }
      });
    } else {
      // 同キャラ取得 → 限界突破処理
      const newDuplicates = (existing.duplicates || 0) + 1;
      const newLimitBreak = Math.min(5, Math.floor(newDuplicates / 1)); // 1体ごとに段階UP（最大5）
      const maxLvBonus = newLimitBreak * 10;
      mutateAndSave({
        characters: {
          ...data.characters,
          [charId]: {
            ...existing,
            duplicates: newDuplicates,
            limitBreak: newLimitBreak,
            skillLevel: Math.min(5, (existing.skillLevel || 1) + (newDuplicates % 2 === 0 ? 1 : 0)),
          }
        }
      });
    }
  };

  const upgradeCharacter = (charId: string, moneyCost: number) => {
    const charData = data.characters[charId];
    if (data.money >= moneyCost && charData) {
      mutateAndSave({
        money: data.money - moneyCost,
        characters: {
          ...data.characters,
          [charId]: { ...charData, level: charData.level + 1 }
        }
      });
      trackMission('level_up', 1);
    }
  };

  const useExpItem = (charId: string, itemType: 'expSmall' | 'expLarge') => {
    const charData = data.characters[charId];
    const charDef = CHARACTERS.find(c => c.id === charId);
    if (!charData || !charDef || (data.items[itemType] || 0) <= 0) return;

    const levelGain = itemType === 'expSmall' ? 1 : 5;
    const limitBonus = (charData.limitBreak || 0) * 10;
    const maxLv = { SS: 60, S: 50, A: 40, B: 30, C: 25, D: 20, E: 10 }[charDef.rank] + limitBonus;
    const newLevel = Math.min(maxLv, charData.level + levelGain);

    if (newLevel <= charData.level) return;

    mutateAndSave({
      items: { ...data.items, [itemType]: data.items[itemType] - 1 },
      characters: { ...data.characters, [charId]: { ...charData, level: newLevel } }
    });
    trackMission('level_up', newLevel - charData.level);
  };

  const useSkillBook = (charId: string) => {
    const charData = data.characters[charId];
    if (!charData || (data.items.skillBook || 0) <= 0) return;
    const currentSkillLv = charData.skillLevel || 1;
    if (currentSkillLv >= 5) return;

    mutateAndSave({
      items: { ...data.items, skillBook: data.items.skillBook - 1 },
      characters: { ...data.characters, [charId]: { ...charData, skillLevel: currentSkillLv + 1 } }
    });
  };

  const setTeam = (newTeam: string[]) => mutateAndSave({ team: newTeam });

  const clearStage = (stageId: string, moneyReward: number, yPointReward: number) => {
    const newCleared = data.clearedStages.includes(stageId)
      ? data.clearedStages
      : [...data.clearedStages, stageId];
    // Drop items on stage clear
    const dropChance = Math.random();
    const newItems = { ...data.items };
    if (dropChance > 0.7) newItems.expSmall = (newItems.expSmall || 0) + 1;
    if (dropChance > 0.95) newItems.expLarge = (newItems.expLarge || 0) + 1;

    mutateAndSave({
      money: data.money + moneyReward,
      yPoints: data.yPoints + yPointReward,
      maxClearedStageId: stageId,
      clearedStages: newCleared,
      items: newItems,
    });
    trackMission('complete_stage', 1);
  };

  const trackMission = (type: string, amount: number = 1) => {
    const allMissions = CURRENT_EVENTS.flatMap(e => e.missions);
    const relevantMissions = allMissions.filter(m => m.type === type);
    if (relevantMissions.length === 0) return;

    const newProgress = { ...data.missionProgress };
    relevantMissions.forEach(m => {
      if (!data.completedMissions.includes(m.id)) {
        newProgress[m.id] = (newProgress[m.id] || 0) + amount;
      }
    });
    mutateAndSave({ missionProgress: newProgress });
  };

  const claimMission = (missionId: string) => {
    const allMissions = CURRENT_EVENTS.flatMap(e => e.missions);
    const mission = allMissions.find(m => m.id === missionId);
    if (!mission || data.completedMissions.includes(missionId)) return;
    const progress = data.missionProgress[missionId] || 0;
    if (progress < mission.goal) return;

    const newItems = { ...data.items };
    if (mission.rewardItems?.expSmall) newItems.expSmall += mission.rewardItems.expSmall;
    if (mission.rewardItems?.expLarge) newItems.expLarge += mission.rewardItems.expLarge;
    if (mission.rewardItems?.skillBook) newItems.skillBook += mission.rewardItems.skillBook;

    mutateAndSave({
      money: data.money + (mission.rewardMoney || 0),
      yPoints: data.yPoints + (mission.rewardYPoints || 0),
      items: newItems,
      completedMissions: [...data.completedMissions, missionId],
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
      useExpItem,
      useSkillBook,
      setTeam,
      clearStage,
      trackMission,
      claimMission,
    }}>
      {children}
    </GameContext.Provider>
  );
};
