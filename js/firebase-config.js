/**
 * Firebase Configuration & Initialization
 * Uses Firebase v10+ Modular SDK via ESM CDN imports
 * Exports: db (Firestore), auth (Auth), storage (Storage)
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getStorage,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDummyKey-ReplaceWithYourActualKey",
  authDomain: "pahela-kadam.firebaseapp.com",
  projectId: "pahela-kadam",
  storageBucket: "pahela-kadam.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000",
};

const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager(),
    cacheSizeBytes: 40 * 1024 * 1024,
  }),
});

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
setPersistence(auth, browserLocalPersistence).catch(() => {});

const storage = getStorage(app);

export { app, db, auth, storage, provider };
