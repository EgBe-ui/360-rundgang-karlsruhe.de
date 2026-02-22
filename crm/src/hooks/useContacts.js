import { useState, useEffect, useCallback } from 'preact/hooks';
import { supabase } from '../lib/supabase.js';

export function useContacts({ search = '', source = null } = {}) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('contacts')
      .select('*, company:companies(id, name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (source) query = query.eq('source', source);
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (!error) setContacts(data || []);
    setLoading(false);
  }, [search, source]);

  useEffect(() => { fetch(); }, [fetch]);

  return { contacts, loading, refetch: fetch };
}

export function useContact(id) {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase
      .from('contacts')
      .select('*, company:companies(id, name)')
      .eq('id', id)
      .single();
    setContact(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const update = useCallback(async (updates) => {
    const { error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id);
    if (!error) await fetch();
    return { error };
  }, [id, fetch]);

  const softDelete = useCallback(async () => {
    return supabase
      .from('contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
  }, [id]);

  return { contact, loading, refetch: fetch, update, softDelete };
}

export async function createContact(data) {
  const { data: user } = await supabase.auth.getUser();
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({ ...data, owner_id: user.user.id })
    .select()
    .single();

  if (!error) {
    await supabase.from('activities').insert({
      owner_id: user.user.id,
      contact_id: contact.id,
      type: 'created',
      description: 'Kontakt manuell erstellt',
    });
  }

  return { data: contact, error };
}
