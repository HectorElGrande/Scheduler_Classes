import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

// --- IMPORTAR FIREBASE ---
import {
  db, auth, storage, googleProvider,
  signInWithPopup, signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from './utils/firebase'; // <-- CORREGIDO
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, onSnapshot, query, where, // Añadir where
  doc, addDoc, setDoc, updateDoc, deleteDoc, getDocs // Añadir getDocs
} from "firebase/firestore";

// --- IMPORTAR FUNCIONES DE AYUDA ---
import { toYYYYMMDD } from './utils/dates'; // <-- CORREGIDO
import { detectarSolapamiento, calcularDuracionEnHoras } from './utils/helpers'; // <-- CORREGIDO

// --- IMPORTAR COMPONENTES ---
import Sidebar from './components/Sidebar'; // <-- CORREGIDO
import CabeceraApp from './components/CabeceraApp'; // <-- CORREGIDO
import CabeceraSemana from './components/CabeceraSemana'; // <-- CORREGIDO
import CabeceraMes from './components/CabeceraMes'; // <-- CORREGIDO
import VistaSemana from './components/VistaSemana'; // <-- CORREGIDO
import VistaDia from './components/VistaDia'; // <-- CORREGIDO
import VistaMes from './components/VistaMes'; // <-- CORREGIDO
import ClaseModal from './components/ClaseModal'; // <-- CORREGIDO
import DetalleClaseModal from './components/DetalleClaseModal'; // <-- CORREGIDO
import AuthScreen from './components/AuthScreen'; // <-- CORREGIDO
import ProfileModal from './components/ProfileModal'; // <-- CORREGIDO
import AlumnoDetalleModal from './components/AlumnoDetalleModal'; // <-- CORREGIDO
import Dashboard from './components/Dashboard';// <-- CORREGIDO
import Morosos from './components/CuentasPorCobrar';


