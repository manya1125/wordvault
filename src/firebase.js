
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBcN0ssX9vlZwk-1keW-l1m0ybEtygGqtE",
  authDomain: "wordvault-45984.firebaseapp.com",
  projectId: "wordvault-45984",
  storageBucket: "wordvault-45984.firebasestorage.app",
  messagingSenderId: "454185842376",
  appId: "1:454185842376:web:f1c44ca3e03b62ddd0d7fd",
  measurementId: "G-226K2GC5TK"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)