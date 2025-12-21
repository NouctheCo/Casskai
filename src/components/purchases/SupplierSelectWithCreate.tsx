/**
 * Composant Select Fournisseur avec création à la volée
 * Utilisé dans le formulaire d'achat
 */

import React from 'react';
import { SelectWithCreate } from '../common/SelectWithCreate';
import { useSuppliers } from '@/hooks/useSuppliers';
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
  const { suppliers, loading, createSupplier } = useSuppliers();

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
        onCreate={createSupplier}
        isLoading={loading}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};
