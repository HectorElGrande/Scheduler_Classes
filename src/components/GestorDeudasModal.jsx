import React, { useState } from 'react';
import { X, Save, Trash2, Wallet, Plus } from 'lucide-react';

export default function GestorDeudasModal({
  isOpen,
  onClose,
  alumnos,
  deudas,
  onSave,
  onDelete
}) {
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [nota, setNota] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!alumnoSeleccionado || !cantidad) {
      alert("Selecciona un alumno e introduce una cantidad.");
      return;
    }

    onSave({
      alumno: alumnoSeleccionado,
      cantidad: parseFloat(cantidad),
      nota: nota
    });

    // Resetear formulario
    setCantidad('');
    setNota('');
    // No reseteamos el alumno por si quiere añadir otra cosa rápida
  };

  const totalDeuda = deudas.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-rose-50">
          <div className="flex items-center gap-2 text-rose-700">
            <Wallet size={24} />
            <h2 className="text-xl font-bold">Gestor de Devoluciones</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* Formulario de Añadir */}
          <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Plus size={16} /> Añadir deuda / Saldo a favor del alumno
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Alumno</label>
                <select
                  value={alumnoSeleccionado}
                  onChange={(e) => setAlumnoSeleccionado(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="">Seleccionar alumno...</option>
                  {alumnos.map(al => (
                    <option key={al.id} value={al.nombre}>{al.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Cantidad (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="block text-xs text-gray-500 mb-1">Nota (Opcional)</label>
                  <input
                    type="text"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Ej: Sobra del pago de Octubre"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} /> Guardar / Actualizar
              </button>
            </div>
          </form>

          {/* Lista de Deudas */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <h3 className="font-bold text-gray-800">Deudas Pendientes</h3>
              <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2 py-1 rounded-full">
                Total: {totalDeuda.toFixed(2)}€
              </span>
            </div>

            {deudas.length === 0 ? (
              <p className="text-center text-gray-400 py-4 italic text-sm">No tienes deudas pendientes.</p>
            ) : (
              <ul className="space-y-2">
                {deudas.map((deuda) => (
                  <li key={deuda.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-bold text-gray-800">{deuda.alumno}</p>
                      {deuda.nota && <p className="text-xs text-gray-500">{deuda.nota}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                         Última act: {deuda.fecha ? new Date(deuda.fecha).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-rose-600 text-lg">{deuda.cantidad.toFixed(2)}€</span>
                      <button 
                        onClick={() => onDelete(deuda.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                        title="Marcar como pagado / Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}