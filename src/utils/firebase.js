import { initializeApp } from "firebase/app";
import { getFirestore, setLogLevel } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- PASO 1 ---
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

// --- PASO 2 ---
// Inicializa Firebase con tu configuración personal.
let db, auth;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  setLogLevel('debug'); // Opcional: para ver logs en la consola
} catch (e) {
  console.error("Error inicializando Firebase:", e);
}

// --- PASO 3 ---
// Exporta las instancias de tu proyecto.
// (Nota: Ya no exportamos 'appId', no es necesario).
export { db, auth };
