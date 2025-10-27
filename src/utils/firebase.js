import { initializeApp } from "firebase/app";
import { getFirestore, setLogLevel } from "firebase/firestore";
// --- MODIFICADO: Añadir imports ---
import { 
  getAuth, 
  GoogleAuthProvider, // <--- Añadir
  signInWithPopup,    // <--- Añadir
  signOut             // <--- Añadir
} from "firebase/auth";

// Pega aquí el objeto 'firebaseConfig' que copiaste de tu consola de Firebase.
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

// Inicializa Firebase con tu configuración personal.
let db, auth;
let app; // Guardamos la app para exportarla si es necesario en el futuro
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  setLogLevel('debug'); 
} catch (e) {
  console.error("Error inicializando Firebase:", e);
}

// --- NUEVO: Crear instancia del proveedor de Google ---
const googleProvider = new GoogleAuthProvider();

// Exporta las instancias y funciones necesarias.
export { 
  db, 
  auth, 
  googleProvider,   // <--- Exportar
  signInWithPopup, // <--- Exportar
  signOut          // <--- Exportar
};

