import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './i18n/i18n';
import App from './App';
import './index.css';

import { ConfigProvider } from '@/contexts/ConfigContext';

// Créer un routeur qui contient uniquement l'App
// App lui-même définit les routes à l'intérieur
const router = createBrowserRouter([
  {
    path: "*",
    element: <App />
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider>
      <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>
);