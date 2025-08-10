/**
 * E-invoice Statistics Component
 * Display e-invoicing statistics and analytics
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  FileText, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react';

interface EInvoiceStatisticsProps {
  companyId: string;
  statistics: {
    total_documents: number;
    by_status: Record<string, number>;
    by_format: Record<string, number>;
    by_channel: Record<string, number>;
    success_rate: number;
    recent_activity: Array<{
      date: string;
      count: number;
    }>;
  } | null;
}

const statusColors = {
  DRAFT: '#94a3b8',
  SUBMITTED: '#3b82f6',
  DELIVERED: '#10b981',
  ACCEPTED: '#059669',
  REJECTED: '#ef4444',
  PAID: '#8b5cf6'
};

const formatColors = {
  FACTURX: '#3b82f6',
  UBL: '#10b981',
  CII: '#f59e0b'
};

export const EInvoiceStatistics: React.FC<EInvoiceStatisticsProps> = ({
  companyId,
  statistics
}) => {
  if (!statistics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Transform data for charts
  const statusData = Object.entries(statistics.by_status).map(([status, count]) => ({
    name: status,
    value: count,
    color: statusColors[status as keyof typeof statusColors] || '#94a3b8'
  }));

  const formatData = Object.entries(statistics.by_format).map(([format, count]) => ({
    name: format,
    value: count,
    color: formatColors[format as keyof typeof formatColors] || '#94a3b8'
  }));

  const activityData = statistics.recent_activity.map(item => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { 
      month: 'short', 
      day: 'numeric' 
    }),
    count: item.count
  }));

  const totalProcessed = Object.values(statistics.by_status).reduce((sum, count) => sum + count, 0);
  const successfulDocs = (statistics.by_status.DELIVERED || 0) + 
                        (statistics.by_status.ACCEPTED || 0) + 
                        (statistics.by_status.PAID || 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total documents</p>
                <p className="text-2xl font-bold">{statistics.total_documents}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de succès</p>
                <p className="text-2xl font-bold">{statistics.success_rate}%</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <Progress value={statistics.success_rate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">
                  {(statistics.by_status.DRAFT || 0) + (statistics.by_status.SUBMITTED || 0)}
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejetées</p>
                <p className="text-2xl font-bold">{statistics.by_status.REJECTED || 0}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Répartition par statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, 'Documents']}
                    labelStyle={{ color: '#000' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Format Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formatData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={4}>
                    {formatData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activité des 7 derniers jours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques détaillées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Performance Metrics */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Performance
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Documents traités</span>
                  <span className="font-medium">{totalProcessed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Succès</span>
                  <span className="font-medium text-green-600">{successfulDocs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Échecs</span>
                  <span className="font-medium text-red-600">{statistics.by_status.REJECTED || 0}</span>
                </div>
              </div>
            </div>

            {/* Channel Statistics */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Canaux utilisés
              </h4>
              <div className="space-y-2">
                {Object.entries(statistics.by_channel).map(([channel, count]) => (
                  <div key={channel} className="flex justify-between">
                    <span className="text-sm">{channel === 'PPF' ? 'Chorus Pro' : channel}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Conformité
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">EN 16931 validé</span>
                  <span className="font-medium text-green-600">
                    {Math.round((successfulDocs / Math.max(totalProcessed, 1)) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Factur-X 1.0.7</span>
                  <span className="font-medium text-green-600">
                    {statistics.by_format.FACTURX || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {statistics.success_rate < 90 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <TrendingUp className="h-5 w-5" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-yellow-700">
              {statistics.success_rate < 70 && (
                <p>• Votre taux de succès est faible. Vérifiez la qualité de vos données de facturation.</p>
              )}
              {(statistics.by_status.REJECTED || 0) > 0 && (
                <p>• Analysez les raisons de rejet pour améliorer la validation EN 16931.</p>
              )}
              {statistics.total_documents < 10 && (
                <p>• Commencez par traiter plus de factures pour obtenir des statistiques représentatives.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};