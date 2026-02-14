// src/database/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7qS2c6u2bmcUF_k6R-ys8at8627iic8w",
  authDomain: "donut-application.firebaseapp.com",
  projectId: "donut-application",
  storageBucket: "donut-application.firebasestorage.app",
  messagingSenderId: "856479171017",
  appId: "1:856479171017:web:a5fd09cd5bf67a7ebaa818"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// データベース（Firestore）を使えるようにしてエクスポート
export const db = getFirestore(app);