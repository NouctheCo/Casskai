// @ts-nocheck
// Framework A/B Testing moderne et performant
// Optimisé pour les Core Web Vitals et la performance

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // Pourcentage de trafic (0-100)
  config?: Record<string, unknown>;
  isControl?: boolean;
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABTestVariant[];
  startDate?: Date;
  endDate?: Date;
  targetingRules?: TargetingRule[];
  metrics?: string[];
  excludeUrls?: string[];
  includeUrls?: string[];
  trafficAllocation: number; // Pourcentage du trafic total (0-100)
}

export interface TargetingRule {
  type: 'url' | 'query' | 'cookie' | 'localStorage' | 'userAgent' | 'custom';
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'not';
  value: string | string[];
  customFunction?: (context: UserContext) => boolean;
}

export interface UserContext {
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  timestamp: number;
  cookies: Record<string, string>;
  localStorage: Record<string, unknown>;
  queryParams: Record<string, string>;
  customProperties?: Record<string, unknown>;
  [key: string]: string | number | boolean | undefined | Record<string, unknown> | Record<string, string>;
}

interface ABTestResult {
  testId: string;
  variantId: string;
  isInTest: boolean;
  config?: Record<string, unknown>;
}

interface ABTestEvent {
  testId: string;
  variantId: string;
  eventType: 'impression' | 'conversion' | 'custom';
  eventName?: string;
  value?: number;
  properties?: Record<string, unknown>;
  timestamp: number;
}

// Service principal A/B Testing
export class ABTestingFramework {
  private static instance: ABTestingFramework;
  private tests: Map<string, ABTest> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId
  private eventQueue: ABTestEvent[] = [];
  private isInitialized: boolean = false;
  private config: ABTestingConfig;

  private constructor(config: ABTestingConfig = {}) {
    this.config = {
      persistentStorage: true,
      analyticsIntegration: true,
      enableLocalTesting: false,
      flushInterval: 5000,
      maxQueueSize: 100,
      hashSalt: 'casskai-ab-testing',
      ...config,
    };
  }

  static getInstance(config?: ABTestingConfig): ABTestingFramework {
    if (!ABTestingFramework.instance) {
      ABTestingFramework.instance = new ABTestingFramework(config);
    }
    return ABTestingFramework.instance;
  }

  // Initialiser le framework
  async initialize(testsConfig: ABTest[]): Promise<void> {
    try {
      // Charger les tests
      testsConfig.forEach(test => {
        this.tests.set(test.id, test);
      });

      // Restaurer les assignments depuis le storage
      if (this.config.persistentStorage) {
        this.loadAssignmentsFromStorage();
      }

      // Démarrer le flush périodique des événements
      this.startEventFlush();

      this.isInitialized = true;
      console.log(`[ABTesting] Framework initialisé avec ${testsConfig.length} tests`);
    } catch (error) {
      console.error('[ABTesting] Erreur d\'initialisation:', error);
    }
  }

  // Obtenir la variante pour un test donné
  getVariant(testId: string, userContext?: Partial<UserContext>): ABTestResult {
    const test = this.tests.get(testId);
    
    if (!test || test.status !== 'running') {
      return { testId, variantId: 'control', isInTest: false };
    }

    const context = this.buildUserContext(userContext);
    
    // Vérifier les règles de ciblage
    if (!this.matchesTargeting(test, context)) {
      return { testId, variantId: 'control', isInTest: false };
    }

    // Vérifier si l'utilisateur est déjà assigné
    const existingAssignment = this.getUserAssignment(context.userId || context.sessionId, testId);
    if (existingAssignment) {
      const variant = test.variants.find(v => v.id === existingAssignment);
      return {
        testId,
        variantId: existingAssignment,
        isInTest: true,
        config: variant?.config,
      };
    }

    // Vérifier l'allocation de trafic
    const trafficHash = this.hashString(`${context.userId || context.sessionId}-${testId}-traffic`, this.config.hashSalt);
    const trafficBucket = trafficHash % 100;
    
    if (trafficBucket >= test.trafficAllocation) {
      return { testId, variantId: 'control', isInTest: false };
    }

    // Assigner une variante
    const variantId = this.assignVariant(test, context);
    
    // Sauvegarder l'assignment
    this.setUserAssignment(context.userId || context.sessionId, testId, variantId);
    
    // Enregistrer l'impression
    this.trackEvent({
      testId,
      variantId,
      eventType: 'impression',
    });

    const variant = test.variants.find(v => v.id === variantId);
    
    return {
      testId,
      variantId,
      isInTest: true,
      config: variant?.config,
    };
  }

