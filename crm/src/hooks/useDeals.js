import { useState, useEffect, useCallback } from 'preact/hooks';
import { supabase } from '../lib/supabase.js';

export function useDeals({ stage = null, contactId = null, companyId = null } = {}) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('deals')
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email),
        company:companies(id, name)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (stage) query = query.eq('stage', stage);
    if (contactId) query = query.eq('contact_id', contactId);
    if (companyId) query = query.eq('company_id', companyId);

    const { data, error } = await query;
    if (!error) {
      setDeals((data || []).map(d => ({
        ...d,
        contact_name: d.contact
          ? `${d.contact.first_name || ''} ${d.contact.last_name || ''}`.trim() || d.contact.email
          : null,
        company_name: d.company?.name || null,
      })));
    }
    setLoading(false);
  }, [stage, contactId, companyId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { deals, loading, refetch: fetch };
}

export function useDeal(id) {
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase
      .from('deals')
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, phone),
        company:companies(id, name)
      `)
      .eq('id', id)
      .single();
    setDeal(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const update = useCallback(async (updates) => {
    const { error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', id);
    if (!error) await fetch();
    return { error };
  }, [id, fetch]);

  const changeStage = useCallback(async (newStage) => {
    const oldStage = deal?.stage;
    const { error } = await supabase
      .from('deals')
      .update({ stage: newStage, stage_changed_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      const { data: user } = await supabase.auth.getUser();
      await supabase.from('activities').insert({
        owner_id: user.user.id,
        deal_id: id,
        contact_id: deal?.contact_id,
        type: 'stage_change',
        description: `Stage geaendert: ${oldStage} → ${newStage}`,
        metadata: { old_stage: oldStage, new_stage: newStage },
      });
      await fetch();
    }
    return { error };
  }, [id, deal, fetch]);

  return { deal, loading, refetch: fetch, update, changeStage };
}

export async function createDeal(data) {
  const { data: user } = await supabase.auth.getUser();
  const { data: deal, error } = await supabase
    .from('deals')
    .insert({ ...data, owner_id: user.user.id })
    .select()
    .single();

  if (!error) {
    await supabase.from('activities').insert({
      owner_id: user.user.id,
      deal_id: deal.id,
      contact_id: data.contact_id || null,
      type: 'created',
      description: `Deal erstellt: ${data.title}`,
    });
  }

  return { data: deal, error };
}

export async function updateDealStage(dealId, newStage, oldStage, contactId) {
  const { error } = await supabase
    .from('deals')
    .update({ stage: newStage, stage_changed_at: new Date().toISOString() })
    .eq('id', dealId);

  if (!error) {
    const { data: user } = await supabase.auth.getUser();
    await supabase.from('activities').insert({
      owner_id: user.user.id,
      deal_id: dealId,
      contact_id: contactId || null,
      type: 'stage_change',
      description: `Stage geaendert: ${oldStage} → ${newStage}`,
      metadata: { old_stage: oldStage, new_stage: newStage },
    });
  }

  return { error };
}
