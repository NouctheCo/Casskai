import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Employee } from '@/services/hrService';
import { employeeFormSchema } from '@/lib/validation-schemas';
import { z } from 'zod';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    mode: 'onChange',
    defaultValues: {
      employee_number: employee?.employee_number || '',
      first_name: employee?.first_name || '',
      last_name: employee?.last_name || '',
      email: employee?.email || '',
      phone: employee?.phone || '',
      position: employee?.position || '',
      department: employee?.department || '',
      hire_date: employee?.hire_date || new Date().toISOString().split('T')[0],
      salary: employee?.salary?.toString() || '',
      salary_currency: employee?.salary_currency || 'EUR',
      contract_type: employee?.contract_type || 'permanent',
      status: employee?.status || 'active',
      address: employee?.address || '',
      city: employee?.city || '',
      postal_code: employee?.postal_code || '',
      emergency_contact: employee?.emergency_contact || '',
      emergency_phone: employee?.emergency_phone || '',
    },
  });

  // Reset form when employee changes
  useEffect(() => {
    if (employee) {
      form.reset({
        employee_number: employee.employee_number || '',
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
        salary: employee.salary?.toString() || '',
        salary_currency: employee.salary_currency || 'EUR',
        contract_type: employee.contract_type || 'permanent',
        status: employee.status || 'active',
        address: employee.address || '',
        city: employee.city || '',
        postal_code: employee.postal_code || '',
        emergency_contact: employee.emergency_contact || '',
        emergency_phone: employee.emergency_phone || '',
      });
    }
  }, [employee, form]);

  const handleFormSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        employee_number: data.employee_number,
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
        emergency_contact: data.emergency_contact,
        emergency_phone: data.emergency_phone,
      });

      if (success) {
        form.reset();
        onClose();
      }
    } catch (error) {
      console.error('Error submitting employee form:', error);
    } finally {
      setIsSubmitting(false);
    }
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {employee ? 'Modifier l\'employé' : 'Nouvel Employé'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors dark:text-gray-300"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section Informations Personnelles */}
            <div className="col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Informations Personnelles
              </h3>
            </div>

            <div>
              <Label htmlFor="employee_number">Matricule *</Label>
              <Input
                id="employee_number"
                {...form.register('employee_number')}
                className={form.formState.errors.employee_number ? 'border-red-500' : ''}
              />
              {form.formState.errors.employee_number && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.employee_number.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                {...form.register('first_name')}
                className={form.formState.errors.first_name ? 'border-red-500' : ''}
              />
              {form.formState.errors.first_name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.first_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                {...form.register('last_name')}
                className={form.formState.errors.last_name ? 'border-red-500' : ''}
              />
              {form.formState.errors.last_name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.last_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                className={form.formState.errors.email ? 'border-red-500' : ''}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
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
            <div className="col-span-2 mt-4">
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
              />
              {form.formState.errors.position && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.position.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="department">Département *</Label>
              <Select
                value={form.watch('department')}
                onValueChange={value => form.setValue('department', value, { shouldValidate: true })}
              >
                <SelectTrigger className={form.formState.errors.department ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionner un département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direction">Direction</SelectItem>
                  <SelectItem value="Ressources Humaines">Ressources Humaines</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Logistique">Logistique</SelectItem>
                  <SelectItem value="Service Client">Service Client</SelectItem>
                </SelectContent>
              </Select>
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
              <Select
                value={form.watch('salary_currency')}
                onValueChange={value => form.setValue('salary_currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                  <SelectItem value="USD">USD ($) - Dollar US</SelectItem>
                  <SelectItem value="GBP">GBP (£) - Livre Sterling</SelectItem>
                  <SelectItem value="CHF">CHF (Fr) - Franc Suisse</SelectItem>
                  <SelectItem value="XOF">XOF (CFA) - Franc CFA BCEAO</SelectItem>
                  <SelectItem value="XAF">XAF (FCFA) - Franc CFA BEAC</SelectItem>
                  <SelectItem value="MAD">MAD (د.م.) - Dirham Marocain</SelectItem>
                  <SelectItem value="TND">TND (د.ت) - Dinar Tunisien</SelectItem>
                  <SelectItem value="DZD">DZD (د.ج) - Dinar Algérien</SelectItem>
                  <SelectItem value="EGP">EGP (£) - Livre Égyptienne</SelectItem>
                  <SelectItem value="ZAR">ZAR (R) - Rand Sud-Africain</SelectItem>
                  <SelectItem value="NGN">NGN (₦) - Naira Nigérian</SelectItem>
                  <SelectItem value="KES">KES (KSh) - Shilling Kenyan</SelectItem>
                  <SelectItem value="GHS">GHS (₵) - Cedi Ghanéen</SelectItem>
                  <SelectItem value="MUR">MUR (₨) - Roupie Mauricienne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="contract_type">Type de contrat</Label>
              <Select
                value={form.watch('contract_type')}
                onValueChange={value => form.setValue('contract_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">CDI</SelectItem>
                  <SelectItem value="temporary">CDD</SelectItem>
                  <SelectItem value="intern">Stage</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                value={form.watch('status')}
                onValueChange={value => form.setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="on_leave">En congé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Section Adresse */}
            <div className="col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Adresse
              </h3>
            </div>

            <div className="col-span-2">
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
            <div className="col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Contact d'urgence
              </h3>
            </div>

            <div>
              <Label htmlFor="emergency_contact">Nom du contact</Label>
              <Input
                id="emergency_contact"
                {...form.register('emergency_contact')}
              />
            </div>

            <div>
              <Label htmlFor="emergency_phone">Téléphone d'urgence</Label>
              <Input
                id="emergency_phone"
                type="tel"
                {...form.register('emergency_phone')}
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
