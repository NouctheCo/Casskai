/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DiagnosticPage = () => {
  const navigate = useNavigate();
  const {
    user,
    loading
  } = useAuth();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Diagnostic Auth</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">État d'authentification</h2>
          <p>Loading: {loading ? 'Oui' : 'Non'}</p>
          <p>User: {user ? `✅ ${user.email} (${user.id})` : '❌ Non connecté'}</p>
        </div>
        
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-semibold">Entreprises</h2>
          <p>Info: Enterprise context should be checked separately</p>
        </div>
        
        <div className="bg-green-100 p-4 rounded">
          <h2 className="font-semibold">Actions</h2>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Aller au Dashboard
          </button>
          <button 
            onClick={() => navigate('/onboarding')} 
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Aller à l'Onboarding
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;
