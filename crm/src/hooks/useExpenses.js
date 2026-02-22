import { useState, useEffect, useCallback } from 'preact/hooks';
import { supabase } from '../lib/supabase.js';

export function useExpenses({ month = null, year = null, category = null } = {}) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('expenses')
      .select('*')
      .is('deleted_at', null)
      .order('date', { ascending: false });

    if (year) {
      query = query
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`);
    }
    if (month) {
      const m = String(month).padStart(2, '0');
      const y = year || new Date().getFullYear();
      query = query
        .gte('date', `${y}-${m}-01`)
        .lte('date', `${y}-${m}-31`);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (!error) setExpenses(data || []);
    setLoading(false);
  }, [month, year, category]);

  useEffect(() => { fetch(); }, [fetch]);

  return { expenses, loading, refetch: fetch };
}

export function useExpense(id) {
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();
    setExpense(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { expense, loading, refetch: fetch };
}

export async function createExpense(expenseData) {
  const { data: user } = await supabase.auth.getUser();
  const ownerId = user.user.id;

  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...expenseData, owner_id: ownerId })
    .select()
    .single();

  return { data, error };
}

export async function updateExpense(id, updates) {
  const { error } = await supabase
    .from('expenses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  return { error };
}

export async function deleteExpense(id) {
  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  return { error };
}
