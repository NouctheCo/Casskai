import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KanbanSquare, PlusCircle, Search, ListFilter, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/contexts/LocaleContext';
import { motion } from 'framer-motion';
import { DatePicker } from '@/components/ui/date-picker';

export default function ProjectsPage() {
  const { t } = useLocale();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleNewProject = () => {
    setShowProjectForm(true);
  };

  const handleBackToList = () => {
    setShowProjectForm(false);
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
          <h1 className="text-3xl font-bold tracking-tight">{t('projects')}</h1>
          <p className="text-muted-foreground">{t('projectspage.suivez_vos_projets_internes_et_clients', { defaultValue: 'Suivez vos projets internes et clients.' })}</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={handleNewProject}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('projectspage.nouveau_projet', { defaultValue: 'Nouveau Projet' })}
          </Button>
        </motion.div>
      </div>

      {showProjectForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('projectspage.nouveau_projet', { defaultValue: 'Nouveau Projet' })}</CardTitle>
            <CardDescription>{t('projectspage.crez_un_nouveau_projet', { defaultValue: 'Créez un nouveau projet' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="projectName" className="text-sm font-medium">{t('projectspage.nom_du_projet', { defaultValue: 'Nom du projet' })}</label>
                <Input id="projectName" placeholder={t('projectspage.refonte_site_web_client_abc', { defaultValue: 'Refonte site web client ABC' })} />
              </div>
              <div>
                <label htmlFor="projectClient" className="text-sm font-medium">{t('projectspage.client', { defaultValue: 'Client' })}</label>
                <Input id="projectClient" placeholder={t('projectspage.slectionner_un_client', { defaultValue: 'Sélectionner un client' })} />
              </div>
            </div>
            
            <div>
              <label htmlFor="projectDescription" className="text-sm font-medium">{t('projectspage.description', { defaultValue: 'Description' })}</label>
              <textarea id="projectDescription" className="w-full border rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" rows="3" placeholder={t('projectspage.description', { defaultValue: 'Description' }) + ' détaillée du projet'}></textarea>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="projectStartDate" className="text-sm font-medium">{t('projectspage.date_de_dbut', { defaultValue: 'Date de début' })}</label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder={t('projectspage.slectionnez_une_date', { defaultValue: 'Sélectionnez une date' })}
                />
              </div>
              <div>
                <label htmlFor="projectEndDate" className="text-sm font-medium">{t('projectspage.date_de_fin_prvue', { defaultValue: 'Date de fin prévue' })}</label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder={t('projectspage.slectionnez_une_date', { defaultValue: 'Sélectionnez une date' })}
                />
              </div>
              <div>
                <label htmlFor="projectBudget" className="text-sm font-medium">{t('projectspage.budget_', { defaultValue: 'Budget (€)' })}</label>
                <Input id="projectBudget" placeholder="25000" type="number" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="projectManager" className="text-sm font-medium">{t('projectspage.chef_de_projet', { defaultValue: 'Chef de projet' })}</label>
                <Input id="projectManager" placeholder={t('projectspage.slectionner_un_responsable', { defaultValue: 'Sélectionner un responsable' })} />
              </div>
              <div>
                <label htmlFor="projectStatus" className="text-sm font-medium">{t('projectspage.statut', { defaultValue: 'Statut' })}</label>
                <select id="projectStatus" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option>{t('projectspage.en_prparation', { defaultValue: 'En préparation' })}</option>
                  <option>{t('projectspage.en_cours', { defaultValue: 'En cours' })}</option>
                  <option>{t('projectspage.en_pause', { defaultValue: 'En pause' })}</option>
                  <option>{t('projectspage.termin', { defaultValue: 'Terminé' })}</option>
                  <option>{t('projectspage.annul', { defaultValue: 'Annulé' })}</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleBackToList} variant="outline">{t('projectspage.annuler', { defaultValue: 'Annuler' })}</Button>
              <Button>{t('projectspage.crer_le_projet', { defaultValue: 'Créer le projet' })}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <CardTitle>{t('projectspage.liste_des_projets', { defaultValue: 'Liste des Projets' })}</CardTitle>
                <CardDescription>{t('projectspage.vue_densemble_de_tous_vos_projets_en_cours', { defaultValue: 'Vue d\'ensemble de tous vos projets en cours.' })}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder={t('projectspage.rechercher_projet', { defaultValue: 'Rechercher projet...' })} className="pl-8 w-full md:w-[250px]" />
                </div>
                <Button variant="outline" size="icon"><ListFilter className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <KanbanSquare className="mx-auto h-16 w-16 text-primary/50" />
              <p className="mt-4 text-lg text-muted-foreground">{t('projectspage.aucun_projet_pour_le_moment', { defaultValue: 'Aucun projet pour le moment' })}</p>
              <p className="text-sm text-muted-foreground mb-4">{t('projectspage.commencez_par_crer_votre_premier_projet', { defaultValue: 'Commencez par créer votre premier projet' })}</p>
              <Button onClick={handleNewProject}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Premier projet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

        <div className="grid gap-6 md:grid-cols-3">
            <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="text-green-500"/>Tâches {t('projectspage.termin', { defaultValue: 'Terminé' })}es</CardTitle></CardHeader>
            <CardContent className="h-[150px] flex items-center justify-center">
                <p className="text-muted-foreground">{t('comingSoon')}</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="text-yellow-500"/>{t('projectspage.tches_en_cours', { defaultValue: 'Tâches en Cours' })}</CardTitle></CardHeader>
            <CardContent className="h-[150px] flex items-center justify-center">
                <p className="text-muted-foreground">{t('comingSoon')}</p>
            </CardContent>
            </Card>
            <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="text-red-500"/>{t('projectspage.tches_en_retard', { defaultValue: 'Tâches en Retard' })}</CardTitle></CardHeader>
            <CardContent className="h-[150px] flex items-center justify-center">
                <p className="text-muted-foreground">{t('comingSoon')}</p>
            </CardContent>
            </Card>
        </div>
    </motion.div>
  );
}