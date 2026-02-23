import { useState, useEffect, useCallback } from 'preact/hooks';
import { supabase } from '../lib/supabase.js';

export function useCampaigns({ status = null } = {}) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (!error) setCampaigns(data || []);
    setLoading(false);
  }, [status]);

  useEffect(() => { fetch(); }, [fetch]);

  return { campaigns, loading, refetch: fetch };
}

export function useCampaign(id) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    setCampaign(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const update = useCallback(async (updates) => {
    const { error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id);
    if (!error) await fetch();
    return { error };
  }, [id, fetch]);

  const remove = useCallback(async () => {
    return supabase.from('campaigns').delete().eq('id', id);
  }, [id]);

  return { campaign, loading, refetch: fetch, update, remove };
}

export function useCampaignRecipients(campaignId) {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    const { data } = await supabase
      .from('campaign_recipients')
      .select('*, contact:contacts(first_name, last_name, email)')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    setRecipients(data || []);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { recipients, loading, refetch: fetch };
}

export async function createCampaign(data) {
  const { data: user } = await supabase.auth.getUser();
  return supabase
    .from('campaigns')
    .insert({ ...data, owner_id: user.user.id })
    .select()
    .single();
}

export async function fetchFilteredRecipients({ source, stage, industry }) {
  let query = supabase
    .from('contacts')
    .select('id, first_name, last_name, email, source, company:companies(name, industry)')
    .is('deleted_at', null)
    .eq('gdpr_consent', true)
    .not('email', 'is', null);

  if (source) query = query.eq('source', source);

  const { data, error } = await query;
  if (error) return { data: [], error };

  let filtered = data || [];

  // Post-filter by stage (needs deal lookup) and industry (from joined company)
  if (industry) {
    filtered = filtered.filter(c => c.company?.industry === industry);
  }

  if (stage) {
    // Fetch contacts that have a deal in this stage
    const { data: deals } = await supabase
      .from('deals')
      .select('contact_id')
      .eq('stage', stage)
      .is('deleted_at', null);

    const contactIds = new Set((deals || []).map(d => d.contact_id).filter(Boolean));
    filtered = filtered.filter(c => contactIds.has(c.id));
  }

  return { data: filtered, error: null };
}

export async function saveCampaignRecipients(campaignId, contacts) {
  // Remove existing recipients first
  await supabase
    .from('campaign_recipients')
    .delete()
    .eq('campaign_id', campaignId);

  if (contacts.length === 0) return { error: null };

  const rows = contacts.map(c => ({
    campaign_id: campaignId,
    contact_id: c.id,
    email: c.email,
  }));

  return supabase.from('campaign_recipients').insert(rows);
}

export async function sendCampaign(campaignId, { testEmail } = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const body = { campaign_id: campaignId };
  if (testEmail) body.test_email = testEmail;

  const response = await fetch('/api/campaign-send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Send failed');
  return result;
}
