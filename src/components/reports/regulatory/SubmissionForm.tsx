/**
 * Formulaire pour soumettre un document à une autorité fiscale
 */

import { useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TaxAuthorityService } from '@/services/taxAuthorityService';
import { SubmissionValidator, FormatterUtils } from '@/utils/taxAuthorityUtils';
import { TAX_AUTHORITIES } from '@/constants/taxAuthorities';
import { COUNTRY_DOCUMENTS, getCountryDocuments } from '@/constants/countryDocuments';

interface SubmissionFormProps {
  companyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function SubmissionForm({ companyId, onClose, onSuccess }: SubmissionFormProps) {
  const [formData, setFormData] = useState<{
    documentId: string;
    authorityId: string;
    country: string;
    submissionMethod: 'API' | 'MANUAL';
    file: File | null;
  }>({
    documentId: '',
    authorityId: '',
    country: '',
    submissionMethod: 'API',
    file: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<any[]>([]);
  const [authorities, setAuthorities] = useState<any[]>([]);

  // Charger les documents
  const handleCountryChange = async (country: string) => {
    setFormData({ ...formData, country, authorityId: '' });

    if (country) {
      // Récupérer les documents du pays
      const { data } = await supabase
        .from('regulatory_documents')
        .select('id, document_type, fiscal_year, fiscal_period')
        .eq('company_id', companyId)
        .eq('country_code', country);

      setDocuments(data || []);

      // Obtenir les autorités du pays
      const countryAuthorities = TAX_AUTHORITIES[country] || [];
      setAuthorities(countryAuthorities);
    }
  };

  // Obtenir les documents d'un pays pour les propositions
  const getAvailableDocuments = () => {
    const countryData = getCountryDocuments(formData.country);
    if (!countryData) return [];

    const docs: any[] = [];
    Object.entries(countryData.documents).forEach(([category, categoryData]) => {
      categoryData.documents.forEach((doc: any) => {
        docs.push({
          id: doc.id,
          name: `[${categoryData.category}] ${doc.name}`,
          frequency: doc.frequency,
        });
      });
    });
    return docs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.documentId) {
      setErrors(prev => ({ ...prev, documentId: 'Document requis' }));
      return;
    }
    if (!formData.authorityId) {
      setErrors(prev => ({ ...prev, authorityId: 'Autorité requise' }));
      return;
    }

    if (formData.submissionMethod !== 'MANUAL' && !formData.file) {
      setErrors(prev => ({ ...prev, file: 'Fichier requis' }));
      return;
    }

    setLoading(true);

    try {
      // Récupérer les credentials
      const credentials = await TaxAuthorityService.getCredentials(companyId, formData.authorityId);

      if (!credentials) {
        setErrors(prev => ({ ...prev, form: 'Identifiants non configurés pour cette autorité' }));
        setLoading(false);
        return;
      }

      // Soumettre le document
      const response = await TaxAuthorityService.submitDocument({
        document_id: formData.documentId,
        authority_id: formData.authorityId,
        credentials_id: credentials.id,
        submission_method: formData.submissionMethod,
        file_data: formData.file || undefined,
        file_format: formData.file?.type || 'PDF',
      });

      if (response.success) {
        alert('Document soumis avec succès !');
        onSuccess();
      } else {
        setErrors(prev => ({ ...prev, form: response.error || response.message }));
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        form: error instanceof Error ? error.message : 'Erreur lors de la soumission',
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold dark:text-white">Nouvelle soumission</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Erreur générale */}
          {errors.form && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-400">{errors.form}</p>
            </div>
          )}

          {/* Pays */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pays
            </label>
            <select
              value={formData.country}
              onChange={e => handleCountryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Sélectionner un pays</option>
              {Object.keys(COUNTRY_DOCUMENTS).map(country => {
                const countryData = COUNTRY_DOCUMENTS[country as keyof typeof COUNTRY_DOCUMENTS];
                return (
                  <option key={country} value={country}>
                    {countryData.flag} {countryData.name} ({countryData.standard})
                  </option>
                );
              })}
            </select>
            {errors.country && <p className="text-sm text-red-600 mt-1">{errors.country}</p>}
          </div>

          {/* Document */}
          {documents.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Document
              </label>
              <select
                value={formData.documentId}
                onChange={e => setFormData({ ...formData, documentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner un document</option>
                {documents.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.document_type} - {doc.fiscal_year} ({doc.fiscal_period})
                  </option>
                ))}
              </select>
              {errors.documentId && <p className="text-sm text-red-600 mt-1">{errors.documentId}</p>}
            </div>
          )}

          {/* Autorité */}
          {authorities.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Autorité fiscale
              </label>
              <select
                value={formData.authorityId}
                onChange={e => setFormData({ ...formData, authorityId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner une autorité</option>
                {authorities.map(authority => (
                  <option key={authority.id} value={authority.id}>
                    {authority.authority_name}
                  </option>
                ))}
              </select>
              {errors.authorityId && <p className="text-sm text-red-600 mt-1">{errors.authorityId}</p>}
            </div>
          )}

          {/* Méthode de soumission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Méthode de soumission
            </label>
            <div className="space-y-2">
              {['API', 'SFTP', 'WEB_PORTAL', 'MANUAL'].map(method => (
                <label key={method} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="submissionMethod"
                    value={method}
                    checked={formData.submissionMethod === method}
                    onChange={e => setFormData({ ...formData, submissionMethod: e.target.value as any })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{method}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Fichier */}
          {formData.submissionMethod !== 'MANUAL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fichier
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <label className="flex flex-col items-center cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cliquez ou glissez un fichier</span>
                  <input
                    type="file"
                    onChange={e => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    className="hidden"
                  />
                </label>
                {formData.file && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {formData.file.name} ({FormatterUtils.formatFileSize(formData.file.size)})
                  </p>
                )}
              </div>
              {errors.file && <p className="text-sm text-red-600 mt-1">{errors.file}</p>}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Soumettre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
