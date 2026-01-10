/**
 * CassKai - PHASE 4: Analytics Service
 * Advanced financial analytics, trend analysis, and forecasting
 */

import type { ValidationResult } from '@/services/regulatory/countryValidationService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AnalyticsMetric {
  name: string;
  value: number;
  unit?: string;
  period: string;
  formattedValue?: string;
}

export interface TrendAnalysis {
  metric: string;
  periods: AnalyticsMetric[];
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number; // Percentage change
  trendRate: number; // Rate of change per period
  movingAverage3Period?: number;
  movingAverage12Period?: number;
}

export interface Benchmark {
  metric: string;
  companyValue: number;
  industryAverage: number;
  industryMin: number;
  industryMax: number;
  percentile: number; // 0-100
  status: 'above' | 'equal' | 'below';
  message: string;
}

export interface VarianceAnalysis {
  metric: string;
  budgeted: number;
  actual: number;
  variance: number; // Actual - Budgeted
  variancePercentage: number; // (Variance / Budgeted) * 100
  status: 'favorable' | 'unfavorable';
  message: string;
}

export interface AnomalyDetection {
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number; // Standard deviations
  anomalyScore: number; // 0-100
  severity: 'low' | 'medium' | 'high' | 'critical';
  isAnomaly: boolean;
  explanation: string;
}

export interface Forecast {
  period: string;
  predictedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  confidence: number; // 0-1
  method: string;
}

export interface HealthScore {
  overall: number; // 0-100
  liquidity: number;
  solvency: number;
  profitability: number;
  efficiency: number;
  growth: number;
  trends: {
    name: string;
    score: number;
    status: 'improving' | 'stable' | 'declining';
  }[];
  recommendations: string[];
}

export interface ComparisonMetrics {
  metric: string;
  entities: {
    name: string;
    value: number;
    formattedValue?: string;
    status?: 'leader' | 'average' | 'lagging';
  }[];
}

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

export class AnalyticsService {
  /**
   * Calculate trend analysis for a metric across periods
   */
  static calculateTrendAnalysis(
    metric: string,
    data: AnalyticsMetric[]
  ): TrendAnalysis {
    if (data.length === 0) {
      throw new Error(`No data available for metric: ${metric}`);
    }

    const sorted = [...data].sort((a, b) => 
      new Date(a.period).getTime() - new Date(b.period).getTime()
    );

    // Calculate trend direction
    const firstValue = sorted[0].value;
    const lastValue = sorted[sorted.length - 1].value;
    const trendPercentage = ((lastValue - firstValue) / firstValue) * 100;

    // Determine trend
    const trend: 'increasing' | 'decreasing' | 'stable' =
      Math.abs(trendPercentage) < 5
        ? 'stable'
        : trendPercentage > 0
          ? 'increasing'
          : 'decreasing';

    // Calculate trend rate (per period)
    const trendRate = trendPercentage / (sorted.length - 1);

    // Calculate moving averages
    const movingAverage3Period = this.calculateMovingAverage(sorted.map(d => d.value), 3);
    const movingAverage12Period = this.calculateMovingAverage(sorted.map(d => d.value), 12);

    return {
      metric,
      periods: sorted,
      trend,
      trendPercentage,
      trendRate,
      movingAverage3Period,
      movingAverage12Period,
    };
  }

  /**
   * Calculate moving average
   */
  private static calculateMovingAverage(values: number[], period: number): number | undefined {
    if (values.length < period) return undefined;
    
    const recent = values.slice(-period);
    return recent.reduce((a, b) => a + b, 0) / period;
  }

