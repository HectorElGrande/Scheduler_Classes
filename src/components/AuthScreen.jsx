import React, { useState } from 'react';
import { LogIn, Mail, Lock, User } from 'lucide-react';

export default function AuthScreen({ onGoogleSignIn, onEmailLogin, onEmailRegister }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState(''); // Solo para registrarse
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!nombre.trim()) {
        setError('El nombre es obligatorio para registrarse.');
        return;
      }
      try {
        await onEmailRegister(email, password, nombre);
        // El onAuthStateChanged en App.jsx manejará el cambio de estado
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          setError('El correo electrónico ya está en uso.');
        } else if (err.code === 'auth/weak-password') {
          setError('La contraseña debe tener al menos 6 caracteres.');
        } else {
          setError('Error al registrar. Inténtalo de nuevo.');
        }
        console.error("Error de registro:", err);
      }
    } else {
      try {
        await onEmailLogin(email, password);
      } catch (err) {
         if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setError('Email o contraseña incorrectos.');
        } else {
          setError('Error al iniciar sesión. Inténtalo de nuevo.');
        }
        console.error("Error de login:", err);
      }
    }
  };

  const commonInputClass = "w-full p-3 pl-10 border border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm";
  const commonIconClass = "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400";

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-pink-50">
      <div className="p-8 bg-white rounded-xl shadow-lg max-w-sm w-full mx-4">
        
        <h1 className="text-2xl font-bold text-slate-800 mb-4 text-center">
          {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h1>

        {/* Pestañas */}
        <div className="flex mb-6 border-b border-slate-200">
          <button
            onClick={() => { setIsRegistering(false); setError(''); }}
            className={`flex-1 p-3 font-medium text-sm ${!isRegistering ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
          >
            Entrar
          </button>
          <button
            onClick={() => { setIsRegistering(true); setError(''); }}
            className={`flex-1 p-3 font-medium text-sm ${isRegistering ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
          >
            Registrarse
          </button>
        </div>

        {/* Botón de Google */}
        <button
          onClick={onGoogleSignIn}
          className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-white text-slate-700 font-medium rounded-lg shadow border border-slate-200 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
             {/* ... (SVG de Google omitido por brevedad, puedes buscar "google g logo svg") ... */}
             <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FBBC05" d="M6.306 14.691L11.95 18.693C13.116 14.808 16.32 12 20 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C30.346 6.053 25.568 4 20 4C14.07 4 8.83 7.215 6.306 11.691z"></path><path fill="#34A853" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-5.657-5.657C30.009 36.083 27.205 38 24 38c-4.418 0-8.28-2.825-9.624-6.691l-5.656 4.318C11.393 40.738 17.22 44 24 44z"></path><path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.16-4.08 5.571l5.657 5.657C41.138 35.218 44 30.023 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
          </svg>
          Continuar con Google
        </button>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-slate-300"></div>
          <span className="mx-4 text-sm text-slate-500">o</span>
          <div className="flex-grow border-t border-slate-300"></div>
        </div>

        {/* Formulario Email/Pass */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="relative">
              <User className={commonIconClass} size={18} />
              <input
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={commonInputClass}
                required
              />
            </div>
          )}
          <div className="relative">
            <Mail className={commonIconClass} size={18} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={commonInputClass}
              required
            />
          </div>
          <div className="relative">
            <Lock className={commonIconClass} size={18} />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={commonInputClass}
              required
            />
          </div>
          
          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {isRegistering ? 'Crear Cuenta' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}