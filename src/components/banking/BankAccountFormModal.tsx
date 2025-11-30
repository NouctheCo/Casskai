/**
 * Modal de création/édition de compte bancaire
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BankAccountFormData {
  account_name: string;
  bank_name: string;
  account_number?: string;
  iban: string;
  bic: string;
  currency: string;
  initial_balance: number;
}

interface BankAccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: BankAccountFormData) => Promise<boolean>;
  account?: any | null;
}

export function BankAccountFormModal({
  isOpen,
  onClose,
  onSubmit,
  account
}: BankAccountFormModalProps) {
  const [formData, setFormData] = useState<BankAccountFormData>({
    account_name: '',
    bank_name: '',
    account_number: '',
    iban: '',
    bic: '',
    currency: 'EUR',
    initial_balance: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (account) {
      setFormData({
        account_name: account.account_name || '',
        bank_name: account.bank_name || '',
        account_number: account.account_number || '',
        iban: account.iban || '',
        bic: account.bic || '',
        currency: account.currency || 'EUR',
        initial_balance: account.current_balance || 0
      });
    } else {
      // Reset form for new account
      setFormData({
        account_name: '',
        bank_name: '',
        account_number: '',
        iban: '',
        bic: '',
        currency: 'EUR',
        initial_balance: 0
      });
    }
  }, [account, isOpen]);

  const validateIBAN = (iban: string): boolean => {
    // Remove spaces and convert to uppercase
    const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

    // Basic format check (2 letters + 2 digits + up to 30 alphanumeric)
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
    if (!ibanRegex.test(cleanIBAN)) return false;

    // Length check for common countries
    const lengthByCountry: Record<string, number> = {
      'FR': 27, 'DE': 22, 'GB': 22, 'ES': 24, 'IT': 27, 'BE': 16, 'NL': 18,
      'PT': 25, 'CH': 21, 'AT': 20, 'LU': 20, 'IE': 22, 'SE': 24, 'DK': 18
    };

    const countryCode = cleanIBAN.substring(0, 2);
    if (lengthByCountry[countryCode] && cleanIBAN.length !== lengthByCountry[countryCode]) {
      return false;
    }

    return true;
  };

  const validateBIC = (bic: string): boolean => {
    // BIC format: 8 or 11 characters (AAAABBCC or AAAABBCCXXX)
    const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    return bicRegex.test(bic.replace(/\s/g, '').toUpperCase());
  };

  const formatIBAN = (value: string): string => {
    // Remove all spaces and convert to uppercase
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    // Add space every 4 characters
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.account_name.trim()) {
      newErrors.account_name = 'Nom du compte requis';
    }

    if (!formData.bank_name.trim()) {
      newErrors.bank_name = 'Nom de la banque requis';
    }

    if (!formData.iban.trim()) {
      newErrors.iban = 'IBAN requis';
    } else if (!validateIBAN(formData.iban)) {
      newErrors.iban = 'Format IBAN invalide (ex: FR76 1234 5678 9012 3456 7890 123)';
    }

    if (!formData.bic.trim()) {
      newErrors.bic = 'BIC requis';
    } else if (!validateBIC(formData.bic)) {
      newErrors.bic = 'Format BIC invalide (8 ou 11 caractères, ex: BNPAFRPP)';
    }

    if (formData.initial_balance < 0) {
      newErrors.initial_balance = 'Le solde ne peut pas être négatif';
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
        ...formData,
        iban: formData.iban.replace(/\s/g, '').toUpperCase(),
        bic: formData.bic.replace(/\s/g, '').toUpperCase(),
        account_number: formData.account_number?.trim() || undefined
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
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100">
            {account ? 'Modifier le compte bancaire' : 'Nouveau compte bancaire'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom du compte */}
          <div>
            <Label htmlFor="account_name">Nom du compte *</Label>
            <Input
              id="account_name"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              placeholder="Ex: Compte courant principal"
              className={errors.account_name ? 'border-red-500' : ''}
            />
            {errors.account_name && (
              <p className="text-red-500 text-sm mt-1">{errors.account_name}</p>
            )}
          </div>

          {/* Nom de la banque */}
          <div>
            <Label htmlFor="bank_name">Nom de la banque *</Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="Ex: BNP Paribas, Crédit Agricole"
              className={errors.bank_name ? 'border-red-500' : ''}
            />
            {errors.bank_name && (
              <p className="text-red-500 text-sm mt-1">{errors.bank_name}</p>
            )}
          </div>

          {/* Numéro de compte (optionnel) */}
          <div>
            <Label htmlFor="account_number">Numéro de compte (optionnel)</Label>
            <Input
              id="account_number"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              placeholder="Ex: 12345678901"
            />
          </div>

          {/* IBAN */}
          <div>
            <Label htmlFor="iban">IBAN *</Label>
            <Input
              id="iban"
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: formatIBAN(e.target.value) })}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              className={errors.iban ? 'border-red-500' : ''}
              maxLength={34}
            />
            {errors.iban && (
              <p className="text-red-500 text-sm mt-1">{errors.iban}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-300 mt-1">
              Format: 2 lettres pays + 2 chiffres + code bancaire (espaces automatiques)
            </p>
          </div>

          {/* BIC */}
          <div>
            <Label htmlFor="bic">BIC / SWIFT *</Label>
            <Input
              id="bic"
              value={formData.bic}
              onChange={(e) => setFormData({ ...formData, bic: e.target.value.toUpperCase() })}
              placeholder="BNPAFRPP"
              className={errors.bic ? 'border-red-500' : ''}
              maxLength={11}
            />
            {errors.bic && (
              <p className="text-red-500 text-sm mt-1">{errors.bic}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-300 mt-1">
              8 ou 11 caractères (ex: BNPAFRPP ou BNPAFRPPXXX)
            </p>
          </div>

          {/* Devise et Solde initial */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency">Devise *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CHF">CHF (Fr)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="initial_balance">Solde initial</Label>
              <Input
                id="initial_balance"
                type="number"
                step="0.01"
                value={formData.initial_balance}
                onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
                className={errors.initial_balance ? 'border-red-500' : ''}
              />
              {errors.initial_balance && (
                <p className="text-red-500 text-sm mt-1">{errors.initial_balance}</p>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 L'IBAN et le BIC sont nécessaires pour générer des virements SEPA
            </p>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement...' : account ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
