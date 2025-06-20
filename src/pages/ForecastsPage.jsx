import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, PlusCircle, TrendingUp, SlidersHorizontal, AlertTriangle, ArrowLeft, BarChart3 } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { motion } from 'framer-motion';
import { DatePicker } from '@/components/ui/date-picker';

export default function ForecastsPage() {
  const { t } = useLocale();
  const [showScenarioForm, setShowScenarioForm] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleCreateScenario = () => {
    setShowScenarioForm(true);
  };

  const handleBackToList = () => {
    setShowScenarioForm(false);
  };

  const forecastElements = [
    { name: t('scenarios'), icon: SlidersHorizontal, description: "Modélisez différents scénarios (optimiste, pessimiste)." },
    { name: t('projections') + " 3-5 ans", icon: TrendingUp, description: "Projetez votre CA, charges, et résultats." },
  ];

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('financialForecasts')}</h1>
          <p className="text-muted-foreground">{t('forecastspage.planifiez_lavenir_financier_de_votre_entreprise', { defaultValue: 'Planifiez l\'avenir financier de votre entreprise.' })}</p>
        </div>
        {!showScenarioForm && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={handleCreateScenario}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('createScenario')}
            </Button>
          </motion.div>
        )}
      </div>

      {showScenarioForm ? (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleBackToList} className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>{t('forecastspage.nouveau_scnario_prvisionnel', { defaultValue: 'Nouveau Scénario Prévisionnel' })}</CardTitle>
                  <CardDescription>{t('forecastspage.crez_un_scnario_de_prvisions_financires', { defaultValue: 'Créez un scénario de prévisions financières' })}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="scenario-name" className="block text-sm font-medium mb-1">{t('forecastspage.nom_du_scnario', { defaultValue: 'Nom du scénario' })}</label>
                  <Input id="scenario-name" placeholder={t('forecastspage.scnario_optimiste_2025', { defaultValue: 'Scénario optimiste 2025' })} />
                </div>
                <div>
                  <label htmlFor="scenario-type" className="block text-sm font-medium mb-1">{t('forecastspage.type_de_scnario', { defaultValue: 'Type de scénario' })}</label>
                  <select id="scenario-type" className="w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option>{t('forecastspage.optimiste', { defaultValue: 'Optimiste' })}</option>
                    <option>{t('forecastspage.raliste', { defaultValue: 'Réaliste' })}</option>
                    <option>{t('forecastspage.pessimiste', { defaultValue: 'Pessimiste' })}</option>
                    <option>{t('forecastspage.personnalis', { defaultValue: 'Personnalisé' })}</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="scenario-description" className="block text-sm font-medium mb-1">{t('forecastspage.description', { defaultValue: 'Description' })}</label>
                <textarea id="scenario-description" className="w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" rows="2" placeholder={t('forecastspage.dcrivez_les_hypothses_de_ce_scnario', { defaultValue: 'Décrivez les hypothèses de ce scénario' })}></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium mb-1">{t('forecastspage.priode_de_dbut', { defaultValue: 'Période de début' })}</label>
                  <DatePicker 
                    value={startDate}
                    onChange={setStartDate}
                    placeholder={t('forecastspage.slectionnez_une_date', { defaultValue: 'Sélectionnez une date' })}
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium mb-1">{t('forecastspage.priode_de_fin', { defaultValue: 'Période de fin' })}</label>
                  <DatePicker 
                    value={endDate}
                    onChange={setEndDate}
                    placeholder={t('forecastspage.slectionnez_une_date', { defaultValue: 'Sélectionnez une date' })}
                  />
                </div>
                <div>
                  <label htmlFor="currency-select" className="block text-sm font-medium mb-1">{t('forecastspage.devise', { defaultValue: 'Devise' })}</label>
                  <select id="currency-select" className="w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option>{t('forecastspage.eur_euro', { defaultValue: 'EUR - Euro' })}</option>
                    <option>{t('forecastspage.usd_dollar', { defaultValue: 'USD - Dollar' })}</option>
                    <option>{t('forecastspage.gbp_livre_sterling', { defaultValue: 'GBP - Livre Sterling' })}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleBackToList} variant="outline">{t('forecastspage.annuler', { defaultValue: 'Annuler' })}</Button>
                <Button>{t('forecastspage.crer_le_scnario', { defaultValue: 'Créer le scénario' })}</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {forecastElements.map((element, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -5, boxShadow: "0px 8px 15px rgba(0,0,0,0.07)" }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <element.icon className="h-8 w-8 text-primary" />
                      <CardTitle>{element.name}</CardTitle>
                    </div>
                    <CardDescription>{element.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[150px] flex items-center justify-center">
                    <div className="text-center">
                      <Zap className="mx-auto h-16 w-16 text-primary/30" />
                      <p className="ml-4 text-muted-foreground">{t('comingSoon')}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('forecastspage.budget_vs_ralis', { defaultValue: 'Budget vs Réalisé' })}</CardTitle>
              <CardDescription>{t('forecastspage.suivez_vos_performances_par_rapport_vos_prvisions_budgtaires', { defaultValue: 'Suivez vos performances par rapport à vos prévisions budgétaires.' })}</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-primary/50" />
                <p className="mt-4 text-muted-foreground">{t('forecastspage.aucun_scnario_cr', { defaultValue: 'Aucun scénario créé' })}</p>
                <Button variant="link" className="mt-2" onClick={handleCreateScenario}>
                  Créer votre premier scénario
                </Button>
              </div>
            </CardContent>
          </Card>
           <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50">
              <CardHeader className="flex flex-row items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                <CardTitle className="text-blue-700 dark:text-blue-300">{t('forecastspage.hypothses_cls', { defaultValue: 'Hypothèses Clés' })}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-600 dark:text-blue-300/80">
                  La précision de vos prévisions dépend des hypothèses que vous définissez (taux de croissance, saisonnalité, inflation, etc.). Prenez le temps de bien les paramétrer.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}