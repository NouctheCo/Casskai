import { supabase } from '../../lib/supabase';
import { OnboardingData } from '../../types/onboarding.types';

export interface OnboardingResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface OnboardingSession {
  id: string;
  userId: string;
  sessionToken: string;
  sessionData: OnboardingData;
  isActive: boolean;
  startedAt?: string | null;
  lastSavedAt?: string | null;
  progress?: number | null;
  expiresAt?: Date;
}

type SupabaseOnboardingSession = {
  id: string;
  user_id: string;
  company_id: string | null;
  session_token: string;
  session_data: OnboardingData | null;
  started_at: string | null;
  completed_at: string | null;
  abandoned_at: string | null;
  current_step: string | null;
  total_steps: number | null;
  completed_steps: number | null;
  final_status: string | null;
  progress: number | null;
  is_active: boolean | null;
  last_saved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  initial_data?: Record<string, unknown> | null;
  final_data?: Record<string, unknown> | null;
};

const LOCAL_ONBOARDING_PREFIX = 'onboarding_';
const LOCAL_SESSION_PREFIX = 'onboarding_session_token_';
const DEFAULT_TOTAL_STEPS = 6;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 heures
const SUPABASE_SESSION_COLUMNS = [
  'id',
  'user_id',
  'company_id',
  'session_token',
  'session_data',
  'started_at',
  'completed_at',
  'abandoned_at',
  'current_step',
  'total_steps',
  'completed_steps',
  'final_status',
  'progress',
  'is_active',
  'last_saved_at',
  'created_at',
  'updated_at',
  'initial_data',
  'final_data'
].join(', ');

export class OnboardingStorageService {
  private cache: Map<string, OnboardingData> = new Map();
  private sessionCache: Map<string, SupabaseOnboardingSession | null> = new Map();

