import React, { useMemo } from 'react';
import { HORAS_DIA } from '../utils/constants';
import { getInicioSemana, addDays, toYYYYMMDD } from '../utils/dates';
import ClaseEvento from './ClaseEvento';

export default function VistaSemana({ fechaActual, clases, onSelectClase, onAddClase }) {
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
        const duracionTotalEnMinutos = (23 - 8) * 60; const duracionEventoEnMinutos = finEnMinutos - inicioEnMinutos;
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
                    <div key={index} className="relative border-l border-slate-200" onClick={() => onAddClase(dia)}>
                        {HORAS_DIA.map(hora => (<div key={hora} className="h-24 border-t border-slate-200 hover:bg-slate-100"></div>))}
                        <div className="absolute inset-0 ">{clasesDelDia.map(clase => (
                            clase && clase.id ? (<ClaseEvento key={clase.id} clase={clase} onSelectClase={onSelectClase} style={calcularPosicionEvento(clase)} />) : null
                        ))}</div>
                    </div>
                );
            })}
        </div>
    );
}