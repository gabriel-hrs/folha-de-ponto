// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInAnonymously, setPersistence, browserLocalPersistence,
  GoogleAuthProvider, signInWithPopup, linkWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCimfdnRnihCnQLyaPy3ckxzqQ7hbeQKqo",
  authDomain: "folha-de-ponto-cafehyna.firebaseapp.com",
  databaseURL: "https://folha-de-ponto-cafehyna-default-rtdb.firebaseio.com",
  projectId: "folha-de-ponto-cafehyna",
  storageBucket: "folha-de-ponto-cafehyna.firebasestorage.app",
  messagingSenderId: "939903120504",
  appId: "1:939903120504:web:0a0c75fa171e803636e98d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

const db = getFirestore(app);

// cria/garante usuário anônimo ao abrir
const authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      await signInAnonymously(auth);
    }
    resolve();
  });
});

export { app, db, auth, authReady, GoogleAuthProvider, signInWithPopup, linkWithPopup, signOut };
