import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Plus, Trash2, Calendar, Clock, BookOpen, User,
  ChevronLeft, ChevronRight, X, Edit2,
  Tag, FileText, ChevronDown, DollarSign, LogIn, LogOut // Añadidos LogIn, LogOut
} from 'lucide-react';
// --- IMPORTAR TU FIREBASE ---
// MODIFICADO: Importamos también las funciones/provider de Google
import { db, auth, googleProvider, signInWithPopup, signOut } from './utils/firebase'; // Asegúrate que la ruta es correcta
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, onSnapshot, query,
  doc, addDoc, setDoc, deleteDoc
} from "firebase/firestore";

// --- Constantes y Datos Iniciales ---
const DIAS_SEMANA_COMPLETO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HORAS_DIA = Array.from({ length: 13 }, (_, i) => 8 + i); // 8:00 a 20:00

// --- Funciones de Ayuda ---
const toYYYYMMDD = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
      console.warn("toYYYYMMDD received invalid date:", date);
      const today = new Date();
      // Ensure month and day are two digits
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${today.getFullYear()}-${month}-${day}`;
  }
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};
const addDays = (date, days) => {
  // Ensure input is a valid date
   if (!(date instanceof Date) || isNaN(date)) {
     console.error("addDays received invalid date:", date);
     return new Date(); // Return today's date as a fallback
   }
  const result = new Date(date);
   // Check if setDate results in a valid date, though unlikely necessary with valid input
   try {
     result.setDate(result.getDate() + days);
     if (isNaN(result)) throw new Error("Resulting date is invalid");
   } catch (e) {
      console.error("Error adding days:", e);
      return new Date(); // Fallback
   }
  return result;
};
const formatFecha = (date, options) => {
    if (!(date instanceof Date) || isNaN(date)) {
        console.warn("formatFecha received invalid date:", date);
        return "Fecha inválida";
    }
    try {
        // Define default options if needed, or rely on caller providing them
        const defaultOptions = { timeZone: 'Europe/Madrid' };
        return new Intl.DateTimeFormat('es-ES', { ...defaultOptions, ...options }).format(date);
    } catch (e) {
        console.error("Error formatting date:", e);
        return "Error fecha";
    }
};
const getInicioSemana = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      console.error("getInicioSemana received invalid date:", date);
      // Fallback: start of the current week
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      return new Date(today.setDate(diff));
    }
    const d = new Date(date); // Clone date to avoid modifying original
    const diaSemana = d.getDay();
    // Calculate difference to Monday
    // If Sunday (0), go back 6 days. If Monday (1), diff is 0. If Tuesday (2), go back 1 day, etc.
    const diff = d.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    try {
       // Use setDate on the original cloned date 'd'
       d.setDate(diff);
       if (isNaN(d)) throw new Error("Resulting start date is invalid");
       return d;
    } catch (e) {
       console.error("Error calculating start of week:", e, date);
       // Fallback: Start of the current week
       const today = new Date();
       const dayOfWeekFallback = today.getDay();
       const diffFallback = today.getDate() - dayOfWeekFallback + (dayOfWeekFallback === 0 ? -6 : 1);
       return new Date(today.setDate(diffFallback));
    }
};
const getMatrizMes = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
        console.error("getMatrizMes received invalid date:", date);
        // Fallback: matrix for the current month
        date = new Date();
    }
    const anio = date.getFullYear();
    const mes = date.getMonth();
    // Ensure the first day calculation is safe
    let primerDiaMes;
     try {
       primerDiaMes = new Date(anio, mes, 1);
       if (isNaN(primerDiaMes)) throw new Error("Invalid first day of month");
     } catch (e) {
        console.error("Error creating first day of month:", e);
        primerDiaMes = new Date(); // Fallback to today if month/year were bad
        primerDiaMes.setDate(1);
     }

    let primerDiaSemana;
     try {
       primerDiaSemana = getInicioSemana(primerDiaMes);
        if (isNaN(primerDiaSemana)) throw new Error("Invalid start of week from getInicioSemana");
     } catch (e) {
        console.error("Error getting start of week for month matrix:", e, primerDiaMes);
        // Fallback: use the first day of the month itself
        primerDiaSemana = new Date(primerDiaMes); // Clone
     }

    const dias = [];
    let diaActual = new Date(primerDiaSemana); // Clone start date

    for (let i = 0; i < 42; i++) {
        // Check if diaActual is valid before pushing
        if (isNaN(diaActual)) {
            console.error("Invalid date encountered during matrix generation:", diaActual);
            break; // Stop if date becomes invalid
        }
        dias.push(new Date(diaActual)); // Push a clone
         try {
           // Increment the date for the next iteration
           diaActual.setDate(diaActual.getDate() + 1);
         } catch (e) {
            console.error("Error incrementing day in month matrix:", e, diaActual);
            break; // Stop if increment fails
         }
    }
    // Ensure we always return an array, even if empty or incomplete
    if (dias.length !== 42 && i < 41) { // Check if loop broke early
      console.warn(`Month matrix generation incomplete (${dias.length}/42) due to date errors.`);
    }
    return dias;
};
const detectarSolapamiento = (nuevaClase, clasesExistentes, idActual) => {
    if (!clasesExistentes || !Array.isArray(clasesExistentes) || !nuevaClase) return null; // Safety checks
    for (const clase of clasesExistentes) {
        // Ensure 'clase' object is valid and has necessary properties
        if (!clase || typeof clase.fecha !== 'string' || typeof clase.inicio !== 'string' || typeof clase.fin !== 'string') {
            console.warn("Skipping invalid existing class in overlap check:", clase);
            continue;
        }
        // Ensure 'nuevaClase' has necessary properties
         if (typeof nuevaClase.fecha !== 'string' || typeof nuevaClase.inicio !== 'string' || typeof nuevaClase.fin !== 'string') {
             console.warn("Invalid new class data for overlap check:", nuevaClase);
             return null; // Cannot perform check with invalid new data
         }

        if (idActual && clase.id === idActual) continue; // Skip self-comparison during edit

        if (clase.fecha === nuevaClase.fecha) {
            // Overlap logic: (StartA < EndB) and (EndA > StartB)
            const haySolapamiento = nuevaClase.inicio < clase.fin && nuevaClase.fin > clase.inicio;
            if (haySolapamiento) {
                console.log("Overlap detected:", nuevaClase, clase);
                return clase; // Return conflicting class
            }
        }
    }
    return null; // No overlap found
};


// --- Componentes ---

function MiniCalendario({ fechaActual, setFechaActual, clases }) {
  // Add safety check for fechaActual
  const safeFechaActual = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();
  const [mesMostrado, setMesMostrado] = useState(new Date(safeFechaActual.getFullYear(), safeFechaActual.getMonth(), 1));
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredClases, setHoveredClases] = useState([]);
  const calendarRef = useRef(null);
  // Add safety check inside useMemo for getMatrizMes dependency
  const diasMes = useMemo(() => {
     const currentMesDate = (mesMostrado instanceof Date && !isNaN(mesMostrado)) ? mesMostrado : new Date();
     return getMatrizMes(currentMesDate);
  }, [mesMostrado]);
  const hoyYMD = toYYYYMMDD(new Date());
  const fechaActualYMD = toYYYYMMDD(safeFechaActual); // Use safe date
  const clasesPorDia = useMemo(() => {
    const map = new Map();
    if (!clases || !Array.isArray(clases)) return map;
    for (const clase of clases) {
       if (!clase || typeof clase.fecha !== 'string' || typeof clase.inicio !== 'string') continue;
      const list = map.get(clase.fecha) || [];
      list.push(clase);
      map.set(clase.fecha, list.sort((a,b) => (a.inicio || "").localeCompare(b.inicio || "")));
    }
    return map;
  }, [clases]);
  const irMesAnterior = () => { try { setMesMostrado(new Date(mesMostrado.getFullYear(), mesMostrado.getMonth() - 1, 1)); setHoveredDay(null); } catch(e){ console.error("Error going to previous month:", e)} };
  const irMesSiguiente = () => { try { setMesMostrado(new Date(mesMostrado.getFullYear(), mesMostrado.getMonth() + 1, 1)); setHoveredDay(null); } catch(e){ console.error("Error going to next month:", e)} };
  const handleDayHover = (e, ymd, clasesDia) => {
    if (clasesDia && clasesDia.length > 0) { setHoveredDay({ ymd, target: e.currentTarget }); setHoveredClases(clasesDia); }
    else { setHoveredDay(null); setHoveredClases([]); }
  };
  const handleMouseLeaveCalendar = () => { setHoveredDay(null); setHoveredClases([]); };
  const popoverStyle = useMemo(() => {
    if (!hoveredDay || !hoveredDay.target || !calendarRef.current) return { display: 'none' };
    try {
        const targetRect = hoveredDay.target.getBoundingClientRect();
        const containerRect = calendarRef.current.getBoundingClientRect();
        const top = targetRect.top - containerRect.top + (targetRect.height / 2);
        const left = targetRect.left - containerRect.left + targetRect.width + 10;
        return { display: 'block', position: 'absolute', top: `${top}px`, left: `${left}px`, transform: 'translateY(-50%)', zIndex: 50 };
     } catch (e) { console.error("Error calculating popover style:", e); return { display: 'none' }; }
  }, [hoveredDay]);

  return (
    <div ref={calendarRef} className="relative bg-slate-50 p-4 rounded-lg border border-slate-200" onMouseLeave={handleMouseLeaveCalendar}>
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-semibold text-slate-700 capitalize">{formatFecha(mesMostrado, { month: 'long', year: 'numeric' })}</h4>
        <div className="flex gap-1">
          <button onClick={irMesAnterior} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700"><ChevronLeft size={18} /></button>
          <button onClick={irMesSiguiente} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center mb-2">
        {DIAS_SEMANA_COMPLETO.map(dia => (<span key={dia} className="text-xs font-semibold text-slate-500 w-7">{dia.substring(0, 1)}</span>))}
      </div>
      <div className="grid grid-cols-7">
         {/* Safety check for diasMes array */}
         {Array.isArray(diasMes) ? diasMes.map((dia, idx) => {
           // Skip rendering if dia is not a valid Date
           if (!(dia instanceof Date) || isNaN(dia)) {
               console.warn(`Invalid date found in diasMes at index ${idx}`);
               return <div key={`invalid-${idx}`} className="w-7 h-7 m-auto"></div>; // Placeholder for invalid date
           }
           const ymd = toYYYYMMDD(dia);
          const esHoy = ymd === hoyYMD;
           const esSeleccionado = ymd === fechaActualYMD;
          const esMesActual = dia.getMonth() === mesMostrado.getMonth();
          const clasesDia = clasesPorDia.get(ymd);
          const numClases = clasesDia ? clasesDia.length : 0;
          return (
            <button key={ymd} onClick={() => setFechaActual(dia)} onMouseEnter={(e) => handleDayHover(e, ymd, clasesDia)}
              className={`relative p-1 text-xs rounded-full flex items-center justify-center w-7 h-7 m-auto transition-colors ${esHoy ? 'bg-indigo-600 text-white font-semibold' : ''} ${!esHoy && esSeleccionado ? 'bg-indigo-100 text-indigo-700 font-semibold' : ''} ${!esHoy && !esSeleccionado && esMesActual ? 'text-slate-700 hover:bg-slate-200' : ''} ${!esMesActual ? 'text-slate-300' : ''}`}>
              {dia.getDate()}
              {numClases > 0 && esMesActual && !esHoy && !esSeleccionado && (<span className="absolute bottom-1 w-1 h-1 bg-indigo-400 rounded-full"></span>)}
            </button>
          );
        }) : <p>Error loading days</p>} {/* Fallback if diasMes is not an array */}
      </div>
      {hoveredDay && hoveredClases.length > 0 && (
        <div style={popoverStyle} className="bg-white p-3 rounded-lg shadow-xl border border-slate-200 w-48">
          <h5 className="text-xs font-bold text-slate-800 mb-2 border-b pb-1 capitalize">{formatFecha(new Date(hoveredDay.ymd.replace(/-/g, '/')), { weekday: 'short', day: 'numeric', month: 'short' })}</h5>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {hoveredClases.map(clase => (
               clase && clase.id && typeof clase.inicio === 'string' && typeof clase.materia === 'string' ?
               (<div key={clase.id} className="text-xs"><span className="font-semibold text-indigo-600">{clase.inicio}</span><span className="text-slate-600 ml-1 truncate">{clase.materia}</span></div>)
               : null
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({ fechaActual, setFechaActual, clases }) {
  const hoyYMD = toYYYYMMDD(new Date());
  const clasesHoy = useMemo(() => {
    if (!Array.isArray(clases)) return [];
    return (clases.filter(c => c && c.fecha === hoyYMD) || [])
      .sort((a, b) => (a.inicio || "").localeCompare(b.inicio || ""));
  }, [clases, hoyYMD]);
  return (
    <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col space-y-6 h-screen overflow-y-auto">
      {/* Safety check for date prop */}
      <MiniCalendario fechaActual={fechaActual || new Date()} setFechaActual={setFechaActual} clases={clases} />
      <div className="flex-1 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">Agenda de Hoy</h3>
        {clasesHoy.length > 0 ? (
           <div className="space-y-3">
             {clasesHoy.map(clase => (
                 clase && clase.id ?
               (<div key={clase.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-indigo-700">{clase.inicio || 'N/A'} - {clase.fin || 'N/A'}</span>
                    {clase.estadoPago === 'Pagado' ? (<span className="text-xs text-green-600 font-medium">Pagado</span>) : (<span className="text-xs text-yellow-600 font-medium">Pendiente</span>)}
                  </div>
                  <p className="text-sm font-medium text-slate-700">{clase.materia || 'N/A'}</p>
                  <p className="text-sm text-slate-500">{clase.alumno || 'N/A'}</p>
               </div>) : null
             ))}
           </div>
        ) : (<p className="text-sm text-slate-500 italic">No hay clases programadas para hoy.</p>)}
      </div>
    </aside>
  );
}

function ClaseEvento({ clase, onSelectClase, style }) {
    if (!clase || typeof clase.materia !== 'string' || typeof clase.inicio !== 'string' || typeof clase.fin !== 'string') { return null; }
    const getBGColor = (materia = "") => { let hash = 0; for (let i = 0; i < materia.length; i++) { hash = materia.charCodeAt(i) + ((hash << 5) - hash); } const h = hash % 360; return `hsl(${h}, 70%, 90%)`; };
    const getBorderColor = (materia = "") => { let hash = 0; for (let i = 0; i < materia.length; i++) { hash = materia.charCodeAt(i) + ((hash << 5) - hash); } const h = hash % 360; return `hsl(${h}, 60%, 60%)`; };
    const bgColor = getBGColor(clase.materia);
    const borderColor = getBorderColor(clase.materia);
    const [inicioH_str, inicioM_str] = clase.inicio.split(':'); const inicioH = parseInt(inicioH_str, 10); const inicioM = parseInt(inicioM_str, 10) || 0;
    const [finH_str, finM_str] = clase.fin.split(':'); const finH = parseInt(finH_str, 10); const finM = parseInt(finM_str, 10) || 0;
    // Calculate duration safely
    const duracion = (!isNaN(inicioH) && !isNaN(finH)) ? (finH * 60 + finM) - (inicioH * 60 + inicioM) : 0;
    const [pagoBg, pagoText] = useMemo(() => { switch(clase.estadoPago) { case 'Pagado': return ['bg-green-100', 'text-green-700']; default: return ['bg-yellow-100', 'text-yellow-700']; } }, [clase.estadoPago]);
    return (
        <div style={{ ...style, backgroundColor: bgColor, borderLeftColor: borderColor }} className={`absolute w-[calc(100%-4px)] ml-[2px] p-3 rounded-lg border-l-4 cursor-pointer overflow-hidden shadow-md transition-all hover:shadow-lg border-b-2 border-t-2 border-white`} onClick={() => onSelectClase(clase)}>
        <h4 className="text-sm font-bold" style={{ color: borderColor }}>{clase.materia}</h4>
        <div className="flex items-center gap-1.5 text-xs text-slate-700 mt-1"><User size={12} /><span>{clase.alumno || 'N/A'}</span></div>
        {clase.notas && duracion > 30 && (<div className="flex items-start gap-1.5 text-xs text-slate-600 mt-2 pt-2 border-t border-slate-300/50"><FileText size={12} className="shrink-0 mt-0.5" /><p className="line-clamp-2">{clase.notas}</p></div>)}
        <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${pagoBg} ${pagoText}`}>{clase.estadoPago || 'N/A'}</span>
        </div>
    );
}

