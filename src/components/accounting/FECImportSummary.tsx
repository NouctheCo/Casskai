import React, { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const FECImportSummary = ({ parsedData }) => {
  const { t } = useLocale();
  const [searchTerm, setSearchTerm] = useState('');

  if (!parsedData) return null;

  const { entries, accounts, journals, entriesByJournalAndNum } = parsedData;
  
  // Limiter le nombre d'entrées affichées pour des raisons de performance
  const maxEntriesToShow = 100;
  
  // Filtrer les entrées en fonction du terme de recherche
  const filteredEntries = searchTerm 
    ? entries.filter(entry => 
        entry.EcritureLib?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.CompteNum?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.CompteLib?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.JournalCode?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : entries;
  
  const displayEntries = filteredEntries.slice(0, maxEntriesToShow);
  
  // Regrouper les entrées par journal et numéro d'écriture pour l'affichage
  const groupedEntries = [];
  if (entriesByJournalAndNum) {
    for (const [key, entriesGroup] of entriesByJournalAndNum) {
      if (searchTerm && !key.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !entriesGroup.some(e => 
            e.EcritureLib?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.CompteNum?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.CompteLib?.toLowerCase().includes(searchTerm.toLowerCase())
          )) {
        continue;
      }
      
      groupedEntries.push({
        key,
        entries: entriesGroup,
        date: entriesGroup[0]?.EcritureDate,
        description: entriesGroup[0]?.EcritureLib || '',
        totalDebit: entriesGroup.reduce((sum, e) => sum + (e.Debit || 0), 0),
        totalCredit: entriesGroup.reduce((sum, e) => sum + (e.Credit || 0), 0)
      });
    }
  }
  
  // Limiter le nombre de groupes affichés
  const displayGroups = groupedEntries.slice(0, 50);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('fecImport.summary.title', { defaultValue: 'FEC Data Preview' })}</CardTitle>
        <div className="relative w-full max-w-sm mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('fecImport.summary.search', { defaultValue: 'Search entries...' })}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="grouped">
          <TabsList className="mb-4">
            <TabsTrigger value="grouped">
              {t('fecImport.summary.groupedEntries', { defaultValue: 'Grouped Entries' })} 
              ({entriesByJournalAndNum ? entriesByJournalAndNum.length : 0})
            </TabsTrigger>
            <TabsTrigger value="entries">
              {t('fecImport.summary.entries', { defaultValue: 'Entries' })} 
              ({entries.length})
            </TabsTrigger>
            <TabsTrigger value="accounts">
              {t('fecImport.summary.accounts', { defaultValue: 'Accounts' })} 
              ({accounts.length})
            </TabsTrigger>
            <TabsTrigger value="journals">
              {t('fecImport.summary.journals', { defaultValue: 'Journals' })} 
              ({journals.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="grouped" className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('fecImport.summary.journalEntry', { defaultValue: 'Journal-Entry' })}</TableHead>
                  <TableHead>{t('fecImport.summary.date', { defaultValue: 'Date' })}</TableHead>
                  <TableHead>{t('fecImport.summary.description', { defaultValue: 'Description' })}</TableHead>
                  <TableHead className="text-right">{t('fecImport.summary.debit', { defaultValue: 'Debit' })}</TableHead>
                  <TableHead className="text-right">{t('fecImport.summary.credit', { defaultValue: 'Credit' })}</TableHead>
                  <TableHead className="text-right">{t('fecImport.summary.lines', { defaultValue: 'Lines' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayGroups.map((group, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{group.key}</TableCell>
                    <TableCell>{group.date ? group.date.toLocaleDateString() : ''}</TableCell>
                    <TableCell>{group.description}</TableCell>
                    <TableCell className="text-right">{group.totalDebit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{group.totalCredit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{group.entries.length}</TableCell>
                  </TableRow>
                ))}
                {groupedEntries.length > 50 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {t('fecImport.summary.moreEntries', { count: groupedEntries.length - 50, defaultValue: `... and ${groupedEntries.length - 50} more entries` })}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="entries" className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('fecImport.summary.journal', { defaultValue: 'Journal' })}</TableHead>
                  <TableHead>{t('fecImport.summary.entryNum', { defaultValue: 'Entry #' })}</TableHead>
                  <TableHead>{t('fecImport.summary.date', { defaultValue: 'Date' })}</TableHead>
                  <TableHead>{t('fecImport.summary.account', { defaultValue: 'Account' })}</TableHead>
                  <TableHead>{t('fecImport.summary.description', { defaultValue: 'Description' })}</TableHead>
                  <TableHead className="text-right">{t('fecImport.summary.debit', { defaultValue: 'Debit' })}</TableHead>
                  <TableHead className="text-right">{t('fecImport.summary.credit', { defaultValue: 'Credit' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayEntries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{entry.JournalCode}</TableCell>
                    <TableCell>{entry.EcritureNum}</TableCell>
                    <TableCell>{entry.EcritureDate ? entry.EcritureDate.toLocaleDateString() : ''}</TableCell>
                    <TableCell>{entry.CompteNum}</TableCell>
                    <TableCell>{entry.EcritureLib}</TableCell>
                    <TableCell className="text-right">{entry.Debit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{entry.Credit.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {filteredEntries.length > maxEntriesToShow && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {t('fecImport.summary.moreEntries', { count: filteredEntries.length - maxEntriesToShow, defaultValue: `... and ${filteredEntries.length - maxEntriesToShow} more entries` })}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="accounts" className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('fecImport.summary.accountNumber', { defaultValue: 'Account Number' })}</TableHead>
                  <TableHead>{t('fecImport.summary.accountName', { defaultValue: 'Account Name' })}</TableHead>
                  <TableHead>{t('fecImport.summary.accountType', { defaultValue: 'Type' })}</TableHead>
                  <TableHead>{t('fecImport.summary.accountClass', { defaultValue: 'Class' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts
                  .filter(([accountNum, accountInfo]) => 
                    !searchTerm || 
                    accountNum.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    accountInfo.libelle.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(([accountNum, accountInfo], index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{accountNum}</TableCell>
                      <TableCell>{accountInfo.libelle}</TableCell>
                      <TableCell>{accountInfo.type}</TableCell>
                      <TableCell>{accountInfo.class}</TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="journals" className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('fecImport.summary.journalCode', { defaultValue: 'Journal Code' })}</TableHead>
                  <TableHead>{t('fecImport.summary.journalType', { defaultValue: 'Type' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journals
                  .filter(journal => !searchTerm || journal.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((journal, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{journal}</TableCell>
                      <TableCell>{t(`fecImport.journalTypes.${journal.startsWith('BQ') ? 'bank' : journal === 'HA' ? 'purchase' : journal === 'OD' ? 'miscellaneous' : journal === 'AN' ? 'opening' : 'other'}`, { defaultValue: journal })}</TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FECImportSummary;
