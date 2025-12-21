/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hrService } from '@/services/hrService';

export interface NewManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (employeeId: string) => void;
}

interface EmployeeFormData {
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hire_date: string;
  contract_type: 'permanent' | 'temporary' | 'intern' | 'freelance';
}

const NewManagerModal: React.FC<NewManagerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<EmployeeFormData>({
    employee_number: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    hire_date: new Date().toISOString().split('T')[0],
    contract_type: 'permanent'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee_number.trim()) {
      newErrors.employee_number = t('projects.managerModal.errorEmployeeNumber', 'Le numéro d\'employé est requis');
    }
    if (!formData.first_name.trim()) {
      newErrors.first_name = t('projects.managerModal.errorFirstName', 'Le prénom est requis');
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = t('projects.managerModal.errorLastName', 'Le nom est requis');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('projects.managerModal.errorEmail', 'L\'email est requis');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('projects.managerModal.errorEmailInvalid', 'Email invalide');
    }
    if (!formData.position.trim()) {
      newErrors.position = t('projects.managerModal.errorPosition', 'Le poste est requis');
    }
    if (!formData.department.trim()) {
      newErrors.department = t('projects.managerModal.errorDepartment', 'Le département est requis');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm() || !currentCompany) {
      return;
    }

    setLoading(true);

    try {
      const response = await hrService.createEmployee(currentCompany.id, {
        employee_number: formData.employee_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        department: formData.department,
        hire_date: formData.hire_date,
        contract_type: formData.contract_type,
        status: 'active'
      });

      if (response.success && response.data) {
        onSuccess(response.data.id);
        setFormData({
          employee_number: '',
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          position: '',
          department: '',
          hire_date: new Date().toISOString().split('T')[0],
          contract_type: 'permanent'
        });
        onClose();
      } else {
        setError(response.error || t('projects.managerModal.errorCreating', 'Erreur lors de la création du responsable'));
      }
    } catch (err) {
      console.error('Error creating employee:', err);
      setError(t('projects.managerModal.errorCreating', 'Erreur lors de la création du responsable'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('projects.managerModal.title', 'Nouveau responsable')}</DialogTitle>
          <DialogDescription>
            {t('projects.managerModal.description', 'Créer un nouveau responsable pour le projet')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Numéro d'employé */}
          <div className="space-y-2">
            <Label htmlFor="employee_number">
              {t('projects.managerModal.employeeNumber', 'Numéro d\'employé')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="employee_number"
              value={formData.employee_number}
              onChange={(e) => handleInputChange('employee_number', e.target.value)}
              placeholder={t('projects.managerModal.employeeNumberPlaceholder', 'Ex: EMP001')}
              className={errors.employee_number ? 'border-red-500' : ''}
            />
            {errors.employee_number && (
              <p className="text-sm text-red-600">{errors.employee_number}</p>
            )}
          </div>

          {/* Prénom et Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                {t('projects.managerModal.firstName', 'Prénom')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder={t('projects.managerModal.firstNamePlaceholder', 'Jean')}
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && (
                <p className="text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">
                {t('projects.managerModal.lastName', 'Nom')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder={t('projects.managerModal.lastNamePlaceholder', 'Dupont')}
                className={errors.last_name ? 'border-red-500' : ''}
              />
              {errors.last_name && (
                <p className="text-sm text-red-600">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* Email et Téléphone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                {t('projects.managerModal.email', 'Email')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('projects.managerModal.emailPlaceholder', 'jean.dupont@example.com')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                {t('projects.managerModal.phone', 'Téléphone')}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder={t('projects.managerModal.phonePlaceholder', '01 23 45 67 89')}
              />
            </div>
          </div>

          {/* Poste et Département */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">
                {t('projects.managerModal.position', 'Poste')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                placeholder={t('projects.managerModal.positionPlaceholder', 'Chef de projet')}
                className={errors.position ? 'border-red-500' : ''}
              />
              {errors.position && (
                <p className="text-sm text-red-600">{errors.position}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">
                {t('projects.managerModal.department', 'Département')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder={t('projects.managerModal.departmentPlaceholder', 'IT')}
                className={errors.department ? 'border-red-500' : ''}
              />
              {errors.department && (
                <p className="text-sm text-red-600">{errors.department}</p>
              )}
            </div>
          </div>

          {/* Date d'embauche et Type de contrat */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hire_date">
                {t('projects.managerModal.hireDate', 'Date d\'embauche')}
              </Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => handleInputChange('hire_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract_type">
                {t('projects.managerModal.contractType', 'Type de contrat')}
              </Label>
              <Select value={formData.contract_type} onValueChange={(value) => handleInputChange('contract_type', value as EmployeeFormData['contract_type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">{t('projects.managerModal.permanent', 'CDI')}</SelectItem>
                  <SelectItem value="temporary">{t('projects.managerModal.temporary', 'CDD')}</SelectItem>
                  <SelectItem value="intern">{t('projects.managerModal.intern', 'Stage')}</SelectItem>
                  <SelectItem value="freelance">{t('projects.managerModal.freelance', 'Freelance')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('projects.managerModal.create', 'Créer le responsable')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewManagerModal;
