import { useState, useEffect, useCallback } from 'preact/hooks';
import { supabase } from '../lib/supabase.js';

export function useActivities({ contactId = null, dealId = null, companyId = null, limit = 50 } = {}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (contactId) query = query.eq('contact_id', contactId);
    if (dealId) query = query.eq('deal_id', dealId);
    if (companyId) query = query.eq('company_id', companyId);

    const { data, error } = await query;
    if (!error) setActivities(data || []);
    setLoading(false);
  }, [contactId, dealId, companyId, limit]);

  useEffect(() => { fetch(); }, [fetch]);

  return { activities, loading, refetch: fetch };
}

export async function createActivity(data) {
  const { data: user } = await supabase.auth.getUser();
  return supabase
    .from('activities')
    .insert({ ...data, owner_id: user.user.id })
    .select()
    .single();
}

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('activities')
      .select(`
        *,
        contact:contacts(id, first_name, last_name),
        deal:deals(id, title)
      `)
      .eq('type', 'task')
      .eq('completed', false)
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true });

    setTasks(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const complete = useCallback(async (taskId) => {
    const { error } = await supabase
      .from('activities')
      .update({ completed: true })
      .eq('id', taskId);
    if (!error) await fetch();
    return { error };
  }, [fetch]);

  return { tasks, loading, refetch: fetch, complete };
}
