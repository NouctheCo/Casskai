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

import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Enregistrer tous les composants Chart.js
Chart.register(...registerables);

interface ChartData {
  labels: string[];
  datasets: Array<{
    label?: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

/**
 * Service pour générer des graphiques en images (base64)
 * qui peuvent être intégrés dans des PDFs
 */
class ChartImageService {
  private static instance: ChartImageService;

  static getInstance(): ChartImageService {
    if (!this.instance) {
      this.instance = new ChartImageService();
    }
    return this.instance;
  }

  /**
   * Crée un canvas temporaire pour le rendu du graphique
   */
  private createCanvas(width: number = 800, height: number = 400): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  /**
   * Génère un graphique en barres et retourne l'image en base64
   */
  async generateBarChart(
    data: ChartData,
    options: Partial<ChartConfiguration['options']> = {}
  ): Promise<string> {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: data as any,
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 14
              }
            }
          },
          title: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                size: 12
              }
            }
          },
          x: {
            ticks: {
              font: {
                size: 12
              }
            }
          }
        },
        ...options
      }
    };

    const chart = new Chart(ctx, config);

    // Attendre que le graphique soit rendu
    await new Promise(resolve => setTimeout(resolve, 100));

    const imageData = canvas.toDataURL('image/png');
    chart.destroy();

    return imageData;
  }

  /**
   * Génère un graphique en ligne et retourne l'image en base64
   */
  async generateLineChart(
    data: ChartData,
    options: Partial<ChartConfiguration['options']> = {}
  ): Promise<string> {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: data as any,
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 14
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                size: 12
              }
            }
          },
          x: {
            ticks: {
              font: {
                size: 12
              }
            }
          }
        },
        ...options
      }
    };

    const chart = new Chart(ctx, config);

    // Attendre que le graphique soit rendu
    await new Promise(resolve => setTimeout(resolve, 100));

    const imageData = canvas.toDataURL('image/png');
    chart.destroy();

    return imageData;
  }

  /**
   * Génère un graphique en camembert et retourne l'image en base64
   */
  async generatePieChart(
    data: ChartData,
    options: Partial<ChartConfiguration['options']> = {}
  ): Promise<string> {
    const canvas = this.createCanvas(600, 400);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const config: ChartConfiguration = {
      type: 'pie',
      data: data as any,
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              font: {
                size: 12
              }
            }
          }
        },
        ...options
      }
    };

    const chart = new Chart(ctx, config);

    // Attendre que le graphique soit rendu
    await new Promise(resolve => setTimeout(resolve, 100));

    const imageData = canvas.toDataURL('image/png');
    chart.destroy();

    return imageData;
  }

  /**
   * Génère un graphique en anneau (doughnut) et retourne l'image en base64
   */
  async generateDoughnutChart(
    data: ChartData,
    options: Partial<ChartConfiguration['options']> = {}
  ): Promise<string> {
    const canvas = this.createCanvas(600, 400);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: data as any,
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              font: {
                size: 12
              }
            }
          }
        },
        ...options
      }
    };

    const chart = new Chart(ctx, config);

    // Attendre que le graphique soit rendu
    await new Promise(resolve => setTimeout(resolve, 100));

    const imageData = canvas.toDataURL('image/png');
    chart.destroy();

    return imageData;
  }

  /**
   * Génère un graphique avec plusieurs datasets (revenus vs dépenses)
   */
  async generateComparisonBarChart(
    labels: string[],
    revenueData: number[],
    expenseData: number[],
    title: string = 'Comparaison Revenus vs Depenses'
  ): Promise<string> {
    const data: ChartData = {
      labels,
      datasets: [
        {
          label: 'Revenus',
          data: revenueData,
          backgroundColor: '#10b981',
          borderColor: '#059669',
          borderWidth: 1
        },
        {
          label: 'Depenses',
          data: expenseData,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          borderWidth: 1
        }
      ]
    };

    return this.generateBarChart(data, {
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 16
          }
        }
      }
    });
  }
}

export const chartImageService = ChartImageService.getInstance();
