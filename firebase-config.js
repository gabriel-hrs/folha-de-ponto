// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

// COLE SUA CONFIG AQUI
const firebaseConfig = {
  apiKey: "AIzaSyCimfdnRnihCnQLyaPy3ckxzqQ7hbeQKqo",
  authDomain: "folha-de-ponto-cafehyna.firebaseapp.com",
  projectId: "folha-de-ponto-cafehyna",
  storageBucket: "folha-de-ponto-cafehyna.firebasestorage.app",
  messagingSenderId: "939903120504",
  appId: "1:939903120504:web:0a0c75fa171e803636e98d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Faz login anônimo automaticamente
signInAnonymously(auth).catch(console.error);

// Promise para saber quando a auth está pronta
export const authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    if (user) resolve(user);
  });
});
