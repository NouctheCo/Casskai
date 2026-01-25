import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { kpiCacheService } from '@/services/kpiCacheService';

const KpiCacheDebug: React.FC = () => {
  const { currentCompany } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(currentCompany?.id || null);
  const [cache, setCache] = useState<any | null>(null);
  const [server, setServer] = useState<any | null>(null);
  const [loadingServer, setLoadingServer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCompanyId(currentCompany?.id || null);
  }, [currentCompany]);

  const fetchCache = () => {
    try {
      if (!companyId) {
        setError('No companyId provided');
        setCache(null);
        return;
      }
      const data = kpiCacheService.getCache(companyId);
      setCache(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || String(err));
      setCache(null);
    }
  };

  const fetchServerKpis = async () => {
    try {
      if (!companyId) {
        setError('No companyId provided');
        setServer(null);
        return;
      }
      setLoadingServer(true);
      const res = await fetch(`/api/dev/kpis?companyId=${encodeURIComponent(companyId)}`);
      const data = await res.json();
      setServer(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || String(err));
      setServer(null);
    } finally {
      setLoadingServer(false);
    }
  };

  const clearServerCache = async () => {
    try {
      if (!companyId) return;
      await fetch('/api/dev/kpis/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });
      // invalidate local server state
      setServer(null);
    } catch (_e) {
      // ignore
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Debug KPI Cache (dev only)</h2>
      <div className="mb-3">
        <label className="block text-sm text-gray-700">Company ID</label>
        <input
          className="mt-1 p-2 border rounded w-full"
          value={companyId || ''}
          onChange={(e) => setCompanyId(e.target.value || null)}
          placeholder="company id"
        />
      </div>
      <div className="flex gap-2 mb-4">
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded"
          onClick={fetchCache}
        >
          Fetch Cache
        </button>
        <button
          className="px-3 py-2 bg-green-600 text-white rounded"
          onClick={fetchServerKpis}
        >
          {loadingServer ? 'Loading…' : 'Fetch Recomputed KPIs'}
        </button>
        <button
          className="px-3 py-2 bg-yellow-400 rounded"
          onClick={clearServerCache}
        >
          Clear Server Cache
        </button>
        <button
          className="px-3 py-2 bg-gray-200 rounded"
          onClick={() => { setCache(null); setError(null); }}
        >
          Clear
        </button>
      </div>

      {error && (
        <div className="mb-4 text-red-600">Error: {error}</div>
      )}

      <div>
        <h3 className="font-medium mb-2">Cache</h3>
        <pre className="bg-black text-white p-3 rounded max-h-96 overflow-auto">
          {JSON.stringify(cache, null, 2)}
        </pre>
      </div>

      <div className="mt-4">
        <h3 className="font-medium mb-2">Recomputed (server)</h3>
        <pre className="bg-gray-900 text-white p-3 rounded max-h-96 overflow-auto">
          {JSON.stringify(server, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default KpiCacheDebug;
