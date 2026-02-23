import { useState, useEffect } from 'preact/hooks';
import { supabase } from '../lib/supabase.js';
import { createInvoice, updateInvoiceWithItems, useInvoice, useBusinessSettings } from '../hooks/useInvoices.js';
import { generateInvoiceNumber, calculateTotals } from '../lib/invoiceHelpers.js';
import { LineItemsEditor } from '../components/LineItemsEditor.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatCurrency } from '../lib/helpers.js';
import { route } from 'preact-router';

export function InvoiceForm() {
  const toast = useToast();
  const { settings } = useBusinessSettings();

  // Parse URL params
  const params = new URLSearchParams(window.location.search);
  const urlType = params.get('type') || 'invoice';
  const dealId = params.get('deal_id');
  const quoteId = params.get('quote_id');
  const editId = params.get('edit');

  const { invoice: editInvoice, items: editItems, loading: editLoading } = useInvoice(editId);

  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({
    type: urlType,
    invoice_number: '',
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    company_id: '',
    contact_id: '',
    deal_id: dealId || '',
    customer_company: '',
    customer_name: '',
    customer_street: '',
    customer_zip: '',
    customer_city: '',
    customer_number: '',
    discount_percent: 0,
    vat_rate: 19,
    payment_terms: 'Diese Rechnung ist zahlbar innerhalb von 14 Tagen ohne Abzug auf das unten angegebene Bankkonto.',
    closing_message: '',
    notes: '',
  });
  const [items, setItems] = useState([
    { description: '', sub_description: '', quantity: 1, unit_price: 0 },
  ]);

  // Load companies and contacts for selects
  useEffect(() => {
    supabase.from('companies').select('id, name, address, city').is('deleted_at', null).order('name').then(({ data }) => setCompanies(data || []));
    supabase.from('contacts').select('id, first_name, last_name, email, company_id').is('deleted_at', null).order('last_name').then(({ data }) => setContacts(data || []));
  }, []);

  // Apply settings defaults
  useEffect(() => {
    if (settings && !editId && !quoteId) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (settings.default_payment_days || 14));
      setForm(f => ({
        ...f,
        vat_rate: parseFloat(settings.vat_rate) || 19,
        due_date: f.due_date || dueDate.toISOString().slice(0, 10),
        closing_message: f.closing_message || settings.default_closing_text || '',
      }));
    }
  }, [settings, editId, quoteId]);

  // Pre-fill from Deal
  useEffect(() => {
    if (!dealId || editId) return;
    supabase
      .from('deals')
      .select('*, contact:contacts(id, first_name, last_name), company:companies(id, name, address, city)')
      .eq('id', dealId)
      .single()
      .then(({ data: deal }) => {
        if (!deal) return;
        const contactName = deal.contact
          ? `${deal.contact.first_name || ''} ${deal.contact.last_name || ''}`.trim()
          : '';
        setForm(f => ({
          ...f,
          deal_id: deal.id,
          company_id: deal.company?.id || '',
          contact_id: deal.contact?.id || '',
          customer_company: deal.company?.name || '',
          customer_name: contactName,
          customer_street: deal.company?.address || '',
          customer_city: deal.company?.city || '',
          invoice_number: generateInvoiceNumber(urlType, deal.company?.name, contactName),
        }));
      });
  }, [dealId, urlType, editId]);

  // Pre-fill from Quote (convert)
  useEffect(() => {
    if (!quoteId) return;
    Promise.all([
      supabase.from('invoices').select('*').eq('id', quoteId).single(),
      supabase.from('invoice_items').select('*').eq('invoice_id', quoteId).order('position'),
    ]).then(([{ data: q }, { data: qItems }]) => {
      if (!q) return;
      setForm(f => ({
        ...f,
        type: 'invoice',
        invoice_number: generateInvoiceNumber('invoice', q.customer_company, q.customer_name),
        company_id: q.company_id || '',
        contact_id: q.contact_id || '',
        deal_id: q.deal_id || '',
        customer_company: q.customer_company || '',
        customer_name: q.customer_name || '',
        customer_street: q.customer_street || '',
        customer_zip: q.customer_zip || '',
        customer_city: q.customer_city || '',
        customer_number: q.customer_number || '',
        discount_percent: q.discount_percent || 0,
        vat_rate: q.vat_rate || 19,
        payment_terms: q.payment_terms || f.payment_terms,
        closing_message: q.closing_message || f.closing_message,
        notes: q.notes || '',
      }));
      if (qItems && qItems.length > 0) {
        setItems(qItems.map(it => ({
          description: it.description,
          sub_description: it.sub_description || '',
          quantity: it.quantity,
          unit_price: it.unit_price,
        })));
      }
    });
  }, [quoteId]);

  // Pre-fill from edit
  useEffect(() => {
    if (!editId || editLoading || !editInvoice) return;
    setForm({
      type: editInvoice.type,
      invoice_number: editInvoice.invoice_number,
      invoice_date: editInvoice.invoice_date,
      due_date: editInvoice.due_date || '',
      company_id: editInvoice.company_id || '',
      contact_id: editInvoice.contact_id || '',
      deal_id: editInvoice.deal_id || '',
      customer_company: editInvoice.customer_company || '',
      customer_name: editInvoice.customer_name || '',
      customer_street: editInvoice.customer_street || '',
      customer_zip: editInvoice.customer_zip || '',
      customer_city: editInvoice.customer_city || '',
      customer_number: editInvoice.customer_number || '',
      discount_percent: editInvoice.discount_percent || 0,
      vat_rate: editInvoice.vat_rate || 19,
      payment_terms: editInvoice.payment_terms || '',
      closing_message: editInvoice.closing_message || '',
      notes: editInvoice.notes || '',
    });
    if (editItems.length > 0) {
      setItems(editItems.map(it => ({
        description: it.description,
        sub_description: it.sub_description || '',
        quantity: it.quantity,
        unit_price: it.unit_price,
      })));
    }
  }, [editId, editLoading, editInvoice, editItems]);

  // Auto-generate invoice number on type or customer change
  useEffect(() => {
    if (editId || quoteId) return;
    if (!form.customer_name && !form.customer_company) return;
    setForm(f => ({ ...f, invoice_number: generateInvoiceNumber(f.type, f.customer_company, f.customer_name) }));
  }, [form.type, form.customer_name, form.customer_company, editId, quoteId]);

  // Company select handler
  function handleCompanySelect(companyId) {
    const comp = companies.find(c => c.id === companyId);
    setForm(f => ({
      ...f,
      company_id: companyId,
      customer_company: comp?.name || f.customer_company,
      customer_street: comp?.address || f.customer_street,
      customer_city: comp?.city || f.customer_city,
    }));
  }

  // Contact select handler
  function handleContactSelect(contactId) {
    const ct = contacts.find(c => c.id === contactId);
    if (!ct) return;
    const name = `${ct.first_name || ''} ${ct.last_name || ''}`.trim();
    setForm(f => ({
      ...f,
      contact_id: contactId,
      customer_name: name,
      company_id: ct.company_id || f.company_id,
    }));
    if (ct.company_id && !form.company_id) {
      handleCompanySelect(ct.company_id);
    }
  }

  const totals = calculateTotals(items, form.discount_percent, form.vat_rate);
  const isQuote = form.type === 'quote';
  const title = editId
    ? `${isQuote ? 'Angebot' : 'Rechnung'} bearbeiten`
    : quoteId
      ? 'Rechnung aus Angebot erstellen'
      : `Neue${isQuote ? 's Angebot' : ' Rechnung'} erstellen`;

  async function handleSubmit(e) {
    e.preventDefault();
    if (items.length === 0 || !items.some(it => it.description)) {
      toast.error('Mindestens eine Position erforderlich');
      return;
    }

    setSaving(true);
    const invoiceData = {
      ...form,
      company_id: form.company_id || null,
      contact_id: form.contact_id || null,
      deal_id: form.deal_id || null,
      subtotal: totals.subtotal,
      net_amount: totals.net_amount,
      vat_amount: totals.vat_amount,
      total_amount: totals.total_amount,
      due_date: form.due_date || null,
    };

    let result;
    if (editId) {
      result = await updateInvoiceWithItems(editId, invoiceData, items);
      if (!result.error) {
        toast.success('Gespeichert');
        route(`/crm/invoices/${editId}`);
      }
    } else {
      if (quoteId) invoiceData.converted_from_quote_id = quoteId;
      result = await createInvoice(invoiceData, items);
      if (!result.error) {
        toast.success(`${isQuote ? 'Angebot' : 'Rechnung'} erstellt`);
        route(`/crm/invoices/${result.data.id}`);
      }
    }

    if (result.error) {
      toast.error('Fehler: ' + result.error.message);
    }
    setSaving(false);
  }

  if (editId && editLoading) {
    return (
      <>
        <div class="page-header"><h1 class="page-title">Laden...</h1></div>
        <div class="page-body"><div class="loading-center"><div class="spinner" /></div></div>
      </>
    );
  }

  return (
    <>
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <button class="btn btn-secondary btn-sm" onClick={() => route('/crm/invoices')}>←</button>
          <h1 class="page-title">{title}</h1>
        </div>
      </div>

      <div class="page-body">
        <form onSubmit={handleSubmit} style="max-width:900px">
          {/* Typ + Nummer + Datum */}
          <div class="card" style="margin-bottom:1.5rem">
            <div class="card-header"><span class="card-title">Dokument</span></div>
            <div class="form-grid">
              <div class="form-group">
                <label>Typ</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  disabled={!!editId || !!quoteId}
                >
                  <option value="invoice">Rechnung</option>
                  <option value="quote">Angebot</option>
                </select>
              </div>
              <div class="form-group">
                <label>{isQuote ? 'Angebotsnr.' : 'Rechnungsnr.'}</label>
                <input
                  value={form.invoice_number}
                  onInput={e => setForm({ ...form, invoice_number: e.target.value })}
                  required
                />
              </div>
              <div class="form-group">
                <label>Datum</label>
                <input
                  type="date"
                  value={form.invoice_date}
                  onInput={e => setForm({ ...form, invoice_date: e.target.value })}
                  required
                />
              </div>
              <div class="form-group">
                <label>{isQuote ? 'Gueltig bis' : 'Faellig am'}</label>
                <input
                  type="date"
                  value={form.due_date}
                  onInput={e => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Kunde */}
          <div class="card" style="margin-bottom:1.5rem">
            <div class="card-header"><span class="card-title">Kunde</span></div>
            <div class="form-grid">
              <div class="form-group">
                <label>Firma (CRM)</label>
                <select
                  value={form.company_id}
                  onChange={e => handleCompanySelect(e.target.value)}
                >
                  <option value="">– Firma waehlen –</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div class="form-group">
                <label>Kontakt (CRM)</label>
                <select
                  value={form.contact_id}
                  onChange={e => handleContactSelect(e.target.value)}
                >
                  <option value="">– Kontakt waehlen –</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {`${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email}
                    </option>
                  ))}
                </select>
              </div>
              <div class="form-group">
                <label>Firmenname (Rechnung)</label>
                <input
                  value={form.customer_company}
                  onInput={e => setForm({ ...form, customer_company: e.target.value })}
                />
              </div>
              <div class="form-group">
                <label>Ansprechpartner</label>
                <input
                  value={form.customer_name}
                  onInput={e => setForm({ ...form, customer_name: e.target.value })}
                />
              </div>
              <div class="form-group">
                <label>Strasse</label>
                <input
                  value={form.customer_street}
                  onInput={e => setForm({ ...form, customer_street: e.target.value })}
                />
              </div>
              <div class="form-group">
                <label>PLZ</label>
                <input
                  value={form.customer_zip}
                  onInput={e => setForm({ ...form, customer_zip: e.target.value })}
                  style="max-width:120px"
                />
              </div>
              <div class="form-group">
                <label>Stadt</label>
                <input
                  value={form.customer_city}
                  onInput={e => setForm({ ...form, customer_city: e.target.value })}
                />
              </div>
              <div class="form-group">
                <label>Kundennummer</label>
                <input
                  value={form.customer_number}
                  onInput={e => setForm({ ...form, customer_number: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Positionen */}
          <div class="card" style="margin-bottom:1.5rem">
            <div class="card-header"><span class="card-title">Positionen</span></div>
            <LineItemsEditor items={items} onChange={setItems} />
          </div>

          {/* Betraege */}
          <div class="card" style="margin-bottom:1.5rem">
            <div class="card-header"><span class="card-title">Betraege</span></div>
            <div style="display:flex;gap:1.5rem;align-items:flex-start">
              <div style="flex:1">
                <div class="form-group" style="max-width:200px">
                  <label>Rabatt (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.discount_percent}
                    onInput={e => setForm({ ...form, discount_percent: e.target.value })}
                    style="text-align:right"
                  />
                </div>
                <div class="form-group" style="max-width:200px">
                  <label>MwSt. (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.vat_rate}
                    onInput={e => setForm({ ...form, vat_rate: e.target.value })}
                    style="text-align:right"
                  />
                </div>
              </div>
              <div class="invoice-totals">
                <div class="invoice-totals-row">
                  <span>Zwischensumme</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                {parseFloat(form.discount_percent) > 0 && (
                  <div class="invoice-totals-row">
                    <span>Rabatt (-{form.discount_percent}%)</span>
                    <span>-{formatCurrency(totals.discount_amount)}</span>
                  </div>
                )}
                <div class="invoice-totals-row">
                  <span>Nettobetrag</span>
                  <span>{formatCurrency(totals.net_amount)}</span>
                </div>
                <div class="invoice-totals-row">
                  <span>{form.vat_rate}% MwSt.</span>
                  <span>{formatCurrency(totals.vat_amount)}</span>
                </div>
                <div class="invoice-totals-row" style="font-weight:700;font-size:1.1rem;border-top:2px solid var(--border);padding-top:0.5rem">
                  <span>Gesamtbetrag</span>
                  <span>{formatCurrency(totals.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Texte */}
          <div class="card" style="margin-bottom:1.5rem">
            <div class="card-header"><span class="card-title">Texte</span></div>
            <div class="form-group">
              <label>Zahlungsbedingungen</label>
              <textarea
                value={form.payment_terms}
                onInput={e => setForm({ ...form, payment_terms: e.target.value })}
              />
            </div>
            <div class="form-group">
              <label>Schlussnachricht</label>
              <textarea
                value={form.closing_message}
                onInput={e => setForm({ ...form, closing_message: e.target.value })}
              />
            </div>
            <div class="form-group">
              <label>Interne Notizen</label>
              <textarea
                value={form.notes}
                onInput={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Nur intern sichtbar"
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onClick={() => route('/crm/invoices')}>
              Abbrechen
            </button>
            <button type="submit" class="btn btn-primary" disabled={saving}>
              {saving ? 'Speichern...' : (editId ? 'Speichern' : 'Erstellen')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
