import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Target, Briefcase, PlusCircle, Search, ListFilter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

export default function SalesCrmPage() {
  const { t } = useLocale();
  const { currentEnterpriseId } = useAuth();
  const { toast } = useToast();
  
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  const [closingDate, setClosingDate] = useState(null);
  const [opportunityName, setOpportunityName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [probability, setProbability] = useState('25');
  
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentEnterpriseId && showOpportunityForm) {
      fetchClients();
    }
  }, [currentEnterpriseId, showOpportunityForm]);

  const fetchClients = async () => {
    if (!currentEnterpriseId) return;
    
    setLoadingClients(true);
    try {
      const { data, error } = await supabase
        .from('third_parties')
        .select('id, name')
        .eq('company_id', currentEnterpriseId)
        .eq('type', 'CLIENT')
        .eq('is_active', true)
        .order('name');
        
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('salescrmpage.erreur_chargement_clients', { defaultValue: 'Erreur lors du chargement des clients' })
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const handleNewOpportunity = () => {
    setShowOpportunityForm(true);
    setOpportunityName('');
    setSelectedClientId('');
    setEstimatedAmount('');
    setProbability('25');
    setClosingDate(null);
  };

  const handleBackToList = () => {
    setShowOpportunityForm(false);
  };

  const handleCreateOpportunity = async () => {
    if (!opportunityName.trim()) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('salescrmpage.nom_opportunite_requis', { defaultValue: 'Le nom de l\'opportunité est requis' })
      });
      return;
    }
    
    if (!selectedClientId) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('salescrmpage.client_requis', { defaultValue: 'Veuillez sélectionner un client' })
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulation de création d'opportunité - à remplacer par un appel API réel
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t('success'),
        description: t('salescrmpage.opportunite_creee', { defaultValue: 'Opportunité créée avec succès' })
      });
      
      setShowOpportunityForm(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error.message || t('salescrmpage.erreur_creation', { defaultValue: 'Erreur lors de la création de l\'opportunité' })
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('salesCrm')}</h1>
          <p className="text-muted-foreground">{t('salescrmpage.grez_vos_clients_prospects_et_pipeline_commercial', { defaultValue: 'Gérez vos clients, prospects et pipeline commercial.' })}</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={handleNewOpportunity}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('salescrmpage.nouvelle_opportunite', { defaultValue: 'Nouvelle Opportunité' })}
          </Button>
        </motion.div>
      </div>

      {showOpportunityForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('salescrmpage.nouvelle_opportunit_commerciale', { defaultValue: 'Nouvelle Opportunité Commerciale' })}</CardTitle>
            <CardDescription>{t('salescrmpage.crez_une_nouvelle_opportunit_de_vente', { defaultValue: 'Créez une nouvelle opportunité de vente' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="opportunity-name" className="text-sm font-medium">{t('salescrmpage.nom_de_lopportunit', { defaultValue: 'Nom de l\'opportunité' })}</label>
                <Input 
                  id="opportunity-name" 
                  value={opportunityName}
                  onChange={(e) => setOpportunityName(e.target.value)}
                  placeholder={t('salescrmpage.projet_abc_solution_crm', { defaultValue: 'Projet ABC - Solution CRM' })}
                />
              </div>
              <div>
                <label htmlFor="opportunity-client" className="text-sm font-medium">{t('salescrmpage.clientprospect', { defaultValue: 'Client/Prospect' })}</label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger id="opportunity-client">
                    <SelectValue placeholder={t('salescrmpage.slectionner_un_client', { defaultValue: 'Sélectionner un client' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingClients ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>{t('common.loading', { defaultValue: 'Chargement...' })}</span>
                      </div>
                    ) : clients.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        {t('salescrmpage.aucun_client', { defaultValue: 'Aucun client disponible' })}
                      </div>
                    ) : (
                      clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="opportunity-amount" className="text-sm font-medium">{t('salescrmpage.montant_estim_', { defaultValue: 'Montant estimé (€)' })}</label>
                <Input 
                  id="opportunity-amount" 
                  value={estimatedAmount}
                  onChange={(e) => setEstimatedAmount(e.target.value)}
                  placeholder="15000" 
                  type="number" 
                />
              </div>
              <div>
                <label htmlFor="opportunity-probability" className="text-sm font-medium">{t('salescrmpage.probabilit_', { defaultValue: 'Probabilité (%)' })}</label>
                <Select value={probability} onValueChange={setProbability}>
                  <SelectTrigger id="opportunity-probability">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">{t('salescrmpage.25_qualifi', { defaultValue: '25% - Qualifié' })}</SelectItem>
                    <SelectItem value="50">{t('salescrmpage.50_en_ngociation', { defaultValue: '50% - En négociation' })}</SelectItem>
                    <SelectItem value="75">{t('salescrmpage.75_proposition_envoye', { defaultValue: '75% - Proposition envoyée' })}</SelectItem>
                    <SelectItem value="90">{t('salescrmpage.90_accord_verbal', { defaultValue: '90% - Accord verbal' })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="opportunity-closing-date" className="text-sm font-medium">{t('salescrmpage.date_de_clture_prvue', { defaultValue: 'Date de clôture prévue' })}</label>
                <DatePicker
                  value={closingDate}
                  onChange={setClosingDate}
                  placeholder={t('salescrmpage.selectionner_date', { defaultValue: 'Sélectionner une date' })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleBackToList} variant="outline" disabled={isSubmitting}>
                {t('salescrmpage.annuler', { defaultValue: 'Annuler' })}
              </Button>
              <Button onClick={handleCreateOpportunity} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading', { defaultValue: 'Chargement...' })}
                  </>
                ) : (
                  t('salescrmpage.crer_lopportunit', { defaultValue: 'Créer l\'opportunité' })
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="text-primary"/>{t('salescrmpage.clients', { defaultValue: 'Clients' })}</CardTitle>
              </CardHeader>
              <CardContent className="h-[150px] flex flex-col items-center justify-center">
                <div className="text-2xl font-bold">24</div>
                <p className="text-sm text-muted-foreground">{t('salescrmpage.clients', { defaultValue: 'Clients' })} actifs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="text-primary"/>{t('salescrmpage.prospects', { defaultValue: 'Prospects' })}</CardTitle>
              </CardHeader>
              <CardContent className="h-[150px] flex flex-col items-center justify-center">
                <div className="text-2xl font-bold">12</div>
                <p className="text-sm text-muted-foreground">{t('salescrmpage.prospects', { defaultValue: 'Prospects' })} qualifiés</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase className="text-primary"/>{t('salescrmpage.pipeline', { defaultValue: 'Pipeline' })}</CardTitle>
              </CardHeader>
              <CardContent className="h-[150px] flex flex-col items-center justify-center">
                <div className="text-2xl font-bold">{t('salescrmpage.45_000', { defaultValue: '45 000€' })}</div>
                <p className="text-sm text-muted-foreground">{t('salescrmpage.opportunits_en_cours', { defaultValue: 'Opportunités en cours' })}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <CardTitle>{t('salescrmpage.opportunits_commerciales', { defaultValue: 'Opportunités Commerciales' })}</CardTitle>
                  <CardDescription>{t('salescrmpage.suivez_vos_opportunits_de_vente_en_cours', { defaultValue: 'Suivez vos opportunités de vente en cours.' })}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-full md:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder={t('salescrmpage.rechercher_opportunite', { defaultValue: 'Rechercher opportunité...' })} className="pl-8 w-full md:w-[250px]" />
                  </div>
                  <Button variant="outline" size="icon"><ListFilter className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Briefcase className="mx-auto h-16 w-16 text-primary/50" />
                <p className="mt-4 text-lg text-muted-foreground">{t('salescrmpage.aucune_opportunit_pour_le_moment', { defaultValue: 'Aucune opportunité pour le moment' })}</p>
                <Button onClick={handleNewOpportunity} className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('salescrmpage.premiere_opportunite', { defaultValue: 'Première opportunité' })}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}