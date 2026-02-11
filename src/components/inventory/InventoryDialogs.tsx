import { FC } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2, Play, CheckCircle, XCircle } from 'lucide-react';

import type { InventoryAlertSettings, InventoryItem } from '@/services/inventoryService';
import type { ProductionOrder, ProductionOrderWithComponents } from '@/services/productionOrdersService';
import type { NewOrderComponentDraft, NewProductionOrderForm } from '@/types/production';
import { formatCurrency, getCurrencySymbol } from '@/lib/utils';

export type InventoryComponentOption = {
  value: string;
  label: string;
};

type MovementType = 'entry' | 'exit' | 'adjustment' | 'transfer';

export interface ProductionOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createOrderLoading: boolean;
  form: NewProductionOrderForm;
  components: NewOrderComponentDraft[];
  componentOptions: InventoryComponentOption[];
  hasInventoryItems: boolean;
  onFieldChange: (field: keyof NewProductionOrderForm, value: NewProductionOrderForm[keyof NewProductionOrderForm]) => void;
  onAddComponent: () => void;
  onComponentChange: (index: number, field: keyof NewOrderComponentDraft, value: string) => void;
  onRemoveComponent: (index: number) => void;
  onSubmit: () => void;
}

export interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ProductionOrderWithComponents | null;
  statusLabels: Record<ProductionOrder['status'], string>;
  statusVariants: Record<ProductionOrder['status'], 'default' | 'secondary' | 'outline' | 'destructive'>;
  priorityLabels: Record<ProductionOrder['priority'], string>;
  actionLoading: boolean;
  onStatusChange: (orderId: string, status: ProductionOrder['status']) => void;
}

export interface AlertSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: InventoryAlertSettings;
  busy: boolean;
  saving: boolean;
  onSettingChange: (field: keyof InventoryAlertSettings, value: InventoryAlertSettings[keyof InventoryAlertSettings]) => void;
  onSave: () => void;
}

export interface MovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItems: InventoryItem[];
  movementItemId: string;
  movementType: MovementType;
  movementQuantity: string;
  movementReason: string;
  onItemChange: (value: string) => void;
  onTypeChange: (value: MovementType) => void;
  onQuantityChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
}

export interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName: string;
  supplierEmail: string;
  supplierPhone: string;
  supplierContact: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onContactChange: (value: string) => void;
  onSubmit: () => void;
}

export interface InventoryDialogsProps {
  productionDialog: ProductionOrderDialogProps;
  orderDetailsDialog: OrderDetailsDialogProps;
  alertDialog: AlertSettingsDialogProps;
  movementDialog: MovementDialogProps;
  supplierDialog: SupplierDialogProps;
}

