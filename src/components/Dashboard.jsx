import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatFecha, getInicioSemana, addDays, toYYYYMMDD } from '../utils/dates';
import { DollarSign, Clock, ChevronLeft, ChevronRight, Target, TrendingUp } from 'lucide-react';

// Formateador de moneda
const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
};

// --- FUNCIÓN UTILITARIA PARA EL CÁLCULO DE INGRESOS ---
const calculateClassIncome = (durationHours, hourlyRate) => {
    // Si la duración es 0 o no hay tarifa, el ingreso es 0
    if (durationHours <= 0 || hourlyRate <= 0) {
        return 0;
    }

    const durationMinutes = durationHours * 60;
    const baseRate = hourlyRate;

    if (durationMinutes <= 60) {
        return baseRate;
    }

    // Minutos después de la primera hora
    const extraMinutes = durationMinutes - 60;
    
    // Número de bloques de 30 minutos extras (se redondea hacia arriba)
    const extraBlocks = Math.ceil(extraMinutes / 30);
    
    const extraCharge = extraBlocks * 5.00; // 5€ por cada bloque de 30 min extra
    
    return baseRate + extraCharge;
};


// --- FUNCIÓN UTILITARIA (Calcula semanas del mes) ---
const getSemanasEnMes = (date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const weeks = [];
    let currentWeekStart = getInicioSemana(startOfMonth);

    if (currentWeekStart > startOfMonth && currentWeekStart.getMonth() === startOfMonth.getMonth()) {
        currentWeekStart = getInicioSemana(addDays(startOfMonth, -7));
    }
    
    while (currentWeekStart <= endOfMonth || getInicioSemana(currentWeekStart).getMonth() === date.getMonth()) {
        const weekEnd = addDays(currentWeekStart, 6);
        weeks.push({
            start: currentWeekStart,
            end: weekEnd,
            label: `${formatFecha(currentWeekStart, { day: 'numeric', month: 'short' })} - ${formatFecha(weekEnd, { day: 'numeric', month: 'short' })}`
        });
        currentWeekStart = addDays(currentWeekStart, 7);
        if (currentWeekStart > addDays(endOfMonth, 7)) break;
    }
    
    return weeks.filter(week => week.start <= endOfMonth || week.end >= startOfMonth);
};


