import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

// --- IMPORTAR FIREBASE ---
import {
    db, auth, storage, googleProvider,
    signInWithPopup, signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from './utils/firebase';
import { onAuthStateChanged } from "firebase/auth";
import {
    collection, onSnapshot, query, where, // Añadir where
    doc, addDoc, setDoc, deleteDoc, getDocs // Añadir getDocs
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- IMPORTAR FUNCIONES DE AYUDA ---
import { toYYYYMMDD, getInicioSemana, addDays } from './utils/dates';
import { detectarSolapamiento } from './utils/helpers';

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
import AuthScreen from './components/AuthScreen';
import ProfileModal from './components/ProfileModal';
// No necesitamos importar AlumnoModal aquí, se usa dentro de Sidebar y ClaseModal


// --- Componente Principal de la Aplicación ---
export default function App() {
    // --- Estado de Datos ---
    const [clases, setClases] = useState([]);
    const [alumnos, setAlumnos] = useState([]); // <-- Estado para alumnos
    const [user, setUser] = useState(null);

    // --- Estado de Carga y UI ---
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Carga inicial de Auth
    const [isDataLoading, setIsDataLoading] = useState(true); // Carga de Clases/Alumnos
    const [fechaActual, setFechaActual] = useState(new Date());
    const [vista, setVista] = useState('mes');

    // --- Estado de Modales ---
    const [modalAbierto, setModalAbierto] = useState(false);
    const [claseParaEditar, setClaseParaEditar] = useState(null);
    const [claseSeleccionada, setClaseSeleccionada] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // --- Efecto para Autenticación ---
    useEffect(() => {
        console.log("Auth Effect: Iniciando..."); // LOG 1
        if (!auth) { console.warn("Auth no está listo todavía."); setIsLoading(false); setIsAuthReady(false); return; }
        setIsLoading(true);
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            console.log("Auth Effect: onAuthStateChanged callback ejecutado."); // LOG 2
            if (user) {
                console.log("Auth Effect: Usuario encontrado:", user.uid); // LOG 3
                setUser(user);
                setIsAuthReady(true); // Auth está lista
                // La carga de datos se dispara en el otro useEffect
            } else {
                console.log("Auth Effect: No hay usuario."); // LOG 4
                setUser(null);
                setIsAuthReady(true);
                setClases([]); // Limpiar datos si no hay usuario
                setAlumnos([]);
                setIsDataLoading(false); // No hay datos que cargar si no hay usuario
            }
            console.log("Auth Effect: Setting isLoading to false."); // LOG 5
            setIsLoading(false); // Termina la carga *de autenticación*
        });
        return () => {
            console.log("Auth Effect: Limpiando listener."); // LOG 6
            unsubscribeAuth();
        }
    }, []); // Solo se ejecuta al montar

    // --- Efecto para Cargar Clases y Alumnos ---
    useEffect(() => {
        // Esperar a que Auth esté lista Y que haya un usuario
        if (!isAuthReady || !user) {
            console.log(`Data Effect: Esperando Auth Ready (${isAuthReady}) o User (${!!user})`);
            // Si Auth está lista pero NO hay user, aseguramos que DataLoading sea false
            if (isAuthReady && !user) setIsDataLoading(false);
            return;
        }

        console.log("Data Effect: Auth Ready y User presente. Activando listeners...");
        setIsDataLoading(true); // Indicar que empezamos a cargar datos

        // Listener para Clases
        const clasesPath = `users/${user.uid}/clases`;
        const qClases = query(collection(db, clasesPath));
        const unsubscribeClases = onSnapshot(qClases, (snapshot) => {
            const clasesData = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data && typeof data.materia === 'string') { // Validación básica
                    clasesData.push({ ...data, id: doc.id });
                }
            });
            setClases(clasesData);
            console.log("Data Effect: Clases actualizadas:", clasesData.length);
            // No ponemos DataLoading a false aquí, esperamos a los alumnos
        }, (error) => {
            console.error("Data Effect: Error al escuchar Clases:", error);
            setClases([]);
            setIsDataLoading(false); // Error -> parar carga
        });

        // Listener para Alumnos
        const alumnosPath = `users/${user.uid}/alumnos`;
        const qAlumnos = query(collection(db, alumnosPath));
        const unsubscribeAlumnos = onSnapshot(qAlumnos, (snapshot) => {
            const alumnosData = [];
            snapshot.forEach(doc => {
                // Validación básica (ej: que tenga nombre)
                if (doc.data() && doc.data().nombre) {
                    alumnosData.push({ ...doc.data(), id: doc.id });
                }
            });
            setAlumnos(alumnosData);
            console.log("Data Effect: Alumnos actualizados:", alumnosData.length);
            setIsDataLoading(false); // Ahora sí, termina la carga de datos
        }, (error) => {
            console.error("Data Effect: Error al escuchar Alumnos:", error);
            setAlumnos([]);
            setIsDataLoading(false); // Error -> parar carga
        });

        // Función de limpieza: desuscribirse de ambos listeners
        return () => {
            console.log("Data Effect: Limpiando listeners de Clases y Alumnos.");
            unsubscribeClases();
            unsubscribeAlumnos();
        };
    }, [isAuthReady, user]); // Se re-ejecuta si cambia el estado de Auth o el usuario


    // --- FUNCIONES DE AUTENTICACIÓN Y PERFIL (Sin cambios) ---
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
            await updateProfile(userCredential.user, { displayName });
            setUser({ ...userCredential.user, displayName });
        }
        console.log("Registro y actualización de perfil exitosos.");
    };
    const handleEmailLogin = async (email, password) => {
        if (!auth) throw new Error("Auth not initialized");
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
    const handleSaveProfile = async (fotoFile, nuevoNombre) => {
        if (!user) {
            console.error("No hay usuario para actualizar el perfil.");
            return;
        }
        let fotoURL = user.photoURL; // Usa la foto existente por defecto
        if (fotoFile) {
            console.log("Subiendo nueva foto de perfil...");
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
        try {
            await updateProfile(auth.currentUser, {
                displayName: nuevoNombre,
                photoURL: fotoURL // Sea la nueva URL o la que ya tenía
            });
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

    // --- FUNCIONES CRUD PARA ALUMNOS ---

    const handleAddAlumno = async (alumnoData) => {
        if (!user) throw new Error("Usuario no autenticado");
        console.log("Intentando añadir alumno:", alumnoData);
        const collRef = collection(db, `users/${user.uid}/alumnos`);
        if ('id' in alumnoData) delete alumnoData.id; // Asegurar que no lleva ID
        try {
            const docRef = await addDoc(collRef, alumnoData);
            console.log("Alumno añadido con ID:", docRef.id);
            return { ...alumnoData, id: docRef.id }; // Devolver alumno con ID
        } catch (error) {
            console.error("Error al añadir alumno:", error);
            alert(`Error al guardar el alumno: ${error.message}`);
            throw error;
        }
    };

    const handleUpdateAlumno = async (alumnoData) => {
        if (!user || !alumnoData.id) throw new Error("Faltan datos para actualizar alumno");
        console.log("Intentando actualizar alumno:", alumnoData.id);
        const docRef = doc(db, `users/${user.uid}/alumnos`, alumnoData.id);
        const id = alumnoData.id;
        delete alumnoData.id; // No guardar id dentro del documento
        try {
            await setDoc(docRef, alumnoData); // setDoc sobreescribe
            console.log("Alumno actualizado:", id);
            return { ...alumnoData, id: id }; // Devolver por si acaso
        } catch (error) {
            console.error("Error al actualizar alumno:", error);
            alert(`Error al actualizar el alumno: ${error.message}`);
            throw error;
        }
    };

    const handleDeleteAlumno = async (alumnoId) => {
        if (!user || !alumnoId) throw new Error("Faltan datos para eliminar alumno");
        console.log("Intentando eliminar alumno:", alumnoId);

        // Comprobar si el alumno tiene clases asociadas
        const alumnoNombre = alumnos.find(a => a.id === alumnoId)?.nombre;
        if (!alumnoNombre) {
            alert("No se encontró el nombre del alumno para verificar clases.");
            return; // No se puede verificar
        }
        const clasesRef = collection(db, `users/${user.uid}/clases`);
        const q = query(clasesRef, where("alumno", "==", alumnoNombre));
        try {
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                alert(`No se puede eliminar a este alumno porque tiene ${querySnapshot.size} clase(s) asociada(s). Elimina o reasigna primero sus clases.`);
                return; // Detener eliminación
            }
        } catch (error) {
            console.error("Error al comprobar clases asociadas:", error);
            alert("Error al verificar si el alumno tiene clases. Inténtalo de nuevo.");
            return;
        }

        // Si no hay clases, eliminar alumno
        const docRef = doc(db, `users/${user.uid}/alumnos`, alumnoId);
        try {
            await deleteDoc(docRef);
            console.log("Alumno eliminado:", alumnoId);
            // Aquí podrías cerrar el AlumnoModal si estuviera abierto para este ID
        } catch (error) {
            console.error("Error al eliminar alumno:", error);
            alert(`Error al eliminar el alumno: ${error.message}`);
            throw error;
        }
    };


    // --- LÓGICA DE CLASES (CRUD) ---
    const handleAddClaseClick = (fecha) => {
        console.log("handleAddClaseClick: Botón presionado."); // LOG 7
        const safeDate = (fecha instanceof Date && !isNaN(fecha)) ? fecha : new Date();
        setClaseParaEditar({
            materia: '',
            alumno: '', // Empezará vacío, se elige en el <select>
            fecha: toYYYYMMDD(safeDate),
            inicio: '09:00',
            fin: '10:00',
            nivel: '',
            estadoPago: 'No pagado',
            notas: '',
        });
        console.log("handleAddClaseClick: Setting modalAbierto to true."); // LOG 8
        setModalAbierto(true);
    };

    const handleEditClase = (clase) => {
        if (!clase) return;
        setClaseParaEditar(clase);
        setModalAbierto(true);
    };

    const handleSaveClase = async (claseData) => {
        if (!isAuthReady || !db || !user) {
            alert("La aplicación no está lista o no estás autenticado.");
            return;
        }
        const collPath = `users/${user.uid}/clases`;

        // Validación básica
        if (!claseData.materia?.trim() || !claseData.alumno?.trim() || !claseData.fecha || !claseData.inicio || !claseData.fin) {
            alert('Los campos Materia, Alumno, Fecha y Horas son obligatorios.'); return;
        }
        if (claseData.fin <= claseData.inicio) {
            alert('La hora de fin debe ser posterior a la de inicio.'); return;
        }

        // Detectar solapamiento
        const esEdicion = !!claseData.id;
        const claseSolapada = detectarSolapamiento(claseData, clases, esEdicion ? claseData.id : null);
        if (claseSolapada) {
            alert(`¡Conflicto! Se solapa con: ${claseSolapada.materia} (${claseSolapada.alumno}) de ${claseSolapada.inicio} a ${claseSolapada.fin}.`);
            return;
        }

        // Preparar datos (quitamos id si existe para no guardarlo dentro)
        const dataToSave = { ...claseData };
        const id = dataToSave.id; // Guardar id si es edición
        if (esEdicion) delete dataToSave.id;

        try {
            if (esEdicion) { // Actualizar
                const docRef = doc(db, collPath, id);
                await setDoc(docRef, dataToSave);
                console.log("Clase actualizada:", id);
            } else { // Crear
                if ('id' in dataToSave) delete dataToSave.id; // Seguridad extra
                const docRef = await addDoc(collection(db, collPath), dataToSave);
                console.log("Nueva clase creada:", docRef.id);
            }
            setModalAbierto(false);
            setClaseParaEditar(null);
        } catch (error) {
            console.error("Error al guardar clase en Firestore:", error);
            alert(`Error al guardar la clase: ${error.message}`);
        }
    };

    const handleDeleteClase = async (id) => {
        if (!id || !isAuthReady || !db || !user) {
            alert("No se puede eliminar la clase."); return;
        }
        const confirmed = confirm("¿Seguro que quieres eliminar esta clase?");
        if (!confirmed) return;

        const docPath = `users/${user.uid}/clases/${id}`;
        try {
            await deleteDoc(doc(db, docPath));
            console.log("Clase eliminada:", id);
            if (claseSeleccionada && claseSeleccionada.id === id) {
                setClaseSeleccionada(null);
            }
        } catch (error) {
            console.error("Error al eliminar clase:", error);
            alert(`Error al eliminar: ${error.message}`);
        }
    };


    // --- RENDERIZADO CONDICIONAL DE VISTAS ---
    const renderVista = () => {
        // Usamos isDataLoading para las clases/alumnos
        const readyClases = !isDataLoading ? (Array.isArray(clases) ? clases : []) : [];
        const safeDate = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();

        switch (vista) {
            case 'semana':
                return <VistaSemana fechaActual={safeDate} clases={readyClases} onSelectClase={setClaseSeleccionada} />;
            case 'dia':
                return <VistaDia fechaActual={safeDate} clases={readyClases} onSelectClase={setClaseSeleccionada} />;
            case 'mes':
            default:
                // VistaMes necesita onAddClase, que App.jsx provee
                return <VistaMes fechaActual={safeDate} clases={readyClases} onSelectClase={setClaseSeleccionada} onAddClase={handleAddClaseClick} />;
        }
    };

    // --- RENDERIZADO PRINCIPAL ---

    // 1. Carga Inicial (Auth)
    if (isLoading) {
        return (<div className="flex h-screen items-center justify-center bg-slate-50 text-slate-700 font-semibold text-lg animate-pulse">Cargando...</div>);
    }

    // 2. Pantalla de Autenticación
    if (isAuthReady && !user) {
        return (
            <AuthScreen
                onGoogleSignIn={handleGoogleSignIn}
                onEmailLogin={handleEmailLogin}
                onEmailRegister={handleEmailRegister}
            />
        );
    }

    // 3. App Principal (Usuario logueado)
    // LOG 9: Comprobar valores justo antes de renderizar
    console.log(`Renderizando App: isLoading=${isLoading}, isDataLoading=${isDataLoading}, user=${!!user}, modalAbierto=${modalAbierto}`);

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-800">

            {/* Sidebar recibe ahora la lista de alumnos y las funciones CRUD */}
            <Sidebar
                fechaActual={fechaActual || new Date()}
                setFechaActual={setFechaActual}
                clases={clases || []}
                alumnos={alumnos || []} // Pasar alumnos
                onAddAlumno={handleAddAlumno} // Pasar funciones CRUD
                onUpdateAlumno={handleUpdateAlumno}
                onDeleteAlumno={handleDeleteAlumno}
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
                <CabeceraApp
                    vista={vista}
                    setVista={setVista}
                    fechaActual={fechaActual || new Date()}
                    setFechaActual={setFechaActual}
                    user={user}
                    onLogout={handleLogout}
                    onOpenProfile={() => setIsProfileModalOpen(true)}
                />
                <div className="flex-1 flex flex-col overflow-auto">
                    <CabeceraSemana fechaActual={fechaActual || new Date()} vista={vista} />
                    <CabeceraMes vista={vista} />
                    {/* Indicador de carga para Clases/Alumnos */}
                    {isDataLoading ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500">Cargando datos...</div>
                    ) : renderVista()}
                </div>
            </main>

            {/* --- MODALES --- */}
            {modalAbierto && (
                <ClaseModal
                    clase={claseParaEditar}
                    clases={clases || []}
                    onClose={() => { setModalAbierto(false); setClaseParaEditar(null); }}
                    onSave={handleSaveClase}
                    onDelete={handleDeleteClase}
                    isLoading={false} // Podrías usar un estado específico como 'isSavingClase'
                    // Pasar alumnos y funciones CRUD para el modal rápido
                    alumnos={alumnos || []}
                    onAddAlumno={handleAddAlumno}
                    onUpdateAlumno={handleUpdateAlumno}
                    onDeleteAlumno={handleDeleteAlumno}
                />
            )}
            {claseSeleccionada && (
                <DetalleClaseModal
                    clase={claseSeleccionada}
                    onClose={() => setClaseSeleccionada(null)}
                    onEdit={handleEditClase}
                    onDelete={handleDeleteClase}
                    onSave={handleSaveClase} // Permite cambiar pago desde detalles
                />
            )}
            {isProfileModalOpen && (
                <ProfileModal
                    user={user}
                    // No pasamos userProfile ya que ProfileModal no maneja precioHora ahora
                    onClose={() => setIsProfileModalOpen(false)}
                    onSaveProfile={handleSaveProfile} // Versión simplificada sin precioHora
                />
            )}

            {/* Botón Flotante Añadir Clase */}
            <button
                // LOG 10: Log en el onClick
                onClick={() => { console.log("Botón + Clicked!"); handleAddClaseClick(fechaActual); }}
                disabled={!!isLoading || !user || isDataLoading} // Deshabilitar también si los datos están cargando
                className={`fixed bottom-6 right-6 z-40 group flex items-center justify-start h-14 w-14 hover:w-48 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out overflow-hidden ${(!!isLoading || !user || isDataLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Añadir nueva clase"
            >
                <Plus size={28} className="shrink-0 ml-3.5" />
                <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 ml-2 mr-4">Añadir nueva clase</span>
            </button>
        </div>
    );
}

