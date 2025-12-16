/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 *
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 *
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';

interface JournalDistribution {
  name: string;
  code: string;
  count: number;
  percentage: number;
}

interface JournalDistributionChartProps {
  data: JournalDistribution[];
  loading?: boolean;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
];

const JournalDistributionChart: React.FC<JournalDistributionChartProps> = ({ data, loading }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('accounting.journalDistribution.title', 'Répartition par journal')}
          </h3>
        </div>
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('accounting.journalDistribution.title', 'Répartition par journal')}
          </h3>
        </div>
        <div className="flex items-center justify-center h-80 text-gray-500">
          {t('accounting.journalDistribution.noData', 'Aucune donnée disponible')}
        </div>
      </div>
    );
  }

  // Prepare data for chart
  const chartData = data.map(item => ({
    name: `${item.code} - ${item.name}`,
    value: item.count,
    percentage: item.percentage
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            {t('accounting.journalDistribution.entries', 'Écritures')}: {payload[0].value}
          </p>
          <p className="text-sm text-gray-600">
            {payload[0].payload.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t('accounting.journalDistribution.title', 'Répartition par journal')}
        </h3>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string, _entry: any) => {
                const item = data[chartData.findIndex(d => d.name === value)];
                return `${value} (${item?.count || 0})`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Summary statistics */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">
              {t('accounting.journalDistribution.totalJournals', 'Total journaux')}:
            </span>
            <span className="ml-2 font-semibold text-gray-900">{data.length}</span>
          </div>
          <div>
            <span className="text-gray-600">
              {t('accounting.journalDistribution.totalEntries', 'Total écritures')}:
            </span>
            <span className="ml-2 font-semibold text-gray-900">
              {data.reduce((sum, item) => sum + item.count, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalDistributionChart;
