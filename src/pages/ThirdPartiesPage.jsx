import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building, AlertTriangle, BarChart3 } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import ThirdPartiesManagement from '@/components/third-parties/ThirdPartiesManagement';

export default function ThirdPartiesPage() {
  const { t } = useLocale();

  return (
    <motion.div 
      className="container mx-auto p-4 md:p-6 space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className="text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 gradient-text">
          {t('thirdParties.pageTitle')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('thirdParties.pageSubtitle')}
        </p>
      </header>

      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="clients" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md">
            <Users className="mr-2 h-5 w-5" /> {t('clients')}
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md">
            <Building className="mr-2 h-5 w-5" /> {t('suppliers')}
          </TabsTrigger>
          <TabsTrigger value="unpaid" disabled className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md">
            <AlertTriangle className="mr-2 h-5 w-5" /> {t('thirdParties.unpaidTracking')}
          </TabsTrigger>
          <TabsTrigger value="solvency" disabled className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md">
            <BarChart3 className="mr-2 h-5 w-5" /> {t('thirdParties.solvencyAnalysis')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-6">
          <ThirdPartiesManagement type="CLIENT" />
        </TabsContent>

        <TabsContent value="suppliers" className="mt-6">
          <ThirdPartiesManagement type="SUPPLIER" />
        </TabsContent>

        <TabsContent value="unpaid" className="mt-6">
          <Card className="shadow-lg border-none bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center"><AlertTriangle className="mr-2 text-destructive" />{t('thirdParties.unpaidTracking')}</CardTitle>
              <CardDescription>{t('thirdParties.unpaidTrackingSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[300px] flex flex-col items-center justify-center text-center">
              <img alt="Suivi des impayés illustration" className="w-48 h-48 mb-6 opacity-70" src="https://images.unsplash.com/photo-1535281047371-e7d8b0e96d7f" />
              <p className="text-lg text-muted-foreground mb-2">{t('comingSoon')}</p>
              <p className="text-sm text-muted-foreground px-6">{t('thirdParties.unpaidTrackingComingSoonDetail')}</p>
              <Button variant="ghost" className="mt-6 text-primary hover:text-primary/80">{t('learnMore')}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solvency" className="mt-6">
          <Card className="shadow-lg border-none bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center"><BarChart3 className="mr-2 text-accent-foreground" />{t('thirdParties.solvencyAnalysis')}</CardTitle>
              <CardDescription>{t('thirdParties.solvencyAnalysisSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[300px] flex flex-col items-center justify-center text-center">
              <img alt="Analyse de solvabilité illustration" className="w-48 h-48 mb-6 opacity-70" src="https://images.unsplash.com/photo-1674027392842-29f8354e236c" />
              <p className="text-lg text-muted-foreground mb-2">{t('comingSoon')}</p>
              <p className="text-sm text-muted-foreground px-6">{t('thirdParties.solvencyAnalysisComingSoonDetail')}</p>
              <Button variant="ghost" className="mt-6 text-primary hover:text-primary/80">{t('learnMore')}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}