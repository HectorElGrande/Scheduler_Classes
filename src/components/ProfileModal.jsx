import React, { useState, useRef } from 'react';
import { X, User, Mail, Upload } from 'lucide-react';

export default function ProfileModal({ user, onClose, onSaveProfile }) {
  if (!user) return null;

  const [nombre, setNombre] = useState(user.displayName || '');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(user.photoURL || null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Pasa el *archivo* (o null) y el *nuevo nombre*
      await onSaveProfile(fotoFile, nombre);
      onClose(); // Cierra el modal al guardar
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
                <img src={fotoPreview} alt="Perfil" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <User size={48} />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1.5 rounded-full shadow hover:bg-indigo-700 transition-colors"
                aria-label="Cambiar foto"
              >
                <Upload size={14} />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg"
            />
          </div>

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