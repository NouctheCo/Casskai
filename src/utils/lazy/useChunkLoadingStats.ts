import { useState, useEffect } from 'react';

// Hook pour les statistiques de performance
export const useChunkLoadingStats = () => {
  const [stats, setStats] = useState({
    totalChunks: 0,
    loadedChunks: 0,
    failedChunks: 0,
    averageLoadTime: 0
  });

  useEffect(() => {
    // Vérifier si webpack est disponible
    const w = typeof window !== 'undefined' ? (window as unknown as { __webpack_require__?: { e: (chunkId: string) => Promise<unknown> }}) : undefined;
    if (!w || !w.__webpack_require__?.e) {
      return;
    }

    const originalMethod = w.__webpack_require__.e;
    const loadTimes: number[] = [];

    w.__webpack_require__.e = function(chunkId: string) {
      const startTime = performance.now();
      
      return originalMethod.call(this, chunkId)
        .then((result: unknown) => {
          const loadTime = performance.now() - startTime;
          loadTimes.push(loadTime);
          
          setStats(prev => ({
            ...prev,
            totalChunks: prev.totalChunks + 1,
            loadedChunks: prev.loadedChunks + 1,
            averageLoadTime: loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
          }));
          
          return result;
        })
        .catch((error: Error) => {
          setStats(prev => ({
            ...prev,
            totalChunks: prev.totalChunks + 1,
            failedChunks: prev.failedChunks + 1
          }));
          throw error;
        });
    };

    return () => {
      if (w && w.__webpack_require__) {
        w.__webpack_require__.e = originalMethod;
      }
    };
  }, []);

  return stats;
};
