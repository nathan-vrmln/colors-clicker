// firebase.js
// Configuration et initialisation Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, doc, getDoc, setDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPr58te7wrSxZrFtnh17f3KeFiZAHNl6c",
  authDomain: "color-clicker-b0a73.firebaseapp.com",
  projectId: "color-clicker-b0a73",
  storageBucket: "color-clicker-b0a73.firebasestorage.app",
  messagingSenderId: "518303580846",
  appId: "1:518303580846:web:4f871abc157ae4240a233f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export Firestore functions
export { db, collection, doc, getDoc, setDoc, getDocs, query, orderBy, limit };
