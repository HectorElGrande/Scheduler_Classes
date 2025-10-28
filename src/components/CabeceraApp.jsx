import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, LogOut, User, BarChart3, Calendar, Settings } from 'lucide-react';
import { formatFecha, addDays, getInicioSemana } from '../utils/dates';


// Opciones de VISTA
const VISTA_CALENDARIO_OPTIONS = [
  { value: 'dia', label: 'Día', icon: Calendar },
  { value: 'semana', label: 'Semana', icon: Calendar },
  { value: 'mes', label: 'Mes', icon: Calendar },
];
const VISTA_DASHBOARD_OPTION = { value: 'dashboard', label: 'Estadísticas', icon: BarChart3 };

const VISTA_OPTIONS = [...VISTA_CALENDARIO_OPTIONS, VISTA_DASHBOARD_OPTION];

// Helper para obtener el nombre de la vista
const getVistaLabel = (vista) => {
  return VISTA_OPTIONS.find(o => o.value === vista)?.label || 'Calendario';
};

// Componente CabeceraApp MODIFICADO
export default function CabeceraApp({ vista, setVista, fechaActual, setFechaActual, user, onLogout, onOpenProfile, onOpenDashboard }) { // <-- Agregamos onOpenDashboard
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown de VISTA (móvil)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const vistaDropdownRef = useRef(null);

  // --- Lógica de Fecha/Navegación (Formatos de imagen) ---
  const safeFechaActual = useMemo(() => (fechaActual instanceof Date && !isNaN(fechaActual) ? fechaActual : new Date()), [fechaActual]);

  // Función de capitalización (mantenida como en el ejemplo anterior)
  const capitalizeDateText = (text) => {
      if (!text) return '';
      return text.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
          .replace(/De /g, (match) => match); // Mantiene "De" tal cual
  };

  // Calcula y da formato al texto de la fecha según la vista
  const textoFecha = useMemo(() => { 
    try { 
        if (vista === 'mes') { 
            // Formato paco.png: "Octubre De 2025"
            const formatted = formatFecha(safeFechaActual, { month: 'long', year: 'numeric' });
            return capitalizeDateText(formatted); 
        } 
        if (vista === 'semana') { 
            // Formato pepe.png: "27 Oct - 2 Nov 2025"
            const inicio = getInicioSemana(safeFechaActual); 
            const fin = addDays(inicio, 6); 
            if (inicio.getMonth() === fin.getMonth()) { 
                return `${inicio.getDate()} - ${fin.getDate()} de ${formatFecha(inicio, { month: 'long', year: 'numeric' })}`; 
            } 
            return `${formatFecha(inicio, { day: 'numeric', month: 'short' })} - ${formatFecha(fin, { day: 'numeric', month: 'short', year: 'numeric' })}`; 
        } 
        if (vista === 'dia') { 
            // Formato imagen.png: "Martes, 28 De Octubre De 2025"
            const formatted = formatFecha(safeFechaActual, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            return capitalizeDateText(formatted);
        } 
    } catch (e) { 
        console.error("Error formatting header date:", e); 
        return "Error"; 
    } 
    // Para Dashboard, el título lo gestionamos aparte
    return getVistaLabel(vista); 
  }, [safeFechaActual, vista]);

  // Manejador de navegación (Conservado)
  const handleNavegar = (direction) => {
    if (vista === 'dashboard') return;
    const newDate = new Date(safeFechaActual);
    switch (vista) {
      case 'dia':
        newDate.setDate(newDate.getDate() + direction);
        break;
      case 'semana':
        newDate.setDate(newDate.getDate() + direction * 7);
        break;
      case 'mes':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      default:
        return;
    }
    setFechaActual(newDate);
  };

  // Lógica para cerrar los menús al hacer clic fuera (Conservada)
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
      <div className="flex justify-between items-center max-w-7xl mx-auto">

        {/* IZQUIERDA: Título/Logo */}
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-extrabold text-indigo-700 tracking-tight">Scheduler Pro</h1>
        </div>

        {/* --- CENTRO: NAVEGACIÓN PRINCIPAL (Fecha y Vistas de Calendario) --- */}
        <div className="flex items-center space-x-4 flex-grow justify-center">

          {/* Bloque de Navegación de Fecha (Visible solo en calendario) */}
          {vista !== 'dashboard' ? (
            <div className="flex items-center space-x-2 mr-6">
              {/* Botones de Navegación */}
              <button
                onClick={() => handleNavegar(-1)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition duration-150"
                aria-label="Anterior"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Título de Fecha Central */}
              <button
                onClick={() => setFechaActual(new Date())}
                className="text-xl font-bold text-slate-800 px-3 py-1 rounded-lg hover:bg-slate-100 transition duration-150 whitespace-nowrap"
                title="Volver a Hoy"
              >
                {textoFecha}
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
            <h2 className="text-xl font-bold text-slate-800 px-3 py-1 mr-6">{getVistaLabel(vista)}</h2>
          )}


          {/* Selector de Vistas de Calendario (Tabs en escritorio) */}
          <div className="hidden sm:flex items-center space-x-2">
            <div className="flex p-1 bg-slate-100 rounded-lg">
                {VISTA_CALENDARIO_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    onClick={() => setVista(option.value)}
                    // Solo se marca si la vista activa es de calendario
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
          
          {/* Selector de Vistas (Dropdown en móvil - Incluye Dashboard) */}
          <div className="relative sm:hidden" ref={vistaDropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg transition duration-150 w-32"
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

        {/* --- DERECHA: Menú de Usuario (Incluye Estadísticas/Dashboard) --- */}
        <div className="relative" ref={dropdownRef}>
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

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-20">
              <div className="p-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.displayName || 'Usuario'}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>

              {/* OPCIÓN 1: Estadísticas (Nuevo) */}
              <button
                onClick={() => { onOpenDashboard(); setIsUserMenuOpen(false); }}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <BarChart3 size={16} className="mr-2 text-indigo-500" />
                Estadísticas
              </button>

              {/* OPCIÓN 2: Editar Perfil (Movido hacia abajo) */}
              <button
                onClick={() => { onOpenProfile(); setIsUserMenuOpen(false); }}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <Settings size={16} className="mr-2 text-slate-400" />
                Editar Perfil
              </button>

              <button
                onClick={() => { onLogout(); setIsUserMenuOpen(false); }}
                className="flex items-center w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 border-t border-slate-100"
              >
                <LogOut size={16} className="mr-2" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}