import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase project: petatani
// Web API key is safe to be public — access is restricted by Firebase
// security rules and authorized domains in the Firebase Console.
const firebaseConfig = {
  apiKey: "AIzaSyAQ6ZcbbF82T2Ch-3zwP6EAt7JK2KR9aKg",
  authDomain: "petatani.firebaseapp.com",
  projectId: "petatani",
  storageBucket: "petatani.firebasestorage.app",
  messagingSenderId: "630313058128",
  appId: "1:630313058128:web:0dc4b82d64bab7ed427655",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
