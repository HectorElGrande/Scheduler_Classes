import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import SelectorHora from './SelectorHora';
import { toYYYYMMDD } from '../utils/dates';
import { detectarSolapamiento } from '../utils/helpers';

export default function ClaseModal({ clase, clases, onClose, onSave, onDelete, isLoading }) {

    {/* --- LÍNEA MODIFICADA (Valor por defecto) --- */ }
    const [formData, setFormData] = useState(clase || { materia: '', alumno: '', fecha: toYYYYMMDD(new Date()), inicio: '09:00', fin: '10:00', nivel: '', estadoPago: 'No pagado', notas: '' });

    const [error, setError] = useState('');
    const commonInputClass = "w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm";
    const commonLabelClass = "block text-sm font-medium text-slate-700 mb-1";
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleHoraChange = (campo) => (valor) => { setFormData(prev => ({ ...prev, [campo]: valor })); };
    const handleSubmit = (e) => {
        e.preventDefault(); setError(''); console.log("ClaseModal: handleSubmit llamado");
        if (!formData.materia?.trim() || !formData.alumno?.trim() || !formData.fecha || !formData.inicio || !formData.fin) { setError('Los campos Materia, Alumno, Fecha y Horas son obligatorios.'); console.log("ClaseModal: Falló validación de campos obligatorios"); return; }
        if (formData.fin <= formData.inicio) { setError('La hora de fin debe ser posterior a la de inicio.'); console.log("ClaseModal: Falló validación de hora fin <= inicio"); return; }
        const esEdicion = !!(clase && clase.id); const claseSolapada = detectarSolapamiento(formData, clases, esEdicion ? clase.id : null);
        if (claseSolapada) { setError(`¡Conflicto! Se solapa con: ${claseSolapada.materia} (${claseSolapada.alumno}) de ${claseSolapada.inicio} a ${claseSolapada.fin}.`); console.log("ClaseModal: Detectado solapamiento", claseSolapada); return; }
        console.log("ClaseModal: Validación pasada, llamando a onSave..."); onSave(formData);
    };
    const esEdicion = !!(clase && clase.id);

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-slate-200"><h3 className="text-lg font-semibold text-slate-800">{esEdicion ? 'Editar Clase' : 'Añadir Nueva Clase'}</h3><button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100"><X size={22} /></button></div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* ... (inputs de materia, alumno, nivel, fecha, horas) ... */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label htmlFor="materia" className={commonLabelClass}>Materia</label><input type="text" id="materia" name="materia" value={formData.materia || ''} onChange={handleChange} className={commonInputClass} required /></div>
                        <div><label htmlFor="alumno" className={commonLabelClass}>Alumno</label><input type="text" id="alumno" name="alumno" value={formData.alumno || ''} onChange={handleChange} className={commonInputClass} required /></div>
                    </div>
                    <div><label htmlFor="nivel" className={commonLabelClass}>Nivel / Curso</label><input type="text" id="nivel" name="nivel" value={formData.nivel || ''} onChange={handleChange} className={commonInputClass} /></div>
                    <div><label htmlFor="fecha" className={commonLabelClass}>Fecha</label><input type="date" id="fecha" name="fecha" value={formData.fecha || ''} onChange={handleChange} className={commonInputClass} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={commonLabelClass}>Inicio</label><SelectorHora value={formData.inicio || '09:00'} onChange={handleHoraChange('inicio')} /></div>
                        <div><label className={commonLabelClass}>Fin</label><SelectorHora value={formData.fin || '10:00'} onChange={handleHoraChange('fin')} /></div>
                    </div>
                    <div>
                        <label htmlFor="estadoPago" className={commonLabelClass}>Estado de Pago</label>
                        <div className="relative">
                            {/* --- LÍNEA MODIFICADA (Valor por defecto) --- */}
                            <select id="estadoPago" name="estadoPago" value={formData.estadoPago || 'No pagado'} onChange={handleChange} className={`${commonInputClass} appearance-none`}>

                                {/* --- LÍNEA MODIFICADA (Opción) --- */}
                                <option value="No pagado">No pagado</option>
                                <option value="Pagado">Pagado</option>
                            </select>
                            <ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div><label htmlFor="notas" className={commonLabelClass}>Notas</label><textarea id="notas" name="notas" value={formData.notas || ''} onChange={handleChange} rows="3" className={commonInputClass}></textarea></div>
                    {error && (<p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>)}
                </div>
                <div className="flex justify-between items-center p-5 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                    <div>{esEdicion && (<button type="button" onClick={() => { if (clase && clase.id) onDelete(clase.id); onClose(); }} className="text-sm font-medium text-red-600 hover:text-red-800 px-4 py-2 rounded-lg hover:bg-red-100">Eliminar Clase</button>)}</div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="text-sm font-medium text-slate-700 bg-white border border-slate-300 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50">Cancelar</button>
                        <button type="submit" disabled={!!isLoading} className={`text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>{esEdicion ? 'Guardar Cambios' : 'Crear Clase'}</button>
                    </div>
                </div>
            </form>
        </div>
    );
}