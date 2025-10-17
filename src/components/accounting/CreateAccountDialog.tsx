import React, { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountCreated: () => void;
  companyId: string;
}

 
export function CreateAccountDialog({
  open: _open,
  onOpenChange,
  onAccountCreated,
  companyId,
}: CreateAccountDialogProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    account_number: '',
    account_name: '',
    account_type: 'asset' as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
    account_class: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { supabase } = await import('@/lib/supabase');

      // Valider le numéro de compte
      if (!formData.account_number || formData.account_number.length < 1) {
        throw new Error('Le numéro de compte est requis');
      }

      // Vérifier que le compte n'existe pas déjà
      const { data: existingAccount } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('company_id', companyId)
        .eq('account_number', formData.account_number)
        .single();

      if (existingAccount) {
        throw new Error(`Le compte ${formData.account_number} existe déjà`);
      }

      // Déterminer la classe du compte à partir du premier chiffre
      const accountClass = parseInt(formData.account_number.charAt(0), 10);
      if (isNaN(accountClass) || accountClass < 1 || accountClass > 8) {
        throw new Error('Le numéro de compte doit commencer par un chiffre entre 1 et 8');
      }

      // Créer le compte
       
      const { data: _data, error } = await supabase
        .from('chart_of_accounts')
        .insert({
          company_id: companyId,
          account_number: formData.account_number,
          account_name: formData.account_name,
          account_type: formData.account_type,
          account_class: accountClass,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Succès
      showToast(`Le compte ${formData.account_number} - ${formData.account_name} a été créé avec succès`, 'success');

      // Réinitialiser le formulaire
      setFormData({
        account_number: '',
        account_name: '',
        account_type: 'asset',
        account_class: 1,
      });

      // Fermer le dialogue et rafraîchir
      onOpenChange(false);
      onAccountCreated();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible de créer le compte', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau compte</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau compte à votre plan comptable personnalisé
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="account_number">Numéro de compte *</Label>
              <Input
                id="account_number"
                placeholder="Ex: 411000"
                value={formData.account_number}
                onChange={(e) =>
                  setFormData({ ...formData, account_number: e.target.value })
                }
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Le premier chiffre détermine la classe (1-8)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account_name">Libellé du compte *</Label>
              <Input
                id="account_name"
                placeholder="Ex: Clients"
                value={formData.account_name}
                onChange={(e) =>
                  setFormData({ ...formData, account_name: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account_type">Type de compte *</Label>
              <Select
                value={formData.account_type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    account_type: value as typeof formData.account_type,
                  })
                }
                disabled={loading}
              >
                <SelectTrigger id="account_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Actif</SelectItem>
                  <SelectItem value="liability">Passif</SelectItem>
                  <SelectItem value="equity">Capitaux propres</SelectItem>
                  <SelectItem value="revenue">Produits</SelectItem>
                  <SelectItem value="expense">Charges</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer le compte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
