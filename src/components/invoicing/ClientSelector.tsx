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

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  billing_city?: string;
  billing_postal_code?: string;
  billing_country?: string;
}

interface ClientSelectorProps {
  value: string;
  onChange: (clientId: string) => void;
  onNewClient?: (client: Customer) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  value,
  onChange,
  onNewClient,
  label = 'Client',
  placeholder = 'Sélectionner un client',
  required = true
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { currentCompany } = useAuth();

  // Form state for new customer
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    billing_address_line1: '',
    billing_city: '',
    billing_postal_code: '',
    billing_country: 'FR'
  });

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, [currentCompany?.id]);

  const fetchCustomers = async () => {
    if (!currentCompany?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, company_name, billing_city, billing_postal_code, billing_country')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        logger.error('ClientSelector', 'Error fetching customers:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la liste des clients',
          variant: 'destructive'
        });
        setCustomers([]);
        return;
      }

      setCustomers(data || []);
    } catch (error) {
      logger.error('ClientSelector', 'Unexpected error fetching customers:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite',
        variant: 'destructive'
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!currentCompany?.id) {
      toast({
        title: 'Erreur',
        description: 'Aucune entreprise sélectionnée',
        variant: 'destructive'
      });
      return;
    }

    if (!newCustomerForm.name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom du client est requis',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);

    try {
      // Generate customer number (simple implementation)
      const timestamp = Date.now().toString().slice(-6);
      const customerNumber = `CL${timestamp}`;

      const { data, error } = await supabase
        .from('customers')
        .insert({
          company_id: currentCompany.id,
          customer_number: customerNumber,
          name: newCustomerForm.name.trim(),
          email: newCustomerForm.email.trim() || null,
          phone: newCustomerForm.phone.trim() || null,
          company_name: newCustomerForm.company_name.trim() || null,
          billing_address_line1: newCustomerForm.billing_address_line1.trim() || null,
          billing_city: newCustomerForm.billing_city.trim() || null,
          billing_postal_code: newCustomerForm.billing_postal_code.trim() || null,
          billing_country: newCustomerForm.billing_country || 'FR',
          is_active: true
        })
        .select()
        .single();

      if (error) {
        logger.error('ClientSelector', 'Error creating customer:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de créer le client',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Succès',
        description: `Client "${data.name}" créé avec succès`
      });

      // Reset form
      setNewCustomerForm({
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
      setShowNewCustomerForm(false);

      // Reload customers
      await fetchCustomers();

      // Select the newly created customer
      onChange(data.id);

      // Notify parent
      if (onNewClient) {
        onNewClient(data);
      }
    } catch (error) {
      logger.error('ClientSelector', 'Unexpected error creating customer:', error);
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
          <Label htmlFor="client-selector">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowNewCustomerForm(true)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nouveau client
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Chargement des clients...</span>
          </div>
        ) : (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger id="client-selector">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {customers.length === 0 ? (
                <div className="p-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Aucun client disponible
                </div>
              ) : (
                customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.name}</span>
                      {customer.email && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{customer.email}</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Dialog pour créer un nouveau client */}
      <Dialog open={showNewCustomerForm} onOpenChange={setShowNewCustomerForm}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Nom (requis) */}
            <div className="grid gap-2">
              <Label htmlFor="customer-name">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customer-name"
                value={newCustomerForm.name}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                placeholder="Nom du client"
                required
              />
            </div>

            {/* Nom de l'entreprise */}
            <div className="grid gap-2">
              <Label htmlFor="customer-company-name">Nom de l'entreprise</Label>
              <Input
                id="customer-company-name"
                value={newCustomerForm.company_name}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, company_name: e.target.value })}
                placeholder="SARL Exemple"
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={newCustomerForm.email}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                placeholder="contact@example.com"
              />
            </div>

            {/* Téléphone */}
            <div className="grid gap-2">
              <Label htmlFor="customer-phone">Téléphone</Label>
              <Input
                id="customer-phone"
                type="tel"
                value={newCustomerForm.phone}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            {/* Adresse */}
            <div className="grid gap-2">
              <Label htmlFor="customer-address">Adresse</Label>
              <Input
                id="customer-address"
                value={newCustomerForm.billing_address_line1}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, billing_address_line1: e.target.value })}
                placeholder="123 rue de la République"
              />
            </div>

            {/* Ville et Code postal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customer-postal-code">Code postal</Label>
                <Input
                  id="customer-postal-code"
                  value={newCustomerForm.billing_postal_code}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, billing_postal_code: e.target.value })}
                  placeholder="75001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer-city">Ville</Label>
                <Input
                  id="customer-city"
                  value={newCustomerForm.billing_city}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, billing_city: e.target.value })}
                  placeholder="Paris"
                />
              </div>
            </div>

            {/* Pays */}
            <div className="grid gap-2">
              <Label htmlFor="customer-country">Pays</Label>
              <Input
                id="customer-country"
                value={newCustomerForm.billing_country}
                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, billing_country: e.target.value })}
                placeholder="FR"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNewCustomerForm(false);
                setNewCustomerForm({
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
              onClick={handleCreateCustomer}
              disabled={isCreating || !newCustomerForm.name.trim()}
            >
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Créer le client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClientSelector;
