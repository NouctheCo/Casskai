import React from 'react';
import { ReportsManagementTabs } from '../components/reports/ReportsManagementTabs';
import { useAuth } from '../contexts/AuthContext';

const ReportsPage: React.FC = () => {
  const { currentCompany } = useAuth();

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Veuillez sélectionner une entreprise</p>
      </div>
    );
  }

  return <ReportsManagementTabs companyId={currentCompany.id} />;
};

export default ReportsPage;
