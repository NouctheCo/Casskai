// @ts-nocheck
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DiagnosticPage = () => {
  const navigate = useNavigate();
  const { 
    user, 
    loading, 
    currentEnterpriseId, 
    currentEnterpriseName, 
    userCompanies 
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
          <p>Nombre d'entreprises: {userCompanies?.length || 0}</p>
          <p>Entreprise actuelle: {currentEnterpriseName || 'Aucune'}</p>
          <p>ID entreprise: {currentEnterpriseId || 'Aucun'}</p>
          
          {userCompanies && userCompanies.length > 0 && (
            <div className="mt-2">
              <h3 className="font-medium">Liste des entreprises:</h3>
              {userCompanies.map((uc, index) => (
                <div key={index} className="ml-4">
                  • {uc.companies?.name} ({uc.companies?.country}) 
                  {uc.is_default && ' - Par défaut'}
                </div>
              ))}
            </div>
          )}
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
