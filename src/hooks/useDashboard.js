import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';

export function useDashboard() {
  const [stats, setStats] = useState([]);
  const [activity, setActivity] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, activityData, healthData] = await Promise.allSettled([
        dashboardService.getStats(),
        dashboardService.getRecentActivity(),
        dashboardService.getHealthStatus(),
      ]);

      setStats(statsData.status === 'fulfilled' ? statsData.value : []);
      setActivity(activityData.status === 'fulfilled' ? activityData.value : []);
      setHealth(healthData.status === 'fulfilled' ? healthData.value : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Poll health every 30 seconds
    const interval = setInterval(async () => {
      const healthData = await dashboardService.getHealthStatus();
      setHealth(healthData);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { stats, activity, health, loading, refresh: fetchAll };
}
