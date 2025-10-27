# Calendario de Clases (React + Vite + Tailwind)

Proyecto empaquetado a partir de tu código. Incluye:

- React 18 + Vite
- TailwindCSS
- lucide-react para iconos
- Firebase (Auth + Firestore)

## Arranque

```bash
npm install
npm run dev
```

## Configuración de Firebase

Tu código espera que el entorno inyecte tres variables globales:

- `__app_id`
- `__firebase_config` (JSON string de la config de Firebase)
- `__initial_auth_token` (opcional)

Para desarrollo local puedes definirlas en `index.html` antes de `main.jsx` o en `src/main.jsx` ya se incluyen **mock values** que puedes sobreescribir, por ejemplo en la consola del navegador:

```js
window.__firebase_config = JSON.stringify({
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  appId: "..."
});
```

> La app lee primero las variables globales (no seguras para producción). En tu despliegue real deberías inyectarlas de forma segura.