  private get isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private generateSessionToken(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `session_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  }

  private getLocalKey(userId: string): string {
    return `${LOCAL_ONBOARDING_PREFIX}${userId}`;
  }

  private getSessionTokenKey(userId: string): string {
    return `${LOCAL_SESSION_PREFIX}${userId}`;
  }

  private readSessionToken(userId: string): string | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      return window.localStorage.getItem(this.getSessionTokenKey(userId));
    } catch (error) {
      console.warn('Unable to read onboarding session token from localStorage:', error);
      return null;
    }
  }

  private persistSessionToken(userId: string, token: string): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      window.localStorage.setItem(this.getSessionTokenKey(userId), token);
    } catch (error) {
      console.warn('Unable to persist onboarding session token:', error);
    }
  }

  private clearSessionToken(userId: string): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      window.localStorage.removeItem(this.getSessionTokenKey(userId));
    } catch (error) {
      console.warn('Unable to clear onboarding session token:', error);
    }
  }

  private resolveCurrentStepId(data?: OnboardingData | null): string {
    if (data?.currentStepId && data.currentStepId.trim().length > 0) {
      return data.currentStepId;
    }

    const legacy = (data as (OnboardingData & { currentStep?: string }) | undefined)?.currentStep;
    if (legacy && legacy.trim().length > 0) {
      return legacy;
    }

    return 'welcome';
  }

  private ensureStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
  }

  private normalizeTimestamp(value: string | null | undefined, fallbackIso: string): string {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    return fallbackIso;
  }

  private normalizeProgress(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    return 0;
  }

  /**
   * Récupère les données depuis le cache mémoire
   */
  getCachedData(userId: string): OnboardingData | null {
    return this.cache.get(userId) || null;
  }

  /**
   * Met en cache les données d'onboarding en mémoire
   */
  setCachedData(userId: string, data: OnboardingData): void {
    this.cache.set(userId, data);
  }

  /**
   * Supprime les données du cache mémoire
   */
  clearCachedData(userId: string): void {
    this.cache.delete(userId);
    this.sessionCache.delete(userId);
  }

  /**
   * Sauvegarde dans le localStorage (fallback offline)
   */
  saveToLocalStorage(userId: string, data: OnboardingData): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      window.localStorage.setItem(this.getLocalKey(userId), JSON.stringify(data));
    } catch (error) {
      console.warn('Unable to save onboarding draft to localStorage:', error);
    }
  }

  /**
   * Lecture localStorage (fallback offline)
   */
  getLocalStorageData(userId: string): OnboardingData | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const stored = window.localStorage.getItem(this.getLocalKey(userId));
      return stored ? (JSON.parse(stored) as OnboardingData) : null;
    } catch (error) {
      console.warn('Unable to read onboarding draft from localStorage:', error);
      return null;
    }
  }

  /**
   * Nettoyage du localStorage
   */
  clearLocalStorageData(userId: string): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      window.localStorage.removeItem(this.getLocalKey(userId));
    } catch (error) {
      console.warn('Unable to clear onboarding draft from localStorage:', error);
    }
  }

  /**
   * Récupère la session Supabase (avec cache mémoire)
   */
  private async fetchSupabaseSession(userId: string, forceRefresh = false): Promise<SupabaseOnboardingSession | null> {
    if (!forceRefresh && this.sessionCache.has(userId)) {
      return this.sessionCache.get(userId) || null;
    }

    const { data, error } = await supabase
      .from('onboarding_sessions')
      .select(SUPABASE_SESSION_COLUMNS)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Unable to fetch onboarding session from Supabase:', error);
      this.sessionCache.set(userId, null);
      return null;
    }

    let session: SupabaseOnboardingSession | null = null;
    if (data !== null && typeof data === 'object' && 'session_token' in (data as Record<string, unknown>)) {
      session = data as SupabaseOnboardingSession;
    }

    if (session?.session_token) {
      this.persistSessionToken(userId, session.session_token);
    }

    this.sessionCache.set(userId, session);
    return session;
  }

  private normalizeOnboardingData(userId: string, data: OnboardingData | null | undefined): OnboardingData {
    const nowIso = new Date().toISOString();
    const companyProfile = data?.companyProfile ?? {};
    const preferences = data?.preferences ?? {};
    const featuresExploration = data?.featuresExploration ?? {};
    const selectedModules = this.ensureStringArray(data?.selectedModules);
    const completedSteps = this.ensureStringArray(data?.completedSteps);
    const currentStepId = this.resolveCurrentStepId(data ?? undefined);
    const startedAt = this.normalizeTimestamp(data?.startedAt, nowIso);
    const lastSavedAt = this.normalizeTimestamp(data?.lastSavedAt, nowIso);
    const progress = this.normalizeProgress(data?.progress);

    const normalized: OnboardingData = {
      userId,
      companyProfile,
      selectedModules,
      preferences,
      featuresExploration,
      currentStepId,
      completedSteps,
      startedAt,
      lastSavedAt,
      progress
    };

    if (data?.completedAt) {
      normalized.completedAt = data.completedAt;
    }

    return normalized;
  }

  private buildSessionExpiresAt(lastSavedAt?: string | null): Date | undefined {
    if (!lastSavedAt) {
      return undefined;
    }

    const last = new Date(lastSavedAt);
    if (Number.isNaN(last.getTime())) {
      return undefined;
    }

    return new Date(last.getTime() + SESSION_TTL_MS);
  }

  private async ensureSupabaseSession(userId: string, data: OnboardingData): Promise<SupabaseOnboardingSession | null> {
    const normalized = this.normalizeOnboardingData(userId, data);
    const existing = await this.fetchSupabaseSession(userId);
    const sessionToken = existing?.session_token ?? this.readSessionToken(userId) ?? this.generateSessionToken();
    const lastSavedAt = new Date().toISOString();

    if (existing) {
      const { data: updated, error } = await supabase
        .from('onboarding_sessions')
        .update({
          session_data: normalized,
          current_step: normalized.currentStepId,
          completed_steps: normalized.completedSteps.length,
          progress: normalized.progress,
          last_saved_at: lastSavedAt,
          updated_at: lastSavedAt,
          final_status: 'in_progress',
          is_active: true
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) {
        console.error('Unable to update onboarding session in Supabase:', error);
        return null;
      }

      this.sessionCache.set(userId, updated);
      this.persistSessionToken(userId, updated.session_token);
      return updated;
    }

    const startedAt = normalized.startedAt ?? lastSavedAt;

    const { data: inserted, error } = await supabase
      .from('onboarding_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        session_data: normalized,
        current_step: normalized.currentStepId,
        completed_steps: normalized.completedSteps.length,
        total_steps: Math.max(DEFAULT_TOTAL_STEPS, normalized.completedSteps.length || DEFAULT_TOTAL_STEPS),
        progress: normalized.progress,
        last_saved_at: lastSavedAt,
        updated_at: lastSavedAt,
        started_at: startedAt,
        initial_data: { startedAt },
        final_status: 'in_progress',
        is_active: true
      })
      .select('*')
      .single();

    if (error) {
      console.error('Unable to create onboarding session in Supabase:', error);
      return null;
    }

    this.sessionCache.set(userId, inserted);
    this.persistSessionToken(userId, inserted.session_token);
    return inserted;
  }

  /**
   * Récupère une session active
   */
  async getActiveSession(userId: string): Promise<OnboardingResponse<OnboardingSession | null>> {
    try {
      const supabaseSession = await this.fetchSupabaseSession(userId);

      if (supabaseSession?.session_data) {
        const normalized = this.normalizeOnboardingData(userId, supabaseSession.session_data);
        this.setCachedData(userId, normalized);
        this.saveToLocalStorage(userId, normalized);

        return {
          success: true,
          data: {
            id: supabaseSession.id,
            userId,
            sessionToken: supabaseSession.session_token,
            sessionData: normalized,
            isActive: supabaseSession.is_active ?? true,
            startedAt: supabaseSession.started_at,
            lastSavedAt: supabaseSession.last_saved_at,
            progress: supabaseSession.progress,
            expiresAt: this.buildSessionExpiresAt(supabaseSession.last_saved_at)
          }
        };
      }

      const cachedData = this.getCachedData(userId) ?? this.getLocalStorageData(userId);
      if (cachedData) {
        return {
          success: true,
          data: {
            id: `session_${userId}`,
            userId,
            sessionToken: this.readSessionToken(userId) ?? this.generateSessionToken(),
            sessionData: cachedData,
            isActive: true,
            startedAt: cachedData.startedAt,
            lastSavedAt: cachedData.lastSavedAt,
            progress: cachedData.progress,
            expiresAt: this.buildSessionExpiresAt(cachedData.lastSavedAt)
          }
        };
      }

      return {
        success: true,
        data: null
      };
    } catch (error) {
      console.error('Error while retrieving onboarding session:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération de la session'
      };
    }
  }

  /**
   * Sauvegarde les données d'onboarding dans Supabase avec fallback local
   */
  async saveOnboardingData(userId: string, data: OnboardingData): Promise<OnboardingResponse<OnboardingData>> {
    try {
      const normalized = this.normalizeOnboardingData(userId, data);

      await this.ensureSupabaseSession(userId, normalized);

      this.setCachedData(userId, normalized);
      this.saveToLocalStorage(userId, normalized);

      return {
        success: true,
        data: normalized
      };
    } catch (error) {
      console.error('Error while saving onboarding data:', error);
      return {
        success: false,
        error: 'Erreur lors de la sauvegarde des données'
      };
    }
  }

  /**
   * Supprime toutes les données d'onboarding (brouillons + session Supabase)
   */
  async clearOnboardingData(
    userId: string,
    options: { finalStatus?: 'completed' | 'abandoned' | 'in_progress' } = {}
  ): Promise<OnboardingResponse<void>> {
    try {
      const session = await this.fetchSupabaseSession(userId);
      const closedAt = new Date().toISOString();
      const requestedStatus = options.finalStatus;

      if (session) {
        const finalStatus = requestedStatus ?? (session.final_status === 'completed' ? 'completed' : 'abandoned');
        const { error } = await supabase
          .from('onboarding_sessions')
          .update({
            is_active: finalStatus === 'in_progress',
            final_status: finalStatus,
            abandoned_at: finalStatus === 'abandoned' ? closedAt : session.abandoned_at,
            last_saved_at: closedAt,
            updated_at: closedAt
          })
          .eq('id', session.id);

        if (error) {
          console.error('Unable to deactivate onboarding session in Supabase:', error);
        }
      }

      this.clearCachedData(userId);
      this.clearLocalStorageData(userId);
      this.clearSessionToken(userId);

      return {
        success: true
      };
    } catch (error) {
      console.error('Error while clearing onboarding data:', error);
      return {
        success: false,
        error: 'Erreur lors de la suppression des données'
      };
    }
  }

  /**
   * Récupère les données d'onboarding avec fallback cache -> localStorage
   */
  async getOnboardingData(userId: string): Promise<OnboardingResponse<OnboardingData | null>> {
    try {
      const supabaseSession = await this.fetchSupabaseSession(userId);

      if (supabaseSession?.session_data) {
        const normalized = this.normalizeOnboardingData(userId, supabaseSession.session_data);
        this.setCachedData(userId, normalized);
        this.saveToLocalStorage(userId, normalized);

        return {
          success: true,
          data: normalized
        };
      }

      const cached = this.getCachedData(userId);
      if (cached) {
        return {
          success: true,
          data: cached
        };
      }

      const localData = this.getLocalStorageData(userId);
      if (localData) {
        this.setCachedData(userId, localData);
        return {
          success: true,
          data: localData
        };
      }

      return {
        success: true,
        data: null
      };
    } catch (error) {
      console.error('Error while fetching onboarding data:', error);
      return {
        success: false,
        error: 'Erreur lors de la récupération des données'
      };
    }
  }
}
