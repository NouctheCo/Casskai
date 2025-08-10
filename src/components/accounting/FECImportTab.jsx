import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocale } from '@/contexts/LocaleContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  Upload, 
  FileArchive, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  Archive,
  Database
} from 'lucide-react';

export default function FECImportTab() {
  const { t } = useLocale();
  const { toast } = useToast();

  // États
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Simulation des étapes de traitement
  const processingSteps = [
    { key: 'reading', label: 'Lecture du fichier...', duration: 1000 },
    { key: 'parsing', label: 'Analyse du format FEC...', duration: 2000 },
    { key: 'validation', label: 'Validation des données...', duration: 1500 },
    { key: 'preview', label: 'Génération de l\'aperçu...', duration: 800 }
  ];

  const importSteps = [
    { key: 'accounts', label: 'Création des comptes...', duration: 1200 },
    { key: 'journals', label: 'Création des journaux...', duration: 800 },
    { key: 'entries', label: 'Import des écritures...', duration: 2500 },
    { key: 'balance', label: 'Vérification des équilibres...', duration: 1000 }
  ];

  // Données simulées pour l'analyse
  const mockAnalysisResult = {
    isValid: true,
    fileInfo: {
      name: 'FEC_12345678_20240101_20241231.txt',
      size: '2.4 MB',
      lines: 1247,
      encoding: 'UTF-8'
    },
    company: {
      siren: '123456789',
      name: 'ENTREPRISE DEMO SARL',
      period: {
        start: '2024-01-01',
        end: '2024-12-31'
      }
    },
    statistics: {
      totalEntries: 342,
      totalAccounts: 87,
      totalJournals: 8,
      totalDebit: 485720.45,
      totalCredit: 485720.45,
      unbalancedEntries: 0
    },
    errors: [],
    warnings: [
      { line: 145, message: 'Compte 445660 non standard pour une TVA déductible' },
      { line: 267, message: 'Libellé vide pour l\'écriture ECR-0145' }
    ],
    preview: {
      accounts: [
        { code: '101000', name: 'Capital social', type: 'EQUITY', entries: 2 },
        { code: '411000', name: 'Clients', type: 'ASSET', entries: 45 },
        { code: '401000', name: 'Fournisseurs', type: 'LIABILITY', entries: 32 },
        { code: '512000', name: 'Banque', type: 'ASSET', entries: 78 },
        { code: '701000', name: 'Ventes', type: 'REVENUE', entries: 67 }
      ],
      journals: [
        { code: 'VTE', name: 'Ventes', entries: 67 },
        { code: 'ACH', name: 'Achats', entries: 45 },
        { code: 'BQ', name: 'Banque', entries: 78 },
        { code: 'OD', name: 'Opérations diverses', entries: 152 }
      ],
      sampleEntries: [
        {
          date: '2024-01-15',
          journal: 'VTE',
          number: 'ECR-001',
          reference: 'FAC-2024-001',
          description: 'Facture client ABC',
          debit: 1200.00,
          credit: 0,
          account: '411000'
        },
        {
          date: '2024-01-15',
          journal: 'VTE',
          number: 'ECR-001',
          reference: 'FAC-2024-001',
          description: 'Vente marchandises',
          debit: 0,
          credit: 1000.00,
          account: '701000'
        },
        {
          date: '2024-01-15',
          journal: 'VTE',
          number: 'ECR-001',
          reference: 'FAC-2024-001',
          description: 'TVA collectée',
          debit: 0,
          credit: 200.00,
          account: '445710'
        }
      ]
    }
  };

  // Gestion du drag & drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files[0]);
  }, []);

  const handleFileSelection = (file) => {
    if (!file) return;

    // Validation du type de fichier
    const validExtensions = ['.txt', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension) && file.name.includes('.')) {
      toast({
        variant: "destructive",
        title: "Fichier non valide",
        description: "Veuillez sélectionner un fichier FEC (.txt ou .csv)"
      });
      return;
    }

    // Validation de la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Fichier trop volumineux",
        description: "La taille maximale autorisée est de 10 MB"
      });
      return;
    }

    setSelectedFile(file);
    setAnalysisResult(null);
    setImportResult(null);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelection(file);
  };

  const processFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulation du traitement
      for (let i = 0; i < processingSteps.length; i++) {
        const step = processingSteps[i];
        setProcessingStep(step.label);
        
        await new Promise(resolve => setTimeout(resolve, step.duration));
        setProgress(((i + 1) / processingSteps.length) * 100);
      }

      // Simulation d'analyse réussie
      setAnalysisResult(mockAnalysisResult);
      
      toast({
        title: "Analyse terminée",
        description: "Le fichier FEC a été analysé avec succès",
        action: <CheckCircle className="text-green-500" />
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur d'analyse",
        description: "Une erreur est survenue lors de l'analyse du fichier"
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setProgress(0);
    }
  };

  const importData = async () => {
    if (!analysisResult) return;

    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulation de l'import
      for (let i = 0; i < importSteps.length; i++) {
        const step = importSteps[i];
        setProcessingStep(step.label);
        
        await new Promise(resolve => setTimeout(resolve, step.duration));
        setProgress(((i + 1) / importSteps.length) * 100);
      }

      // Résultat de l'import
      const result = {
        success: true,
        accountsCreated: analysisResult.statistics.totalAccounts,
        journalsCreated: analysisResult.statistics.totalJournals,
        entriesCreated: analysisResult.statistics.totalEntries,
        errors: []
      };

      setImportResult(result);
      
      toast({
        title: "Import terminé",
        description: `${result.entriesCreated} écritures importées avec succès`,
        action: <CheckCircle className="text-green-500" />
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur d'import",
        description: "Une erreur est survenue lors de l'import des données"
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setProgress(0);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setImportResult(null);
    setShowPreview(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5" />
            Import FEC (Fichier des Écritures Comptables)
          </CardTitle>
          <CardDescription>
            Importez vos données comptables à partir d'un fichier FEC standard
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Zone de drop ou résultats */}
      {!selectedFile && !importResult && (
        <Card>
          <CardContent className="p-12">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
                isDragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-4"
              >
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    Glissez-déposez votre fichier FEC ici
                  </h3>
                  <p className="text-muted-foreground">
                    ou cliquez pour sélectionner un fichier
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={() => document.getElementById('file-input').click()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Sélectionner un fichier
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Formats acceptés : .txt, .csv</p>
                  <p>Taille maximale : 10 MB</p>
                  <p>Format FEC standard requis</p>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fichier sélectionné */}
      {selectedFile && !analysisResult && !isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedFile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={resetImport}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
                <Button onClick={processFile}>
                  <Eye className="mr-2 h-4 w-4" />
                  Analyser le fichier
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traitement en cours */}
      {isProcessing && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin mx-auto w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{processingStep}</h3>
                <Progress value={progress} className="w-full max-w-md mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">
                  {Math.round(progress)}% terminé
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats de l'analyse */}
      {analysisResult && !importResult && (
        <div className="space-y-6">
          {/* Résumé */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Analyse terminée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysisResult.statistics.totalEntries}
                  </div>
                  <div className="text-sm text-muted-foreground">Écritures</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analysisResult.statistics.totalAccounts}
                  </div>
                  <div className="text-sm text-muted-foreground">Comptes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analysisResult.statistics.totalJournals}
                  </div>
                  <div className="text-sm text-muted-foreground">Journaux</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {analysisResult.statistics.unbalancedEntries}
                  </div>
                  <div className="text-sm text-muted-foreground">Erreurs</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Informations du fichier</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Entreprise :</span> {analysisResult.company.name}
                  </div>
                  <div>
                    <span className="font-medium">SIREN :</span> {analysisResult.company.siren}
                  </div>
                  <div>
                    <span className="font-medium">Période :</span> 
                    {' '}{analysisResult.company.period.start} au {analysisResult.company.period.end}
                  </div>
                  <div>
                    <span className="font-medium">Équilibre :</span>
                    <Badge variant="outline" className="ml-2 text-green-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {analysisResult.statistics.totalDebit.toFixed(2)} €
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {analysisResult.warnings.length > 0 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">
                      {analysisResult.warnings.length} avertissement(s) détecté(s) :
                    </div>
                    <ul className="text-sm space-y-1">
                      {analysisResult.warnings.slice(0, 3).map((warning, index) => (
                        <li key={index}>
                          Ligne {warning.line}: {warning.message}
                        </li>
                      ))}
                      {analysisResult.warnings.length > 3 && (
                        <li className="text-muted-foreground">
                          ... et {analysisResult.warnings.length - 3} autres
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between items-center mt-6">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {showPreview ? 'Masquer' : 'Aperçu'} des données
                  </Button>
                  <Button variant="outline" onClick={resetImport}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Recommencer
                  </Button>
                </div>
                <Button onClick={importData} className="bg-green-600 hover:bg-green-700">
                  <Database className="mr-2 h-4 w-4" />
                  Importer les données
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Aperçu des données */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* Aperçu des comptes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Aperçu des comptes ({analysisResult.preview.accounts.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Écritures</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysisResult.preview.accounts.map((account, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{account.code}</TableCell>
                            <TableCell>{account.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{account.type}</Badge>
                            </TableCell>
                            <TableCell>{account.entries}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Aperçu des écritures */}
                <Card>
                  <CardHeader>
                    <CardTitle>Aperçu des écritures (échantillon)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Journal</TableHead>
                          <TableHead>N°</TableHead>
                          <TableHead>Compte</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Débit</TableHead>
                          <TableHead className="text-right">Crédit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysisResult.preview.sampleEntries.map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell>{entry.date}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{entry.journal}</Badge>
                            </TableCell>
                            <TableCell>{entry.number}</TableCell>
                            <TableCell className="font-mono">{entry.account}</TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.debit > 0 ? `${entry.debit.toFixed(2)} €` : ''}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.credit > 0 ? `${entry.credit.toFixed(2)} €` : ''}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Résultats de l'import */}
      {importResult && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-green-600 mb-2">
                  Import terminé avec succès !
                </h3>
                <p className="text-muted-foreground">
                  Vos données FEC ont été importées dans votre comptabilité
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-lg mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold">{importResult.accountsCreated}</div>
                  <div className="text-sm text-muted-foreground">Comptes créés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{importResult.journalsCreated}</div>
                  <div className="text-sm text-muted-foreground">Journaux créés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{importResult.entriesCreated}</div>
                  <div className="text-sm text-muted-foreground">Écritures créées</div>
                </div>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={resetImport}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importer un autre fichier
                </Button>
                <Button onClick={() => window.location.reload()}>
                  <FileText className="mr-2 h-4 w-4" />
                  Voir les écritures
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}