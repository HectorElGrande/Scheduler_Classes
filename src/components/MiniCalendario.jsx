import React, { useState, useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
// Asegúrate que estas rutas son correctas para tu proyecto
import { toYYYYMMDD, formatFecha, getMatrizMes } from '../utils/dates';
import { DIAS_SEMANA_COMPLETO } from '../utils/constants';

export default function MiniCalendario({ fechaActual, setFechaActual, clases }) {
    const safeFechaActual = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();
    const [mesMostrado, setMesMostrado] = useState(new Date(safeFechaActual.getFullYear(), safeFechaActual.getMonth(), 1));
    const [hoveredDay, setHoveredDay] = useState(null); // { ymd: string, target: HTMLElement } | null
    const [hoveredClases, setHoveredClases] = useState([]);
    const calendarRef = useRef(null);
    const closeTimeoutRef = useRef(null); // <-- Ref para el timeout

    // --- Funciones de Ayuda (sin cambios) ---
    const diasMes = useMemo(() => {
        const currentMesDate = (mesMostrado instanceof Date && !isNaN(mesMostrado)) ? mesMostrado : new Date();
        return getMatrizMes(currentMesDate);
     }, [mesMostrado]);
    const hoyYMD = toYYYYMMDD(new Date());
    const fechaActualYMD = toYYYYMMDD(safeFechaActual);
    const clasesPorDia = useMemo(() => {
        const map = new Map();
        if (!clases || !Array.isArray(clases)) return map;
        for (const clase of clases) {
            if (!clase || typeof clase.fecha !== 'string' || typeof clase.inicio !== 'string') continue;
            const list = map.get(clase.fecha) || [];
            list.push(clase);
            map.set(clase.fecha, list.sort((a, b) => (a.inicio || "").localeCompare(b.inicio || "")));
        }
        return map;
     }, [clases]);
    const irMesAnterior = () => { try { setMesMostrado(new Date(mesMostrado.getFullYear(), mesMostrado.getMonth() - 1, 1)); setHoveredDay(null); } catch (e) { console.error("Error going to previous month:", e) } };
    const irMesSiguiente = () => { try { setMesMostrado(new Date(mesMostrado.getFullYear(), mesMostrado.getMonth() + 1, 1)); setHoveredDay(null); } catch (e) { console.error("Error going to next month:", e) } };
    const getHeatMapClass = (numClases) => {
        if (numClases === 0) { return 'bg-green-200 text-green-800 hover:bg-green-100 font-medium'; }
        if (numClases <= 2) { return 'bg-yellow-200 text-yellow-800 hover:bg-yellow-100 font-medium'; }
        if (numClases <= 3) { return 'bg-orange-400 text-orange-800 hover:bg-orange-300 font-medium'; }
        return 'bg-red-300 text-red-800 hover:bg-red-200';
     };
    const popoverStyle = useMemo(() => {
        if (!hoveredDay || !hoveredDay.target || !calendarRef.current) return { display: 'none' };
        try {
            const targetRect = hoveredDay.target.getBoundingClientRect();
            const containerRect = calendarRef.current.getBoundingClientRect();
            const top = targetRect.top - containerRect.top + (targetRect.height / 2);
            // Mantenemos la posición adyacente
            const left = targetRect.left - containerRect.left + targetRect.width;
            return {
                display: 'block',
                position: 'absolute',
                top: `${top}px`,
                left: `${left}px`,
                transform: 'translateY(-50%)',
                zIndex: 50,
             };
        } catch (e) { console.error("Error calculating popover style:", e); return { display: 'none' }; }
     }, [hoveredDay]);


    // --- LÓGICA DE HOVER CON TIMEOUT ---
    // Función para cancelar cualquier cierre pendiente
    const cancelPopoverClose = useCallback(() => {
        clearTimeout(closeTimeoutRef.current);
    }, []);

    // Función para programar el cierre
    const schedulePopoverClose = useCallback(() => {
        cancelPopoverClose(); // Limpiar anterior por si acaso
        closeTimeoutRef.current = setTimeout(() => {
            setHoveredDay(null);
            setHoveredClases([]);
        }, 100); // 200ms de retraso
    }, [cancelPopoverClose]); // Depende de cancelPopoverClose

    // Al entrar en un día
    const handleDayEnter = useCallback((e, ymd, clasesDia) => {
        cancelPopoverClose(); // Cancelar cierre si entramos a un día
        if (clasesDia && clasesDia.length > 0) {
            setHoveredDay({ ymd, target: e.currentTarget });
            setHoveredClases(clasesDia);
        } else {
            // Si el día no tiene clases, programar cierre (por si venimos de otro con popover)
            schedulePopoverClose();
        }
    }, [cancelPopoverClose, schedulePopoverClose]);

    // Al entrar al popover
    const handlePopoverEnter = useCallback(() => {
        cancelPopoverClose(); // Cancelar cierre al entrar al popover
    }, [cancelPopoverClose]);

    // Al salir de un día O del popover
    const handleMouseLeaveRelated = useCallback(() => {
        schedulePopoverClose(); // Programar cierre al salir de cualquiera de los dos
    }, [schedulePopoverClose]);
    // --- FIN LÓGICA DE HOVER ---

    return (
        // Quitamos onMouseLeave del contenedor principal, ahora se gestiona por elementos
        <div ref={calendarRef} className="relative bg-slate-50 p-4 rounded-lg border border-slate-200">
            {/* Cabecera */}
             <div className="flex justify-between items-center mb-3">
                 <h4 className="text-sm font-semibold text-slate-700 capitalize">{formatFecha(mesMostrado, { month: 'long', year: 'numeric' })}</h4>
                 <div className="flex gap-1">
                     <button onClick={irMesAnterior} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700"><ChevronLeft size={18} /></button>
                     <button onClick={irMesSiguiente} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700"><ChevronRight size={18} /></button>
                 </div>
             </div>
             {/* Días semana */}
             <div className="grid grid-cols-7 text-center mb-2">
                 {DIAS_SEMANA_COMPLETO.map(dia => (<span key={dia} className="text-xs font-semibold text-slate-500 w-7">{dia.substring(0, 1)}</span>))}
             </div>

            {/* Grid días */}
            <div className="grid grid-cols-7">
                {Array.isArray(diasMes) ? diasMes.map((dia, idx) => {
                    // Validar día
                    if (!(dia instanceof Date) || isNaN(dia)) { return <div key={`invalid-${idx}`} className="w-7 h-7 m-auto"></div>; }
                    const ymd = toYYYYMMDD(dia);
                    const esHoy = ymd === hoyYMD;
                    const esSeleccionado = ymd === fechaActualYMD;
                    // Validar mesMostrado
                    const esMesActual = mesMostrado instanceof Date && !isNaN(mesMostrado) && dia.getMonth() === mesMostrado.getMonth();
                    const clasesDia = clasesPorDia.get(ymd);
                    const numClases = clasesDia ? clasesDia.length : 0;

                    return (
                        <button
                            key={ymd}
                            onClick={() => setFechaActual(dia)}
                            onMouseEnter={(e) => handleDayEnter(e, ymd, clasesDia)} // Al entrar, cancela y muestra
                            onMouseLeave={handleMouseLeaveRelated} // Al salir, programa cierre
                            className={`relative p-1 text-xs rounded-full flex items-center justify-center w-7 h-7 m-auto transition-colors
                                ${esMesActual ? getHeatMapClass(numClases) : 'text-slate-300'}
                                ${esSeleccionado ? 'ring-2 ring-inset ring-indigo-500' : ''}
                                ${!esSeleccionado && esHoy ? 'ring-2 ring-inset ring-blue-400' : ''}
                            `}
                        >
                            {dia.getDate()}
                        </button>
                    );
                }) : <p>Error loading days</p>}
            </div>

            {/* Popover */}
            {hoveredDay && hoveredClases.length > 0 && (
                <div
                    style={popoverStyle}
                    className="bg-white p-3 rounded-lg shadow-xl border border-slate-200 w-48"
                    onMouseEnter={handlePopoverEnter} // Al entrar, cancela cierre
                    onMouseLeave={handleMouseLeaveRelated} // Al salir, programa cierre
                >
                     {/* Contenido del popover */}
                      <h5 className="text-xs font-bold text-slate-800 mb-2 pb-1 capitalize">{formatFecha(new Date(hoveredDay.ymd.replace(/-/g, '/')), { weekday: 'short', day: 'numeric', month: 'short' })}</h5>
                     <div className="space-y-1.5 max-h-32 overflow-y-auto">
                         {hoveredClases.map(clase => (
                             clase && clase.id && typeof clase.inicio === 'string' && typeof clase.materia === 'string' ?
                                 (<div key={clase.id} className="text-xs border-t border-slate-200 pt-1 mt-1 first:mt-0 first:pt-0 first:border-t-0">
                                     <span className="font-semibold text-indigo-600"> {clase.inicio} </span>
                                     <span className="text-slate-600 ml-1 truncate"> {clase.materia} </span>
                                     <p className="text-slate-500 truncate font-bold"> {clase.alumno} </p>
                                 </div>)
                                 : null
                         ))}
                     </div>
                </div>
            )}
        </div>
    );
}

