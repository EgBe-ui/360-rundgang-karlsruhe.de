import { useState, useEffect, useCallback } from 'preact/hooks';
import { supabase } from '../lib/supabase.js';

export function useDashboard() {
  const [stats, setStats] = useState({
    totalContacts: 0,
    newLeadsThisMonth: 0,
    pipelineValue: 0,
    wonDeals: 0,
    conversionRate: 0,
    dealsByStage: {},
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      { count: totalContacts },
      { count: newLeadsThisMonth },
      { data: activeDeals },
      { data: wonDeals },
      { data: allDeals },
      { data: activities },
    ] = await Promise.all([
      supabase.from('contacts').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('contacts').select('*', { count: 'exact', head: true }).is('deleted_at', null).gte('created_at', monthStart),
      supabase.from('deals').select('value, stage').is('deleted_at', null).not('stage', 'in', '("won","lost")'),
      supabase.from('deals').select('value').is('deleted_at', null).eq('stage', 'won'),
      supabase.from('deals').select('stage').is('deleted_at', null),
      supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    const pipelineValue = (activeDeals || []).reduce((sum, d) => sum + (d.value || 0), 0);
    const wonCount = (wonDeals || []).length;
    const totalDeals = (allDeals || []).length;
    const conversionRate = totalDeals > 0 ? Math.round((wonCount / totalDeals) * 100) : 0;

    const dealsByStage = {};
    for (const d of (allDeals || [])) {
      dealsByStage[d.stage] = (dealsByStage[d.stage] || 0) + 1;
    }

    setStats({
      totalContacts: totalContacts || 0,
      newLeadsThisMonth: newLeadsThisMonth || 0,
      pipelineValue,
      wonDeals: wonCount,
      conversionRate,
      dealsByStage,
    });
    setRecentActivities(activities || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, recentActivities, loading, refetch: fetch };
}
