import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyC0Sw5xNTJ7Av1av-JQ5y9_jN5s2F-_6a8",
  authDomain: "forsar-e47dd.firebaseapp.com",
  projectId: "forsar-e47dd",
  storageBucket: "forsar-e47dd.firebasestorage.app", 
  messagingSenderId: "695992177918",
  appId: "1:695992177918:web:ab7ae3e16b4f3143c281af",
  measurementId: "G-LNB23ZQBS1"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
