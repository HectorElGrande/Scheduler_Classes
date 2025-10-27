import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'; // Añadido useEffect
import { 
  Plus, Trash2, Calendar, Clock, BookOpen, User, 
  ChevronLeft, ChevronRight, X, Edit2, 
  Tag, FileText, ChevronDown, DollarSign 
} from 'lucide-react';
// --- NUEVO: Imports de Firebase ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, query, 
  doc, addDoc, setDoc, deleteDoc, setLogLevel
} from "firebase/firestore";
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged 
} from "firebase/auth";

// --- NUEVO: Configuración de Firebase ---
// Estas variables (__app_id, __firebase_config, __initial_auth_token) 
// son proporcionadas automáticamente por el entorno.
const appId = typeof __app_id !== 'undefined' ? __app_id : (typeof window !== 'undefined' && window.__app_id) ? window.__app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : (typeof window !== 'undefined' ? (window.__firebase_config || '{}') : '{}'));
let db, auth;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  setLogLevel('debug'); // Habilita logs de Firestore en la consola
} catch (e) {
  console.error("Error inicializando Firebase:", e);
}

// --- Constantes y Datos Iniciales ---
const DIAS_SEMANA_COMPLETO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HORAS_DIA = Array.from({ length: 13 }, (_, i) => 8 + i); // 8:00 a 20:00

/**
 * Convierte una fecha a 'YYYY-MM-DD' (local)
 */
const toYYYYMMDD = (date) => {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

/**
 * Añade días a una fecha
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Formatea una fecha (ej: 'Lunes, 1 de Enero')
 */
const formatFecha = (date, options) => {
  // Usamos es-ES para el formato de fecha español
  return new Intl.DateTimeFormat('es-ES', {
    ...options,
    timeZone: 'Europe/Madrid', // Aseguramos la zona horaria
  }).format(date);
};

/**
 * Obtiene el primer día de la semana (Lunes)
 */
const getInicioSemana = (date) => {
  const d = new Date(date);
  const diaSemana = d.getDay(); // Domingo = 0, Lunes = 1, ... Sábado = 6
  // Ajustar para que Lunes (1) sea el primer día. Si es Domingo (0), retrocede 6 días.
  const diff = d.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); 
  return new Date(d.setDate(diff));
};

/**
 * Genera la matriz de 6x7 días para la vista de mes
 */
const getMatrizMes = (date) => {
  const anio = date.getFullYear();
  const mes = date.getMonth();
  const primerDiaMes = new Date(anio, mes, 1);
  const primerDiaSemana = getInicioSemana(primerDiaMes); // Lunes de la primera semana
  
  const dias = [];
  let diaActual = new Date(primerDiaSemana);
  
  for (let i = 0; i < 42; i++) { // 6 semanas * 7 dias = 42 celdas
    dias.push(new Date(diaActual));
    diaActual.setDate(diaActual.getDate() + 1);
  }
  return dias;
};

/**
 * Detecta solapamiento de clases
 */
const detectarSolapamiento = (nuevaClase, clasesExistentes, idActual) => {
  for (const clase of clasesExistentes) {
    // No comparar consigo misma (si es edición)
    if (idActual && clase.id === idActual) {
      continue;
    }

    // Solo comprobar en la misma fecha
    if (clase.fecha === nuevaClase.fecha) {
      // Lógica de solapamiento: (InicioA < FinB) y (FinA > InicioB)
      const haySolapamiento = 
        nuevaClase.inicio < clase.fin && 
        nuevaClase.fin > clase.inicio;
        
      if (haySolapamiento) {
        return clase; // Devuelve la clase que genera el conflicto
      }
    }
  }
  return null; // No hay solapamiento
};


// --- Componentes de la UI ---

/**
 * Mini Calendario para el Sidebar (CON POPOVER AL HOVER)
 */
