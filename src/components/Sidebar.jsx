import React, { useMemo } from 'react';
import MiniCalendario from './MiniCalendario';
import AlumnosLista from './AlumnosLista'; // <-- 1. Importar
import { toYYYYMMDD } from '../utils/dates';

// <-- 2. Recibe props para AlumnosLista
export default function Sidebar({
  fechaActual, setFechaActual, clases,
  alumnos, onAddAlumno, onUpdateAlumno, onDeleteAlumno
}) {
  const hoyYMD = toYYYYMMDD(new Date());
  const clasesHoy = useMemo(() => {
    if (!Array.isArray(clases)) return [];
    return (clases.filter(c => c && c.fecha === hoyYMD) || [])
      .sort((a, b) => (a.inicio || "").localeCompare(b.inicio || ""));
  }, [clases, hoyYMD]);

  return (
    <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col h-screen relative z-20">

      <MiniCalendario fechaActual={fechaActual || new Date()} setFechaActual={setFechaActual} clases={clases} />

      <div className="flex-1 space-y-4 overflow-y-auto pt-6">
        <h3 className="text-sm font-semibold text-slate-700">Agenda de Hoy</h3>
        {clasesHoy.length > 0 ? (
          <div className="space-y-3">
            {clasesHoy.map(clase => (
              clase && clase.id ?
              (<div key={clase.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-indigo-700">{clase.inicio || 'N/A'} - {clase.fin || 'N/A'}</span>
                  {clase.estadoPago === 'Pagado' ? (<span className="text-xs text-green-600 font-medium">Pagado</span>) : (<span className="text-xs text-red-600 font-medium">No pagado</span>)}
                </div>
                <p className="text-sm font-medium text-slate-700">{clase.materia || 'N/A'}</p>
                {/* Mostramos el nombre del alumno guardado en la clase */}
                <p className="text-sm text-slate-500">{clase.alumno || 'N/A'}</p>
              </div>) : null
            ))}
          </div>
        ) : (<p className="text-sm text-slate-500 italic">No hay clases programadas para hoy.</p>)}
      </div>

      {/* --- 3. AÑADIDO: Sección de Alumnos --- */}
      <AlumnosLista
        alumnos={alumnos}
        onAddAlumno={onAddAlumno}
        onUpdateAlumno={onUpdateAlumno}
        onDeleteAlumno={onDeleteAlumno}
      />
      {/* --- FIN AÑADIDO --- */}

    </aside>
  );
}