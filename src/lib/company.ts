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

  // Étape 1: récupérer les liaisons (sans join) pour éviter toute récursion RLS
  const { data: links, error: linksError } = await supabase
    .from('user_companies')
    .select('company_id')
    .eq('user_id', userId);

  if (linksError) {
    console.error("Erreur lors de la récupération des liaisons user_companies:", linksError);
    if (linksError.code === '42P17' || linksError.message?.includes('infinite recursion')) {
      console.warn('RLS policy recursion detected on user_companies, returning empty array');
      return [];
    }
    throw new Error("Impossible de récupérer les entreprises de l'utilisateur.");
  }

  const companyIds = (links || []).map(l => l.company_id).filter(Boolean);
  if (companyIds.length === 0) return [];

  // Étape 2: récupérer les entreprises par leurs IDs (RLS sur companies autorise si relation existe)
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*')
    .in('id', companyIds);

  if (companiesError) {
    console.error('Erreur lors de la récupération des entreprises:', companiesError);
    if (companiesError.code === '42P17' || companiesError.message?.includes('infinite recursion')) {
      console.warn('RLS policy recursion detected on companies, returning empty array');
      return [];
    }
    throw new Error("Impossible de récupérer les entreprises de l'utilisateur.");
  }

  // Retourne un tableau d'entreprises avec champs communs (dev/prod)
  return (companies || []) as Array<{
    id: string;
    name: string;
    country?: string;
    default_currency?: string;
    default_locale?: string;
    timezone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    website?: string;
    created_at?: string;
    updated_at?: string;
  }>;
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
    .eq('id', companyId);

  if (error) {
    console.error("Erreur lors de la récupération des détails de l'entreprise:", error);
    throw new Error("Impossible de récupérer les détails de l'entreprise.");
  }

  if (!data || data.length === 0) {
    throw new Error("Entreprise non trouvée.");
  }

  return data[0]; // Retourner le premier résultat au lieu d'utiliser .single()
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
