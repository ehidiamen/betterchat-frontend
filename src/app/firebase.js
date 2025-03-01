import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCa2KQ9WhyyBUYYdU5tTauTPqUkqTC2g6w",
  authDomain: "betterchat-8f4a2.firebaseapp.com",
  databaseURL: "https://betterchat-8f4a2-default-rtdb.firebaseio.com",
  projectId: "betterchat-8f4a2",
  storageBucket: "betterchat-8f4a2.firebasestorage.app",
  messagingSenderId: "624455891385",
  appId: "1:624455891385:web:f3e442f910bfff03029e68",
  measurementId: "G-M550VSKQC4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider, signInWithPopup, signOut };
