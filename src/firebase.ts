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

export interface PlayerData {
  money: number;
  yPoints: number;
  characters: Record<string, { level: number }>;
  team: string[];
  maxClearedStageId: string;
  clearedStages: string[]; // list of cleared stage IDs
}

const DEFAULT_DATA: PlayerData = {
  money: 0,
  yPoints: 50,
  characters: {
    'char_e_51': { level: 1 }
  },
  team: ['char_e_51'],
  maxClearedStageId: '',
  clearedStages: [],
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
