import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toastSuccess, toastError } from '@/lib/toast-helpers';

interface ImportRow {
  name: string;
  type: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  siret?: string;
  vat_number?: string;
  isValid: boolean;
  errors: string[];
}

interface ImportTabProps {
  companyId: string;
}

export const ImportTab: React.FC<ImportTabProps> = ({ companyId }) => {
  const { t: _t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importStats, setImportStats] = useState({ success: 0, errors: 0 });

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Exemple Client SARL',
        type: 'customer',
        email: 'contact@exemple.com',
        phone: '+33 1 23 45 67 89',
        address: '123 rue de Paris',
        city: 'Paris',
        postal_code: '75001',
        country: 'FR',
        siret: '12345678900012',
        vat_number: 'FR12345678901'
      },
      {
        name: 'Fournisseur Test SAS',
        type: 'supplier',
        email: 'admin@fournisseur.com',
        phone: '+33 2 34 56 78 90',
        address: '456 avenue des Champs',
        city: 'Lyon',
        postal_code: '69001',
        country: 'FR',
        siret: '98765432100019',
        vat_number: 'FR98765432109'
      },
      {
        name: 'Partenaire Commercial SA',
        type: 'both',
        email: 'contact@partenaire.com',
        phone: '+33 3 45 67 89 01',
        address: '789 boulevard du Commerce',
        city: 'Marseille',
        postal_code: '13001',
        country: 'FR',
        siret: '11122233300011',
        vat_number: 'FR11122233301'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tiers');

    // Largeur des colonnes
    ws['!cols'] = [
      { wch: 25 }, // name
      { wch: 12 }, // type
      { wch: 25 }, // email
      { wch: 18 }, // phone
      { wch: 30 }, // address
      { wch: 15 }, // city
      { wch: 12 }, // postal_code
      { wch: 8 },  // country
      { wch: 18 }, // siret
      { wch: 18 }  // vat_number
    ];

    XLSX.writeFile(wb, 'template_import_tiers.xlsx');
    toastSuccess('Modèle téléchargé');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportComplete(false);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(sheet);

      const rows: ImportRow[] = jsonData.map((row, _index) => {
        const errors: string[] = [];
        const name = row.name?.toString().trim() || '';
        const type = row.type?.toString().toLowerCase().trim() || '';
        const email = row.email?.toString().trim() || '';

        // Validation
        if (!name) {
          errors.push('Nom obligatoire');
        }

        if (!['customer', 'supplier', 'both', 'prospect'].includes(type)) {
          errors.push('Type invalide (customer/supplier/both/prospect)');
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('Email invalide');
        }

        return {
          name,
          type,
          email: row.email || undefined,
          phone: row.phone || undefined,
          address: row.address || undefined,
          city: row.city || undefined,
          postal_code: row.postal_code || undefined,
          country: row.country || 'FR',
          siret: row.siret || undefined,
          vat_number: row.vat_number || undefined,
          isValid: errors.length === 0,
          errors
        };
      });

      setImportData(rows);
      toastSuccess(`${rows.length} ligne(s) chargée(s)`);
    } catch (error) {
      console.error('Erreur lecture fichier:', error);
      toastError('Impossible de lire le fichier');
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!companyId) {
      toastError('Entreprise non définie');
      return;
    }

    const validRows = importData.filter(row => row.isValid);
    if (validRows.length === 0) {
      toastError('Aucune ligne valide à importer');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of validRows) {
      try {
        const { error } = await supabase.from('third_parties').insert({
          company_id: companyId,
          name: row.name,
          type: row.type as 'customer' | 'supplier' | 'both' | 'prospect',
          email: row.email || null,
          phone: row.phone || null,
          address_line1: row.address || null,
          city: row.city || null,
          postal_code: row.postal_code || null,
          country: row.country || 'FR',
          siret: row.siret || null,
          vat_number: row.vat_number || null,
          is_active: true
        });

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error('Erreur import ligne:', row.name, error);
        errorCount++;
      }
    }

    setImporting(false);
    setImportComplete(true);
    setImportStats({ success: successCount, errors: errorCount });

    if (successCount > 0) {
      toastSuccess(`${successCount} tiers importé(s) avec succès`);
    }

    if (errorCount > 0) {
      toastError(`${errorCount} erreur(s) lors de l'import`);
    }
  };

  const validCount = importData.filter(row => row.isValid).length;
  const invalidCount = importData.length - validCount;

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Comment importer des tiers en masse :</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Téléchargez le modèle Excel ci-dessous</li>
              <li>Remplissez le fichier avec vos données</li>
              <li>Importez le fichier complété</li>
              <li>Vérifiez les données et confirmez l'import</li>
            </ol>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Types acceptés :</strong> customer (client), supplier (fournisseur), both
              (client et fournisseur), prospect
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Télécharger le modèle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Étape 1 : Télécharger le modèle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Télécharger le modèle Excel
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Le modèle contient des exemples de données pour vous guider
          </p>
        </CardContent>
      </Card>

      {/* Charger le fichier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Étape 2 : Charger votre fichier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="flex-1"
              />
              {selectedFile && (
                <Badge variant="outline">
                  {selectedFile.name}
                </Badge>
              )}
            </div>

            {importData.length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{validCount} ligne(s) valide(s)</span>
                  </div>
                  {invalidCount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {invalidCount} ligne(s) invalide(s)
                      </span>
                    </div>
                  )}
                </div>

                {!importComplete && (
                  <Button
                    onClick={handleImport}
                    disabled={importing || validCount === 0}
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Import en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Importer {validCount} tiers
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Résultats de l'import */}
      {importComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Import terminé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded">
                <span className="font-medium text-green-700 dark:text-green-300">
                  Tiers importés avec succès
                </span>
                <Badge variant="default" className="bg-green-600">
                  {importStats.success}
                </Badge>
              </div>

              {importStats.errors > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded">
                  <span className="font-medium text-red-700 dark:text-red-300">
                    Erreurs lors de l'import
                  </span>
                  <Badge variant="destructive">{importStats.errors}</Badge>
                </div>
              )}

              <Button
                onClick={() => {
                  setImportData([]);
                  setSelectedFile(null);
                  setImportComplete(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                variant="outline"
                className="w-full mt-4"
              >
                Importer un autre fichier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prévisualisation des données */}
      {importData.length > 0 && !importComplete && (
        <Card>
          <CardHeader>
            <CardTitle>Prévisualisation des données</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Statut</th>
                    <th className="text-left py-2 px-3 font-medium">Nom</th>
                    <th className="text-left py-2 px-3 font-medium">Type</th>
                    <th className="text-left py-2 px-3 font-medium">Email</th>
                    <th className="text-left py-2 px-3 font-medium">Téléphone</th>
                    <th className="text-left py-2 px-3 font-medium">Ville</th>
                    <th className="text-left py-2 px-3 font-medium">Erreurs</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.slice(0, 20).map((row, index) => (
                    <tr
                      key={index}
                      className={`border-b ${
                        row.isValid
                          ? 'bg-green-50 dark:bg-green-950/20'
                          : 'bg-red-50 dark:bg-red-950/20'
                      }`}
                    >
                      <td className="py-2 px-3">
                        {row.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </td>
                      <td className="py-2 px-3 font-medium">{row.name}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline">{row.type}</Badge>
                      </td>
                      <td className="py-2 px-3">{row.email || '-'}</td>
                      <td className="py-2 px-3">{row.phone || '-'}</td>
                      <td className="py-2 px-3">{row.city || '-'}</td>
                      <td className="py-2 px-3">
                        {row.errors.length > 0 ? (
                          <div className="space-y-1">
                            {row.errors.map((error, i) => (
                              <p key={i} className="text-xs text-red-600 dark:text-red-400">
                                {error}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-green-600 text-xs">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {importData.length > 20 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  ... et {importData.length - 20} autre(s) ligne(s)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