// --- Componente de Tarjeta (Stat Card) ENRIQUECIDO ---
function StatCard({ title, value, icon, colorClass, borderClass }) {
    return (
        // Se mantiene la responsividad aquí: ocupa 1 columna en móvil y 1/3 en tablet/escritorio
        <div className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow 
            border-l-4 ${borderClass || 'border-slate-300'} flex items-center gap-4`}>
            <div className={`p-4 rounded-full ${colorClass} bg-opacity-30`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
                {/* CAMBIO: Fuente más pequeña en 'sm', más grande en 'md' y superior */}
                <p className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-1">{value}</p>
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
            
            {/* CAMBIO: Fuente más pequeña por defecto, más grande en 'lg' y superior */}
            <p className="text-3xl lg:text-4xl font-extrabold text-slate-800">{hours.toFixed(1)} h</p>
            
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

            {/* CAMBIO: Fuente más pequeña por defecto, más grande en 'lg' y superior */}
            <p className="text-3xl lg:text-4xl font-extrabold text-slate-800">{formatCurrency(avgRate)}</p>
            
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

// --- Componente: Selector de Semana (Responsive) ---
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
                        // Clases ajustadas para móvil: padding vertical/horizontal y fuente más pequeña si es necesario
                        className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 
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


// --- Componente Principal del Dashboard (Responsive) ---
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

    // --- CÁLCULO DE DATOS Y RANGOS (ACTUALIZADO CON CÁLCULO DE INGRESOS) ---
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

        // --- CÁLCULO DE INGRESOS USANDO LA NUEVA LÓGICA ---
        
        // 1. Ingresos por Semana
        const ingresosSemana = clasesDeSemana.reduce((sum, c) => 
            sum + calculateClassIncome(c.duracionHoras || 0, precioHora), 0);

        // 2. Ingresos por Mes
        const ingresosMes = clasesDeMes.reduce((sum, c) => 
            sum + calculateClassIncome(c.duracionHoras || 0, precioHora), 0);

        // 3. Horas
        const horasMes = clasesDeMes.reduce((sum, c) => sum + (c.duracionHoras || 0), 0);
        const horasSemana = clasesDeSemana.reduce((sum, c) => sum + (c.duracionHoras || 0), 0);

        // Tasa promedio real del mes (Se mantiene para la tarjeta lateral de tasa)
        const avgRateMes = horasMes > 0 ? (ingresosMes / horasMes) : 0;

        // Datos para el gráfico 
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
                ingresosPorDia[diaKey].Ingresos += calculateClassIncome(clase.duracionHoras || 0, precioHora);
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
    // CAMBIO: Título de semana más corto para la tarjeta
    const weekCardTitle = `${formatFecha(semanaInicio, { day: 'numeric', month: 'short' })} - ${formatFecha(semanaFin, { day: 'numeric', month: 'short' })}`;
    const monthDateLabel = formatFecha(fechaMostrada, { month: 'long', year: 'numeric' });


    return (
        // El padding base de 6 (`p-6`) funciona bien, pero en móvil lo ajustamos a `p-4` o `p-5` si fuera necesario
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6"> 

            {/* CABECERA DE NAVEGACIÓN */}
            <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
                {/* CAMBIO: Añadido 'flex-wrap' y 'gap-2' para que el selector de mes salte si no cabe */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center flex-wrap gap-2"> 
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                        Dashboard de Ingresos 📈
                    </h2>
                    <div className="flex items-center gap-4">
                        <span className="text-base sm:text-xl font-semibold text-indigo-600">
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

                {/* SELECTOR DE SEMANAS DENTRO DEL MES (Ya con flex-wrap) */}
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

                {/* 1. Tarjetas de Estadísticas (Fila Superior - Responsive grid) */}
                {/* CAMBIO: 'md:grid-cols-2 lg:grid-cols-3'. Añade un paso intermedio de 2 columnas en tablets. */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

                    {/* Tarjeta 1: Ingresos Semana */}
                    <StatCard
                        title={`Ingresos Semana (${weekCardTitle})`}
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

                {/* 2. CONTENIDO PRINCIPAL: Gráfico y Detalles (Stacking en móvil) */}
                {/* CAMBIO ESTRUCTURAL: 
                  Este div es ahora 'flex-col' para apilar:
                  1. La fila superior (Gráfico + 2 Tarjetas)
                  2. La fila inferior (Productividad)
                */}
                <div className="flex flex-col gap-6"> 
                
                    {/* --- FILA SUPERIOR (Gráfico y 2 Tarjetas Laterales) --- */}
                    {/* Este div interno mantiene la lógica de 'lg:flex-row' */}
                    <div className="flex flex-col lg:flex-row gap-6">

                        {/* IZQUIERDA (Gráfico Principal) - Ocupa 100% en móvil, 3/5 en escritorio */}
                        <div className="w-full lg:w-3/5 bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                            <h3 className="text-xl font-bold text-slate-700 mb-6">
                                Detalle de Ingresos Diarios en {monthName}
                            </h3>
                            {stats.chartData.length > 0 ? (
                                // CAMBIO: Altura responsiva (más baja en móvil)
                                <div className="w-full h-[250px] sm:h-[350px]"> 
                                    <ResponsiveContainer>
                                        <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="name" fontSize={10} /> {/* Fuente más pequeña en eje X */}
                                            <YAxis fontSize={10} tickFormatter={(value) => `€${Math.floor(value)}`} />
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

                        {/* DERECHA (Tarjetas Adicionales) - Ocupa 100% en móvil, 2/5 en escritorio */}
                        <div className="w-full lg:w-2/5 flex flex-col gap-6">
                            {/* Tarjeta: Progreso de Meta */}
                            <GoalProgressCard
                                hours={stats.horasMes}
                                targetHours={stats.metaHorasMensual}
                                monthName={monthName}
                            />

                            {/* Tarjeta: Tasa Promedio Real */}
                            <AverageRateCard
                                avgRate={stats.avgRateMes}
                                officialRate={stats.precioHora}
                            />
                        </div>
                    
                    </div> 
                    {/* --- FIN DE LA FILA SUPERIOR --- */}


                    {/* --- FILA INFERIOR (Productividad Acumulada) --- */}
                    {/* Esta tarjeta se ha movido aquí para que ocupe el ancho completo por debajo */}
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

                            {/* Fila: Semana (Responsive: texto ajustado para evitar desbordes) */}
                            <div className="grid grid-cols-3 items-center text-slate-800 pt-2">
                                <span className="font-medium text-xs sm:text-sm text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                                    Semana ({weekCardTitle})
                                </span>
                                <span className="text-right font-semibold text-blue-600">{stats.horasSemana.toFixed(1)} h</span>
                                <span className="text-right font-bold text-green-600 text-sm">{formatCurrency(stats.ingresosSemana)}</span>
                            </div>

                            {/* Fila: Mes */}
                            <div className="grid grid-cols-3 items-center text-slate-800 border-t pt-2">
                                {/* CAMBIO: Añadido 'truncate' para evitar desbordes si 'monthDateLabel' es largo */}
                                <span className="font-medium text-sm text-slate-600 truncate">
                                    Este Mes ({monthDateLabel})
                                </span>
                                <span className="text-right font-semibold text-blue-600">{stats.horasMes.toFixed(1)} h</span>
                                <span className="text-right font-bold text-green-600">{formatCurrency(stats.ingresosMes)}</span>
                            </div>

                            {/* Proyección Anual */}
                            <div className="flex justify-between items-center mt-4 pt-3 border-t-2 border-dashed border-slate-200">
                                <span className="font-bold text-base flex items-center text-slate-700">
                                    <TrendingUp size={18} className='text-orange-500 mr-2' /> Proyección Anual
                                </span>
                                {/* CAMBIO: fuente responsiva en el valor */}
                                <span className="font-extrabold text-lg sm:text-xl text-indigo-700">{formatCurrency(stats.ingresosMes * 12)}</span>
                            </div>
                        </div>
                    </div>
                    {/* --- FIN DE LA FILA INFERIOR --- */}

                </div>
            </div>
        </div>
    );
}