function VistaSemana({ fechaActual, clases, onSelectClase }) {
    if (!Array.isArray(clases)) clases = [];
     // Safety check for fechaActual
     const safeFechaActual = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();

    const inicioSemana = useMemo(() => getInicioSemana(safeFechaActual), [safeFechaActual]); // Use safe date
    const calcularPosicionEvento = (clase) => {
        if (!clase || typeof clase.inicio !== 'string' || typeof clase.fin !== 'string') return {};
        const [inicioH_str, inicioM_str] = clase.inicio.split(':'); const inicioH = parseInt(inicioH_str, 10); const inicioM = parseInt(inicioM_str, 10) || 0;
        const [finH_str, finM_str] = clase.fin.split(':'); const finH = parseInt(finH_str, 10); const finM = parseInt(finM_str, 10) || 0;
         // Add safety check for parsed hours
         if (isNaN(inicioH) || isNaN(finH)) return {};
        const inicioEnMinutos = (inicioH - 8) * 60 + inicioM; const finEnMinutos = (finH - 8) * 60 + finM;
        const duracionTotalEnMinutos = (21 - 8) * 60; const duracionEventoEnMinutos = finEnMinutos - inicioEnMinutos;
        if (duracionTotalEnMinutos <= 0 || duracionEventoEnMinutos < 0) return {};
        const top = (inicioEnMinutos / duracionTotalEnMinutos) * 100; const height = (duracionEventoEnMinutos / duracionTotalEnMinutos) * 100;
        const clampedTop = Math.max(0, Math.min(top, 100)); const clampedHeight = Math.max(0, Math.min(height, 100 - clampedTop));
        return { top: `${clampedTop}%`, height: `${clampedHeight}%` };
    };
    return (
        <div className="flex-1 grid grid-cols-[auto_repeat(7,1fr)] overflow-auto border-r border-slate-200">
        <div className="w-16 text-right pr-2">{HORAS_DIA.map(hora => (<div key={hora} className="h-24 border-t border-transparent"><span className="text-xs text-slate-500 relative" style={{ top: '-0.5em' }}>{hora}:00</span></div>))}</div>
        {Array(7).fill(0).map((_, index) => {
            let dia;
            try {
                dia = addDays(inicioSemana, index);
                if (!(dia instanceof Date) || isNaN(dia)) throw new Error("Invalid date");
            } catch (e) { return <div key={index} className="relative border-l border-slate-200">Error</div>; }
            const fechaYMD = toYYYYMMDD(dia);
            const clasesDelDia = clases.filter(c => c && c.fecha === fechaYMD);
            return (
            <div key={index} className="relative border-l border-slate-200">
                {HORAS_DIA.map(hora => (<div key={hora} className="h-24 border-t border-slate-200"></div>))}
                <div className="absolute inset-0">{clasesDelDia.map(clase => (
                    clase && clase.id ? (<ClaseEvento key={clase.id} clase={clase} onSelectClase={onSelectClase} style={calcularPosicionEvento(clase)} />) : null
                ))}</div>
            </div>
            );
        })}
        </div>
    );
}