  // Assigner une variante basée sur les poids
  private assignVariant(test: ABTest, context: UserContext): string {
    const userId = context.userId || context.sessionId;
    const hash = this.hashString(`${userId}-${test.id}`, this.config.hashSalt);
    const bucket = hash % 100;

    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (bucket < cumulativeWeight) {
        return variant.id;
      }
    }

    // Fallback sur la variante de contrôle
    const controlVariant = test.variants.find(v => v.isControl);
    return controlVariant?.id || test.variants[0].id;
  }

  // Vérifier les règles de ciblage
  private matchesTargeting(test: ABTest, context: UserContext): boolean {
    if (!test.targetingRules || test.targetingRules.length === 0) {
      return true;
    }

    return test.targetingRules.every(rule => this.evaluateTargetingRule(rule, context));
  }

  private evaluateTargetingRule(rule: TargetingRule, context: UserContext): boolean {
    let value: string | undefined | unknown;

    switch (rule.type) {
      case 'url':
        value = context.url;
        break;
      case 'query':
        value = context.queryParams[rule.value as string];
        break;
      case 'cookie':
        value = context.cookies[rule.value as string];
        break;
      case 'localStorage':
        value = context.localStorage[rule.value as string];
        break;
      case 'userAgent':
        value = context.userAgent;
        break;
      case 'custom':
        return rule.customFunction ? rule.customFunction(context) : true;
      default:
        return true;
    }

    if (value === undefined) return false;

    const targetValue = Array.isArray(rule.value) ? rule.value : [rule.value];

    switch (rule.operator) {
      case 'equals':
        return targetValue.includes(value as string);
      case 'contains':
        return targetValue.some(target => (value as string).includes(target));
      case 'startsWith':
        return targetValue.some(target => (value as string).startsWith(target));
      case 'endsWith':
        return targetValue.some(target => (value as string).endsWith(target));
      case 'regex':
        return targetValue.some(target => new RegExp(target).test(value as string));
      case 'not':
        return !targetValue.includes(value as string);
      default:
        return true;
    }
  }

  // Construire le contexte utilisateur
  private buildUserContext(userContext?: Partial<UserContext>): UserContext {
    const defaultContext: UserContext = {
      sessionId: this.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      cookies: this.getCookies(),
      localStorage: this.getLocalStorageData(),
      queryParams: this.getQueryParams(),
    };

    return { ...defaultContext, ...userContext };
  }

  // Enregistrer un événement
  trackEvent(event: Omit<ABTestEvent, 'timestamp'>): void {
    const fullEvent: ABTestEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.eventQueue.push(fullEvent);

    // Flush immédiat si la queue est pleine
    if (this.config.maxQueueSize && this.eventQueue.length >= this.config.maxQueueSize) {
      this.flushEvents();
    }
  }

  // Tracker une conversion
  trackConversion(testId: string, eventName?: string, value?: number, properties?: Record<string, unknown>): void {
    const userAssignments = this.userAssignments.get(this.getSessionId());
    const variantId = userAssignments?.get(testId);
    
    if (variantId) {
      this.trackEvent({
        testId,
        variantId,
        eventType: 'conversion',
        eventName,
        value,
        properties,
      });
    }
  }

  // Gérer les assignments utilisateur
  private getUserAssignment(userId: string, testId: string): string | null {
    return this.userAssignments.get(userId)?.get(testId) || null;
  }

  private setUserAssignment(userId: string, testId: string, variantId: string): void {
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.userAssignments.get(userId)!.set(testId, variantId);

    if (this.config.persistentStorage) {
      this.saveAssignmentsToStorage();
    }
  }

  // Persistence des assignments
  private loadAssignmentsFromStorage(): void {
    try {
      const stored = localStorage.getItem('casskai-ab-assignments');
      if (stored) {
        const assignments = JSON.parse(stored);
        Object.entries(assignments).forEach(([userId, testAssignments]) => {
          this.userAssignments.set(userId, new Map(Object.entries(testAssignments as Record<string, string>)));
        });
      }
    } catch (error) {
      console.warn('[ABTesting] Erreur de chargement des assignments:', error);
    }
  }

  private saveAssignmentsToStorage(): void {
    try {
      const assignments: Record<string, Record<string, string>> = {};
      this.userAssignments.forEach((testMap, userId) => {
        assignments[userId] = Object.fromEntries(testMap);
      });
      localStorage.setItem('casskai-ab-assignments', JSON.stringify(assignments));
    } catch (error) {
      console.warn('[ABTesting] Erreur de sauvegarde des assignments:', error);
    }
  }

  // Gestion des événements
  private startEventFlush(): void {
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.config.flushInterval);
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Envoyer vers l'API analytics
      await this.sendEventsToAnalytics(eventsToFlush);
    } catch (error) {
      console.error('[ABTesting] Erreur lors du flush des événements:', error);
      // Remettre les événements en queue en cas d'erreur
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  private async sendEventsToAnalytics(events: ABTestEvent[]): Promise<void> {
    if (!this.config.analyticsIntegration) return;

    // Intégration avec Plausible Analytics
    events.forEach(event => {
      if (window.plausible) {
        window.plausible('AB Test Event', {
          props: {
            test_id: event.testId,
            variant_id: event.variantId,
            event_type: event.eventType,
            event_name: event.eventName || 'default',
            value: event.value || 0,
          }
        });
      }
    });

    // Envoyer vers notre API si configurée
    if (this.config.apiEndpoint) {
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    }
  }

  // Utilitaires
  private hashString(str: string, salt: string = ''): number {
    const fullStr = salt + str;
    let hash = 0;
    for (let i = 0; i < fullStr.length; i++) {
      const char = fullStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getSessionId(): string {
    const existing = sessionStorage.getItem('casskai-session-id');
    if (existing) return existing;
    
    const newId = `sess_${  Date.now()  }_${  Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('casskai-session-id', newId);
    return newId;
  }

  private getCookies(): Record<string, string> {
    const cookies: Record<string, string> = {};
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
    return cookies;
  }

  private getLocalStorageData(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            data[key] = localStorage.getItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('[ABTesting] Erreur d\'accès au localStorage:', error);
    }
    return data;
  }

  private getQueryParams(): Record<string, string> {
    const params: Record<string, string> = {};
    new URLSearchParams(window.location.search).forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }

  // Méthodes publiques pour la gestion des tests
  addTest(test: ABTest): void {
    this.tests.set(test.id, test);
  }

  removeTest(testId: string): void {
    this.tests.delete(testId);
  }

  getTest(testId: string): ABTest | undefined {
    return this.tests.get(testId);
  }

  getAllTests(): ABTest[] {
    return Array.from(this.tests.values());
  }

  getActiveTests(): ABTest[] {
    return this.getAllTests().filter(test => test.status === 'running');
  }

  // Debug et monitoring
  getDebugInfo(): Record<string, unknown> {
    return {
      isInitialized: this.isInitialized,
      testsCount: this.tests.size,
      activeTestsCount: this.getActiveTests().length,
      assignmentsCount: this.userAssignments.size,
      queuedEventsCount: this.eventQueue.length,
      sessionId: this.getSessionId(),
      config: this.config,
    };
  }
}

// Configuration du framework
export interface ABTestingConfig {
  persistentStorage?: boolean;
  analyticsIntegration?: boolean;
  enableLocalTesting?: boolean;
  flushInterval?: number;
  maxQueueSize?: number;
  hashSalt?: string;
  apiEndpoint?: string;
}


export default ABTestingFramework;
