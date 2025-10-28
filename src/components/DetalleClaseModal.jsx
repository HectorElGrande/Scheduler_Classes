import React from 'react';
import {
    Trash2, Calendar, Clock, User,
    X, Edit2, Tag, FileText, DollarSign
} from 'lucide-react';
import { formatFecha } from '../utils/dates';

export default function DetalleClaseModal({ clase, onClose, onEdit, onDelete, onSave }) {
    if (!clase) return null;

    {/* --- LÍNEA MODIFICADA (yellow -> red) --- */ }
    const getEstadoPagoIcon = () => { switch (clase.estadoPago) { case 'Pagado': return <DollarSign size={18} className="text-green-600" />; default: return <Clock size={18} className="text-red-600" />; } };

    const handleSetPago = (nuevoEstado) => { if (!onSave) return; onSave({ ...clase, estadoPago: nuevoEstado }); };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100"><X size={20} /></button>
                <h3 className="text-xl font-semibold text-indigo-700 mb-4">{clase.materia || 'N/A'}</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3"><User size={18} className="text-slate-500" /><span className="font-medium text-slate-700">{clase.alumno || 'N/A'}</span></div>
                    {clase.nivel && (<div className="flex items-center gap-3"><Tag size={18} className="text-slate-500" /><span>{clase.nivel}</span></div>)}
                    <div className="flex items-center gap-3"><Calendar size={18} className="text-slate-500" /><span className="capitalize">{clase.fecha ? formatFecha(new Date(clase.fecha.replace(/-/g, '/')), { weekday: 'long', day: 'numeric', month: 'long' }) : 'N/A'}</span></div>
                    <div className="flex items-center gap-3"><Clock size={18} className="text-slate-500" /><span>{clase.inicio || 'N/A'} - {clase.fin || 'N/A'}</span></div>
                    <div className="flex items-center gap-3">{getEstadoPagoIcon()}<span>{clase.estadoPago === 'Pagado' ? 'Pagado' : 'No pagado'}</span></div>
                    {clase.notas && (<div className="flex items-start gap-3 pt-2"><FileText size={18} className="text-slate-500 shrink-0" /><p className="text-slate-600 whitespace-pre-wrap">{clase.notas}</p></div>)}
                </div>
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
                    <div className="flex gap-2">

                        {/* --- BLOQUE MODIFICADO (Botón de acción) --- */}
                        {clase.estadoPago !== 'Pagado' && (
                            <button
                                onClick={() => handleSetPago('Pagado')}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200"
                                aria-label="Marcar como Pagado"
                            >
                                <DollarSign size={14} /> Marcar como Pagado
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => { if (clase && clase.id) onDelete(clase.id); onClose(); }} className="p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors" aria-label="Eliminar"><Trash2 size={20} /></button>
                        <button onClick={() => { onEdit(clase); onClose(); }} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors" aria-label="Editar"><Edit2 size={20} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}