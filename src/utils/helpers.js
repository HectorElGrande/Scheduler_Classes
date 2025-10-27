export const detectarSolapamiento = (nuevaClase, clasesExistentes, idActual) => {
    if (!clasesExistentes || !Array.isArray(clasesExistentes) || !nuevaClase) return null; // Safety checks
    for (const clase of clasesExistentes) {
        // Ensure 'clase' object is valid and has necessary properties
        if (!clase || typeof clase.fecha !== 'string' || typeof clase.inicio !== 'string' || typeof clase.fin !== 'string') {
            console.warn("Skipping invalid existing class in overlap check:", clase);
            continue;
        }
        // Ensure 'nuevaClase' has necessary properties
        if (typeof nuevaClase.fecha !== 'string' || typeof nuevaClase.inicio !== 'string' || typeof nuevaClase.fin !== 'string') {
            console.warn("Invalid new class data for overlap check:", nuevaClase);
            return null; // Cannot perform check with invalid new data
        }

        if (idActual && clase.id === idActual) continue; // Skip self-comparison during edit

        if (clase.fecha === nuevaClase.fecha) {
            // Overlap logic: (StartA < EndB) and (EndA > StartB)
            const haySolapamiento = nuevaClase.inicio < clase.fin && nuevaClase.fin > clase.inicio;
            if (haySolapamiento) {
                console.log("Overlap detected:", nuevaClase, clase);
                return clase; // Return conflicting class
            }
        }
    }
    return null; // No overlap found
};