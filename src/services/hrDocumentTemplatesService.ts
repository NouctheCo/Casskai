/**
 * Service pour la gestion des templates de documents RH et génération automatique
 */

import { supabase } from '@/lib/supabase';
import type {
  DocumentTemplate,
  DocumentTemplateFormData,
  GeneratedDocument,
  GenerateDocumentRequest,
  DocumentArchive,
  ArchiveStats,
  DocumentPreview,
  TemplateVariable
} from '@/types/hr-document-templates.types';

export class HRDocumentTemplatesService {
  // =====================================================
  // TEMPLATES
  // =====================================================

  async getTemplates(companyId: string, filters?: { category?: string; template_type?: string; is_active?: boolean }) {
    try {
      let query = supabase
        .from('hr_document_templates')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.template_type) query = query.eq('template_type', filters.template_type);
      if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching templates:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getTemplateById(templateId: string) {
    try {
      const { data, error } = await supabase
        .from('hr_document_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createTemplate(companyId: string, formData: DocumentTemplateFormData) {
    try {
      const { data, error } = await supabase
        .from('hr_document_templates')
        .insert({
          company_id: companyId,
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          template_type: formData.template_type,
          content: formData.content,
          variables: formData.variables || [],
          is_active: formData.is_active !== undefined ? formData.is_active : true,
          is_default: formData.is_default || false,
          requires_signature: formData.requires_signature || false,
          auto_archive: formData.auto_archive !== undefined ? formData.auto_archive : true,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateTemplate(templateId: string, updates: Partial<DocumentTemplateFormData>) {
    try {
      const { data, error } = await supabase
        .from('hr_document_templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteTemplate(templateId: string) {
    try {
      const { error } = await supabase
        .from('hr_document_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // =====================================================
  // DOCUMENT GENERATION
  // =====================================================

  /**
   * Remplace les variables dans le contenu du template
   */
  replaceVariables(content: string, variables: Record<string, any>): string {
    let result = content;

    // Remplacer toutes les variables {{variable_name}}
    Object.keys(variables).forEach(key => {
      const value = variables[key];
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');

      // Formater la valeur selon son type
      let formattedValue = value;

      if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
        // Format date: DD/MM/YYYY
        const date = value instanceof Date ? value : new Date(value);
        formattedValue = date.toLocaleDateString('fr-FR');
      } else if (typeof value === 'number' && key.toLowerCase().includes('salary')) {
        // Format currency
        formattedValue = `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
      } else if (value === null || value === undefined) {
        formattedValue = '';
      }

      result = result.replace(regex, formattedValue.toString());
    });

    // Remplacer les variables non trouvées par une chaîne vide
    result = result.replace(/{{\\s*[^}]+\\s*}}/g, '');

    return result;
  }

  /**
   * Prévisualiser un document avec les variables
   */
  async previewDocument(templateId: string, variables: Record<string, any>): Promise<{ success: boolean; data?: DocumentPreview; error?: string }> {
    try {
      const templateResult = await this.getTemplateById(templateId);
      if (!templateResult.success || !templateResult.data) {
        throw new Error('Template not found');
      }

      const template = templateResult.data;
      const html = this.replaceVariables(template.content, variables);

      // Extraire les variables utilisées
      const variablesUsed = template.variables.map((v: TemplateVariable) => v.name);

      // Trouver les variables manquantes
      const providedVars = Object.keys(variables);
      const requiredVars = template.variables
        .filter((v: TemplateVariable) => v.required)
        .map((v: TemplateVariable) => v.name);
      const missingVariables = requiredVars.filter(v => !providedVars.includes(v));

      return {
        success: true,
        data: {
          html,
          variables_used: variablesUsed,
          missing_variables: missingVariables
        }
      };
    } catch (error) {
      console.error('Error previewing document:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Générer un document à partir d'un template
   */
  async generateDocument(companyId: string, request: GenerateDocumentRequest) {
    try {
      const templateResult = await this.getTemplateById(request.template_id);
      if (!templateResult.success || !templateResult.data) {
        throw new Error('Template not found');
      }

      const template = templateResult.data as DocumentTemplate;

      // Valider les variables requises
      const requiredVars = template.variables.filter(v => v.required).map(v => v.name);
      const missingVars = requiredVars.filter(v => !(v in request.variables_data));
      if (missingVars.length > 0) {
        throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
      }

      // Générer le contenu
      const generatedContent = this.replaceVariables(template.content, request.variables_data);

      // Générer le nom du document
      const documentName = request.document_name ||
        `${template.name} - ${request.variables_data.employee_full_name || request.variables_data.employee_last_name} - ${new Date().toLocaleDateString('fr-FR')}`;

      // Insérer le document généré
      const { data, error } = await supabase
        .from('hr_generated_documents')
        .insert({
          company_id: companyId,
          template_id: request.template_id,
          employee_id: request.employee_id,
          document_name: documentName,
          document_type: template.template_type,
          generated_content: generatedContent,
          variables_data: request.variables_data,
          status: request.auto_send ? 'sent' : 'generated',
          requires_signature: template.requires_signature,
          generated_by: (await supabase.auth.getUser()).data.user?.id,
          sent_date: request.auto_send ? new Date().toISOString() : null
        })
        .select(`
          *,
          employee:hr_employees!employee_id(first_name, last_name)
        `)
        .single();

      if (error) throw error;

      const result = {
        ...data,
        employee_name: data.employee ? `${data.employee.first_name} ${data.employee.last_name}` : undefined
      };

      return { success: true, data: result };
    } catch (error) {
      console.error('Error generating document:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // =====================================================
  // GENERATED DOCUMENTS
  // =====================================================

  async getGeneratedDocuments(companyId: string, filters?: { employee_id?: string; status?: string; document_type?: string }) {
    try {
      let query = supabase
        .from('hr_generated_documents')
        .select(`
          *,
          employee:hr_employees!employee_id(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('generated_at', { ascending: false });

      if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.document_type) query = query.eq('document_type', filters.document_type);

      const { data, error } = await query;
      if (error) throw error;

      const results = data.map(doc => ({
        ...doc,
        employee_name: doc.employee ? `${doc.employee.first_name} ${doc.employee.last_name}` : undefined
      }));

      return { success: true, data: results };
    } catch (error) {
      console.error('Error fetching generated documents:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateDocumentStatus(documentId: string, status: string) {
    try {
      const updates: any = { status };

      if (status === 'sent') {
        updates.sent_date = new Date().toISOString();
      } else if (status === 'signed') {
        updates.signed_date = new Date().toISOString();
        updates.signature_status = 'signed';
      }

      const { data, error } = await supabase
        .from('hr_generated_documents')
        .update(updates)
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating document status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async signDocument(documentId: string, signatureData: any) {
    try {
      const { data, error } = await supabase
        .from('hr_generated_documents')
        .update({
          status: 'signed',
          signature_status: 'signed',
          signed_date: new Date().toISOString(),
          signed_by: (await supabase.auth.getUser()).data.user?.id,
          signature_data: signatureData
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;

      // Auto-archiver si configuré
      const doc = data as GeneratedDocument;
      if (doc.template_id) {
        const templateResult = await this.getTemplateById(doc.template_id);
        if (templateResult.success && templateResult.data?.auto_archive) {
          await this.archiveDocument(documentId);
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error signing document:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // =====================================================
  // ARCHIVING
  // =====================================================

  async archiveDocument(documentId: string) {
    try {
      const { data, error } = await supabase.rpc('auto_archive_document', {
        doc_id: documentId,
        archived_by_user: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error archiving document:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getArchives(companyId: string, filters?: { employee_id?: string; archive_type?: string }) {
    try {
      let query = supabase
        .from('hr_document_archive')
        .select(`
          *,
          employee:hr_employees!employee_id(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .order('archived_at', { ascending: false });

      if (filters?.employee_id) query = query.eq('employee_id', filters.employee_id);
      if (filters?.archive_type) query = query.eq('archive_type', filters.archive_type);

      const { data, error } = await query;
      if (error) throw error;

      const results = data.map(arc => ({
        ...arc,
        employee_name: arc.employee ? `${arc.employee.first_name} ${arc.employee.last_name}` : undefined
      }));

      return { success: true, data: results };
    } catch (error) {
      console.error('Error fetching archives:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getArchiveStats(companyId: string): Promise<{ success: boolean; data?: ArchiveStats; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('hr_document_archive')
        .select('archive_type, file_size_bytes, retention_until, can_be_destroyed')
        .eq('company_id', companyId);

      if (error) throw error;

      const stats: ArchiveStats = {
        total_documents: data.length,
        by_type: {
          contract: 0,
          amendment: 0,
          letter: 0,
          termination: 0,
          certificate: 0,
          other: 0
        },
        total_size_mb: 0,
        expiring_soon: 0,
        can_be_destroyed: 0
      };

      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      data.forEach((doc: any) => {
        // Count by type
        stats.by_type[doc.archive_type] = (stats.by_type[doc.archive_type] || 0) + 1;

        // Total size
        if (doc.file_size_bytes) {
          stats.total_size_mb += doc.file_size_bytes / (1024 * 1024);
        }

        // Expiring soon
        if (doc.retention_until && new Date(doc.retention_until) < oneYearFromNow) {
          stats.expiring_soon++;
        }

        // Can be destroyed
        if (doc.can_be_destroyed) {
          stats.can_be_destroyed++;
        }
      });

      stats.total_size_mb = Math.round(stats.total_size_mb * 100) / 100;

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching archive stats:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const hrDocumentTemplatesService = new HRDocumentTemplatesService();
