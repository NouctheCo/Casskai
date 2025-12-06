import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { unifiedThirdPartiesService, type UnifiedThirdParty } from '@/services/unifiedThirdPartiesService';
import { ThirdPartyFormDialog } from '@/components/third-parties/ThirdPartyFormDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface SupplierSelectorProps {
  value: string;
  onChange: (supplierId: string) => void;
  onNewSupplier?: (supplier: UnifiedThirdParty) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  value,
  onChange,
  onNewSupplier,
  label = 'Fournisseur',
  placeholder = 'Sélectionner un fournisseur',
  required = true
}) => {
  const { currentCompany } = useAuth();
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<UnifiedThirdParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);

  // Fetch suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const suppliersData = await unifiedThirdPartiesService.getUnifiedThirdParties(undefined, 'supplier');
        setSuppliers(suppliersData || []);
        // ✅ Liste vide = comportement normal (pas d'erreur affichée)
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        // ⚠️ Afficher l'erreur uniquement pour les vraies erreurs réseau/serveur
        showToast(
          'Impossible de charger la liste des fournisseurs. Vérifiez votre connexion.',
          'error'
        );
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [showToast]);

  const handleSupplierCreated = async () => {
    if (!currentCompany) return;

    try {
      // Recharger la liste des fournisseurs
      const updatedSuppliers = await unifiedThirdPartiesService.getUnifiedThirdParties(currentCompany.id, 'supplier');
      setSuppliers(updatedSuppliers || []);

      // Update parent if callback provided
      if (onNewSupplier && updatedSuppliers.length > suppliers.length) {
        const newSupplier = updatedSuppliers[updatedSuppliers.length - 1];
        onNewSupplier(newSupplier);
        // Auto-select the new supplier
        onChange(newSupplier.id!);
      }

      // Fermer le dialog
      setShowNewSupplierForm(false);

      showToast(
        "Le fournisseur a été ajouté avec succès et est maintenant disponible dans la liste",
        'success'
      );
    } catch (error) {
      console.error('Error refreshing suppliers:', error);
      showToast('Erreur lors du rechargement des fournisseurs', 'error');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="supplier-selector">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowNewSupplierForm(true)}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nouveau fournisseur
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Chargement des fournisseurs...</span>
        </div>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="supplier-selector">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {suppliers.length === 0 ? (
              <div className="p-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                Aucun fournisseur disponible
              </div>
            ) : (
              suppliers.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id!}>
                  <div className="flex flex-col">
                    <span className="font-medium">{supplier.name}</span>
                    {supplier.email && <span className="text-xs text-gray-500 dark:text-gray-400">{supplier.email}</span>}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      {/* Modal de création de tiers (fournisseur) unifié */}
      {currentCompany && (
        <ThirdPartyFormDialog
          open={showNewSupplierForm}
          onClose={() => setShowNewSupplierForm(false)}
          onSuccess={handleSupplierCreated}
          companyId={currentCompany.id}
          defaultType="supplier"
        />
      )}
    </div>
  );
};

export default SupplierSelector;
