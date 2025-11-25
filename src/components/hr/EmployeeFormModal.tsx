import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Employee } from '@/services/hrService';

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
  const [formData, setFormData] = useState({
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
    contract_type: employee?.contract_type || 'permanent' as const,
    status: employee?.status || 'active' as const,
    address: employee?.address || '',
    city: employee?.city || '',
    postal_code: employee?.postal_code || '',
    emergency_contact: employee?.emergency_contact || '',
    emergency_phone: employee?.emergency_phone || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'Prénom requis';
    if (!formData.last_name.trim()) newErrors.last_name = 'Nom requis';
    if (!formData.email.trim()) newErrors.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.position.trim()) newErrors.position = 'Poste requis';
    if (!formData.department.trim()) newErrors.department = 'Département requis';
    if (!formData.hire_date) newErrors.hire_date = 'Date d\'embauche requise';
    if (!formData.employee_number.trim()) newErrors.employee_number = 'Matricule requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        salary_currency: formData.salary_currency,
        contract_type: formData.contract_type as any,
        status: formData.status as any,
      });

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error submitting employee form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {employee ? 'Modifier l\'employé' : 'Nouvel Employé'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section Informations Personnelles */}
            <div className="col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informations Personnelles
              </h3>
            </div>

            <div>
              <Label htmlFor="employee_number">Matricule *</Label>
              <Input
                id="employee_number"
                value={formData.employee_number}
                onChange={e => setFormData({ ...formData, employee_number: e.target.value })}
                className={errors.employee_number ? 'border-red-500' : ''}
              />
              {errors.employee_number && (
                <p className="text-sm text-red-500 mt-1">{errors.employee_number}</p>
              )}
            </div>

            <div>
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && (
                <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                className={errors.last_name ? 'border-red-500' : ''}
              />
              {errors.last_name && (
                <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {/* Section Professionnelle */}
            <div className="col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informations Professionnelles
              </h3>
            </div>

            <div>
              <Label htmlFor="position">Poste *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={e => setFormData({ ...formData, position: e.target.value })}
                className={errors.position ? 'border-red-500' : ''}
              />
              {errors.position && (
                <p className="text-sm text-red-500 mt-1">{errors.position}</p>
              )}
            </div>

            <div>
              <Label htmlFor="department">Département *</Label>
              <Select
                value={formData.department}
                onValueChange={value => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
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
              {errors.department && (
                <p className="text-sm text-red-500 mt-1">{errors.department}</p>
              )}
            </div>

            <div>
              <Label htmlFor="hire_date">Date d'embauche *</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={e => setFormData({ ...formData, hire_date: e.target.value })}
                className={errors.hire_date ? 'border-red-500' : ''}
              />
              {errors.hire_date && (
                <p className="text-sm text-red-500 mt-1">{errors.hire_date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="salary">Salaire annuel brut</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                value={formData.salary}
                onChange={e => setFormData({ ...formData, salary: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="salary_currency">Devise du salaire</Label>
              <Select
                value={formData.salary_currency}
                onValueChange={value => setFormData({ ...formData, salary_currency: value })}
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
                value={formData.contract_type}
                onValueChange={value => setFormData({ ...formData, contract_type: value as any })}
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
                value={formData.status}
                onValueChange={value => setFormData({ ...formData, status: value as any })}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Adresse
              </h3>
            </div>

            <div className="col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="postal_code">Code postal</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
              />
            </div>

            {/* Section Contact d'urgence */}
            <div className="col-span-2 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact d'urgence
              </h3>
            </div>

            <div>
              <Label htmlFor="emergency_contact">Nom du contact</Label>
              <Input
                id="emergency_contact"
                value={formData.emergency_contact}
                onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="emergency_phone">Téléphone d'urgence</Label>
              <Input
                id="emergency_phone"
                type="tel"
                value={formData.emergency_phone}
                onChange={e => setFormData({ ...formData, emergency_phone: e.target.value })}
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
