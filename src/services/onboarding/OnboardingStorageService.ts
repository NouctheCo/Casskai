import { OnboardingData } from '../../types/onboarding.types';

export interface OnboardingResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface OnboardingSession {
  id: string;
  userId: string;
  sessionData: OnboardingData;
  expiresAt: Date;
  isActive: boolean;
}

export class OnboardingStorageService {
  private cache: Map<string, OnboardingData> = new Map();

  /**
   * Simule une opération de base de données
   */
  private async simulateDbOperation(delay: number = 100): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Récupère les données depuis le cache
   */
  getCachedData(userId: string): OnboardingData | null {
    return this.cache.get(userId) || null;
  }

  /**
   * Met en cache les données d'onboarding
   */
  setCachedData(userId: string, data: OnboardingData): void {
    this.cache.set(userId, data);
  }

  /**
   * Supprime les données du cache
   */
  clearCachedData(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Sauvegarde dans le localStorage
   */
  saveToLocalStorage(userId: string, data: OnboardingData): void {
    try {
      const key = `onboarding_${userId}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Unable to save to localStorage:', error);
    }
  }

  /**
   * Récupère depuis le localStorage
   */
  getLocalStorageData(userId: string): OnboardingData | null {
    try {
      const key = `onboarding_${userId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Unable to read from localStorage:', error);
      return null;
    }
  }

  /**
   * Supprime du localStorage
   */
  clearLocalStorageData(userId: string): void {
    try {
      const key = `onboarding_${userId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Unable to clear localStorage:', error);
    }
  }

  /**
   * Récupère une session active
   */
  async getActiveSession(userId: string): Promise<OnboardingResponse<OnboardingSession | null>> {
    try {
      await this.simulateDbOperation(50);
      
      // Dans un vrai scénario, on interrogerait la base de données
      // Ici on simule en vérifiant le cache et localStorage
      const cachedData = this.getCachedData(userId);
      const localData = this.getLocalStorageData(userId);
      
      if (cachedData || localData) {
        const session: OnboardingSession = {
          id: `session_${userId}_${Date.now()}`,
          userId,
          sessionData: cachedData || localData!,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
          isActive: true
        };

        return {
          success: true,
          data: session
        };
      }

      return {
        success: true,
        data: null
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur lors de la récupération de la session'
      };
    }
  }

  /**
   * Sauvegarde les données d'onboarding
   */
  async saveOnboardingData(userId: string, data: OnboardingData): Promise<OnboardingResponse<OnboardingData>> {
    try {
      // Simuler sauvegarde en base
      await this.simulateDbOperation(100);
      
      // Mettre à jour le cache et localStorage
      this.setCachedData(userId, data);
      this.saveToLocalStorage(userId, data);

      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur lors de la sauvegarde'
      };
    }
  }

  /**
   * Supprime toutes les données d'onboarding
   */
  async clearOnboardingData(userId: string): Promise<OnboardingResponse<void>> {
    try {
      // Simuler suppression en base
      await this.simulateDbOperation(50);
      
      // Supprimer du cache et localStorage
      this.clearCachedData(userId);
      this.clearLocalStorageData(userId);

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erreur lors de la suppression'
      };
    }
  }

  /**
   * Récupère les données d'onboarding avec fallback cache -> localStorage
   */
  async getOnboardingData(userId: string): Promise<OnboardingResponse<OnboardingData | null>> {
    try {
      // Vérifier d'abord le cache
      const cached = this.getCachedData(userId);
      if (cached) {
        return {
          success: true,
          data: cached
        };
      }

      // Simuler récupération depuis la base
      await this.simulateDbOperation(150);
      
      // Récupérer depuis le localStorage comme fallback
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
      return {
        success: false,
        error: 'Erreur lors de la récupération des données'
      };
    }
  }
}