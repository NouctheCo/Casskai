import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { BarChart3, FileText, CheckCircle, AlertCircle, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Fonctions helper pour les badges et icônes
const getStatusBadge = (status) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
    case 'closed':
      return <Badge className="bg-red-100 text-red-800">Fermé</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
    default:
      return <Badge variant="outline">Inconnu</Badge>;
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'sale': return <FileText className="w-4 h-4 text-blue-500" />;
    case 'purchase': return <FileText className="w-4 h-4 text-red-500" />;
    case 'bank': return <FileText className="w-4 h-4 text-green-500" />;
    default: return <FileText className="w-4 h-4 text-gray-500" />;
  }
};

// Fonction helper pour calculer le résumé
const calculateSummary = (journals) => ({
  totalJournals: journals.length,
  totalEntries: journals.reduce((sum, j) => sum + (j.entry_count || 0), 0),
  totalDebit: journals.reduce((sum, j) => sum + (j.total_debit || 0), 0),
  activeJournals: journals.filter(j => j.status === 'active').length
});

// Composant pour le résumé
const JournalsSummary = ({ summary }) => (
  <div className="grid gap-4 md:grid-cols-4">
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total journaux</p>
            <p className="text-2xl font-bold">{summary.totalJournals}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Journaux actifs</p>
            <p className="text-2xl font-bold">{summary.activeJournals}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-purple-500" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total écritures</p>
            <p className="text-2xl font-bold">{summary.totalEntries}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total montants</p>
            <p className="text-xl font-bold">{summary.totalDebit.toFixed(2)} €</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Composant pour la table des journaux
const JournalsTable = ({ journals, viewingJournal, setViewingJournal, toast }) => {
  const userCanView = true; // TODO: remplacer par vrai contrôle

  const handleViewJournal = async (journal) => {
    if (!userCanView) return;

    setViewingJournal(journal.id);
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 800));

    toast({
      title: "Journal consulté",
      description: `Le journal "${journal.name}" (${journal.code}) a été ouvert avec succès.`
    });

    setViewingJournal(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <span>Journaux comptables</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom du journal</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Écritures</TableHead>
                <TableHead className="text-right">Total débits</TableHead>
                <TableHead className="text-right">Total crédits</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière écriture</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journals.map((journal) => (
                <TableRow key={journal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell className="font-mono font-medium">{journal.code}</TableCell>
                  <TableCell className="font-medium">{journal.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(journal.type)}
                      <span className="capitalize">{journal.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{journal.entry_count || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(journal.total_debit || 0).toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(journal.total_credit || 0).toFixed(2)} €
                  </TableCell>
                  <TableCell>{getStatusBadge(journal.status)}</TableCell>
                  <TableCell>{journal.last_entry ? new Date(journal.last_entry).toLocaleDateString('fr-FR') : '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewJournal(journal)}
                      disabled={!userCanView || viewingJournal === journal.id}
                    >
                      {viewingJournal === journal.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant pour l'état de chargement
const LoadingState = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
);

// Composant pour l'état vide
const EmptyState = () => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center h-64 text-center">
      <FileText className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Aucun journal comptable</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Commencez par créer vos premiers journaux comptables.
      </p>
    </CardContent>
  </Card>
);

// Hook personnalisé pour la gestion des journaux
const useJournalsData = (currentCompany, toast) => {
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingJournal, setViewingJournal] = useState(null);

  // Charger les journaux depuis Supabase
  const loadJournals = useCallback(async () => {
    if (!currentCompany?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('code', { ascending: true });

      if (error) {
        console.error('Error loading journals:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les journaux",
          variant: "destructive"
        });
        setJournals([]);
      } else {
        setJournals(data || []);
      }
    } catch (err) {
      console.error('Unexpected error loading journals:', err);
      setJournals([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id, toast]);

  // Vérifier et initialiser les journaux automatiquement
  useEffect(() => {
    const checkAndInitializeJournals = async () => {
      if (!currentCompany?.id) return;

      try {
        // Vérifier s'il y a déjà des journaux
        const { data: existingJournals, error: checkError } = await supabase
          .from('journals')
          .select('id')
          .eq('company_id', currentCompany.id)
          .limit(1);

        if (checkError) {
          console.warn('Erreur vérification journaux:', checkError);
        }

        const hasJournalsData = (existingJournals && existingJournals.length > 0);

        // Si aucun journal n'existe, les initialiser automatiquement
        if (!hasJournalsData) {
          const { error: initError } = await supabase.rpc('create_default_journals', {
            p_company_id: currentCompany.id
          });

          if (initError) {
            toast({
              title: "Erreur d'initialisation",
              description: "Impossible d'initialiser les journaux automatiquement",
              variant: "destructive"
            });
          } else {
            // Recharger les journaux après initialisation
            await loadJournals();
          }
        }
      } catch (err) {
        console.error('Erreur vérification/initialisation journaux:', err);
      }
    };

    checkAndInitializeJournals();
  }, [currentCompany?.id, toast, loadJournals]);

  // Charger les journaux au montage du composant
  useEffect(() => {
    loadJournals();
  }, [loadJournals]);

  return { journals, isLoading, viewingJournal, setViewingJournal };
};

export default function OptimizedJournalsTab() {
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const { journals, isLoading, viewingJournal, setViewingJournal } = useJournalsData(currentCompany, toast);

  const summary = calculateSummary(journals);

  if (isLoading) {
    return <LoadingState />;
  }

  if (journals.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <JournalsSummary summary={summary} />
      <JournalsTable
        journals={journals}
        viewingJournal={viewingJournal}
        setViewingJournal={setViewingJournal}
        toast={toast}
      />
    </div>
  );
}