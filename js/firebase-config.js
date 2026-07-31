/**
 * Firebase Configuration & Initialization
 * Uses Firebase v10+ Modular SDK via ESM CDN imports
 * Exports: db (Firestore), auth (Auth), storage (Storage)
 *
 * Uses memory-only cache (getFirestore) instead of persistentLocalCache.
 * This ensures fresh data on every page load (no stale IndexedDB cache),
 * while still caching within the same session for fast navigation.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    browserLocalPersistence,
    getAuth,
    GoogleAuthProvider,
    setPersistence,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDbZFuul2E_RFMDU4bUECzB8z1xlYaNO0g",
  authDomain: "phela-kadam.firebaseapp.com",
  projectId: "phela-kadam",
  storageBucket: "phela-kadam.firebasestorage.app",
  messagingSenderId: "252753109321",
  appId: "1:252753109321:web:4888ddcc8f2840a6563a98",
  measurementId: "G-7N1PW87YFC",
};

const app = initializeApp(firebaseConfig);

// Memory-only cache — fast within session, fresh on every page load
const db = getFirestore(app);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
setPersistence(auth, browserLocalPersistence).catch(() => {});

const storage = getStorage(app);

export { app, auth, db, provider, storage };
