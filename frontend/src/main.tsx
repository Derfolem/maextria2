import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import { initGA } from './lib/analytics';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found.');
}

// Inicializar Google Analytics em produção
if (import.meta.env.PROD && import.meta.env.VITE_GA_MEASUREMENT_ID) {
  initGA();
}

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" />
    </BrowserRouter>
  </React.StrictMode>
);

ReactDOM.createRoot(rootElement).render(app);
