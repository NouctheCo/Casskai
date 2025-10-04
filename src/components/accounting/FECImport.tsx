import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useLocale } from '@/contexts/LocaleContext';
import { FECParser } from '@/services/fecParser';
import { fecImportService } from '@/services/fecImportService';
import { Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import FECImportDropzone from './FECImportDropzone';
import FECImportSummary from './FECImportSummary';

const FECImport = ({ currentEnterpriseId }) => {
  const { t } = useLocale();
  const { toast } = useToast();
  
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  
  const handleFileSelected = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setParsing(true);
    setParsedData(null);
    setImportResult(null);
    
    try {
      const result = await FECParser.parseFEC(selectedFile);
      
      if (result.success) {
        // Transform to old format for compatibility with UI
        const transformedData = {
          entries: result.entries,
          accounts: new Map(),
          journals: [...new Set(result.entries.map(e => e.journalCode))],
          summary: {
            errors: result.errors,
            warnings: result.warnings,
            numEntries: result.validRows,
            numAccounts: [...new Set(result.entries.map(e => e.accountNumber))].length,
            numJournals: [...new Set(result.entries.map(e => e.journalCode))].length,
            totalDebit: result.entries.reduce((sum, e) => sum + e.debit, 0).toLocaleString(),
            totalCredit: result.entries.reduce((sum, e) => sum + e.credit, 0).toLocaleString(),
            balance: (result.entries.reduce((sum, e) => sum + e.debit, 0) - result.entries.reduce((sum, e) => sum + e.credit, 0)).toFixed(2),
            unbalancedEntries: []
          }
        };
        
        setParsedData(transformedData);
      } else {
        setParsedData({
          entries: [],
          accounts: new Map(),
          journals: [],
          summary: {
            errors: result.errors,
            numEntries: 0
          }
        });
      }
    } catch (error) {
      console.error('Error parsing FEC file:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error.message || t('fecImport.error.parsingFailed', { defaultValue: 'Failed to parse the FEC file' })
      });
      setParsedData({
        entries: [],
        accounts: new Map(),
        journals: [],
        summary: {
          errors: [{ message: error.message || 'Unknown parsing error' }],
          numEntries: 0
        }
      });
    } finally {
      setParsing(false);
    }
  }, [t, toast]);
  
  const handleImport = async () => {
    if (!parsedData || !currentEnterpriseId) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fecImport.error.noDataOrCompany', { defaultValue: 'No data to import or no company selected' })
      });
      return;
    }
    
    if (parsedData.summary.errors && parsedData.summary.errors.length > 0 && parsedData.summary.numEntries === 0) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('fecImport.error.cannotImportWithErrors', { defaultValue: 'Cannot import data with errors and no valid entries' })
      });
      return;
    }
    
    setImporting(true);
    setImportProgress(10);
    
    try {
      // Simuler une progression
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      // Importer les données en utilisant la nouvelle méthode
      const result = await fecImportService.parseAndImportFEC(file, currentEnterpriseId);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      if (result.success) {
        toast({
          title: t('success'),
          description: t('fecImport.import.success', { 
            defaultValue: 'FEC data imported successfully',
            accounts: result.summary.accountsCreated,
            journals: result.summary.journalsCreated,
            entries: result.summary.entriesCreated
          })
        });
        setImportResult(result);
      } else {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: result.error || t('fecImport.import.failed', { defaultValue: 'Failed to import FEC data' })
        });
      }
    } catch (error) {
      console.error('Error importing FEC data:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error.message || t('fecImport.import.failed', { defaultValue: 'Failed to import FEC data' })
      });
    } finally {
      setImporting(false);
    }
  };
  
  const resetState = () => {
    setFile(null);
    setParsedData(null);
    setImportResult(null);
    setImportProgress(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('fec', { defaultValue: 'FEC' })}</CardTitle>
        <CardDescription>
          {t('fecImport.description', { defaultValue: 'Import your FEC (Fichier des Écritures Comptables) file to create journal entries, accounts, and journals.' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!file && (
          <FECImportDropzone 
            onFileSelected={handleFileSelected} 
            isProcessing={parsing}
          />
        )}
        
        {parsing && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span>{t('fecImport.parsing', { defaultValue: 'Parsing file...' })}</span>
          </div>
        )}
        
        {importing && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span>{t('fecImport.importing', { defaultValue: 'Importing data...' })}</span>
            <Progress value={importProgress} className="w-full max-w-md" />
          </div>
        )}
        
        {file && !parsing && !importing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600/10 rounded-full">
                  <div className="w-6 h-6 text-primary">{file.name.split('.').pop().toUpperCase()}</div>
                </div>
                <div>
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={resetState} disabled={parsing || importing}>
                {t('fecImport.button.clearFile', { defaultValue: "Clear" })}
              </Button>
            </div>
            
            {parsedData && (
              <>
                {parsedData.summary.errors && parsedData.summary.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('fecImport.feedback.errors', { defaultValue: 'Parsing Errors' })}</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">{t('fecImport.feedback.errorsFound', { count: parsedData.summary.errors.length, defaultValue: `${parsedData.summary.errors.length} errors found in the file.` })}</p>
                      <ul className="list-disc pl-5 text-sm space-y-1 max-h-32 overflow-y-auto">
                        {parsedData.summary.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>{error.message || error}</li>
                        ))}
                        {parsedData.summary.errors.length > 5 && (
                          <li>... {t('fecImport.feedback.moreErrors', { count: parsedData.summary.errors.length - 5, defaultValue: `and ${parsedData.summary.errors.length - 5} more errors` })}</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                {parsedData.summary.unbalancedEntries && parsedData.summary.unbalancedEntries.length > 0 && (
                  <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t('fecImport.feedback.unbalancedEntries', { defaultValue: 'Unbalanced Entries' })}</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">{t('fecImport.feedback.unbalancedEntriesFound', { count: parsedData.summary.unbalancedEntries.length, defaultValue: `${parsedData.summary.unbalancedEntries.length} unbalanced entries found.` })}</p>
                      <ul className="list-disc pl-5 text-sm space-y-1 max-h-32 overflow-y-auto">
                        {parsedData.summary.unbalancedEntries.slice(0, 3).map((entry, index) => (
                          <li key={index}>
                            {t('fecImport.feedback.unbalancedEntry', { 
                              key: entry.key, 
                              difference: entry.difference,
                              defaultValue: `Entry ${entry.key}: Difference of ${entry.difference}`
                            })}
                          </li>
                        ))}
                        {parsedData.summary.unbalancedEntries.length > 3 && (
                          <li>... {t('fecImport.feedback.moreUnbalanced', { count: parsedData.summary.unbalancedEntries.length - 3, defaultValue: `and ${parsedData.summary.unbalancedEntries.length - 3} more unbalanced entries` })}</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                {parsedData.summary.numEntries > 0 && (
                  <Alert variant={parsedData.summary.errors.length > 0 ? "warning" : "default"}>
                    {parsedData.summary.errors.length > 0 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    <AlertTitle>{t('fecImport.feedback.summary', { defaultValue: 'File Summary' })}</AlertTitle>
                    <AlertDescription>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <p className="text-sm font-medium">{t('fecImport.feedback.company', { defaultValue: 'Company' })}</p>
                          <p className="text-sm">{parsedData.summary.companyName || t('fecImport.data.unavailable')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t('fecImport.feedback.siren', { defaultValue: 'SIREN' })}</p>
                          <p className="text-sm">{parsedData.summary.siren || t('fecImport.data.unavailable')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t('fecImport.feedback.period', { defaultValue: 'Period' })}</p>
                          <p className="text-sm">{parsedData.summary.periodStart} - {parsedData.summary.periodEnd}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t('fecImport.feedback.entries', { defaultValue: 'Entries' })}</p>
                          <p className="text-sm">{parsedData.summary.numEntries}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t('fecImport.feedback.accounts', { defaultValue: 'Accounts' })}</p>
                          <p className="text-sm">{parsedData.summary.numAccounts}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t('fecImport.feedback.journals', { defaultValue: 'Journals' })}</p>
                          <p className="text-sm">{parsedData.summary.numJournals}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t('fecImport.feedback.totalDebit', { defaultValue: 'Total Debit' })}</p>
                          <p className="text-sm">{parsedData.summary.totalDebit}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t('fecImport.feedback.totalCredit', { defaultValue: 'Total Credit' })}</p>
                          <p className="text-sm">{parsedData.summary.totalCredit}</p>
                        </div>
                      </div>
                      {Math.abs(parseFloat(parsedData.summary.balance)) > 0.01 && (
                        <Alert variant="warning" className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>{t('fecImport.feedback.unbalanced', { defaultValue: 'Unbalanced Entries' })}</AlertTitle>
                          <AlertDescription>
                            {t('fecImport.feedback.balanceDifference', { balance: parsedData.summary.balance, defaultValue: `The entries are not balanced. Difference: ${parsedData.summary.balance}` })}
                          </AlertDescription>
                        </Alert>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                {!parsedData.summary.numEntries && !parsedData.summary.errors.length && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>{t('fecImport.feedback.noData', { defaultValue: 'No Data' })}</AlertTitle>
                    <AlertDescription>
                      {t('fecImport.feedback.noDataFound', { defaultValue: 'No valid entries were found in the file.' })}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button
                  onClick={handleImport}
                  disabled={importing || (parsedData.summary.errors.length > 0 && parsedData.summary.numEntries === 0)}
                  className="w-full"
                  size="lg"
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t('fecImport.button.importing', { defaultValue: "Importing Data..." })}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {t('fecImport.button.startImport', { defaultValue: "Start Import" })}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
        
        {importResult && (
          <Alert variant={importResult.success ? "success" : "destructive"}>
            {importResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertTitle>
              {importResult.success 
                ? t('fecImport.import.successTitle', { defaultValue: 'Import Successful' })
                : t('fecImport.import.errorTitle', { defaultValue: 'Import Failed' })}
            </AlertTitle>
            <AlertDescription>
              {importResult.success ? (
                <div className="space-y-2">
                  <p>{t('fecImport.import.successDescription', { defaultValue: 'The FEC data has been successfully imported.' })}</p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>{t('fecImport.import.accountsCreated', { count: importResult.summary.accountsCreated, defaultValue: `${importResult.summary.accountsCreated} accounts created` })}</li>
                    <li>{t('fecImport.import.journalsCreated', { count: importResult.summary.journalsCreated, defaultValue: `${importResult.summary.journalsCreated} journals created` })}</li>
                    <li>{t('fecImport.import.entriesCreated', { count: importResult.summary.entriesCreated, defaultValue: `${importResult.summary.entriesCreated} journal entries created` })}</li>
                    {importResult.summary.entriesWithErrors > 0 && (
                      <li className="text-amber-600">{t('fecImport.import.entriesWithErrors', { count: importResult.summary.entriesWithErrors, defaultValue: `${importResult.summary.entriesWithErrors} entries had errors` })}</li>
                    )}
                  </ul>
                </div>
              ) : (
                importResult.error
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {parsedData && !parsing && !importing && parsedData.summary.numEntries > 0 && (
          <FECImportSummary parsedData={parsedData} />
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetState} disabled={parsing || importing}>
          {t('fecImport.button.reset', { defaultValue: "Reset" })}
        </Button>
        {parsedData && !parsing && !importing && !importResult && (
          <Button onClick={handleImport} disabled={parsedData.summary.numEntries === 0}>
            {t('fecImport.button.startImport', { defaultValue: "Start Import" })}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default FECImport;