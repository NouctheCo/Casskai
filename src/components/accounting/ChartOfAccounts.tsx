import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAccounting } from '@/hooks/useAccounting';
import { useCompanies } from '@/hooks/useCompanies';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { PlusCircle, Edit3, Search, Filter, AlertTriangle, ListTree, Banknote, Landmark, Briefcase, Users, Coins, Package, Receipt } from 'lucide-react';
import { defaultChartOfAccounts } from '@/utils/defaultAccountingData';

const ACCOUNT_CLASSES = [
  { value: '1', labelKey: 'accountClasses.1', icon: Landmark }, // Capitaux
  { value: '2', labelKey: 'accountClasses.2', icon: Briefcase }, // Immobilisations
  { value: '3', labelKey: 'accountClasses.3', icon: Package }, // Stocks et en-cours
  { value: '4', labelKey: 'accountClasses.4', icon: Users }, // Tiers
  { value: '5', labelKey: 'accountClasses.5', icon: Coins }, // Financiers
  { value: '6', labelKey: 'accountClasses.6', icon: Receipt }, // Charges
  { value: '7', labelKey: 'accountClasses.7', icon: Banknote }, // Produits
];

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];

const AccountForm = ({ account, onSave, onCancel, currentEnterpriseId, existingAccountNumbers }) => {
  const { t } = useLocale();
  const [formData, setFormData] = useState({
    account_number: account?.account_number || '',
    name: account?.name || '',
    type: account?.type || '',
    description: account?.description || '',
    is_active: account?.is_active !== undefined ? account.is_active : true,
    currency: account?.currency || 'EUR',
    class: account?.class ? String(account.class) : '',
    parent_code: account?.parent_code || '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (account) {
      setFormData({
        account_number: account.account_number || '',
        name: account.name || '',
        type: account.type || '',
        description: account.description || '',
        is_active: account.is_active !== undefined ? account.is_active : true,
        currency: account.currency || 'EUR',
        class: account.class ? String(account.class) : '',
        parent_code: account.parent_code || '',
      });
    } else {
      setFormData({ account_number: '', name: '', type: '', description: '', is_active: true, currency: 'EUR', class: '', parent_code: '' });
    }
  }, [account]);

  const validate = () => {
    const newErrors = {};
    if (!formData.account_number.trim()) newErrors.account_number = t('fieldRequired');
    else if (existingAccountNumbers.includes(formData.account_number) && (!account || account.account_number !== formData.account_number)) {
      newErrors.account_number = t('accountNumberUniqueError');
    }
    if (!formData.name.trim()) newErrors.name = t('fieldRequired');
    if (!formData.type) newErrors.type = t('fieldRequired');
    if (!formData.currency) newErrors.currency = t('fieldRequired');
    if (!formData.class) newErrors.class = t('fieldRequired');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({ ...formData, class: parseInt(formData.class), company_id: currentEnterpriseId });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="account_number">{t('accountNumber')}</label>
          <Input id="account_number" value={formData.account_number} onChange={(e) => handleChange('account_number', e.target.value)} placeholder="101000" />
          {errors.account_number && <p className="text-sm text-destructive mt-1">{errors.account_number}</p>}
        </div>
        <div>
          <label htmlFor="name">{t('accountName')}</label>
          <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder={t('capitalPlaceholder')} />
          {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="class">{t('class')}</label>
          <Select value={formData.class} onValueChange={(value) => handleChange('class', value)}>
            <SelectTrigger id="class">
              <SelectValue placeholder={t('selectAccountClass')} />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_CLASSES.map(ac => (
                <SelectItem key={ac.value} value={ac.value}>{ac.value} - {t(ac.labelKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.class && <p className="text-sm text-destructive mt-1">{errors.class}</p>}
        </div>
        <div>
          <label htmlFor="type">{t('type')}</label>
          <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
            <SelectTrigger id="type">
              <SelectValue placeholder={t('selectAccountType')} />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map(type => (
                <SelectItem key={type} value={type}>{t(`accountTypes.${type}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-destructive mt-1">{errors.type}</p>}
        </div>
        <div>
          <label htmlFor="currency">{t('currency')}</label>
          <Input id="currency" value={formData.currency} onChange={(e) => handleChange('currency', e.target.value.toUpperCase())} placeholder="EUR" />
          {errors.currency && <p className="text-sm text-destructive mt-1">{errors.currency}</p>}
        </div>
         <div>
          <label htmlFor="parent_code">{t('parentAccountCodeOptional')}</label>
          <Input id="parent_code" value={formData.parent_code} onChange={(e) => handleChange('parent_code', e.target.value)} placeholder="100000" />
        </div>
      </div>
      <div>
        <label htmlFor="description">{t('descriptionOptional')}</label>
        <Input id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder={t('accountDescriptionPlaceholder')} />
      </div>
      <div className="flex items-center space-x-2">
        <Switch 
          id="is_active" 
          checked={formData.is_active} 
          onCheckedChange={(checked) => handleChange('is_active', checked)} 
        />
        <label htmlFor="is_active">{t('status')}: {formData.is_active ? t('active') : t('inactive')}</label>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('cancel')}</Button>
        <Button type="submit">{t('save')}</Button>
      </div>
    </form>
  );
};

const ChartOfAccounts = ({ currentEnterpriseId: propCurrentEnterpriseId }) => {
  const { t } = useLocale();
  const { user } = useAuth();
  const { currentCompany } = useCompanies();
  const companyId = propCurrentEnterpriseId || currentCompany?.id;
  const { toast } = useToast();

  // Utiliser le nouveau hook useAccounting
  const {
    accounts,
    loading,
    error,
    createAccount,
    fetchAccounts,
    refresh
  } = useAccounting(companyId);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  // Fetch accounts when filters change
  useEffect(() => {
    if (companyId && fetchAccounts) {
      fetchAccounts({
        page,
        pageSize: limit,
        searchTerm,
        classFilter: classFilter || undefined,
        typeFilter: typeFilter || undefined,
        sortBy: 'account_number',
        sortDirection: 'asc'
      });
    }
  }, [companyId, page, limit, searchTerm, classFilter, typeFilter, fetchAccounts]);

  const handleSaveAccount = async (formData) => {
    try {
      if (editingAccount) {
        // TODO: Implémenter updateAccount dans useAccounting
        toast({ variant: 'destructive', title: t('error'), description: 'Update functionality not yet implemented' });
        return;
      } else {
        await createAccount(formData);
        toast({ title: t('success'), description: t('accountCreatedSuccess') });
        refresh();
        setIsFormOpen(false);
        setEditingAccount(null);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: t('error'), description: error.message || error });
    }
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };
  
  const handleImportDefaults = async () => {
    if (!companyId) return;
    try {
      // TODO: Implémenter importStandardChartOfAccounts dans useAccounting
      toast({ variant: 'destructive', title: t('error'), description: 'Import functionality not yet implemented. Please create accounts manually for now.' });
    } catch (error) {
      toast({ variant: 'destructive', title: t('error'), description: error.message || t('defaultChartImportError') });
    }
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleClassFilterChange = (value) => setClassFilter(value === "ALL_CLASSES" ? "" : value);
  const handleTypeFilterChange = (value) => setTypeFilter(value === "ALL_TYPES" ? "" : value);

  const totalAccounts = accounts?.length || 0;
  const totalPages = Math.ceil(totalAccounts / limit);

  const renderSkeleton = () => (
    Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={`skeleton-account-${i}`}>
        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
      </TableRow>
    ))
  );

  if (!companyId && !loading) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-center p-8">
         <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">{t('noCompanySelectedTitle')}</h2>
        <p className="text-muted-foreground">{t('noCompanySelectedMessage')}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center">
              <ListTree className="mr-2 h-6 w-6 text-primary" /> 
              {t('chartOfAccounts')}
            </CardTitle>
            <CardDescription>{t('chartOfAccountsDescription')}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> {t('newAccount')}
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-col md:flex-row gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder={t('searchAccountsPlaceholder')} value={searchTerm} onChange={handleSearchChange} className="pl-8 w-full" />
          </div>
          <Select value={classFilter} onValueChange={handleClassFilterChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t('filterByClass')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_CLASSES">{t('allClasses')}</SelectItem>
              {ACCOUNT_CLASSES.map(ac => (
                <SelectItem key={ac.value} value={ac.value}>{ac.value} - {t(ac.labelKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
           <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t('filterByType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_TYPES">{t('allTypes')}</SelectItem>
              {ACCOUNT_TYPES.map(type => (
                 <SelectItem key={type} value={type}>{t(`accountTypes.${type}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('accountNumber')}</TableHead>
                <TableHead>{t('accountName')}</TableHead>
                <TableHead>{t('type')}</TableHead>
                <TableHead>{t('class')}</TableHead>
                <TableHead>{t('balance')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderSkeleton()}</TableBody>
          </Table>
        ) : !accounts || accounts.length === 0 ? (
          <div className="text-center py-10">
            <ListTree className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{t('noAccountsYet')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('startByCreatingAccountOrImport')}</p>
            <div className="mt-6 flex justify-center gap-2">
              <Button onClick={() => {setEditingAccount(null); setIsFormOpen(true);}}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('newAccount')}
              </Button>
              <Button variant="outline" onClick={handleImportDefaults}>
                {t('importDefaultChart')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">{t('accountNumber')}</TableHead>
                  <TableHead className="font-semibold">{t('accountName')}</TableHead>
                  <TableHead className="font-semibold">{t('type')}</TableHead>
                  <TableHead className="font-semibold">{t('class')}</TableHead>
                   <TableHead className="font-semibold">{t('balance')}</TableHead>
                  <TableHead className="font-semibold">{t('status')}</TableHead>
                  <TableHead className="text-right font-semibold">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => {
                  const AccClassIcon = ACCOUNT_CLASSES.find(ac => ac.value === (account.class ? String(account.class) : ''))?.icon || ListTree;
                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono">{account.account_number}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{t(`accountTypes.${account.type}`)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <AccClassIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {account.class} - {t(ACCOUNT_CLASSES.find(ac => ac.value === (account.class ? String(account.class) : ''))?.labelKey || 'Unknown')}
                        </div>
                      </TableCell>
                      <TableCell>{parseFloat(account.balance || 0).toFixed(2)} {account.currency}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${account.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                          {account.is_active ? t('active') : t('inactive')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditAccount(account)} className="h-8 w-8">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex justify-between items-center border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1 || loading}
          >
            {t('previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('pagination.showing', { 
              start: Math.min((page - 1) * limit + 1, totalAccounts), 
              end: Math.min(page * limit, totalAccounts), 
              total: totalAccounts 
            })}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages || loading}
          >
            {t('next')}
          </Button>
        </CardFooter>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{editingAccount ? t('editAccount') : t('newAccount')}</h2>
              <AccountForm
                account={editingAccount}
                onSave={handleSaveAccount}
                onCancel={() => { setIsFormOpen(false); setEditingAccount(null); }}
                currentEnterpriseId={companyId}
                existingAccountNumbers={accounts.map(acc => acc.account_number)}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ChartOfAccounts;