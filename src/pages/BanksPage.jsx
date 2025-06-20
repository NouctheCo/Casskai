import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Landmark, PlusCircle, CreditCard, AlertTriangle, Shuffle, BarChartHorizontal, PiggyBank, ArrowLeft } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { motion } from 'framer-motion';

const BankAccountCard = ({ name, balance, lastSync, logoUrl }) => {
  const { t } = useLocale();
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0px 8px 15px rgba(0,0,0,0.1)" }}
      transition={{ type: "spring", stiffness: 300 }}
    >
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 bg-secondary/30">
        <div className="flex items-center gap-3">
          {logoUrl ? <img src={logoUrl} alt={`${name} logo`} className="h-8 w-8 rounded-full" /> : <Landmark className="h-8 w-8 text-primary" />}
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
        </div>
        <Button variant="ghost" size="sm">{t('manage')}</Button>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-2xl font-bold">{balance}</div>
        <p className="text-xs text-muted-foreground">{lastSync}</p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm">{t('viewTransactions')}</Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">{t('disconnect')}</Button>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
};
    
export default function BanksPage() {
  const { t } = useLocale();
  const [showConnectForm, setShowConnectForm] = useState(false);

  const handleConnectAccount = () => {
    setShowConnectForm(true);
  };

  const handleBackToList = () => {
    setShowConnectForm(false);
  };

  const accounts = [
    { name: "Banque Populaire", balance: "€12,345.67", lastSync: t('lastSyncToday', { time: "10:30" }), logoUrl: "" },
    { name: "Crédit Agricole", balance: "€8,765.43", lastSync: t('lastSyncYesterday', { time: "17:00" }), logoUrl: "" },
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
          <h1 className="text-3xl font-bold tracking-tight">{t('bankConnections')}</h1>
          <p className="text-muted-foreground">{t('connectAndTrackBanks')}</p>
        </div>
        {!showConnectForm && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={handleConnectAccount}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('connectBank')}
            </Button>
          </motion.div>
        )}
      </div>

      {showConnectForm ? (
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
                  <CardTitle>Connexion Bancaire</CardTitle>
                  <CardDescription>Connectez votre compte bancaire en toute sécurité</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="bank-select" className="block text-sm font-medium mb-1">Choisir votre banque</label>
                <select id="bank-select" className="w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option>Sélectionner votre banque...</option>
                  <option>Banque Populaire</option>
                  <option>Crédit Agricole</option>
                  <option>BNP Paribas</option>
                  <option>Société Générale</option>
                  <option>LCL</option>
                  <option>Crédit Mutuel</option>
                  <option>La Banque Postale</option>
                  <option>Autre banque</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bank-identifier" className="block text-sm font-medium mb-1">Identifiant</label>
                  <Input id="bank-identifier" placeholder="Votre identifiant bancaire" type="text" />
                </div>
                <div>
                  <label htmlFor="bank-password" className="block text-sm font-medium mb-1">Code confidentiel</label>
                  <Input id="bank-password" placeholder="••••••" type="password" />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/30 dark:border-blue-700/50">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center"><Landmark className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400"/>🔒 Connexion sécurisée</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300/80">
                  Vos identifiants sont chiffrés et transmis directement à votre banque. 
                  Nous utilisons la technologie PSD2 pour garantir la sécurité.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={handleBackToList} variant="outline">Annuler</Button>
                <Button>Se connecter</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
          {accounts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <BankAccountCard {...account} />
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="h-[300px] flex flex-col items-center justify-center text-center">
                <CreditCard className="mx-auto h-16 w-16 text-primary/50" />
                <p className="mt-4 text-lg text-muted-foreground">{t('noAccountsConnected')}</p>
                <p className="text-sm text-muted-foreground mb-4">{t('connectFirstAccountPrompt')}</p>
                <Button onClick={handleConnectAccount}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('connectBank')}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-3 mt-8">
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Shuffle className="text-blue-500"/>{t('bankReconciliation')}</CardTitle>
                      <CardDescription>{t('reconcileTransactions')}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[150px] flex items-center justify-center">
                      <p className="text-muted-foreground">{t('comingSoon')}</p>
                  </CardContent>
              </Card>
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><BarChartHorizontal className="text-green-500"/>{t('transactionCategorization')}</CardTitle>
                      <CardDescription>{t('aiCategorization')}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[150px] flex items-center justify-center">
                      <p className="text-muted-foreground">{t('comingSoon')}</p>
                  </CardContent>
              </Card>
               <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><PiggyBank className="text-purple-500"/>{t('cashFlowForecast')}</CardTitle>
                      <CardDescription>{t('historyBasedProjections')}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[150px] flex items-center justify-center">
                      <p className="text-muted-foreground">{t('comingSoon')}</p>
                  </CardContent>
              </Card>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mt-8"
          >
            <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700/50">
              <CardHeader className="flex flex-row items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
                <CardTitle className="text-yellow-700 dark:text-yellow-300">{t('secureBankConnection')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-600 dark:text-yellow-300/80">
                  {t('secureBankConnectionDisclaimer')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}