function VistaDia({ fechaActual, clases, onSelectClase }) {
    if (!Array.isArray(clases)) clases = [];
     // Safety check for fechaActual
     const safeFechaActual = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();
     const fechaYMD = toYYYYMMDD(safeFechaActual); // Use safe date
    const clasesDelDia = clases.filter(c => c && c.fecha === fechaYMD) // Safety check
            .sort((a, b) => (a.inicio || "").localeCompare(b.inicio || ""));
    const calcularPosicionEvento = (clase) => {
        if (!clase || typeof clase.inicio !== 'string' || typeof clase.fin !== 'string') return {};
        const [inicioH_str, inicioM_str] = clase.inicio.split(':'); const inicioH = parseInt(inicioH_str, 10); const inicioM = parseInt(inicioM_str, 10) || 0;
        const [finH_str, finM_str] = clase.fin.split(':'); const finH = parseInt(finH_str, 10); const finM = parseInt(finM_str, 10) || 0;
        if (isNaN(inicioH) || isNaN(finH)) return {};
        const HORA_INICIO_GRID = 8; const HORA_FIN_GRID = 21; const DURACION_TOTAL_MINUTOS = (HORA_FIN_GRID - HORA_INICIO_GRID) * 60;
        const inicioEnMinutos = (inicioH - HORA_INICIO_GRID) * 60 + inicioM; const finEnMinutos = (finH - HORA_INICIO_GRID) * 60 + finM;
        const duracionEventoEnMinutos = finEnMinutos - inicioEnMinutos;
        if (DURACION_TOTAL_MINUTOS <= 0 || duracionEventoEnMinutos < 0) return {};
        let top = (inicioEnMinutos / DURACION_TOTAL_MINUTOS) * 100; let height = (duracionEventoEnMinutos / DURACION_TOTAL_MINUTOS) * 100;
        top = Math.max(0, Math.min(top, 100)); height = Math.max(0, Math.min(height, 100 - top));
        return { top: `${top}%`, height: `${height}%` };
    };
    return (
        <div className="flex-1 grid grid-cols-[auto_1fr] overflow-auto">
        <div className="w-16 text-right pr-2">{HORAS_DIA.map(hora => (<div key={hora} className="h-24 border-t border-transparent"><span className="text-xs text-slate-500 relative" style={{ top: '-0.5em' }}>{hora}:00</span></div>))}</div>
        <div className="relative border-l border-r border-slate-200">
            {HORAS_DIA.map(hora => (<div key={hora} className="h-24 border-t border-slate-200"></div>))}
            <div className="absolute inset-0">{clasesDelDia.map(clase => (
                clase && clase.id ? (<ClaseEvento key={clase.id} clase={clase} onSelectClase={onSelectClase} style={calcularPosicionEvento(clase)} />) : null
            ))}</div>
        </div>
        </div>
    );
}

