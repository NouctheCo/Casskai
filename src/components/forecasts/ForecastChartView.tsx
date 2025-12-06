import React from 'react';

import {

  LineChart,

  Line,

  XAxis,

  YAxis,

  CartesianGrid,

  Tooltip,

  Legend,

  ResponsiveContainer

} from 'recharts';

import { ForecastData, ChartDataPoint, ForecastChart } from '../../types/forecasts.types';



interface ForecastChartViewProps {

  forecast: ForecastData;

  chartConfig?: Partial<ForecastChart>;

  className?: string;

}



const ForecastChartView: React.FC<ForecastChartViewProps> = ({

  forecast,

  chartConfig: _chartConfig,

  className = ""

}) => {

  // Transform forecast data into chart data points

  const _generateChartData = (): ChartDataPoint[] => {

    // For now, we'll create a simple annual view

    // This can be expanded to handle monthly/quarterly data in the future

    const currentYear = new Date().getFullYear();

    

    return [

      {

        period: `${currentYear}`,

        value: forecast.total_revenue,

        category: 'Revenus',

        scenario: forecast.scenario_id

      },

      {

        period: `${currentYear}`,

        value: forecast.total_expenses,

        category: 'Dépenses',

        scenario: forecast.scenario_id

      }

    ];

  };



  // Prepare data for recharts (separate revenue and expenses)

  const prepareRechartsData = () => {

    const _currentYear = new Date().getFullYear();

    

    // For demonstration, create a 12-month projection

    const months = [

      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',

      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'

    ];



    return months.map((month, index) => ({

      period: month,

      revenus: Math.round(forecast.total_revenue / 12 * (1 + Math.sin(index / 2) * 0.1)),

      depenses: Math.round(forecast.total_expenses / 12 * (1 + Math.cos(index / 3) * 0.05)),

      benefices: Math.round((forecast.total_revenue - forecast.total_expenses) / 12 * (1 + Math.sin(index / 2) * 0.1))

    }));

  };



  const chartData = prepareRechartsData();



  const formatCurrency = (value: number) => {

    return new Intl.NumberFormat('fr-FR', {

      style: 'currency',

      currency: 'EUR',

      minimumFractionDigits: 0,

      maximumFractionDigits: 0

    }).format(value);

  };



  const CustomTooltip = ({ active, payload, label }: any) => {

    if (active && payload && payload.length) {

      return (

        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">

          <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">{`${label} ${new Date().getFullYear()}`}</p>

          {payload.map((entry: any, index: number) => (

            <p key={index} style={{ color: entry.color }} className="text-sm">

              {`${entry.name}: ${formatCurrency(entry.value)}`}

            </p>

          ))}

        </div>

      );

    }

    return null;

  };



  return (

    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>

      <div className="mb-6">

        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">

          Évolution Financière - {forecast.name}

        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400">

          Projection mensuelle des revenus et dépenses pour l'année en cours

        </p>

      </div>



      <div className="h-80 w-full">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart

            data={chartData}

            margin={{

              top: 20,

              right: 30,

              left: 20,

              bottom: 20,

            }}

          >

            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

            <XAxis 

              dataKey="period" 

              stroke="#6b7280"

              tick={{ fontSize: 12 }}

              axisLine={{ stroke: '#e5e7eb' }}

            />

            <YAxis 

              stroke="#6b7280"

              tick={{ fontSize: 12 }}

              axisLine={{ stroke: '#e5e7eb' }}

              tickFormatter={(value) => formatCurrency(value)}

            />

            <Tooltip content={<CustomTooltip />} />

            <Legend 

              wrapperStyle={{ paddingTop: '20px' }}

              iconType="line"

            />

            <Line

              type="monotone"

              dataKey="revenus"

              stroke="#10b981"

              strokeWidth={3}

              name="Revenus"

              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}

              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}

            />

            <Line

              type="monotone"

              dataKey="depenses"

              stroke="#ef4444"

              strokeWidth={3}

              name="Dépenses"

              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}

              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}

            />

            <Line

              type="monotone"

              dataKey="benefices"

              stroke="#3b82f6"

              strokeWidth={2}

              strokeDasharray="5 5"

              name="Bénéfices"

              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}

              activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}

            />

          </LineChart>

        </ResponsiveContainer>

      </div>



      <div className="mt-4 grid grid-cols-3 gap-4">

        <div className="text-center p-3 bg-green-50 rounded-lg dark:bg-green-900/20">

          <div className="flex items-center justify-center mb-1">

            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 dark:bg-green-900/20"></div>

            <span className="text-sm font-medium text-green-800">Revenus Annuels</span>

          </div>

          <p className="text-lg font-bold text-green-600">

            {formatCurrency(forecast.total_revenue)}

          </p>

        </div>

        

        <div className="text-center p-3 bg-red-50 rounded-lg dark:bg-red-900/20">

          <div className="flex items-center justify-center mb-1">

            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 dark:bg-red-900/20"></div>

            <span className="text-sm font-medium text-red-800">Dépenses Annuelles</span>

          </div>

          <p className="text-lg font-bold text-red-600 dark:text-red-400">

            {formatCurrency(forecast.total_expenses)}

          </p>

        </div>

        

        <div className="text-center p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">

          <div className="flex items-center justify-center mb-1">

            <div className="w-3 h-0.5 bg-blue-500 mr-2 border-dashed border dark:bg-blue-900/20"></div>

            <span className="text-sm font-medium text-blue-800">Bénéfice Net</span>

          </div>

          <p className="text-lg font-bold text-blue-600">

            {formatCurrency(forecast.total_revenue - forecast.total_expenses)}

          </p>

        </div>

      </div>

    </div>

  );

};



export default ForecastChartView;
