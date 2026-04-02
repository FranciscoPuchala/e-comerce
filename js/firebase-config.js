// ============================================================
//  Firebase Configuration
//  Replace the values below with your Firebase project config.
//  To get these values:
//    1. Go to https://console.firebase.google.com
//    2. Create a project (or open existing)
//    3. Project settings → Your apps → Web app → Config
// ============================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyAhlrA-2a8tbPbqy01S2t_HuizPTzg_gcY",
  authDomain: "e-comerce-fae38.firebaseapp.com",
  projectId: "e-comerce-fae38",
  storageBucket: "e-comerce-fae38.firebasestorage.app",
  messagingSenderId: "896376001375",
  appId: "1:896376001375:web:337e46b8950fddded71cea"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