  /**
   * Compare company metrics against industry benchmarks
   */
  static calculateBenchmark(
    metricName: string,
    companyValue: number,
    industryData: {
      average: number;
      min: number;
      max: number;
      stdDev: number;
    }
  ): Benchmark {
    const { average, min, max, stdDev } = industryData;

    // Calculate percentile
    const percentile = ((companyValue - min) / (max - min)) * 100;

    // Determine status
    const tolerance = stdDev; // Within 1 std dev is "equal"
    let status: 'above' | 'equal' | 'below' = 'equal';
    if (companyValue > average + tolerance) status = 'above';
    if (companyValue < average - tolerance) status = 'below';

    // Generate message
    let message = '';
    if (status === 'above') {
      message = `${metricName} is ${((companyValue / average - 1) * 100).toFixed(1)}% above industry average`;
    } else if (status === 'below') {
      message = `${metricName} is ${((1 - companyValue / average) * 100).toFixed(1)}% below industry average`;
    } else {
      message = `${metricName} is in line with industry average`;
    }

    return {
      metric: metricName,
      companyValue,
      industryAverage: average,
      industryMin: min,
      industryMax: max,
      percentile: Math.round(percentile),
      status,
      message,
    };
  }

  /**
   * Analyze variance between budgeted and actual values
   */
  static calculateVarianceAnalysis(
    metricName: string,
    budgeted: number,
    actual: number
  ): VarianceAnalysis {
    const variance = actual - budgeted;
    const variancePercentage = (variance / budgeted) * 100;

    // For revenue/profit: positive is favorable
    // For expenses: negative is favorable
    const isFavorable = variance > 0; // Can be customized per metric

    return {
      metric: metricName,
      budgeted,
      actual,
      variance,
      variancePercentage,
      status: isFavorable ? 'favorable' : 'unfavorable',
      message: `${metricName}: ${isFavorable ? 'Favorable' : 'Unfavorable'} variance of ${Math.abs(variancePercentage).toFixed(2)}%`,
    };
  }

  /**
   * Detect anomalies using statistical methods
   */
  static detectAnomaly(
    metricName: string,
    currentValue: number,
    historicalData: number[],
    threshold: number = 2 // Standard deviations
  ): AnomalyDetection {
    if (historicalData.length < 3) {
      throw new Error('Need at least 3 historical data points for anomaly detection');
    }

    // Calculate mean and std dev
    const mean = historicalData.reduce((a, b) => a + b) / historicalData.length;
    const variance = historicalData.reduce((a, b) => a + Math.pow(b - mean, 2)) / historicalData.length;
    const stdDev = Math.sqrt(variance);

    // Calculate z-score
    const zScore = (currentValue - mean) / stdDev;

    // Determine if anomaly
    const isAnomaly = Math.abs(zScore) > threshold;
    const anomalyScore = Math.min(Math.abs(zScore) * 20, 100); // Scale to 0-100

    // Determine severity
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (Math.abs(zScore) > 3) severity = 'critical';
    else if (Math.abs(zScore) > 2.5) severity = 'high';
    else if (Math.abs(zScore) > 2) severity = 'medium';

    // Generate explanation
    const deviation = Math.abs((currentValue - mean) / mean) * 100;
    const explanation = isAnomaly
      ? `${metricName} is ${deviation.toFixed(1)}% away from historical average - ${zScore > 0 ? 'Higher' : 'Lower'} than expected`
      : `${metricName} is within normal range`;

    return {
      metric: metricName,
      currentValue,
      expectedValue: mean,
      deviation: zScore,
      anomalyScore,
      severity: isAnomaly ? severity : 'low',
      isAnomaly,
      explanation,
    };
  }

  /**
   * Generate forecast using linear regression
   */
  static generateForecast(
    metricName: string,
    historicalData: AnalyticsMetric[],
    forecastPeriods: number = 4,
    method: 'linear' | 'exponential' = 'linear'
  ): Forecast[] {
    if (historicalData.length < 3) {
      throw new Error('Need at least 3 historical data points for forecasting');
    }

    const sorted = [...historicalData].sort((a, b) =>
      new Date(a.period).getTime() - new Date(b.period).getTime()
    );

    const values = sorted.map(d => d.value);

    if (method === 'linear') {
      return this.linearForecast(sorted, values, forecastPeriods);
    } else {
      return this.exponentialForecast(sorted, values, forecastPeriods);
    }
  }

