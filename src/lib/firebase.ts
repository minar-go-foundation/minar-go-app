import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBTDKW1cg_RC7Ep0gzEC8i3n8F9Fh9ACF0",
  authDomain: "minar-go-foundation.firebaseapp.com",
  databaseURL: "https://minar-go-foundation-default-rtdb.firebaseio.com",
  projectId: "minar-go-foundation",
  storageBucket: "minar-go-foundation.firebasestorage.app",
  messagingSenderId: "268764593174",
  appId: "1:268764593174:web:a28f1e6244c71a9aee0937"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { app, database, auth };