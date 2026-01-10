/**
 * CassKai - PHASE 4: Visualization Service
 * Prepare chart data for React components and dashboards
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ChartType = 'line' | 'bar' | 'pie' | 'gauge' | 'scatter' | 'area' | 'histogram';

export interface ChartConfig {
  type: ChartType;
  title: string;
  subtitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend: boolean;
  showTooltip: boolean;
  responsive: boolean;
  colors?: string[];
  height?: number;
}

export interface ChartPoint {
  label: string;
  value: number;
  percentage?: number;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ChartDataset {
  label: string;
  data: number[] | { x: number; y: number }[] | { x: number; y: number; r: number }[];
  borderColor?: string | string[];
  backgroundColor?: string | string[];
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  borderRadius?: number;
  borderWidth?: number;
  type?: 'line' | 'bar' | 'pie' | 'scatter' | 'bubble';
  yAxisID?: string;
  pointHoverRadius?: number;
}

export interface FormattedChartData {
  labels: string[];
  datasets: ChartDataset[];
  options: Record<string, any>;
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface ComparisonData {
  entities: string[];
  metrics: string[];
  values: number[][];
}

export interface GaugeChartData {
  value: number;
  min: number;
  max: number;
  thresholds: { value: number; color: string }[];
  label: string;
}

export interface HierarchicalData {
  name: string;
  value?: number;
  children?: HierarchicalData[];
}

// ============================================================================
// VISUALIZATION SERVICE
// ============================================================================

export class VisualizationService {
  // Default color palette
  private static readonly DEFAULT_COLORS = [
    '#007bff', // Blue
    '#28a745', // Green
    '#dc3545', // Red
    '#ffc107', // Yellow
    '#17a2b8', // Cyan
    '#6f42c1', // Purple
    '#e83e8c', // Pink
    '#fd7e14', // Orange
    '#6c757d', // Gray
    '#20c997', // Teal
  ];

  /**
   * Format data for line chart (trends, time series)
   */
  static formatLineChartData(
    points: TimeSeriesPoint[],
    config: Partial<ChartConfig> = {}
  ): FormattedChartData {
    const labels = points.map(p => p.label || p.timestamp.toLocaleDateString());
    const data = points.map(p => p.value);

    return {
      labels,
      datasets: [
        {
          label: config.title || 'Values',
          data,
          borderColor: config.colors?.[0] || '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
        },
      ],
      options: this.getDefaultChartOptions(config),
    };
  }

  /**
   * Format data for multi-line chart (multiple trends)
   */
  static formatMultiLineChartData(
    datasets: { label: string; points: TimeSeriesPoint[] }[],
    config: Partial<ChartConfig> = {}
  ): FormattedChartData {
    const allPoints = datasets[0]?.points || [];
    const labels = allPoints.map(p => p.label || p.timestamp.toLocaleDateString());

    const formattedDatasets = datasets.map((ds, idx) => ({
      label: ds.label,
      data: ds.points.map(p => p.value),
      borderColor: config.colors?.[idx] || this.DEFAULT_COLORS[idx],
      backgroundColor: this.hexToRgba(config.colors?.[idx] || this.DEFAULT_COLORS[idx], 0.1),
      fill: false,
      tension: 0.4,
      pointRadius: 4,
    }));

    return {
      labels,
      datasets: formattedDatasets,
      options: this.getDefaultChartOptions(config),
    };
  }

  /**
   * Format data for bar chart (comparisons, categories)
   */
  static formatBarChartData(
    points: ChartPoint[],
    config: Partial<ChartConfig> = {}
  ): FormattedChartData {
    return {
      labels: points.map(p => p.label),
      datasets: [
        {
          label: config.title || 'Values',
          data: points.map(p => p.value),
          backgroundColor: points.map((p, i) =>
            p.color || config.colors?.[i] || this.DEFAULT_COLORS[i]
          ),
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#e0e0e0',
        },
      ],
      options: this.getDefaultChartOptions(config),
    };
  }

  /**
   * Format data for horizontal bar chart
   */
  static formatHorizontalBarChartData(
    points: ChartPoint[],
    config: Partial<ChartConfig> = {}
  ): FormattedChartData {
    return {
      labels: points.map(p => p.label),
      datasets: [
        {
          label: config.title || 'Values',
          data: points.map(p => p.value),
          backgroundColor: points.map((p, i) =>
            p.color || config.colors?.[i] || this.DEFAULT_COLORS[i]
          ),
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#e0e0e0',
        },
      ],
      options: {
        ...this.getDefaultChartOptions(config),
        indexAxis: 'y',
      },
    };
  }

  /**
   * Format data for pie chart (composition, distribution)
   */
  static formatPieChartData(
    points: ChartPoint[],
    config: Partial<ChartConfig> = {}
  ): FormattedChartData {
    const total = points.reduce((sum, p) => sum + p.value, 0);
    const percentages = points.map(p => (p.value / total) * 100);

    return {
      labels: points.map(p => p.label),
      datasets: [
        {
          label: config.title || 'Distribution',
          data: percentages,
          backgroundColor: points.map((p, i) =>
            p.color || config.colors?.[i] || this.DEFAULT_COLORS[i]
          ),
          borderColor: '#fff',
          borderWidth: 2,
        },
      ],
      options: {
        plugins: {
          legend: {
            position: 'right' as const,
          },
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.label}: ${context.parsed}%`,
            },
          },
        },
        responsive: config.responsive !== false,
      },
    };
  }

  /**
   * Format data for doughnut chart (alternative to pie)
   */
  static formatDoughnutChartData(
    points: ChartPoint[],
    config: Partial<ChartConfig> = {}
  ): FormattedChartData {
    const chartData = this.formatPieChartData(points, config);
    return {
      ...chartData,
      options: {
        ...chartData.options,
        cutout: '70%',
      },
    };
  }

  /**
   * Format data for gauge chart (single metric)
   */
  static formatGaugeChartData(
    data: GaugeChartData,
    config: Partial<ChartConfig> = {}
  ): FormattedChartData {
    const percentage = ((data.value - data.min) / (data.max - data.min)) * 100;
    const color = data.thresholds.find(
      t => data.value >= (t.value - 0) && data.value < (t.value + 1)
    )?.color || '#007bff';

    return {
      labels: [data.label],
      datasets: [
        {
          label: data.label,
          data: [percentage],
          backgroundColor: [color],
          borderColor: '#e0e0e0',
          borderWidth: 2,
        },
      ],
      options: {
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: () => `${data.value.toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            max: 100,
            ticks: {
              callback: (value: any) => `${value}%`,
            },
          },
        },
      },
    };
  }

  /**
   * Format data for scatter chart
   */
  static formatScatterChartData(
    points: { x: number; y: number; label?: string; color?: string }[],
    config: Partial<ChartConfig> = {}
  ): FormattedChartData {
    return {
      labels: points.map((p, i) => p.label || `Point ${i + 1}`),
      datasets: [
        {
          label: config.title || 'Data Points',
          data: points.map(p => ({ x: p.x, y: p.y })),
          backgroundColor: points.map((p, i) =>
            p.color || config.colors?.[i] || this.DEFAULT_COLORS[i]
          ),
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
      options: {
        ...this.getDefaultChartOptions(config),
        scales: {
          x: {
            title: {
              display: true,
              text: config.xAxisLabel || 'X Axis',
            },
          },
          y: {
            title: {
              display: true,
              text: config.yAxisLabel || 'Y Axis',
            },
          },
        },
      },
    };
  }

  /**
   * Format data for stacked bar chart (composition over categories)
   */
  static formatStackedBarChartData(
    data: { label: string; categories: string[]; values: number[][] }[],
    config: Partial<ChartConfig> = {}
  ): FormattedChartData {
    return {
      labels: data[0]?.categories || [],
      datasets: data.map((d, i) => ({
        label: d.label,
        data: d.values[0] || [],
        backgroundColor: config.colors?.[i] || this.DEFAULT_COLORS[i],
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e0e0e0',
      })),
      options: {
        ...this.getDefaultChartOptions(config),
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
          },
        },
      },
    };
  }

  /**
   * Format data for bubble chart
   */
  static formatBubbleChartData(
    points: { x: number; y: number; r: number; label?: string; color?: string }[],
    config: Partial<ChartConfig> = {}
  ): FormattedChartData {
    return {
      labels: points.map((p, i) => p.label || `Bubble ${i + 1}`),
      datasets: [
        {
          label: config.title || 'Bubbles',
          data: points.map(p => ({ x: p.x, y: p.y, r: p.r })),
          backgroundColor: points.map((p, i) =>
            this.hexToRgba(p.color || config.colors?.[i] || this.DEFAULT_COLORS[i], 0.6)
          ),
          borderColor: points.map((p, i) =>
            p.color || config.colors?.[i] || this.DEFAULT_COLORS[i]
          ),
          borderWidth: 2,
        },
      ],
      options: this.getDefaultChartOptions(config),
    };
  }

  /**
   * Format data for area chart
   */
  static formatAreaChartData(
    points: TimeSeriesPoint[],
    config: Partial<ChartConfig> = {}
  ): FormattedChartData {
    const labels = points.map(p => p.label || p.timestamp.toLocaleDateString());
    const data = points.map(p => p.value);

    return {
      labels,
      datasets: [
        {
          label: config.title || 'Area',
          data,
          borderColor: config.colors?.[0] || '#007bff',
          backgroundColor: this.hexToRgba(config.colors?.[0] || '#007bff', 0.3),
          fill: true,
          tension: 0.4,
          pointRadius: 3,
        },
      ],
      options: {
        ...this.getDefaultChartOptions(config),
        interaction: {
          intersect: false,
        },
      },
    };
  }

  /**
   * Format data for histogram
   */
  static formatHistogramData(
    values: number[],
    bins: number = 10,
    config: Partial<ChartConfig> = {}
  ): FormattedChartData {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;

    const histogram = Array(bins).fill(0);
    values.forEach(v => {
      const binIndex = Math.min(Math.floor((v - min) / binWidth), bins - 1);
      histogram[binIndex]++;
    });

    const labels = Array.from({ length: bins }, (_, i) =>
      `${(min + i * binWidth).toFixed(2)} - ${(min + (i + 1) * binWidth).toFixed(2)}`
    );

    return {
      labels,
      datasets: [
        {
          label: config.title || 'Distribution',
          data: histogram,
          backgroundColor: config.colors?.[0] || '#007bff',
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#e0e0e0',
        },
      ],
      options: this.getDefaultChartOptions(config),
    };
  }

  /**
   * Create a combination chart (line + bar)
   */
  static formatComboChartData(
    lineData: { label: string; points: TimeSeriesPoint[] },
    barData: { label: string; points: ChartPoint[] },
    config: Partial<ChartConfig> = {}
  ): FormattedChartData {
    const labels = barData.points.map(p => p.label);

    return {
      labels,
      datasets: [
        {
          label: lineData.label,
          type: 'line' as const,
          data: barData.points.map(p => 0), // Align with bar data
          borderColor: config.colors?.[0] || '#007bff',
          backgroundColor: 'transparent',
          tension: 0.4,
          yAxisID: 'y',
        },
        {
          label: barData.label,
          type: 'bar' as const,
          data: barData.points.map(p => p.value),
          backgroundColor: config.colors?.[1] || '#28a745',
          yAxisID: 'y1',
        },
      ],
      options: {
        ...this.getDefaultChartOptions(config),
        scales: {
          y: {
            type: 'linear' as const,
            display: true,
            position: 'left' as const,
            title: {
              display: true,
              text: lineData.label,
            },
          },
          y1: {
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            title: {
              display: true,
              text: barData.label,
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        },
      },
    };
  }

  /**
   * Get default chart options
   */
  private static getDefaultChartOptions(config: Partial<ChartConfig>): Record<string, any> {
    return {
      responsive: config.responsive !== false,
      maintainAspectRatio: true,
      height: config.height || 400,
      plugins: {
        legend: {
          display: config.showLegend !== false,
          position: 'top' as const,
        },
        tooltip: {
          enabled: config.showTooltip !== false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          borderRadius: 4,
          titleFont: {
            size: 14,
            weight: 'bold' as const,
          },
          bodyFont: {
            size: 13,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: !!config.yAxisLabel,
            text: config.yAxisLabel,
          },
        },
        x: {
          title: {
            display: !!config.xAxisLabel,
            text: config.xAxisLabel,
          },
        },
      },
    };
  }

  /**
   * Convert hex color to RGBA
   */
  private static hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Generate comparison chart data
   */
  static formatComparisonData(
    data: ComparisonData,
    config: Partial<ChartConfig> = {}
  ): FormattedChartData {
    const datasets = data.metrics.map((metric, idx) => ({
      label: metric,
      data: data.values[idx] || [],
      backgroundColor: config.colors?.[idx] || this.DEFAULT_COLORS[idx],
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    }));

    return {
      labels: data.entities,
      datasets,
      options: this.getDefaultChartOptions(config),
    };
  }

  /**
   * Generate heatmap-style data
   */
  static formatHeatmapData(
    matrix: number[][],
    xLabels: string[],
    yLabels: string[],
    config: Partial<ChartConfig> = {}
  ): {
    matrix: number[][];
    xLabels: string[];
    yLabels: string[];
    colorScale: string[];
    min: number;
    max: number;
  } {
    const flat = matrix.flat();
    const min = Math.min(...flat);
    const max = Math.max(...flat);

    return {
      matrix,
      xLabels,
      yLabels,
      colorScale: config.colors || this.DEFAULT_COLORS,
      min,
      max,
    };
  }

  /**
   * Format treemap data (hierarchical)
   */
  static formatTreemapData(
    data: HierarchicalData,
    config: Partial<ChartConfig> = {}
  ): HierarchicalData {
    return data;
  }

  /**
   * Generate color palette
   */
  static generateColorPalette(count: number, baseColor?: string): string[] {
    if (count <= this.DEFAULT_COLORS.length) {
      return this.DEFAULT_COLORS.slice(0, count);
    }

    const colors = [...this.DEFAULT_COLORS];
    const base = baseColor ? parseInt(baseColor.slice(1), 16) : 0x007bff;

    for (let i = this.DEFAULT_COLORS.length; i < count; i++) {
      const hue = (i * 360) / count;
      colors.push(this.hslToHex(hue, 70, 50));
    }

    return colors;
  }

  /**
   * Convert HSL to Hex color
   */
  private static hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
}
