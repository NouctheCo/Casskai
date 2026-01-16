import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RFAImportsPanel } from '@/components/contracts/rfa/RFAImportsPanel';
import { RFAProductGroupsPanel } from '@/components/contracts/rfa/RFAProductGroupsPanel';

type Props = {
  companyId: string;
};

export const RFAAdvancedPanel: React.FC<Props> = ({ companyId }) => {
  const { t } = useTranslation();
  return (
    <Tabs defaultValue="groups" className="space-y-4">
      <TabsList>
        <TabsTrigger value="groups">{t('contracts.rfaAdvanced.tabs.groups', 'Groupes')}</TabsTrigger>
        <TabsTrigger value="imports">{t('contracts.rfaAdvanced.tabs.imports', 'Imports')}</TabsTrigger>
      </TabsList>
      <TabsContent value="groups">
        <RFAProductGroupsPanel companyId={companyId} />
      </TabsContent>
      <TabsContent value="imports">
        <RFAImportsPanel companyId={companyId} />
      </TabsContent>
    </Tabs>
  );
};
