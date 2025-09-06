// @ts-nocheck
import React from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search, X } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';

const JournalEntriesListFilterSection = ({ 
  localFilters, 
  handleFilterChange, 
  applyFilters, 
  clearFilters,
  accounts,
  journals
}) => {
  const { t } = useLocale();

  return (
    <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium mb-1">{t('dateFrom')}</label>
            <DatePicker
              value={localFilters.dateFrom ? new Date(localFilters.dateFrom) : null}
              onChange={(date) => handleFilterChange('dateFrom', date ? date.toISOString().split('T')[0] : '')}
              placeholder={t('dateFrom')}
              className=""
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium mb-1">{t('dateTo')}</label>
            <DatePicker
              value={localFilters.dateTo ? new Date(localFilters.dateTo) : null}
              onChange={(date) => handleFilterChange('dateTo', date ? date.toISOString().split('T')[0] : '')}
              placeholder={t('dateTo')}
              className=""
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
          <div>
            <label htmlFor="journalId" className="block text-sm font-medium mb-1">{t('journal')}</label>
            <Select value={localFilters.journalId} onValueChange={(value) => handleFilterChange('journalId', value)}>
              <SelectTrigger id="journalId">
                <SelectValue placeholder={t('allJournals')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allJournals')}</SelectItem>
                {journals.map(journal => (
                  <SelectItem key={journal.id} value={journal.id}>{journal.code} - {journal.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="accountId" className="block text-sm font-medium mb-1">{t('accountNumber')}</label>
            <Select value={localFilters.accountId} onValueChange={(value) => handleFilterChange('accountId', value)}>
              <SelectTrigger id="accountId">
                <SelectValue placeholder={t('allAccounts')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allAccounts')}</SelectItem>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>{account.account_number} - {account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <label htmlFor="reference" className="block text-sm font-medium mb-1">{t('reference')}</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="reference"
              placeholder={t('reference')}
              value={localFilters.reference}
              onChange={(e) => handleFilterChange('reference', e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="relative flex-grow">
          <label htmlFor="description" className="block text-sm font-medium mb-1">{t('description')}</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="description"
              placeholder={t('description')}
              value={localFilters.description}
              onChange={(e) => handleFilterChange('description', e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" /> {t('clearFilters')}
        </Button>
        <Button onClick={applyFilters}>
          <Filter className="mr-2 h-4 w-4" /> {t('applyFilters')}
        </Button>
      </div>
    </div>
  );
};

export default JournalEntriesListFilterSection;