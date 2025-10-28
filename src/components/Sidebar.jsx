import React, { useMemo, useState } from 'react';
// Corregir/Verificar rutas de importación
import MiniCalendario from './MiniCalendario'; // Asume que está en la misma carpeta (components)
import AlumnosLista from './AlumnosLista';   // Asume que está en la misma carpeta (components)
import { toYYYYMMDD } from '../utils/dates'; // Asume que dates.js está en src/utils/
import { DollarSign } from 'lucide-react';

export default function Sidebar({
  fechaActual, setFechaActual, clases,
  alumnos, onAddAlumno, onUpdateAlumno, onDeleteAlumno, onOpenDetail,
  onSaveClase
}) {
  const hoyYMD = toYYYYMMDD(new Date());
  const [savingClassId, setSavingClassId] = useState(null);

  const clasesHoy = useMemo(() => {
    if (!Array.isArray(clases)) return [];
    return (clases.filter(c => c && c.fecha === hoyYMD) || [])
      .sort((a, b) => (a.inicio || "").localeCompare(b.inicio || ""));
  }, [clases, hoyYMD]);

  const handleMarkAsPaid = async (clase) => {
     if (savingClassId) return;
     setSavingClassId(clase.id);
     try {
       await onSaveClase({ ...clase, estadoPago: 'Pagado' });
     } catch (error) {
       console.error("Error al marcar como pagado desde Sidebar:", error);
       alert("No se pudo marcar la clase como pagada.");
     } finally {
       setSavingClassId(null);
     }
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col h-screen relative z-20">
      
      {/* --- CSS CORREGIDO PARA OCULTAR SCROLLBAR --- */}
      {/* Usamos una etiqueta <style> estándar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          width: 0; /* Oculta barra en Chrome/Safari */
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
      {/* --- FIN CSS CORREGIDO --- */}

      <MiniCalendario fechaActual={fechaActual || new Date()} setFechaActual={setFechaActual} clases={clases} />

      {/* Agenda de Hoy */}
      {/* Aplicamos la clase 'hide-scrollbar' */}
      <div className="flex-1 space-y-4 overflow-y-auto pt-6 hide-scrollbar">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Agenda de Hoy</h3>
            {clasesHoy.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {clasesHoy.length} clase{clasesHoy.length !== 1 ? 's' : ''}
                </span>
            )}
        </div>

        {clasesHoy.length > 0 ? (
          <div className="space-y-3">
            {clasesHoy.map(clase => (
              clase && clase.id ? (
                <div key={clase.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 relative">
                   <div className="flex justify-between items-start mb-1">
                     <span className="text-sm font-semibold text-indigo-700">{clase.inicio || 'N/A'} - {clase.fin || 'N/A'}</span>
                     {clase.estadoPago === 'Pagado' ? (
                       <span className="text-xs text-green-600 font-medium ml-2">Pagado</span>
                     ) : (
                       <button
                         onClick={() => handleMarkAsPaid(clase)}
                         disabled={savingClassId === clase.id}
                         className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200 disabled:opacity-50 disabled:cursor-wait`}
                         title="Marcar como Pagado"
                       >
                         <DollarSign size={12} />
                         {savingClassId === clase.id ? '...' : ''}
                       </button>
                     )}
                   </div>
                   <p className="text-sm font-medium text-slate-700 pr-10">{clase.materia || 'N/A'}</p>
                   <p className="text-sm text-slate-500">{clase.alumno || 'N/A'}</p>
                </div>
              ) : null
            ))}
          </div>
        ) : (<p className="text-sm text-slate-500 italic">No hay clases programadas para hoy.</p>)}
      </div>

      {/* Lista de Alumnos */}
      <div className="pt-6 mt-6 border-t border-slate-200">
        <AlumnosLista
          alumnos={alumnos}
          onAddAlumno={onAddAlumno}
          onUpdateAlumno={onUpdateAlumno}
          onDeleteAlumno={onDeleteAlumno}
          onOpenDetail={onOpenDetail}
        />
      </div>
    </aside>
  );
}
