import { useState } from 'preact/hooks';
import { useContact } from '../hooks/useContacts.js';
import { useCompanies, createCompany } from '../hooks/useCompanies.js';
import { useDeals } from '../hooks/useDeals.js';
import { useActivities, createActivity } from '../hooks/useActivities.js';
import { ActivityItem } from '../components/ActivityItem.jsx';
import { StageBadge } from '../components/StageBadge.jsx';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatDate, formatCurrency, SOURCES, ACTIVITY_TYPES } from '../lib/helpers.js';
import { route } from 'preact-router';

export function ContactDetail({ id }) {
  const { contact, loading, update, softDelete } = useContact(id);
  const { companies } = useCompanies();
  const { deals } = useDeals({ contactId: id });
  const { activities, refetch: refetchActivities } = useActivities({ contactId: id });
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [companyMode, setCompanyMode] = useState('keep');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [showActivity, setShowActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: 'note', description: '', due_date: '' });

  if (loading) {
    return (
      <>
        <div class="page-header"><h1 class="page-title">Kontakt</h1></div>
        <div class="page-body"><div class="loading-center"><div class="spinner" /></div></div>
      </>
    );
  }

  if (!contact) {
    return (
      <>
        <div class="page-header"><h1 class="page-title">Nicht gefunden</h1></div>
        <div class="page-body"><div class="empty-state"><div class="empty-state-text">Kontakt nicht gefunden</div></div></div>
      </>
    );
  }

  function startEdit() {
    setForm({
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      position: contact.position || '',
      company_id: contact.company_id || '',
    });
    setCompanyMode('keep');
    setNewCompanyName('');
    setEditing(true);
  }

  async function saveEdit() {
    try {
      const updates = { ...form };

      if (companyMode === 'new' && newCompanyName.trim()) {
        const { data: company, error: companyError } = await createCompany({ name: newCompanyName.trim() });
        if (companyError) throw companyError;
        updates.company_id = company.id;
      } else if (companyMode === 'remove') {
        updates.company_id = null;
      }

      const { error } = await update(updates);
      if (error) throw error;
      toast.success('Kontakt aktualisiert');
      setEditing(false);
    } catch (err) {
      toast.error(err.message || 'Fehler beim Speichern');
    }
  }

  async function handleDelete() {
    const linkedDeals = deals.length;
    const msg = linkedDeals > 0
      ? `Dieser Kontakt hat ${linkedDeals} verknuepfte(n) Deal(s). Kontakt wirklich loeschen?`
      : 'Kontakt wirklich loeschen?';
    if (!confirm(msg)) return;
    const { error } = await softDelete();
    if (error) {
      toast.error('Fehler beim Loeschen');
    } else {
      toast.success('Kontakt geloescht');
      route('/crm/contacts');
    }
  }

  async function addActivity(e) {
    e.preventDefault();
    const { error } = await createActivity({
      contact_id: id,
      type: activityForm.type,
      description: activityForm.description,
      due_date: activityForm.type === 'task' && activityForm.due_date ? activityForm.due_date : null,
    });
    if (error) {
      toast.error('Fehler beim Erstellen');
    } else {
      toast.success('Aktivitaet hinzugefuegt');
      setShowActivity(false);
      setActivityForm({ type: 'note', description: '', due_date: '' });
      refetchActivities();
    }
  }

  const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email;

  return (
    <>
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <button class="btn btn-secondary btn-sm" onClick={() => route('/crm/contacts')}>←</button>
          <h1 class="page-title">{fullName}</h1>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-secondary btn-sm" onClick={() => setShowActivity(true)}>+ Aktivitaet</button>
          <button class="btn btn-secondary btn-sm" onClick={() => route(`/crm/deals/new?contact_id=${id}`)}>+ Deal</button>
          {!editing && <button class="btn btn-secondary btn-sm" onClick={startEdit}>Bearbeiten</button>}
          <button class="btn btn-danger btn-sm" onClick={handleDelete}>Loeschen</button>
        </div>
      </div>

      <div class="page-body">
        <div class="detail-grid">
          <div class="detail-main">
            <div class="card">
              <div class="card-header"><span class="card-title">Stammdaten</span></div>
              {editing ? (
                <div>
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Vorname</label>
                      <input value={form.first_name} onInput={e => setForm({...form, first_name: e.target.value})} />
                    </div>
                    <div class="form-group">
                      <label>Nachname</label>
                      <input value={form.last_name} onInput={e => setForm({...form, last_name: e.target.value})} />
                    </div>
                    <div class="form-group">
                      <label>E-Mail</label>
                      <input type="email" value={form.email} onInput={e => setForm({...form, email: e.target.value})} />
                    </div>
                    <div class="form-group">
                      <label>Telefon</label>
                      <input value={form.phone} onInput={e => setForm({...form, phone: e.target.value})} />
                    </div>
                    <div class="form-group">
                      <label>Position</label>
                      <input value={form.position} onInput={e => setForm({...form, position: e.target.value})} />
                    </div>
                    <div class="form-group form-group-full">
                      <label>Firma</label>
                      <div style="display:flex;gap:0.25rem;margin-bottom:0.5rem">
                        <button type="button" class={`filter-pill ${companyMode === 'keep' ? 'active' : ''}`} onClick={() => setCompanyMode('keep')}>
                          {contact.company ? 'Beibehalten' : 'Keine'}
                        </button>
                        <button type="button" class={`filter-pill ${companyMode === 'change' ? 'active' : ''}`} onClick={() => setCompanyMode('change')}>Andere waehlen</button>
                        <button type="button" class={`filter-pill ${companyMode === 'new' ? 'active' : ''}`} onClick={() => setCompanyMode('new')}>Neue</button>
                        {contact.company && (
                          <button type="button" class={`filter-pill ${companyMode === 'remove' ? 'active' : ''}`} onClick={() => setCompanyMode('remove')}>Entfernen</button>
                        )}
                      </div>
                      {companyMode === 'keep' && contact.company && (
                        <div style="font-size:0.85rem;color:var(--text-dim)">{contact.company.name}</div>
                      )}
                      {companyMode === 'change' && (
                        <select value={form.company_id} onChange={e => setForm({...form, company_id: e.target.value})}>
                          <option value="">– Firma waehlen –</option>
                          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      )}
                      {companyMode === 'new' && (
                        <input value={newCompanyName} onInput={e => setNewCompanyName(e.target.value)} placeholder="Neuer Firmenname" />
                      )}
                      {companyMode === 'remove' && (
                        <div style="font-size:0.85rem;color:var(--text-dim)">Firma-Verknuepfung wird entfernt</div>
                      )}
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
                    <span class="detail-label">Vorname</span>
                    <span class="detail-value">{contact.first_name || '–'}</span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-label">Nachname</span>
                    <span class="detail-value">{contact.last_name || '–'}</span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-label">E-Mail</span>
                    <span class="detail-value">
                      {contact.email?.endsWith('@platzhalter.de')
                        ? <span style="color:var(--text-dim);font-style:italic" title="Platzhalter – bitte echte E-Mail eintragen">{contact.email}</span>
                        : <a href={`mailto:${contact.email}`}>{contact.email}</a>}
                    </span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-label">Telefon</span>
                    <span class="detail-value">
                      {contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : '–'}
                    </span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-label">Position</span>
                    <span class="detail-value">{contact.position || '–'}</span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-label">Firma</span>
                    <span class="detail-value">
                      {contact.company
                        ? <a href="#" onClick={(e) => { e.preventDefault(); route(`/crm/companies/${contact.company.id}`); }}>{contact.company.name}</a>
                        : '–'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div class="card">
              <div class="card-header">
                <span class="card-title">Deals ({deals.length})</span>
              </div>
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
              <div class="card-header"><span class="card-title">Aktivitaeten</span></div>
              {activities.length === 0 ? (
                <div style="color:var(--text-dim);font-size:0.85rem">Keine Aktivitaeten</div>
              ) : (
                <div class="timeline">
                  {activities.map(a => <ActivityItem key={a.id} activity={a} />)}
                </div>
              )}
            </div>
          </div>

          <div class="detail-sidebar">
            <div class="card">
              <div class="detail-field">
                <span class="detail-label">Quelle</span>
                <span class="detail-value">{SOURCES[contact.source] || contact.source}</span>
              </div>
              {contact.source_detail && (
                <div class="detail-field">
                  <span class="detail-label">Detail</span>
                  <span class="detail-value">{contact.source_detail}</span>
                </div>
              )}
              <div class="detail-field">
                <span class="detail-label">DSGVO-Einwilligung</span>
                <span class="detail-value">{contact.gdpr_consent ? 'Ja' : 'Nein'}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">Erstellt am</span>
                <span class="detail-value">{formatDate(contact.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showActivity && (
        <Modal title="Aktivitaet hinzufuegen" onClose={() => setShowActivity(false)}>
          <form onSubmit={addActivity}>
            <div class="form-group">
              <label>Typ</label>
              <select value={activityForm.type} onChange={e => setActivityForm({...activityForm, type: e.target.value})}>
                {Object.entries(ACTIVITY_TYPES)
                  .filter(([k]) => !['form_submission', 'stage_change', 'created'].includes(k))
                  .map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div class="form-group">
              <label>Beschreibung</label>
              <textarea
                value={activityForm.description}
                onInput={e => setActivityForm({...activityForm, description: e.target.value})}
                required
              />
            </div>
            {activityForm.type === 'task' && (
              <div class="form-group">
                <label>Faellig am</label>
                <input
                  type="date"
                  value={activityForm.due_date}
                  onInput={e => setActivityForm({...activityForm, due_date: e.target.value})}
                />
              </div>
            )}
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onClick={() => setShowActivity(false)}>Abbrechen</button>
              <button type="submit" class="btn btn-primary">Speichern</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
