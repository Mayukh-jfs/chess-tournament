import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAGJjaZsJaj5p3o1i280KkUNkEBEEypPEQ",
  authDomain: "chess-tournament-f289b.firebaseapp.com",
  projectId: "chess-tournament-f289b",
  storageBucket: "chess-tournament-f289b.firebasestorage.app",
  messagingSenderId: "1085897996859",
  appId: "1:1085897996859:web:dff52e17fc09c0ee50ba1e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);