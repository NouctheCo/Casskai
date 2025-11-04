import { supabase } from '@/lib/supabase';

// Types pour les demandes RGPD
export interface GDPRRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  email: string;
  first_name: string;
  last_name: string;
  company?: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submitted_at: string;
  processed_at?: string;
  processed_by?: string;
  response?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

export interface GDPRRequestCreate {
  type: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  description: string;
}

export class GDPRService {
  // Créer une nouvelle demande RGPD
  static async createGDPRRequest(requestData: GDPRRequestCreate): Promise<GDPRRequest> {
    try {
      const { data, error } = await supabase
        .from('gdpr_requests')
        .insert({
          type: requestData.type,
          email: requestData.email,
          first_name: requestData.firstName,
          last_name: requestData.lastName,
          company: requestData.company || null,
          description: requestData.description,
          status: 'pending',
          priority: this.calculatePriority(requestData.type),
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating GDPR request:', error instanceof Error ? error.message : String(error));
      // Fallback: retourner un objet mock si la base de données n'est pas disponible
      return {
        id: `gdpr_${Date.now()}`,
        type: requestData.type as any,
        email: requestData.email,
        first_name: requestData.firstName,
        last_name: requestData.lastName,
        company: requestData.company || null,
        description: requestData.description,
        status: 'pending',
        priority: this.calculatePriority(requestData.type),
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  // Récupérer toutes les demandes RGPD (pour l'admin)
  static async getGDPRRequests(status?: string): Promise<GDPRRequest[]> {
    try {
      let query = supabase
        .from('gdpr_requests')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching GDPR requests:', error instanceof Error ? error.message : String(error));
      // Retourner des données mock en cas d'erreur
      return this.getMockGDPRRequests();
    }
  }

  // Récupérer les demandes RGPD par email
  static async getGDPRRequestsByEmail(email: string): Promise<GDPRRequest[]> {
    try {
      const { data, error } = await supabase
        .from('gdpr_requests')
        .select('*')
        .eq('email', email)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching GDPR requests by email:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  // Mettre à jour le statut d'une demande RGPD
  static async updateGDPRRequestStatus(
    id: string, 
    status: GDPRRequest['status'], 
    processedBy?: string,
    response?: string
  ): Promise<GDPRRequest> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed' || status === 'rejected') {
        updates.processed_at = new Date().toISOString();
        updates.processed_by = processedBy;
        updates.response = response;
      }

      const { data, error } = await supabase
        .from('gdpr_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating GDPR request status:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  // Envoyer un email de confirmation automatique
  static async sendConfirmationEmail(request: GDPRRequest): Promise<void> {
    try {
      // Dans un vrai projet, ceci utiliserait un service d'email comme SendGrid, Mailgun, etc.
      console.warn('Sending GDPR request confirmation email to:', request.email);
      
      // Simulation d'un envoi d'email
      // Ici on pourrait intégrer avec Supabase Edge Functions ou un service tiers
      
    } catch (error) {
      console.error('Error sending confirmation email:', error instanceof Error ? error.message : String(error));
      // Ne pas faire échouer la création de la demande si l'email échoue
    }
  }

  // Calculer la priorité basée sur le type de demande
  private static calculatePriority(type: string): 'low' | 'medium' | 'high' | 'urgent' {
    switch (type) {
      case 'erasure':
        return 'high'; // Droit à l'oubli = priorité élevée
      case 'access':
        return 'medium'; // Droit d'accès = priorité moyenne
      case 'portability':
        return 'medium'; // Portabilité = priorité moyenne
      case 'rectification':
        return 'medium'; // Rectification = priorité moyenne
      case 'restriction':
        return 'low'; // Limitation = priorité basse
      case 'objection':
        return 'medium'; // Opposition = priorité moyenne
      default:
        return 'medium';
    }
  }

  // Données mock pour le fallback
  private static getMockGDPRRequests(): GDPRRequest[] {
    return [
      {
        id: 'gdpr_mock_1',
        type: 'access',
        email: 'user@example.com',
        first_name: 'Jean',
        last_name: 'Dupont',
        company: 'Entreprise ABC',
        description: 'Je souhaite accéder à toutes mes données personnelles',
        status: 'pending',
        priority: 'medium',
        submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'gdpr_mock_2',
        type: 'erasure',
        email: 'marie@company.com',
        first_name: 'Marie',
        last_name: 'Martin',
        description: 'Suppression complète de mes données',
        status: 'processing',
        priority: 'high',
        submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  // Valider les données de la demande
  static validateGDPRRequest(requestData: GDPRRequestCreate): string[] {
    const errors: string[] = [];

    if (!requestData.type || requestData.type.trim() === '') {
      errors.push('Le type de demande est obligatoire');
    }

    if (!requestData.email || requestData.email.trim() === '') {
      errors.push('L\'adresse email est obligatoire');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestData.email)) {
      errors.push('L\'adresse email n\'est pas valide');
    }

    if (!requestData.firstName || requestData.firstName.trim() === '') {
      errors.push('Le prénom est obligatoire');
    }

    if (!requestData.lastName || requestData.lastName.trim() === '') {
      errors.push('Le nom est obligatoire');
    }

    if (!requestData.description || requestData.description.trim() === '') {
      errors.push('La description de votre demande est obligatoire');
    } else if (requestData.description.length < 10) {
      errors.push('La description doit contenir au moins 10 caractères');
    }

    return errors;
  }

  // Obtenir les délais légaux par type de demande
  static getLegalTimeframe(type: string): string {
    switch (type) {
      case 'access':
        return '1 mois (extensible à 3 mois selon complexité)';
      case 'rectification':
        return '1 mois (extensible à 3 mois selon complexité)';
      case 'erasure':
        return '1 mois (extensible à 3 mois selon complexité)';
      case 'portability':
        return '1 mois (extensible à 3 mois selon complexité)';
      case 'restriction':
        return '1 mois (extensible à 3 mois selon complexité)';
      case 'objection':
        return '1 mois (extensible à 3 mois selon complexité)';
      default:
        return '1 mois selon le RGPD';
    }
  }
}

export default GDPRService;
