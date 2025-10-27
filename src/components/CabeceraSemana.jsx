import React, { useMemo } from 'react';
import { DIAS_SEMANA_COMPLETO } from '../utils/constants';
import { getInicioSemana, addDays, toYYYYMMDD } from '../utils/dates';

export default function CabeceraSemana({ fechaActual, vista }) {
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
                return (<div key={dia} className="p-2 text-center border-b border-l border-slate-200"><span className="text-xs font-semibold text-slate-500 uppercase">{dia.substring(0, 3)}</span><span className={`block text-xl font-medium mt-1 ${esHoy ? 'bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center m-auto' : 'text-slate-700'}`}>{fecha.getDate()}</span></div>);
            })}
        </div>
    );
}