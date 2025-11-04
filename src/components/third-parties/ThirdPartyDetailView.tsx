import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from '@/contexts/LocaleContext';

export const ThirdPartyDetailView = ({ open, onOpenChange, thirdParty, formatCurrency }) => {
  const { t } = useLocale();
  if (!thirdParty) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{thirdParty.name}</DialogTitle>
          <DialogDescription>{t(thirdParty.type === 'CLIENT' ? 'clientDetails' : 'supplierDetails')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4 text-sm">
          <p><strong>{t('thirdParties.email')}:</strong> {thirdParty.email || 'N/A'}</p>
          <p><strong>{t('thirdParties.phone')}:</strong> {thirdParty.phone || 'N/A'}</p>
          <p><strong>{t('thirdParties.website')}:</strong> {thirdParty.website || 'N/A'}</p>
          <p><strong>{t('thirdParties.contactName')}:</strong> {thirdParty.contact_name || 'N/A'}</p>
          <p><strong>{t('thirdParties.address')}:</strong> {`${thirdParty.address || ''}, ${thirdParty.city || ''} ${thirdParty.postal_code || ''}, ${thirdParty.country || ''}`.replace(/ ,|, $|^, /g, '').trim() || 'N/A'}</p>
          <p><strong>{t('thirdParties.taxNumber')}:</strong> {thirdParty.tax_number || 'N/A'}</p>
          <p><strong>{t('thirdParties.status')}:</strong> {thirdParty.is_active ? t('active') : t('inactive')}</p>
          <p><strong>{t('thirdParties.balance')}:</strong> {formatCurrency(thirdParty.balance || 0, thirdParty.default_currency || 'EUR')}</p>
          <p><strong>{t('thirdParties.paymentTerms')}:</strong> {thirdParty.default_payment_terms || 'N/A'}</p>
          <p><strong>{t('thirdParties.defaultCurrency')}:</strong> {thirdParty.default_currency || 'N/A'}</p>
          <p><strong>{t('thirdParties.notes')}:</strong> {thirdParty.notes || 'N/A'}</p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t('close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