  /**
   * Linear regression forecast
   */
  private static linearForecast(
    data: AnalyticsMetric[],
    values: number[],
    periods: number
  ): Forecast[] {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b);
    const sumY = values.reduce((a, b) => a + b);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    // Calculate slope and intercept
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate standard error for confidence intervals
    const residuals = values.map((y, i) => y - (intercept + slope * i));
    const se = Math.sqrt(residuals.reduce((a, b) => a + b * b) / (n - 2));

    // Generate forecasts
    const forecasts: Forecast[] = [];
    const lastDate = new Date(data[n - 1].period);

    for (let i = 1; i <= periods; i++) {
      const x = n + i - 1;
      const predictedValue = intercept + slope * x;
      const confidenceInterval = {
        lower: predictedValue - 1.96 * se,
        upper: predictedValue + 1.96 * se,
      };

      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + i);

      forecasts.push({
        period: nextDate.toISOString().split('T')[0],
        predictedValue,
        confidenceInterval,
        confidence: 0.95,
        method: 'linear_regression',
      });
    }

    return forecasts;
  }

  /**
   * Exponential smoothing forecast
   */
  private static exponentialForecast(
    data: AnalyticsMetric[],
    values: number[],
    periods: number
  ): Forecast[] {
    const alpha = 0.3; // Smoothing factor
    let smoothed = values[0];

    // Calculate smoothed values
    const smoothedValues = [smoothed];
    for (let i = 1; i < values.length; i++) {
      smoothed = alpha * values[i] + (1 - alpha) * smoothed;
      smoothedValues.push(smoothed);
    }

    // Generate forecasts (all same value for exponential smoothing)
    const forecasts: Forecast[] = [];
    const lastDate = new Date(data[data.length - 1].period);

    for (let i = 1; i <= periods; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + i);

      forecasts.push({
        period: nextDate.toISOString().split('T')[0],
        predictedValue: smoothed,
        confidenceInterval: {
          lower: smoothed * 0.9,
          upper: smoothed * 1.1,
        },
        confidence: 0.85,
        method: 'exponential_smoothing',
      });
    }

    return forecasts;
  }

  /**
   * Calculate overall financial health score (0-100)
   */
  static calculateHealthScore(metrics: {
    currentRatio: number;
    debtToEquity: number;
    netProfitMargin: number;
    roa: number;
    roe: number;
    revenueGrowth?: number;
  }): HealthScore {
    // Score each component (0-100)
    const liquidityScore = Math.min((metrics.currentRatio / 2) * 100, 100);
    const solvencyScore = Math.min(100 - (metrics.debtToEquity * 50), 100);
    const profitabilityScore = Math.min(Math.max(metrics.netProfitMargin * 500, 0), 100);
    const efficiencyScore = Math.min(metrics.roa * 1000, 100);
    const growthScore = Math.min(Math.max((metrics.revenueGrowth ?? 0) * 100, 0), 100);

    // Calculate overall score (weighted average)
    const weights = {
      liquidity: 0.2,
      solvency: 0.2,
      profitability: 0.3,
      efficiency: 0.2,
      growth: 0.1,
    };

    const overall = Math.round(
      liquidityScore * weights.liquidity +
      solvencyScore * weights.solvency +
      profitabilityScore * weights.profitability +
      efficiencyScore * weights.efficiency +
      growthScore * weights.growth
    );

    // Generate recommendations
    const recommendations: string[] = [];
    if (liquidityScore < 50) recommendations.push('Improve short-term liquidity position');
    if (solvencyScore < 50) recommendations.push('Reduce debt levels');
    if (profitabilityScore < 50) recommendations.push('Focus on improving profit margins');
    if (efficiencyScore < 50) recommendations.push('Enhance asset utilization');
    if (growthScore < 30) recommendations.push('Accelerate revenue growth');

    return {
      overall,
      liquidity: Math.round(liquidityScore),
      solvency: Math.round(solvencyScore),
      profitability: Math.round(profitabilityScore),
      efficiency: Math.round(efficiencyScore),
      growth: Math.round(growthScore),
      trends: [
        { name: 'Liquidity', score: Math.round(liquidityScore), status: 'stable' },
        { name: 'Solvency', score: Math.round(solvencyScore), status: 'stable' },
        { name: 'Profitability', score: Math.round(profitabilityScore), status: 'stable' },
        { name: 'Efficiency', score: Math.round(efficiencyScore), status: 'stable' },
        { name: 'Growth', score: Math.round(growthScore), status: 'stable' },
      ],
      recommendations,
    };
  }

  /**
   * Compare metrics across multiple entities (companies, countries, periods)
   */
  static compareMetrics(
    metricName: string,
    entities: { name: string; value: number }[]
  ): ComparisonMetrics {
    const sorted = [...entities].sort((a, b) => b.value - a.value);
    const max = sorted[0].value;
    const min = sorted[sorted.length - 1].value;
    const average = entities.reduce((a, b) => a + b.value, 0) / entities.length;

    const withStatus = sorted.map(entity => ({
      name: entity.name,
      value: entity.value,
      status: (
        entity.value > average * 1.1 ? 'leader' :
        entity.value < average * 0.9 ? 'lagging' :
        'average'
      ) as 'leader' | 'average' | 'lagging',
    }));

    return {
      metric: metricName,
      entities: withStatus,
    };
  }

  /**
   * Calculate key financial ratios growth
   */
  static calculateRatioGrowth(
    previousRatio: number,
    currentRatio: number
  ): {
    growth: number;
    growthPercentage: number;
    status: 'improvement' | 'decline' | 'stable';
  } {
    const growth = currentRatio - previousRatio;
    const growthPercentage = (growth / previousRatio) * 100;

    return {
      growth,
      growthPercentage,
      status: Math.abs(growthPercentage) < 2 ? 'stable' : growthPercentage > 0 ? 'improvement' : 'decline',
    };
  }

  /**
   * Identify key performance indicators and their status
   */
  static identifyKPIs(metrics: Record<string, number>): {
    kpi: string;
    value: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    action?: string;
  }[] {
    const kpis = [];

    for (const [key, value] of Object.entries(metrics)) {
      let status: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
      let action: string | undefined;

      // Example thresholds (can be customized)
      switch (key) {
        case 'currentRatio':
          if (value >= 2) status = 'excellent';
          else if (value >= 1.5) status = 'good';
          else if (value >= 1) status = 'fair';
          else {
            status = 'poor';
            action = 'Improve liquidity by reducing current liabilities or increasing current assets';
          }
          break;

        case 'debtToEquity':
          if (value <= 0.5) status = 'excellent';
          else if (value <= 1) status = 'good';
          else if (value <= 1.5) status = 'fair';
          else {
            status = 'poor';
            action = 'Reduce debt or increase equity capital';
          }
          break;

        case 'netProfitMargin':
          if (value >= 0.15) status = 'excellent';
          else if (value >= 0.10) status = 'good';
          else if (value >= 0.05) status = 'fair';
          else {
            status = 'poor';
            action = 'Focus on cost reduction or price optimization';
          }
          break;

        case 'roe':
          if (value >= 0.20) status = 'excellent';
          else if (value >= 0.15) status = 'good';
          else if (value >= 0.10) status = 'fair';
          else {
            status = 'poor';
            action = 'Improve profitability or optimize capital structure';
          }
          break;

        case 'roa':
          if (value >= 0.08) status = 'excellent';
          else if (value >= 0.05) status = 'good';
          else if (value >= 0.02) status = 'fair';
          else {
            status = 'poor';
            action = 'Enhance asset utilization or profitability';
          }
          break;
      }

      kpis.push({ kpi: key, value, status, action });
    }

    return kpis;
  }
}
