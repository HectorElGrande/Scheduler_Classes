import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatFecha, getInicioSemana, addDays, toYYYYMMDD } from '../utils/dates';
import { DollarSign, BookOpen, Clock, ChevronLeft, ChevronRight, Target, TrendingUp } from 'lucide-react';

// Formateador de moneda (Mover fuera del componente principal)
const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
};

// --- Componente de Tarjeta (Stat Card) ENRIQUECIDO ---
function StatCard({ title, value, icon, colorClass, borderClass }) {
    return (
        <div className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow 
      border-l-4 ${borderClass || 'border-slate-300'} flex items-center gap-4`}>
            <div className={`p-4 rounded-full ${colorClass} bg-opacity-30`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-extrabold text-slate-800 mt-1">{value}</p>
            </div>
        </div>
    );
}

// --- Componente: Tarjeta de Progreso de Meta ---
function GoalProgressCard({ hours, targetHours, monthName }) {
    const percent = targetHours > 0 ? Math.min(100, (hours / targetHours) * 100) : 0;
    const progressColor = percent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500';
    const textCompletion = percent >= 100 ? 'Meta Superada! 🥳' : `${percent.toFixed(0)}% Completado`;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-700">Progreso de Horas ({monthName})</h3>
                <Target className="text-indigo-500" size={24} />
            </div>
            <p className="text-4xl font-extrabold text-slate-800">{hours.toFixed(1)} h</p>
            {targetHours > 0 ? (
                <>
                    <p className="text-sm text-slate-500 mt-1">de {targetHours} horas objetivo</p>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                    <p className="text-center text-sm font-medium mt-2" style={{ color: percent >= 100 ? '#10b981' : '#6366f1' }}>
                        {textCompletion}
                    </p>
                </>
            ) : (
                <p className="text-sm text-slate-400 mt-4">Define una meta mensual en tu perfil para activar el progreso.</p>
            )}
        </div>
    );
}

// --- Componente: Tarjeta de Ingreso Promedio Real ---
function AverageRateCard({ avgRate, officialRate }) {
    const difference = avgRate - officialRate;
    const isHigher = difference > 0;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-700">Ingreso Promedio/Hora (Real)</h3>
                <DollarSign className="text-teal-500" size={24} />
            </div>
            <p className="text-4xl font-extrabold text-slate-800">{formatCurrency(avgRate)}</p>
            <p className="text-sm text-slate-500 mt-2">
                Tasa oficial: {formatCurrency(officialRate)}
            </p>
            {officialRate > 0 && (
                <div className={`text-sm mt-3 p-2 rounded-lg ${isHigher ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {isHigher ? '¡Superior a tu tarifa oficial!' : 'Inferior a tu tarifa oficial.'}
                </div>
            )}
        </div>
    );
}


