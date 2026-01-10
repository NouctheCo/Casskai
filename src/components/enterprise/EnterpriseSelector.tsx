import React, { useState } from 'react';

import { 

  Select, 

  SelectContent, 

  SelectItem, 

  SelectTrigger, 

  SelectValue,

  SelectSeparator 

} from '@/components/ui/select';

import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Building, Plus, Settings, Check } from 'lucide-react';

import { useEnterprise } from '@/contexts/EnterpriseContext';

import { useLocale } from '@/contexts/LocaleContext';

import { Badge } from '@/components/ui/badge';

import EnterpriseForm from './EnterpriseForm';



export default function EnterpriseSelector() {

  const { enterprises, currentEnterpriseId, switchEnterprise } = useEnterprise();

  const { t } = useLocale();

  const [isNewEnterpriseDialogOpen, setIsNewEnterpriseDialogOpen] = useState(false);

  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);



  const _currentEnterprise = enterprises.find(e => e.id === currentEnterpriseId);



  const handleSelectEnterprise = (value: string) => {

    if (value === 'new') {

      setIsNewEnterpriseDialogOpen(true);

    } else if (value === 'manage') {

      setIsManageDialogOpen(true);

    } else {

      switchEnterprise(value);

    }

  };



  const getCountryFlag = (countryCode: string) => {

    const flags = {

      FR: '🇫🇷',

      BE: '🇧🇪',

      CH: '🇨🇭',

      LU: '🇱🇺'

    };

    const code = countryCode as keyof typeof flags;
    return flags[code] || '🏢';

  };



  const getTaxRegimeLabel = (type: string) => {

    const labels = {

      realNormal: 'Réel Normal',

      realSimplified: 'Réel Simplifié',

      microEnterprise: 'Micro-entreprise',

      other: 'Autre'

    };

    const labelType = type as keyof typeof labels;
    return labels[labelType] || type;

  };



  return (

    <>

      <Select value={currentEnterpriseId || ''} onValueChange={handleSelectEnterprise}>

        <SelectTrigger className="w-[280px]">

          <div className="flex items-center gap-2">

            <Building className="h-4 w-4" />

            <SelectValue placeholder={t('enterprise.select', { defaultValue: 'Sélectionner une entreprise' })} />

          </div>

        </SelectTrigger>

        <SelectContent>

          <div className="p-2">

            <p className="text-xs text-muted-foreground mb-2">

              {t('enterprise.yourEnterprises', { defaultValue: 'Vos entreprises' })}

            </p>

          </div>

          

          {enterprises.map((enterprise) => (

            <SelectItem key={enterprise.id} value={enterprise.id}>

              <div className="flex items-center justify-between w-full">

                <div className="flex items-center gap-2">

                  <span>{getCountryFlag(enterprise.countryCode)}</span>

                  <div>

                    <div className="flex items-center gap-2">

                      <span className="font-medium">{enterprise.name}</span>

                      {enterprise.id === currentEnterpriseId && (

                        <Check className="h-3 w-3 text-primary" />

                      )}

                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">

                      <span>{enterprise.registrationNumber}</span>

                      <span>•</span>

                      <Badge variant="outline" className="text-xs py-0 h-4">

                        {getTaxRegimeLabel(enterprise.taxRegime.type)}

                      </Badge>

                    </div>

                  </div>

                </div>

              </div>

            </SelectItem>

          ))}

          

          <SelectSeparator />

          

          <SelectItem value="new">

            <div className="flex items-center gap-2 text-primary">

              <Plus className="h-4 w-4" />

              <span>{t('enterprise.addNew', { defaultValue: 'Ajouter une entreprise' })}</span>

            </div>

          </SelectItem>

          

          <SelectItem value="manage">

            <div className="flex items-center gap-2">

              <Settings className="h-4 w-4" />

              <span>{t('enterprise.manage', { defaultValue: 'Gérer les entreprises' })}</span>

            </div>

          </SelectItem>

        </SelectContent>

      </Select>



      {/* Dialog pour ajouter une nouvelle entreprise */}

      <Dialog open={isNewEnterpriseDialogOpen} onOpenChange={setIsNewEnterpriseDialogOpen}>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">

          <DialogHeader>

            <DialogTitle>

              {t('enterprise.addNew', { defaultValue: 'Ajouter une entreprise' })}

            </DialogTitle>

          </DialogHeader>

          <EnterpriseForm 

            onSuccess={() => setIsNewEnterpriseDialogOpen(false)}

            onCancel={() => setIsNewEnterpriseDialogOpen(false)}

          />

        </DialogContent>

      </Dialog>



      {/* Dialog pour gérer les entreprises */}

      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">

          <DialogHeader>

            <DialogTitle>

              {t('enterprise.manage', { defaultValue: 'Gérer les entreprises' })}

            </DialogTitle>

          </DialogHeader>

          <EnterpriseManagement onClose={() => setIsManageDialogOpen(false)} />

        </DialogContent>

      </Dialog>

    </>

  );

}



