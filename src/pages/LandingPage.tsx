import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <img src={require('../assets/Casskai_logo.png')} alt="CassKai Logo" className="w-24 h-24 mb-6" />
    <h1 className="text-3xl font-bold mb-2 text-center">Gestion Financière Simplifiée pour PME</h1>
    <p className="mb-8 text-gray-600 dark:text-gray-300 text-center max-w-md">La solution moderne pour piloter votre entreprise, de la comptabilité à la gestion quotidienne.</p>
    <div className="flex gap-4 mb-4">
      <Link to="/login" className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">Se connecter</Link>
      <Link to="/register" className="px-6 py-2 bg-white border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50 dark:bg-gray-900 dark:border-indigo-400 dark:text-indigo-300">Créer un compte</Link>
    </div>
    <Link to="/login" className="text-sm text-gray-500 hover:underline">Déjà un compte ? Se connecter</Link>
  </div>
);

export default LandingPage;
