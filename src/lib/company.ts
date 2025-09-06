// @ts-nocheck
import { supabase } from './supabase';

/**
 * Récupère toutes les entreprises associées à un utilisateur.
 * @param userId L'ID de l'utilisateur.
 * @returns Une promesse qui se résout avec une liste d'entreprises.
 */
export const getUserCompanies = async (userId: string) => {
  if (!userId) {
    throw new Error("L'ID de l'utilisateur est requis.");
  }

  const { data, error } = await supabase
    .from('user_companies')
    .select(`
      company:companies (
        id,
        name,
        country,
        default_currency,
        is_active
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error("Erreur lors de la récupération des entreprises de l'utilisateur:", error);
    throw new Error("Impossible de récupérer les entreprises de l'utilisateur.");
  }

  // Extraire et retourner uniquement les données de l'entreprise
  return data?.map(item => item.company).filter(Boolean) || [];
};

/**
 * Récupère les détails complets d'une entreprise spécifique.
 * @param companyId L'ID de l'entreprise.
 * @returns Une promesse qui se résout avec les détails de l'entreprise.
 */
export const getCompanyDetails = async (companyId: string) => {
  if (!companyId) {
    throw new Error("L'ID de l'entreprise est requis.");
  }

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (error) {
    console.error("Erreur lors de la récupération des détails de l'entreprise:", error);
    throw new Error("Impossible de récupérer les détails de l'entreprise.");
  }

  return data;
};

/**
 * Récupère les modules activés pour une entreprise.
 * @param companyId L'ID de l'entreprise.
 * @returns Une promesse qui se résout avec un objet représentant les modules.
 */
export const getCompanyModules = async (companyId: string) => {
  if (!companyId) {
    throw new Error("L'ID de l'entreprise est requis.");
  }

  const { data, error } = await supabase
    .from('company_modules')
    .select('module_key, is_enabled')
    .eq('company_id', companyId);

  if (error) {
    console.error("Erreur lors de la récupération des modules de l'entreprise:", error);
    // Retourner un objet de modules par défaut en cas d'erreur
    return { dashboard: true, settings: true };
  }

  const modules = data.reduce((acc, module) => {
    acc[module.module_key] = module.is_enabled;
    return acc;
  }, {} as Record<string, boolean>);

  // Assurer que les modules de base sont toujours présents
  return {
    dashboard: true,
    settings: true,
    ...modules,
  };
};
