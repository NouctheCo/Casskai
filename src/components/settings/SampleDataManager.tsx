import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SampleDataService } from '@/services/sampleData/SampleDataService';

interface SampleDataManagerProps {
  companyId: string;
  chartOfAccountsConfig: {
    country: string;
    standard: 'PCG' | 'SYSCOHADA' | 'IFRS' | 'US_GAAP';
    currency: string;
    fiscalYearEnd: string;
  };
}

export const SampleDataManager: React.FC<SampleDataManagerProps> = ({
  companyId,
  chartOfAccountsConfig
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showSampleDataConfig, setShowSampleDataConfig] = useState(false);
  const [lastOperation, setLastOperation] = useState<{
    type: 'generate' | 'reset';
    success: boolean;
    results?: any;
    error?: string;
  } | null>(null);

  const [sampleDataConfig, setSampleDataConfig] = useState({
    includeTransactions: true,
    includeCustomers: true,
    includeSuppliers: true,
    includeProducts: true,
    transactionCount: 50,
    dateRange: {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    }
  });

  const handleGenerateSampleData = async () => {
    setIsLoading(true);
    setLastOperation(null);

    try {
      const service = new SampleDataService(companyId);
      const result = await service.generateSampleData(chartOfAccountsConfig, sampleDataConfig);

      setLastOperation({
        type: 'generate',
        success: result.success,
        results: result.results,
        error: result.error
      });

      setShowSampleDataConfig(false);
    } catch (error) {
      setLastOperation({
        type: 'generate',
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetData = async () => {
    setIsLoading(true);
    setLastOperation(null);

    try {
      const service = new SampleDataService(companyId);
      const result = await service.resetSampleData();

      setLastOperation({
        type: 'reset',
        success: result.success,
        error: result.error
      });

      setShowConfirmReset(false);
    } catch (error) {
      setLastOperation({
        type: 'reset',
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="text-blue-600" size={24} />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Gestion des Données d'Exemple
          </h3>
          <p className="text-sm text-gray-600">
            Initialisez votre application avec des données de démonstration ou remettez à zéro
          </p>
        </div>
      </div>

      {/* Configuration du plan comptable */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Configuration Actuelle</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Pays:</span> {chartOfAccountsConfig.country}
              </div>
              <div>
                <span className="text-blue-700 font-medium">Standard:</span> {chartOfAccountsConfig.standard}
              </div>
              <div>
                <span className="text-blue-700 font-medium">Devise:</span> {chartOfAccountsConfig.currency}
              </div>
              <div>
                <span className="text-blue-700 font-medium">Exercice se terminant:</span> {chartOfAccountsConfig.fiscalYearEnd}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setShowSampleDataConfig(true)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={20} />
          Générer Données d'Exemple
          {isLoading && <RefreshCw size={16} className="animate-spin" />}
        </button>

        <button
          onClick={() => setShowConfirmReset(true)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 size={20} />
          Supprimer Toutes les Données
          {isLoading && <RefreshCw size={16} className="animate-spin" />}
        </button>
      </div>

      {/* Résultat de la dernière opération */}
      {lastOperation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg p-4 mb-6 ${
            lastOperation.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {lastOperation.success ? (
              <CheckCircle className="text-green-600 mt-0.5" size={20} />
            ) : (
              <AlertTriangle className="text-red-600 mt-0.5" size={20} />
            )}
            <div>
              <h4 className={`font-medium mb-2 ${
                lastOperation.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {lastOperation.type === 'generate' ? 'Génération' : 'Suppression'} {
                  lastOperation.success ? 'réussie' : 'échouée'
                }
              </h4>

              {lastOperation.success && lastOperation.results && (
                <div className="text-sm text-green-700 space-y-1">
                  <p>• {lastOperation.results.accounts} comptes créés</p>
                  <p>• {lastOperation.results.customers} clients créés</p>
                  <p>• {lastOperation.results.suppliers} fournisseurs créés</p>
                  <p>• {lastOperation.results.products} produits/services créés</p>
                  <p>• {lastOperation.results.transactions} transactions créées</p>
                </div>
              )}

              {!lastOperation.success && lastOperation.error && (
                <p className="text-sm text-red-700">{lastOperation.error}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal de configuration des données d'exemple */}
      {showSampleDataConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="text-blue-600" size={24} />
                <h3 className="text-lg font-semibold">Configuration des Données d'Exemple</h3>
              </div>

              <div className="space-y-6">
                {/* Types de données à inclure */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Types de données à inclure</h4>
                  <div className="space-y-2">
                    {[
                      { key: 'includeCustomers', label: 'Clients d\'exemple' },
                      { key: 'includeSuppliers', label: 'Fournisseurs d\'exemple' },
                      { key: 'includeProducts', label: 'Produits/Services d\'exemple' },
                      { key: 'includeTransactions', label: 'Écritures comptables d\'exemple' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sampleDataConfig[key as keyof typeof sampleDataConfig] as boolean}
                          onChange={(e) => setSampleDataConfig(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Nombre de transactions */}
                {sampleDataConfig.includeTransactions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre d'écritures comptables (max: 100)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={sampleDataConfig.transactionCount}
                      onChange={(e) => setSampleDataConfig(prev => ({
                        ...prev,
                        transactionCount: Math.min(100, Math.max(10, parseInt(e.target.value) || 10))
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Période des données */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Période des données</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de début
                      </label>
                      <input
                        type="date"
                        value={sampleDataConfig.dateRange.start}
                        onChange={(e) => setSampleDataConfig(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, start: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de fin
                      </label>
                      <input
                        type="date"
                        value={sampleDataConfig.dateRange.end}
                        onChange={(e) => setSampleDataConfig(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowSampleDataConfig(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={handleGenerateSampleData}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Génération...' : 'Générer les Données'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-red-600" size={24} />
                <h3 className="text-lg font-semibold text-red-900">Confirmer la Suppression</h3>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Cette action va supprimer <strong>toutes les données</strong> de votre entreprise :
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Toutes les écritures comptables</li>
                  <li>• Toutes les factures</li>
                  <li>• Tous les clients et fournisseurs</li>
                  <li>• Tous les produits et services</li>
                  <li>• Tout le plan comptable</li>
                </ul>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Attention:</strong> Cette action est irréversible. Vos paramètres d'entreprise et de compte seront préservés.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={handleResetData}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Suppression...' : 'Confirmer la Suppression'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};