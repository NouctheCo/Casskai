import React, { useState, useEffect } from 'react';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { createPortal } from 'react-dom';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Button } from '@/components/ui/button';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Badge } from '@/components/ui/badge';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { useToast } from '@/components/ui/use-toast';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { BarChart3, FileText, CheckCircle, AlertCircle, Eye, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { journalsStatsService, type JournalStats } from '@/services/journalsStatsService';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { useAuth } from '@/contexts/AuthContext';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { useTranslation } from 'react-i18next';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { supabase } from '@/lib/supabase';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { logger } from '@/lib/logger';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
export default function OptimizedJournalsTab() {
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const { t } = useTranslation();
  const [journals, setJournals] = useState<JournalStats[]>([]);
  const [_loading, setLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState<JournalStats | null>(null);
  const [showJournalDetail, setShowJournalDetail] = useState(false);
  // Charger les journaux réels depuis Supabase
  useEffect(() => {
    const loadJournals = async () => {
      if (!currentCompany?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const journalsData = await journalsStatsService.getJournalsWithStats(currentCompany.id);
        logger.debug('OptimizedJournalsTab', '📚 Journaux chargés:', journalsData);
        // Afficher les types de journaux pour déboguer
        journalsData.forEach(j => {
          logger.debug('OptimizedJournalsTab', `Journal ${j.code}: type="${j.type}"`);
        });
        setJournals(journalsData);
      } catch (error) {
        logger.error('OptimizedJournalsTab', 'Error loading journals:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les journaux",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    loadJournals();
  }, [currentCompany?.id]);
  // Mock data commenté - remplacé par vraies données
  /*const [journals] = useState([
    {
      id: 1,
      code: 'VTE',
      name: 'Journal des ventes',
      type: 'sale',
      entries: 45,
      totalDebit: 125430.00,
      totalCredit: 125430.00,
      status: 'active',
      lastEntry: '2024-01-20'
    },
    {
      id: 2,
      code: 'ACH',
      name: 'Journal des achats',
      type: 'purchase',
      entries: 32,
      totalDebit: 67890.00,
      totalCredit: 67890.00,
      status: 'active',
      lastEntry: '2024-01-19'
    },
    {
      id: 3,
      code: 'BQ1',
      name: 'Journal de banque',
      type: 'bank',
      entries: 78,
      totalDebit: 234567.00,
      totalCredit: 234567.00,
      status: 'active',
      lastEntry: '2024-01-21'
    },
    {
      id: 4,
      code: 'OD',
      name: 'Opérations diverses',
      type: 'misc',
      entries: 12,
      totalDebit: 15430.00,
      totalCredit: 15430.00,
      status: 'active',
      lastEntry: '2024-01-18'
    }
  ]);*/
  // RBAC simulation (à remplacer par vrai hook/context)
  const userCanView = true; // TODO: remplacer par vrai contrôle
  const [_viewingJournal, _setViewingJournal] = useState(null);
  const getStatusBadge = (status: string) => {
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
  // Normaliser le type de journal pour correspondre aux clés de traduction
  const normalizeJournalType = (type: string): string => {
    // Conversion des types possibles vers les clés de traduction
    const normalized = type.toLowerCase().trim();

    // Mapping des variations possibles
    const typeMap: Record<string, string> = {
      // Ventes
      'sale': 'sale',
      'sales': 'sale',
      'vente': 'sale',
      'ventes': 'sale',
      // Achats
      'purchase': 'purchase',
      'purchases': 'purchase',
      'achat': 'purchase',
      'achats': 'purchase',
      // Banque
      'bank': 'bank',
      'banque': 'bank',
      // Caisse
      'cash': 'cash',
      'caisse': 'cash',
      // Opérations diverses
      'miscellaneous': 'miscellaneous',
      'general': 'miscellaneous',
      'od': 'miscellaneous',
      // À-nouveaux
      'opening': 'opening',
      'ouverture': 'opening',
      'an': 'opening'
    };

    return typeMap[normalized] || normalized;
  };

  const getTypeIcon = (type: string) => {
    const normalizedType = normalizeJournalType(type);
    switch (normalizedType) {
      case 'sale': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'purchase': return <FileText className="w-4 h-4 text-red-500" />;
      case 'bank': return <FileText className="w-4 h-4 text-green-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500 dark:text-gray-300" />;
    }
  };
  const summary = {
    totalJournals: journals.length,
    totalEntries: journals.reduce((sum, j) => sum + j.entriesCount, 0),
    totalDebit: journals.reduce((sum, j) => sum + j.totalDebit, 0),
    activeJournals: journals.filter(j => j.isActive).length
  };
  const handleViewJournal = (journal: JournalStats) => {
    if (!userCanView) return;
    logger.debug('OptimizedJournalsTab', '🔍 Viewing journal:', journal);
    setSelectedJournal(journal);
    setShowJournalDetail(true);
  };
  const handleToggleJournalStatus = async (journal: JournalStats) => {
    if (!currentCompany?.id) return;
    logger.debug('OptimizedJournalsTab', '🔄 Toggling journal status:', journal);
    try {
      const { error } = await supabase
        .from('journals')
        .update({
          is_active: !journal.isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', journal.id);
      if (error) throw error;
      toast({
        title: t('success', 'Succès'),
        description: journal.isActive
          ? t('journals.journalDeactivated')
          : t('journals.journalActivated')
      });
      // Rafraîchir la liste des journaux
      const journalsData = await journalsStatsService.getJournalsWithStats(currentCompany.id);
      setJournals(journalsData);
    } catch (error: any) {
      logger.error('OptimizedJournalsTab', 'Error toggling journal status:', error);
      toast({
        variant: 'destructive',
        title: t('error', 'Erreur'),
        description: error.message || t('journals.errorTogglingStatus')
      });
    }
  };
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('journals.totalJournals')}</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('journals.activeJournals')}</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('journals.totalEntries')}</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('journals.totalAmount')}</p>
                <p className="text-xl font-bold"><CurrencyAmount amount={summary.totalDebit} /></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Journals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span>{t('journals.accountingJournals')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('journals.journalCode')}</TableHead>
                  <TableHead>{t('journals.journalName')}</TableHead>
                  <TableHead>{t('journals.journalType')}</TableHead>
                  <TableHead className="text-right">{t('journals.entriesCount')}</TableHead>
                  <TableHead className="text-right">{t('journals.totalDebits')}</TableHead>
                  <TableHead className="text-right">{t('journals.totalCredits')}</TableHead>
                  <TableHead>{t('journals.status')}</TableHead>
                  <TableHead>{t('journals.lastEntryDate')}</TableHead>
                  <TableHead className="text-right">{t('journals.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journals.map((journal) => (
                  <TableRow key={journal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-900/30">
                    <TableCell className="font-mono font-medium">{journal.code}</TableCell>
                    <TableCell className="font-medium">{journal.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(journal.type)}
                        <span>{t(`accounting.journalTypes.${normalizeJournalType(journal.type)}`)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{journal.entriesCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <CurrencyAmount amount={journal.totalDebit} />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <CurrencyAmount amount={journal.totalCredit} />
                    </TableCell>
                    <TableCell>{getStatusBadge(journal.isActive ? 'active' : 'inactive')}</TableCell>
                    <TableCell>{journal.lastEntryDate ? new Date(journal.lastEntryDate).toLocaleDateString('fr-FR') : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewJournal(journal)}
                          disabled={!userCanView}
                          title={t('journals.viewEntries')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleJournalStatus(journal)}
                          title={journal.isActive ? t('journals.deactivate') : t('journals.activate')}
                        >
                          {journal.isActive ? (
                            <ToggleRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Modale de détail du journal */}
      {showJournalDetail && selectedJournal && createPortal(
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={() => {
            setShowJournalDetail(false);
            setSelectedJournal(null);
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {t('journals.journalDetails')}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowJournalDetail(false);
                  setSelectedJournal(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-300">{t('journals.code')}</label>
                  <p className="font-mono text-lg">{selectedJournal.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-300">{t('journals.name')}</label>
                  <p className="text-lg">{selectedJournal.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-300">{t('journals.type')}</label>
                  <p>{t(`accounting.journalTypes.${normalizeJournalType(selectedJournal.type)}`)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-300">{t('journals.status')}</label>
                  <div>
                    {selectedJournal.isActive ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {t('journals.active')}
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {t('journals.inactive')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {/* Stats du journal */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-2">{t('journals.statistics')}</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-2xl font-bold">{selectedJournal.entriesCount || 0}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">{t('journals.entries')}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-2xl font-bold"><CurrencyAmount amount={selectedJournal.totalDebit} /></p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">{t('journals.totalDebit')}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-2xl font-bold"><CurrencyAmount amount={selectedJournal.totalCredit} /></p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">{t('journals.totalCredit')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                onClick={() => {
                  setShowJournalDetail(false);
                  setSelectedJournal(null);
                }}
              >
                {t('journals.close')}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
