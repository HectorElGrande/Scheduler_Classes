import React, { useState, useMemo } from 'react';
import { X, User, Phone, Mail, BookOpen, Calendar, Clock, Filter, Hash } from 'lucide-react'; // <-- Añadir Hash
import { formatFecha, toYYYYMMDD } from '../utils/dates';

export default function AlumnoDetalleModal({ alumno, clasesDelAlumno, onClose }) {
  if (!alumno) return null;

  const [filtroPago, setFiltroPago] = useState('Todas');
  const [filtroMesAnio, setFiltroMesAnio] = useState('Todos'); 
  
  // ... (useMemos de clases y filtros sin cambios) ...
  const clasesOrdenadas = useMemo(() => {
    return [...clasesDelAlumno].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [clasesDelAlumno]);
  const mesesConClases = useMemo(() => {
    const meses = new Set();
    clasesDelAlumno.forEach(clase => {
      if (clase.fecha && clase.fecha.length >= 7) {
        meses.add(clase.fecha.substring(0, 7));
      }
    });
    return Array.from(meses).sort().reverse().map(mesAnio => {
      const [year, month] = mesAnio.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        value: mesAnio,
        label: formatFecha(date, { month: 'long', year: 'numeric' })
      };
    });
  }, [clasesDelAlumno]);
  const clasesFiltradasYOrdenadas = useMemo(() => {
    let clasesFiltradas = [...clasesDelAlumno];
    if (filtroPago !== 'Todas') {
      clasesFiltradas = clasesFiltradas.filter(clase => clase.estadoPago === filtroPago);
    }
    if (filtroMesAnio !== 'Todos') {
      clasesFiltradas = clasesFiltradas.filter(clase => clase.fecha && clase.fecha.startsWith(filtroMesAnio));
    }
    return clasesFiltradas.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [clasesDelAlumno, filtroPago, filtroMesAnio]);
  const stats = useMemo(() => {
    const totalClases = clasesFiltradasYOrdenadas.length; // <-- CORREGIDO: Usar filtradas
    const clasesPagadas = clasesFiltradasYOrdenadas.filter(c => c.estadoPago === 'Pagado').length;
    const clasesNoPagadas = clasesFiltradasYOrdenadas.filter(c => c.estadoPago === 'No pagado').length;
    return { totalClases, clasesPagadas, clasesNoPagadas };
  }, [clasesFiltradasYOrdenadas]); // <-- CORREGIDO: Depender de filtradas


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
              {/* ... (Teléfono, Email, Nivel sin cambios) ... */}
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
              {alumno.nivelCurso && ( // <-- MODIFICADO: Usar nivelCurso
                <div className="flex items-center gap-2 text-slate-700">
                  <BookOpen size={14} className="text-slate-400" />
                  <span>{alumno.nivelCurso}</span>
                </div>
              )}
            </div>

            {/* --- NUEVO: Sección de Materias --- */}
            {alumno.materias && alumno.materias.length > 0 && (
              <div className="pt-4">
                <h4 className="text-sm font-semibold text-slate-600 mb-2">Materias</h4>
                <div className="flex flex-wrap gap-2">
                  {alumno.materias.map((materia, index) => (
                    <span key={index} className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      <Hash size={12} />
                      {materia}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* --- FIN NUEVO --- */}


            <h4 className="text-sm font-semibold text-slate-600 pt-4 mb-2">Resumen (Filtrado)</h4>
            <div className="space-y-2 text-sm">
              {/* ... (Estadísticas sin cambios) ... */}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Clases (Filtro):</span>
                <span className="font-semibold text-slate-700">{stats.totalClases}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pagadas (Filtro):</span>
                <span className="font-semibold text-green-600">{stats.clasesPagadas}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">No Pagadas (Filtro):</span>
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
          <div className="md:col-span-2 space-y-3 flex flex-col">
            {/* ... (Filtros y lista de clases sin cambios) ... */}
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold text-slate-600">Historial de Clases</h4>
              <div className="flex items-center gap-3">
                <select
                  value={filtroMesAnio}
                  onChange={(e) => setFiltroMesAnio(e.target.value)}
                  className="text-xs p-1 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Todos">Todos los meses</option>
                  {mesesConClases.map(mes => (
                    <option key={mes.value} value={mes.value}>{mes.label}</option>
                  ))}
                </select>
                <select
                  value={filtroPago}
                  onChange={(e) => setFiltroPago(e.target.value)}
                  className="text-xs p-1 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Todas">Todas</option>
                  <option value="Pagado">Pagadas</option>
                  <option value="No pagado">No pagadas</option>
                </select>
                <Filter size={16} className="text-slate-400" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 border-t pt-3">
              {clasesFiltradasYOrdenadas.length > 0 ? (
                clasesFiltradasYOrdenadas.map(clase => (
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
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 italic text-center py-4">No hay clases que coincidan con los filtros seleccionados.</p>
              )}
            </div>
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