import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Settings, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { InventoryAlertSettings, InventoryItem } from '@/services/inventoryService';

export type AlertsTabProps = {
  items: InventoryItem[];
  alertSettings: InventoryAlertSettings;
  alertSettingsLoading: boolean;
  alertSettingsBusy: boolean;
  onConfigureAlerts: () => void;
  onAlertSettingsChange: <K extends keyof InventoryAlertSettings>(field: K, value: InventoryAlertSettings[K]) => void;
  onReplenish: (itemId: string, quantity: number) => void;
};

export default function AlertsTab({
  items,
  alertSettings,
  alertSettingsLoading,
  alertSettingsBusy,
  onConfigureAlerts,
  onAlertSettingsChange,
  onReplenish
}: AlertsTabProps) {
  const lowStockItems = items.filter((item) => item.status === 'low_stock');
  const outOfStockItems = items.filter((item) => item.status === 'out_of_stock');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="text-orange-500" />
          Alertes de Stock
        </CardTitle>
        <CardDescription>Surveillance des niveaux de stock critiques</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-orange-600">Stock faible</h3>
            {lowStockItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.reference}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">{item.currentStock}</p>
                  <p className="text-sm text-muted-foreground">Min: {item.minStock}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-red-600 dark:text-red-400">Rupture de stock</h3>
            {outOfStockItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
              >
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.reference}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">0</p>
                  <Button size="sm" onClick={() => onReplenish(item.id, item.minStock * 2)}>
                    Réapprovisionner
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration des alertes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Alertes email automatiques</span>
                <Button variant="outline" size="sm" onClick={onConfigureAlerts} disabled={alertSettingsLoading}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurer
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Seuil d'alerte global</span>
                <Input
                  type="number"
                  min="0"
                  className="w-24"
                  value={alertSettings.globalThreshold}
                  onChange={(event) => onAlertSettingsChange('globalThreshold', Number(event.target.value) || 0)}
                  disabled={alertSettingsBusy}
                />
              </div>
              {alertSettingsLoading && <p className="text-xs text-muted-foreground">Chargement des paramètres...</p>}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
