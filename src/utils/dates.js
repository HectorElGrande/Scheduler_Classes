// --- Funciones de Ayuda ---
export const toYYYYMMDD = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
        console.warn("toYYYYMMDD received invalid date:", date);
        const today = new Date();
        // Ensure month and day are two digits
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${today.getFullYear()}-${month}-${day}`;
    }
    const anio = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
};

export const addDays = (date, days) => {
    // Ensure input is a valid date
    if (!(date instanceof Date) || isNaN(date)) {
        console.error("addDays received invalid date:", date);
        return new Date(); // Return today's date as a fallback
    }
    const result = new Date(date);
    // Check if setDate results in a valid date, though unlikely necessary with valid input
    try {
        result.setDate(result.getDate() + days);
        if (isNaN(result)) throw new Error("Resulting date is invalid");
    } catch (e) {
        console.error("Error adding days:", e);
        return new Date(); // Fallback
    }
    return result;
};

export const formatFecha = (date, options) => {
    if (!(date instanceof Date) || isNaN(date)) {
        console.warn("formatFecha received invalid date:", date);
        return "Fecha inválida";
    }
    try {
        // Define default options if needed, or rely on caller providing them
        const defaultOptions = { timeZone: 'Europe/Madrid' };
        return new Intl.DateTimeFormat('es-ES', { ...defaultOptions, ...options }).format(date);
    } catch (e) {
        console.error("Error formatting date:", e);
        return "Error fecha";
    }
};

export const getInicioSemana = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
        console.error("getInicioSemana received invalid date:", date);
        // Fallback: start of the current week
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(today.setDate(diff));
    }
    const d = new Date(date); // Clone date to avoid modifying original
    const diaSemana = d.getDay();
    // Calculate difference to Monday
    // If Sunday (0), go back 6 days. If Monday (1), diff is 0. If Tuesday (2), go back 1 day, etc.
    const diff = d.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    try {
        // Use setDate on the original cloned date 'd'
        d.setDate(diff);
        if (isNaN(d)) throw new Error("Resulting start date is invalid");
        return d;
    } catch (e) {
        console.error("Error calculating start of week:", e, date);
        // Fallback: Start of the current week
        const today = new Date();
        const dayOfWeekFallback = today.getDay();
        const diffFallback = today.getDate() - dayOfWeekFallback + (dayOfWeekFallback === 0 ? -6 : 1);
        return new Date(today.setDate(diffFallback));
    }
};

export const getMatrizMes = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
        console.error("getMatrizMes received invalid date:", date);
        // Fallback: matrix for the current month
        date = new Date();
    }
    const anio = date.getFullYear();
    const mes = date.getMonth();
    // Ensure the first day calculation is safe
    let primerDiaMes;
    try {
        primerDiaMes = new Date(anio, mes, 1);
        if (isNaN(primerDiaMes)) throw new Error("Invalid first day of month");
    } catch (e) {
        console.error("Error creating first day of month:", e);
        primerDiaMes = new Date(); // Fallback to today if month/year were bad
        primerDiaMes.setDate(1);
    }

    let primerDiaSemana;
    try {
        primerDiaSemana = getInicioSemana(primerDiaMes);
        if (isNaN(primerDiaSemana)) throw new Error("Invalid start of week from getInicioSemana");
    } catch (e) {
        console.error("Error getting start of week for month matrix:", e, primerDiaMes);
        // Fallback: use the first day of the month itself
        primerDiaSemana = new Date(primerDiaMes); // Clone
    }

    const dias = [];
    let diaActual = new Date(primerDiaSemana); // Clone start date

    for (let i = 0; i < 42; i++) {
        // Check if diaActual is valid before pushing
        if (isNaN(diaActual)) {
            console.error("Invalid date encountered during matrix generation:", diaActual);
            break; // Stop if date becomes invalid
        }
        dias.push(new Date(diaActual)); // Push a clone
        try {
            // Increment the date for the next iteration
            diaActual.setDate(diaActual.getDate() + 1);
        } catch (e) {
            console.error("Error incrementing day in month matrix:", e, diaActual);
            break; // Stop if increment fails
        }
    }
    // Ensure we always return an array, even if empty or incomplete
    if (dias.length !== 42 && i < 41) { // Check if loop broke early
        console.warn(`Month matrix generation incomplete (${dias.length}/42) due to date errors.`);
    }
    return dias;
};