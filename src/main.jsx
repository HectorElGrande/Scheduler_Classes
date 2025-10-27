import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Optional: expose globals for the app to read (mock values for local dev)
// In your deployment environment, these may be injected differently.
window.__app_id = window.__app_id || 'default-app-id';
window.__firebase_config = window.__firebase_config || JSON.stringify({});
window.__initial_auth_token = window.__initial_auth_token || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
