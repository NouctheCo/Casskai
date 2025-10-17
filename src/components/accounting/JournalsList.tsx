import React from 'react';
import { useJournals } from '@/hooks/useJournals';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, AlertTriangle } from 'lucide-react';
import { logger } from '@/utils/logger';

// Définition des journaux par défaut pour la France
const defaultJournalsFR = [
  { code: 'AC', name: 'Journal des Achats', type: 'purchase' },
  { code: 'VE', name: 'Journal des Ventes', type: 'sale' },
  { code: 'BQ', name: 'Journal de Banque', type: 'bank' },
  { code: 'OD', name: 'Journal des Opérations Diverses', type: 'miscellaneous' },
];

export function JournalsList() {
  const { currentCompany } = useAuth();
  const companyId = currentCompany?.id;

  const { journals, loading, error, createDefaultJournals } = useJournals(companyId || '');

  const handleCreateDefaults = async () => {
    if (!companyId) return;
    try {
      await createDefaultJournals(defaultJournalsFR);
    } catch (err) {
      logger.error("Failed to create default journals:", err)
    }
  };

  if (!companyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Journaux Comptables</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <p className="mt-4">Veuillez sélectionner une entreprise pour voir les journaux.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center">
        Erreur: {error}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Journaux Comptables</CardTitle>
      </CardHeader>
      <CardContent>
        {journals.length === 0 ? (
          <div className="text-center py-10">
            <p className="mb-4">Aucun journal comptable trouvé pour cette entreprise.</p>
            <Button onClick={handleCreateDefaults} disabled={loading}>
              {loading ? 'Création...' : 'Créer les Journaux par Défaut'}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journals.map((journal) => (
                <TableRow key={journal.id}>
                  <TableCell>{journal.code}</TableCell>
                  <TableCell>{journal.name}</TableCell>
                  <TableCell>{journal.type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
