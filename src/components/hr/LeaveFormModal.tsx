import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Leave, Employee } from '@/services/hrService';
import { logger } from '@/lib/logger';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
interface LeaveFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Leave, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'employee_name'>) => Promise<boolean>;
  employees: Employee[];
  leave?: Leave | null;
}
export const LeaveFormModal: React.FC<LeaveFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employees,
  leave
}) => {
  useBodyScrollLock(isOpen);
  const [formData, setFormData] = useState({
    employee_id: leave?.employee_id || '',
    leave_type: (leave as any)?.leave_type || 'paid_vacation' as const,
    start_date: leave?.start_date || '',
    end_date: leave?.end_date || '',
    reason: leave?.reason || '',
  });
  const [daysCount, setDaysCount] = useState(leave?.days_count || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Calculer le nombre de jours automatiquement
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le dernier jour
      setDaysCount(diffDays);
    }
  }, [formData.start_date, formData.end_date]);
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.employee_id) newErrors.employee_id = 'Employé requis';
    if (!formData.start_date) newErrors.start_date = 'Date de début requise';
    if (!formData.end_date) newErrors.end_date = 'Date de fin requise';
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      if (end < start) {
        newErrors.end_date = 'La date de fin doit être après la date de début';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        employee_id: formData.employee_id,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days_count: daysCount,
        reason: formData.reason || null,
        status: 'pending',
      } as any);
      if (success) {
        onClose();
      }
    } catch (error) {
      logger.error('LeaveFormModal', 'Error submitting leave form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!isOpen) return null;
  const leaveTypes = {
    paid_vacation: 'Congés payés',
    sick_leave: 'Arrêt maladie',
    unpaid_leave: 'Congé sans solde',
    maternity: 'Congé maternité',
    paternity: 'Congé paternité',
    rtt: 'RTT',
    other: 'Autre'
  };
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {leave ? 'Modifier la demande' : 'Nouvelle Demande de Congé'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors dark:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Employé */}
            <div>
              <Label htmlFor="employee_id">Employé *</Label>
              <Select
                value={formData.employee_id}
                onValueChange={value => setFormData({ ...formData, employee_id: value })}
              >
                <SelectTrigger className={errors.employee_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employee_id && (
                <p className="text-sm text-red-500 mt-1">{errors.employee_id}</p>
              )}
            </div>
            {/* Type de congé */}
            <div>
              <Label htmlFor="type">Type de congé *</Label>
              <Select
                value={formData.leave_type}
                onValueChange={value => setFormData({ ...formData, leave_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(leaveTypes).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Date de début *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  className={errors.start_date ? 'border-red-500' : ''}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-500 mt-1">{errors.start_date}</p>
                )}
              </div>
              <div>
                <Label htmlFor="end_date">Date de fin *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  className={errors.end_date ? 'border-red-500' : ''}
                />
                {errors.end_date && (
                  <p className="text-sm text-red-500 mt-1">{errors.end_date}</p>
                )}
              </div>
            </div>
            {/* Durée calculée */}
            {daysCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Durée : <span className="text-lg font-bold">{daysCount}</span> jour{daysCount > 1 ? 's' : ''}
                </p>
              </div>
            )}
            {/* Raison */}
            <div>
              <Label htmlFor="reason">Raison</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Motif de la demande de congé..."
                rows={3}
              />
            </div>
            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-900/20">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                ℹ️ La demande sera soumise pour approbation au responsable RH.
              </p>
            </div>
          </div>
        </form>
        {/* Footer */}
        <div className="shrink-0 flex justify-end gap-3 p-6 border-t">
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
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isSubmitting ? 'Envoi...' : leave ? 'Mettre à jour' : 'Soumettre la demande'}
          </Button>
        </div>
      </div>
    </div>
  );
};