import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './App.css' 
import './index.css' 

// Renderöidään sovellus
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// --- LISÄTTY: SERVICE WORKER REKISTERÖINTI ---
// Tämä aktivoi PWA-ominaisuudet ja sallii asennuksen
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker rekisteröity:', registration.scope);
      })
      .catch((err) => {
        console.log('Service Workerin rekisteröinti epäonnistui:', err);
      });
  });
}