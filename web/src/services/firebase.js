// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBUcqGFXk9_JdGA-GNLj5tISnLZW_6JqGA",
  authDomain: "docfinder-6c361.firebaseapp.com",
  projectId: "docfinder-6c361",
  storageBucket: "docfinder-6c361.firebasestorage.app",
  messagingSenderId: "744302204979",
  appId: "1:744302204979:web:eb1604fbb47dea4d73eb46"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
