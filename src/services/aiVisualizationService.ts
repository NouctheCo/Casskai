import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { hierarchy, treemap, treemapResquarify } from 'd3-hierarchy';
import {
  Transaction,
  HeatmapData,
  SankeyData,
  SankeyNode,
  SankeyLink,
  TreemapNode,
  FinancialTimeSeriesData,
  AIServiceResponse
} from '../types/ai.types';

// Service de visualisations avancées avec D3.js
class AIVisualizationService {
  private colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  private isInitialized = false;

  // Initialisation du service
  initialize(): void {
    try {
      console.log('Initializing AI Visualization Service...');
      
      // Configuration des échelles de couleurs
      this.setupColorSchemes();
      
      this.isInitialized = true;
      console.log('AI Visualization Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Visualization Service:', error);
      throw error;
    }
  }

  // Configuration des schémas de couleurs
  private setupColorSchemes(): void {
    // Échelle pour les catégories financières
    this.colorScale = d3.scaleOrdinal()
      .domain(['income', 'expense', 'investment', 'savings', 'taxes'])
      .range(['#22C55E', '#EF4444', '#3B82F6', '#8B5CF6', '#F59E0B']);
  }

  // HEATMAP POUR ANALYSE TEMPORELLE
  async generateHeatmapData(
    transactions: Transaction[],
    timeUnit: 'day' | 'week' | 'month' = 'day',
    valueType: 'amount' | 'count' = 'amount'
  ): Promise<AIServiceResponse<HeatmapData[]>> {
    try {
      const startTime = Date.now();
      
      if (!this.isInitialized) {
        this.initialize();
      }

      const heatmapData: HeatmapData[] = [];
      
      // Groupement des transactions par période et catégorie
      const groupedData = this.groupTransactionsByTime(transactions, timeUnit);
      
      // Calcul des valeurs pour chaque cellule de la heatmap
      Object.entries(groupedData).forEach(([timeKey, timeTransactions]) => {
        const categoryGroups = this.groupTransactionsByCategory(timeTransactions);
        
        Object.entries(categoryGroups).forEach(([category, categoryTransactions]) => {
          const value = valueType === 'amount' 
            ? categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
            : categoryTransactions.length;
          
          heatmapData.push({
            date: this.parseTimeKey(timeKey, timeUnit),
            category,
            value,
            normalized: 0 // sera calculé après
          });
        });
      });

      // Normalisation des valeurs
      const maxValue = Math.max(...heatmapData.map(d => d.value));
      heatmapData.forEach(d => {
        d.normalized = maxValue > 0 ? d.value / maxValue : 0;
      });

      return {
        success: true,
        data: heatmapData,
        processingTime: Date.now() - startTime,
        modelUsed: 'heatmap_generator'
      };

    } catch (error) {
      console.error('Error generating heatmap data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Groupement des transactions par temps
  private groupTransactionsByTime(transactions: Transaction[], timeUnit: string): Record<string, Transaction[]> {
    return transactions.reduce((groups, transaction) => {
      const date = new Date(transaction.date);
      let key: string;
      
      switch (timeUnit) {
        case 'week':
          const weekStart = d3.timeWeek.floor(date);
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'day':
        default:
          key = date.toISOString().split('T')[0];
          break;
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(transaction);
      
      return groups;
    }, {} as Record<string, Transaction[]>);
  }

  // Groupement par catégorie
  private groupTransactionsByCategory(transactions: Transaction[]): Record<string, Transaction[]> {
    return transactions.reduce((groups, transaction) => {
      const category = transaction.category || 'Non catégorisé';
      
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(transaction);
      
      return groups;
    }, {} as Record<string, Transaction[]>);
  }

  // Parse de clé temporelle
  private parseTimeKey(key: string, timeUnit: string): Date {
    switch (timeUnit) {
      case 'week':
      case 'day':
        return new Date(key);
      case 'month':
        const [year, month] = key.split('-').map(Number);
        return new Date(year, month - 1, 1);
      default:
        return new Date(key);
    }
  }

  // SANKEY DIAGRAM POUR FLUX FINANCIERS
  async generateSankeyData(
    transactions: Transaction[],
    sourceField: 'account' | 'category' | 'counterparty' = 'category',
    targetField: 'account' | 'category' | 'counterparty' = 'account'
  ): Promise<AIServiceResponse<SankeyData>> {
    try {
      const startTime = Date.now();
      
      if (!this.isInitialized) {
        this.initialize();
      }

      // Collecte des flux uniques
      const flowMap = new Map<string, number>();
      const nodeSet = new Set<string>();
      
      transactions.forEach(transaction => {
        const source = this.getFieldValue(transaction, sourceField);
        const target = this.getFieldValue(transaction, targetField);
        const amount = Math.abs(transaction.amount);
        
        if (source && target && source !== target) {
          nodeSet.add(source);
          nodeSet.add(target);
          
          const flowKey = `${source}->${target}`;
          flowMap.set(flowKey, (flowMap.get(flowKey) || 0) + amount);
        }
      });

      // Création des nœuds
      const nodes: SankeyNode[] = Array.from(nodeSet).map((name, index) => ({
        id: name,
        name,
        category: this.inferNodeCategory(name, sourceField, targetField),
        value: 0, // sera calculé par D3 Sankey
        color: this.getNodeColor(name, sourceField, targetField)
      }));

      // Création des liens
      const links: SankeyLink[] = [];
      flowMap.forEach((value, flowKey) => {
        const [source, target] = flowKey.split('->');
        
        links.push({
          source,
          target,
          value,
          color: this.getLinkColor(source, target)
        });
      });

      // Filtrage des liens trop petits (< 1% du total)
      const totalFlow = links.reduce((sum, link) => sum + link.value, 0);
      const minThreshold = totalFlow * 0.01;
      const filteredLinks = links.filter(link => link.value >= minThreshold);

      // Mise à jour des nœuds utilisés
      const usedNodeIds = new Set<string>();
      filteredLinks.forEach(link => {
        usedNodeIds.add(link.source);
        usedNodeIds.add(link.target);
      });
      
      const filteredNodes = nodes.filter(node => usedNodeIds.has(node.id));

      return {
        success: true,
        data: {
          nodes: filteredNodes,
          links: filteredLinks
        },
        processingTime: Date.now() - startTime,
        modelUsed: 'sankey_generator'
      };

    } catch (error) {
      console.error('Error generating Sankey data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Récupération de valeur de champ
  private getFieldValue(transaction: Transaction, field: string): string {
    switch (field) {
      case 'account':
        return transaction.account;
      case 'category':
        return transaction.category || 'Non catégorisé';
      case 'counterparty':
        return transaction.counterparty || 'Inconnu';
      default:
        return 'Autre';
    }
  }

  // Inférence de catégorie de nœud
  private inferNodeCategory(name: string, sourceField: string, targetField: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('banque') || lowerName.includes('compte')) {
      return 'account';
    }
    if (lowerName.includes('alimentaire') || lowerName.includes('restaurant')) {
      return 'food';
    }
    if (lowerName.includes('transport') || lowerName.includes('carburant')) {
      return 'transport';
    }
    if (lowerName.includes('logement') || lowerName.includes('loyer')) {
      return 'housing';
    }
    
    return 'other';
  }

  // Couleur des nœuds
  private getNodeColor(name: string, sourceField: string, targetField: string): string {
    const category = this.inferNodeCategory(name, sourceField, targetField);
    
    const colorMap = {
      account: '#3B82F6',
      food: '#10B981',
      transport: '#F59E0B',
      housing: '#8B5CF6',
      other: '#6B7280'
    };
    
    return colorMap[category] || '#6B7280';
  }

  // Couleur des liens
  private getLinkColor(source: string, target: string): string {
    // Utilise la couleur du nœud source avec transparence
    const sourceColor = this.getNodeColor(source, 'category', 'account');
    return `${sourceColor  }80`; // Ajoute transparence 50%
  }

  // TREEMAP POUR RÉPARTITION BUDGÉTAIRE
  async generateTreemapData(
    transactions: Transaction[],
    groupBy: 'category' | 'account' | 'counterparty' = 'category',
    maxDepth: number = 2
  ): Promise<AIServiceResponse<TreemapNode>> {
    try {
      const startTime = Date.now();
      
      if (!this.isInitialized) {
        this.initialize();
      }

      // Création de la hiérarchie
      const hierarchyData = this.buildHierarchy(transactions, groupBy, maxDepth);
      
      // Calcul des pourcentages
      this.calculatePercentages(hierarchyData);

      return {
        success: true,
        data: hierarchyData,
        processingTime: Date.now() - startTime,
        modelUsed: 'treemap_generator'
      };

    } catch (error) {
      console.error('Error generating treemap data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Construction de la hiérarchie pour treemap
  private buildHierarchy(
    transactions: Transaction[], 
    groupBy: string, 
    maxDepth: number,
    currentDepth: number = 0
  ): TreemapNode {
    
    const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    if (currentDepth >= maxDepth || transactions.length <= 1) {
      // Nœud terminal
      const transaction = transactions[0];
      return {
        id: transaction?.id || crypto.randomUUID(),
        name: transaction ? this.getFieldValue(transaction, groupBy) : 'Vide',
        value: totalAmount,
        color: this.getCategoryColor(transaction?.category),
        percentage: 0 // sera calculé plus tard
      };
    }

    // Groupement des transactions
    const groups = this.groupTransactionsByField(transactions, groupBy);
    const children: TreemapNode[] = [];

    Object.entries(groups).forEach(([groupName, groupTransactions]) => {
      const childNode = this.buildHierarchy(groupTransactions, groupBy, maxDepth, currentDepth + 1);
      childNode.name = groupName;
      childNode.parentId = 'root';
      children.push(childNode);
    });

    // Tri par valeur décroissante
    children.sort((a, b) => b.value - a.value);

    return {
      id: 'root',
      name: 'Répartition financière',
      value: totalAmount,
      children,
      color: '#E5E7EB',
      percentage: 100
    };
  }

  // Groupement par champ
  private groupTransactionsByField(transactions: Transaction[], field: string): Record<string, Transaction[]> {
    return transactions.reduce((groups, transaction) => {
      const fieldValue = this.getFieldValue(transaction, field);
      
      if (!groups[fieldValue]) {
        groups[fieldValue] = [];
      }
      groups[fieldValue].push(transaction);
      
      return groups;
    }, {} as Record<string, Transaction[]>);
  }

  // Calcul des pourcentages
  private calculatePercentages(node: TreemapNode, totalValue?: number): void {
    const total = totalValue || node.value;
    node.percentage = total > 0 ? (node.value / total) * 100 : 0;
    
    if (node.children) {
      node.children.forEach(child => {
        this.calculatePercentages(child, total);
      });
    }
  }

  // Couleur par catégorie
  private getCategoryColor(category?: string): string {
    if (!category) return '#6B7280';
    
    const colorMap = {
      'Alimentaire': '#10B981',
      'Transport': '#F59E0B',
      'Logement': '#8B5CF6',
      'Santé': '#EF4444',
      'Loisirs': '#06B6D4',
      'Éducation': '#84CC16',
      'Vêtements': '#F97316',
      'Services': '#3B82F6'
    };
    
    return colorMap[category] || this.colorScale(category);
  }

  // GÉNÉRATION DE DONNÉES DE SÉRIES TEMPORELLES POUR PRÉDICTIONS
  async generateTimeSeriesData(
    transactions: Transaction[],
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    fillGaps: boolean = true
  ): Promise<AIServiceResponse<FinancialTimeSeriesData[]>> {
    try {
      const startTime = Date.now();
      
      const timeSeriesData: FinancialTimeSeriesData[] = [];
      
      // Tri des transactions par date
      const sortedTransactions = [...transactions].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      if (sortedTransactions.length === 0) {
        return {
          success: true,
          data: [],
          processingTime: Date.now() - startTime
        };
      }

      // Détermination de la plage de dates
      const startDate = new Date(sortedTransactions[0].date);
      const endDate = new Date(sortedTransactions[sortedTransactions.length - 1].date);
      
      // Génération des intervalles de temps
      const timeIntervals = this.generateTimeIntervals(startDate, endDate, interval);
      
      // Calcul du solde cumulé pour chaque intervalle
      let cumulativeBalance = 0;
      let transactionIndex = 0;
      
      timeIntervals.forEach(intervalDate => {
        let intervalValue = 0;
        
        // Agrégation des transactions de cet intervalle
        while (transactionIndex < sortedTransactions.length) {
          const transaction = sortedTransactions[transactionIndex];
          const transactionDate = new Date(transaction.date);
          
          if (this.isDateInInterval(transactionDate, intervalDate, interval)) {
            intervalValue += transaction.type === 'income' ? transaction.amount : -Math.abs(transaction.amount);
            transactionIndex++;
          } else if (transactionDate > this.getIntervalEnd(intervalDate, interval)) {
            break;
          } else {
            transactionIndex++;
          }
        }
        
        cumulativeBalance += intervalValue;
        
        timeSeriesData.push({
          date: new Date(intervalDate),
          value: cumulativeBalance,
          predicted: false,
          trend: this.calculateTrend(timeSeriesData, intervalValue)
        });
      });

      // Calcul des intervalles de confiance pour les derniers points
      this.calculateConfidenceIntervals(timeSeriesData);

      return {
        success: true,
        data: timeSeriesData,
        processingTime: Date.now() - startTime,
        modelUsed: 'time_series_generator'
      };

    } catch (error) {
      console.error('Error generating time series data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Génération des intervalles de temps
  private generateTimeIntervals(startDate: Date, endDate: Date, interval: string): Date[] {
    const intervals: Date[] = [];
    let currentDate = new Date(startDate);
    
    // Normalisation de la date de début selon l'intervalle
    switch (interval) {
      case 'weekly':
        currentDate = d3.timeWeek.floor(currentDate);
        break;
      case 'monthly':
        currentDate = d3.timeMonth.floor(currentDate);
        break;
      case 'daily':
      default:
        currentDate = d3.timeDay.floor(currentDate);
        break;
    }
    
    while (currentDate <= endDate) {
      intervals.push(new Date(currentDate));
      
      // Avancement à l'intervalle suivant
      switch (interval) {
        case 'weekly':
          currentDate = d3.timeWeek.offset(currentDate, 1);
          break;
        case 'monthly':
          currentDate = d3.timeMonth.offset(currentDate, 1);
          break;
        case 'daily':
        default:
          currentDate = d3.timeDay.offset(currentDate, 1);
          break;
      }
    }
    
    return intervals;
  }

  // Vérification si une date est dans un intervalle
  private isDateInInterval(date: Date, intervalStart: Date, interval: string): boolean {
    const intervalEnd = this.getIntervalEnd(intervalStart, interval);
    return date >= intervalStart && date < intervalEnd;
  }

  // Fin d'intervalle
  private getIntervalEnd(intervalStart: Date, interval: string): Date {
    switch (interval) {
      case 'weekly':
        return d3.timeWeek.offset(intervalStart, 1);
      case 'monthly':
        return d3.timeMonth.offset(intervalStart, 1);
      case 'daily':
      default:
        return d3.timeDay.offset(intervalStart, 1);
    }
  }

  // Calcul de tendance simple
  private calculateTrend(existingData: FinancialTimeSeriesData[], currentValue: number): number {
    if (existingData.length < 2) return 0;
    
    const recentValues = existingData.slice(-5).map(d => d.value);
    const firstValue = recentValues[0];
    const lastValue = recentValues[recentValues.length - 1];
    
    return lastValue - firstValue;
  }

  // Calcul des intervalles de confiance
  private calculateConfidenceIntervals(data: FinancialTimeSeriesData[]): void {
    if (data.length < 10) return;
    
    // Calcul de la volatilité des dernières données
    const recentData = data.slice(-10);
    const values = recentData.map(d => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const volatility = Math.sqrt(variance);
    
    // Application des intervalles de confiance aux derniers points
    data.slice(-5).forEach(point => {
      point.confidence = Math.max(0.1, Math.min(0.9, 1 - (volatility / Math.abs(mean))));
    });
  }

  // UTILITAIRES DE RENDU
  
  // Génération du SVG pour Heatmap
  generateHeatmapSVG(data: HeatmapData[], width: number = 800, height: number = 400): string {
    // Préparation des données
    const categories = [...new Set(data.map(d => d.category))];
    const dates = [...new Set(data.map(d => d.date.toISOString().split('T')[0]))].sort();
    
    const cellWidth = width / dates.length;
    const cellHeight = height / categories.length;
    
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, 1]);
    
    // Construction du SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    data.forEach(d => {
      const dateIndex = dates.indexOf(d.date.toISOString().split('T')[0]);
      const categoryIndex = categories.indexOf(d.category);
      
      if (dateIndex >= 0 && categoryIndex >= 0) {
        const x = dateIndex * cellWidth;
        const y = categoryIndex * cellHeight;
        const color = colorScale(d.normalized || 0);
        
        svg += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${color}" stroke="#fff" stroke-width="1"/>`;
      }
    });
    
    svg += '</svg>';
    return svg;
  }

  // Configuration D3 pour Sankey
  configureSankey(data: SankeyData, width: number = 800, height: number = 600): any {
    const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[1, 1], [width - 1, height - 6]]);
    
    const graph = sankeyGenerator({
      nodes: data.nodes.map(d => ({ ...d })),
      links: data.links.map(d => ({ ...d }))
    });
    
    return {
      graph,
      linkGenerator: sankeyLinkHorizontal()
    };
  }

  // Configuration D3 pour Treemap
  configureTreemap(data: TreemapNode, width: number = 800, height: number = 600): any {
    const root = hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value! - a.value!);
    
    const treemapGenerator = treemap<TreemapNode>()
      .size([width, height])
      .paddingInner(1)
      .paddingOuter(3)
      .tile(treemapResquarify);
    
    return treemapGenerator(root);
  }

  // Getters et utilitaires
  get initialized(): boolean {
    return this.isInitialized;
  }

  dispose(): void {
    this.isInitialized = false;
  }
}

// Instance singleton
export const aiVisualizationService = new AIVisualizationService();