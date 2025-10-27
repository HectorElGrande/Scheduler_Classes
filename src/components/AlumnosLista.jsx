import React, { useState } from 'react';
import { User, Plus, ChevronDown, ChevronUp, Edit2, Trash2, Eye } from 'lucide-react'; // <-- Añadir Eye
import AlumnoModal from './AlumnoModal';

// <-- Añadir onOpenDetail
export default function AlumnosLista({ alumnos, onAddAlumno, onUpdateAlumno, onDeleteAlumno, onOpenDetail }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [alumnoToEdit, setAlumnoToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenModal = (alumno = null) => {
    setAlumnoToEdit(alumno);
    setModalOpen(true);
  };

  const handleSave = async (alumnoData) => {
    setIsLoading(true);
    try {
      if (alumnoToEdit) {
        await onUpdateAlumno({ ...alumnoData, id: alumnoToEdit.id });
        alert('Alumno actualizado correctamente.');
      } else {
        await onAddAlumno(alumnoData);
        alert('Alumno creado correctamente.');
      }
      setModalOpen(false);
      setAlumnoToEdit(null);
    } catch (error) {
      // El error ya se muestra en App.jsx, no necesitamos alert aquí
      console.error("Error guardando alumno desde AlumnosLista");
    } finally {
      setIsLoading(false);
    }
  };

   const handleDelete = async (id) => {
     // Añadir confirmación aquí también
     if (window.confirm("¿Seguro que quieres eliminar este alumno? Asegúrate de que no tenga clases asociadas.")) {
         try {
             await onDeleteAlumno(id);
             alert('Alumno eliminado.');
             // No necesitamos cerrar modal aquí porque no se abre al borrar
         } catch (error) {
             // El alert de error ya está en App.jsx
             console.error("Error eliminando alumno desde AlumnosLista");
         }
     }
   };

  const alumnosOrdenados = [...alumnos].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

  return (
    <div className="border border-slate-200 rounded-lg">
      {/* Botón para desplegar/contraer */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <User size={18} className="text-indigo-600" />
          <span className="text-sm font-semibold text-slate-700">Alumnos ({alumnos.length})</span>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
      </button>

      {/* Lista desplegable */}
      {isOpen && (
        <div className="p-3 border-t border-slate-200 max-h-60 overflow-y-auto">
          {alumnosOrdenados.length > 0 ? (
            <ul className="space-y-2">
              {alumnosOrdenados.map(alumno => (
                <li key={alumno.id} className="flex justify-between items-center group text-sm">
                  <span className="text-slate-700 truncate pr-2" title={alumno.nombre}>{alumno.nombre}</span>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                     {/* --- BOTÓN VER DETALLES AÑADIDO --- */}
                     <button
                       onClick={() => onOpenDetail(alumno)} // <-- Llama a la nueva función
                       className="p-1 text-slate-500 hover:text-blue-600"
                       title="Ver detalles"
                     >
                       <Eye size={16} />
                     </button>
                    <button
                      onClick={() => handleOpenModal(alumno)}
                      className="p-1 text-slate-500 hover:text-indigo-600"
                      title="Editar alumno"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(alumno.id)}
                      className="p-1 text-slate-500 hover:text-red-600"
                      title="Eliminar alumno"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic text-center">No hay alumnos añadidos.</p>
          )}

          {/* Botón Añadir Nuevo */}
          <button
            onClick={() => handleOpenModal()}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100"
          >
            <Plus size={14} /> Añadir Alumno
          </button>
        </div>
      )}

      {/* Modal para añadir/editar */}
      {modalOpen && (
        <AlumnoModal
          alumno={alumnoToEdit}
          onClose={() => { setModalOpen(false); setAlumnoToEdit(null); }}
          onSave={handleSave}
          onDelete={handleDelete} // Pasar handleDelete por si se añade botón de borrar en el modal
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