export const ProductionOrderDialog: FC<ProductionOrderDialogProps> = ({
  open,
  onOpenChange,
  createOrderLoading,
  form,
  components,
  componentOptions,
  hasInventoryItems,
  onFieldChange,
  onAddComponent,
  onComponentChange,
  onRemoveComponent,
  onSubmit
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Nouvel ordre de production</DialogTitle>
        <DialogDescription>
          Préparez un ordre et réservez les composants nécessaires avant de lancer la production.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Produit / ordre</Label>
            <Input
              placeholder="Nom du produit"
              value={form.productName}
              onChange={(event) => onFieldChange('productName', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Quantité à produire</Label>
            <Input
              type="number"
              min="1"
              placeholder="0"
              value={form.quantity}
              onChange={(event) => onFieldChange('quantity', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Responsable</Label>
            <Input
              placeholder="Nom du responsable"
              value={form.responsible}
              onChange={(event) => onFieldChange('responsible', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Priorité</Label>
            <Select value={form.priority} onValueChange={(value) => onFieldChange('priority', value as ProductionOrder['priority'])}>
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Début prévu</Label>
            <DatePicker value={form.startDate} onChange={(date: any) => onFieldChange('startDate', date)} placeholder="Sélectionner une date" className="" />
          </div>
          <div className="space-y-2">
            <Label>Fin attendue</Label>
            <DatePicker value={form.expectedDate} onChange={(date: any) => onFieldChange('expectedDate', date)} placeholder="Sélectionner une date" className="" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Ajoutez une description ou des consignes"
              value={form.description}
              onChange={(event) => onFieldChange('description', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Coût estimé ({getCurrencySymbol()})</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={form.cost}
              onChange={(event) => onFieldChange('cost', event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes internes</Label>
            <Textarea
              placeholder="Notes, instructions, risques..."
              value={form.notes}
              onChange={(event) => onFieldChange('notes', event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-medium">Composants requis</h4>
              <p className="text-sm text-muted-foreground">Réservez les articles d'inventaire nécessaires.</p>
            </div>
            <Button variant="outline" size="sm" onClick={onAddComponent} disabled={!hasInventoryItems}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </div>
          {!hasInventoryItems && (
            <p className="text-xs text-muted-foreground">Aucun article d'inventaire disponible pour le moment.</p>
          )}
          {components.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun composant sélectionné.</p>
          ) : (
            <div className="space-y-3">
              {components.map((component, index) => (
                <div key={`component-${index}`} className="grid gap-3 rounded-lg border p-3 md:grid-cols-5 md:items-end">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Article</Label>
                    <Select
                      value={component.inventoryItemId || 'none'}
                      onValueChange={(value) => onComponentChange(index, 'inventoryItemId', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un article" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Choisir</SelectItem>
                        {componentOptions.map((option) => (
                          <SelectItem key={`${option.value}-${index}`} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Besoin</Label>
                    <Input type="number" min="0" value={component.needed} onChange={(event) => onComponentChange(index, 'needed', event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Alloué</Label>
                    <Input type="number" min="0" value={component.allocated} onChange={(event) => onComponentChange(index, 'allocated', event.target.value)} />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="justify-self-end text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveComponent(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createOrderLoading}>
          Annuler
        </Button>
        <Button onClick={onSubmit} disabled={createOrderLoading}>
          {createOrderLoading ? 'Création en cours...' : "Créer l'ordre"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const OrderDetailsDialog: FC<OrderDetailsDialogProps> = ({
  open,
  onOpenChange,
  order,
  statusLabels,
  statusVariants,
  priorityLabels,
  actionLoading,
  onStatusChange
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
      <DialogHeader>
        <DialogTitle>{order ? order.product_name : 'Ordre de production'}</DialogTitle>
        <DialogDescription>
          {order ? `Référence ${order.id} • Priorité ${priorityLabels[order.priority]}` : 'Sélectionnez un ordre pour afficher les détails.'}
        </DialogDescription>
      </DialogHeader>
      {order ? (
        <>
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">Statut</p>
                  <Badge variant={statusVariants[order.status]}>{statusLabels[order.status]}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">Responsable</p>
                  <p className="text-sm">{order.responsible || 'Non assigné'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">Coût estimé</p>
                  <p className="text-sm font-semibold">{formatCurrency(order.cost)}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Quantité</p>
                  <p className="text-sm">{order.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Début</p>
                  <p className="text-sm">{order.start_date || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Fin prévue</p>
                  <p className="text-sm">{order.expected_date || '—'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Composants</h4>
                  <p className="text-xs text-muted-foreground">{order.components?.length || 0} ligne(s)</p>
                </div>
                {order.components && order.components.length > 0 ? (
                  <div className="space-y-3">
                    {order.components.map((component) => (
                      <div
                        key={`${order.id}-${component.itemId}`}
                        className={`rounded-lg border p-3 ${component.shortfall > 0 ? 'border-destructive/50 bg-destructive/5' : 'border-muted bg-muted/20'}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{component.itemName}</p>
                            <p className="text-xs text-muted-foreground">Référence {component.reference || '—'}</p>
                          </div>
                          <Badge variant={component.shortfall > 0 ? 'destructive' : 'outline'}>
                            {component.shortfall > 0 ? `Manque ${component.shortfall}` : 'OK'}
                          </Badge>
                        </div>
                        <div className="mt-2 grid gap-4 text-xs text-muted-foreground md:grid-cols-3">
                          <p>Requis : {component.needed}</p>
                          <p>Alloué : {component.allocated}</p>
                          <p>Disponible : {component.available}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun composant associé.</p>
                )}
              </div>

              {order.notes && (
                <div className="space-y-2">
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="flex flex-wrap gap-2">
            {order.status === 'pending' && (
              <Button onClick={() => onStatusChange(order.id, 'in_progress')} disabled={actionLoading}>
                <Play className="mr-2 h-4 w-4" />
                Lancer
              </Button>
            )}
            {order.status === 'in_progress' && (
              <Button onClick={() => onStatusChange(order.id, 'completed')} disabled={actionLoading}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Terminer
              </Button>
            )}
            {order.status !== 'cancelled' && order.status !== 'completed' && (
              <Button variant="ghost" onClick={() => onStatusChange(order.id, 'cancelled')} disabled={actionLoading}>
                <XCircle className="mr-2 h-4 w-4" />
                Annuler
              </Button>
            )}
          </DialogFooter>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Sélectionnez un ordre pour afficher les détails.</p>
      )}
    </DialogContent>
  </Dialog>
);

export const AlertSettingsDialog: FC<AlertSettingsDialogProps> = ({
  open,
  onOpenChange,
  settings,
  busy,
  saving,
  onSettingChange,
  onSave
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Paramètres des alertes</DialogTitle>
        <DialogDescription>
          Choisissez les canaux de notification et ajustez les seuils avant d'envoyer les alertes.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Alertes e-mail</p>
              <p className="text-sm text-muted-foreground">Notifications envoyées aux responsables entrepôt.</p>
            </div>
            <Switch checked={settings.emailEnabled} onCheckedChange={(checked) => onSettingChange('emailEnabled', Boolean(checked))} disabled={busy} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Alertes SMS</p>
              <p className="text-sm text-muted-foreground">Avertit les contacts critiques lors des ruptures.</p>
            </div>
            <Switch checked={settings.smsEnabled} onCheckedChange={(checked) => onSettingChange('smsEnabled', Boolean(checked))} disabled={busy} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Alertes Slack</p>
              <p className="text-sm text-muted-foreground">Publie un message sur le canal #ops-inventory.</p>
            </div>
            <Switch checked={settings.slackEnabled} onCheckedChange={(checked) => onSettingChange('slackEnabled', Boolean(checked))} disabled={busy} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Digest quotidien</p>
              <p className="text-sm text-muted-foreground">Résumé des alertes envoyé chaque matin.</p>
            </div>
            <Switch checked={settings.digestEnabled} onCheckedChange={(checked) => onSettingChange('digestEnabled', Boolean(checked))} disabled={busy} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Réapprovisionnement automatique</p>
              <p className="text-sm text-muted-foreground">Déclenche les bons de commande prédéfinis.</p>
            </div>
            <Switch
              checked={settings.autoReorderEnabled}
              onCheckedChange={(checked) => onSettingChange('autoReorderEnabled', Boolean(checked))}
              disabled={busy}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Seuil global</Label>
          <Input
            type="number"
            min="0"
            value={settings.globalThreshold}
            onChange={(event) => onSettingChange('globalThreshold', Number(event.target.value) || 0)}
            disabled={busy}
          />
          <p className="text-xs text-muted-foreground">
            Lorsque le stock disponible tombe sous ce seuil, une alerte est envoyée quelle que soit la catégorie.
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          Annuler
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const MovementDialog: FC<MovementDialogProps> = ({
  open,
  onOpenChange,
  inventoryItems,
  movementItemId,
  movementType,
  movementQuantity,
  movementReason,
  onItemChange,
  onTypeChange,
  onQuantityChange,
  onReasonChange,
  onSubmit
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Nouveau mouvement de stock</DialogTitle>
        <DialogDescription>Enregistrer une entrée, sortie ou ajustement</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Article *</Label>
          <Select value={movementItemId} onValueChange={onItemChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un article" />
            </SelectTrigger>
            <SelectContent>
              {inventoryItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} (Stock: {item.currentStock})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Type de mouvement *</Label>
          <Select value={movementType} onValueChange={(value) => onTypeChange(value as MovementType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entrée</SelectItem>
              <SelectItem value="exit">Sortie</SelectItem>
              <SelectItem value="adjustment">Ajustement</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Quantité *</Label>
          <Input type="number" min="1" placeholder="Ex: 10" value={movementQuantity} onChange={(event) => onQuantityChange(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Motif *</Label>
          <Input
            placeholder="Ex: Réception fournisseur, Vente client..."
            value={movementReason}
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button onClick={onSubmit}>Enregistrer</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

/**
 * ⚠️ DÉPRÉCIÉ : SupplierDialog
 *
 * Ce dialog est obsolète et remplacé par ThirdPartyFormDialog.
 * Le bouton "Nouveau fournisseur" dans l'onglet Fournisseurs utilise désormais ThirdPartyFormDialog
 * pour créer un fournisseur complet dans la table third_parties.
 *
 * Ce composant est conservé pour compatibilité mais ne devrait plus être utilisé.
 * @deprecated Utiliser ThirdPartyFormDialog à la place
 */
export const SupplierDialog: FC<SupplierDialogProps> = ({
  open,
  onOpenChange,
  supplierName,
  supplierEmail,
  supplierPhone,
  supplierContact,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onContactChange,
  onSubmit
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Nouveau fournisseur (Ancien formulaire)</DialogTitle>
        <DialogDescription>⚠️ Ce formulaire est obsolète. Utilisez le nouveau formulaire via le bouton "Nouveau fournisseur".</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nom du fournisseur *</Label>
          <Input placeholder="Ex: Dell France" value={supplierName} onChange={(event) => onNameChange(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input
            type="email"
            placeholder="contact@fournisseur.com"
            value={supplierEmail}
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Téléphone</Label>
          <Input placeholder="01 23 45 67 89" value={supplierPhone} onChange={(event) => onPhoneChange(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Personne de contact</Label>
          <Input placeholder="Nom du contact" value={supplierContact} onChange={(event) => onContactChange(event.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button onClick={onSubmit}>Créer</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const InventoryDialogs: FC<InventoryDialogsProps> = ({
  productionDialog,
  orderDetailsDialog,
  alertDialog,
  movementDialog,
  supplierDialog
}) => (
  <>
    <ProductionOrderDialog {...productionDialog} />
    <OrderDetailsDialog {...orderDetailsDialog} />
    <AlertSettingsDialog {...alertDialog} />
    <MovementDialog {...movementDialog} />
    <SupplierDialog {...supplierDialog} />
  </>
);

export default InventoryDialogs;
