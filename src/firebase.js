import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAODNvAwHrTCjo0a17KHvuX2lhTpzjOl1E",
  authDomain: "ccc-registration-6ade6.firebaseapp.com",
  projectId: "ccc-registration-6ade6",
  storageBucket: "ccc-registration-6ade6.firebasestorage.app",
  messagingSenderId: "323336600273",
  appId: "1:323336600273:web:83f2c845100df3d92c23f0",
};

const app = initializeApp(firebaseConfig);

// Auth & DB
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Auth
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});

export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, provider);
};

export const logout = async () => {
  return await signOut(auth);
};
