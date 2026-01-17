import React, { useState, useEffect, useMemo } from 'react'; // <-- Añadir useMemo
import { X, ChevronDown, UserPlus } from 'lucide-react';
import SelectorHora from './SelectorHora';
import { toYYYYMMDD } from '../utils/dates';
import { detectarSolapamiento } from '../utils/helpers';
import AlumnoModal from './AlumnoModal';

export default function ClaseModal({
    clase, clases, onClose, onSave, onDelete, isLoading,
    alumnos, onAddAlumno, onUpdateAlumno, onDeleteAlumno
}) {
    
    const getInitialFormData = () => ({
        materia: '',
        alumno: '', 
        fecha: toYYYYMMDD(new Date()),
        inicio: '09:00',
        fin: '10:00',
        nivel: '',
        estadoPago: 'No pagado',
        notas: '',
    });

    const [formData, setFormData] = useState(getInitialFormData());
    const [error, setError] = useState('');
    const [quickAddAlumnoOpen, setQuickAddAlumnoOpen] = useState(false);
    const [isSavingAlumno, setIsSavingAlumno] = useState(false);

    useEffect(() => {
        if (clase) {
            setFormData({
                materia: clase.materia || '',
                alumno: clase.alumno || '',
                fecha: clase.fecha || toYYYYMMDD(new Date()),
                inicio: clase.inicio || '09:00',
                fin: clase.fin || '10:00',
                nivel: clase.nivel || '',
                estadoPago: clase.estadoPago || 'No pagado',
                notas: clase.notas || '',
                id: clase.id
            });
        } else {
            // Si es nueva clase, aplicamos la fecha de la prop 'clase' (que es un objeto de valores por defecto)
            setFormData({
                ...getInitialFormData(),
                fecha: clase?.fecha || toYYYYMMDD(new Date()),
                inicio: clase?.inicio || '09:00',
                fin: clase?.fin || '10:00',
            });
        }
    }, [clase]);


    const commonInputClass = "w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm";
    const commonLabelClass = "block text-sm font-medium text-slate-700 mb-1";

    // --- MODIFICADO: handleChange para auto-rellenar Nivel y resetear Materia ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'alumno') {
            // Si cambia el alumno, encontramos sus datos
            const selected = alumnos.find(a => a.nombre === value);
            setFormData(prev => ({ 
                ...prev, 
                alumno: value, 
                nivel: selected?.nivelCurso || '', // Auto-rellenar nivel
                materia: '' // <-- RESETEAR materia para forzar nueva selección
            }));
        } else {
            // Comportamiento normal para otros campos
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleHoraChange = (campo) => (valor) => {
        setFormData(prev => ({ ...prev, [campo]: valor }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        // --- MODIFICADO: Validación incluye la materia seleccionada ---
        if (!formData.materia?.trim() || !formData.alumno?.trim() || !formData.fecha || !formData.inicio || !formData.fin) {
            setError('Los campos Materia, Alumno, Fecha y Horas son obligatorios.'); return;
        }
        if (formData.fin <= formData.inicio) {
            setError('La hora de fin debe ser posterior a la de inicio.'); return;
        }
        const esEdicion = !!(formData && formData.id);
        const claseSolapada = detectarSolapamiento(formData, clases, esEdicion ? formData.id : null);
        if (claseSolapada) {
            setError(`¡Conflicto! Se solapa con: ${claseSolapada.materia} (${claseSolapada.alumno}) de ${claseSolapada.inicio} a ${claseSolapada.fin}.`); return;
        }
        onSave(formData);
    };

    const esEdicion = !!(formData && formData.id);

    const handleQuickAddAlumno = async (alumnoData) => {
        // ... (sin cambios) ...
    };

    const alumnosOrdenados = [...alumnos].sort((a, b) => a.nombre.localeCompare(b.nombre));

    // --- NUEVO: Encontrar el objeto alumno seleccionado ---
    const selectedAlumno = useMemo(() => {
        return alumnos.find(a => a.nombre === formData.alumno);
    }, [formData.alumno, alumnos]);

    // --- NUEVO: Obtener la lista de materias del alumno seleccionado ---
    const materiasDelAlumno = useMemo(() => {
        return selectedAlumno?.materias || [];
    }, [selectedAlumno]);


    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">{esEdicion ? 'Editar Clase' : 'Añadir Nueva Clase'}</h3>
                    <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100"><X size={22} /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    
                    {/* Alumno (Selector) */}
                    <div>
                        <label htmlFor="alumno" className={commonLabelClass}>Alumno</label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-grow">
                                <select
                                    id="alumno"
                                    name="alumno"
                                    value={formData.alumno || ''} 
                                    onChange={handleChange} // <-- Usa el handler modificado
                                    className={`${commonInputClass} appearance-none pr-8`}
                                    required
                                >
                                    <option value="" disabled>Selecciona un alumno...</option>
                                    {alumnosOrdenados.map(a => (
                                        <option key={a.id} value={a.nombre}>{a.nombre}</option>
                                    ))}
                                </select>
                                <ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            {/* El botón de QuickAdd no lo has pedido pero lo dejo por si acaso */}
                            {/* <button type="button" onClick={() => setQuickAddAlumnoOpen(true)} className="..."><UserPlus size={18} /></button> */}
                        </div>
                    </div>

                    {/* --- MODIFICADO: Materia (Ahora es un Select) --- */}
                    <div>
                        <label htmlFor="materia" className={commonLabelClass}>Materia</label>
                        <div className="relative">
                            <select
                                id="materia"
                                name="materia"
                                value={formData.materia || ''}
                                onChange={handleChange}
                                className={`${commonInputClass} appearance-none pr-8`}
                                required
                                disabled={!selectedAlumno} // Deshabilitado si no hay alumno
                            >
                                <option value="" disabled>
                                    {!selectedAlumno
                                        ? 'Selecciona un alumno primero'
                                        : (materiasDelAlumno.length > 0 ? 'Selecciona una materia...' : 'Este alumno no tiene materias')
                                    }
                                </option>
                                {materiasDelAlumno.map(materia => (
                                    <option key={materia} value={materia}>{materia}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* --- MODIFICADO: Nivel (Ahora es readOnly) --- */}
                    <div>
                        <label htmlFor="nivel" className={commonLabelClass}>Nivel / Curso (Automático)</label>
                        <input
                            type="text"
                            id="nivel"
                            name="nivel"
                            value={formData.nivel || ''} // Se rellena desde el estado
                            onChange={handleChange} // Permite que el estado se actualice
                            className={`${commonInputClass} bg-slate-50 text-slate-600`}
                            readOnly // El usuario no puede editarlo
                        />
                    </div>

                    {/* Fecha */}
                    <div>
                        <label htmlFor="fecha" className={commonLabelClass}>Fecha</label>
                        <input type="date" id="fecha" name="fecha" value={formData.fecha || ''} onChange={handleChange} className={commonInputClass} required />
                    </div>

                    {/* Horas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={commonLabelClass}>Inicio</label><SelectorHora value={formData.inicio || '09:00'} onChange={handleHoraChange('inicio')} /></div>
                        <div><label className={commonLabelClass}>Fin</label><SelectorHora value={formData.fin || '10:00'} onChange={handleHoraChange('fin')} /></div>
                    </div>

                    {/* Estado Pago */}
                    <div>
                        <label htmlFor="estadoPago" className={commonLabelClass}>Estado de Pago</label>
                        <div className="relative">
                            <select id="estadoPago" name="estadoPago" value={formData.estadoPago || 'No pagado'} onChange={handleChange} className={`${commonInputClass} appearance-none`}>
                                <option value="No pagado">No pagado</option>
                                <option value="Pagado">Pagado</option>
                            </select>
                            <ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Notas */}
                    <div>
                        <label htmlFor="notas" className={commonLabelClass}>Notas</label>
                        <textarea id="notas" name="notas" value={formData.notas || ''} onChange={handleChange} rows="3" className={commonInputClass}></textarea>
                    </div>


                    {error && (<p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>)}
                </div>

                <div className="flex justify-between items-center p-5 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                    <div>
                        {esEdicion && (
                            <button
                                type="button"
                                onClick={() => { if (formData && formData.id) onDelete(formData.id); onClose(); }}
                                className="text-sm font-medium text-red-600 hover:text-red-800 px-4 py-2 rounded-lg hover:bg-red-100"
                            >
                                Eliminar Clase
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="text-sm font-medium text-slate-700 bg-white border border-slate-300 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50">Cancelar</button>
                        <button type="submit" disabled={isLoading} className={`text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>{esEdicion ? 'Guardar Cambios' : 'Crear Clase'}</button>
                    </div>
                </div>
            </form>

             {quickAddAlumnoOpen && (
                <AlumnoModal
                    alumno={null}
                    onClose={() => setQuickAddAlumnoOpen(false)}
                    onSave={handleQuickAddAlumno}
                    onDelete={() => {}}
                    isLoading={isSavingAlumno}
                />
            )}
        </div>
    );
}