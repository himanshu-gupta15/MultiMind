// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDTn9etdn9Rfao57QdAydYqk_2zb84Tp4g",
  authDomain: "multimind-de134.firebaseapp.com",
  projectId: "multimind-de134",
  storageBucket: "multimind-de134.firebasestorage.app",
  messagingSenderId: "1082070016608",
  appId: "1:1082070016608:web:1db3c59b3a0c9bf5559905",
  measurementId: "G-ECQX9BJVD2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth=getAuth(app)
export const googleProvider=new GoogleAuthProvider()