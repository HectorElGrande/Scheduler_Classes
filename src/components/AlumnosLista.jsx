import React, { useState } from 'react';
import { UserPlus, ChevronDown, ChevronUp, User, Edit2, Trash2 } from 'lucide-react'; // <-- Añadir Edit2, Trash2
import AlumnoModal from './AlumnoModal';

export default function AlumnosLista({ alumnos, onAddAlumno, onUpdateAlumno, onDeleteAlumno }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [listaVisible, setListaVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenModal = (alumno = null) => {
    setAlumnoSeleccionado(alumno);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setAlumnoSeleccionado(null);
  };

  const handleSave = async (alumnoData) => {
    setIsSaving(true);
    const isEditing = !!alumnoSeleccionado;
    const saveFunction = isEditing ? onUpdateAlumno : onAddAlumno;
    try {
      await saveFunction(alumnoData);
      handleCloseModal();
      alert(isEditing ? 'Alumno actualizado con éxito' : 'Alumno creado con éxito');
    } catch (error) {
      console.error("Error al guardar alumno desde AlumnosLista:", error);
      // No cerramos el modal si hay error
    } finally {
      setIsSaving(false);
    }
  };

  // --- AÑADIDO: Handler para eliminar directamente ---
  const handleDeleteClick = (alumno) => {
    if (!alumno || !alumno.id) return;
    if (confirm(`¿Seguro que quieres eliminar a ${alumno.nombre}? Esta acción no se puede deshacer y podría afectar a clases pasadas.`)) {
      onDeleteAlumno(alumno.id).catch(error => {
        // El error ya se muestra en App.jsx con alert
        console.error("Error al eliminar alumno desde AlumnosLista:", error);
      });
    }
  };
  // --- FIN AÑADIDO ---

  const alumnosOrdenados = [...alumnos].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <div className="border-t border-slate-200 pt-4 mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Alumnos ({alumnosOrdenados.length})</h3>
        <div className="flex items-center gap-1">
           <button
            onClick={() => handleOpenModal()}
            className="p-1.5 rounded-full text-indigo-600 hover:bg-indigo-100"
            title="Añadir nuevo alumno"
          >
            <UserPlus size={18} />
          </button>
          <button
             onClick={() => setListaVisible(!listaVisible)}
             className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100"
             title={listaVisible ? "Ocultar lista" : "Mostrar lista"}
           >
            {listaVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* --- LISTA MODIFICADA --- */}
      {listaVisible && (
        <div className="space-y-1 max-h-48 overflow-y-auto pr-2"> {/* Reducido space-y */}
          {alumnosOrdenados.length > 0 ? (
            alumnosOrdenados.map(alumno => (
              // Ya no es un botón, es un div con botones dentro
              <div
                key={alumno.id}
                className="flex items-center justify-between gap-2 p-2 rounded-md text-sm text-slate-700 hover:bg-slate-50" // Quitado hover:bg-slate-100
              >
                 {/* Nombre del alumno */}
                 <div className="flex items-center gap-2 truncate flex-1">
                    <User size={16} className="text-slate-400 shrink-0" />
                    <span className="truncate">{alumno.nombre}</span>
                 </div>

                 {/* Botones de acción */}
                 <div className="flex items-center shrink-0">
                    <button
                        onClick={() => handleOpenModal(alumno)} // Abre modal para editar
                        className="p-1 rounded text-slate-500 hover:bg-indigo-100 hover:text-indigo-600"
                        title="Editar alumno"
                    >
                        <Edit2 size={15} />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(alumno)} // Llama a la función de eliminar
                        className="p-1 rounded text-slate-500 hover:bg-red-100 hover:text-red-600"
                        title="Eliminar alumno"
                    >
                        <Trash2 size={15} />
                    </button>
                 </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 italic px-2">No hay alumnos añadidos.</p>
          )}
        </div>
      )}
      {/* --- FIN LISTA MODIFICADA --- */}


      {modalOpen && (
        <AlumnoModal
          alumno={alumnoSeleccionado}
          onClose={handleCloseModal}
          onSave={handleSave}
          onDelete={onDeleteAlumno} // Pasamos onDelete para el botón dentro del modal
          isLoading={isSaving}
        />
      )}
    </div>
  );
}

