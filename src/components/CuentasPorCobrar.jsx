import React, { useMemo, useState } from 'react';
import { DollarSign, User, Clock, CheckCircle, Search, Calendar, Tag } from 'lucide-react';
import { calcularDuracionEnHoras, calcularMontoDeuda } from '../utils/helpers';
import { formatFecha } from '../utils/dates';

/**
 * Componente para mostrar la vista de Cuentas por Cobrar (Morosos).
 * Muestra la deuda pendiente agrupada por alumno.
 */
export default function CuentasPorCobrar({ clases, alumnos, userProfile, onSaveClase,  }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [savingClassId, setSavingClassId] = useState(null);

    // Obtener la tarifa base del perfil del usuario (si está disponible)
    const tarifaBase = userProfile?.tarifaBase || 15; 
    
    // 1. Agrupar clases no pagadas y calcular la deuda
    const datosDeuda = useMemo(() => {
        const deudaPorAlumno = {};

        // 1. Filtrar clases no pagadas
        const clasesPendientes = clases.filter(c => c.estadoPago === 'No pagado');

        for (const clase of clasesPendientes) {
            const alumnoNombre = clase.alumno || 'Desconocido';
            
            // Calcular duración y monto
            const duracionHoras = calcularDuracionEnHoras(clase.inicio, clase.fin);
            const monto = calcularMontoDeuda(duracionHoras, tarifaBase);
            
            // Inicializar o actualizar el registro del alumno
            if (!deudaPorAlumno[alumnoNombre]) {
                // Buscamos el objeto alumno para obtener el ID real
                const alumnoObj = alumnos.find(a => a.nombre === alumnoNombre);
                deudaPorAlumno[alumnoNombre] = {
                    alumnoId: alumnoObj?.id, // Para referencia, aunque no se usa en este componente
                    nombre: alumnoNombre,
                    totalMonto: 0,
                    clasesPendientes: [],
                };
            }

            deudaPorAlumno[alumnoNombre].totalMonto += monto;
            deudaPorAlumno[alumnoNombre].clasesPendientes.push({
                ...clase,
                montoCalculado: monto,
                duracionHoras: duracionHoras
            });
        }
        
        // 2. Convertir el objeto a un array y ordenar por monto
        return Object.values(deudaPorAlumno)
            .sort((a, b) => b.totalMonto - a.totalMonto);
    }, [clases, alumnos, tarifaBase]);


    // 2. Filtrar por término de búsqueda
    const datosDeudaFiltrados = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (!term) return datosDeuda;
        return datosDeuda.filter(data => 
            data.nombre.toLowerCase().includes(term) ||
            data.clasesPendientes.some(c => 
                c.materia.toLowerCase().includes(term)
            )
        );
    }, [datosDeuda, searchTerm]);


    // 3. Manejar el marcado de pago
    const handleMarcarPagado = async (clase) => {
        if (!onSaveClase) return;
        setSavingClassId(clase.id);
        try {
            await onSaveClase({ ...clase, estadoPago: 'Pagado' });
            // alert(`Clase de ${clase.alumno} marcada como pagada.`); // Usar feedback visual en la App principal
        } catch (error) {
            console.error("Error al marcar clase como pagada:", error);
            // alert("Hubo un error al guardar el pago.");
        } finally {
            setSavingClassId(null);
        }
    };

    const totalDeudaGeneral = datosDeuda.reduce((acc, curr) => acc + curr.totalMonto, 0);


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                    <DollarSign size={28} className="text-red-500" />
                    Cuentas por Cobrar
                </h1>
                <p className="mt-2 text-slate-600">
                    Control de clases pendientes de pago agrupadas por alumno. Tarifa base utilizada: <span className="font-semibold text-indigo-600">{tarifaBase.toFixed(2)}€</span>.
                </p>
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg shadow-sm">
                    <p className="font-bold">Deuda Total Pendiente:</p>
                    <p className="text-3xl font-extrabold mt-1">{totalDeudaGeneral.toFixed(2)} €</p>
                </div>
            </header>

            {/* Búsqueda y Herramientas */}
            <div className="mb-6 flex justify-between items-center">
                <div className="relative w-full max-w-sm">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar alumno o materia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                </div>
            </div>

            {/* Listado de Deuda */}
            <div className="space-y-6">
                {datosDeudaFiltrados.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl shadow-lg border border-green-200">
                        <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
                        <p className="text-xl font-semibold text-green-700">¡Todo al día!</p>
                        <p className="text-slate-600 mt-1">No hay clases pendientes de pago.</p>
                    </div>
                ) : (
                    datosDeudaFiltrados.map((data) => (
                        <div key={data.nombre} className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-indigo-500">
                            {/* Cabecera del Alumno */}
                            <div className="p-4 sm:p-6 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                <div className="flex items-center gap-3">
                                    <User size={24} className="text-indigo-600" />
                                    <h2 className="text-xl font-bold text-slate-800">{data.nombre}</h2>
                                </div>
                                <div className="mt-2 sm:mt-0">
                                    <p className="text-sm font-medium text-slate-600">Deuda Pendiente</p>
                                    <p className="text-3xl font-extrabold text-red-600">{data.totalMonto.toFixed(2)} €</p>
                                </div>
                            </div>

                            {/* Detalles de Clases Pendientes */}
                            <div className="p-4 sm:p-6">
                                <ul className="space-y-4">
                                    {data.clasesPendientes.map((clase) => (
                                        <li key={clase.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                                            {/* Información de la clase */}
                                            <div className="flex-grow space-y-1 md:space-y-0 md:flex md:items-center md:gap-4">
                                                <span className="flex items-center text-sm font-medium text-slate-700 min-w-[120px]">
                                                    <Calendar size={14} className="mr-1.5 text-slate-500" />
                                                    {clase.fecha}
                                                </span>
                                                <span className="flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                                    <Tag size={12} className="mr-1" />
                                                    {clase.materia}
                                                </span>
                                                <span className="flex items-center text-sm text-slate-500">
                                                    <Clock size={14} className="mr-1.5" />
                                                    {clase.inicio} - {clase.fin} ({clase.duracionHoras.toFixed(1)} h)
                                                </span>
                                            </div>

                                            {/* Monto y Acción */}
                                            <div className="flex items-center gap-3 mt-3 md:mt-0 md:ml-4">
                                                <span className="text-lg font-bold text-red-500 min-w-[80px] text-right">
                                                    {clase.montoCalculado.toFixed(2)} €
                                                </span>
                                                <button
                                                    onClick={() => handleMarcarPagado(clase)}
                                                    disabled={savingClassId === clase.id}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-wait`}
                                                    title="Marcar como Pagado"
                                                >
                                                    {savingClassId === clase.id ? '...' : <CheckCircle size={14} />}
                                                    {savingClassId === clase.id ? 'Guardando...' : 'Marcar Pagado'}
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
