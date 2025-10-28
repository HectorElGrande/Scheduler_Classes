import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, BookOpen, FileText, Plus, Hash } from 'lucide-react';

export default function AlumnoModal({ alumno, onClose, onSave, isLoading, onDelete }) {
  
  // --- MODIFICADO: Estado inicial con materias ---
  const getInitialData = () => ({
    nombre: '',
    contactoTelefono: '',
    contactoEmail: '',
    nivelCurso: '',
    notas: '',
    materias: [], // <-- NUEVO: Array para las materias
    ...(alumno || {}) // Sobrescribe si 'alumno' tiene datos
  });

  const [formData, setFormData] = useState(getInitialData());
  const [error, setError] = useState('');
  
  // --- NUEVO: Estado para la nueva materia a añadir ---
  const [nuevaMateria, setNuevaMateria] = useState('');

  // Sincronizar si el prop 'alumno' cambia
  useEffect(() => {
    setFormData(getInitialData());
  }, [alumno]);


  const commonInputClass = "w-full p-2 pl-10 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm";
  const commonLabelClass = "block text-sm font-medium text-slate-700 mb-1";
  const commonIconClass = "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!formData.nombre?.trim()) {
      setError('El nombre del alumno es obligatorio.');
      return;
    }
    // El onSave ya envía el formData completo, que ahora incluye el array 'materias'
    onSave(formData);
  };

  // --- NUEVO: Función para añadir una materia a la lista ---
  const handleAddMateria = () => {
    if (nuevaMateria.trim() && !formData.materias.includes(nuevaMateria.trim())) {
      setFormData(prev => ({
        ...prev,
        materias: [...prev.materias, nuevaMateria.trim()]
      }));
      setNuevaMateria(''); // Limpiar el input
    }
  };

  // --- NUEVO: Función para eliminar una materia de la lista ---
  const handleRemoveMateria = (materiaToRemove) => {
    setFormData(prev => ({
      ...prev,
      materias: prev.materias.filter(m => m !== materiaToRemove)
    }));
  };

  const esEdicion = !!(alumno && alumno.id);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">{esEdicion ? 'Editar Alumno' : 'Añadir Nuevo Alumno'}</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100"><X size={22} /></button>
        </div>

        {/* --- MODIFICADO: Contenedor con scroll --- */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className={commonLabelClass}>Nombre Completo</label>
            <div className="relative">
              <User size={18} className={commonIconClass} />
              <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} className={commonInputClass} required />
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactoTelefono" className={commonLabelClass}>Teléfono</label>
              <div className="relative">
                <Phone size={18} className={commonIconClass} />
                <input type="tel" id="contactoTelefono" name="contactoTelefono" value={formData.contactoTelefono} onChange={handleChange} className={commonInputClass} placeholder="Opcional"/>
              </div>
            </div>
            <div>
              <label htmlFor="contactoEmail" className={commonLabelClass}>Email</label>
              <div className="relative">
                <Mail size={18} className={commonIconClass} />
                <input type="email" id="contactoEmail" name="contactoEmail" value={formData.contactoEmail} onChange={handleChange} className={commonInputClass} placeholder="Opcional"/>
              </div>
            </div>
          </div>

          {/* Nivel/Curso */}
          <div>
            <label htmlFor="nivelCurso" className={commonLabelClass}>Nivel / Curso</label>
            <div className="relative">
              <BookOpen size={18} className={commonIconClass} />
              <input type="text" id="nivelCurso" name="nivelCurso" value={formData.nivelCurso} onChange={handleChange} className={commonInputClass} placeholder="Ej: 1º Bachillerato, B2 Inglés..."/>
            </div>
          </div>

          {/* --- NUEVO: Sección para gestionar Materias --- */}
          <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
            <label htmlFor="nuevaMateria" className={commonLabelClass}>Materias del Alumno</label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-grow">
                <Hash size={18} className={commonIconClass} />
                <input
                  type="text"
                  id="nuevaMateria"
                  name="nuevaMateria"
                  value={nuevaMateria}
                  onChange={(e) => setNuevaMateria(e.target.value)}
                  className={commonInputClass}
                  placeholder="Ej: Matemáticas"
                />
              </div>
              <button
                type="button"
                onClick={handleAddMateria}
                className="flex-shrink-0 text-sm font-medium text-indigo-700 bg-indigo-100 px-3 py-2 rounded-lg shadow-sm hover:bg-indigo-200"
              >
                <Plus size={16} />
              </button>
            </div>
            {/* Lista de materias añadidas */}
            {formData.materias.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.materias.map((materia, index) => (
                  <span key={index} className="flex items-center gap-1.5 bg-indigo-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    {materia}
                    <button
                      type="button"
                      onClick={() => handleRemoveMateria(materia)}
                      className="text-indigo-200 hover:text-white"
                      title={`Eliminar ${materia}`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {formData.materias.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-1">Añade materias que curse este alumno.</p>
            )}
          </div>
          {/* --- FIN NUEVO --- */}


          {/* Notas */}
          <div>
            <label htmlFor="notas" className={commonLabelClass}>Notas sobre el alumno</label>
            <div className="relative">
               <FileText size={18} className="absolute left-3 top-3 text-slate-400" />
               <textarea id="notas" name="notas" value={formData.notas} onChange={handleChange} rows="3" className="w-full p-2 pl-10 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Alergias, objetivos, material necesario..."></textarea>
            </div>
          </div>

          {error && (<p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>)}
        </div>

        <div className="flex justify-between items-center p-5 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <div>
            {esEdicion && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Seguro que quieres eliminar a ${formData.nombre}? Esta acción no se puede deshacer.`)) {
                     if (alumno && alumno.id) onDelete(alumno.id);
                  }
                }}
                className="text-sm font-medium text-red-600 hover:text-red-800 px-4 py-2 rounded-lg hover:bg-red-100"
              >
                Eliminar Alumno
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="text-sm font-medium text-slate-700 bg-white border border-slate-300 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={isLoading} className={`text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {isLoading ? 'Guardando...' : (esEdicion ? 'Guardar Cambios' : 'Crear Alumno')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}