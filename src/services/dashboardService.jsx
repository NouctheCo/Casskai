import { useLocale } from '@/contexts/LocaleContext';
import { useLocaleFormatter } from '@/hooks/useLocaleFormatter';
import { Chart } from '@/components/ui/chart';

export const DashboardChart = ({ data }) => {
  const { locale, t } = useLocale();
  const { formatCurrency } = useLocaleFormatter();

  if (!data || !data.labels || !data.datasets) {
    return <div>{t('dashboardservice.no_data_available', { defaultValue: 'No data available' })}</div>;
  }

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      tension: 0.3,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            return `${context.dataset.label}: ${formatCurrency(value, {
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value, {
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })
        }
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <Chart 
        type="line"
        data={chartData}
        options={options}
      />
    </div>
  );
};