import React from 'react';
import { DIAS_SEMANA_COMPLETO } from '../utils/constants';

export default function CabeceraMes({ vista }) {
    if (vista !== 'mes') return null;
    return (
        <div className="grid grid-cols-7 sticky top-0 bg-white z-10 shadow-sm border-r border-slate-200">{DIAS_SEMANA_COMPLETO.map(dia => (<div key={dia} className="p-2 text-center text-m font-semibold text-slate-600 border-b border-l border-slate-200">{dia}</div>))}</div>
    );
}