function MiniCalendario({ fechaActual, setFechaActual, clases }) {
  const [mesMostrado, setMesMostrado] = useState(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1));
  
  // --- Estados para el Popover ---
  const [hoveredDay, setHoveredDay] = useState(null); // Almacena { ymd, target }
  const [hoveredClases, setHoveredClases] = useState([]);
  const calendarRef = useRef(null); // Ref para el contenedor del calendario
  // --- Fin Estados Popover ---

  const diasMes = useMemo(() => getMatrizMes(mesMostrado), [mesMostrado]);
  const hoyYMD = toYYYYMMDD(new Date());
  const fechaActualYMD = toYYYYMMDD(fechaActual);

  // MODIFICADO: Ahora almacena el array de clases por día, no solo el contador
  const clasesPorDia = useMemo(() => {
    const map = new Map();
    if (!clases) return map;
    for (const clase of clases) {
      const list = map.get(clase.fecha) || [];
      list.push(clase);
      // Ordenamos las clases por hora de inicio
      map.set(clase.fecha, list.sort((a,b) => a.inicio.localeCompare(b.inicio)));
    }
    return map;
  }, [clases]);

  const irMesAnterior = () => {
    setMesMostrado(new Date(mesMostrado.getFullYear(), mesMostrado.getMonth() - 1, 1));
    setHoveredDay(null); // Ocultar popover al cambiar
  };
  
  const irMesSiguiente = () => {
    setMesMostrado(new Date(mesMostrado.getFullYear(), mesMostrado.getMonth() + 1, 1));
    setHoveredDay(null); // Ocultar popover al cambiar
  };

  // --- Handlers para el Popover ---
  const handleDayHover = (e, ymd, clasesDia) => {
    if (clasesDia && clasesDia.length > 0) {
      setHoveredDay({ ymd, target: e.currentTarget }); // Guardamos el botón que activó el hover
      setHoveredClases(clasesDia);
    } else {
      setHoveredDay(null);
      setHoveredClases([]);
    }
  };

  const handleMouseLeaveCalendar = () => {
    // Oculta el popover cuando el ratón sale del *contenedor* del calendario
    setHoveredDay(null);
    setHoveredClases([]);
  };
  
  // Calcula la posición del popover
  const popoverStyle = useMemo(() => {
    if (!hoveredDay || !hoveredDay.target || !calendarRef.current) {
      return { display: 'none' };
    }
    
    // Obtenemos las coordenadas del botón (target) y del contenedor (calendarRef)
    const targetRect = hoveredDay.target.getBoundingClientRect();
    const containerRect = calendarRef.current.getBoundingClientRect();
    
    // Calculamos la posición del popover *relativa* al contenedor
    // Posición Vertical: Centrado con el botón
    const top = targetRect.top - containerRect.top + (targetRect.height / 2);
    // Posición Horizontal: A la derecha del botón
    const left = targetRect.left - containerRect.left + targetRect.width + 10; // 10px de margen

    return {
      display: 'block',
      position: 'absolute', // Se posiciona relativo al 'relative' del contenedor
      top: `${top}px`,
      left: `${left}px`,
      transform: 'translateY(-50%)', // Centra verticalmente el popover
      zIndex: 50, // Asegura que esté por encima de otros elementos del sidebar
    };
  }, [hoveredDay]);
  // --- Fin Lógica Popover ---


  return (
    // MODIFICADO: Añadido ref, position: relative y onMouseLeave
    <div 
      ref={calendarRef} 
      className="relative bg-slate-50 p-4 rounded-lg border border-slate-200" 
      onMouseLeave={handleMouseLeaveCalendar}
    >
      <div className="flex justify-between items-center mb-3">
         <h4 className="text-sm font-semibold text-slate-700 capitalize">
           {formatFecha(mesMostrado, { month: 'long', year: 'numeric' })}
         </h4>
         <div className="flex gap-1">
           <button onClick={irMesAnterior} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700">
             <ChevronLeft size={18} />
           </button>
           <button onClick={irMesSiguiente} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700">
             <ChevronRight size={18} />
           </button>
         </div>
      </div>
      
      <div className="grid grid-cols-7 text-center mb-2">
        {/* FIX: Usamos el nombre completo del día (único) como key, no la inicial (duplicada "M") */}
        {DIAS_SEMANA_COMPLETO.map(dia => (
          <span key={dia} className="text-xs font-semibold text-slate-500 w-7">{dia.substring(0, 1)}</span>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {diasMes.map(dia => {
          const ymd = toYYYYMMDD(dia);
          const esHoy = ymd === hoyYMD;
          const esSeleccionado = ymd === fechaActualYMD;
          const esMesActual = dia.getMonth() === mesMostrado.getMonth();
          const clasesDia = clasesPorDia.get(ymd); // Es un array
          const numClases = clasesDia ? clasesDia.length : 0;
          
          return (
            <button 
              key={ymd} 
              onClick={() => setFechaActual(dia)}
              onMouseEnter={(e) => handleDayHover(e, ymd, clasesDia)} // Añadido onMouseEnter
              className={`
                relative p-1 text-xs rounded-full flex items-center justify-center w-7 h-7 m-auto
                transition-colors
                ${esHoy ? 'bg-indigo-600 text-white font-semibold' : ''}
                ${!esHoy && esSeleccionado ? 'bg-indigo-100 text-indigo-700 font-semibold' : ''}
                ${!esHoy && !esSeleccionado && esMesActual ? 'text-slate-700 hover:bg-slate-200' : ''}
                ${!esMesActual ? 'text-slate-300' : ''}
              `}
            >
              {dia.getDate()}
              {/* Indicador de punto si hay clases */}
              {numClases > 0 && esMesActual && !esHoy && !esSeleccionado && (
                <span className="absolute bottom-1 w-1 h-1 bg-indigo-400 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* --- Popover que muestra las clases al hacer hover --- */}
      {hoveredDay && hoveredClases.length > 0 && (
        <div 
          style={popoverStyle}
          className="bg-white p-3 rounded-lg shadow-xl border border-slate-200 w-48"
        >
          <h5 className="text-xs font-bold text-slate-800 mb-2 border-b pb-1 capitalize">
            {formatFecha(new Date(hoveredDay.ymd.replace(/-/g, '/')), { weekday: 'short', day: 'numeric', month: 'short' })}
          </h5>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {hoveredClases.map(clase => (
              <div key={clase.id} className="text-xs">
                <span className="font-semibold text-indigo-600">{clase.inicio}</span>
                <span className="text-slate-600 ml-1 truncate">{clase.materia}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* --- Fin Popover --- */}
    </div>
  );
}


/**
 * Sidebar
 */
function Sidebar({ fechaActual, setFechaActual, clases }) { // onAddClase eliminado
  const hoyYMD = toYYYYMMDD(new Date());
  const clasesHoy = useMemo(() => {
    return (clases.filter(c => c.fecha === hoyYMD) || [])
      .sort((a,b) => a.inicio.localeCompare(b.inicio));
  }, [clases, hoyYMD]);

  return (
    <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col space-y-6 h-screen overflow-y-auto">
      
      <MiniCalendario fechaActual={fechaActual} setFechaActual={setFechaActual} clases={clases} />
      
      <div className="flex-1 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Agenda de Hoy</h3>
        {clasesHoy.length > 0 ? (
           <div className="space-y-3">
             {clasesHoy.map(clase => (
               <div key={clase.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    {/* CAMBIO: Añadido - {clase.fin} */}
                    <span className="text-sm font-semibold text-indigo-700">{clase.inicio} - {clase.fin}</span>
                    {clase.estadoPago === 'Pagado' ? (
                      <span className="text-xs text-green-600 font-medium">Pagado</span>
                    ) : (
                      <span className="text-xs text-yellow-600 font-medium">Pendiente</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-700">{clase.materia}</p>
                  <p className="text-sm text-slate-500">{clase.alumno}</p>
               </div>
             ))}
           </div>
        ) : (
          <p className="text-sm text-slate-500 italic">No hay clases programadas para hoy.</p>
        )}
      </div>
    </aside>
  );
}


/**
 * Evento de Clase (para Vistas Semana y Día)
 */
function ClaseEvento({ clase, onSelectClase, style }) {
  const getBGColor = (materia) => {
    let hash = 0;
    for (let i = 0; i < materia.length; i++) {
      hash = materia.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 90%)`; // Tono pastel
  };

  const getBorderColor = (materia) => {
    let hash = 0;
    for (let i = 0; i < materia.length; i++) {
      hash = materia.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 60%, 60%)`; // Tono más oscuro
  };

  const bgColor = getBGColor(clase.materia);
  const borderColor = getBorderColor(clase.materia);
  
  // FIX: Cambiado .map(Number) a parseInt para asegurar consistencia
  const [inicioH_str, inicioM_str] = clase.inicio.split(':');
  const inicioH = parseInt(inicioH_str, 10);
  const inicioM = parseInt(inicioM_str, 10) || 0; // <-- AÑADIDO fallback

  const [finH_str, finM_str] = clase.fin.split(':');
  const finH = parseInt(finH_str, 10);
  const finM = parseInt(finM_str, 10) || 0; // <-- AÑADIDO fallback
  
  const duracion = (finH * 60 + finM) - (inicioH * 60 + inicioM);
  
  const [pagoBg, pagoText] = useMemo(() => {
    switch(clase.estadoPago) {
      case 'Pagado': return ['bg-green-100', 'text-green-700'];
      default: return ['bg-yellow-100', 'text-yellow-700']; // Pendiente
    }
  }, [clase.estadoPago]);

  return (
    <div
      style={{ ...style, backgroundColor: bgColor, borderLeftColor: borderColor }}
      // CAMBIO: Añadido 'border-t-2 border-white' para crear separación superior
      className={`absolute w-[calc(100%-4px)] ml-[2px] p-3 rounded-lg border-l-4 cursor-pointer overflow-hidden shadow-md transition-all hover:shadow-lg border-b-2 border-t-2 border-white`}
      onClick={() => onSelectClase(clase)}
    >
      <h4 className="text-sm font-bold" style={{ color: borderColor }}>
        {clase.materia}
      </h4>
      
      <div className="flex items-center gap-1.5 text-xs text-slate-700 mt-1">
        <User size={12} />
        <span>{clase.alumno}</span>
      </div>
      
      {/* Mostrar notas solo si hay espacio (si la duración es > 30 min) */}
      {clase.notas && duracion > 30 && (
        <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-2 pt-2 border-t border-slate-300/50">
          <FileText size={12} className="shrink-0 mt-0.5" />
          <p className="line-clamp-2">{clase.notas}</p>
        </div>
      )}
      
      <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${pagoBg} ${pagoText}`}>
        {clase.estadoPago}
      </span>
    </div>
  );
}


/**
 * Vista Gráfica de Semana
 */
function VistaSemana({ fechaActual, clases, onSelectClase }) {
  const inicioSemana = useMemo(() => getInicioSemana(fechaActual), [fechaActual]);
  
  const dias = useMemo(() => {
    return Array(7).fill(0).map((_, i) => addDays(inicioSemana, i));
  }, [inicioSemana]);

  const calcularPosicionEvento = (clase) => {
    const [inicioH_str, inicioM_str] = clase.inicio.split(':');
    const inicioH = parseInt(inicioH_str, 10);
    const inicioM = parseInt(inicioM_str, 10) || 0; // <-- AÑADIDO fallback

    const [finH_str, finM_str] = clase.fin.split(':');
    const finH = parseInt(finH_str, 10);
    const finM = parseInt(finM_str, 10) || 0; // <-- AÑADIDO fallback
    
    const inicioEnMinutos = (inicioH - 8) * 60 + inicioM;
    const finEnMinutos = (finH - 8) * 60 + finM;
    const duracionTotalEnMinutos = (21 - 8) * 60; // 13 horas * 60 = 780
    const duracionEventoEnMinutos = finEnMinutos - inicioEnMinutos;
    
    const top = (inicioEnMinutos / duracionTotalEnMinutos) * 100;
    const height = (duracionEventoEnMinutos / duracionTotalEnMinutos) * 100;
    
    const clampedTop = Math.max(0, Math.min(top, 100));
    const clampedHeight = Math.max(0, Math.min(height, 100 - clampedTop));

    return { top: `${clampedTop}%`, height: `${clampedHeight}%` };
  };

  return (
    <div className="flex-1 grid grid-cols-[auto_repeat(7,1fr)] overflow-auto border-r border-slate-200">
      {/* --- Columna de Horas --- */}
      <div className="w-16 text-right pr-2">
        {HORAS_DIA.map(hora => (
          <div key={hora} className="h-24 border-t border-transparent">
            <span className="text-xs text-slate-500 relative" style={{ top: '-0.5em' }}>
              {hora}:00
            </span>
          </div>
        ))}
      </div>

      {/* --- Columnas de Días --- */}
      {Array(7).fill(0).map((_, index) => {
        const dia = addDays(inicioSemana, index);
        const fechaYMD = toYYYYMMDD(dia);
        const clasesDelDia = clases.filter(c => c.fecha === fechaYMD);
        return (
          <div key={index} className="relative border-l border-slate-200">
            {/* --- Líneas de Hora --- */}
            {HORAS_DIA.map(hora => (
              <div key={hora} className="h-24 border-t border-slate-200"></div>
            ))}
            {/* --- Eventos --- */}
            <div className="absolute inset-0">
              {clasesDelDia.map(clase => (
                <ClaseEvento 
                  key={clase.id} 
                  clase={clase} 
                  onSelectClase={onSelectClase}
                  style={calcularPosicionEvento(clase)} 
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}


/**
 * Vista Gráfica de Día
 */
function VistaDia({ fechaActual, clases, onSelectClase }) {
  const fechaYMD = toYYYYMMDD(fechaActual);
  // FIX: Añadido .sort() para asegurar el orden de renderizado, lo que debería
  //      solucionar el apilamiento incorrecto que se ve en la imagen.
  const clasesDelDia = clases.filter(c => c.fecha === fechaYMD)
                             .sort((a,b) => a.inicio.localeCompare(b.inicio));

  // --- REESCRITO (Quitando console.log) ---
  const calcularPosicionEvento = (clase) => {
    // 1. Parsear horas y minutos con seguridad
    const [inicioH_str, inicioM_str] = clase.inicio.split(':');
    const inicioH = parseInt(inicioH_str, 10);
    const inicioM = parseInt(inicioM_str, 10) || 0;

    const [finH_str, finM_str] = clase.fin.split(':');
    const finH = parseInt(finH_str, 10);
    const finM = parseInt(finM_str, 10) || 0;
    
    // 2. Definir constantes de la cuadrícula
    const HORA_INICIO_GRID = 8; // 8:00
    const HORA_FIN_GRID = 21; // 21:00
    const DURACION_TOTAL_MINUTOS = (HORA_FIN_GRID - HORA_INICIO_GRID) * 60; // 13 * 60 = 780
    
    // 3. Calcular minutos desde el inicio de la cuadrícula (8:00)
    const inicioEnMinutos = (inicioH - HORA_INICIO_GRID) * 60 + inicioM;
    const finEnMinutos = (finH - HORA_INICIO_GRID) * 60 + finM;
    
    // 4. Calcular duración del evento
    const duracionEventoEnMinutos = finEnMinutos - inicioEnMinutos;
    
    // 5. Calcular porcentajes
    let top = (inicioEnMinutos / DURACION_TOTAL_MINUTOS) * 100;
    let height = (duracionEventoEnMinutos / DURACION_TOTAL_MINUTOS) * 100;
    
    // 6. Clamp (asegurar que no se salga)
    top = Math.max(0, Math.min(top, 100));
    height = Math.max(0, Math.min(height, 100 - top));

    return { top: `${top}%`, height: `${height}%` };
  };
  // --- FIN REESCRITO ---

  return (
    // --- FIX: Cambiado de 'flex' a 'grid' para que coincida con VistaSemana
    // Esto soluciona el bug de altura 0 en el contenedor 'absolute'
    <div className="flex-1 grid grid-cols-[auto_1fr] overflow-auto">
      {/* --- Columna de Horas --- */}
      <div className="w-16 text-right pr-2">
        {HORAS_DIA.map(hora => (
          <div key={hora} className="h-24 border-t border-transparent">
            <span className="text-xs text-slate-500 relative" style={{ top: '-0.5em' }}>
              {hora}:00
            </span>
          </div>
        ))}
      </div>

      {/* --- Columna del Día --- */}
      <div className="relative border-l border-r border-slate-200">
        
        {/* --- Líneas de Hora --- */}
        {HORAS_DIA.map(hora => (
          <div key={hora} className="h-24 border-t border-slate-200"></div>
        ))}
        
        {/* --- Eventos --- */}
        <div className="absolute inset-0">
          {clasesDelDia.map(clase => (
            <ClaseEvento 
              key={clase.id} 
              clase={clase} 
              onSelectClase={onSelectClase}
              style={calcularPosicionEvento(clase)} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}


/**
 * Vista de Mes
 */
function VistaMes({ fechaActual, clases, onSelectClase, onAddClase }) {
  const diasMes = useMemo(() => getMatrizMes(fechaActual), [fechaActual]);
  const hoyYMD = toYYYYMMDD(new Date());

  return (
    <div className="flex-1 grid grid-cols-7 grid-rows-6 border-r border-b border-slate-200">
      {diasMes.map((dia, index) => {
        const fechaYMD = toYYYYMMDD(dia);
        const esMesActual = dia.getMonth() === fechaActual.getMonth();
        const esHoy = fechaYMD === hoyYMD;
        
        const clasesDelDia = (clases.filter(c => c.fecha === fechaYMD) || [])
          .sort((a,b) => a.inicio.localeCompare(b.inicio));
        
        return (
          <div
            key={fechaYMD}
            className={`p-2 border-t border-l border-slate-200 ${
              esMesActual ? 'bg-white' : 'bg-slate-50'
            } overflow-hidden flex flex-col cursor-pointer hover:bg-slate-100 transition-colors`}
            onClick={() => onAddClase(dia)}
          >
            <span className={`mb-1 text-xs font-medium ${
              esHoy ? 'bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center' :
              esMesActual ? 'text-slate-700' : 'text-slate-400'
            }`}>
              {dia.getDate()}
            </span>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {clasesDelDia.slice(0, 3).map(clase => (
                <div 
                  key={clase.id}
                  className={`text-xs rounded ${clase.estadoPago === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'} overflow-hidden`}
                  onClick={(e) => { e.stopPropagation(); onSelectClase(clase); }}
                >
                  {/* Móvil: Solo punto */}
                  <span className={`sm:hidden w-2 h-2 rounded-full m-1.5 inline-block ${clase.estadoPago === 'Pagado' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                  
                  {/* Desktop: Texto */}
                  <span className={`hidden sm:inline-block p-1 w-full truncate`}>
                    {clase.materia}
                  </span>
                </div>
              ))}
              {clasesDelDia.length > 3 && (
                <div className="text-xs text-slate-500">+ {clasesDelDia.length - 3} más</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


/**
 * Selector de Hora Personalizado
 */
function SelectorHora({ value, onChange }) {
  const [hora, minutos] = value.split(':');

  const handleHoraChange = (e) => {
    onChange(`${e.target.value}:${minutos}`);
  };

  const handleMinutosChange = (e) => {
    onChange(`${hora}:${e.target.value}`);
  };

  const commonInputClass = "w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none";
  const commonLabelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label htmlFor="hora_select" className={commonLabelClass}>Hora</label>
        <div className="relative">
          <select id="hora_select" value={hora} onChange={handleHoraChange} className={commonInputClass}>
            {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
      <div className="flex-1">
        <label htmlFor="minutos_select" className={commonLabelClass}>Minutos</label>
        <div className="relative">
          <select id="minutos_select" value={minutos} onChange={handleMinutosChange} className={commonInputClass}>
            <option value="00">00</option>
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="45">45</option>
          </select>
          <ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}


/**
 * Modal para Añadir/Editar Clase
 */
function ClaseModal({ clase, clases, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState(
    clase || {
      materia: '',
      alumno: '',
      fecha: toYYYYMMDD(new Date()),
      inicio: '09:00',
      fin: '10:00',
      nivel: '',
      estadoPago: 'Pendiente',
      notas: '',
    }
  );
  const [error, setError] = useState('');
  
  const commonInputClass = "w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm";
  const commonLabelClass = "block text-sm font-medium text-slate-700 mb-1";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHoraChange = (campo) => (valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.materia || !formData.alumno || !formData.fecha || !formData.inicio || !formData.fin) {
      setError('Los campos Materia, Alumno, Fecha y Horas son obligatorios.');
      return;
    }
    if (formData.fin <= formData.inicio) {
      setError('La hora de fin debe ser posterior a la de inicio.');
      return;
    }
    
    const esEdicion = !!(clase && clase.id);
    const claseSolapada = detectarSolapamiento(formData, clases, esEdicion ? clase.id : null);
    
    if (claseSolapada) {
      setError(`¡Conflicto! Se solapa con: ${claseSolapada.materia} (${claseSolapada.alumno}) de ${claseSolapada.inicio} a ${claseSolapada.fin}.`);
      return;
    }

    onSave(formData);
  };
  
  const esEdicion = !!(clase && clase.id);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center p-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            {esEdicion ? 'Editar Clase' : 'Añadir Nueva Clase'}
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100">
            <X size={22} />
          </button>
        </div>
        
        {/* Cuerpo del Modal (con scroll) */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="materia" className={commonLabelClass}>Materia</label>
              <input type="text" id="materia" name="materia" value={formData.materia} onChange={handleChange} className={commonInputClass} />
            </div>
            <div>
              <label htmlFor="alumno" className={commonLabelClass}>Alumno</label>
              <input type="text" id="alumno" name="alumno" value={formData.alumno} onChange={handleChange} className={commonInputClass} />
            </div>
          </div>
          
          <div>
            <label htmlFor="nivel" className={commonLabelClass}>Nivel / Curso</label>
            <input type="text" id="nivel" name="nivel" value={formData.nivel} onChange={handleChange} className={commonInputClass} />
          </div>

          <div>
            <label htmlFor="fecha" className={commonLabelClass}>Fecha</label>
            <input type="date" id="fecha" name="fecha" value={formData.fecha} onChange={handleChange} className={commonInputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={commonLabelClass}>Inicio</label>
              <SelectorHora value={formData.inicio} onChange={handleHoraChange('inicio')} />
            </div>
            <div>
              <label className={commonLabelClass}>Fin</label>
              <SelectorHora value={formData.fin} onChange={handleHoraChange('fin')} />
            </div>
          </div>

          <div>
            <label htmlFor="estadoPago" className={commonLabelClass}>Estado de Pago</label>
            <div className="relative">
              <select id="estadoPago" name="estadoPago" value={formData.estadoPago} onChange={handleChange} className={`${commonInputClass} appearance-none`}>
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
              </select>
              <ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="notas" className={commonLabelClass}>Notas</label>
            <textarea id="notas" name="notas" value={formData.notas} onChange={handleChange} rows="3" className={commonInputClass}></textarea>
          </div>
          
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </p>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="flex justify-between items-center p-5 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <div>
            {esEdicion && (
              <button
                type="button"
                onClick={() => { onDelete(clase.id); onClose(); }}
                className="text-sm font-medium text-red-600 hover:text-red-800 px-4 py-2 rounded-lg hover:bg-red-100"
              >
                Eliminar Clase
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-slate-700 bg-white border border-slate-300 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700"
            >
              {esEdicion ? 'Guardar Cambios' : 'Crear Clase'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}


/**
 * Modal para ver detalles de la clase
 */
function DetalleClaseModal({ clase, onClose, onEdit, onDelete, onSave }) {
  if (!clase) return null;

  const getEstadoPagoIcon = () => {
    switch (clase.estadoPago) {
      case 'Pagado':
        return <DollarSign size={18} className="text-green-600" />;
      default: // Pendiente
        return <Clock size={18} className="text-yellow-600" />;
    }
  };

  const handleSetPago = (nuevoEstado) => {
    if (!onSave) return;
    onSave({ ...clase, estadoPago: nuevoEstado });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      {/* Clic en el fondo para cerrar */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100">
          <X size={20} />
        </button>
        
        <h3 className="text-xl font-semibold text-indigo-700 mb-4">{clase.materia}</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <User size={18} className="text-slate-500" />
            <span className="font-medium text-slate-700">{clase.alumno}</span>
          </div>
          {clase.nivel && (
            <div className="flex items-center gap-3">
              <Tag size={18} className="text-slate-500" />
              <span>{clase.nivel}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-slate-500" />
            <span className="capitalize">{formatFecha(new Date(clase.fecha.replace(/-/g, '/')), { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-slate-500" />
            <span>{clase.inicio} - {clase.fin} (Formato 24h)</span>
          </div>
          <div className="flex items-center gap-3">
            {getEstadoPagoIcon()}
            <span>{clase.estadoPago}</span>
          </div>
          {clase.notas && (
            <div className="flex items-start gap-3 pt-2">
              <FileText size={18} className="text-slate-500 shrink-0" />
              <p className="text-slate-600 whitespace-pre-wrap">{clase.notas}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
          {/* --- Acciones Rápidas --- */}
          <div className="flex gap-2">
            {clase.estadoPago === 'Pendiente' ? (
              <button
                onClick={() => handleSetPago('Pagado')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200"
                aria-label="Marcar como Pagado"
              >
                <DollarSign size={14} /> Marcar como Pagado
              </button>
            ) : (
              <button
                onClick={() => handleSetPago('Pendiente')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full hover:bg-yellow-200"
                aria-label="Marcar como Pendiente"
              >
                <Clock size={14} /> Marcar como Pendiente
              </button>
            )}
          </div>
          
          {/* --- Acciones Principales --- */}
          <div className="flex gap-3">
            <button
              onClick={() => { onDelete(clase.id); onClose(); }}
              className="p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"
              aria-label="Eliminar"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={() => { onEdit(clase); onClose(); }}
              className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors"
              aria-label="Editar"
            >
              <Edit2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


/**
 * Cabecera de la Aplicación (con controles de vista y navegación)
 */
function CabeceraApp({ vista, setVista, fechaActual, setFechaActual }) {
  const hoy = new Date();

  const handleVistaChange = (e) => {
    setVista(e.target.value);
  };
  
  const irHoy = () => {
    setFechaActual(hoy);
  };

  const irAnterior = () => {
    if (vista === 'mes') {
      setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
    } else if (vista === 'semana') {
      setFechaActual(addDays(fechaActual, -7));
    } else {
      setFechaActual(addDays(fechaActual, -1));
    }
  };
  
  const irSiguiente = () => {
    if (vista === 'mes') {
      setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
    } else if (vista === 'semana') {
      setFechaActual(addDays(fechaActual, 7)); // FIX: Aquí había un bug, decía -7
    } else {
      setFechaActual(addDays(fechaActual, +1));
    }
  };

  const textoFecha = useMemo(() => {
    if (vista === 'mes') {
      return formatFecha(fechaActual, { month: 'long', year: 'numeric' });
    }
    if (vista === 'semana') {
      const inicio = getInicioSemana(fechaActual);
      const fin = addDays(inicio, 6);
      if (inicio.getMonth() === fin.getMonth()) {
        return `${inicio.getDate()} - ${fin.getDate()} de ${formatFecha(inicio, { month: 'long', year: 'numeric' })}`;
      }
      return `${formatFecha(inicio, { day: 'numeric', month: 'short' })} - ${formatFecha(fin, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (vista === 'dia') {
      return formatFecha(fechaActual, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  }, [fechaActual, vista]);

  return (
    <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20">
      {/* Navegación de Fecha */}
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-slate-800 hidden md:block capitalize">
          {textoFecha}
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={irAnterior} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700">
            <ChevronLeft size={20} />
          </button>
          <button onClick={irSiguiente} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700">
            <ChevronRight size={20} />
          </button>
        </div>
        <button 
          onClick={irHoy}
          className="text-sm font-medium text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50"
        >
          Hoy
        </button>
      </div>
      
      {/* Selector de Vista */}
      <div className="relative">
        <select 
          value={vista} 
          onChange={handleVistaChange}
          className="text-sm font-medium text-slate-700 bg-white border border-slate-300 pl-3 pr-8 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 appearance-none"
        >
          <option value="mes">Mes</option>
          <option value="semana">Semana</option>
          <option value="dia">Día</option>
        </select>
        <ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </header>
  );
}


/**
 * Cabecera para las Vistas Semana y Día
 */
function CabeceraSemana({ fechaActual, vista }) {
  const inicioSemana = useMemo(() => getInicioSemana(fechaActual), [fechaActual]);
  const hoyYMD = toYYYYMMDD(new Date());

  // FIX: Cambiado de (vista === 'dia') a (vista !== 'semana')
  //      Ahora esta cabecera SOLO se mostrará en la vista de semana.
  if (vista !== 'semana') {
    return null; 
  }

  return (
    <div className="grid grid-cols-[auto_repeat(7,1fr)] sticky top-0 bg-white z-10 shadow-sm border-r border-slate-200">
      <div className="w-16 border-b"></div> {/* Esquina vacía */}
      {DIAS_SEMANA_COMPLETO.map((dia, index) => {
        const fecha = addDays(inicioSemana, index);
        const esHoy = toYYYYMMDD(fecha) === hoyYMD;
        return (
          <div key={dia} className="p-2 text-center border-b border-l border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">{dia.substring(0, 3)}</span>
            <span className={`block text-xl font-medium mt-1 ${esHoy ? 'bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center m-auto' : 'text-slate-700'}`}>
              {fecha.getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Cabecera para la Vista Mes
 */
function CabeceraMes({ vista }) {
  if (vista !== 'mes') return null;
  return (
    <div className="grid grid-cols-7 sticky top-0 bg-white z-10 shadow-sm border-r border-slate-200">
      {DIAS_SEMANA_COMPLETO.map(dia => (
        <div key={dia} className="p-2 text-center text-sm font-semibold text-slate-600 border-b border-l border-slate-200">
          {dia}
        </div>
      ))}
    </div>
  );
}


// --- Componente Principal de la Aplicación ---
export default function App() {
  // --- ESTADO MODIFICADO ---
  // Ahora el estado inicial es un array vacío. Se llenará desde Firestore.
  const [clases, setClases] = useState([]); 
  const [userId, setUserId] = useState(null); // Para guardar el ID de usuario
  const [isAuthReady, setIsAuthReady] = useState(false); // Para saber cuándo empezar a leer datos

  const [fechaActual, setFechaActual] = useState(new Date());
  const [vista, setVista] = useState('mes'); // 'mes', 'semana', 'dia'
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [claseParaEditar, setClaseParaEditar] = useState(null); // null o { datos de la clase }
  const [claseSeleccionada, setClaseSeleccionada] = useState(null); // null o { datos de la clase }
  
  // --- NUEVO: Efecto para Autenticación ---
  useEffect(() => {
    if (!auth) return;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        // Si no hay usuario, intentamos autenticarnos (primero con token, sino anónimo)
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else if (typeof window !== 'undefined' && window.__initial_auth_token) {
            await signInWithCustomToken(auth, window.__initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
          // onAuthStateChanged se disparará de nuevo con el nuevo usuario
        } catch (error) {
          console.error("Error de autenticación:", error);
          setIsAuthReady(true); // Permitir que la app continúe (aunque sea sin datos)
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // --- NUEVO: Efecto para Cargar Clases desde Firestore ---
  useEffect(() => {
    // No intentar leer hasta que la autenticación esté lista y tengamos DB y UserId
    if (!isAuthReady || !db || !userId) {
      // Si la autenticación está lista pero no hay userId, limpiamos las clases
      if (isAuthReady) setClases([]);
      return;
    }

    // Ruta de la colección: /artifacts/{appId}/users/{userId}/clases
    const collPath = `artifacts/${appId}/users/${userId}/clases`;
    const q = query(collection(db, collPath));

    // onSnapshot escucha en tiempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clasesDesdeDB = [];
      snapshot.forEach(doc => {
        clasesDesdeDB.push({ ...doc.data(), id: doc.id });
      });
      console.log("Datos de clases cargados/actualizados:", clasesDesdeDB.length);
      setClases(clasesDesdeDB);
    }, (error) => {
      console.error("Error al leer datos de Firestore:", error);
    });

    // Se llama al limpiar el efecto
    return () => unsubscribe();

  }, [isAuthReady, userId]); // Depende de isAuthReady y userId
  

  const handleAddClaseClick = (fecha) => {
    setClaseParaEditar({
      materia: '',
      alumno: '',
      fecha: toYYYYMMDD(fecha || new Date()),
      inicio: '09:00',
      fin: '10:00',
      nivel: '',
      estadoPago: 'Pendiente',
      notas: '',
    });
    setModalAbierto(true);
  };

  const handleEditClase = (clase) => {
    setClaseParaEditar(clase);
    setModalAbierto(true);
  };

  // --- FUNCIÓN MODIFICADA: Guardar en Firestore ---
  const handleSaveClase = async (claseData) => {
    if (!db || !userId) {
      console.error("Error: DB no lista o usuario no autenticado.");
      return;
    }
    
    // Ruta de la colección
    const collPath = `artifacts/${appId}/users/${userId}/clases`;

    try {
      if (claseData.id) {
        // --- Editar (Update) ---
        const docRef = doc(db, collPath, claseData.id);
        // Creamos una copia y eliminamos el 'id' porque no queremos guardar el id *dentro* del documento
        const dataToSave = { ...claseData };
        delete dataToSave.id; 
        await setDoc(docRef, dataToSave);
        console.log("Clase actualizada:", claseData.id);
      } else {
        // --- Crear (Add) ---
        // El id se genera automáticamente
        await addDoc(collection(db, collPath), claseData);
        console.log("Nueva clase añadida");
      }
      
      // Ya no necesitamos 'setClases' aquí. 
      // onSnapshot detectará el cambio y actualizará el estado automáticamente.
      
    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
    }

    setModalAbierto(false);
    setClaseParaEditar(null);
  };
  
  // --- FUNCIÓN MODIFICADA: Borrar de Firestore ---
  const handleDeleteClase = async (id) => {
    if (!db || !userId) {
      console.error("Error: DB no lista o usuario no autenticado.");
      return;
    }
    
    // Ruta del documento
    const docPath = `artifacts/${appId}/users/${userId}/clases/${id}`;

    try {
      await deleteDoc(doc(db, docPath));
      console.log("Clase eliminada:", id);
      // onSnapshot actualizará el estado
    } catch (error) {
      console.error("Error al eliminar en Firestore:", error);
    }
  };

  const renderVista = () => {
    switch(vista) {
      case 'semana':
        return <VistaSemana fechaActual={fechaActual} clases={clases} onSelectClase={setClaseSeleccionada} />;
      case 'dia':
        return <VistaDia fechaActual={fechaActual} clases={clases} onSelectClase={setClaseSeleccionada} />;
      case 'mes':
      default:
        return <VistaMes fechaActual={fechaActual} clases={clases} onSelectClase={setClaseSeleccionada} onAddClase={handleAddClaseClick} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* --- BARRA LATERAL --- */}
      <Sidebar 
        fechaActual={fechaActual}
        setFechaActual={setFechaActual}
        clases={clases}
      />
      
      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* --- Cabecera de Navegación y Vistas --- */}
        <CabeceraApp 
          vista={vista} 
          setVista={setVista} 
          fechaActual={fechaActual} 
          setFechaActual={setFechaActual} 
        />
        
        {/* --- Contenedor del Calendario (con scroll) --- */}
        <div className="flex-1 flex flex-col overflow-auto">
          {/* --- Encabezado de la Vista (Días de la semana, etc.) --- */}
          <CabeceraSemana fechaActual={fechaActual} vista={vista} />
          <CabeceraMes vista={vista} />
          
          {/* --- Cuerpo del Calendario --- */}
          {renderVista()}
        </div>
      </main>
      
      {/* --- Modales --- */}
      {modalAbierto && (
        <ClaseModal
          clase={claseParaEditar}
          clases={clases}
          onClose={() => { setModalAbierto(false); setClaseParaEditar(null); }}
          onSave={handleSaveClase}
          onDelete={handleDeleteClase}
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

      {/* --- BOTÓN FLOTANTE --- */}
      <button
        onClick={() => handleAddClaseClick(fechaActual)}
        className="fixed bottom-6 right-6 z-30 group flex items-center justify-start h-14 w-14 hover:w-48 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out overflow-hidden"
        aria-label="Añadir nueva clase"
      >
        <Plus size={28} className="shrink-0 ml-3.5" />
        <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 ml-2 mr-4">
          Añadir nueva clase
        </span>
      </button>

    </div>
  );
}
