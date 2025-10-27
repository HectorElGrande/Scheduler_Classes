import React, { useMemo } from 'react';
import { getMatrizMes, toYYYYMMDD } from '../utils/dates';

export default function VistaMes({ fechaActual, clases, onSelectClase, onAddClase }) {
    if (!Array.isArray(clases)) clases = [];
    const safeFechaActual = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();
    const diasMes = useMemo(() => getMatrizMes(safeFechaActual), [safeFechaActual]);
    const hoyYMD = toYYYYMMDD(new Date());
    return (
        <div className="flex-1 grid grid-cols-7 grid-rows-6 border-r border-b border-slate-200">
            {Array.isArray(diasMes) && diasMes.map((dia, index) => {
                if (!(dia instanceof Date) || isNaN(dia)) return <div key={`error-${index}`} className="border-t border-l border-red-300 bg-red-50">!</div>;
                const fechaYMD = toYYYYMMDD(dia); const esMesActual = dia.getMonth() === safeFechaActual.getMonth(); const esHoy = fechaYMD === hoyYMD;
                const clasesDelDia = (clases.filter(c => c && c.fecha === fechaYMD) || []).sort((a, b) => (a.inicio || "").localeCompare(b.inicio || ""));
                return (
                    <div key={fechaYMD} className={`p-2 border-t border-l border-slate-200 ${esMesActual ? 'bg-white' : 'bg-slate-50'} overflow-hidden flex flex-col cursor-pointer hover:bg-slate-100 transition-colors`} onClick={() => onAddClase(dia)}>
                        <span className={`mb-1 text-xs font-medium ${esHoy ? 'bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : esMesActual ? 'text-slate-700' : 'text-slate-400'}`}>{dia.getDate()}</span>
                        <div className="flex-1 space-y-1 overflow-y-auto">
                            {clasesDelDia.slice(0, 3).map(clase => (
                                clase && clase.id ? (

                                    /* --- LÍNEA MODIFICADA (yellow -> red) --- */
                                    <div key={clase.id} className={`text-xs rounded ${clase.estadoPago === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-800'} overflow-hidden`} onClick={(e) => { e.stopPropagation(); onSelectClase(clase); }}>

                                        {/* --- LÍNEA MODIFICADA (yellow -> red) --- */}
                                        <span className={`sm:hidden w-2 h-2 rounded-full m-1.5 inline-block ${clase.estadoPago === 'Pagado' ? 'bg-green-400' : 'bg-red-400'}`}></span>

                                        <span className={`hidden sm:inline-block p-1 w-full truncate`}>
                                            <span className="font-semibold">{clase.inicio}-{clase.fin}</span> {clase.materia || 'N/A'}
                                        </span>
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