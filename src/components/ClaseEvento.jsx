import React, { useMemo } from 'react';
import { User, FileText, Clock } from 'lucide-react';

export default function ClaseEvento({ clase, onSelectClase, style }) {
    if (!clase || typeof clase.materia !== 'string' || typeof clase.inicio !== 'string' || typeof clase.fin !== 'string') { return null; }
    const getBGColor = (materia = "") => { let hash = 0; for (let i = 0; i < materia.length; i++) { hash = materia.charCodeAt(i) + ((hash << 5) - hash); } const h = hash % 360; return `hsl(${h}, 70%, 90%)`; };
    const getBorderColor = (materia = "") => { let hash = 0; for (let i = 0; i < materia.length; i++) { hash = materia.charCodeAt(i) + ((hash << 5) - hash); } const h = hash % 360; return `hsl(${h}, 60%, 60%)`; };
    const bgColor = getBGColor(clase.materia);
    const borderColor = getBorderColor(clase.materia);
    const [inicioH_str, inicioM_str] = clase.inicio.split(':'); const inicioH = parseInt(inicioH_str, 10); const inicioM = parseInt(inicioM_str, 10) || 0;
    const [finH_str, finM_str] = clase.fin.split(':'); const finH = parseInt(finH_str, 10); const finM = parseInt(finM_str, 10) || 0;
    // Calculate duration safely
    const duracion = (!isNaN(inicioH) && !isNaN(finH)) ? (finH * 60 + finM) - (inicioH * 60 + inicioM) : 0;

    {/* --- LÍNEA MODIFICADA (yellow -> red) --- */ }
    const [pagoBg, pagoText] = useMemo(() => { switch (clase.estadoPago) { case 'Pagado': return ['bg-green-100', 'text-green-700']; default: return ['bg-red-100', 'text-red-700']; } }, [clase.estadoPago]);

    return (
        <div style={{ ...style, backgroundColor: bgColor, borderLeftColor: borderColor }} className={`absolute w-[calc(100%-4px)] ml-[2px] p-3 rounded-lg border-l-4 cursor-pointer overflow-hidden shadow-md transition-all hover:shadow-lg border-b-2 border-t-2 border-white`} onClick={() => onSelectClase(clase)}>
            <h4 className="text-sm font-bold" style={{ color: borderColor }}>{clase.materia}</h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-700 mt-1"><Clock size={12} /><span>{clase.inicio} - {clase.fin}</span></div>
            <div className="flex items-center gap-1.5 text-xs text-slate-700 mt-1"><User size={12} /><span>{clase.alumno || 'N/A'}</span></div>
            {clase.notas && duracion > 30 && (<div className="flex items-start gap-1.5 text-xs text-slate-600 mt-2 pt-2 border-t border-slate-300/50"><FileText size={12} className="shrink-0 mt-0.5" /><p className="line-clamp-2">{clase.notas}</p></div>)}

            {/* --- LÍNEA MODIFICADA (Texto) --- */}
            <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${pagoBg} ${pagoText}`}>{clase.estadoPago === 'Pagado' ? 'Pagado' : 'No pagado'}</span>
        </div>
    );
}