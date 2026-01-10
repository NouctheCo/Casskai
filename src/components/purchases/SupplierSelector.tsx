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

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  billing_city?: string;
  billing_postal_code?: string;
  billing_country?: string;
}

interface SupplierSelectorProps {
  value: string;
  onChange: (supplierId: string) => void;
  onNewSupplier?: (supplier: Supplier) => void;
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { currentCompany } = useAuth();

  // Form state for new supplier
  const [newSupplierForm, setNewSupplierForm] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    billing_address_line1: '',
    billing_city: '',
    billing_postal_code: '',
    billing_country: 'FR'
  });

  // Fetch suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, [currentCompany?.id]);

  const fetchSuppliers = async () => {
    if (!currentCompany?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, email, phone, company_name, billing_city, billing_postal_code, billing_country')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error('SupplierSelector', 'Error fetching suppliers:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la liste des fournisseurs',
          variant: 'destructive'
        });
        setSuppliers([]);
        return;
      }

      setSuppliers(data || []);
    } catch (error) {
      logger.error('SupplierSelector', 'Unexpected error fetching suppliers:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive'
      });
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    if (!currentCompany?.id) {
      toast({
        title: 'Erreur',
        description: 'Aucune entreprise sélectionnée',
        variant: 'destructive'
      });
      return;
    }

    if (!newSupplierForm.name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du fournisseur est requis',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);

    try {
      // Generate supplier number (simple implementation)
      const timestamp = Date.now().toString().slice(-6);
      const supplierNumber = `FO${timestamp}`;

      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          company_id: currentCompany.id,
          supplier_number: supplierNumber,
          name: newSupplierForm.name.trim(),
          email: newSupplierForm.email.trim() || null,
          phone: newSupplierForm.phone.trim() || null,
          company_name: newSupplierForm.company_name.trim() || null,
          billing_address_line1: newSupplierForm.billing_address_line1.trim() || null,
          billing_city: newSupplierForm.billing_city.trim() || null,
          billing_postal_code: newSupplierForm.billing_postal_code.trim() || null,
          billing_country: newSupplierForm.billing_country || 'FR',
          is_active: true
        })
        .select()
        .single();

      if (error) {
        logger.error('SupplierSelector', 'Error creating supplier:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de créer le fournisseur',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Succès',
        description: `Fournisseur "${data.name}" créé avec succès`
      });

      // Reset form
      setNewSupplierForm({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        billing_address_line1: '',
        billing_city: '',
        billing_postal_code: '',
        billing_country: 'FR'
      });

      // Close dialog
      setShowNewSupplierForm(false);

      // Reload suppliers
      await fetchSuppliers();

      // Select the newly created supplier
      onChange(data.id);

      // Notify parent
      if (onNewSupplier) {
        onNewSupplier(data);
      }
    } catch (error) {
      logger.error('SupplierSelector', 'Unexpected error creating supplier:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
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
                  <SelectItem key={supplier.id} value={supplier.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{supplier.name}</span>
                      {supplier.email && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{supplier.email}</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Dialog pour créer un nouveau fournisseur */}
      <Dialog open={showNewSupplierForm} onOpenChange={setShowNewSupplierForm}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau fournisseur</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Nom (requis) */}
            <div className="grid gap-2">
              <Label htmlFor="supplier-name">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="supplier-name"
                value={newSupplierForm.name}
                onChange={(e) => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
                placeholder="Nom du fournisseur"
                required
              />
            </div>

            {/* Nom de l'entreprise */}
            <div className="grid gap-2">
              <Label htmlFor="supplier-company-name">Nom de l'entreprise</Label>
              <Input
                id="supplier-company-name"
                value={newSupplierForm.company_name}
                onChange={(e) => setNewSupplierForm({ ...newSupplierForm, company_name: e.target.value })}
                placeholder="SARL Exemple"
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                value={newSupplierForm.email}
                onChange={(e) => setNewSupplierForm({ ...newSupplierForm, email: e.target.value })}
                placeholder="contact@example.com"
              />
            </div>

            {/* Téléphone */}
            <div className="grid gap-2">
              <Label htmlFor="supplier-phone">Téléphone</Label>
              <Input
                id="supplier-phone"
                type="tel"
                value={newSupplierForm.phone}
                onChange={(e) => setNewSupplierForm({ ...newSupplierForm, phone: e.target.value })}
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            {/* Adresse */}
            <div className="grid gap-2">
              <Label htmlFor="supplier-address">Adresse</Label>
              <Input
                id="supplier-address"
                value={newSupplierForm.billing_address_line1}
                onChange={(e) => setNewSupplierForm({ ...newSupplierForm, billing_address_line1: e.target.value })}
                placeholder="123 rue de la République"
              />
            </div>

            {/* Ville et Code postal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="supplier-postal-code">Code postal</Label>
                <Input
                  id="supplier-postal-code"
                  value={newSupplierForm.billing_postal_code}
                  onChange={(e) => setNewSupplierForm({ ...newSupplierForm, billing_postal_code: e.target.value })}
                  placeholder="75001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier-city">Ville</Label>
                <Input
                  id="supplier-city"
                  value={newSupplierForm.billing_city}
                  onChange={(e) => setNewSupplierForm({ ...newSupplierForm, billing_city: e.target.value })}
                  placeholder="Paris"
                />
              </div>
            </div>

            {/* Pays */}
            <div className="grid gap-2">
              <Label htmlFor="supplier-country">Pays</Label>
              <Input
                id="supplier-country"
                value={newSupplierForm.billing_country}
                onChange={(e) => setNewSupplierForm({ ...newSupplierForm, billing_country: e.target.value })}
                placeholder="FR"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewSupplierForm(false);
                setNewSupplierForm({
                  name: '',
                  email: '',
                  phone: '',
                  company_name: '',
                  billing_address_line1: '',
                  billing_city: '',
                  billing_postal_code: '',
                  billing_country: 'FR'
                });
              }}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleCreateSupplier}
              disabled={isCreating || !newSupplierForm.name.trim()}
            >
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Créer le fournisseur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SupplierSelector;
