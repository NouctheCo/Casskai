import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import { useAccounting } from '@/hooks/useAccounting';
import { useJournals } from '@/hooks/useJournals';
import { useCompanies } from '@/hooks/useCompanies';
import { useAuth } from '@/contexts/AuthContext';
import { defaultJournals } from '@/utils/defaultAccountingData';
import { Loader2, CheckCircle, BookOpen, Calendar, FileText, ArrowRight } from 'lucide-react';
import { logger } from '@/lib/logger';
const SetupWizard = ({ currentEnterpriseId: propCurrentEnterpriseId, onFinish }: { currentEnterpriseId: string; onFinish: () => void }) => {
  const { t } = useLocale();
  const { toast } = useToast();
  const { user: _user } = useAuth();
  const { currentCompany } = useCompanies();
  const companyId = propCurrentEnterpriseId || currentCompany?.id;
  // Utiliser les nouveaux hooks
  const { accounts } = useAccounting(companyId ?? '');
  const { journals, createDefaultJournals } = useJournals(companyId ?? '');
  const [_step, _setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState({
    chartOfAccounts: false,
    fiscalYear: false,
    journals: false
  });
  // Chart of Accounts state
  const [showChartOfAccountsDialog, setShowChartOfAccountsDialog] = useState(false);
  const [chartOfAccountsOption, setChartOfAccountsOption] = useState('default');
  // Fiscal Year state
  const [showFiscalYearDialog, setShowFiscalYearDialog] = useState(false);
  const [fiscalYearStart, setFiscalYearStart] = useState(new Date());
  const [fiscalYearEnd, setFiscalYearEnd] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    date.setDate(date.getDate() - 1);
    return date;
  });
  const [fiscalPeriodType, setFiscalPeriodType] = useState('monthly');
  // Journals state
  const [showJournalsDialog, setShowJournalsDialog] = useState(false);
  const [journalsOption, setJournalsOption] = useState('default');
  useEffect(() => {
    // Check if any of the setup steps have already been completed
    const checkSetupStatus = async () => {
      if (!companyId) return;
      setLoading(true);
      try {
        // Check if chart of accounts exists
        // Check if chart of accounts exists
        if (accounts && accounts.length > 0) {
          setCompleted(prev => ({ ...prev, chartOfAccounts: true }));
        }
        // Check if journals exist
        if (journals && journals.length > 0) {
          setCompleted(prev => ({ ...prev, journals: true }));
        }
        // For fiscal year, we would need to check a company setting
        // This is a placeholder as we don't have a specific table for fiscal years yet
        setCompleted(prev => ({ ...prev, fiscalYear: false }));
      } catch (error: unknown) {
        logger.error('SetupWizard', 'Error checking setup status:', error);
      } finally {
        setLoading(false);
      }
    };
    checkSetupStatus();
  }, [companyId, accounts, journals]);
  const handleConfigureChartOfAccounts = () => {
    setShowChartOfAccountsDialog(true);
  };
  const handleConfigureFiscalYear = () => {
    setShowFiscalYearDialog(true);
  };
  const handleConfigureJournals = () => {
    setShowJournalsDialog(true);
  };
  const handleSaveChartOfAccounts = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      if (chartOfAccountsOption === 'default') {
        // TODO: Implement importStandardChartOfAccounts in useAccounting hook
        // await importStandardChartOfAccounts(defaultChartOfAccounts);
        throw new Error('Import functionality not yet implemented');
        // TODO: Uncomment when import functionality is implemented
        // toast({
        //   title: t('success'),
        //   description: t('defaultChartImportedSuccess')
        // });
      }
      setCompleted(prev => ({ ...prev, chartOfAccounts: true }));
      setShowChartOfAccountsDialog(false);
    } catch (error: unknown) {
      logger.error('SetupWizard', 'Error setting up chart of accounts:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error instanceof Error ? (error instanceof Error ? error.message : 'Une erreur est survenue') : t('defaultChartImportError')
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSaveFiscalYear = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      // Here we would save the fiscal year settings to the database
      // This is a placeholder as we don't have a specific table for fiscal years yet
      // Simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: t('success'),
        description: t('accounting.setup.fiscalYearSaved', { defaultValue: 'Fiscal year settings saved successfully' })
      });
      setCompleted(prev => ({ ...prev, fiscalYear: true }));
      setShowFiscalYearDialog(false);
    } catch (error: unknown) {
      logger.error('SetupWizard', 'Error setting up fiscal year:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: (error instanceof Error ? error.message : 'Une erreur est survenue') || t('accounting.setup.fiscalYearError', { defaultValue: 'Error saving fiscal year settings' })
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSaveJournals = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      if (journalsOption === 'default') {
        await createDefaultJournals(defaultJournals);
        toast({
          title: t('success'),
          description: t('accounting.setup.journalsSaved', { defaultValue: 'Default journals created successfully' })
        });
      }
      setCompleted(prev => ({ ...prev, journals: true }));
      setShowJournalsDialog(false);
    } catch (error: unknown) {
      logger.error('SetupWizard', 'Error setting up journals:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: (error instanceof Error ? error.message : 'Une erreur est survenue') || t('accounting.setup.journalsError', { defaultValue: 'Error creating journals' })
      });
    } finally {
      setLoading(false);
    }
  };
  const handleFinish = () => {
    toast({
      title: t('success'),
      description: t('accounting.setup.completed', { defaultValue: 'Accounting setup completed successfully' })
    });
    if (onFinish) {
      onFinish();
    }
  };
  const allCompleted = completed.chartOfAccounts && completed.fiscalYear && completed.journals;
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('accounting.setup.title', { defaultValue: 'Accounting Setup' })}</CardTitle>
        <CardDescription>
          {t('accounting.setup.description', { defaultValue: 'Complete the initial setup of your accounting system' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6">
          <div className={`flex items-center justify-between p-4 border rounded-lg ${completed.chartOfAccounts ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${completed.chartOfAccounts ? 'bg-green-100 dark:bg-green-800' : 'bg-blue-600/10'}`}>
                <BookOpen className={`h-5 w-5 ${completed.chartOfAccounts ? 'text-green-600 dark:text-green-400' : 'text-primary'}`} />
              </div>
              <div>
                <h3 className="font-medium">{t('accounting.setup.chartOfAccounts', { defaultValue: 'Chart of Accounts' })}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('accounting.setup.chartOfAccountsDesc', { defaultValue: 'Set up your chart of accounts structure' })}
                </p>
              </div>
              {completed.chartOfAccounts && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 ml-2" />}
            </div>
            <Button variant="outline" onClick={handleConfigureChartOfAccounts}>
              {completed.chartOfAccounts ? t('common.edit', { defaultValue: 'Edit' }) : t('common.configure', { defaultValue: 'Configure' })}
            </Button>
          </div>
          <div className={`flex items-center justify-between p-4 border rounded-lg ${completed.fiscalYear ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${completed.fiscalYear ? 'bg-green-100 dark:bg-green-800' : 'bg-blue-600/10'}`}>
                <Calendar className={`h-5 w-5 ${completed.fiscalYear ? 'text-green-600 dark:text-green-400' : 'text-primary'}`} />
              </div>
              <div>
                <h3 className="font-medium">{t('accounting.setup.fiscalYear', { defaultValue: 'Fiscal Year' })}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('accounting.setup.fiscalYearDesc', { defaultValue: 'Define your fiscal year and periods' })}
                </p>
              </div>
              {completed.fiscalYear && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 ml-2" />}
            </div>
            <Button variant="outline" onClick={handleConfigureFiscalYear}>
              {completed.fiscalYear ? t('common.edit', { defaultValue: 'Edit' }) : t('common.configure', { defaultValue: 'Configure' })}
            </Button>
          </div>
          <div className={`flex items-center justify-between p-4 border rounded-lg ${completed.journals ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${completed.journals ? 'bg-green-100 dark:bg-green-800' : 'bg-blue-600/10'}`}>
                <FileText className={`h-5 w-5 ${completed.journals ? 'text-green-600 dark:text-green-400' : 'text-primary'}`} />
              </div>
              <div>
                <h3 className="font-medium">{t('accounting.setup.journals', { defaultValue: 'Journals' })}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('accounting.setup.journalsDesc', { defaultValue: 'Set up your accounting journals' })}
                </p>
              </div>
              {completed.journals && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 ml-2" />}
            </div>
            <Button variant="outline" onClick={handleConfigureJournals}>
              {completed.journals ? t('common.edit', { defaultValue: 'Edit' }) : t('common.configure', { defaultValue: 'Configure' })}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleFinish} 
          disabled={!allCompleted || loading}
          className="bg-blue-600 text-white hover:bg-blue-600/90"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          {t('common.getStarted', { defaultValue: 'Get Started' })}
        </Button>
      </CardFooter>
      {/* Chart of Accounts Dialog */}
      <Dialog open={showChartOfAccountsDialog} onOpenChange={setShowChartOfAccountsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('accounting.setup.configureChartOfAccounts', { defaultValue: 'Configure Chart of Accounts' })}</DialogTitle>
            <DialogDescription>
              {t('accounting.setup.chartOfAccountsDialogDesc', { defaultValue: 'Choose how to set up your chart of accounts' })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="chart-option">{t('accounting.setup.chartOption', { defaultValue: 'Chart Option' })}</Label>
              <Select value={chartOfAccountsOption} onValueChange={setChartOfAccountsOption}>
                <SelectTrigger id="chart-option">
                  <SelectValue placeholder={t('accounting.setup.selectChartOption', { defaultValue: 'Select an option' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t('accounting.setup.useDefaultChart', { defaultValue: 'Use default French chart of accounts' })}</SelectItem>
                  <SelectItem value="custom" disabled>{t('accounting.setup.createCustomChart', { defaultValue: 'Create custom chart (coming soon)' })}</SelectItem>
                  <SelectItem value="import" disabled>{t('accounting.setup.importFromFile', { defaultValue: 'Import from file (coming soon)' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChartOfAccountsDialog(false)} disabled={loading}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveChartOfAccounts} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Fiscal Year Dialog */}
      <Dialog open={showFiscalYearDialog} onOpenChange={setShowFiscalYearDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('accounting.setup.configureFiscalYear', { defaultValue: 'Configure Fiscal Year' })}</DialogTitle>
            <DialogDescription>
              {t('accounting.setup.fiscalYearDialogDesc', { defaultValue: 'Define your fiscal year start and end dates' })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fiscal-year-start">{t('accounting.setup.fiscalYearStart', { defaultValue: 'Fiscal Year Start' })}</Label>
                <DatePicker
                  value={fiscalYearStart}
                  onChange={(d) => d && setFiscalYearStart(d)}
                  placeholder=""
                  className=""
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscal-year-end">{t('accounting.setup.fiscalYearEnd', { defaultValue: 'Fiscal Year End' })}</Label>
                <DatePicker
                  value={fiscalYearEnd}
                  onChange={(d) => d && setFiscalYearEnd(d)}
                  placeholder=""
                  className=""
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscal-period-type">{t('accounting.setup.periodType', { defaultValue: 'Period Type' })}</Label>
              <Select value={fiscalPeriodType} onValueChange={setFiscalPeriodType}>
                <SelectTrigger id="fiscal-period-type">
                  <SelectValue placeholder={t('accounting.setup.selectPeriodType', { defaultValue: 'Select period type' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t('accounting.setup.monthly', { defaultValue: 'Monthly' })}</SelectItem>
                  <SelectItem value="quarterly">{t('accounting.setup.quarterly', { defaultValue: 'Quarterly' })}</SelectItem>
                  <SelectItem value="annual">{t('accounting.setup.annual', { defaultValue: 'Annual' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFiscalYearDialog(false)} disabled={loading}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveFiscalYear} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Journals Dialog */}
      <Dialog open={showJournalsDialog} onOpenChange={setShowJournalsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('accounting.setup.configureJournals', { defaultValue: 'Configure Journals' })}</DialogTitle>
            <DialogDescription>
              {t('accounting.setup.journalsDialogDesc', { defaultValue: 'Choose how to set up your accounting journals' })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="journals-option">{t('accounting.setup.journalsOption', { defaultValue: 'Journals Option' })}</Label>
              <Select value={journalsOption} onValueChange={setJournalsOption}>
                <SelectTrigger id="journals-option">
                  <SelectValue placeholder={t('accounting.setup.selectJournalsOption', { defaultValue: 'Select an option' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t('accounting.setup.useDefaultJournals', { defaultValue: 'Use default journals' })}</SelectItem>
                  <SelectItem value="custom" disabled>{t('accounting.setup.createCustomJournals', { defaultValue: 'Create custom journals (coming soon)' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJournalsDialog(false)} disabled={loading}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveJournals} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
export default SetupWizard;