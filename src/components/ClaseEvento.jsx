import React, { useMemo } from 'react';
import { User, FileText, Clock } from 'lucide-react';
// Asegúrate que esta ruta es correcta si la usas
// import { calcularDuracionEnHoras } from '../utils/helpers';

// Funciones de color (definidas fuera o dentro, pero deben estar activas)
const getBGColor = (materia = "") => { let hash = 0; for (let i = 0; i < materia.length; i++) { hash = materia.charCodeAt(i) + ((hash << 5) - hash); } const h = hash % 360; return `hsl(${h}, 70%, 90%)`; };
const getBorderColor = (materia = "") => { let hash = 0; for (let i = 0; i < materia.length; i++) { hash = materia.charCodeAt(i) + ((hash << 5) - hash); } const h = hash % 360; return `hsl(${h}, 60%, 60%)`; };

export default function ClaseEvento({ clase, onSelectClase, style }) {
    // Validaciones iniciales
    if (!clase || typeof clase.materia !== 'string' || typeof clase.inicio !== 'string' || typeof clase.fin !== 'string') {
        return null;
    }

    // --- Colores ---
    const bgColor = getBGColor(clase.materia);
    const borderColor = getBorderColor(clase.materia);

    // --- Calcular Duración en Minutos ---
    let duracionMinutos = 0;
    try {
        const [inicioH, inicioM] = clase.inicio.split(':').map(Number);
        const [finH, finM] = clase.fin.split(':').map(Number);
        if (!isNaN(inicioH) && !isNaN(inicioM) && !isNaN(finH) && !isNaN(finM)) {
            duracionMinutos = (finH * 60 + finM) - (inicioH * 60 + inicioM);
        }
    } catch {
        // Ignorar error si el formato de hora es inválido
    }

    // --- Determinar si usar vista compacta (AHORA < 60 minutos) ---
    const isCompact = duracionMinutos > 0 && duracionMinutos < 60;

    // --- Estilos de Pago ---
    const [pagoBg, pagoText] = useMemo(() => {
        switch (clase.estadoPago) {
            case 'Pagado': return ['bg-green-100', 'text-green-700'];
            default: return ['bg-red-100', 'text-red-700']; // Asumiendo 'No pagado'
        }
    }, [clase.estadoPago]);

    // --- Renderizado Condicional ---
    return (
        <div
            style={{ ...style, backgroundColor: bgColor, borderLeftColor: borderColor }}
            // Padding base p-2, se mantiene para compacto
            className={`absolute w-[calc(100%-4px)] ml-[2px] rounded border-l-4 cursor-pointer overflow-hidden shadow-sm transition-all hover:shadow-lg border-b border-white/50 p-2 md:p-3`}
            onClick={() => onSelectClase(clase)}
        >
            {/* Tag de Estado Pago (tamaño normal siempre) */}
            <span
                className={`absolute top-2 right-2 text-xs px-2 py-0.5 font-medium rounded-full ${pagoBg} ${pagoText}`}
            >
                {clase.estadoPago === 'Pagado' ? 'Pagado' : 'No pagado'}
            </span>

            {/* --- Diseño Normal (>= 60 min) --- */}
            {!isCompact && (
                <>
                    {/* Título un poco más grande y con más espacio */}
                    <h4 className="text-sm font-bold pr-16 mb-1" style={{ color: borderColor }}>{clase.materia}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold"><Clock size={12} /><span>{clase.inicio} - {clase.fin}</span></div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 mt-0.5"><User size={12} /><span>{clase.alumno || 'N/A'}</span></div>
                    {/* Notas solo si hay espacio y existen (>= 60 min) */}
                    {clase.notas && (
                        <div className="hidden md:flex items-start gap-1.5 text-xs text-slate-600 mt-2 pt-2 border-t border-slate-300/50">
                            <FileText size={12} className="shrink-0 mt-0.5" />
                            <p className="line-clamp-2">{clase.notas}</p>
                        </div>
                    )}
                </>
            )}

            {/* --- Diseño Compacto (< 60 min) --- */}
            {isCompact && (
                // Usamos un layout vertical simple
                <div className="space-y-0.5 pr-16"> {/* Espacio para el badge */}
                    {/* Materia */}
                    <h4 className="text-xs font-bold truncate" style={{ color: borderColor }}>{clase.materia}</h4>
                    {/* Hora */}
                    <div className="flex items-center gap-1 text-xs text-slate-700">
                        <Clock size={12} className="shrink-0" />
                        <span className="font-semibold">{clase.inicio}-{clase.fin}</span>
                    </div>
                    {/* Alumno */}
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                        <User size={12} className="shrink-0" />
                        <span className="truncate">{clase.alumno || 'N/A'}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

