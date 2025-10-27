import React, { useState, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toYYYYMMDD, formatFecha, getMatrizMes } from '../utils/dates';
import { DIAS_SEMANA_COMPLETO } from '../utils/constants';

export default function MiniCalendario({ fechaActual, setFechaActual, clases }) {
    // ... (hooks y funciones sin cambios) ...
    const safeFechaActual = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();
    const [mesMostrado, setMesMostrado] = useState(new Date(safeFechaActual.getFullYear(), safeFechaActual.getMonth(), 1));
    const [hoveredDay, setHoveredDay] = useState(null);
    const [hoveredClases, setHoveredClases] = useState([]);
    const calendarRef = useRef(null);

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

    const getHeatMapClass = (numClases) => {
        // Esta función aplica el fondo y el texto base
        if (numClases === 0) {
            return 'bg-green-100 text-green-800 hover:bg-green-200 font-medium';
        }
        if (numClases <= 2) {
            return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 font-medium';
        }
        if (numClases <= 4) {
            return 'bg-orange-100 text-orange-800 hover:bg-orange-200 font-medium';
        }
        return 'bg-red-100 text-red-800 hover:bg-red-200 font-bold';
    };

    return (
        <div ref={calendarRef} className="relative bg-slate-50 p-4 rounded-lg border border-slate-200" onMouseLeave={handleMouseLeaveCalendar}>
            {/* ... (Cabecera y días de la semana sin cambios) ... */}
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
                {Array.isArray(diasMes) ? diasMes.map((dia, idx) => {
                    if (!(dia instanceof Date) || isNaN(dia)) {
                        return <div key={`invalid-${idx}`} className="w-7 h-7 m-auto"></div>;
                    }
                    const ymd = toYYYYMMDD(dia);
                    const esHoy = ymd === hoyYMD;
                    const esSeleccionado = ymd === fechaActualYMD;
                    const esMesActual = dia.getMonth() === mesMostrado.getMonth();
                    const clasesDia = clasesPorDia.get(ymd);
                    const numClases = clasesDia ? clasesDia.length : 0;

                    return (
                        <button
                            key={ymd}
                            onClick={() => setFechaActual(dia)}
                            onMouseEnter={(e) => handleDayHover(e, ymd, clasesDia)}

                            // --- SECCIÓN DE CLASSNAME (MODIFICADA) ---
                            // Se añade "ring-inset" a las dos últimas líneas
                            className={`relative p-1 text-xs rounded-full flex items-center justify-center w-7 h-7 m-auto transition-colors
                ${esMesActual ? getHeatMapClass(numClases) : 'text-slate-300'}
                ${esSeleccionado ? 'ring-2 ring-inset ring-indigo-500' : ''}
                ${!esSeleccionado && esHoy ? 'ring-2 ring-inset ring-blue-400' : ''}
              `}>
                            {/* --- FIN SECCIÓN MODIFICADA --- */}

                            {dia.getDate()}
                        </button>
                    );
                }) : <p>Error loading days</p>}
            </div>

            {/* ... (El popover no cambia) ... */}
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