import React, { useState, useRef } from 'react';
import { X, User, Mail, DollarSign } from 'lucide-react'; // Añadimos DollarSign

const DICEBEAR_BASE_URL = "https://api.dicebear.com/8.x";

// Generar un avatar único basado en el email del usuario (para el botón por defecto)
const generateUserAvatar = (email) => {
  const seed = email ? email.split('@')[0] : 'default-user';
  return `${DICEBEAR_BASE_URL}/adventurer-neutral/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};

// Generar URLs de avatares preseleccionados con diferentes estilos
const PRESET_AVATARS = [
  `${DICEBEAR_BASE_URL}/bottts/svg?seed=ClaseScheduler`,
  `${DICEBEAR_BASE_URL}/adventurer/svg?seed=Estudiante`,
  `${DICEBEAR_BASE_URL}/fun-emoji/svg?seed=Profesor`,
  `${DICEBEAR_BASE_URL}/miniavs/svg?seed=Aula`,
  `${DICEBEAR_BASE_URL}/notionists/svg?seed=Agenda`,
  `${DICEBEAR_BASE_URL}/identicon/svg?seed=ID`,
  `${DICEBEAR_BASE_URL}/rings/svg?seed=Anillos`,
  `${DICEBEAR_BASE_URL}/personas/svg?seed=Persona`,
];


// Recibe 'userProfile' como prop (con los datos de Firestore)
export default function ProfileModal({ user, userProfile, onClose, onSaveProfile }) {
  if (!user) return null;

  // Valor por defecto si userProfile es null
  const initialPrecioHora = userProfile?.precioHora || 0;

  const initialPreview = user.photoURL || generateUserAvatar(user.email);
  const [nombre, setNombre] = useState(user.displayName || '');
  const [precioHora, setPrecioHora] = useState(initialPrecioHora); // <-- AÑADIDO

  // fotoFile guarda la URL si fue seleccionada, o null
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(initialPreview);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // --- Lógica de Selección de Avatar ---
  const handleAvatarSelect = (url) => {
    setFotoPreview(url);
    setFotoFile(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const urlToSave = fotoFile || fotoPreview;
      const honorarios = parseFloat(precioHora) || 0; // Aseguramos que sea un número

      // Pasa la URL y el nombre AL CONTRARIO (fotoFileOrUrl, nuevoNombre, nuevoPrecioHora)
      await onSaveProfile(urlToSave, nombre, honorarios);
      onClose();
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      alert("Error al guardar el perfil. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100"><X size={20} /></button>
        <h3 className="text-xl font-semibold text-slate-800 mb-6">Tu Perfil</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center space-y-3">
            {/* Vista previa de la foto */}
            <div className="relative w-24 h-24">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Perfil" className="w-24 h-24 rounded-full object-cover ring-2 ring-indigo-500/50" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <User size={48} />
                </div>
              )}
            </div>
          </div>

          {/* GALERÍA DE AVATARES (sin cambios) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Seleccionar Avatar:</label>
            <div className="flex flex-wrap gap-2 justify-center p-3 bg-slate-50 rounded-lg border border-slate-200">
              {/* Botón de avatar por defecto del usuario (basado en el email) */}
              <button
                key="default"
                type="button"
                onClick={() => handleAvatarSelect(generateUserAvatar(user.email))}
                className={`w-10 h-10 rounded-full overflow-hidden transition-all duration-150 ${fotoPreview === generateUserAvatar(user.email) ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'hover:scale-105'}`}
                aria-label="Avatar basado en email"
              >
                <img src={generateUserAvatar(user.email)} alt="Default" className="w-full h-full object-cover" />
              </button>
              {PRESET_AVATARS.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAvatarSelect(url)}
                  className={`w-10 h-10 rounded-full overflow-hidden transition-all duration-150 ${fotoPreview === url ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'hover:scale-105'}`}
                  aria-label={`Seleccionar Avatar ${index + 1}`}
                >
                  <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          {/* FIN GALERÍA */}

          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full p-2 pl-10 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* --- CAMPO PRECIO/HORA AÑADIDO --- */}
          <div>
            <label htmlFor="precioHora" className="block text-sm font-medium text-slate-700 mb-1">Honorarios por Hora (€)</label>
            <div className="relative">
              <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                id="precioHora"
                name="precioHora"
                value={precioHora}
                onChange={(e) => setPrecioHora(e.target.value)}
                min="0"
                step="0.01"
                className="w-full p-2 pl-10 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>
          {/* --- FIN CAMPO AÑADIDO --- */}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                id="email"
                value={user.email || 'No disponible'}
                disabled
                className="w-full p-2 pl-10 border border-slate-300 rounded-md shadow-sm bg-slate-100 text-slate-500 cursor-not-allowed text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="text-sm font-medium text-slate-700 bg-white border border-slate-300 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
