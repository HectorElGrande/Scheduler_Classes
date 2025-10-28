import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, LogOut, User, BarChart3, Calendar, Settings, Skull } from 'lucide-react';
import { formatFecha, addDays, getInicioSemana } from '../utils/dates';


// Opciones de VISTA (sin cambios)
const VISTA_CALENDARIO_OPTIONS = [
  { value: 'dia', label: 'Día', icon: Calendar },
  { value: 'semana', label: 'Semana', icon: Calendar },
  { value: 'mes', label: 'Mes', icon: Calendar },
];
const VISTA_DASHBOARD_OPTION = { value: 'dashboard', label: 'Estadísticas', icon: BarChart3 };
const VISTA_OPTIONS = [...VISTA_CALENDARIO_OPTIONS, VISTA_DASHBOARD_OPTION];

const getVistaLabel = (vista) => {
  return VISTA_OPTIONS.find(o => o.value === vista)?.label || 'Calendario';
};

// Componente CabeceraApp MODIFICADO
export default function CabeceraApp({ vista, setVista, fechaActual, setFechaActual, user, onLogout, onOpenProfile, onOpenDashboard, onOpenMorosos }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const vistaDropdownRef = useRef(null);

  // --- Lógica de Fecha/Navegación ---
  const safeFechaActual = useMemo(() => (fechaActual instanceof Date && !isNaN(fechaActual) ? fechaActual : new Date()), [fechaActual]);

  const capitalizeDateText = (text) => {
      if (!text) return '';
      return text.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .replace(/De /g, (match) => match)
        .replace(/,/g, ''); // <-- Quita comas para ahorrar espacio
  };

  // CAMBIO 1: Formato LARGO (el que tenías) para DESKTOP
  const textoFechaLargo = useMemo(() => { 
    try { 
        if (vista === 'mes') { 
            const formatted = formatFecha(safeFechaActual, { month: 'long', year: 'numeric' });
            return capitalizeDateText(formatted); 
        } 
        if (vista === 'semana') { 
            const inicio = getInicioSemana(safeFechaActual); 
            const fin = addDays(inicio, 6); 
            if (inicio.getMonth() === fin.getMonth()) { 
                return `${inicio.getDate()} - ${fin.getDate()} de ${formatFecha(inicio, { month: 'long', year: 'numeric' })}`; 
            } 
            return `${formatFecha(inicio, { day: 'numeric', month: 'short' })} - ${formatFecha(fin, { day: 'numeric', month: 'short', year: 'numeric' })}`; 
        } 
        if (vista === 'dia') { 
            const formatted = formatFecha(safeFechaActual, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            return capitalizeDateText(formatted);
        } 
    } catch (e) { 
        console.error("Error formatting header date (long):", e); 
        return "Error"; 
    } 
    return getVistaLabel(vista); 
  }, [safeFechaActual, vista]);

  // CAMBIO 2: Formato CORTO para MÓVIL
  const textoFechaCorto = useMemo(() => {
    try {
        if (vista === 'mes') { 
            // "Oct 2025"
            return capitalizeDateText(formatFecha(safeFechaActual, { month: 'short', year: 'numeric' }));
        } 
        if (vista === 'semana') { 
            // "27 Oct - 2 Nov"
            const inicio = getInicioSemana(safeFechaActual); 
            const fin = addDays(inicio, 6); 
            return `${formatFecha(inicio, { day: 'numeric', month: 'short' })} - ${formatFecha(fin, { day: 'numeric', month: 'short' })}`; 
        } 
        if (vista === 'dia') { 
            // "Mar 28 Oct 2025"
            const formatted = formatFecha(safeFechaActual, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
            return capitalizeDateText(formatted);
        }
    } catch (e) { 
        console.error("Error formatting header date (short):", e);
        return "Error";
    }
    return getVistaLabel(vista);
  }, [safeFechaActual, vista]);


  // ... (handleNavegar y useEffect sin cambios) ...
  const handleNavegar = (direction) => {
    if (vista === 'dashboard') return;
    const newDate = new Date(safeFechaActual);
    switch (vista) {
      case 'dia': newDate.setDate(newDate.getDate() + direction); break;
      case 'semana': newDate.setDate(newDate.getDate() + direction * 7); break;
      case 'mes': newDate.setMonth(newDate.getMonth() + direction); break;
      default: return;
    }
    setFechaActual(newDate);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (vistaDropdownRef.current && !vistaDropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  // --- Renderizado del Componente ---
  return (
    <header className="bg-white shadow-md border-b border-slate-100 p-4 sticky top-0 z-30">
      {/* Estructura de 2 filas (flex-wrap) que pasa a 1 fila en 'md' (md:flex-nowrap) */}
      <div className="flex justify-between items-center max-w-7xl mx-auto flex-wrap md:flex-nowrap">
        {/* CENTRO: NAVEGACIÓN (Fila 2 en móvil, Centro en desktop) */}
        <div className="flex items-center space-x-4 flex-grow justify-center w-full md:w-auto order-3 md:order-2 mt-4 md:mt-0">

          {/* Bloque de Navegación de Fecha */}
          {vista !== 'dashboard' ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleNavegar(-1)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition duration-150"
                aria-label="Anterior"
              >
                <ChevronLeft size={20} />
              </button>

              {/* CAMBIO 3: Botón de Fecha con Doble Span */}
              <button
                onClick={() => setFechaActual(new Date())}
                // 'truncate' evita desbordes, 'px-2' da menos padding en móvil
                className="text-base font-bold text-slate-800 px-2 sm:px-3 py-1 rounded-lg hover:bg-slate-100 transition duration-150 whitespace-nowrap truncate"
                title="Volver a Hoy"
              >
                {/* Texto para móvil (visible < md) */}
                <span className="md:hidden">{textoFechaCorto}</span>
                {/* Texto para desktop (oculto < md) */}
                <span className="hidden md:inline text-xl">{textoFechaLargo}</span>
              </button>

              <button
                onClick={() => handleNavegar(1)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition duration-150"
                aria-label="Siguiente"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            /* Título para Dashboard */
            <h2 className="text-xl font-bold text-slate-800 px-3 py-1">{getVistaLabel(vista)}</h2>
          )}


          {/* Selector de Vistas (Tabs en escritorio 'md:flex') */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="flex p-1 bg-slate-100 rounded-lg">
                {VISTA_CALENDARIO_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    onClick={() => setVista(option.value)}
                    className={`flex items-center px-3 py-1.5 mx-2 text-sm font-medium rounded-md transition duration-150 ${vista === option.value
                        ? 'bg-white shadow text-indigo-700'
                        : 'text-slate-600 hover:text-indigo-700 hover:bg-white'
                    }`}
                >
                    {option.label}
                </button>
                ))}
            </div>
          </div>
          
          {/* Selector de Vistas (Dropdown en móvil 'md:hidden') */}
          <div className="relative md:hidden" ref={vistaDropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg transition duration-150 w-auto"
            >
              {VISTA_OPTIONS.find(o => o.value === vista)?.icon && React.createElement(VISTA_OPTIONS.find(o => o.value === vista).icon, { size: 16, className: "mr-1" })}
              {getVistaLabel(vista)}
              <ChevronDown size={14} className={`ml-2 transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'} transition-transform`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-20">
                {VISTA_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setVista(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-2 text-left text-sm ${vista === option.value ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <option.icon size={16} className="mr-2" />
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* DERECHA: Menú de Usuario (Fila 1, Derecha) */}
        <div className="relative order-2 md:order-3" ref={dropdownRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 p-1 bg-slate-100 rounded-full hover:bg-slate-200 transition duration-150"
            aria-label="Menú de usuario"
          >
            <span className="hidden sm:inline text-sm font-medium text-slate-700 ml-2">{user.displayName || user.email}</span>
            <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-500 flex items-center justify-center text-white">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Perfil" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/36x36/6366f1/ffffff?text=U'; }} />
              ) : (
                <User size={20} />
              )}
            </div>
          </button>

          {/* ... Menú dropdown (sin cambios) ... */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-20">
              <div className="p-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.displayName || 'Usuario'}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => { onOpenDashboard(); setIsUserMenuOpen(false); }}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <BarChart3 size={17} className="mr-2 text-indigo-500" />
                Estadísticas
              </button>
              <button
                onClick={() => { onOpenMorosos(); setIsUserMenuOpen(false); }}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-slate-50"
              >
                <Skull size={17} className="mr-2"/>
                Morosos
              </button>
              <button
                onClick={() => { onOpenProfile(); setIsUserMenuOpen(false); }}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <Settings size={17} className="mr-2 text-slate-400" />
                Editar Perfil
              </button>
              <button
                onClick={() => { onLogout(); setIsUserMenuOpen(false); }}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 border-t border-slate-100"
              >
                <LogOut size={17} className="mr-2" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}