// Composant de gestion des entreprises

function EnterpriseManagement({ onClose: _onClose }: { onClose: () => void }) {

  const { enterprises, currentEnterpriseId, updateEnterprise: _updateEnterprise, deleteEnterprise } = useEnterprise();

  const { t } = useLocale();

  const [editingId, setEditingId] = useState<string | null>(null);



  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (confirm(t('enterprise.confirmDelete', { defaultValue: 'Êtes-vous sûr de vouloir supprimer cette entreprise ?' }))) {

      await deleteEnterprise(id);

    }

  };



  return (

    <div className="space-y-4">

      {enterprises.map((enterprise) => (

        <div key={enterprise.id} className="p-4 border rounded-lg space-y-2">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <span className="text-2xl">{getCountryFlag(enterprise.countryCode)}</span>

              <div>

                <h3 className="font-semibold">{enterprise.name}</h3>

                <p className="text-sm text-muted-foreground">{enterprise.registrationNumber}</p>

              </div>

              {enterprise.id === currentEnterpriseId && (

                <Badge variant="default" className="ml-2">

                  {t('enterprise.current', { defaultValue: 'Actuelle' })}

                </Badge>

              )}

            </div>

            <div className="flex gap-2">

              <Button

                variant="outline"

                size="sm"

                onClick={() => setEditingId(editingId === enterprise.id ? null : enterprise.id)}

              >

                {editingId === enterprise.id ? t('common.cancel', { defaultValue: 'Annuler' }) : t('common.edit', { defaultValue: 'Modifier' })}

              </Button>

              <Button

                variant="destructive"

                size="sm"

                onClick={() => handleDelete(enterprise.id)}

                disabled={enterprises.length === 1}

              >

                {t('common.delete', { defaultValue: 'Supprimer' })}

              </Button>

            </div>

          </div>

          

          {editingId === enterprise.id && (

            <div className="pt-4 border-t">

              <EnterpriseForm

                enterprise={enterprise}

                onSuccess={() => setEditingId(null)}

                onCancel={() => setEditingId(null)}

              />

            </div>

          )}

          

          {editingId !== enterprise.id && (

            <div className="grid grid-cols-2 gap-4 text-sm">

              <div>

                <span className="text-muted-foreground">{t('enterprise.registrationNumber', { defaultValue: 'N° d\'immatriculation' })}:</span>

                <p className="font-medium">{enterprise.registrationNumber}</p>

              </div>

              <div>

                <span className="text-muted-foreground">{t('enterprise.vatNumber', { defaultValue: 'N° TVA' })}:</span>

                <p className="font-medium">{enterprise.vatNumber || '-'}</p>

              </div>

              <div>

                <span className="text-muted-foreground">{t('enterprise.taxRegime', { defaultValue: 'Régime fiscal' })}:</span>

                <p className="font-medium">{getTaxRegimeLabel(enterprise.taxRegime.type)}</p>

              </div>

              <div>

                <span className="text-muted-foreground">{t('enterprise.address', { defaultValue: 'Adresse' })}:</span>

                <p className="font-medium">{enterprise.address.city}, {enterprise.address.country}</p>

              </div>

            </div>

          )}

        </div>

      ))}

    </div>

  );

}



function getCountryFlag(countryCode: string) {

  const flags = {

    FR: '🇫🇷',

    BE: '🇧🇪',

    CH: '🇨🇭',

    LU: '🇱🇺'

  };

  const code = countryCode as keyof typeof flags;
  return flags[code] || '🏢';

}



function getTaxRegimeLabel(type: string) {

  const labels = {

    realNormal: 'Réel Normal',

    realSimplified: 'Réel Simplifié',

    microEnterprise: 'Micro-entreprise',

    other: 'Autre'

  };

  const labelType = type as keyof typeof labels;
  return labels[labelType] || type;

}
