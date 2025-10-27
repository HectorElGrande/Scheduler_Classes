import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, BookOpen, FileText } from 'lucide-react';

export default function AlumnoModal({ alumno, onClose, onSave, isLoading, onDelete }) {
  // Estado inicial: si 'alumno' existe, lo usamos; si no, objeto vacío
  const [formData, setFormData] = useState({
    nombre: '',
    contactoTelefono: '',
    contactoEmail: '',
    nivelCurso: '',
    notas: '',
    ...alumno // Sobrescribe los campos vacíos si 'alumno' tiene datos
  });
  const [error, setError] = useState('');

  // Sincronizar si el prop 'alumno' cambia (poco probable, pero seguro)
  useEffect(() => {
    setFormData({
      nombre: '',
      contactoTelefono: '',
      contactoEmail: '',
      nivelCurso: '',
      notas: '',
      ...(alumno || {}) // Usar objeto vacío si alumno es null/undefined
    });
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
    onSave(formData); // Pasamos el objeto completo
  };

  const esEdicion = !!(alumno && alumno.id);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">{esEdicion ? 'Editar Alumno' : 'Añadir Nuevo Alumno'}</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100"><X size={22} /></button>
        </div>

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
            {esEdicion && onDelete && ( // Mostrar botón solo si es edición y se pasa la función onDelete
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