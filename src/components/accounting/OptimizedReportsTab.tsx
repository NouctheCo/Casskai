import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Download, 
  FileText, 
  BarChart3, 
  PieChart,
  Calculator,
  Eye,
  Printer
} from 'lucide-react';

export default function OptimizedReportsTab() {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  const reports = [
    {
      id: 1,
      name: 'Balance générale',
      description: 'Balance de tous les comptes',
      icon: Calculator,
      color: 'blue',
      lastGenerated: '2024-01-20',
      size: '2.3 MB'
    },
    {
      id: 2,
      name: 'Compte de résultat',
      description: 'Produits et charges de la période',
      icon: TrendingUp,
      color: 'green',
      lastGenerated: '2024-01-19',
      size: '1.8 MB'
    },
    {
      id: 3,
      name: 'Bilan comptable',
      description: 'Situation patrimoniale',
      icon: BarChart3,
      color: 'purple',
      lastGenerated: '2024-01-18',
      size: '2.1 MB'
    },
    {
      id: 4,
      name: 'Grand livre',
      description: 'Détail des mouvements par compte',
      icon: FileText,
      color: 'orange',
      lastGenerated: '2024-01-17',
      size: '5.7 MB'
    },
    {
      id: 5,
      name: 'Journal général',
      description: 'Chronologie de toutes les écritures',
      icon: FileText,
      color: 'red',
      lastGenerated: '2024-01-16',
      size: '3.4 MB'
    },
    {
      id: 6,
      name: 'Export FEC',
      description: 'Fichier des écritures comptables',
      icon: Download,
      color: 'gray',
      lastGenerated: '2024-01-15',
      size: '1.2 MB'
    }
  ];

  const quickStats = [
    { label: 'Chiffre d\'affaires', value: 125430, trend: 8.5, color: 'green' },
    { label: 'Charges totales', value: 78650, trend: -2.3, color: 'red' },
    { label: 'Résultat net', value: 46780, trend: 15.2, color: 'blue' },
    { label: 'Marge nette', value: 37.3, trend: 4.1, color: 'purple', isPercentage: true }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
      gray: 'from-gray-500 to-gray-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">
                    {stat.isPercentage ? `${stat.value}%` : `${stat.value.toLocaleString('fr-FR')} €`}
                  </p>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                    stat.trend > 0 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    <span>{stat.trend > 0 ? '+' : ''}{stat.trend}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Period selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Rapports comptables</span>
            </CardTitle>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Mois en cours</SelectItem>
                <SelectItem value="current-quarter">Trimestre en cours</SelectItem>
                <SelectItem value="current-year">Année en cours</SelectItem>
                <SelectItem value="last-month">Mois dernier</SelectItem>
                <SelectItem value="custom">Période personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Reports Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getColorClasses(report.color)} flex items-center justify-center`}>
                    <report.icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {report.size}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {report.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {report.description}
                  </p>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Dernière génération: {new Date(report.lastGenerated).toLocaleDateString('fr-FR')}
                </div>
                
                <div className="flex space-x-2">
                  <Button size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Consulter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Printer className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-purple-500" />
            <span>Évolution mensuelle</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Graphique des tendances financières</p>
              <Button className="mt-4" variant="outline">
                Voir les graphiques détaillés
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}