import React from 'react';
import { HORAS_DIA } from '../utils/constants';
import { toYYYYMMDD } from '../utils/dates';
import ClaseEvento from './ClaseEvento';

export default function VistaDia({ fechaActual, clases, onSelectClase }) {
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
        const HORA_INICIO_GRID = 8; const HORA_FIN_GRID = 23; const DURACION_TOTAL_MINUTOS = (HORA_FIN_GRID - HORA_INICIO_GRID) * 60;
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