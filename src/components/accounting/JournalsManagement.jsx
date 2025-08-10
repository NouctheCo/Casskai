import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import { useJournals } from '@/hooks/useJournals';
import { useCompanies } from '@/hooks/useCompanies';
import { useAuth } from '@/contexts/AuthContext';
import { PlusCircle, Edit, Loader2, FileText, BarChart3, CreditCard, Banknote, Settings } from 'lucide-react';

const JournalsManagement = ({ currentEnterpriseId: propCurrentEnterpriseId }) => {
  const { t } = useLocale();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentCompany } = useCompanies();
  const companyId = propCurrentEnterpriseId || currentCompany?.id;
  
  // Utiliser le nouveau hook useJournals
  const {
    journals,
    loading,
    error,
    createJournal,
    updateJournal,
    deleteJournal,
    refresh
  } = useJournals(companyId);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'VENTE',
    description: '',
    is_active: true
  });
  
  const journalTypes = [
    { value: 'VENTE', label: t('accounting.journals.types.sale', { defaultValue: 'Sales' }), icon: Banknote },
    { value: 'ACHAT', label: t('accounting.journals.types.purchase', { defaultValue: 'Purchases' }), icon: CreditCard },
    { value: 'BANQUE', label: t('accounting.journals.types.bank', { defaultValue: 'Bank' }), icon: BarChart3 },
    { value: 'CAISSE', label: t('accounting.journals.types.cash', { defaultValue: 'Cash' }), icon: Banknote },
    { value: 'OD', label: t('accounting.journals.types.miscellaneous', { defaultValue: 'Miscellaneous' }), icon: Settings },
  ];
  
  // Show error if any
  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error
      });
    }
  }, [error, toast, t]);
  
  const handleNewJournal = () => {
    setEditingJournal(null);
    setFormData({
      code: '',
      name: '',
      type: 'VENTE',
      description: '',
      is_active: true
    });
    setShowJournalForm(true);
  };
  
  const handleEditJournal = (journal) => {
    setEditingJournal(journal);
    setFormData({
      code: journal.code,
      name: journal.name,
      type: journal.type,
      description: journal.description || '',
      is_active: journal.is_active
    });
    setShowJournalForm(true);
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSaveJournal = async () => {
    if (!formData.code || !formData.name || !formData.type) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('accounting.journals.validationError', { defaultValue: 'Please fill in all required fields' })
      });
      return;
    }
    
    try {
      if (editingJournal) {
        await updateJournal(editingJournal.id, formData);
        toast({
          title: t('success'),
          description: t('accounting.journals.updateSuccess', { defaultValue: 'Journal updated successfully' })
        });
      } else {
        await createJournal(formData);
        toast({
          title: t('success'),
          description: t('accounting.journals.createSuccess', { defaultValue: 'Journal created successfully' })
        });
      }
      
      setShowJournalForm(false);
      refresh();
    } catch (error) {
      console.error('Error saving journal:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error.message || t('accounting.journals.saveError', { defaultValue: 'Error saving journal' })
      });
    }
  };
  
  const getJournalTypeIcon = (type) => {
    const journalType = journalTypes.find(jt => jt.value === type);
    const Icon = journalType?.icon || FileText;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
  };
  
  const getJournalTypeLabel = (type) => {
    const journalType = journalTypes.find(jt => jt.value === type);
    return journalType?.label || type;
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{t('accounting.journals.title', { defaultValue: 'Accounting Journals' })}</CardTitle>
          <CardDescription>{t('accounting.journals.description', { defaultValue: 'Manage your accounting journals' })}</CardDescription>
        </div>
        <Button onClick={handleNewJournal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('accounting.journals.newJournal', { defaultValue: 'New Journal' })}
        </Button>
      </CardHeader>
      <CardContent>
        {loading && journals.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : journals.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-medium">{t('accounting.journals.noJournals', { defaultValue: 'No journals yet' })}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('accounting.journals.createFirstJournal', { defaultValue: 'Create your first journal to get started' })}</p>
            <Button onClick={handleNewJournal} className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('accounting.journals.createJournal', { defaultValue: 'Create Journal' })}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('accounting.journals.code', { defaultValue: 'Code' })}</TableHead>
                  <TableHead>{t('accounting.journals.name', { defaultValue: 'Name' })}</TableHead>
                  <TableHead>{t('accounting.journals.type', { defaultValue: 'Type' })}</TableHead>
                  <TableHead>{t('accounting.journals.description', { defaultValue: 'Description' })}</TableHead>
                  <TableHead>{t('accounting.journals.status', { defaultValue: 'Status' })}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journals.map(journal => (
                  <TableRow key={journal.id}>
                    <TableCell className="font-medium">{journal.code}</TableCell>
                    <TableCell>{journal.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getJournalTypeIcon(journal.type)}
                        <span>{getJournalTypeLabel(journal.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{journal.description || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${journal.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {journal.is_active ? t('active') : t('inactive')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditJournal(journal)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('edit')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      <Dialog open={showJournalForm} onOpenChange={setShowJournalForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingJournal 
                ? t('accounting.journals.editJournal', { defaultValue: 'Edit Journal' }) 
                : t('accounting.journals.newJournal', { defaultValue: 'New Journal' })}
            </DialogTitle>
            <DialogDescription>
              {editingJournal 
                ? t('accounting.journals.editJournalDesc', { defaultValue: 'Update journal information' }) 
                : t('accounting.journals.newJournalDesc', { defaultValue: 'Create a new accounting journal' })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t('accounting.journals.code', { defaultValue: 'Code' })}</Label>
                <Input 
                  id="code" 
                  name="code" 
                  value={formData.code} 
                  onChange={handleInputChange} 
                  placeholder="VE"
                  maxLength={10}
                  disabled={editingJournal}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">{t('accounting.journals.type', { defaultValue: 'Type' })}</Label>
                <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder={t('accounting.journals.selectType', { defaultValue: 'Select type' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {journalTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{t('accounting.journals.name', { defaultValue: 'Name' })}</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder={t('accounting.journals.namePlaceholder', { defaultValue: 'Journal name' })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('accounting.journals.description', { defaultValue: 'Description' })}</Label>
              <Input 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                placeholder={t('accounting.journals.descriptionPlaceholder', { defaultValue: 'Journal description' })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="is_active" 
                checked={formData.is_active} 
                onCheckedChange={(checked) => handleSelectChange('is_active', checked)} 
              />
              <Label htmlFor="is_active">{t('status')}: {formData.is_active ? t('active') : t('inactive')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJournalForm(false)} disabled={loading}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveJournal} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default JournalsManagement;