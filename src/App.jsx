import React, { useState, useEffect } from 'react';
import { Plus, LogIn } from 'lucide-react'; // <-- LogOut ya no se importa aquí

// --- IMPORTAR TU FIREBASE ---
// (Importa las nuevas funciones)
import {
    db, auth, storage, googleProvider,
    signInWithPopup, signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from './utils/firebase';
import { onAuthStateChanged } from "firebase/auth";
import {
    collection, onSnapshot, query,
    doc, addDoc, setDoc, deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // <-- AÑADIR

// --- IMPORTAR FUNCIONES DE AYUDA ---
import { toYYYYMMDD } from './utils/dates';

// --- IMPORTAR COMPONENTES ---
import Sidebar from './components/Sidebar';
import CabeceraApp from './components/CabeceraApp';
import CabeceraSemana from './components/CabeceraSemana';
import CabeceraMes from './components/CabeceraMes';
import VistaSemana from './components/VistaSemana';
import VistaDia from './components/VistaDia';
import VistaMes from './components/VistaMes';
import ClaseModal from './components/ClaseModal';
import DetalleClaseModal from './components/DetalleClaseModal';
import AuthScreen from './components/AuthScreen'; // <-- AÑADIR
import ProfileModal from './components/ProfileModal'; // <-- AÑADIR


// --- Componente Principal de la Aplicación ---
export default function App() {
    const [clases, setClases] = useState([]);
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [fechaActual, setFechaActual] = useState(new Date());
    const [vista, setVista] = useState('mes');

    const [modalAbierto, setModalAbierto] = useState(false);
    const [claseParaEditar, setClaseParaEditar] = useState(null);
    const [claseSeleccionada, setClaseSeleccionada] = useState(null);

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // <-- AÑADIR


    // --- Efecto para Autenticación ---
    useEffect(() => {
        // ... (El useEffect de onAuthStateChanged se mantiene igual, 
        // pero ahora copiará el displayName y photoURL al registrarse)
        if (!auth) { console.warn("Auth no está listo todavía."); setIsLoading(false); setIsAuthReady(false); return; }
        setIsLoading(true);
        let unsubscribeAuth = () => { };
        try {
            unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    console.log("Usuario autenticado:", user.uid, user.displayName, user.photoURL);
                    setUser(user); // <-- El objeto user ya contiene photoURL y displayName
                    setIsAuthReady(true);
                } else {
                    console.log("No hay usuario logueado.");
                    setUser(null);
                    setIsAuthReady(true);
                    setClases([]);
                }
                setIsLoading(false);
            });
        } catch (e) { console.error("Error setting up onAuthStateChanged:", e); setIsLoading(false); setIsAuthReady(true); }
        return () => unsubscribeAuth();
    }, []);

    // --- Efecto para Cargar Clases desde Firestore ---
    // ... (Este useEffect se mantiene exactamente igual)
    useEffect(() => {
        if (!isAuthReady || !db || !user) {
            if (isAuthReady && !user) {
                setClases([]);
            }
            console.log(`Firestore listener: Waiting (isAuthReady=${isAuthReady}, db=${!!db}, user=${!!user})`);
            return;
        }
        console.log(`Firestore listener: Auth ready (userId: ${user.uid}), subscribing...`);
        const collPath = `users/${user.uid}/clases`;
        let unsubscribe = () => { };
        try {
            const q = query(collection(db, collPath));
            unsubscribe = onSnapshot(q, (snapshot) => {
                const clasesDesdeDB = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data && typeof data.materia === 'string') {
                        clasesDesdeDB.push({ ...data, id: doc.id });
                    } else { console.warn("Invalid doc data:", doc.id, data); }
                });
                console.log("Firestore data received:", clasesDesdeDB.length);
                setClases(clasesDesdeDB);
            }, (error) => {
                console.error("Error reading Firestore:", error);
                setClases([]);
            });
        } catch (e) { console.error("Error setting up Firestore listener:", e); }
        return () => {
            console.log("Firestore listener: Unsubscribing...");
            unsubscribe();
        };
    }, [isAuthReady, user]);


    // --- NUEVAS FUNCIONES DE AUTENTICACIÓN ---

    const handleGoogleSignIn = async () => {
        if (!auth) { console.error("Auth not initialized"); return; }
        try {
            console.log("Attempting Google Sign In...");
            await signInWithPopup(auth, googleProvider);
            console.log("Google Sign In successful (popup closed).");
        } catch (error) {
            console.error("Error signing in with Google:", error);
            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                alert(`Error al iniciar sesión: ${error.message}`);
            }
        }
    };

    const handleEmailRegister = async (email, password, displayName) => {
        if (!auth) throw new Error("Auth not initialized");
        // El 'await' aquí asegura que el error (si lo hay) se propague
        // al componente AuthScreen para que pueda mostrarlo.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Después de crear, actualiza el perfil con el nombre
        if (userCredential.user) {
            await updateProfile(userCredential.user, { displayName });
            // Forzamos una actualización del estado 'user' localmente
            // porque onAuthStateChanged puede tardar o no refrescar displayName
            setUser({ ...userCredential.user, displayName });
        }
        console.log("Registro y actualización de perfil exitosos.");
    };

    const handleEmailLogin = async (email, password) => {
        if (!auth) throw new Error("Auth not initialized");
        // Dejamos que el error se propague a AuthScreen
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Email Sign In successful.");
    };

    const handleLogout = async () => {
        if (!auth) { console.error("Auth not initialized"); return; }
        try {
            console.log("Attempting Sign Out...");
            await signOut(auth);
            console.log("Sign Out successful.");
        } catch (error) { console.error("Error signing out:", error); alert(`Error al cerrar sesión: ${error.message}`); }
    };

    // --- NUEVA FUNCIÓN DE PERFIL ---
    const handleSaveProfile = async (fotoFile, nuevoNombre) => {
        if (!user) {
            console.error("No hay usuario para actualizar el perfil.");
            return;
        }

        let fotoURL = user.photoURL; // Usa la foto existente por defecto

        // 1. Si hay un archivo nuevo, subirlo a Storage
        if (fotoFile) {
            console.log("Subiendo nueva foto de perfil...");
            // Crea una referencia única (p.ej., profiles/USER_ID/profile.jpg)
            const storageRef = ref(storage, `profiles/${user.uid}/profile-pic`);

            try {
                const snapshot = await uploadBytes(storageRef, fotoFile);
                fotoURL = await getDownloadURL(snapshot.ref); // Obtiene la nueva URL
                console.log("Foto subida, URL:", fotoURL);
            } catch (error) {
                console.error("Error al subir la foto:", error);
                throw new Error("No se pudo subir la foto de perfil.");
            }
        }

        // 2. Actualizar el perfil de autenticación de Firebase
        try {
            await updateProfile(auth.currentUser, {
                displayName: nuevoNombre,
                photoURL: fotoURL // Sea la nueva URL o la que ya tenía
            });

            // 3. Actualizar el estado local 'user' para reflejar los cambios INMEDIATAMENTE
            setUser(prevUser => ({
                ...prevUser,
                displayName: nuevoNombre,
                photoURL: fotoURL
            }));

            console.log("Perfil de Firebase actualizado.");
            setIsProfileModalOpen(false); // Cierra el modal
        } catch (error) {
            console.error("Error al actualizar el perfil de Firebase:", error);
            throw new Error("No se pudo guardar la información del perfil.");
        }
    };


    // --- LÓGICA DE CLASES (sin cambios) ---
    const handleAddClaseClick = (fecha) => {
        const safeDate = (fecha instanceof Date && !isNaN(fecha)) ? fecha : new Date();
        const defaultInicio = "09:00";
        const defaultFin = "10:00";
        setClaseParaEditar({ materia: '', alumno: '', fecha: toYYYYMMDD(safeDate), inicio: defaultInicio, fin: defaultFin, nivel: '', estadoPago: 'No pagado', notas: '' });
        setModalAbierto(true);
    };
    const handleEditClase = (clase) => {
        if (!clase) return;
        setClaseParaEditar(clase);
        setModalAbierto(true);
    };
    const handleSaveClase = async (claseData) => {
        // ... (Esta función se mantiene exactamente igual)
        console.log("App: handleSaveClase called with:", claseData);
        if (!isAuthReady || !db || !user) { console.error("Cannot save: App not ready or user not logged in."); alert("No puedes guardar. Asegúrate de haber iniciado sesión y espera a que cargue la aplicación."); return; }
        const collPath = `users/${user.uid}/clases`;
        try {
            if (!claseData || typeof claseData.materia !== 'string' || !claseData.materia.trim()) { console.error("Invalid data to save:", claseData); alert("Error: Datos inválidos."); return; }
            if (!claseData.fecha || !claseData.inicio || !claseData.fin) {
                console.error("Missing date/time fields:", claseData);
                alert("Error: Falta fecha u hora.");
                return;
            }
            if (claseData.id) {
                console.log("Attempting update:", claseData.id);
                const docRef = doc(db, collPath, claseData.id);
                const dataToSave = { ...claseData }; delete dataToSave.id;
                await setDoc(docRef, dataToSave);
                console.log("Update successful:", claseData.id);
            } else {
                console.log("Attempting add new");
                const dataToSave = { ...claseData };
                if ('id' in dataToSave) delete dataToSave.id;
                const docRef = await addDoc(collection(db, collPath), dataToSave);
                console.log("Add successful, new ID:", docRef.id);
            }
            setModalAbierto(false);
            setClaseParaEditar(null);
        } catch (error) {
            console.error("Error saving to Firestore:", error);
            alert(`Error al guardar: ${error.message}\nRevisa la consola para más detalles.`);
        }
    };
    const handleDeleteClase = async (id) => {
        // ... (Esta función se mantiene exactamente igual)
        if (!id) { console.warn("handleDeleteClase called with no ID"); return; }
        if (!isAuthReady || !db || !user) { console.error("Cannot delete: App not ready or user not logged in."); alert("No puedes eliminar. Asegúrate de haber iniciado sesión."); return; }
        const docPath = `users/${user.uid}/clases/${id}`;
        const confirmed = confirm("¿Seguro que quieres eliminar esta clase?");
        if (!confirmed) {
            console.log("Delete cancelled by user.");
            return;
        }
        try {
            console.log("Attempting delete:", id);
            await deleteDoc(doc(db, docPath));
            console.log("Delete successful:", id);
        }
        catch (error) { console.error("Error deleting from Firestore:", error); alert(`Error al eliminar: ${error.message}`); }
        section: "grid-cols"
    };
    const renderVista = () => {
        // ... (Esta función se mantiene exactamente igual)
        const readyClases = (isAuthReady && user) ? (Array.isArray(clases) ? clases : []) : [];
        const safeDate = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();
        switch (vista) {
            case 'semana': return <VistaSemana fechaActual={safeDate} clases={readyClases} onSelectClase={setClaseSeleccionada} />;
            case 'dia': return <VistaDia fechaActual={safeDate} clases={readyClases} onSelectClase={setClaseSeleccionada} />;
            case 'mes': default: return <VistaMes fechaActual={safeDate} clases={readyClases} onSelectClase={setClaseSeleccionada} onAddClase={handleAddClaseClick} />;
        }
    };


    // --- RENDERIZADO PRINCIPAL (Modificado) ---

    if (isLoading) {
        return (<div className="flex h-screen items-center justify-center bg-slate-50 text-slate-700 font-semibold text-lg animate-pulse">Cargando calendario...</div>);
        section: "items-center"
    }

    // Muestra la nueva pantalla de Autenticación si está listo pero no hay usuario
    if (isAuthReady && !user) {
        return (
            <AuthScreen
                onGoogleSignIn={handleGoogleSignIn}
                onEmailLogin={handleEmailLogin}
                onEmailRegister={handleEmailRegister}
            />
        );
    }

    // App principal (solo se muestra si está listo Y hay usuario)
    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
            <Sidebar fechaActual={fechaActual || new Date()} setFechaActual={setFechaActual} clases={clases || []} />
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
                <CabeceraApp
                    vista={vista}
                    setVista={setVista}
                    fechaActual={fechaActual || new Date()}
                    setFechaActual={setFechaActual}
                    user={user}
                    onLogout={handleLogout}
                    onOpenProfile={() => setIsProfileModalOpen(true)} // <-- Pasar handler
                />
                <div className="flex-1 flex flex-col overflow-auto">
                    <CabeceraSemana fechaActual={fechaActual || new Date()} vista={vista} />
                    <CabeceraMes vista={vista} />
                    {renderVista()}
                </div>
            </main>

            {/* Modales */}
            {modalAbierto && (<ClaseModal clase={claseParaEditar} clases={clases || []} onClose={() => { setModalAbierto(false); setClaseParaEditar(null); }} onSave={handleSaveClase} onDelete={handleDeleteClase} isLoading={isLoading} />)}
            {claseSeleccionada && (<DetalleClaseModal clase={claseSeleccionada} onClose={() => setClaseSeleccionada(null)} onEdit={handleEditClase} onDelete={handleDeleteClase} onSave={handleSaveClase} />)}
            {isProfileModalOpen && (
                <ProfileModal
                    user={user}
                    onClose={() => setIsProfileModalOpen(false)}
                    onSaveProfile={handleSaveProfile}
                />
            )} {/* <-- Renderizar modal de perfil */}

            <button onClick={() => !isLoading && user && handleAddClaseClick(fechaActual)} disabled={!!isLoading || !user} className={`fixed bottom-6 right-6 z-40 group flex items-center justify-start h-14 w-14 hover:w-48 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out overflow-hidden ${(!!isLoading || !user) ? 'opacity-50 cursor-not-allowed' : ''}`} aria-label="Añadir nueva clase">
                <Plus size={28} className="shrink-0 ml-3.5" />
                <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 ml-2 mr-4">Añadir nueva clase</span>
            </button>
        </div>
    );
}