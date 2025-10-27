import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function SelectorHora({ value = "09:00", onChange }) {
    const safeValue = (typeof value === 'string' && value.includes(':')) ? value : "09:00";
    const [hora = '09', minutos = '00'] = safeValue.split(':'); // Default split values
    const handleHoraChange = (e) => { onChange(`${e.target.value}:${minutos}`); };
    const handleMinutosChange = (e) => { onChange(`${hora}:${e.target.value}`); };
    const commonInputClass = "w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none";
    const commonLabelClass = "block text-sm font-medium text-slate-700 mb-1";
    return (
        <div className="flex gap-3">
            <div className="flex-1">
                <label htmlFor="hora_select" className={commonLabelClass}>Hora</label>
                <div className="relative"><select id="hora_select" value={hora} onChange={handleHoraChange} className={commonInputClass}>{Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (<option key={h} value={h}>{h}</option>))}</select><ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
            </div>
            <div className="flex-1">
                <label htmlFor="minutos_select" className={commonLabelClass}>Minutos</label>
                <div className="relative"><select id="minutos_select" value={minutos} onChange={handleMinutosChange} className={commonInputClass}><option value="00">00</option><option value="15">15</option><option value="30">30</option><option value="45">45</option></select><ChevronDown size={18} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
            </div>
        </div>
    );
}