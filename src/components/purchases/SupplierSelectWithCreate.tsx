/**
 * Composant Select Fournisseur avec création via le formulaire tiers complet
 * Utilisé dans le formulaire d'achat
 */

import React, { useState } from 'react';
import { SelectWithCreate } from '../common/SelectWithCreate';
import { ThirdPartyFormDialog } from '../third-parties/ThirdPartyFormDialog';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '../ui/label';

interface SupplierSelectWithCreateProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
}

export const SupplierSelectWithCreate: React.FC<SupplierSelectWithCreateProps> = ({
  value,
  onChange,
  error,
  required = true,
  className = ''
}) => {
  const { currentCompany } = useAuth();
  const { suppliers, loading, refreshSuppliers } = useSuppliers();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleCreateSuccess = async () => {
    // Recharger la liste des fournisseurs après création
    await refreshSuppliers();
    // Note: on ne peut pas auto-sélectionner le nouveau fournisseur ici car
    // ThirdPartyFormDialog ne retourne pas l'ID créé. L'utilisateur le sélectionnera dans la liste.
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="supplier_id">
        Fournisseur {required && <span className="text-red-500">*</span>}
      </Label>
      <SelectWithCreate
        options={suppliers.map(s => ({
          value: s.id,
          label: s.name,
          sublabel: s.email || s.phone || undefined
        }))}
        value={value}
        onChange={onChange}
        placeholder="Sélectionnez un fournisseur"
        searchPlaceholder="Rechercher un fournisseur..."
        createLabel="Créer un nouveau fournisseur"
        onCreateClick={() => setShowCreateDialog(true)}
        isLoading={loading}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Formulaire de création de tiers complet */}
      {currentCompany?.id && (
        <ThirdPartyFormDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleCreateSuccess}
          companyId={currentCompany.id}
          defaultType="supplier"
        />
      )}
    </div>
  );
};
