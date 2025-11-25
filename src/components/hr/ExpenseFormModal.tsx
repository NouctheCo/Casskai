import React, { useState } from 'react';
import { X, DollarSign, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Expense, Employee } from '@/services/hrService';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Expense, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'employee_name'>) => Promise<boolean>;
  employees: Employee[];
  expense?: Expense | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employees,
  expense
}) => {
  const [formData, setFormData] = useState({
    employee_id: expense?.employee_id || '',
    category: expense?.category || 'other' as const,
    description: expense?.description || '',
    amount: expense?.amount?.toString() || '',
    currency: expense?.currency || 'EUR',
    expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
    notes: expense?.notes || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee_id) newErrors.employee_id = 'Employé requis';
    if (!formData.description.trim()) newErrors.description = 'Description requise';
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Montant invalide';
    }
    if (!formData.expense_date) newErrors.expense_date = 'Date requise';

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
        amount: parseFloat(formData.amount),
        status: 'pending',
        category: formData.category as any,
      });

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error submitting expense form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const expenseCategories = {
    travel: 'Déplacement',
    meals: 'Repas',
    transport: 'Transport',
    supplies: 'Fournitures',
    training: 'Formation',
    other: 'Autre'
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {expense ? 'Modifier la note de frais' : 'Nouvelle Note de Frais'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
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

            {/* Catégorie et Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={value => setFormData({ ...formData, category: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(expenseCategories).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expense_date">Date *</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                  className={errors.expense_date ? 'border-red-500' : ''}
                />
                {errors.expense_date && (
                  <p className="text-sm text-red-500 mt-1">{errors.expense_date}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez la dépense..."
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            {/* Montant et Devise */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="amount">Montant *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className={errors.amount ? 'border-red-500' : ''}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
                )}
              </div>

              <div>
                <Label htmlFor="currency">Devise</Label>
                <Select
                  value={formData.currency}
                  onValueChange={value => setFormData({ ...formData, currency: value })}
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
            </div>

            {/* Justificatif */}
            <div>
              <Label htmlFor="receipt">Justificatif</Label>
              <div className="mt-2 flex items-center justify-center w-full">
                <label
                  htmlFor="receipt"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 10MB)</p>
                  </div>
                  <input
                    id="receipt"
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                📎 Le justificatif sera disponible dans une prochaine version
              </p>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes additionnelles</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informations complémentaires (optionnel)..."
                rows={2}
              />
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                💡 <span className="font-semibold">Rappel :</span> Pensez à joindre le justificatif de la dépense pour faciliter le traitement de votre demande de remboursement.
              </p>
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
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isSubmitting ? 'Envoi...' : expense ? 'Mettre à jour' : 'Soumettre'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
