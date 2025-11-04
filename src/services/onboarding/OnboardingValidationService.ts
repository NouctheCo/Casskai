import {
  CompanyProfile,
  OnboardingPreferences,
  OnboardingData,
  OnboardingValidationError,
  StepValidationResult,
  OnboardingStepId
} from '../../types/onboarding.types';

export class OnboardingValidationService {
  validateCompanyProfile(profile: Partial<CompanyProfile>): StepValidationResult {
    const errors: OnboardingValidationError[] = [];
    const extras = profile as unknown as {
      industry?: string;
      employeeCount?: number | null;
      annualRevenue?: number | null;
    };

    if (profile.name !== undefined) {
      if (!profile.name?.trim()) {
        errors.push({
          field: 'name',
          message: 'Le nom de l\'entreprise est requis',
          code: 'REQUIRED'
        });
      } else if (profile.name.length < 2) {
        errors.push({
          field: 'name',
          message: 'Le nom doit contenir au moins 2 caractères',
          code: 'MIN_LENGTH'
        });
      } else if (profile.name.length > 100) {
        errors.push({
          field: 'name',
          message: 'Le nom ne peut pas dépasser 100 caractères',
          code: 'MAX_LENGTH'
        });
      }
    }

  if (extras.industry !== undefined && extras.industry && extras.industry.length < 3) {
      errors.push({
        field: 'industry',
        message: 'Le secteur d\'activité doit contenir au moins 3 caractères',
        code: 'MIN_LENGTH'
      });
    }

    if (profile.country !== undefined && !profile.country?.trim()) {
      errors.push({
        field: 'country',
        message: 'Le pays est requis',
        code: 'REQUIRED'
      });
    }

  if (extras.employeeCount !== undefined && extras.employeeCount !== null && extras.employeeCount < 1) {
      errors.push({
        field: 'employeeCount',
        message: 'Le nombre d\'employés doit être positif',
        code: 'INVALID_VALUE'
      });
    }

  if (extras.annualRevenue !== undefined && extras.annualRevenue !== null && extras.annualRevenue < 0) {
      errors.push({
        field: 'annualRevenue',
        message: 'Le chiffre d\'affaires ne peut pas être négatif',
        code: 'INVALID_VALUE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validatePreferences(preferences: Partial<OnboardingPreferences>): StepValidationResult {
    const errors: OnboardingValidationError[] = [];
    const extras = preferences as unknown as { modules?: unknown[] };

    if (preferences.language !== undefined && !preferences.language?.trim()) {
      errors.push({
        field: 'language',
        message: 'La langue est requise',
        code: 'REQUIRED'
      });
    }

    if (preferences.currency !== undefined && !preferences.currency?.trim()) {
      errors.push({
        field: 'currency',
        message: 'La devise est requise',
        code: 'REQUIRED'
      });
    }

    if (preferences.timezone !== undefined && !preferences.timezone?.trim()) {
      errors.push({
        field: 'timezone',
        message: 'Le fuseau horaire est requis',
        code: 'REQUIRED'
      });
    }

  if (extras.modules !== undefined && Array.isArray(extras.modules) && extras.modules.length === 0) {
      errors.push({
        field: 'modules',
        message: 'Au moins un module doit être sélectionné',
        code: 'REQUIRED'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async validateStep(_userId: string, stepId: OnboardingStepId, data?: OnboardingData): Promise<StepValidationResult> {
    try {
      if (!data) {
        return {
          isValid: false,
          errors: [{
            field: 'general',
            message: 'Données d\'onboarding introuvables',
            code: 'DATA_NOT_FOUND'
          }]
        };
      }

      switch (stepId) {
        case 'company':
          return this.validateCompanyProfile(data.companyProfile);
        case 'preferences':
          return this.validatePreferences(data.preferences);
        case 'complete':
          return this.validateFinalOnboarding(data);
        default:
          return { isValid: true, errors: [] };
      }
  } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'Erreur lors de la validation',
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  private validateFinalOnboarding(data: OnboardingData): StepValidationResult {
    const errors: OnboardingValidationError[] = [];

    // Valider le profil de l'entreprise
    const companyValidation = this.validateCompanyProfile(data.companyProfile);
    if (!companyValidation.isValid) {
      errors.push(...companyValidation.errors);
    }

    // Valider les préférences
    const preferencesValidation = this.validatePreferences(data.preferences);
    if (!preferencesValidation.isValid) {
      errors.push(...preferencesValidation.errors);
    }

    // Validation spécifique à la finalisation
    if (!data.companyProfile.name?.trim()) {
      errors.push({
        field: 'companyProfile.name',
        message: 'Le nom de l\'entreprise est requis pour finaliser',
        code: 'REQUIRED'
      });
    }

    if (!data.companyProfile.country?.trim()) {
      errors.push({
        field: 'companyProfile.country',
        message: 'Le pays est requis pour finaliser',
        code: 'REQUIRED'
      });
    }

    if (!data.preferences.currency?.trim()) {
      errors.push({
        field: 'preferences.currency',
        message: 'La devise est requise pour finaliser',
        code: 'REQUIRED'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
