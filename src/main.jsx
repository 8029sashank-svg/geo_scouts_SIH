import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import { AlertQueueProvider } from './contexts/AlertQueueContext.jsx';
import { LiveLocationProvider } from './scout/contexts/livelocationcontext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AlertQueueProvider>
        <LiveLocationProvider>
          <App />
        </LiveLocationProvider>
      </AlertQueueProvider>
    </LanguageProvider>
  </React.StrictMode>
);