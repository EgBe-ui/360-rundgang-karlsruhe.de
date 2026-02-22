import { useState, useEffect, useCallback } from 'preact/hooks';
import { supabase } from '../lib/supabase.js';

export function useCompanies({ search = '', industry = null } = {}) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('companies')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (industry) query = query.eq('industry', industry);
    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (!error) setCompanies(data || []);
    setLoading(false);
  }, [search, industry]);

  useEffect(() => { fetch(); }, [fetch]);

  return { companies, loading, refetch: fetch };
}

export function useCompany(id) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    setCompany(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const update = useCallback(async (updates) => {
    const { error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id);
    if (!error) await fetch();
    return { error };
  }, [id, fetch]);

  return { company, loading, refetch: fetch, update };
}

export async function createCompany(data) {
  const { data: user } = await supabase.auth.getUser();
  return supabase
    .from('companies')
    .insert({ ...data, owner_id: user.user.id })
    .select()
    .single();
}
