import { useState } from 'preact/hooks';
import { useCompany } from '../hooks/useCompanies.js';
import { useContacts, createContact } from '../hooks/useContacts.js';
import { useDeals } from '../hooks/useDeals.js';
import { useActivities } from '../hooks/useActivities.js';
import { ActivityItem } from '../components/ActivityItem.jsx';
import { StageBadge } from '../components/StageBadge.jsx';
import { useToast } from '../components/Toast.jsx';
import { useInvoices } from '../hooks/useInvoices.js';
import { INVOICE_TYPES, INVOICE_STATUS } from '../lib/invoiceHelpers.js';
import { INDUSTRIES, SOURCES, formatDate, formatCurrency } from '../lib/helpers.js';
import { route } from 'preact-router';

export function CompanyDetail({ id }) {
  const { company, loading, update } = useCompany(id);
  const { contacts, refetch: refetchContacts } = useContacts();
  const { deals } = useDeals({ companyId: id });
  const { invoices: companyInvoices } = useInvoices({ companyId: id });
  const { activities } = useActivities({ companyId: id });
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState({ first_name: '', last_name: '', email: '', phone: '', source: 'manual' });

  const companyContacts = contacts.filter(c => c.company_id === id);

  if (loading) {
    return (
      <>
        <div class="page-header"><h1 class="page-title">Firma</h1></div>
        <div class="page-body"><div class="loading-center"><div class="spinner" /></div></div>
      </>
    );
  }

  if (!company) {
    return (
      <>
        <div class="page-header"><h1 class="page-title">Nicht gefunden</h1></div>
        <div class="page-body"><div class="empty-state"><div class="empty-state-text">Firma nicht gefunden</div></div></div>
      </>
    );
  }

  function startEdit() {
    setForm({
      name: company.name || '',
      industry: company.industry || '',
      website: company.website || '',
      address: company.address || '',
      city: company.city || '',
      notes: company.notes || '',
    });
    setEditing(true);
  }

  async function handleAddContact(e) {
    e.preventDefault();
    const { error } = await createContact({
      first_name: contactForm.first_name || null,
      last_name: contactForm.last_name || null,
      email: contactForm.email || null,
      phone: contactForm.phone || null,
      source: contactForm.source || 'manual',
      company_id: id,
    });
    if (error) {
      toast.error('Fehler beim Erstellen');
    } else {
      toast.success('Kontakt erstellt');
      setShowAddContact(false);
      setContactForm({ first_name: '', last_name: '', email: '', phone: '', source: 'manual' });
      refetchContacts();
    }
  }

  async function saveEdit() {
    const { error } = await update(form);
    if (error) {
      toast.error('Fehler beim Speichern');
    } else {
      toast.success('Firma aktualisiert');
      setEditing(false);
    }
  }

  return (
    <>
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <button class="btn btn-secondary btn-sm" onClick={() => route('/crm/companies')}>←</button>
          <h1 class="page-title">{company.name}</h1>
        </div>
        {!editing && <button class="btn btn-secondary btn-sm" onClick={startEdit}>Bearbeiten</button>}
      </div>

      <div class="page-body">
        <div class="detail-grid">
          <div class="detail-main">
            <div class="card">
              <div class="card-header"><span class="card-title">Firmendaten</span></div>
              {editing ? (
                <div>
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Name</label>
                      <input value={form.name} onInput={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div class="form-group">
                      <label>Branche</label>
                      <select value={form.industry} onChange={e => setForm({...form, industry: e.target.value})}>
                        <option value="">–</option>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Website</label>
                      <input value={form.website} onInput={e => setForm({...form, website: e.target.value})} />
                    </div>
                    <div class="form-group">
                      <label>Stadt</label>
                      <input value={form.city} onInput={e => setForm({...form, city: e.target.value})} />
                    </div>
                    <div class="form-group form-group-full">
                      <label>Adresse</label>
                      <input value={form.address} onInput={e => setForm({...form, address: e.target.value})} />
                    </div>
                    <div class="form-group form-group-full">
                      <label>Notizen</label>
                      <textarea value={form.notes} onInput={e => setForm({...form, notes: e.target.value})} />
                    </div>
                  </div>
                  <div class="form-actions">
                    <button class="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Abbrechen</button>
                    <button class="btn btn-primary btn-sm" onClick={saveEdit}>Speichern</button>
                  </div>
                </div>
              ) : (
                <div class="form-grid">
                  <div class="detail-field">
                    <span class="detail-label">Name</span>
                    <span class="detail-value">{company.name}</span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-label">Branche</span>
                    <span class="detail-value">{company.industry || '–'}</span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-label">Website</span>
                    <span class="detail-value">
                      {company.website ? <a href={company.website} target="_blank" rel="noopener">{company.website}</a> : '–'}
                    </span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-label">Stadt</span>
                    <span class="detail-value">{company.city || '–'}</span>
                  </div>
                  <div class="detail-field form-group-full">
                    <span class="detail-label">Adresse</span>
                    <span class="detail-value">{company.address || '–'}</span>
                  </div>
                  {company.notes && (
                    <div class="detail-field form-group-full">
                      <span class="detail-label">Notizen</span>
                      <span class="detail-value">{company.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div class="card">
              <div class="card-header">
                <span class="card-title">Kontakte ({companyContacts.length})</span>
                {!showAddContact && (
                  <button class="btn btn-secondary btn-sm" onClick={() => setShowAddContact(true)}>+ Kontakt</button>
                )}
              </div>
              {showAddContact && (
                <form onSubmit={handleAddContact} style="margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--border)">
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Vorname</label>
                      <input value={contactForm.first_name} onInput={e => setContactForm({...contactForm, first_name: e.target.value})} />
                    </div>
                    <div class="form-group">
                      <label>Nachname</label>
                      <input value={contactForm.last_name} onInput={e => setContactForm({...contactForm, last_name: e.target.value})} />
                    </div>
                    <div class="form-group">
                      <label>E-Mail</label>
                      <input type="email" value={contactForm.email} onInput={e => setContactForm({...contactForm, email: e.target.value})} />
                    </div>
                    <div class="form-group">
                      <label>Telefon</label>
                      <input value={contactForm.phone} onInput={e => setContactForm({...contactForm, phone: e.target.value})} />
                    </div>
                  </div>
                  <div class="form-actions" style="margin-top:0.5rem;border-top:none;padding-top:0">
                    <button type="button" class="btn btn-secondary btn-sm" onClick={() => setShowAddContact(false)}>Abbrechen</button>
                    <button type="submit" class="btn btn-primary btn-sm">Erstellen</button>
                  </div>
                </form>
              )}
              {companyContacts.length === 0 && !showAddContact ? (
                <div style="color:var(--text-dim);font-size:0.85rem">Keine Kontakte</div>
              ) : companyContacts.length > 0 && (
                <div class="table-wrapper">
                  <table>
                    <thead><tr><th>Name</th><th>E-Mail</th><th>Position</th></tr></thead>
                    <tbody>
                      {companyContacts.map(c => (
                        <tr key={c.id} class="clickable-row" onClick={() => route(`/crm/contacts/${c.id}`)}>
                          <td>{`${c.first_name || ''} ${c.last_name || ''}`.trim() || '–'}</td>
                          <td>{c.email}</td>
                          <td>{c.position || '–'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div class="card">
              <div class="card-header"><span class="card-title">Deals ({deals.length})</span></div>
              {deals.length === 0 ? (
                <div style="color:var(--text-dim);font-size:0.85rem">Keine Deals</div>
              ) : (
                <div class="table-wrapper">
                  <table>
                    <thead><tr><th>Titel</th><th>Stage</th><th>Wert</th></tr></thead>
                    <tbody>
                      {deals.map(d => (
                        <tr key={d.id} class="clickable-row" onClick={() => route(`/crm/deals/${d.id}`)}>
                          <td>{d.title}</td>
                          <td><StageBadge stage={d.stage} /></td>
                          <td>{d.value ? formatCurrency(d.value) : '–'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div class="card">
              <div class="card-header"><span class="card-title">Rechnungen / Angebote ({companyInvoices.length})</span></div>
              {companyInvoices.length === 0 ? (
                <div style="color:var(--text-dim);font-size:0.85rem">Keine Rechnungen</div>
              ) : (
                <div class="table-wrapper">
                  <table>
                    <thead><tr><th>Nummer</th><th>Typ</th><th>Status</th><th style="text-align:right">Betrag</th></tr></thead>
                    <tbody>
                      {companyInvoices.map(inv => (
                        <tr key={inv.id} class="clickable-row" onClick={() => route(`/crm/invoices/${inv.id}`)}>
                          <td style="font-weight:600">{inv.invoice_number}</td>
                          <td>{INVOICE_TYPES[inv.type]?.label}</td>
                          <td>
                            <span class="stage-badge" style={`color:${INVOICE_STATUS[inv.status]?.color};background:${INVOICE_STATUS[inv.status]?.color}20`}>
                              {INVOICE_STATUS[inv.status]?.label}
                            </span>
                          </td>
                          <td style="text-align:right">{formatCurrency(inv.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div class="detail-sidebar">
            <div class="card">
              <div class="detail-field">
                <span class="detail-label">Erstellt am</span>
                <span class="detail-value">{formatDate(company.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
