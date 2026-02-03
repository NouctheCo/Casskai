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

/**
 * Service de génération de graphiques pour exports PDF
 * Utilise l'API Canvas du navigateur pour créer des images base64
 */

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: {
    labels: string[];
    datasets: {
      label?: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }[];
  };
  options?: {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    plugins?: {
      legend?: {
        display?: boolean;
        position?: 'top' | 'bottom' | 'left' | 'right';
      };
      title?: {
        display?: boolean;
        text?: string;
      };
    };
  };
  width?: number;
  height?: number;
}

class ChartGenerationService {
  private static instance: ChartGenerationService;

  private constructor() {}

  static getInstance(): ChartGenerationService {
    if (!ChartGenerationService.instance) {
      ChartGenerationService.instance = new ChartGenerationService();
    }
    return ChartGenerationService.instance;
  }

  /**
   * Génère un graphique en barres simple
   */
  async generateBarChart(
    labels: string[],
    data: number[],
    title: string,
    width = 600,
    height = 400
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Marges
    const margin = { top: 60, right: 40, bottom: 80, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Titre
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 30);

    // Trouver la valeur max pour l'échelle
    const maxValue = Math.max(...data);
    const scale = chartHeight / maxValue;

    // Dessiner les axes
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Dessiner les barres
    const barWidth = chartWidth / data.length - 10;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    data.forEach((value, index) => {
      const x = margin.left + (index * (chartWidth / data.length)) + 5;
      const barHeight = value * scale;
      const y = height - margin.bottom - barHeight;

      // Barre
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x, y, barWidth, barHeight);

      // Bordure de la barre
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Valeur au-dessus de la barre
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        new Intl.NumberFormat('fr-FR').format(value).replace(/\u00A0/g, ' '),
        x + barWidth / 2,
        y - 5
      );

      // Label en dessous
      ctx.save();
      ctx.translate(x + barWidth / 2, height - margin.bottom + 20);
      ctx.rotate(-Math.PI / 4);
      ctx.textAlign = 'right';
      ctx.fillText(labels[index], 0, 0);
      ctx.restore();
    });

    // Échelle Y
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const value = (maxValue / steps) * i;
      const y = height - margin.bottom - (chartHeight / steps) * i;

      ctx.fillStyle = '#6b7280';
      ctx.font = '11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(
        new Intl.NumberFormat('fr-FR').format(Math.round(value)).replace(/\u00A0/g, ' '),
        margin.left - 10,
        y + 4
      );

      // Ligne de grille
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }

    return canvas.toDataURL('image/png');
  }

  /**
   * Génère un graphique en ligne
   */
  async generateLineChart(
    labels: string[],
    datasets: { label: string; data: number[]; color: string }[],
    title: string,
    width = 600,
    height = 400
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const margin = { top: 80, right: 40, bottom: 60, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Titre
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 30);

    // Trouver la valeur max
    const allValues = datasets.flatMap(ds => ds.data);
    const maxValue = Math.max(...allValues);
    const scale = chartHeight / maxValue;

    // Dessiner les axes
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Grille
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const value = (maxValue / steps) * i;
      const y = height - margin.bottom - (chartHeight / steps) * i;

      ctx.fillStyle = '#6b7280';
      ctx.font = '11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(
        new Intl.NumberFormat('fr-FR').format(Math.round(value)).replace(/\u00A0/g, ' '),
        margin.left - 10,
        y + 4
      );

      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }

    // Labels X
    const stepX = chartWidth / (labels.length - 1);
    labels.forEach((label, index) => {
      const x = margin.left + stepX * index;
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, height - margin.bottom + 20);
    });

    // Dessiner les lignes
    datasets.forEach((dataset) => {
      ctx.strokeStyle = dataset.color;
      ctx.lineWidth = 3;
      ctx.beginPath();

      dataset.data.forEach((value, index) => {
        const x = margin.left + stepX * index;
        const y = height - margin.bottom - value * scale;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        // Point
        ctx.fillStyle = dataset.color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.stroke();
    });

    // Légende
    const legendY = 55;
    datasets.forEach((dataset, index) => {
      const legendX = width / 2 - (datasets.length * 100) / 2 + index * 100;

      ctx.fillStyle = dataset.color;
      ctx.fillRect(legendX, legendY, 15, 15);

      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(dataset.label, legendX + 20, legendY + 12);
    });

    return canvas.toDataURL('image/png');
  }

  /**
   * Génère un graphique en camembert
   */
  async generatePieChart(
    labels: string[],
    data: number[],
    title: string,
    width = 500,
    height = 400
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Titre
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 30);

    const centerX = width / 2;
    const centerY = height / 2 + 20;
    const radius = Math.min(width, height) / 3;

    const total = data.reduce((sum, val) => sum + val, 0);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    let currentAngle = -Math.PI / 2; // Commencer en haut

    data.forEach((value, index) => {
      const sliceAngle = (value / total) * Math.PI * 2;

      // Dessiner le secteur
      ctx.fillStyle = colors[index % colors.length];
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Bordure
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pourcentage
      const percentage = ((value / total) * 100).toFixed(1);
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${percentage}%`, labelX, labelY);

      currentAngle += sliceAngle;
    });

    // Légende
    const legendX = 20;
    let legendY = height / 2 - (labels.length * 25) / 2;

    labels.forEach((label, index) => {
      // Couleur
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(legendX, legendY, 15, 15);

      // Texte
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(label, legendX + 20, legendY + 12);

      legendY += 25;
    });

    return canvas.toDataURL('image/png');
  }

  /**
   * Génère un graphique simple pour les ratios (jauge visuelle)
   */
  async generateRatioGauge(
    label: string,
    value: number,
    maxValue: number,
    status: 'excellent' | 'good' | 'warning' | 'critical',
    width = 400,
    height = 150
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Cannot get canvas context');
    }

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const margin = 30;
    const barWidth = width - 2 * margin;
    const barHeight = 40;
    const barY = height / 2 - barHeight / 2;

    // Label
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, margin, barY - 10);

    // Barre de fond
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(margin, barY, barWidth, barHeight);

    // Barre de valeur
    const fillWidth = Math.min((value / maxValue) * barWidth, barWidth);
    const statusColors = {
      excellent: '#10b981',
      good: '#3b82f6',
      warning: '#f59e0b',
      critical: '#ef4444'
    };

    ctx.fillStyle = statusColors[status];
    ctx.fillRect(margin, barY, fillWidth, barHeight);

    // Bordure
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.strokeRect(margin, barY, barWidth, barHeight);

    // Valeur
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${value.toFixed(1)}`, width / 2, barY + barHeight + 25);

    return canvas.toDataURL('image/png');
  }
}

export const chartGenerationService = ChartGenerationService.getInstance();
