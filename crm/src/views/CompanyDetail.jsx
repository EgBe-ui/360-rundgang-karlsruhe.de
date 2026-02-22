import { useState } from 'preact/hooks';
import { useCompany } from '../hooks/useCompanies.js';
import { useContacts } from '../hooks/useContacts.js';
import { useDeals } from '../hooks/useDeals.js';
import { useActivities } from '../hooks/useActivities.js';
import { ActivityItem } from '../components/ActivityItem.jsx';
import { StageBadge } from '../components/StageBadge.jsx';
import { useToast } from '../components/Toast.jsx';
import { INDUSTRIES, formatDate, formatCurrency } from '../lib/helpers.js';
import { route } from 'preact-router';

export function CompanyDetail({ id }) {
  const { company, loading, update } = useCompany(id);
  const { contacts } = useContacts();
  const { deals } = useDeals({ companyId: id });
  const { activities } = useActivities({ companyId: id });
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

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
              <div class="card-header"><span class="card-title">Kontakte ({companyContacts.length})</span></div>
              {companyContacts.length === 0 ? (
                <div style="color:var(--text-dim);font-size:0.85rem">Keine Kontakte</div>
              ) : (
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
