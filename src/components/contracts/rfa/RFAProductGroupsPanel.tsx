import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { rfaProductGroupsService, type RFAProductGroup } from '@/services/rfa/rfaProductGroupsService';
import { Plus, Trash2 } from 'lucide-react';

type Props = {
  companyId: string;
};

export const RFAProductGroupsPanel: React.FC<Props> = ({ companyId }) => {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<RFAProductGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RFAProductGroup | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const title = useMemo(
    () => (editing ? t('contracts.rfaAdvanced.groups.dialog.editTitle', 'Modifier le groupe') : t('contracts.rfaAdvanced.groups.dialog.createTitle', 'Nouveau groupe')),
    [editing, t]
  );

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await rfaProductGroupsService.listGroups(companyId);
      setGroups(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [companyId]);

  const openCreate = () => {
    setEditing(null);
    setCode('');
    setName('');
    setDescription('');
    setColor('#3B82F6');
    setOpen(true);
  };

  const openEdit = (g: RFAProductGroup) => {
    setEditing(g);
    setCode(g.code || '');
    setName(g.name || '');
    setDescription(g.description || '');
    setColor(g.color || '#3B82F6');
    setOpen(true);
  };

  const save = async () => {
    await rfaProductGroupsService.upsertGroup({
      company_id: companyId,
      id: editing?.id,
      code: code.trim() || null,
      name: name.trim(),
      description: description.trim() || null,
      color: color || null,
      is_active: true
    });
    setOpen(false);
    await load();
  };

  const remove = async (id: string) => {
    await rfaProductGroupsService.deleteGroup(id);
    await load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('contracts.rfaAdvanced.groups.title', 'Groupes produits RFA')}</CardTitle>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('contracts.rfaAdvanced.groups.new', 'Nouveau')}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">{t('contracts.rfaAdvanced.groups.loading', 'Chargement…')}</div>
          ) : groups.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t('contracts.rfaAdvanced.groups.empty', 'Aucun groupe. Crée-en un ou importe via l’onglet Imports.')}</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {groups.map(g => (
                <div key={g.id} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{g.name}</div>
                    <div className="flex items-center gap-2">
                      {g.code ? <Badge variant="secondary">{g.code}</Badge> : null}
                      <span className="inline-block h-3 w-3 rounded-full" style={{ background: g.color || '#3B82F6' }} />
                    </div>
                  </div>
                  {g.description ? <div className="text-xs text-muted-foreground line-clamp-2">{g.description}</div> : null}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(g)}>{t('contracts.rfaAdvanced.groups.edit', 'Modifier')}</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTargetId(g.id)}
                      aria-label={t('contracts.rfaAdvanced.groups.actions.delete', 'Supprimer')}
                      title={t('contracts.rfaAdvanced.groups.actions.delete', 'Supprimer')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(deleteTargetId)} onOpenChange={(o) => !o && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contracts.rfaAdvanced.groups.deleteDialog.title', 'Supprimer le groupe ?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('contracts.rfaAdvanced.groups.deleteDialog.description', 'Cette action est irréversible.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('contracts.rfaAdvanced.groups.deleteDialog.cancel', 'Annuler')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteTargetId) return;
                const id = deleteTargetId;
                setDeleteTargetId(null);
                await remove(id);
              }}
            >
              {t('contracts.rfaAdvanced.groups.deleteDialog.confirm', 'Supprimer')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm font-medium">{t('contracts.rfaAdvanced.groups.fields.code', 'Code')}</div>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('contracts.rfaAdvanced.groups.placeholders.code', 'ALIM')} />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">{t('contracts.rfaAdvanced.groups.fields.color', 'Couleur')}</div>
                <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder={t('contracts.rfaAdvanced.groups.placeholders.color', '#3B82F6')} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">{t('contracts.rfaAdvanced.groups.fields.name', 'Nom')}</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('contracts.rfaAdvanced.groups.placeholders.name', 'Alimentation')} />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">{t('contracts.rfaAdvanced.groups.fields.description', 'Description')}</div>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('contracts.rfaAdvanced.groups.placeholders.description', 'Optionnel')} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>{t('contracts.rfaAdvanced.groups.actions.cancel', 'Annuler')}</Button>
              <Button onClick={save} disabled={!name.trim()}>{t('contracts.rfaAdvanced.groups.actions.save', 'Enregistrer')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
