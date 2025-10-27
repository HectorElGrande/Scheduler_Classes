// Importa las funciones que necesitas de los SDKs de Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // <-- AÑADIR
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut,
    createUserWithEmailAndPassword, // <-- AÑADIR
    signInWithEmailAndPassword,     // <-- AÑADIR
    updateProfile                   // <-- AÑADIR
} from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDHr2j-JEgGi0lHTcsDV1hysN3kAdezVrU",
  authDomain: "schedulerclass-fc93e.firebaseapp.com",
  projectId: "schedulerclass-fc93e",
  storageBucket: "schedulerclass-fc93e.firebasestorage.app",
  messagingSenderId: "504482779605",
  appId: "1:504482779605:web:cebf0f30e1fb336e05ed5c",
  measurementId: "G-2NFQTJEPVB"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios que usarás en tu aplicación
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app); // <-- AÑADIR
export const googleProvider = new GoogleAuthProvider();

// Exporta las funciones de autenticación que importaste en App.jsx
export { 
    signInWithPopup, 
    signOut,
    createUserWithEmailAndPassword, // <-- AÑADIR
    signInWithEmailAndPassword,     // <-- AÑADIR
    updateProfile                   // <-- AÑADIR
};