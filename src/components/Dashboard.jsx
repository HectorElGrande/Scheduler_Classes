import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatFecha, getInicioSemana, addDays, toYYYYMMDD } from '../utils/dates';
import { DollarSign, Clock, ChevronLeft, ChevronRight, Target, TrendingUp } from 'lucide-react';

// Formateador de moneda
const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
};

// --- FUNCIÓN UTILITARIA (Calcula semanas del mes) ---
// Calcula las fechas de inicio de las semanas que caen en el mes de 'date'
const getSemanasEnMes = (date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const weeks = [];
    let currentWeekStart = getInicioSemana(startOfMonth);

    // Aseguramos que empezamos antes o en la primera semana del mes
    if (currentWeekStart > startOfMonth && currentWeekStart.getMonth() === startOfMonth.getMonth()) {
        currentWeekStart = getInicioSemana(addDays(startOfMonth, -7));
    }

    // Iteramos semana por semana
    while (currentWeekStart <= endOfMonth || getInicioSemana(currentWeekStart).getMonth() === date.getMonth()) {
        const weekEnd = addDays(currentWeekStart, 6);
        weeks.push({
            start: currentWeekStart,
            end: weekEnd,
            label: `${formatFecha(currentWeekStart, { day: 'numeric', month: 'short' })} - ${formatFecha(weekEnd, { day: 'numeric', month: 'short' })}`
        });
        currentWeekStart = addDays(currentWeekStart, 7);
        // Evitar bucle infinito y limitar al mes siguiente
        if (currentWeekStart > addDays(endOfMonth, 7)) break;
    }

    // Filtro para asegurar que las semanas tienen solapamiento significativo en el mes
    return weeks.filter(week => week.start <= endOfMonth || week.end >= startOfMonth);
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

// Componente: Tarjeta de Progreso de Meta (se mantiene)
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

// Componente: Tarjeta de Ingreso Promedio Real (se mantiene)
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

// --- Componente: Selector de Semana (se mantiene) ---
function WeekSelector({ weeksInMonth, semanaMostrada, onSelectWeek }) {
    const currentWeekStart = toYYYYMMDD(semanaMostrada);

    return (
        <div className="flex flex-wrap gap-2 justify-center p-3 bg-slate-100 rounded-lg shadow-inner border border-slate-200 mt-4">
            {weeksInMonth.map((week) => {
                const isSelected = toYYYYMMDD(week.start) === currentWeekStart;

                return (
                    <button
                        key={toYYYYMMDD(week.start)}
                        onClick={() => onSelectWeek(week.start)}
                        className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors duration-200 
                            ${isSelected
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'
                            }`}
                    >
                        {week.label}
                    </button>
                );
            })}
        </div>
    );
}


// --- Componente Principal del Dashboard ---
export default function Dashboard({ clases, userProfile, fechaActual }) {

    const [fechaMostrada, setFechaMostrada] = useState(fechaActual);
    const [semanaMostrada, setSemanaMostrada] = useState(getInicioSemana(fechaActual));

    // Lógica de navegación mensual
    const handleNavegarMes = useCallback((direction) => {
        setFechaMostrada(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + direction);
            setSemanaMostrada(getInicioSemana(newDate)); // Resetear semana al inicio del nuevo mes
            return newDate;
        });
    }, []);

    // Lógica para cambiar la semana
    const handleNavegarSemana = (newWeekStart) => {
        setSemanaMostrada(newWeekStart);
    };

    // --- CÁLCULO DE DATOS Y RANGOS (SIMPLIFICADO) ---
    const stats = useMemo(() => {
        if (!userProfile) {
            return {
                ingresosSemana: 0, ingresosMes: 0, horasMes: 0, horasSemana: 0,
                chartData: [], precioHora: 0, inicioSemanaActual: semanaMostrada,
                avgRateMes: 0, metaHorasMensual: 0,
            };
        }

        const precioHora = userProfile.precioHora || 0;
        const metaHorasMensual = userProfile.metaHorasMensual || 0;

        // Rango de la semana SELECCIONADA
        const inicioSemanaSeleccionada = semanaMostrada;
        const finSemanaSeleccionada = addDays(semanaMostrada, 6);
        const semanaYMD = toYYYYMMDD(inicioSemanaSeleccionada);
        const finSemanaYMD = toYYYYMMDD(finSemanaSeleccionada);

        // Rango del mes
        const inicioMesActual = new Date(fechaMostrada.getFullYear(), fechaMostrada.getMonth(), 1);
        const inicioMesSiguiente = new Date(fechaMostrada.getFullYear(), fechaMostrada.getMonth() + 1, 1);
        const mesYMD = toYYYYMMDD(inicioMesActual);

        // Filtrar clases por períodos (solo pagadas)
        const clasesPagadas = clases.filter(c => c.estadoPago === 'Pagado');

        // Filtrar usando la semana seleccionada
        const clasesDeSemana = clasesPagadas.filter(c => c.fecha >= semanaYMD && c.fecha <= finSemanaYMD);
        const clasesDeMes = clasesPagadas.filter(c => c.fecha >= mesYMD && c.fecha < toYYYYMMDD(inicioMesSiguiente));

        // Sumas
        const ingresosSemana = clasesDeSemana.reduce((sum, c) => sum + (c.ingreso || 0), 0);
        const ingresosMes = clasesDeMes.reduce((sum, c) => sum + (c.ingreso || 0), 0);
        const horasMes = clasesDeMes.reduce((sum, c) => sum + (c.duracionHoras || 0), 0);
        const horasSemana = clasesDeSemana.reduce((sum, c) => sum + (c.duracionHoras || 0), 0);

        // Tasa promedio real del mes (Se mantiene para la tarjeta lateral de tasa)
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
            ingresosSemana, ingresosMes, horasMes, horasSemana,
            chartData, precioHora, inicioSemanaActual: inicioSemanaSeleccionada,
            avgRateMes, metaHorasMensual
        };
    }, [clases, fechaMostrada, semanaMostrada, userProfile]);

    // Calcular las semanas del mes seleccionado para el WeekSelector
    const weeksInMonth = useMemo(() => getSemanasEnMes(fechaMostrada), [fechaMostrada]);


    // Manejar estado de carga
    if (!userProfile) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-500">
                Cargando estadísticas del perfil...
            </div>
        );
    }

    const monthName = formatFecha(fechaMostrada, { month: 'long' });

    // --- CÁLCULO DE ETIQUETAS DE FECHA DETALLADAS ---
    const semanaInicio = stats.inicioSemanaActual;
    const semanaFin = addDays(stats.inicioSemanaActual, 6);
    const weekDateLabel = `${formatFecha(semanaInicio, { day: 'numeric', month: 'short' })} - ${formatFecha(semanaFin, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    const monthDateLabel = formatFecha(fechaMostrada, { month: 'long', year: 'numeric' });


    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">

            {/* CABECERA DE NAVEGACIÓN */}
            <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
                <div className="flex justify-between items-center">
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

                {/* SELECTOR DE SEMANAS DENTRO DEL MES */}
                <WeekSelector
                    weeksInMonth={weeksInMonth}
                    semanaMostrada={semanaMostrada}
                    onSelectWeek={handleNavegarSemana}
                />
            </div>
            {/* FIN CABECERA DE NAVEGACIÓN */}

            <div className="mt-6">
                {/* Alerta si falta precio/hora */}
                {stats.precioHora === 0 && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 mb-6 rounded-md shadow-md">
                        <p className="font-bold">🚨 ¡ACCIÓN REQUERIDA! 🚨</p>
                        <p className="text-sm">Define tus **Honorarios por Hora** en el menú de "Editar Perfil" para que los cálculos de ingresos sean precisos. (Actualmente a 0€)</p>
                    </div>
                )}

                {/* 1. Tarjetas de Estadísticas (Fila Superior - AHORA TRES COLUMNAS) */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">

                    {/* Tarjeta 1: Ingresos Semana (Ahora la primera y más relevante) */}
                    <StatCard
                        title={`Ingresos Semana (${formatFecha(stats.inicioSemanaActual, { day: 'numeric', month: 'short' })})`}
                        value={formatCurrency(stats.ingresosSemana)}
                        icon={<DollarSign size={24} className="text-indigo-600" />}
                        colorClass="bg-indigo-200"
                        borderClass="border-indigo-500"
                    />

                    {/* Tarjeta 2: Ingresos Mes */}
                    <StatCard
                        title={`Ingresos ${monthName}`}
                        value={formatCurrency(stats.ingresosMes)}
                        icon={<DollarSign size={24} className="text-orange-600" />}
                        colorClass="bg-orange-200"
                        borderClass="border-orange-500"
                    />

                    {/* Tarjeta 3: Horas Mes */}
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
                        {/* --- RESUMEN DE PRODUCTIVIDAD (SIMPLIFICADO) --- */}
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

                                {/* Fila: Semana */}
                                <div className="grid grid-cols-3 items-center text-slate-800 pt-2">
                                    <span className="font-medium text-sm text-slate-600 whitespace-nowrap">
                                        Semana Seleccionada ({weekDateLabel})
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
        </div>
    );
}