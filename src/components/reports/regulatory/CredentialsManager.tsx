/**
 * Composant pour gérer les identifiants des autorités fiscales
 */
import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { TaxAuthorityCredentials } from '@/types/taxAuthority';
import { supabase } from '@/lib/supabase';
import { TAX_AUTHORITIES } from '@/constants/taxAuthorities';
import { TaxAuthorityService } from '@/services/taxAuthorityService';
import { FormatterUtils } from '@/utils/taxAuthorityUtils';
import { logger } from '@/lib/logger';
interface CredentialsManagerProps {
  companyId: string;
}
export function CredentialsManager({ companyId }: CredentialsManagerProps) {
  const [credentials, setCredentials] = useState<TaxAuthorityCredentials[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    countryCode: '',
    taxId: '',
    apiKey: '',
  });
  const [verifying, setVerifying] = useState<string | null>(null);
  useEffect(() => {
    loadCredentials();
  }, [companyId]);
  const loadCredentials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tax_authority_credentials')
        .select('*')
        .eq('company_id', companyId);
      if (!error) {
        setCredentials(data || []);
      }
    } catch (error) {
      logger.error('CredentialsManager', 'Erreur lors du chargement des identifiants:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleAddCredentials = async () => {
    if (!formData.countryCode || !formData.taxId) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      // Récupérer la première autorité du pays
      const authorities = TAX_AUTHORITIES[formData.countryCode];
      if (!authorities || authorities.length === 0) {
        alert('Autorité fiscale non configurée pour ce pays');
        return;
      }
      const authority = authorities[0];
      // Sauvegarder les identifiants
      const saved = await TaxAuthorityService.saveCredentials(
        companyId,
        authority.id,
        formData.taxId,
        formData.apiKey
      );
      if (saved) {
        setFormData({ countryCode: '', taxId: '', apiKey: '' });
        setShowForm(false);
        await loadCredentials();
      }
    } catch (error) {
      logger.error('CredentialsManager', 'Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des identifiants');
    }
  };
  const handleVerifyCredentials = async (credentialId: string) => {
    setVerifying(credentialId);
    try {
      const credential = credentials.find(c => c.id === credentialId);
      if (!credential) return;
      const response = await TaxAuthorityService.verifyCredentials({
        authority_id: credential.authority_id,
        credentials_id: credentialId,
      });
      if (response.success) {
        alert('Identifiants valides !');
        await loadCredentials();
      } else {
        alert(`Erreur de vérification: ${  response.error}`);
      }
    } catch (error) {
      logger.error('CredentialsManager', 'Erreur lors de la vérification:', error);
      alert('Erreur lors de la vérification');
    } finally {
      setVerifying(null);
    }
  };
  const handleDeleteCredentials = async (credentialId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ces identifiants ?')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('tax_authority_credentials')
        .delete()
        .eq('id', credentialId);
      if (!error) {
        await loadCredentials();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      logger.error('CredentialsManager', 'Erreur lors de la suppression:', error);
    }
  };
  const getAuthorityName = (authorityId: string) => {
    for (const authorities of Object.values(TAX_AUTHORITIES)) {
      const authority = authorities.find(a => a.id === authorityId);
      if (authority) {
        return `${authority.authority_name} (${authority.country_code})`;
      }
    }
    return 'Autorité inconnue';
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Ajouter des identifiants
        </button>
      </div>
      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold dark:text-white mb-4">Ajouter des identifiants</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pays
              </label>
              <select
                value={formData.countryCode}
                onChange={e => setFormData({ ...formData, countryCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner un pays</option>
                {Object.keys(TAX_AUTHORITIES).map(countryCode => (
                  <option key={countryCode} value={countryCode}>
                    {countryCode}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Identifiant fiscal
              </label>
              <input
                type="text"
                value={formData.taxId}
                onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="SIREN, NIF, TIN, etc."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Clé API (optionnel)
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Clé API ou jeton"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddCredentials}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Credentials List */}
      {credentials.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">Aucun identifiant configuré</p>
        </div>
      ) : (
        <div className="space-y-3">
          {credentials.map(credential => (
            <div
              key={credential.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {credential.is_verified ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    )}
                    <h3 className="font-medium dark:text-white">{getAuthorityName(credential.authority_id)}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    ID: {credential.tax_identification_number}
                  </p>
                  {credential.last_verified_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Vérifié le: {FormatterUtils.formatDateTime(credential.last_verified_at)}
                    </p>
                  )}
                  {credential.verification_error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{credential.verification_error}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleVerifyCredentials(credential.id)}
                    disabled={verifying === credential.id}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-5 h-5 ${verifying === credential.id ? 'animate-spin' : ''}`}
                    />
                  </button>
                  <button
                    onClick={() => handleDeleteCredentials(credential.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}