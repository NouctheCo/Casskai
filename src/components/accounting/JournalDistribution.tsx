import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface JournalData {
  name: string;
  code: string;
  amount: number;
  percentage: number;
  color: string;
}

export default function JournalDistribution() {
  const { currentCompany } = useAuth();
  const [journals, setJournals] = useState<JournalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (currentCompany?.id) {
      loadJournalDistribution();
    }
  }, [currentCompany?.id]);

  const loadJournalDistribution = async () => {
    try {
      setIsLoading(true);
      
      // Charger les journaux avec leurs totaux
      const { data, error } = await supabase
        .from('journals')
        .select('code, name, total_debit, total_credit')
        .eq('company_id', currentCompany.id)
        .eq('status', 'active');

      if (error) throw error;

      if (!data || data.length === 0) {
        setJournals([]);
        setTotal(0);
        return;
      }

      // Calculer le total général
      const totalAmount = data.reduce((sum, journal) => {
        return sum + (journal.total_debit || 0);
      }, 0);

      // Assigner des couleurs aux journaux
      const colors = ['blue', 'green', 'purple', 'orange', 'red', 'indigo', 'cyan'];
      
      // Mapper les données avec pourcentages
      const journalData: JournalData[] = data.map((journal, index) => {
        const amount = journal.total_debit || 0;
        const percentage = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;
        
        return {
          name: journal.name,
          code: journal.code,
          amount,
          percentage,
          color: colors[index % colors.length]
        };
      });

      setJournals(journalData);
      setTotal(totalAmount);
    } catch (error) {
      console.error('Error loading journal distribution:', error);
      setJournals([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-purple-500" />
                <span>Répartition par journal</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (journals.length === 0) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-purple-500" />
                <span>Répartition par journal</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <PieChart className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune donnée disponible</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Les données de répartition par journal apparaîtront ici une fois que vous aurez créé des écritures comptables.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              <span>Répartition par journal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {journals.map((journal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{journal.name}</span>
                    <span>{journal.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € ({journal.percentage}%)</span>
                  </div>
                  <Progress value={journal.percentage} className="h-2" />
                </div>
              ))}
              <div className="pt-4 border-t mt-4">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>{total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
