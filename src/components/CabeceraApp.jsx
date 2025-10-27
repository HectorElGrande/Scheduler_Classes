import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, LogOut, User } from 'lucide-react'; // <-- Añadir User
import { formatFecha, addDays, getInicioSemana } from '../utils/dates';

// <-- Añadir onOpenProfile como prop
export default function CabeceraApp({ vista, setVista, fechaActual, setFechaActual, user, onLogout, onOpenProfile }) {
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
                {user && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                            title={`Cerrar sesión`}
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Salir</span>
                        </button>

                        <button
                            onClick={onOpenProfile}
                            className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2"
                            title="Ver perfil"
                        >
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Perfil" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User size={20} />
                            )}
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}