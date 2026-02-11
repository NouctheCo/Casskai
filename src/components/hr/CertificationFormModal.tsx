/**
 * Modal de création/édition de certification
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Certification } from '@/types/hr-training.types';

interface CertificationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<boolean>;
  certification?: Certification | null;
  employees: Array<{ id: string; first_name: string; last_name: string }>;
}

export function CertificationFormModal({
  isOpen,
  onClose,
  onSubmit,
  certification,
  employees
}: CertificationFormModalProps) {
  const [formData, setFormData] = useState({
    employee_id: '',
    certification_name: '',
    issuing_organization: '',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    credential_id: '',
    credential_url: '',
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (certification) {
      setFormData({
        employee_id: certification.employee_id,
        certification_name: certification.certification_name,
        issuing_organization: certification.issuing_organization || '',
        issue_date: certification.issue_date?.split('T')[0] || '',
        expiry_date: certification.expiry_date?.split('T')[0] || '',
        credential_id: certification.credential_id || '',
        credential_url: certification.credential_url || '',
        is_active: certification.is_active ?? true
      });
    }
  }, [certification]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee_id) newErrors.employee_id = 'Employé requis';
    if (!formData.certification_name.trim()) newErrors.certification_name = 'Nom de certification requis';
    if (!formData.issue_date) newErrors.issue_date = 'Date d\'obtention requise';
    if (formData.credential_url && !formData.credential_url.match(/^https?:\/\/.+/)) {
      newErrors.credential_url = 'URL invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const submitData = {
        employee_id: formData.employee_id,
        certification_name: formData.certification_name.trim(),
        issuing_organization: formData.issuing_organization.trim() || null,
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date || null,
        credential_id: formData.credential_id.trim() || null,
        credential_url: formData.credential_url.trim() || null,
        is_active: formData.is_active
      };

      const success = await onSubmit(submitData);
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100">
            {certification ? 'Modifier la certification' : 'Nouvelle certification'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Employé */}
          <div>
            <Label htmlFor="employee_id">Employé *</Label>
            <Select
              value={formData.employee_id}
              onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
            >
              <SelectTrigger id="employee_id" className={errors.employee_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employee_id && (
              <p className="text-red-500 text-sm mt-1">{errors.employee_id}</p>
            )}
          </div>

          {/* Nom de certification */}
          <div>
            <Label htmlFor="certification_name">Nom de la certification *</Label>
            <Input
              id="certification_name"
              value={formData.certification_name}
              onChange={(e) => setFormData({ ...formData, certification_name: e.target.value })}
              placeholder="Ex: AWS Solutions Architect"
              className={errors.certification_name ? 'border-red-500' : ''}
            />
            {errors.certification_name && (
              <p className="text-red-500 text-sm mt-1">{errors.certification_name}</p>
            )}
          </div>

          {/* Organisation émettrice */}
          <div>
            <Label htmlFor="issuing_organization">Organisation émettrice</Label>
            <Input
              id="issuing_organization"
              value={formData.issuing_organization}
              onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
              placeholder="Ex: Amazon Web Services"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issue_date">Date d'obtention *</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className={errors.issue_date ? 'border-red-500' : ''}
              />
              {errors.issue_date && (
                <p className="text-red-500 text-sm mt-1">{errors.issue_date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="expiry_date">Date d'expiration</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-300 mt-1">
                Laisser vide si pas d'expiration
              </p>
            </div>
          </div>

          {/* Credential ID */}
          <div>
            <Label htmlFor="credential_id">ID de certification</Label>
            <Input
              id="credential_id"
              value={formData.credential_id}
              onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
              placeholder="Ex: AWS-123456789"
            />
          </div>

          {/* URLs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="credential_url">URL du certificat</Label>
              <Input
                id="credential_url"
                type="url"
                value={formData.credential_url}
                onChange={(e) => setFormData({ ...formData, credential_url: e.target.value })}
                placeholder="https://..."
                className={errors.credential_url ? 'border-red-500' : ''}
              />
              {errors.credential_url && (
                <p className="text-red-500 text-sm mt-1">{errors.credential_url}</p>
              )}
            </div>

          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked as boolean })
                }
              />
              <Label htmlFor="is_active" className="cursor-pointer font-normal">
                Certification active
              </Label>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement...' : certification ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
