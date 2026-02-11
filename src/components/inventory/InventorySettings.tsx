/**
 * CassKai - Paramètres Inventaire
 * Copyright © 2025 NOUTCHE CONSEIL
 *
 * Configuration des paramètres de gestion des stocks
 * P2-2: Méthodes de valorisation avancées (CMP, FIFO, LIFO)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle2, Info, Save } from 'lucide-react';
import type { ValuationMethod } from '@/services/inventoryValuationService';
import { logger } from '@/lib/logger';

interface InventorySettingsProps {
  className?: string;
}

/**
 * Composant de configuration des paramètres inventaire
 *
 * Permet de choisir la méthode de valorisation des stocks:
 * - CMP (Coût Moyen Pondéré) - Recommandé, conforme toutes normes
 * - FIFO (First In First Out) - Flux physique réel
 * - LIFO (Last In Last Out) - ⚠️ Interdit IFRS, validation automatique
 */
export const InventorySettings: React.FC<InventorySettingsProps> = ({ className }) => {
  const { toast } = useToast();
  const { currentEnterprise } = useEnterprise();

  const [valuationMethod, setValuationMethod] = useState<ValuationMethod>('CMP');
  const [accountingStandard, setAccountingStandard] = useState<string>('PCG');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Charger paramètres actuels
  useEffect(() => {
    loadSettings();
  }, [currentEnterprise?.id]);

  const loadSettings = async () => {
    if (!currentEnterprise?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('inventory_valuation_method, accounting_standard')
        .eq('id', currentEnterprise.id)
        .single();

      if (error) throw error;

      if (data) {
        setValuationMethod((data.inventory_valuation_method || 'CMP') as ValuationMethod);
        setAccountingStandard(data.accounting_standard || 'PCG');
      }
    } catch (error) {
      logger.error('InventorySettings', 'Erreur chargement paramètres:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les paramètres',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValuationMethodChange = (method: ValuationMethod) => {
    // Validation LIFO + IFRS
    if (method === 'LIFO' && accountingStandard === 'IFRS') {
      toast({
        title: '⚠️ Méthode interdite',
        description: 'LIFO est INTERDIT en IFRS (IAS 2). Utilisez CMP ou FIFO.',
        variant: 'destructive'
      });
      return;
    }

    setValuationMethod(method);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!currentEnterprise?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ inventory_valuation_method: valuationMethod })
        .eq('id', currentEnterprise.id);

      if (error) throw error;

      toast({
        title: '✅ Paramètres enregistrés',
        description: `Méthode de valorisation: ${valuationMethod}`,
        variant: 'default'
      });

      setHasChanges(false);
      logger.info('InventorySettings', `Méthode valorisation mise à jour: ${valuationMethod}`);
    } catch (error) {
      logger.error('InventorySettings', 'Erreur sauvegarde paramètres:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const isLIFOBlocked = accountingStandard === 'IFRS';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📦 Valorisation des Stocks
        </CardTitle>
        <CardDescription>
          Choisissez la méthode de valorisation des sorties de stock
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Méthode de Valorisation */}
        <div className="space-y-3">
          <Label htmlFor="valuation-method" className="text-sm font-medium">
            Méthode de valorisation
          </Label>

          <Select
            value={valuationMethod}
            onValueChange={handleValuationMethodChange}
            disabled={loading}
          >
            <SelectTrigger id="valuation-method">
              <SelectValue placeholder="Sélectionner une méthode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CMP">
                <div className="flex flex-col items-start">
                  <span className="font-medium">🔷 CMP (Coût Moyen Pondéré)</span>
                  <span className="text-xs text-gray-500">Recommandé - Conforme toutes normes</span>
                </div>
              </SelectItem>
              <SelectItem value="FIFO">
                <div className="flex flex-col items-start">
                  <span className="font-medium">🟢 FIFO (Premier Entré Premier Sorti)</span>
                  <span className="text-xs text-gray-500">Flux physique réel - Conforme IFRS/PCG/SYSCOHADA</span>
                </div>
              </SelectItem>
              <SelectItem value="LIFO" disabled={isLIFOBlocked}>
                <div className="flex flex-col items-start">
                  <span className={`font-medium ${isLIFOBlocked ? 'text-gray-400' : ''}`}>
                    🔴 LIFO (Dernier Entré Premier Sorti)
                  </span>
                  <span className="text-xs text-red-600">
                    {isLIFOBlocked ? '⚠️ INTERDIT en IFRS' : 'Autorisé PCG/SYSCOHADA (peu utilisé)'}
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Info Méthode Sélectionnée */}
        <div className="rounded-lg border bg-blue-50 border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-blue-900">
                {valuationMethod === 'CMP' && '🔷 Coût Moyen Pondéré (CMP)'}
                {valuationMethod === 'FIFO' && '🟢 First In First Out (FIFO)'}
                {valuationMethod === 'LIFO' && '🔴 Last In Last Out (LIFO)'}
              </p>
              <p className="text-xs text-blue-700">
                {valuationMethod === 'CMP' &&
                  'Chaque entrée met à jour le coût moyen. Simple et lisse les variations de prix. Conforme PCG, SYSCOHADA, IFRS et SCF.'
                }
                {valuationMethod === 'FIFO' &&
                  'Les premières unités entrées sont les premières sorties. Stock valorisé aux prix récents. Préféré pour produits périssables.'
                }
                {valuationMethod === 'LIFO' &&
                  'Les dernières unités entrées sont les premières sorties. Stock valorisé aux prix anciens. ⚠️ Interdit en IFRS (IAS 2).'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Avertissement LIFO */}
        {valuationMethod === 'LIFO' && !isLIFOBlocked && (
          <div className="rounded-lg border bg-red-50 border-red-200 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  ⚠️ Attention: LIFO peu recommandé
                </p>
                <p className="text-xs text-red-700 mt-1">
                  La méthode LIFO est <strong>interdite en IFRS</strong> (IAS 2) et peu utilisée en pratique.
                  Elle présente des désavantages fiscaux (profit élevé = impôts élevés).
                  Nous recommandons fortement d'utiliser <strong>CMP ou FIFO</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Norme Comptable (info) */}
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>
            Norme comptable: <strong>{accountingStandard}</strong>
            {isLIFOBlocked && ' (LIFO bloqué)'}
          </span>
        </div>

        {/* Bouton Sauvegarder */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {hasChanges && '● Modifications non enregistrées'}
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving || loading}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventorySettings;