// --- Componente Principal de la Aplicación ---
export default function App() {
  // --- Estado de Datos ---
  const [clases, setClases] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // <-- ESTADO CLAVE

  // --- Estado de Carga y UI ---
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vista, setVista] = useState('mes');

  // --- Estado de Modales ---
  const [modalAbierto, setModalAbierto] = useState(false);
  const [claseParaEditar, setClaseParaEditar] = useState(null);
  const [claseSeleccionada, setClaseSeleccionada] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedAlumnoForDetail, setSelectedAlumnoForDetail] = useState(null);
  const [isAlumnoDetailModalOpen, setIsAlumnoDetailModalOpen] = useState(false);

  // --- Efectos (Auth, Carga de Datos, Perfil) ---
  useEffect(() => {
    if (!auth) { console.warn("Auth no está listo todavía."); setIsLoading(false); setIsAuthReady(false); return; }
    setIsLoading(true);
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setIsAuthReady(true);
      } else {
        setUser(null);
        setUserProfile(null); // Limpiar perfil al cerrar sesión
        setIsAuthReady(true);
        setClases([]);
        setAlumnos([]);
        setIsDataLoading(false);
      }
      setIsLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // --- Efecto para Cargar Perfil, Clases y Alumnos ---
  useEffect(() => {
    if (!isAuthReady || !user) {
      if (isAuthReady && !user) setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);

    // 1. Listener para Perfil de Usuario (Honorarios)
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const profileData = docSnap.data();
        setUserProfile(profileData);
        console.log("Perfil de Usuario cargado/actualizado. Precio Hora:", profileData.precioHora);
      } else {
        // Inicializar perfil si no existe (ej: después de un registro)
        const defaultProfile = { precioHora: 0 };
        setDoc(userDocRef, defaultProfile, { merge: true }).catch(e => console.error("Error setting default profile:", e));
        setUserProfile(defaultProfile);
        console.log("Perfil de Usuario inicializado. Precio Hora: 0");
      }
    }, (error) => { console.error("Error al escuchar Perfil:", error); setUserProfile(null); });


    // 2. Listener para Clases
    const clasesPath = `users/${user.uid}/clases`;
    const qClases = query(collection(db, clasesPath));
    const unsubscribeClases = onSnapshot(qClases, (snapshot) => {
      const clasesData = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data && typeof data.materia === 'string') {
          clasesData.push({ ...data, id: doc.id });
        }
      });
      setClases(clasesData);
    }, (error) => { console.error("Error al escuchar Clases:", error); setClases([]); setIsDataLoading(false); });

    // 3. Listener para Alumnos
    const alumnosPath = `users/${user.uid}/alumnos`;
    const qAlumnos = query(collection(db, alumnosPath));
    const unsubscribeAlumnos = onSnapshot(qAlumnos, (snapshot) => {
      const alumnosData = [];
      snapshot.forEach(doc => {
        if (doc.data() && doc.data().nombre) {
          alumnosData.push({ ...doc.data(), id: doc.id });
        }
      });
      setAlumnos(alumnosData);
      setIsDataLoading(false);
    }, (error) => { console.error("Error al escuchar Alumnos:", error); setAlumnos([]); setIsDataLoading(false); });

    return () => { unsubscribeProfile(); unsubscribeClases(); unsubscribeAlumnos(); };
  }, [isAuthReady, user]);


  // --- FUNCIONES DE AUTENTICACIÓN Y PERFIL ---
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
  }

  const handleEmailRegister = async (email, password, displayName) => {
    if (!auth) throw new Error("Auth no inicializado");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      // Crear perfil por defecto en Firestore
      const docRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(docRef, { precioHora: 0 }); // <-- INICIALIZAR PRECIO
      setUser({ ...userCredential.user, displayName });
    }
  };

  const handleEmailLogin = async (email, password) => {
    if (!auth) throw new Error("Auth not initialized");
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Email Sign In successful.");
  };

  const handleLogout = async () => {
    if (!auth) { console.error("Auth not initialized"); return; }
    try {
      await signOut(auth);
    } catch (error) { console.error("Error signing out:", error); alert(`Error al cerrar sesión: ${error.message}`); }
  };

  // --- LÓGICA DE PERFIL (AJUSTADA PARA HONORARIOS) ---
  const handleSaveProfile = async (fotoFileOrUrl, nuevoNombre, nuevoPrecioHora) => {
    if (!user || !auth.currentUser) { console.error("Usuario no disponible para guardar perfil."); return; }

    let photoURLToSave = user.photoURL;

    // Si la entrada es una URL (avatar preseleccionado), usarla directamente.
    if (typeof fotoFileOrUrl === 'string' && fotoFileOrUrl) {
      photoURLToSave = fotoFileOrUrl;
    }

    try {
      // 1. Actualizar el perfil de autenticación de Firebase (nombre y foto)
      await updateProfile(auth.currentUser, {
        displayName: nuevoNombre,
        photoURL: photoURLToSave
      });

      // 2. Actualizar el documento de perfil en Firestore (precioHora)
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        precioHora: parseFloat(nuevoPrecioHora) || 0
      }, { merge: true });

      // 3. Actualizar el estado local 'user' y 'userProfile'
      setUser(prevUser => ({
        ...prevUser,
        displayName: nuevoNombre,
        photoURL: photoURLToSave
      }));
      setUserProfile(prevProfile => ({
        ...prevProfile,
        precioHora: parseFloat(nuevoPrecioHora) || 0
      }));

      console.log("Perfil y Honorarios actualizados.");
      setIsProfileModalOpen(false);
    } catch (error) {
      console.error("Error al actualizar el perfil de Firebase:", error);
      throw new Error("No se pudo guardar la información del perfil.");
    }
  };


  // --- FUNCIONES CRUD PARA ALUMNOS ---
  const handleAddAlumno = async (alumnoData) => {
    if (!user) throw new Error("Usuario no autenticado");
    const collRef = collection(db, `users/${user.uid}/alumnos`);
    if ('id' in alumnoData) delete alumnoData.id;
    try {
      const docRef = await addDoc(collRef, alumnoData);
      return { ...alumnoData, id: docRef.id };
    } catch (error) {
      console.error("Error al añadir alumno:", error);
      alert(`Error al guardar el alumno: ${error.message}`);
      throw error;
    }
  };
  const handleUpdateAlumno = async (alumnoData) => {
    if (!user || !alumnoData.id) throw new Error("Faltan datos para actualizar alumno");
    const docRef = doc(db, `users/${user.uid}/alumnos`, alumnoData.id);
    const id = alumnoData.id;
    delete alumnoData.id;
    try {
      await setDoc(docRef, alumnoData);
      return { ...alumnoData, id: id };
    } catch (error) {
      alert(`Error al actualizar el alumno: ${error.message}`);
      throw error;
    }
  };
  const handleDeleteAlumno = async (alumnoId) => {
    if (!user || !alumnoId) throw new Error("Faltan datos para eliminar alumno");
    const alumnoNombre = alumnos.find(a => a.id === alumnoId)?.nombre;
    const clasesRef = collection(db, `users/${user.uid}/clases`);
    const q = query(clasesRef, where("alumno", "==", alumnoNombre));
    try {
      const querySnapshot = await getDocs(q);
    } catch (error) {
      alert("Error al verificar si el alumno tiene clases. Inténtalo de nuevo.");
      return;
    }
    const docRef = doc(db, `users/${user.uid}/alumnos`, alumnoId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      alert(`Error al eliminar el alumno: ${error.message}`);
      throw error;
    }
  };


  // --- LÓGICA DE CLASES (CRUD) ---
  const handleAddClaseClick = (fecha) => {
    const safeDate = (fecha instanceof Date && !isNaN(fecha)) ? fecha : new Date();
    const defaultInicio = "09:00";
    const defaultFin = "10:00";
    setClaseParaEditar({ materia: '', alumno: '', fecha: toYYYYMMDD(safeDate), inicio: defaultInicio, fin: defaultFin, nivel: '', estadoPago: 'No pagado', notas: '', id: null }); // Aseguramos que el id sea null
    setModalAbierto(true);
  };
  const handleEditClase = (clase) => {
    if (!clase) return;
    setClaseParaEditar(clase);
    setModalAbierto(true);
  };

  const handleSaveClase = async (claseData) => {
    if (!user) { console.error("Usuario no autenticado."); return; }
    if (!db) { console.error("Firestore no inicializado."); return; }

    const clasesPath = `users/${user.uid}/clases`;
    const isEditing = !!claseData.id;

    // Lógica de Cálculo de Ingresos
    const duracionHoras = calcularDuracionEnHoras(claseData.inicio, claseData.fin);
    const precioHora = userProfile?.precioHora || 0;
    const ingresoCalculado = duracionHoras * precioHora;

    // Preparar datos para Firestore
    // Usamos destructuring para extraer el 'id' y el 'userProfile' si estuvieran ahí,
    // y solo incluimos el resto de campos.
    const { id, userProfile: _, ...claseFields } = claseData;

    const dataToSave = {
      ...claseFields,
      duracionHoras: duracionHoras,
      ingreso: parseFloat(ingresoCalculado.toFixed(2)),
      fecha: toYYYYMMDD(new Date(claseData.fecha))
    };

    // Validaciones
    if (!claseData.materia?.trim() || !claseData.alumno?.trim() || !claseData.fecha || !claseData.inicio || !claseData.fin) {
      alert('Los campos Materia, Alumno, Fecha y Horas son obligatorios.'); return;
    }
    const claseSolapada = detectarSolapamiento(dataToSave, clases, id); // Usamos 'id' extraído
    if (claseSolapada) {
      alert(`¡Conflicto! Se solapa con: ${claseSolapada.materia} (${claseSolapada.alumno}) de ${claseSolapada.inicio} a ${claseSolapada.fin}.`); return;
    }

    try {
      if (isEditing) {
        // Actualizar (usamos el id original)
        const docRef = doc(db, clasesPath, id);
        await updateDoc(docRef, dataToSave);
      } else {
        // Añadir (dataToSave no tiene la propiedad 'id')
        await addDoc(collection(db, clasesPath), dataToSave);
      }
      setModalAbierto(false);
      setClaseParaEditar(null);
    } catch (error) {
      console.error("Error al guardar la clase:", error);
      alert("Error al guardar la clase. Revisa la consola para más detalles.");
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
  const handleOpenAlumnoDetail = (alumno) => {
    setSelectedAlumnoForDetail(alumno);
    setIsAlumnoDetailModalOpen(true);
  };


  // --- RENDERIZADO CONDICIONAL DE VISTAS ---
  const renderVista = () => {
    const readyClases = !isDataLoading ? (Array.isArray(clases) ? clases : []) : [];
    const safeDate = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();

    switch (vista) {
      case 'semana':
        return <VistaSemana fechaActual={safeDate} clases={readyClases} onSelectClase={setClaseSeleccionada} onAddClase={handleAddClaseClick} />;
      case 'dia':
        return <VistaDia fechaActual={safeDate} clases={readyClases} onSelectClase={setClaseSeleccionada} />;
      case 'dashboard':
        return <Dashboard
          clases={readyClases}
          userProfile={userProfile}
          fechaActual={safeDate}
        />;
      case 'morosos':
        return <Morosos
          clases={readyClases}
          alumnos={alumnos || []}
          userProfile={userProfile}
          onSaveClase={handleSaveClase}
        />;
      case 'mes':
      default:
        return <VistaMes
          fechaActual={safeDate}
          clases={readyClases}
          onSelectClase={setClaseSeleccionada}
          onAddClase={handleAddClaseClick}
          setVista={setVista}
          setFechaActual={setFechaActual}
        />;
    }
  };

  // --- RENDERIZADO PRINCIPAL ---
  if (isLoading) {
    return (<div className="flex h-screen items-center justify-center bg-slate-50 text-slate-700 font-semibold text-lg animate-pulse">Cargando...</div>);
  }

  if (isAuthReady && !user) {
    return (
      <AuthScreen
        onGoogleSignIn={handleGoogleSignIn}
        onEmailLogin={handleEmailLogin}
        onEmailRegister={handleEmailRegister}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar
        fechaActual={fechaActual || new Date()}
        setFechaActual={setFechaActual}
        clases={clases || []}
        alumnos={alumnos || []}
        onAddAlumno={handleAddAlumno}
        onUpdateAlumno={handleUpdateAlumno}
        onDeleteAlumno={handleDeleteAlumno}
        onOpenDetail={handleOpenAlumnoDetail}
        onSaveClase={handleSaveClase}
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
          onOpenDashboard={() => setVista('dashboard')}
          onOpenMorosos={() => setVista('morosos')}
        />
        <div className="flex-1 flex flex-col overflow-auto">
          {vista !== 'dashboard' && vista !== 'morosos' && <CabeceraSemana fechaActual={fechaActual || new Date()} vista={vista} />}
          {vista !== 'dashboard' && vista !== 'morosos' && <CabeceraMes vista={vista} />}
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
          isLoading={false}
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
          onSave={handleSaveClase}
        />
      )}
      {isProfileModalOpen && (
        <ProfileModal
          user={user}
          userProfile={userProfile} // <-- PASAR userProfile
          onClose={() => setIsProfileModalOpen(false)}
          onSaveProfile={handleSaveProfile}
        />
      )}
      {isAlumnoDetailModalOpen && selectedAlumnoForDetail && (
        <AlumnoDetalleModal
          alumno={selectedAlumnoForDetail}
          clasesDelAlumno={clases.filter(c => c.alumno === selectedAlumnoForDetail.nombre)}
          onClose={() => {
            setIsAlumnoDetailModalOpen(false);
            setSelectedAlumnoForDetail(null);
          }}
        />
      )}

      {/* Botón Flotante */}
      {vista !== 'dashboard' && vista !== 'morosos' && (
        <button
          onClick={() => { handleAddClaseClick(fechaActual); }}
          disabled={!!isLoading || !user || isDataLoading}
          className={`fixed bottom-6 right-6 z-40 group flex items-center justify-start h-14 w-14 hover:w-48 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out overflow-hidden ${(!!isLoading || !user || isDataLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Añadir nueva clase"
        >
          <Plus
            size={28}
            className="shrink-0 ml-3.5 transition-transform duration-500 ease-in-out group-hover:rotate-90"
          />
          <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 ml-2 mr-4">Añadir nueva clase</span>
        </button>
      )}
    </div>
  );
}
