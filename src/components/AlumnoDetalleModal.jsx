import React, { useMemo } from 'react';
import { X, User, Phone, Mail, BookOpen, Calendar, Clock, DollarSign } from 'lucide-react';
import { formatFecha, toYYYYMMDD } from '../utils/dates'; // Importar toYYYYMMDD

export default function AlumnoDetalleModal({ alumno, clasesDelAlumno, onClose }) {
  if (!alumno) return null;

  // Ordenar clases por fecha (más recientes primero)
  const clasesOrdenadas = useMemo(() => {
    return [...clasesDelAlumno].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [clasesDelAlumno]);

  // Calcular estadísticas simples
  const stats = useMemo(() => {
    const totalClases = clasesDelAlumno.length;
    const clasesPagadas = clasesDelAlumno.filter(c => c.estadoPago === 'Pagado').length;
    const clasesNoPagadas = totalClases - clasesPagadas;
    // Podríamos calcular ingresos totales si tuviéramos el precio guardado
    return { totalClases, clasesPagadas, clasesNoPagadas };
  }, [clasesDelAlumno]);

  const hoyYMD = toYYYYMMDD(new Date());

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex justify-between items-center p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-full">
              <User size={20} className="text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">{alumno.nombre || 'Detalles del Alumno'}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100"><X size={22} /></button>
        </div>

        {/* Contenido */}
        <div className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna Izquierda: Detalles y Estadísticas */}
          <div className="md:col-span-1 space-y-4">
            <h4 className="text-sm font-semibold text-slate-600 mb-2">Información de Contacto</h4>
            <div className="space-y-2 text-sm">
              {alumno.telefono && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone size={14} className="text-slate-400" />
                  <span>{alumno.telefono}</span>
                </div>
              )}
              {alumno.email && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail size={14} className="text-slate-400" />
                  <span>{alumno.email}</span>
                </div>
              )}
              {alumno.nivel && (
                 <div className="flex items-center gap-2 text-slate-700">
                   <BookOpen size={14} className="text-slate-400" />
                   <span>{alumno.nivel}</span>
                 </div>
              )}
            </div>

            <h4 className="text-sm font-semibold text-slate-600 pt-4 mb-2">Resumen</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Clases Totales:</span>
                <span className="font-semibold text-slate-700">{stats.totalClases}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Clases Pagadas:</span>
                <span className="font-semibold text-green-600">{stats.clasesPagadas}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Clases No Pagadas:</span>
                <span className="font-semibold text-red-600">{stats.clasesNoPagadas}</span>
              </div>
            </div>
             {alumno.notas && (
                <div className="pt-4">
                 <h4 className="text-sm font-semibold text-slate-600 mb-1">Notas Adicionales</h4>
                 <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 whitespace-pre-wrap">{alumno.notas}</p>
                </div>
             )}
          </div>

          {/* Columna Derecha: Historial de Clases */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-sm font-semibold text-slate-600 mb-2">Historial de Clases Recientes</h4>
            {clasesOrdenadas.length > 0 ? (
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3"> {/* Contenedor con scroll */}
                {clasesOrdenadas.map(clase => (
                  <div key={clase.id} className={`p-3 rounded-lg border flex justify-between items-center ${clase.fecha === hoyYMD ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{clase.materia}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {formatFecha(new Date(clase.fecha.replace(/-/g, '/')), { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {clase.inicio} - {clase.fin}</span>
                      </div>
                    </div>
                    <div className="text-right">
                       {clase.estadoPago === 'Pagado'
                         ? <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Pagado</span>
                         : <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">No pagado</span>
                       }
                       {/* Podríamos añadir el ingreso calculado si lo tuviéramos */}
                       {/* {clase.ingreso > 0 && <p className="text-xs text-slate-500 mt-1">{formatCurrency(clase.ingreso)}</p>} */}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-4">No hay clases registradas para este alumno.</p>
            )}
          </div>
        </div>

        {/* Pie (solo botón cerrar) */}
        <div className="flex justify-end p-5 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button type="button" onClick={onClose} className="text-sm font-medium text-slate-700 bg-white border border-slate-300 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
