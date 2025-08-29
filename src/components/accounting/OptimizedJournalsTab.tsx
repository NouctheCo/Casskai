import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, FileText, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';

export default function OptimizedJournalsTab() {
  const [journals] = useState([
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
  ]);

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

  const summary = {
    totalJournals: journals.length,
    totalEntries: journals.reduce((sum, j) => sum + j.entries, 0),
    totalDebit: journals.reduce((sum, j) => sum + j.totalDebit, 0),
    activeJournals: journals.filter(j => j.status === 'active').length
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

      {/* Journals Table */}
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
                      <Badge variant="secondary">{journal.entries}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {journal.totalDebit.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {journal.totalCredit.toFixed(2)} €
                    </TableCell>
                    <TableCell>{getStatusBadge(journal.status)}</TableCell>
                    <TableCell>{new Date(journal.lastEntry).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}