function VistaMes({ fechaActual, clases, onSelectClase, onAddClase }) {
     if (!Array.isArray(clases)) clases = [];
     // Safety check for fechaActual
     const safeFechaActual = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();
    const diasMes = useMemo(() => getMatrizMes(safeFechaActual), [safeFechaActual]); // Use safe date
    const hoyYMD = toYYYYMMDD(new Date());
    return (
        <div className="flex-1 grid grid-cols-7 grid-rows-6 border-r border-b border-slate-200">
        {Array.isArray(diasMes) && diasMes.map((dia, index) => {
            if (!(dia instanceof Date) || isNaN(dia)) return <div key={`error-${index}`} className="border-t border-l border-red-300 bg-red-50">!</div>;
            const fechaYMD = toYYYYMMDD(dia); const esMesActual = dia.getMonth() === safeFechaActual.getMonth(); const esHoy = fechaYMD === hoyYMD; // Use safe date month
            const clasesDelDia = (clases.filter(c => c && c.fecha === fechaYMD) || []).sort((a, b) => (a.inicio || "").localeCompare(b.inicio || ""));
            return (
            <div key={fechaYMD} className={`p-2 border-t border-l border-slate-200 ${esMesActual ? 'bg-white' : 'bg-slate-50'} overflow-hidden flex flex-col cursor-pointer hover:bg-slate-100 transition-colors`} onClick={() => onAddClase(dia)}>
                <span className={`mb-1 text-xs font-medium ${esHoy ? 'bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : esMesActual ? 'text-slate-700' : 'text-slate-400'}`}>{dia.getDate()}</span>
                <div className="flex-1 space-y-1 overflow-y-auto">
                {clasesDelDia.slice(0, 3).map(clase => (
                    clase && clase.id ? (<div key={clase.id} className={`text-xs rounded ${clase.estadoPago === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'} overflow-hidden`} onClick={(e) => { e.stopPropagation(); onSelectClase(clase); }}>
                    <span className={`sm:hidden w-2 h-2 rounded-full m-1.5 inline-block ${clase.estadoPago === 'Pagado' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                    <span className={`hidden sm:inline-block p-1 w-full truncate`}>{clase.materia || 'N/A'}</span>
                    </div>) : null
                ))}
                {clasesDelDia.length > 3 && (<div className="text-xs text-slate-500">+ {clasesDelDia.length - 3} más</div>)}
                </div>
            </div>
            );
        })}
        </div>
    );
}

function SelectorHora({ value = "09:00", onChange }) {
    const safeValue = (typeof value === 'string' && value.includes(':')) ? value : "09:00";
    const [hora = '09', minutos = '00'] = safeValue.split(':'); // Default split values
    const handleHoraChange = (e) => { onChange(`${e.target.value}:${minutos}`); };
    const handleMinutosChange = (e) => { onChange(`${hora}:${e.target.value}`); };
    const commonInputClass = "w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none";
    const commonLabelClass = "block text-sm font-medium text-slate-700 mb-1";
    return (
        <div className="flex gap-3">
        <div className="flex-1">
            <label htmlFor="hora_select" className={commonLabelClass}>Hora</label>
            <div className="relative"><select id="hora_select" value={hora} onChange={handleHoraChange} className={commonInputClass}>{Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (<option key={h} value={h}>{h}</option>))}</select><ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
        </div>
        <div className="flex-1">
            <label htmlFor="minutos_select" className={commonLabelClass}>Minutos</label>
            <div className="relative"><select id="minutos_select" value={minutos} onChange={handleMinutosChange} className={commonInputClass}><option value="00">00</option><option value="15">15</option><option value="30">30</option><option value="45">45</option></select><ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
        </div>
        </div>
    );
}

function ClaseModal({ clase, clases, onClose, onSave, onDelete, isLoading }) {
  const [formData, setFormData] = useState(clase || { materia: '', alumno: '', fecha: toYYYYMMDD(new Date()), inicio: '09:00', fin: '10:00', nivel: '', estadoPago: 'Pendiente', notas: '' });
  const [error, setError] = useState('');
  const commonInputClass = "w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm";
  const commonLabelClass = "block text-sm font-medium text-slate-700 mb-1";
  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleHoraChange = (campo) => (valor) => { setFormData(prev => ({ ...prev, [campo]: valor })); };
  const handleSubmit = (e) => {
    e.preventDefault(); setError(''); console.log("ClaseModal: handleSubmit llamado");
    if (!formData.materia?.trim() || !formData.alumno?.trim() || !formData.fecha || !formData.inicio || !formData.fin) { setError('Los campos Materia, Alumno, Fecha y Horas son obligatorios.'); console.log("ClaseModal: Falló validación de campos obligatorios"); return; }
    if (formData.fin <= formData.inicio) { setError('La hora de fin debe ser posterior a la de inicio.'); console.log("ClaseModal: Falló validación de hora fin <= inicio"); return; }
    const esEdicion = !!(clase && clase.id); const claseSolapada = detectarSolapamiento(formData, clases, esEdicion ? clase.id : null);
    if (claseSolapada) { setError(`¡Conflicto! Se solapa con: ${claseSolapada.materia} (${claseSolapada.alumno}) de ${claseSolapada.inicio} a ${claseSolapada.fin}.`); console.log("ClaseModal: Detectado solapamiento", claseSolapada); return; }
    console.log("ClaseModal: Validación pasada, llamando a onSave..."); onSave(formData);
  };
  const esEdicion = !!(clase && clase.id);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-slate-200"><h3 className="text-lg font-semibold text-slate-800">{esEdicion ? 'Editar Clase' : 'Añadir Nueva Clase'}</h3><button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100"><X size={22} /></button></div>
        <div className="p-6 space-y-4 overflow-y-auto">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div><label htmlFor="materia" className={commonLabelClass}>Materia</label><input type="text" id="materia" name="materia" value={formData.materia || ''} onChange={handleChange} className={commonInputClass} required/></div>
               <div><label htmlFor="alumno" className={commonLabelClass}>Alumno</label><input type="text" id="alumno" name="alumno" value={formData.alumno || ''} onChange={handleChange} className={commonInputClass} required/></div>
           </div>
           <div><label htmlFor="nivel" className={commonLabelClass}>Nivel / Curso</label><input type="text" id="nivel" name="nivel" value={formData.nivel || ''} onChange={handleChange} className={commonInputClass} /></div>
           <div><label htmlFor="fecha" className={commonLabelClass}>Fecha</label><input type="date" id="fecha" name="fecha" value={formData.fecha || ''} onChange={handleChange} className={commonInputClass} required/></div>
           <div className="grid grid-cols-2 gap-4">
               <div><label className={commonLabelClass}>Inicio</label><SelectorHora value={formData.inicio || '09:00'} onChange={handleHoraChange('inicio')} /></div>
               <div><label className={commonLabelClass}>Fin</label><SelectorHora value={formData.fin || '10:00'} onChange={handleHoraChange('fin')} /></div>
           </div>
           <div><label htmlFor="estadoPago" className={commonLabelClass}>Estado de Pago</label><div className="relative"><select id="estadoPago" name="estadoPago" value={formData.estadoPago || 'Pendiente'} onChange={handleChange} className={`${commonInputClass} appearance-none`}><option value="Pendiente">Pendiente</option><option value="Pagado">Pagado</option></select><ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div></div>
           <div><label htmlFor="notas" className={commonLabelClass}>Notas</label><textarea id="notas" name="notas" value={formData.notas || ''} onChange={handleChange} rows="3" className={commonInputClass}></textarea></div>
          {error && (<p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>)}
        </div>
        <div className="flex justify-between items-center p-5 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <div>{esEdicion && (<button type="button" onClick={() => { if (clase && clase.id) onDelete(clase.id); onClose(); }} className="text-sm font-medium text-red-600 hover:text-red-800 px-4 py-2 rounded-lg hover:bg-red-100">Eliminar Clase</button>)}</div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="text-sm font-medium text-slate-700 bg-white border border-slate-300 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={!!isLoading} className={`text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>{esEdicion ? 'Guardar Cambios' : 'Crear Clase'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function DetalleClaseModal({ clase, onClose, onEdit, onDelete, onSave }) {
  if (!clase) return null;
  const getEstadoPagoIcon = () => { switch (clase.estadoPago) { case 'Pagado': return <DollarSign size={18} className="text-green-600" />; default: return <Clock size={18} className="text-yellow-600" />; } };
  const handleSetPago = (nuevoEstado) => { if (!onSave) return; onSave({ ...clase, estadoPago: nuevoEstado }); };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100"><X size={20} /></button>
        <h3 className="text-xl font-semibold text-indigo-700 mb-4">{clase.materia || 'N/A'}</h3>
        <div className="space-y-3 text-sm">
           <div className="flex items-center gap-3"><User size={18} className="text-slate-500" /><span className="font-medium text-slate-700">{clase.alumno || 'N/A'}</span></div>
           {clase.nivel && (<div className="flex items-center gap-3"><Tag size={18} className="text-slate-500" /><span>{clase.nivel}</span></div>)}
           {/* Safety check for date formatting */}
           <div className="flex items-center gap-3"><Calendar size={18} className="text-slate-500" /><span className="capitalize">{clase.fecha ? formatFecha(new Date(clase.fecha.replace(/-/g, '/')), { weekday: 'long', day: 'numeric', month: 'long' }) : 'N/A'}</span></div>
           <div className="flex items-center gap-3"><Clock size={18} className="text-slate-500" /><span>{clase.inicio || 'N/A'} - {clase.fin || 'N/A'} (Formato 24h)</span></div>
           <div className="flex items-center gap-3">{getEstadoPagoIcon()}<span>{clase.estadoPago || 'N/A'}</span></div>
           {clase.notas && (<div className="flex items-start gap-3 pt-2"><FileText size={18} className="text-slate-500 shrink-0" /><p className="text-slate-600 whitespace-pre-wrap">{clase.notas}</p></div>)}
        </div>
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
          <div className="flex gap-2">
            {clase.estadoPago === 'Pendiente' ? (<button onClick={() => handleSetPago('Pagado')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200" aria-label="Marcar como Pagado"><DollarSign size={14} /> Marcar como Pagado</button>) : (<button onClick={() => handleSetPago('Pendiente')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full hover:bg-yellow-200" aria-label="Marcar como Pendiente"><Clock size={14} /> Marcar como Pendiente</button>)}
          </div>
          <div className="flex gap-3">
             {/* Pass clase.id safely */}
            <button onClick={() => { if (clase && clase.id) onDelete(clase.id); onClose(); }} className="p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors" aria-label="Eliminar"><Trash2 size={20} /></button>
            <button onClick={() => { onEdit(clase); onClose(); }} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors" aria-label="Editar"><Edit2 size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CabeceraApp({ vista, setVista, fechaActual, setFechaActual, user, onLogout }) {
    // Safety check for fechaActual
    const safeFechaActual = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();
  const hoy = new Date();
  const handleVistaChange = (e) => { setVista(e.target.value); };
  const irHoy = () => { setFechaActual(hoy); };
  const irAnterior = () => { try { if (vista === 'mes') { setFechaActual(new Date(safeFechaActual.getFullYear(), safeFechaActual.getMonth() - 1, 1)); } else if (vista === 'semana') { setFechaActual(addDays(safeFechaActual, -7)); } else { setFechaActual(addDays(safeFechaActual, -1)); } } catch (e) { console.error("Error navigating back:", e); } };
  const irSiguiente = () => { try { if (vista === 'mes') { setFechaActual(new Date(safeFechaActual.getFullYear(), safeFechaActual.getMonth() + 1, 1)); } else if (vista === 'semana') { setFechaActual(addDays(safeFechaActual, 7)); } else { setFechaActual(addDays(safeFechaActual, +1)); } } catch (e) { console.error("Error navigating next:", e); } };
  const textoFecha = useMemo(() => { try { if (vista === 'mes') { return formatFecha(safeFechaActual, { month: 'long', year: 'numeric' }); } if (vista === 'semana') { const inicio = getInicioSemana(safeFechaActual); const fin = addDays(inicio, 6); if (inicio.getMonth() === fin.getMonth()) { return `${inicio.getDate()} - ${fin.getDate()} de ${formatFecha(inicio, { month: 'long', year: 'numeric' })}`; } return `${formatFecha(inicio, { day: 'numeric', month: 'short' })} - ${formatFecha(fin, { day: 'numeric', month: 'short', year: 'numeric' })}`; } if (vista === 'dia') { return formatFecha(safeFechaActual, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } } catch (e) { console.error("Error formatting header date:", e); return "Error"; } }, [safeFechaActual, vista]); // Use safe date
  return (
    <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20">
      <div className="flex items-center gap-4"><h2 className="text-xl font-semibold text-slate-800 hidden md:block capitalize">{textoFecha}</h2><div className="flex items-center gap-1"><button onClick={irAnterior} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"><ChevronLeft size={20} /></button><button onClick={irSiguiente} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"><ChevronRight size={20} /></button></div><button onClick={irHoy} className="text-sm font-medium text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50">Hoy</button></div>
      <div className="flex items-center gap-4">
          <div className="relative"><select value={vista} onChange={handleVistaChange} className="text-sm font-medium text-slate-700 bg-white border border-slate-300 pl-3 pr-8 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 appearance-none"><option value="mes">Mes</option><option value="semana">Semana</option><option value="dia">Día</option></select><ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
          {user && (<button onClick={onLogout} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors" title={`Cerrar sesión (${user.displayName || user.email || 'Usuario'})`}> <LogOut size={16} /> Salir </button>)}
      </div>
    </header>
  );
}

function CabeceraSemana({ fechaActual, vista }) {
    // Safety check for fechaActual
    const safeFechaActual = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();
  let inicioSemana;
   try {
     inicioSemana = useMemo(() => getInicioSemana(safeFechaActual), [safeFechaActual]); // Use safe date
   } catch (e) { return null; }
  const hoyYMD = toYYYYMMDD(new Date());
  if (vista !== 'semana') { return null; }
  return (
    <div className="grid grid-cols-[auto_repeat(7,1fr)] sticky top-0 bg-white z-10 shadow-sm border-r border-slate-200">
      <div className="w-16 border-b"></div>{DIAS_SEMANA_COMPLETO.map((dia, index) => {
           let fecha;
           try {
             fecha = addDays(inicioSemana, index);
             if (!(fecha instanceof Date) || isNaN(fecha)) throw new Error("Invalid date generated");
           } catch (e) { return <div key={dia} className="p-2 text-center border-b border-l border-slate-200 text-red-500">!</div>; }
          const esHoy = toYYYYMMDD(fecha) === hoyYMD;
           return (<div key={dia} className="p-2 text-center border-b border-l border-slate-200"><span className="text-xs font-semibold text-slate-500 uppercase">{dia.substring(0, 3)}</span><span className={`block text-xl font-medium mt-1 ${esHoy ? 'bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center m-auto' : 'text-slate-700'}`}>{fecha.getDate()}</span></div>); })}
    </div>
  );
}

function CabeceraMes({ vista }) {
  if (vista !== 'mes') return null;
  return (
    <div className="grid grid-cols-7 sticky top-0 bg-white z-10 shadow-sm border-r border-slate-200">{DIAS_SEMANA_COMPLETO.map(dia => (<div key={dia} className="p-2 text-center text-sm font-semibold text-slate-600 border-b border-l border-slate-200">{dia}</div>))}</div>
  );
}

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
  
  // --- Efecto para Autenticación ---
  useEffect(() => {
    if (!auth) { console.warn("Auth no está listo todavía."); setIsLoading(false); setIsAuthReady(false); return; }
    setIsLoading(true);
    let unsubscribeAuth = () => {};
    try {
        unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
          if (user) {
            console.log("Usuario autenticado:", user.uid, user.displayName);
            setUser(user);
            setIsAuthReady(true);
            // Don't set isLoading false immediately, let Firestore effect control it maybe?
            // setIsLoading(false); // Let's try setting it here for simplicity now
          } else {
            console.log("No hay usuario logueado.");
            setUser(null);
            setIsAuthReady(true);
            setClases([]); // Clear classes if logged out
             // Try anonymous sign-in only if specifically desired as a fallback
             // try {
             //    await signInAnonymously(auth);
             // } catch(error) {
             //    console.error("Error signing in anonymously:", error);
             // }
          }
           // Set loading to false after the auth state is determined (or anon sign-in attempted)
           setIsLoading(false);
        });
     } catch (e) { console.error("Error setting up onAuthStateChanged:", e); setIsLoading(false); setIsAuthReady(true); } // Mark ready even on listener error? Maybe false.
    return () => unsubscribeAuth();
  }, []);

  // --- Efecto para Cargar Clases desde Firestore ---
  useEffect(() => {
    // Wait for auth readiness *and* user object
    if (!isAuthReady || !db || !user) { // No longer depends on isLoading directly here
        // If auth is ready but there's no user, ensure classes are empty and stop.
      if (isAuthReady && !user) {
        setClases([]);
      }
      console.log(`Firestore listener: Waiting (isAuthReady=${isAuthReady}, db=${!!db}, user=${!!user})`);
      return;
    }

    console.log(`Firestore listener: Auth ready (userId: ${user.uid}), subscribing...`);
    const collPath = `users/${user.uid}/clases`;
     let unsubscribe = () => {};
     try {
        const q = query(collection(db, collPath));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const clasesDesdeDB = [];
          snapshot.forEach(doc => {
             const data = doc.data();
             // Add more robust validation? Check for date, start/end times?
             if(data && typeof data.materia === 'string') {
                 clasesDesdeDB.push({ ...data, id: doc.id });
             } else { console.warn("Invalid doc data:", doc.id, data); }
          });
          console.log("Firestore data received:", clasesDesdeDB.length);
          setClases(clasesDesdeDB);
           // Data is loaded (or updated), loading is finished for data part
           // We might still be loading auth initially though. Let auth effect handle main isLoading.
        }, (error) => {
             console.error("Error reading Firestore:", error);
             // Optionally set an error state here
             setClases([]); // Clear classes on error
        });
     } catch (e) { console.error("Error setting up Firestore listener:", e); }
    return () => {
        console.log("Firestore listener: Unsubscribing...");
        unsubscribe();
    };
  }, [isAuthReady, user]); // Depend only on auth readiness and user object


  const handleGoogleSignIn = async () => {
    if (!auth) { console.error("Auth not initialized"); return; }
    // No need to set isLoading here, onAuthStateChanged will handle it
    try {
      console.log("Attempting Google Sign In...");
      await signInWithPopup(auth, googleProvider);
      console.log("Google Sign In successful (popup closed).");
      // onAuthStateChanged will update user state and trigger data loading
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // More user-friendly error messages based on error.code
      if (error.code === 'auth/popup-closed-by-user') {
        alert("Inicio de sesión cancelado.");
      } else if (error.code === 'auth/cancelled-popup-request') {
         // Ignore if another popup was opened.
         console.warn("Popup request cancelled.")
      }
      else {
        alert(`Error al iniciar sesión: ${error.message}`);
      }
      // No need to setIsLoading false here, auth state didn't change to logged in
    }
  };

  const handleLogout = async () => {
    if (!auth) { console.error("Auth not initialized"); return; }
    try {
      console.log("Attempting Sign Out...");
      await signOut(auth);
      console.log("Sign Out successful.");
      // onAuthStateChanged will set user to null and clear classes
    } catch (error) { console.error("Error signing out:", error); alert(`Error al cerrar sesión: ${error.message}`); }
  };

  const handleAddClaseClick = (fecha) => {
     const safeDate = (fecha instanceof Date && !isNaN(fecha)) ? fecha : new Date();
     // Ensure default times are valid strings
     const defaultInicio = "09:00";
     const defaultFin = "10:00";
    setClaseParaEditar({ materia: '', alumno: '', fecha: toYYYYMMDD(safeDate), inicio: defaultInicio, fin: defaultFin, nivel: '', estadoPago: 'Pendiente', notas: '' });
    setModalAbierto(true);
  };

  const handleEditClase = (clase) => {
      if (!clase) return;
    setClaseParaEditar(clase);
    setModalAbierto(true);
  };

  const handleSaveClase = async (claseData) => {
    console.log("App: handleSaveClase called with:", claseData);
    // Use isAuthReady AND user check
    if (!isAuthReady || !db || !user) { console.error("Cannot save: App not ready or user not logged in."); alert("No puedes guardar. Asegúrate de haber iniciado sesión y espera a que cargue la aplicación."); return; }
    const collPath = `users/${user.uid}/clases`;
    try {
        if (!claseData || typeof claseData.materia !== 'string' || !claseData.materia.trim()) { console.error("Invalid data to save:", claseData); alert("Error: Datos inválidos."); return; }
        // Ensure required fields for date/time are present
        if (!claseData.fecha || !claseData.inicio || !claseData.fin) {
             console.error("Missing date/time fields:", claseData);
             alert("Error: Falta fecha u hora.");
             return;
        }

      if (claseData.id) { // Editing existing
        console.log("Attempting update:", claseData.id);
        const docRef = doc(db, collPath, claseData.id);
        const dataToSave = { ...claseData }; delete dataToSave.id;
        await setDoc(docRef, dataToSave);
        console.log("Update successful:", claseData.id);
      } else { // Creating new
        console.log("Attempting add new");
        const dataToSave = { ...claseData };
         if ('id' in dataToSave) delete dataToSave.id; // Ensure no id field
        const docRef = await addDoc(collection(db, collPath), dataToSave);
        console.log("Add successful, new ID:", docRef.id);
      }
       // Close modal on success
       setModalAbierto(false);
       setClaseParaEditar(null);
    } catch (error) {
        console.error("Error saving to Firestore:", error);
        alert(`Error al guardar: ${error.message}\nRevisa la consola para más detalles.`);
        // Keep modal open on error? Or provide specific feedback.
        // setModalAbierto(false); // Maybe don't close on error
        // setClaseParaEditar(null);
     }
    // Moved modal closing inside try block's success paths
    // setModalAbierto(false); setClaseParaEditar(null);
  };
  
  const handleDeleteClase = async (id) => {
       if (!id) { console.warn("handleDeleteClase called with no ID"); return; }
    if (!isAuthReady || !db || !user) { console.error("Cannot delete: App not ready or user not logged in."); alert("No puedes eliminar. Asegúrate de haber iniciado sesión."); return; }
    const docPath = `users/${user.uid}/clases/${id}`;
     // Use standard confirm, not window.confirm if possible in React Native / future envs
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
  };

  const renderVista = () => {
      // Pass only necessary props, ensure data validity before passing
      const readyClases = (isAuthReady && user) ? (Array.isArray(clases) ? clases : []) : [];
      const safeDate = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();
    switch(vista) {
      case 'semana': return <VistaSemana fechaActual={safeDate} clases={readyClases} onSelectClase={setClaseSeleccionada} />;
      case 'dia': return <VistaDia fechaActual={safeDate} clases={readyClases} onSelectClase={setClaseSeleccionada} />;
      case 'mes': default: return <VistaMes fechaActual={safeDate} clases={readyClases} onSelectClase={setClaseSeleccionada} onAddClase={handleAddClaseClick} />;
    }
  };

  if (isLoading) {
    return (<div className="flex h-screen items-center justify-center bg-slate-50 text-slate-700 font-semibold text-lg animate-pulse">Cargando calendario...</div>);
  }

   // Display Login screen if auth is ready but no user is logged in
   if (isAuthReady && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-pink-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-sm w-full mx-4">
           <h1 className="text-2xl font-bold text-slate-800 mb-6">Organizador de Clases</h1>
           <p className="text-slate-600 mb-8">Inicia sesión con Google para gestionar tu horario.</p>
           <button
             onClick={handleGoogleSignIn}
             className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
           >
              <LogIn size={20} /> Iniciar Sesión con Google
           </button>
           {/* Optional: Add loading indicator specific to sign-in action */}
        </div>
      </div>
    );
   }

  // Main App UI Rendered only if loading is done AND user is logged in
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
       {/* Ensure Sidebar receives valid props */}
      <Sidebar fechaActual={fechaActual || new Date()} setFechaActual={setFechaActual} clases={clases || []} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <CabeceraApp vista={vista} setVista={setVista} fechaActual={fechaActual || new Date()} setFechaActual={setFechaActual} user={user} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col overflow-auto">
          <CabeceraSemana fechaActual={fechaActual || new Date()} vista={vista} />
          <CabeceraMes vista={vista} />
          {renderVista()}
        </div>
      </main>
      {modalAbierto && (<ClaseModal clase={claseParaEditar} clases={clases || []} onClose={() => { setModalAbierto(false); setClaseParaEditar(null); }} onSave={handleSaveClase} onDelete={handleDeleteClase} isLoading={isLoading}/>)}
      {claseSeleccionada && (<DetalleClaseModal clase={claseSeleccionada} onClose={() => setClaseSeleccionada(null)} onEdit={handleEditClase} onDelete={handleDeleteClase} onSave={handleSaveClase}/>)}
       {/* Floating button disabled based on loading state AND user presence */}
      <button onClick={() => !isLoading && user && handleAddClaseClick(fechaActual)} disabled={!!isLoading || !user} className={`fixed bottom-6 right-6 z-30 group flex items-center justify-start h-14 w-14 hover:w-48 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 ease-in-out overflow-hidden ${(!!isLoading || !user) ? 'opacity-50 cursor-not-allowed' : ''}`} aria-label="Añadir nueva clase">
        <Plus size={28} className="shrink-0 ml-3.5" />
        <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100 ml-2 mr-4">Añadir nueva clase</span>
      </button>
    </div>
  );
}

