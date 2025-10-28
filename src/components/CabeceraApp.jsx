import React, { useState, useMemo, useRef, useEffect } from 'react'; // <-- Añadir hooks necesarios
import { ChevronLeft, ChevronRight, ChevronDown, LogOut, User, Edit2 } from 'lucide-react'; // <-- Añadir Edit2
import { formatFecha, addDays, getInicioSemana } from '../utils/dates';

// <-- Añadir onOpenProfile como prop
export default function CabeceraApp({ vista, setVista, fechaActual, setFechaActual, user, onLogout, onOpenProfile }) {
    // --- LÓGICA DE FECHA (SIN CAMBIOS) ---
    const safeFechaActual = (fechaActual instanceof Date && !isNaN(fechaActual)) ? fechaActual : new Date();
    const hoy = new Date();
    const handleVistaChange = (e) => { setVista(e.target.value); };
    const irHoy = () => { setFechaActual(hoy); };
    const irAnterior = () => { try { if (vista === 'mes') { setFechaActual(new Date(safeFechaActual.getFullYear(), safeFechaActual.getMonth() - 1, 1)); } else if (vista === 'semana') { setFechaActual(addDays(safeFechaActual, -7)); } else { setFechaActual(addDays(safeFechaActual, -1)); } } catch (e) { console.error("Error navigating back:", e); } };
    const irSiguiente = () => { try { if (vista === 'mes') { setFechaActual(new Date(safeFechaActual.getFullYear(), safeFechaActual.getMonth() + 1, 1)); } else if (vista === 'semana') { setFechaActual(addDays(safeFechaActual, 7)); } else { setFechaActual(addDays(safeFechaActual, +1)); } } catch (e) { console.error("Error navigating next:", e); } };
    const textoFecha = useMemo(() => { try { if (vista === 'mes') { return formatFecha(safeFechaActual, { month: 'long', year: 'numeric' }); } if (vista === 'semana') { const inicio = getInicioSemana(safeFechaActual); const fin = addDays(inicio, 6); if (inicio.getMonth() === fin.getMonth()) { return `${inicio.getDate()} - ${fin.getDate()} de ${formatFecha(inicio, { month: 'long', year: 'numeric' })}`; } return `${formatFecha(inicio, { day: 'numeric', month: 'short' })} - ${formatFecha(fin, { day: 'numeric', month: 'short', year: 'numeric' })}`; } if (vista === 'dia') { return formatFecha(safeFechaActual, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } } catch (e) { console.error("Error formatting header date:", e); return "Error"; } }, [safeFechaActual, vista]); // Use safe date

    // --- LÓGICA DE DROPDOWN AÑADIDA ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Cierra el menú si el clic fue fuera del div contenedor del dropdown
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    // --- FIN LÓGICA DE DROPDOWN ---

    return (
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-slate-800 hidden md:block capitalize">{textoFecha}</h2>
                <div className="flex items-center gap-1">
                    <button onClick={irAnterior} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"><ChevronLeft size={20} /></button>
                    <button onClick={irSiguiente} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"><ChevronRight size={20} /></button>
                </div>
                <button onClick={irHoy} className="text-sm font-medium text-slate-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50">Hoy</button>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <select
                        value={vista}
                        onChange={handleVistaChange}
                        className="text-sm font-medium text-slate-700 bg-white border border-slate-300 pl-3 pr-8 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 appearance-none"
                    >
                        <option value="mes">Mes</option>
                        <option value="semana">Semana</option>
                        <option value="dia">Día</option>
                        {/* <option value="dashboard">Estadísticas</option> <-- Oculta si no está implementada */}
                    </select>
                    <ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {user && (
                    <div className="relative" ref={dropdownRef}>
                        {/* Botón/Imagen de Perfil */}
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 transition-shadow"
                            title="Ver perfil / Cerrar sesión"
                        >
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Perfil" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User size={20} />
                            )}
                        </button>

                        {/* Menú Desplegable */}
                        {isDropdownOpen && (
                            <div className="absolute top-12 right-0 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-50 origin-top-right animate-in fade-in zoom-in-95">

                                {/* Info de usuario */}
                                <div className="p-3 border-b border-slate-200">
                                    <p className="text-sm font-semibold text-slate-800 truncate" title={user.displayName || 'Usuario'}>{user.displayName || 'Usuario'}</p>
                                    <p className="text-xs text-slate-500 truncate" title={user.email || ''}>{user.email || ''}</p>
                                </div>

                                <div className="p-1">
                                    {/* Opción Editar Perfil */}
                                    <button
                                        onClick={() => {
                                            onOpenProfile(); // <-- Abre el modal
                                            setIsDropdownOpen(false); // Cierra el dropdown
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 rounded-md hover:bg-slate-100"
                                    >
                                        <Edit2 size={16} />
                                        Editar Perfil
                                    </button>

                                    {/* Opción Cerrar Sesión */}
                                    <button
                                        onClick={onLogout} // <-- Cierra la sesión
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 hover:text-red-700"
                                    >
                                        <LogOut size={16} />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
