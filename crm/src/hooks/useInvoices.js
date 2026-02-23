import { useState, useEffect, useCallback } from 'preact/hooks';
import { supabase } from '../lib/supabase.js';
import { generateInvoiceNumber } from '../lib/invoiceHelpers.js';

export function useInvoices({ type = null, status = null, companyId = null, dealId = null } = {}) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('invoices')
      .select(`
        *,
        company:companies(id, name),
        contact:contacts(id, first_name, last_name)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (companyId) query = query.eq('company_id', companyId);
    if (dealId) query = query.eq('deal_id', dealId);

    const { data, error } = await query;
    if (!error) setInvoices(data || []);
    setLoading(false);
  }, [type, status, companyId, dealId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { invoices, loading, refetch: fetch };
}

export function useInvoice(id) {
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);

    const [invResult, itemsResult] = await Promise.all([
      supabase
        .from('invoices')
        .select(`
          *,
          company:companies(id, name),
          contact:contacts(id, first_name, last_name, email, phone)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single(),
      supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('position', { ascending: true }),
    ]);

    if (invResult.error) {
      console.error('useInvoice fetch error:', invResult.error);
      setFetchError(invResult.error);
    }
    if (itemsResult.error) {
      console.error('useInvoice items error:', itemsResult.error);
    }

    setInvoice(invResult.data);
    setItems(itemsResult.data || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const update = useCallback(async (updates) => {
    const { error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id);
    if (!error) await fetch();
    return { error };
  }, [id, fetch]);

  return { invoice, items, loading, fetchError, refetch: fetch, update };
}

export async function createInvoice(invoiceData, lineItems) {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user?.id) {
    return { error: { message: 'Nicht authentifiziert. Bitte erneut einloggen.' } };
  }
  const ownerId = userData.user.id;

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({ ...invoiceData, owner_id: ownerId })
    .select()
    .single();

  if (error) return { error };
  if (!invoice) return { error: { message: 'Rechnung wurde nicht gespeichert.' } };

  if (lineItems && lineItems.length > 0) {
    const rows = lineItems.map((item, i) => ({
      invoice_id: invoice.id,
      position: i + 1,
      description: item.description,
      sub_description: item.sub_description || null,
      quantity: parseFloat(item.quantity) || 1,
      unit_price: parseFloat(item.unit_price) || 0,
    }));

    const { error: itemError } = await supabase
      .from('invoice_items')
      .insert(rows);
    if (itemError) return { data: invoice, error: itemError };
  }

  const actType = invoiceData.type === 'quote' ? 'quote_created' : 'invoice_created';
  const actLabel = invoiceData.type === 'quote' ? 'Angebot' : 'Rechnung';
  await supabase.from('activities').insert({
    owner_id: ownerId,
    deal_id: invoiceData.deal_id || null,
    contact_id: invoiceData.contact_id || null,
    company_id: invoiceData.company_id || null,
    type: actType,
    description: `${actLabel} erstellt: ${invoiceData.invoice_number}`,
    metadata: { invoice_id: invoice.id, invoice_number: invoiceData.invoice_number },
  });

  return { data: invoice, error: null };
}

export async function updateInvoiceWithItems(invoiceId, invoiceData, lineItems) {
  const { error } = await supabase
    .from('invoices')
    .update(invoiceData)
    .eq('id', invoiceId);

  if (error) return { error };

  // Delete existing items and re-insert
  await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', invoiceId);

  if (lineItems && lineItems.length > 0) {
    const rows = lineItems.map((item, i) => ({
      invoice_id: invoiceId,
      position: i + 1,
      description: item.description,
      sub_description: item.sub_description || null,
      quantity: parseFloat(item.quantity) || 1,
      unit_price: parseFloat(item.unit_price) || 0,
    }));

    const { error: itemError } = await supabase
      .from('invoice_items')
      .insert(rows);
    if (itemError) return { error: itemError };
  }

  return { error: null };
}

export async function convertQuoteToInvoice(quoteId) {
  const { data: user } = await supabase.auth.getUser();
  const ownerId = user.user.id;

  // Load quote + items
  const [{ data: quote }, { data: quoteItems }] = await Promise.all([
    supabase.from('invoices').select('*').eq('id', quoteId).single(),
    supabase.from('invoice_items').select('*').eq('invoice_id', quoteId).order('position'),
  ]);

  if (!quote) return { error: { message: 'Angebot nicht gefunden' } };

  // Generate new invoice number
  const now = new Date();
  const invoiceNumber = generateInvoiceNumber('invoice', quote.customer_company, quote.customer_name);

  const { id: _id, created_at: _ca, updated_at: _ua, ...quoteData } = quote;

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      ...quoteData,
      type: 'invoice',
      invoice_number: invoiceNumber,
      status: 'draft',
      invoice_date: now.toISOString().slice(0, 10),
      due_date: new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10),
      converted_from_quote_id: quoteId,
      paid_date: null,
      paid_amount: 0,
    })
    .select()
    .single();

  if (error) return { error };

  // Copy items
  if (quoteItems && quoteItems.length > 0) {
    const rows = quoteItems.map(item => ({
      invoice_id: invoice.id,
      position: item.position,
      description: item.description,
      sub_description: item.sub_description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));
    await supabase.from('invoice_items').insert(rows);
  }

  // Log activity
  await supabase.from('activities').insert({
    owner_id: ownerId,
    deal_id: quote.deal_id || null,
    contact_id: quote.contact_id || null,
    company_id: quote.company_id || null,
    type: 'quote_converted',
    description: `Angebot ${quote.invoice_number} in Rechnung ${invoiceNumber} umgewandelt`,
    metadata: { quote_id: quoteId, invoice_id: invoice.id },
  });

  return { data: invoice, error: null };
}

export function useBusinessSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1)
      .single();
    setSettings(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const save = useCallback(async (updates) => {
    const { data: user } = await supabase.auth.getUser();
    if (settings) {
      const { error } = await supabase
        .from('business_settings')
        .update(updates)
        .eq('id', settings.id);
      if (!error) await fetch();
      return { error };
    } else {
      const { error } = await supabase
        .from('business_settings')
        .insert({ ...updates, owner_id: user.user.id });
      if (!error) await fetch();
      return { error };
    }
  }, [settings, fetch]);

  return { settings, loading, save, refetch: fetch };
}

export function useInvoiceDashboard() {
  const [stats, setStats] = useState({
    openCount: 0,
    openAmount: 0,
    monthRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    const [{ data: openInvoices }, { data: paidThisMonth }] = await Promise.all([
      supabase
        .from('invoices')
        .select('total_amount')
        .eq('type', 'invoice')
        .is('deleted_at', null)
        .in('status', ['sent', 'overdue']),
      supabase
        .from('invoices')
        .select('total_amount')
        .eq('type', 'invoice')
        .is('deleted_at', null)
        .eq('status', 'paid')
        .gte('paid_date', monthStart),
    ]);

    const openCount = (openInvoices || []).length;
    const openAmount = (openInvoices || []).reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0);
    const monthRevenue = (paidThisMonth || []).reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0);

    setStats({ openCount, openAmount, monthRevenue });
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, loading };
}

export async function deleteInvoice(id) {
  const { error } = await supabase
    .from('invoices')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  return { error };
}
