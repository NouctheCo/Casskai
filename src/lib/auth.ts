import { supabase } from './supabase';
import { logger } from '@/utils/logger';

/**
 * Gère l'inscription d'un nouvel utilisateur.
 * Crée l'utilisateur dans Supabase Auth et insère un profil public.
 *
 * @param email L'email de l'utilisateur.
 * @param password Le mot de passe de l'utilisateur.
 * @param userData Données supplémentaires comme le prénom et le nom.
 * @returns Les données de l'utilisateur et de la session.
 */
export const signUp = async (email: string, password: string, userData: { firstName: string; lastName: string }) => {
  // Étape 1: Inscription avec Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: userData.firstName,
        last_name: userData.lastName,
      },
    },
  });

  if (authError) {
    logger.error("Erreur lors de l'inscription (Auth);:", authError.message);
    throw new Error(`L'inscription a échoué: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error("L'inscription n'a pas retourné d'utilisateur.");
  }

  // Étape 2: Création du profil public de l'utilisateur
  // Cette opération est maintenant gérée par un trigger SQL dans Supabase
  // pour plus de fiabilité et de sécurité. Voir la fonction `handle_new_user`.

  logger.info(`Inscription réussie pour ${email}. Un profil public a été créé automatiquement.`);

  return authData;
};

/**
 * Gère la connexion d'un utilisateur.
 *
 * @param email L'email de l'utilisateur.
 * @param password Le mot de passe de l'utilisateur.
 * @returns Les données de l'utilisateur et de la session.
 */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    logger.error('Erreur de connexion:', error.message);
    throw new Error(`La connexion a échoué: ${error.message}`);
  }

  return data;
};

/**
 * Gère la déconnexion de l'utilisateur.
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    logger.error('Erreur de déconnexion:', error.message);
    throw new Error(`La déconnexion a échoué: ${error.message}`);
  }
};

/**
 * Récupère la session en cours de l'utilisateur.
 * @returns La session active ou null.
 */
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

/**
 * Écoute les changements d'état d'authentification.
 * @param callback La fonction à appeler lors d'un changement.
 * @returns Un objet pour se désabonner de l'écouteur.
 */
export const onAuthStateChange = (callback: (session: any) => void) => {
  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session);
  });

  return authListener.subscription;
};