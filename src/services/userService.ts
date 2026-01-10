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
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
/**
 * Service centralisé pour les opérations sur les utilisateurs
 *
 * ⚠️ SÉCURITÉ: Ce service utilise UNIQUEMENT public.users (jamais auth.users directement)
 *
 * Les données utilisateur sont synchronisées entre auth.users et public.users via un trigger.
 * Toutes les requêtes côté client doivent utiliser public.users pour respecter les RLS.
 */
class UserService {
  /**
   * Récupérer le profil utilisateur depuis public.users
   *
   * @param userId - ID de l'utilisateur
   * @returns Profil utilisateur ou null si non trouvé
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url, phone, created_at, updated_at')
        .eq('id', userId)
        .single();
      if (error) {
        logger.error('User', 'Erreur récupération profil:', error);
        return null;
      }
      return data;
    } catch (error) {
      logger.error('User', 'Exception récupération profil:', error);
      return null;
    }
  }
  /**
   * Mettre à jour le profil utilisateur
   *
   * @param userId - ID de l'utilisateur
   * @param updates - Champs à mettre à jour
   * @returns Profil mis à jour ou null en cas d'erreur
   */
  async updateProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, 'id' | 'email' | 'created_at' | 'updated_at'>>
  ): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, email, full_name, avatar_url, phone, created_at, updated_at')
        .single();
      if (error) {
        logger.error('User', 'Erreur mise à jour profil:', error);
        throw error;
      }
      return data;
    } catch (error) {
      logger.error('User', 'Exception mise à jour profil:', error);
      throw error;
    }
  }
  /**
   * Récupérer plusieurs utilisateurs par leurs IDs
   * Utile pour afficher les noms dans les listes (créateurs, assignés, etc.)
   *
   * @param userIds - Liste des IDs utilisateurs
   * @returns Liste des profils utilisateurs
   */
  async getUsers(userIds: string[]): Promise<UserProfile[]> {
    if (userIds.length === 0) return [];
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url, phone, created_at, updated_at')
        .in('id', userIds);
      if (error) {
        logger.error('User', 'Erreur récupération utilisateurs:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      logger.error('User', 'Exception récupération utilisateurs:', error);
      return [];
    }
  }
  /**
   * Récupérer un utilisateur par son email
   *
   * @param email - Email de l'utilisateur
   * @returns Profil utilisateur ou null si non trouvé
   */
  async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url, phone, created_at, updated_at')
        .eq('email', email)
        .single();
      if (error) {
        logger.error('User', 'Erreur recherche utilisateur par email:', error);
        return null;
      }
      return data;
    } catch (error) {
      logger.error('User', 'Exception recherche utilisateur par email:', error);
      return null;
    }
  }
  /**
   * Vérifier si un utilisateur existe
   *
   * @param userId - ID de l'utilisateur
   * @returns true si l'utilisateur existe, false sinon
   */
  async userExists(userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('id', userId);
      if (error) {
        logger.error('User', 'Erreur vérification existence utilisateur:', error);
        return false;
      }
      return (count || 0) > 0;
    } catch (error) {
      logger.error('User', 'Exception vérification existence utilisateur:', error);
      return false;
    }
  }
  /**
   * Récupérer les informations minimales pour l'affichage (nom + avatar)
   * Optimisé pour les listes et les badges utilisateur
   *
   * @param userIds - Liste des IDs utilisateurs
   * @returns Objets avec id, nom et avatar
   */
  async getUsersMinimal(userIds: string[]): Promise<Array<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  }>> {
    if (userIds.length === 0) return [];
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, avatar_url')
        .in('id', userIds);
      if (error) {
        logger.error('User', 'Erreur récupération utilisateurs minimaux:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      logger.error('User', 'Exception récupération utilisateurs minimaux:', error);
      return [];
    }
  }
}
// Export d'une instance singleton
export const userService = new UserService();
// Export de la classe pour les tests
export default UserService;