// --- Componente Principal del Dashboard ---
export default function Dashboard({ clases, userProfile, fechaActual }) {

    const [fechaMostrada, setFechaMostrada] = useState(fechaActual);

    // --- LÓGICA DE NAVEGACIÓN ---
    const handleNavegarMes = (direction) => {
        const newDate = new Date(fechaMostrada);
        newDate.setMonth(newDate.getMonth() + direction);
        setFechaMostrada(newDate);
    };


    // --- Cálculos ENRIQUECIDOS ---
    const stats = useMemo(() => {
        if (!userProfile) {
            return {
                ingresosHoy: 0, ingresosSemana: 0, ingresosMes: 0, horasMes: 0, horasHoy: 0, horasSemana: 0,
                chartData: [], precioHora: 0, inicioSemanaActual: new Date(),
                avgRateMes: 0, metaHorasMensual: 0,
            };
        }

        const precioHora = userProfile.precioHora || 0;
        const metaHorasMensual = userProfile.metaHorasMensual || 0;

        const hoy = toYYYYMMDD(new Date());
        const inicioSemanaActual = getInicioSemana(fechaMostrada);
        const inicioMesActual = new Date(fechaMostrada.getFullYear(), fechaMostrada.getMonth(), 1);
        const inicioMesSiguiente = new Date(fechaMostrada.getFullYear(), fechaMostrada.getMonth() + 1, 1);

        const semanaYMD = toYYYYMMDD(inicioSemanaActual);
        const mesYMD = toYYYYMMDD(inicioMesActual);

        // Filtrar clases por períodos (solo pagadas)
        const clasesPagadas = clases.filter(c => c.estadoPago === 'Pagado');
        const clasesDeSemana = clasesPagadas.filter(c => c.fecha >= semanaYMD && c.fecha < toYYYYMMDD(addDays(inicioSemanaActual, 7)));
        const clasesDeMes = clasesPagadas.filter(c => c.fecha >= mesYMD && c.fecha < toYYYYMMDD(inicioMesSiguiente));
        const clasesDeHoy = clasesPagadas.filter(c => c.fecha === hoy);


        // Sumas
        const ingresosHoy = clasesDeHoy.reduce((sum, c) => sum + (c.ingreso || 0), 0);
        const ingresosSemana = clasesDeSemana.reduce((sum, c) => sum + (c.ingreso || 0), 0);
        const ingresosMes = clasesDeMes.reduce((sum, c) => sum + (c.ingreso || 0), 0);
        const horasMes = clasesDeMes.reduce((sum, c) => sum + (c.duracionHoras || 0), 0);
        const horasHoy = clasesDeHoy.reduce((sum, c) => sum + (c.duracionHoras || 0), 0);
        const horasSemana = clasesDeSemana.reduce((sum, c) => sum + (c.duracionHoras || 0), 0);

        // Tasa promedio real del mes
        const avgRateMes = horasMes > 0 ? (ingresosMes / horasMes) : 0;

        // Datos para el gráfico (se mantiene igual)
        const diasEnMes = new Date(fechaMostrada.getFullYear(), fechaMostrada.getMonth() + 1, 0).getDate();
        const ingresosPorDia = {};
        for (let i = 1; i <= diasEnMes; i++) {
            const diaKey = String(i).padStart(2, '0');
            ingresosPorDia[diaKey] = { name: diaKey, Ingresos: 0 };
        }
        clasesDeMes.forEach(clase => {
            const dia = new Date(clase.fecha.replace(/-/g, '/')).getDate();
            const diaKey = String(dia).padStart(2, '0');
            if (ingresosPorDia[diaKey]) {
                ingresosPorDia[diaKey].Ingresos += (clase.ingreso || 0);
            }
        });
        const chartData = Object.values(ingresosPorDia).sort((a, b) => a.name.localeCompare(b.name));

        return {
            ingresosHoy, ingresosSemana, ingresosMes, horasMes, horasHoy, horasSemana,
            chartData, precioHora, inicioSemanaActual,
            avgRateMes, metaHorasMensual
        };
    }, [clases, fechaMostrada, userProfile]);

    // Manejar estado de carga
    if (!userProfile) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-500">
                Cargando estadísticas del perfil...
            </div>
        );
    }

    const monthName = formatFecha(fechaMostrada, { month: 'long' });

    // --- CÁLCULO DE ETIQUETAS DE FECHA DETALLADAS (NUEVO) ---
    const todayDateLabel = formatFecha(new Date(), { day: 'numeric', month: 'short', year: 'numeric' });

    const semanaInicio = stats.inicioSemanaActual;
    const semanaFin = addDays(stats.inicioSemanaActual, 6);
    // Formato: 26 oct - 1 nov 2025
    const weekDateLabel = `${formatFecha(semanaInicio, { day: 'numeric', month: 'short' })} - ${formatFecha(semanaFin, { day: 'numeric', month: 'short', year: 'numeric' })}`;

    const monthDateLabel = formatFecha(fechaMostrada, { month: 'long', year: 'numeric' });


    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">

            {/* CABECERA DE NAVEGACIÓN */}
            <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-md border border-slate-200">
                <h2 className="text-3xl font-bold text-slate-800">
                    Dashboard de Ingresos 📈
                </h2>
                <div className="flex items-center gap-4">
                    <span className="text-xl font-semibold text-indigo-600">
                        {formatFecha(fechaMostrada, { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                        onClick={() => handleNavegarMes(-1)}
                        className="p-2 rounded-full text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                        aria-label="Mes anterior"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => handleNavegarMes(1)}
                        className="p-2 rounded-full text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                        aria-label="Mes siguiente"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
            {/* FIN CABECERA DE NAVEGACIÓN */}

            {/* Alerta si falta precio/hora */}
            {stats.precioHora === 0 && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 mb-6 rounded-md shadow-md">
                    <p className="font-bold">🚨 ¡ACCIÓN REQUERIDA! 🚨</p>
                    <p className="text-sm">Define tus **Honorarios por Hora** en el menú de "Editar Perfil" para que los cálculos de ingresos sean precisos. (Actualmente a 0€)</p>
                </div>
            )}

            {/* 1. Tarjetas de Estadísticas (Fila Superior) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title={`Ingresos Hoy (${stats.horasHoy.toFixed(1)} h)`}
                    value={formatCurrency(stats.ingresosHoy)}
                    icon={<DollarSign size={24} className="text-green-600" />}
                    colorClass="bg-green-200"
                    borderClass="border-green-500"
                />
                <StatCard
                    title={`Ingresos Semana (${formatFecha(stats.inicioSemanaActual, { day: 'numeric', month: 'short' })})`}
                    value={formatCurrency(stats.ingresosSemana)}
                    icon={<DollarSign size={24} className="text-indigo-600" />}
                    colorClass="bg-indigo-200"
                    borderClass="border-indigo-500"
                />
                <StatCard
                    title={`Ingresos ${monthName}`}
                    value={formatCurrency(stats.ingresosMes)}
                    icon={<DollarSign size={24} className="text-orange-600" />}
                    colorClass="bg-orange-200"
                    borderClass="border-orange-500"
                />
                <StatCard
                    title={`Horas Netas ${monthName}`}
                    value={`${stats.horasMes.toFixed(1)} h`}
                    icon={<Clock size={24} className="text-blue-600" />}
                    colorClass="bg-blue-200"
                    borderClass="border-blue-500"
                />
            </div>

            {/* 2. CONTENIDO PRINCIPAL: Gráfico y Detalles */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* IZQUIERDA (Gráfico Principal) */}
                <div className="lg:w-3/5 bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-700 mb-6">
                        Detalle de Ingresos Diarios en {monthName}
                    </h3>
                    {stats.chartData.length > 0 ? (
                        <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer>
                                <BarChart data={stats.chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" fontSize={12} />
                                    <YAxis fontSize={12} tickFormatter={(value) => `€${Math.floor(value)}`} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}
                                        formatter={(value) => [formatCurrency(value), 'Ingresos']}
                                        labelFormatter={(label) => `Día ${label}`}
                                    />
                                    <Bar dataKey="Ingresos" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center py-20">No hay datos de ingresos este mes.</p>
                    )}
                </div>

                {/* DERECHA (Tarjetas Adicionales) */}
                <div className="lg:w-2/5 flex flex-col gap-6">
                    {/* --- RESUMEN DE PRODUCTIVIDAD (AHORA CON FECHAS DETALLADAS) --- */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4">
                            <span className='mr-2 text-indigo-500'>🚀</span> Productividad Acumulada
                        </h3>
                        <div className="space-y-4">
                            {/* Cabecera de la "tabla" */}
                            <div className="grid grid-cols-3 text-sm font-medium text-slate-500 border-b pb-1">
                                <span>Periodo</span>
                                <span className="text-right">Horas</span>
                                <span className="text-right">Ingresos</span>
                            </div>

                            {/* Fila: Hoy */}
                            <div className="grid grid-cols-3 items-center text-slate-800">
                                <span className="font-medium text-sm text-slate-600 whitespace-nowrap">
                                    Hoy ({todayDateLabel})
                                </span>
                                <span className="text-right font-semibold text-blue-600">{stats.horasHoy.toFixed(1)} h</span>
                                <span className="text-right font-bold text-green-600">{formatCurrency(stats.ingresosHoy)}</span>
                            </div>

                            {/* Fila: Semana */}
                            <div className="grid grid-cols-3 items-center text-slate-800 border-t pt-2">
                                <span className="font-medium text-sm text-slate-600 whitespace-nowrap">
                                    Esta Semana ({weekDateLabel})
                                </span>
                                <span className="text-right font-semibold text-blue-600">{stats.horasSemana.toFixed(1)} h</span>
                                <span className="text-right font-bold text-green-600">{formatCurrency(stats.ingresosSemana)}</span>
                            </div>

                            {/* Fila: Mes */}
                            <div className="grid grid-cols-3 items-center text-slate-800 border-t pt-2">
                                <span className="font-medium text-sm text-slate-600 whitespace-nowrap">
                                    Este Mes ({monthDateLabel})
                                </span>
                                <span className="text-right font-semibold text-blue-600">{stats.horasMes.toFixed(1)} h</span>
                                <span className="text-right font-bold text-green-600">{formatCurrency(stats.ingresosMes)}</span>
                            </div>

                            {/* Proyección Anual (Bonus) */}
                            <div className="flex justify-between items-center mt-4 pt-3 border-t-2 border-dashed border-slate-200">
                                <span className="font-bold text-base flex items-center text-slate-700">
                                    <TrendingUp size={18} className='text-orange-500 mr-2' /> Proyección Anual
                                </span>
                                <span className="font-extrabold text-xl text-indigo-700">{formatCurrency(stats.ingresosMes * 12)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}