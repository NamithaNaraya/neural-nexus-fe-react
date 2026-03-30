import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import { readCache } from '../utils/cache';

const CACHE_KEYS = {
  stats: 'nnv2:dashboard:stats',
  activity: 'nnv2:dashboard:activity:5',
  health: 'nnv2:dashboard:health',
};

export function useDashboard() {
  const [stats, setStats] = useState(() => readCache(CACHE_KEYS.stats) || []);
  const [activity, setActivity] = useState(() => readCache(CACHE_KEYS.activity) || []);
  const [health, setHealth] = useState(() => readCache(CACHE_KEYS.health) || null);
  const [loading, setLoading] = useState(!readCache(CACHE_KEYS.stats) && !readCache(CACHE_KEYS.activity));
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async ({ force = false } = {}) => {
    if (force) setLoading(true);

    try {
      const [statsData, activityData, healthData] = await Promise.allSettled([
        dashboardService.getStats({ force }),
        dashboardService.getRecentActivity(5, { force }),
        dashboardService.getHealthStatus({ force }),
      ]);

      setStats(statsData.status === 'fulfilled' ? statsData.value : []);
      setActivity(activityData.status === 'fulfilled' ? activityData.value : []);
      setHealth(healthData.status === 'fulfilled' ? healthData.value : null);
      setLastUpdated(Date.now());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!readCache(CACHE_KEYS.stats) || !readCache(CACHE_KEYS.activity)) {
      fetchAll();
    } else {
      setLoading(false);
      void fetchAll({ force: false });
    }

    const interval = setInterval(async () => {
      const healthData = await dashboardService.getHealthStatus();
      setHealth(healthData);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAll]);

  return {
    stats,
    activity,
    health,
    loading,
    lastUpdated,
    refresh: () => fetchAll({ force: true }),
  };
}
