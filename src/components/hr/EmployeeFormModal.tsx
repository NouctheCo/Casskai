import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Employee } from '@/services/hrService';
import { employeeFormSchema } from '@/lib/validation-schemas';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getCurrentCompanyCurrency } from '@/lib/utils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import SmartAutocomplete, { type AutocompleteOption } from '@/components/ui/SmartAutocomplete';
type EmployeeFormData = z.infer<typeof employeeFormSchema>;
interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Employee, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'full_name'>) => Promise<boolean>;
  employee?: Employee | null;
}
export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employee
}) => {
  useBodyScrollLock(isOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    mode: 'onChange',
    defaultValues: {
      first_name: employee?.first_name || '',
      last_name: employee?.last_name || '',
      email: employee?.email || '',
      phone: employee?.phone || '',
      position: employee?.position || '',
      department: employee?.department || '',
      hire_date: employee?.hire_date || new Date().toISOString().split('T')[0],
      salary: employee?.salary?.toString() || '',
      salary_currency: employee?.salary_currency || getCurrentCompanyCurrency(),
      contract_type: employee?.contract_type || 'cdi',
      status: employee?.status || 'active',
      address: employee?.address || '',
      city: employee?.city || '',
      postal_code: employee?.postal_code || '',
      emergency_contact_name: employee?.emergency_contact_name || '',
      emergency_contact_phone: employee?.emergency_contact_phone || '',
    },
  });
  // Reset form when employee changes
  useEffect(() => {
    if (employee) {
      form.reset({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
        salary: employee.salary?.toString() || '',
        salary_currency: employee.salary_currency || getCurrentCompanyCurrency(),
        contract_type: employee.contract_type || 'cdi',
        status: employee.status || 'active',
        address: employee.address || '',
        city: employee.city || '',
        postal_code: employee.postal_code || '',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
      });
    }
  }, [employee, form]);

  // Options autocomplete pour départements
  const departmentOptions: AutocompleteOption[] = useMemo(() => [
    { value: 'Direction', label: 'Direction', category: 'Départements' },
    { value: 'Ressources Humaines', label: 'Ressources Humaines', category: 'Départements' },
    { value: 'Finance', label: 'Finance', category: 'Départements' },
    { value: 'Commercial', label: 'Commercial', category: 'Départements' },
    { value: 'Marketing', label: 'Marketing', category: 'Départements' },
    { value: 'IT', label: 'IT', category: 'Départements' },
    { value: 'Production', label: 'Production', category: 'Départements' },
    { value: 'Logistique', label: 'Logistique', category: 'Départements' },
    { value: 'Service Client', label: 'Service Client', category: 'Départements' },
  ], []);

  // Options autocomplete pour devises (Afrique prioritaire)
  const currencyOptions: AutocompleteOption[] = useMemo(() => [
    { value: 'EUR', label: 'EUR (€) - Euro', category: 'Europe' },
    { value: 'XOF', label: 'XOF (FCFA) - Franc CFA BCEAO', category: 'Afrique de l\'Ouest' },
    { value: 'XAF', label: 'XAF (FCFA) - Franc CFA BEAC', category: 'Afrique Centrale' },
    { value: 'USD', label: 'USD ($) - Dollar US', category: 'Amérique' },
    { value: 'GBP', label: 'GBP (£) - Livre Sterling', category: 'Europe' },
    { value: 'CHF', label: 'CHF (Fr) - Franc Suisse', category: 'Europe' },
    { value: 'MAD', label: 'MAD (د.م.) - Dirham Marocain', category: 'Afrique du Nord' },
    { value: 'TND', label: 'TND (د.ت) - Dinar Tunisien', category: 'Afrique du Nord' },
    { value: 'DZD', label: 'DZD (د.ج) - Dinar Algérien', category: 'Afrique du Nord' },
    { value: 'EGP', label: 'EGP (£) - Livre Égyptienne', category: 'Afrique du Nord' },
    { value: 'ZAR', label: 'ZAR (R) - Rand Sud-Africain', category: 'Afrique Australe' },
    { value: 'KES', label: 'KES (KSh) - Shilling Kenyan', category: 'Afrique de l\'Est' },
    { value: 'GHS', label: 'GHS (₵) - Cedi Ghanéen', category: 'Afrique de l\'Ouest' },
    { value: 'MUR', label: 'MUR (₨) - Roupie Mauricienne', category: 'Océan Indien' },
  ], []);

  // Options autocomplete pour types de contrat
  const contractTypeOptions: AutocompleteOption[] = useMemo(() => [
    { value: 'cdi', label: 'CDI', description: 'Contrat à Durée Indéterminée', category: 'Contrats' },
    { value: 'cdd', label: 'CDD', description: 'Contrat à Durée Déterminée', category: 'Contrats' },
    { value: 'interim', label: 'Intérim', description: 'Contrat Intérimaire', category: 'Contrats' },
    { value: 'stage', label: 'Stage', description: 'Convention de stage', category: 'Autres' },
    { value: 'apprentissage', label: 'Apprentissage', description: 'Contrat d\'apprentissage', category: 'Autres' },
    { value: 'freelance', label: 'Freelance', description: 'Prestataire indépendant', category: 'Autres' },
  ], []);

  // Options autocomplete pour statuts
  const statusOptions: AutocompleteOption[] = useMemo(() => [
    { value: 'active', label: 'Actif', description: 'Employé en activité', category: 'Statuts' },
    { value: 'inactive', label: 'Inactif', description: 'Employé non actif', category: 'Statuts' },
    { value: 'on_leave', label: 'En congé', description: 'Employé en congé', category: 'Statuts' },
  ], []);
  const handleFormSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || '',
        phone: data.phone,
        position: data.position,
        department: data.department,
        hire_date: data.hire_date,
        salary: data.salary ? parseFloat(data.salary) : undefined,
        salary_currency: data.salary_currency,
        contract_type: data.contract_type,
        status: data.status,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
      });
      if (success) {
        form.reset();
        onClose();
      }
    } catch (error) {
      logger.error('EmployeeFormModal', 'Error submitting employee form:', error);
    } finally {
      setIsSubmitting(false);
    }
  });
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl my-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between rounded-t-lg shrink-0">
          <h2 id="employee-modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {employee ? 'Modifier l\'employé' : 'Nouvel Employé'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-300"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Section Informations Personnelles */}
            <div className="col-span-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Informations Personnelles
              </h3>
            </div>
            <div>
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                {...form.register('first_name')}
                className={form.formState.errors.first_name ? 'border-red-500' : ''}
                aria-required="true"
                aria-invalid={!!form.formState.errors.first_name}
                aria-describedby={form.formState.errors.first_name ? 'first_name-error' : undefined}
              />
              {form.formState.errors.first_name && (
                <p id="first_name-error" className="text-sm text-red-500 mt-1" role="alert">{form.formState.errors.first_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                {...form.register('last_name')}
                className={form.formState.errors.last_name ? 'border-red-500' : ''}
                aria-required="true"
                aria-invalid={!!form.formState.errors.last_name}
                aria-describedby={form.formState.errors.last_name ? 'last_name-error' : undefined}
              />
              {form.formState.errors.last_name && (
                <p id="last_name-error" className="text-sm text-red-500 mt-1" role="alert">{form.formState.errors.last_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                className={form.formState.errors.email ? 'border-red-500' : ''}
                aria-required="true"
                aria-invalid={!!form.formState.errors.email}
                aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
              />
              {form.formState.errors.email && (
                <p id="email-error" className="text-sm text-red-500 mt-1" role="alert">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register('phone')}
              />
            </div>
            {/* Section Professionnelle */}
            <div className="col-span-full mt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Informations Professionnelles
              </h3>
            </div>
            <div>
              <Label htmlFor="position">Poste *</Label>
              <Input
                id="position"
                {...form.register('position')}
                className={form.formState.errors.position ? 'border-red-500' : ''}
                aria-required="true"
                aria-invalid={!!form.formState.errors.position}
                aria-describedby={form.formState.errors.position ? 'position-error' : undefined}
              />
              {form.formState.errors.position && (
                <p id="position-error" className="text-sm text-red-500 mt-1" role="alert">{form.formState.errors.position.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="department">Département *</Label>
              <SmartAutocomplete
                value={form.watch('department')}
                onChange={value => form.setValue('department', value, { shouldValidate: true })}
                options={departmentOptions}
                placeholder="Sélectionner un département"
                searchPlaceholder="Rechercher (Direction, Finance, IT)..."
                groups={true}
                showRecent={true}
                maxRecent={3}
                className={form.formState.errors.department ? 'border-red-500' : ''}
              />
              {form.formState.errors.department && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.department.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="hire_date">Date d'embauche *</Label>
              <Input
                id="hire_date"
                type="date"
                {...form.register('hire_date')}
                className={form.formState.errors.hire_date ? 'border-red-500' : ''}
              />
              {form.formState.errors.hire_date && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.hire_date.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="salary">Salaire annuel brut</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                {...form.register('salary')}
              />
            </div>
            <div>
              <Label htmlFor="salary_currency">Devise du salaire</Label>
              <SmartAutocomplete
                value={form.watch('salary_currency')}
                onChange={value => form.setValue('salary_currency', value)}
                options={currencyOptions}
                placeholder="Sélectionner une devise..."
                searchPlaceholder="Rechercher (EUR, FCFA, USD)..."
                groups={true}
                showRecent={true}
                maxRecent={3}
              />
            </div>
            <div>
              <Label htmlFor="contract_type">Type de contrat</Label>
              <SmartAutocomplete
                value={form.watch('contract_type')}
                onChange={value => form.setValue('contract_type', value as any)}
                options={contractTypeOptions}
                placeholder="Sélectionner un type de contrat..."
                searchPlaceholder="Rechercher (CDI, CDD, Stage)..."
                groups={true}
                showRecent={false}
              />
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <SmartAutocomplete
                value={form.watch('status')}
                onChange={value => form.setValue('status', value as any)}
                options={statusOptions}
                placeholder="Sélectionner un statut..."
                searchPlaceholder="Rechercher (Actif, Inactif)..."
                groups={false}
                showRecent={false}
              />
            </div>
            {/* Section Adresse */}
            <div className="col-span-full mt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Adresse
              </h3>
            </div>
            <div className="col-span-full">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                {...form.register('address')}
              />
            </div>
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                {...form.register('city')}
              />
            </div>
            <div>
              <Label htmlFor="postal_code">Code postal</Label>
              <Input
                id="postal_code"
                {...form.register('postal_code')}
              />
            </div>
            {/* Section Contact d'urgence */}
            <div className="col-span-full mt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Contact d'urgence
              </h3>
            </div>
            <div>
              <Label htmlFor="emergency_contact_name">Nom du contact</Label>
              <Input
                id="emergency_contact_name"
                {...form.register('emergency_contact_name')}
              />
            </div>
            <div>
              <Label htmlFor="emergency_contact_phone">Téléphone d'urgence</Label>
              <Input
                id="emergency_contact_phone"
                type="tel"
                {...form.register('emergency_contact_phone')}
              />
            </div>
          </div>
          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSubmitting ? 'Enregistrement...' : employee ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};