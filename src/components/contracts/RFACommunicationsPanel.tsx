/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Panneau de gestion des communications RFA
 * Permet d'envoyer des emails aux tiers-parties concernant les RFA
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { 
  rfaCommunicationsService, 
  RFACommunicationWithRelations,
  CommunicationType,
  RecipientType,
  RFAEmailTemplateData
} from '@/services/rfaCommunicationsService';
import { unifiedThirdPartiesService } from '@/services/unifiedThirdPartiesService';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import CompanySettingsService from '@/services/companySettingsService';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

import {
  Mail,
  Send,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Users,
  Eye,
  Trash2,
  MailOpen,
  PenLine,
  Search,
  Filter
} from 'lucide-react';

interface Contract {
  id: string;
  name?: string;
  contract_name?: string;
  third_party_id?: string;
}

interface ThirdParty {
  id: string;
  name: string;
  email?: string;
}

interface RFACalculation {
  id: string;
  contract_id: string;
  calculation_period: string;
  period_start: string;
  period_end: string;
  turnover_amount: number;
  rfa_percentage: number;
  rfa_amount: number;
  currency: string;
}

interface RFACommunicationsPanelProps {
  companyId?: string;
  contracts?: Contract[];
}

export const RFACommunicationsPanel: React.FC<RFACommunicationsPanelProps> = ({
  companyId: propCompanyId,
  contracts: propContracts
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  
  const companyId = propCompanyId || currentCompany?.id;
  
  // États principaux
  const [loading, setLoading] = useState(true);
  const [communications, setCommunications] = useState<RFACommunicationWithRelations[]>([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, pending: 0, failed: 0, draft: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // États pour la création
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState<RFACommunicationWithRelations | null>(null);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  
  // États du formulaire
  const [formData, setFormData] = useState({
    communication_type: 'rfa_notification' as CommunicationType,
    recipient_type: 'third_party_contact' as RecipientType,
    third_party_id: '',
    contract_id: '',
    rfa_calculation_id: '',
    recipient_email: '',
    recipient_name: '',
    subject: '',
    custom_message: ''
  });
  
  // Données de référence
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [rfaCalculations, setRFACalculations] = useState<RFACalculation[]>([]);
  const [selectedCalculations, setSelectedCalculations] = useState<string[]>([]);

  // Charger les données
  const loadData = useCallback(async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      // Charger les communications
      const { data } = await rfaCommunicationsService.getCommunications(companyId, {
        limit: 50
      });
      setCommunications(data);
      
      // Charger les statistiques
      const statsData = await rfaCommunicationsService.getCommunicationStats(companyId);
      setStats(statsData);
      
      // Charger les tiers (clients + fournisseurs)
      const [customersData, suppliersData] = await Promise.all([
        unifiedThirdPartiesService.getCustomers(companyId),
        unifiedThirdPartiesService.getSuppliers(companyId)
      ]);
      const allThirdParties = [
        ...customersData.map(c => ({ id: c.id, name: c.name || c.company_name || 'Sans nom', email: c.email })),
        ...suppliersData.map(s => ({ id: s.id, name: s.name || s.company_name || 'Sans nom', email: s.email }))
      ];
      // Remove duplicates by id
      const uniqueThirdParties = Array.from(new Map(allThirdParties.map(tp => [tp.id, tp])).values());
      setThirdParties(uniqueThirdParties);
      
      // Charger les contrats
      const { data: contractsData } = await supabase
        .from('contracts')
        .select('id, name, third_party_id')
        .eq('company_id', companyId)
        .eq('status', 'active');
      setContracts(contractsData || []);
      
      // Charger les calculs RFA
      const { data: rfaData } = await supabase
        .from('rfa_calculations')
        .select('*')
        .eq('company_id', companyId)
        .in('status', ['calculated', 'validated'])
        .order('created_at', { ascending: false })
        .limit(100);
      setRFACalculations(rfaData || []);
      
    } catch (error) {
      logger.error('RFACommunicationsPanel', 'Erreur chargement données:', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('contracts.communications.load_error', 'Erreur lors du chargement des communications')
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, toast, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mise à jour de propContracts
  useEffect(() => {
    if (propContracts && propContracts.length > 0) {
      setContracts(propContracts.map(c => ({
        id: c.id,
        name: c.name || c.contract_name,
        third_party_id: c.third_party_id
      })));
    }
  }, [propContracts]);

  // Quand on sélectionne un tiers, remplir l'email
  useEffect(() => {
    if (formData.recipient_type === 'third_party_contact' && formData.third_party_id) {
      const tp = thirdParties.find(t => t.id === formData.third_party_id);
      if (tp) {
        setFormData(prev => ({
          ...prev,
          recipient_email: tp.email || '',
          recipient_name: tp.name
        }));
      }
    }
  }, [formData.third_party_id, formData.recipient_type, thirdParties]);

  // Générer le sujet par défaut
  const generateDefaultSubject = useCallback(() => {
    const types: Record<CommunicationType, string> = {
      rfa_notification: 'Notification RFA',
      rfa_reminder: 'Rappel RFA',
      rfa_summary: 'Récapitulatif RFA',
      rfa_statement: 'Relevé RFA',
      custom: 'Communication'
    };
    const tp = thirdParties.find(t => t.id === formData.third_party_id);
    return `${types[formData.communication_type]} - ${tp?.name || 'Client'}`;
  }, [formData.communication_type, formData.third_party_id, thirdParties]);

  // Créer et envoyer une communication
  const handleCreateCommunication = async (sendImmediately: boolean = false) => {
    if (!companyId) return;
    
    if (!formData.recipient_email) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('contracts.communications.email_required', 'L\'adresse email est requise')
      });
      return;
    }
    
    setCreating(true);
    try {
      // Récupérer les infos de l'entreprise
      const companySettings = await CompanySettingsService.getCompanySettings(companyId);
      
      // Trouver le calcul RFA si sélectionné
      const rfaCalc = rfaCalculations.find(c => c.id === formData.rfa_calculation_id);
      const contract = contracts.find(c => c.id === formData.contract_id);
      const thirdParty = thirdParties.find(tp => tp.id === formData.third_party_id);
      
      // Générer le contenu de l'email
      const templateData: RFAEmailTemplateData = {
        company_name: companySettings?.generalInfo?.name || currentCompany?.name || 'Entreprise',
        company_email: companySettings?.contact?.email,
        company_phone: companySettings?.contact?.phone,
        company_address: companySettings?.contact?.address?.street,
        third_party_name: thirdParty?.name || formData.recipient_name || 'Client',
        contract_name: contract?.name,
        calculation_period: rfaCalc?.calculation_period,
        period_start: rfaCalc?.period_start,
        period_end: rfaCalc?.period_end,
        turnover_amount: rfaCalc?.turnover_amount,
        rfa_percentage: rfaCalc?.rfa_percentage,
        rfa_amount: rfaCalc?.rfa_amount,
        currency: rfaCalc?.currency || 'EUR',
        custom_message: formData.custom_message
      };
      
      const bodyHtml = rfaCommunicationsService.generateRFAEmailHtml(templateData);
      const bodyText = rfaCommunicationsService.generateRFAEmailText(templateData);
      
      // Créer la communication
      const communication = await rfaCommunicationsService.createCommunication({
        company_id: companyId,
        communication_type: formData.communication_type,
        recipient_type: formData.recipient_type,
        third_party_id: formData.third_party_id || undefined,
        contract_id: formData.contract_id || undefined,
        rfa_calculation_id: formData.rfa_calculation_id || undefined,
        recipient_email: formData.recipient_email,
        recipient_name: formData.recipient_name,
        subject: formData.subject || generateDefaultSubject(),
        body_html: bodyHtml,
        body_text: bodyText
      });
      
      toast({
        title: t('common.success'),
        description: t('contracts.communications.created', 'Communication créée avec succès')
      });
      
      // Envoyer immédiatement si demandé
      if (sendImmediately) {
        setSending(true);
        await rfaCommunicationsService.sendCommunication(communication.id);
        toast({
          title: t('common.success'),
          description: t('contracts.communications.sent', 'Email envoyé avec succès')
        });
      }
      
      // Fermer et rafraîchir
      setShowCreateDialog(false);
      resetForm();
      loadData();
      
    } catch (error: any) {
      logger.error('RFACommunicationsPanel', 'Erreur création communication:', error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message || t('contracts.communications.create_error', 'Erreur lors de la création')
      });
    } finally {
      setCreating(false);
      setSending(false);
    }
  };

  // Envoyer une communication existante
  const handleSendCommunication = async (id: string) => {
    setSending(true);
    try {
      await rfaCommunicationsService.sendCommunication(id);
      toast({
        title: t('common.success'),
        description: t('contracts.communications.sent', 'Email envoyé avec succès')
      });
      loadData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: error.message
      });
    } finally {
      setSending(false);
    }
  };

  // Supprimer une communication
  const handleDeleteCommunication = async (id: string) => {
    try {
      await rfaCommunicationsService.deleteCommunication(id);
      toast({
        title: t('common.success'),
        description: t('contracts.communications.deleted', 'Communication supprimée')
      });
      loadData();
    } catch (_error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('contracts.communications.delete_error', 'Erreur lors de la suppression')
      });
    }
  };

  // Envoi en lot
  const handleBulkSend = async () => {
    if (selectedCalculations.length === 0) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('contracts.communications.select_calculations', 'Sélectionnez au moins un calcul RFA')
      });
      return;
    }
    
    setSending(true);
    try {
      // Pour chaque calcul sélectionné, créer et envoyer une communication
      const companySettings = await CompanySettingsService.getCompanySettings(companyId!);
      let sentCount = 0;
      let errorCount = 0;
      
      for (const calcId of selectedCalculations) {
        const rfaCalc = rfaCalculations.find(c => c.id === calcId);
        if (!rfaCalc) continue;
        
        const contract = contracts.find(c => c.id === rfaCalc.contract_id);
        if (!contract?.third_party_id) continue;
        
        const thirdParty = thirdParties.find(tp => tp.id === contract.third_party_id);
        if (!thirdParty?.email) continue;
        
        try {
          const templateData: RFAEmailTemplateData = {
            company_name: companySettings?.generalInfo?.name || 'Entreprise',
            company_email: companySettings?.contact?.email,
            company_phone: companySettings?.contact?.phone,
            third_party_name: thirdParty.name,
            contract_name: contract.name,
            calculation_period: rfaCalc.calculation_period,
            period_start: rfaCalc.period_start,
            period_end: rfaCalc.period_end,
            turnover_amount: rfaCalc.turnover_amount,
            rfa_percentage: rfaCalc.rfa_percentage,
            rfa_amount: rfaCalc.rfa_amount,
            currency: rfaCalc.currency
          };
          
          const comm = await rfaCommunicationsService.createCommunication({
            company_id: companyId!,
            communication_type: 'rfa_statement',
            recipient_type: 'third_party_contact',
            third_party_id: thirdParty.id,
            contract_id: contract.id,
            rfa_calculation_id: calcId,
            recipient_email: thirdParty.email,
            recipient_name: thirdParty.name,
            subject: `Relevé RFA - ${rfaCalc.calculation_period}`,
            body_html: rfaCommunicationsService.generateRFAEmailHtml(templateData),
            body_text: rfaCommunicationsService.generateRFAEmailText(templateData)
          });
          
          await rfaCommunicationsService.sendCommunication(comm.id);
          sentCount++;
        } catch (err) {
          errorCount++;
          logger.error('RFACommunicationsPanel', `Erreur envoi pour calcul ${calcId}:`, err);
        }
      }
      
      toast({
        title: t('common.success'),
        description: t('contracts.communications.bulk_sent', '{{sent}} emails envoyés, {{errors}} erreurs')
          .replace('{{sent}}', String(sentCount))
          .replace('{{errors}}', String(errorCount))
      });
      
      setSelectedCalculations([]);
      loadData();
    } catch (_error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('contracts.communications.bulk_error', 'Erreur lors de l\'envoi en lot')
      });
    } finally {
      setSending(false);
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      communication_type: 'rfa_notification',
      recipient_type: 'third_party_contact',
      third_party_id: '',
      contract_id: '',
      rfa_calculation_id: '',
      recipient_email: '',
      recipient_name: '',
      subject: '',
      custom_message: ''
    });
  };

  // Filtrer les communications
  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = !searchTerm || 
      comm.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || comm.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
      draft: { variant: 'outline', icon: <PenLine className="h-3 w-3" />, label: 'Brouillon' },
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3" />, label: 'En attente' },
      sent: { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, label: 'Envoyé' },
      failed: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: 'Échoué' },
      cancelled: { variant: 'outline', icon: <XCircle className="h-3 w-3" />, label: 'Annulé' }
    };
    const config = configs[status] || configs.draft;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Mail className="h-4 w-4" />
              {t('contracts.communications.total', 'Total')}
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm mb-1">
              <CheckCircle className="h-4 w-4" />
              {t('contracts.communications.sent', 'Envoyés')}
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm mb-1">
              <Clock className="h-4 w-4" />
              {t('contracts.communications.pending', 'En attente')}
            </div>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mb-1">
              <XCircle className="h-4 w-4" />
              {t('contracts.communications.failed', 'Échoués')}
            </div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <PenLine className="h-4 w-4" />
              {t('contracts.communications.drafts', 'Brouillons')}
            </div>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history" className="flex items-center gap-2">
            <MailOpen className="h-4 w-4" />
            {t('contracts.communications.history', 'Historique')}
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('contracts.communications.bulk_send', 'Envoi en lot')}
          </TabsTrigger>
        </TabsList>

        {/* Onglet Historique */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('contracts.communications.history', 'Historique des communications')}</CardTitle>
                <CardDescription>
                  {t('contracts.communications.history_desc', 'Liste des emails RFA envoyés et en attente')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={loadData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('contracts.communications.new', 'Nouvelle communication')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filtres */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={t('contracts.communications.search', 'Rechercher...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all', 'Tous')}</SelectItem>
                    <SelectItem value="draft">{t('contracts.communications.status.draft', 'Brouillon')}</SelectItem>
                    <SelectItem value="pending">{t('contracts.communications.status.pending', 'En attente')}</SelectItem>
                    <SelectItem value="sent">{t('contracts.communications.status.sent', 'Envoyé')}</SelectItem>
                    <SelectItem value="failed">{t('contracts.communications.status.failed', 'Échoué')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tableau */}
              {filteredCommunications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('contracts.communications.no_data', 'Aucune communication')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('contracts.communications.date', 'Date')}</TableHead>
                      <TableHead>{t('contracts.communications.recipient', 'Destinataire')}</TableHead>
                      <TableHead>{t('contracts.communications.subject', 'Sujet')}</TableHead>
                      <TableHead>{t('contracts.communications.type', 'Type')}</TableHead>
                      <TableHead>{t('contracts.communications.status', 'Statut')}</TableHead>
                      <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCommunications.map((comm) => (
                      <TableRow key={comm.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(comm.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{comm.recipient_name || '-'}</p>
                            <p className="text-sm text-muted-foreground">{comm.recipient_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{comm.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t(`contracts.communications.types.${comm.communication_type}`, comm.communication_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(comm.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedCommunication(comm);
                                setShowPreviewDialog(true);
                              }}
                              title={t('common.view', 'Voir')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(comm.status === 'draft' || comm.status === 'failed') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSendCommunication(comm.id)}
                                  disabled={sending}
                                  title={t('contracts.communications.send', 'Envoyer')}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteCommunication(comm.id)}
                                  title={t('common.delete', 'Supprimer')}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Envoi en lot */}
        <TabsContent value="bulk" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('contracts.communications.bulk_send', 'Envoi en lot')}
              </CardTitle>
              <CardDescription>
                {t('contracts.communications.bulk_desc', 'Sélectionnez les calculs RFA pour envoyer les relevés aux clients correspondants')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rfaCalculations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('contracts.communications.no_calculations', 'Aucun calcul RFA disponible')}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {selectedCalculations.length} {t('contracts.communications.selected', 'sélectionné(s)')}
                    </p>
                    <Button
                      onClick={handleBulkSend}
                      disabled={sending || selectedCalculations.length === 0}
                    >
                      {sending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {t('contracts.communications.send_selected', 'Envoyer la sélection')}
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedCalculations.length === rfaCalculations.length}
                            onCheckedChange={(checked) => {
                              setSelectedCalculations(checked ? rfaCalculations.map(c => c.id) : []);
                            }}
                          />
                        </TableHead>
                        <TableHead>{t('contracts.communications.period', 'Période')}</TableHead>
                        <TableHead>{t('contracts.communications.contract', 'Contrat')}</TableHead>
                        <TableHead>{t('contracts.communications.client', 'Client')}</TableHead>
                        <TableHead className="text-right">{t('contracts.communications.rfa_amount', 'Montant RFA')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rfaCalculations.map((calc) => {
                        const contract = contracts.find(c => c.id === calc.contract_id);
                        const thirdParty = contract?.third_party_id 
                          ? thirdParties.find(tp => tp.id === contract.third_party_id)
                          : null;
                        const hasEmail = !!thirdParty?.email;
                        
                        return (
                          <TableRow key={calc.id} className={!hasEmail ? 'opacity-50' : ''}>
                            <TableCell>
                              <Checkbox
                                checked={selectedCalculations.includes(calc.id)}
                                disabled={!hasEmail}
                                onCheckedChange={(checked) => {
                                  setSelectedCalculations(prev =>
                                    checked
                                      ? [...prev, calc.id]
                                      : prev.filter(id => id !== calc.id)
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell>{calc.calculation_period}</TableCell>
                            <TableCell>{contract?.name || '-'}</TableCell>
                            <TableCell>
                              <div>
                                <p>{thirdParty?.name || '-'}</p>
                                {hasEmail ? (
                                  <p className="text-sm text-muted-foreground">{thirdParty?.email}</p>
                                ) : (
                                  <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {t('contracts.communications.no_email', 'Pas d\'email')}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: calc.currency || 'EUR'
                              }).format(calc.rfa_amount)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog création */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('contracts.communications.new', 'Nouvelle communication RFA')}
            </DialogTitle>
            <DialogDescription>
              {t('contracts.communications.new_desc', 'Créez et envoyez un email concernant les remises de fin d\'année')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Type de communication */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('contracts.communications.type', 'Type')}</Label>
                <Select
                  value={formData.communication_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, communication_type: v as CommunicationType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rfa_notification">Notification RFA</SelectItem>
                    <SelectItem value="rfa_reminder">Rappel RFA</SelectItem>
                    <SelectItem value="rfa_summary">Récapitulatif RFA</SelectItem>
                    <SelectItem value="rfa_statement">Relevé RFA</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t('contracts.communications.recipient_type', 'Type de destinataire')}</Label>
                <Select
                  value={formData.recipient_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, recipient_type: v as RecipientType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="third_party_contact">Contact tiers</SelectItem>
                    <SelectItem value="manual_email">Email manuel</SelectItem>
                    <SelectItem value="employee">Salarié</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Sélection tiers */}
            {formData.recipient_type === 'third_party_contact' && (
              <div className="space-y-2">
                <Label>{t('contracts.communications.third_party', 'Tiers')}</Label>
                <Select
                  value={formData.third_party_id}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, third_party_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un tiers..." />
                  </SelectTrigger>
                  <SelectContent>
                    {thirdParties.map(tp => (
                      <SelectItem key={tp.id} value={tp.id}>
                        {tp.name} {tp.email ? `(${tp.email})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('contracts.communications.email', 'Email')}</Label>
                <Input
                  type="email"
                  value={formData.recipient_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipient_email: e.target.value }))}
                  placeholder="email@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('contracts.communications.name', 'Nom (optionnel)')}</Label>
                <Input
                  value={formData.recipient_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
                  placeholder="Nom du destinataire"
                />
              </div>
            </div>
            
            {/* Contrat et calcul RFA (optionnel) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('contracts.communications.contract', 'Contrat (optionnel)')}</Label>
                <Select
                  value={formData.contract_id}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, contract_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {contracts.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name || c.contract_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('contracts.communications.rfa_calculation', 'Calcul RFA (optionnel)')}</Label>
                <Select
                  value={formData.rfa_calculation_id}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, rfa_calculation_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {rfaCalculations.filter(c => !formData.contract_id || c.contract_id === formData.contract_id).map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.calculation_period} - {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c.currency }).format(c.rfa_amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Sujet */}
            <div className="space-y-2">
              <Label>{t('contracts.communications.subject', 'Sujet')}</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder={generateDefaultSubject()}
              />
            </div>
            
            {/* Message personnalisé */}
            <div className="space-y-2">
              <Label>{t('contracts.communications.custom_message', 'Message personnalisé (optionnel)')}</Label>
              <Textarea
                value={formData.custom_message}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_message: e.target.value }))}
                placeholder="Ajoutez un message personnalisé..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleCreateCommunication(false)}
              disabled={creating}
            >
              {creating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              {t('contracts.communications.save_draft', 'Enregistrer brouillon')}
            </Button>
            <Button
              onClick={() => handleCreateCommunication(true)}
              disabled={creating || sending}
            >
              {sending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              {t('contracts.communications.send_now', 'Envoyer maintenant')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog prévisualisation */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('contracts.communications.preview', 'Aperçu de la communication')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCommunication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('contracts.communications.to', 'À')}</p>
                  <p className="font-medium">{selectedCommunication.recipient_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('contracts.communications.status', 'Statut')}</p>
                  {getStatusBadge(selectedCommunication.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">{t('contracts.communications.date', 'Date')}</p>
                  <p>{new Date(selectedCommunication.created_at).toLocaleString('fr-FR')}</p>
                </div>
                {selectedCommunication.sent_at && (
                  <div>
                    <p className="text-muted-foreground">{t('contracts.communications.sent_at', 'Envoyé le')}</p>
                    <p>{new Date(selectedCommunication.sent_at).toLocaleString('fr-FR')}</p>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-muted-foreground text-sm mb-1">{t('contracts.communications.subject', 'Sujet')}</p>
                <p className="font-medium">{selectedCommunication.subject}</p>
              </div>
              
              {selectedCommunication.error_message && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {selectedCommunication.error_message}
                  </p>
                </div>
              )}
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-2 text-sm font-medium">
                  {t('contracts.communications.content', 'Contenu')}
                </div>
                <div 
                  className="p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: selectedCommunication.body_html }}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              {t('common.close', 'Fermer')}
            </Button>
            {selectedCommunication && (selectedCommunication.status === 'draft' || selectedCommunication.status === 'failed') && (
              <Button
                onClick={() => {
                  handleSendCommunication(selectedCommunication.id);
                  setShowPreviewDialog(false);
                }}
                disabled={sending}
              >
                {sending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {t('contracts.communications.send', 'Envoyer')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RFACommunicationsPanel;
