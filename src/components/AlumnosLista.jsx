import React, { useState, useMemo } from 'react';
import { User, Plus, ChevronDown, ChevronUp, Edit2, Trash2, Eye, X } from 'lucide-react';
// Corregir la ruta si AlumnoModal no está en el mismo directorio (components)
// Si está en src/components/, "./AlumnoModal" debería ser correcto.
import AlumnoModal from './AlumnoModal';

export default function AlumnosLista({ alumnos, onAddAlumno, onUpdateAlumno, onDeleteAlumno, onOpenDetail }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [alumnoToEdit, setAlumnoToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      console.error("Error guardando alumno desde AlumnosLista");
      // El alert de error ya debería mostrarse desde App.jsx si es necesario
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Usamos confirm() directamente aquí
    if (confirm("¿Seguro que quieres eliminar este alumno? Asegúrate de que no tenga clases asociadas.")) {
      try {
        await onDeleteAlumno(id);
        alert('Alumno eliminado.');
      } catch (error) {
        console.error("Error eliminando alumno desde AlumnosLista");
        // El alert de error ya debería mostrarse desde App.jsx si es necesario
      }
    }
  };

  const filteredAndSortedAlumnos = useMemo(() => {
    return alumnos
      .filter(alumno =>
        alumno.nombre && alumno.nombre.toLowerCase().startsWith(searchTerm.toLowerCase())
      )
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }, [alumnos, searchTerm]);

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
        {isOpen ? <ChevronDown size={18} className="text-slate-500" /> : <ChevronUp size={18} className="text-slate-500" />}
      </button>

      {/* Contenedor del desplegable */}
      {isOpen && (
        <div className="border-t border-slate-200 flex flex-col">

          <div className="p-3 border-b border-slate-200 relative">
            <input
              type="text"
              placeholder="Buscar alumno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
                aria-label="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Div con scroll para la lista */}
          <div className="px-3 pt-3 pb-1 max-h-60 overflow-y-auto">
            {/* Usar la lista filtrada y ordenada */}
            {filteredAndSortedAlumnos.length > 0 ? (
              <ul className="space-y-2">
                {filteredAndSortedAlumnos.map(alumno => (
                  <li key={alumno.id} className="flex justify-between items-center group text-sm">
                    {/* ... (Nombre del alumno y botones Eye, Edit, Trash sin cambios) ... */}
                    <span className="text-slate-700 truncate pr-2" title={alumno.nombre}>{alumno.nombre}</span>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onOpenDetail(alumno)} className="p-1 text-slate-500 hover:text-blue-600" title="Ver detalles"> <Eye size={16} /> </button>
                      <button onClick={() => handleOpenModal(alumno)} className="p-1 text-slate-500 hover:text-indigo-600" title="Editar alumno"> <Edit2 size={16} /> </button>
                      <button onClick={() => handleDelete(alumno.id)} className="p-1 text-slate-500 hover:text-red-600" title="Eliminar alumno"> <Trash2 size={16} /> </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-4">
                {searchTerm ? 'Ningún alumno coincide.' : 'No hay alumnos añadidos.'}
              </p>
            )}
          </div> {/* Fin del div con scroll */}

          {/* Botón Añadir Nuevo */}
          <div className="p-3 border-t border-slate-200">
            <button
              onClick={() => handleOpenModal()}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100"
            >
              <Plus size={14} /> Añadir Alumno
            </button>
          </div>

        </div> // Fin del contenedor del desplegable
      )}

      {/* Modal para añadir/editar */}
      {modalOpen && (
        <AlumnoModal
          alumno={alumnoToEdit}
          onClose={() => { setModalOpen(false); setAlumnoToEdit(null); }}
          onSave={handleSave}
          // Pasamos onDelete por si AlumnoModal tiene botón de borrar
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

