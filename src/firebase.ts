import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Your web app's Firebase configuration
// For GitHub Pages, you should configure these as environment variables in your build process,
// or carefully expose them (Firebase configs are generally safe to expose if security rules are set).
const firebaseConfig = {
  apiKey: "AIzaSyDwoPzbxnu9buf8p83Sr1BmLFzSE2h6qbQ",
  authDomain: "punipuniextra.firebaseapp.com",
  projectId: "punipuniextra",
  storageBucket: "punipuniextra.firebasestorage.app",
  messagingSenderId: "602553745651",
  appId: "1:602553745651:web:791bb4bf062b7095237786",
  measurementId: "G-2LEYJ8H4RE"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export interface CharacterSaveData {
  level: number;
  skillLevel?: number;    // わざレベル 1-5
  limitBreak?: number;    // 限界突破段階 0-5
  duplicates?: number;    // 同キャラ取得回数（限界突破用）
}

export interface PlayerData {
  money: number;
  yPoints: number;
  characters: Record<string, CharacterSaveData>;
  team: string[];
  maxClearedStageId: string;
  clearedStages: string[];
  items: {
    expSmall: number;   // 小けいけんちだま (+1 level)
    expLarge: number;   // 大けいけんちだま (+5 levels)
    skillBook: number;  // ひっさつの秘伝書 (+1 わざレベル)
  };
  missionProgress: Record<string, number>;  // missionId -> progress count
  completedMissions: string[];              // claimed mission IDs
  pityCount?: number;
  stepUpCount?: number;
  gachaHistory?: { timestamp: number; charId: string }[];
}

const DEFAULT_DATA: PlayerData = {
  money: 0,
  yPoints: 50,
  characters: {
    'char_e_51': { level: 1, skillLevel: 1, limitBreak: 0, duplicates: 0 }
  },
  team: ['char_e_51'],
  maxClearedStageId: '',
  clearedStages: [],
  items: { expSmall: 3, expLarge: 1, skillBook: 0 },
  missionProgress: {},
  completedMissions: [],
  pityCount: 100,
  stepUpCount: 0,
  gachaHistory: [],
};

export const loginAndGetData = async (onDataLoaded: (data: PlayerData, uid: string) => void) => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("Logged in anonymously as:", user.uid);
      const data = await fetchPlayerData(user.uid);
      onDataLoaded(data, user.uid);
    } else {
      signInAnonymously(auth).catch((error) => {
        console.error("Auth Error:", error);
      });
    }
  });
};

export const fetchPlayerData = async (uid: string): Promise<PlayerData> => {
  try {
    const docRef = doc(db, 'players', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as PlayerData;
    } else {
      await setDoc(docRef, DEFAULT_DATA);
      return DEFAULT_DATA;
    }
  } catch (error) {
    console.error("Error fetching player data, using default", error);
    return DEFAULT_DATA;
  }
};

export const savePlayerData = async (uid: string, data: Partial<PlayerData>) => {
  try {
    const docRef = doc(db, 'players', uid);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error saving player data", error);
  }
};
