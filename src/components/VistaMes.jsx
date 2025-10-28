import React, { useMemo } from 'react';
// Asegúrate que las rutas son correctas
import { getMatrizMes, toYYYYMMDD } from '../utils/dates';

// Añadir setVista y setFechaActual a los props
export default function VistaMes({ fechaActual, clases, onSelectClase, onAddClase, setVista, setFechaActual }) {
    if (!Array.isArray(clases)) clases = [];
    // Validar props necesarios
    if (typeof setVista !== 'function' || typeof setFechaActual !== 'function') {
        console.error("VistaMes requiere setVista y setFechaActual como props.");
        // Podrías retornar un mensaje de error o null
        return <div className="text-red-500 p-4">Error: Faltan props necesarios en VistaMes.</div>;
    }
    const safeFechaActual = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();
    const diasMes = useMemo(() => getMatrizMes(safeFechaActual), [safeFechaActual]);
    const hoyYMD = toYYYYMMDD(new Date());

    // --- NUEVA FUNCIÓN HANDLER ---
    const handleVerMasClick = (e, dia) => {
        e.stopPropagation(); // Evitar que se active el onAddClase del div padre
        setFechaActual(dia); // Establecer la fecha actual al día clickeado
        setVista('semana');  // Cambiar la vista a 'semana'
    };
    // --- FIN NUEVA FUNCIÓN ---

    return (
        <div className="flex-1 grid grid-cols-7 grid-rows-6 border-r border-b border-slate-200">
            {Array.isArray(diasMes) && diasMes.map((dia, index) => {
                if (!(dia instanceof Date) || isNaN(dia)) return <div key={`error-${index}`} className="border-t border-l border-red-300 bg-red-50">!</div>;

                const fechaYMD = toYYYYMMDD(dia);
                const esMesActual = dia.getMonth() === safeFechaActual.getMonth();
                const esHoy = fechaYMD === hoyYMD;
                const clasesDelDia = (clases.filter(c => c && c.fecha === fechaYMD) || []).sort((a, b) => (a.inicio || "").localeCompare(b.inicio || ""));
                const numClases = clasesDelDia.length;

                return (
                    <div key={fechaYMD} className={`relative p-2 border-t border-l border-slate-200 ${esMesActual ? 'bg-white' : 'bg-slate-50'} overflow-hidden flex flex-col cursor-pointer hover:bg-slate-100 transition-colors`} onClick={() => onAddClase(dia)}>

                        {/* Indicador número de día */}
                        <span className={`mb-1 text-xs font-medium ${esHoy ? 'bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : esMesActual ? 'text-slate-700' : 'text-slate-400'}`}>
                            {dia.getDate()}
                        </span>

                        {/* Burbuja contador */}
                        {esMesActual && numClases > 0 && (
                            <span className="absolute top-1 right-1 bg-blue-100 text-blue-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center justify-center whitespace-nowrap">
                                {numClases} clase{numClases > 1 ? 's' : ''}
                            </span>
                        )}

                        {/* Lista de clases */}
                        <div className="flex-1 space-y-1 overflow-y-auto">
                            {clasesDelDia.slice(0, 3).map(clase => (
                                // ... (renderizado de cada clase sin cambios) ...
                                clase && clase.id ? (
                                    <div key={clase.id} className={`text-xs rounded ${clase.estadoPago === 'Pagado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-800'} overflow-hidden`} onClick={(e) => { e.stopPropagation(); onSelectClase(clase); }}>
                                        <span className={`sm:hidden w-2 h-2 rounded-full m-1.5 inline-block ${clase.estadoPago === 'Pagado' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                        <span className={`hidden sm:inline-block p-1 w-full truncate`}>
                                            <span className="font-semibold">{clase.inicio}-{clase.fin}</span> {clase.materia || 'N/A'}
                                        </span>
                                    </div>
                                ) : null
                            ))}
                            {/* --- ENLACE "+ VER MÁS" (MODIFICADO) --- */}
                            {numClases > 3 && (
                                <button
                                    onClick={(e) => handleVerMasClick(e, dia)} // Usar el nuevo handler
                                    className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium w-full text-left mt-1" // Estilo de botón/enlace
                                >
                                    + Ver más
                                </button>
                            )}
                            {/* --- FIN ENLACE --- */}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

