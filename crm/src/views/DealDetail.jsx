import { useState } from 'preact/hooks';
import { useDeal } from '../hooks/useDeals.js';
import { useActivities, createActivity } from '../hooks/useActivities.js';
import { ActivityItem } from '../components/ActivityItem.jsx';
import { StageBadge } from '../components/StageBadge.jsx';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { useInvoices } from '../hooks/useInvoices.js';
import { INVOICE_TYPES, INVOICE_STATUS } from '../lib/invoiceHelpers.js';
import { formatDate, formatCurrency, STAGES, SERVICE_TYPES, ACTIVITY_TYPES } from '../lib/helpers.js';
import { route } from 'preact-router';

export function DealDetail({ id }) {
  const { deal, loading, update, changeStage } = useDeal(id);
  const { activities, refetch: refetchActivities } = useActivities({ dealId: id });
  const { invoices: dealInvoices } = useInvoices({ dealId: id });
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [showActivity, setShowActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: 'note', description: '', due_date: '' });

  if (loading) {
    return (
      <>
        <div class="page-header"><h1 class="page-title">Deal</h1></div>
        <div class="page-body"><div class="loading-center"><div class="spinner" /></div></div>
      </>
    );
  }

  if (!deal) {
    return (
      <>
        <div class="page-header"><h1 class="page-title">Nicht gefunden</h1></div>
        <div class="page-body"><div class="empty-state"><div class="empty-state-text">Deal nicht gefunden</div></div></div>
      </>
    );
  }

  function startEdit() {
    setForm({
      title: deal.title || '',
      value: deal.value || '',
      service_type: deal.service_type || '',
      expected_close: deal.expected_close || '',
      lost_reason: deal.lost_reason || '',
    });
    setEditing(true);
  }

  async function saveEdit() {
    const { error } = await update({
      ...form,
      value: form.value ? parseFloat(form.value) : null,
      service_type: form.service_type || null,
      expected_close: form.expected_close || null,
      lost_reason: form.lost_reason || null,
    });
    if (error) {
      toast.error('Fehler beim Speichern');
    } else {
      toast.success('Deal aktualisiert');
      setEditing(false);
    }
  }

  async function handleStageChange(newStage) {
    const { error } = await changeStage(newStage);
    if (error) {
      toast.error('Fehler beim Aendern');
    } else {
      toast.success(`Stage auf "${STAGES[newStage].label}" geaendert`);
      refetchActivities();
    }
  }

  async function addActivity(e) {
    e.preventDefault();
    const { error } = await createActivity({
      deal_id: id,
      contact_id: deal.contact_id || null,
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

  return (
    <>
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <button class="btn btn-secondary btn-sm" onClick={() => route('/crm/pipeline')}>←</button>
          <h1 class="page-title">{deal.title}</h1>
          <StageBadge stage={deal.stage} />
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" onClick={() => setShowActivity(true)}>+ Aktivitaet</button>
          <button class="btn btn-secondary btn-sm" onClick={() => route(`/crm/invoices/new?type=quote&deal_id=${id}`)}>+ Angebot</button>
          {deal.stage === 'won' && (
            <button class="btn btn-primary btn-sm" onClick={() => route(`/crm/invoices/new?type=invoice&deal_id=${id}`)}>+ Rechnung</button>
          )}
          {!editing && <button class="btn btn-secondary btn-sm" onClick={startEdit}>Bearbeiten</button>}
        </div>
      </div>

      <div class="page-body">
        <div class="detail-grid">
          <div class="detail-main">
            <div class="card">
              <div class="card-header"><span class="card-title">Deal-Infos</span></div>
              {editing ? (
                <div>
                  <div class="form-grid">
                    <div class="form-group form-group-full">
                      <label>Titel</label>
                      <input value={form.title} onInput={e => setForm({...form, title: e.target.value})} />
                    </div>
                    <div class="form-group">
                      <label>Wert (EUR)</label>
                      <input type="number" step="0.01" value={form.value} onInput={e => setForm({...form, value: e.target.value})} />
                    </div>
                    <div class="form-group">
                      <label>Service-Typ</label>
                      <select value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})}>
                        <option value="">–</option>
                        {Object.entries(SERVICE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Erwarteter Abschluss</label>
                      <input type="date" value={form.expected_close} onInput={e => setForm({...form, expected_close: e.target.value})} />
                    </div>
                    {deal.stage === 'lost' && (
                      <div class="form-group">
                        <label>Verlustgrund</label>
                        <input value={form.lost_reason} onInput={e => setForm({...form, lost_reason: e.target.value})} />
                      </div>
                    )}
                  </div>
                  <div class="form-actions">
                    <button class="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Abbrechen</button>
                    <button class="btn btn-primary btn-sm" onClick={saveEdit}>Speichern</button>
                  </div>
                </div>
              ) : (
                <div class="form-grid">
                  <div class="detail-field">
                    <span class="detail-label">Titel</span>
                    <span class="detail-value">{deal.title}</span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-label">Wert</span>
                    <span class="detail-value">{deal.value ? formatCurrency(deal.value) : '–'}</span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-label">Service</span>
                    <span class="detail-value">{deal.service_type ? SERVICE_TYPES[deal.service_type] : '–'}</span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-label">Erwarteter Abschluss</span>
                    <span class="detail-value">{formatDate(deal.expected_close)}</span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-label">Kontakt</span>
                    <span class="detail-value">
                      {deal.contact
                        ? <a href="#" onClick={(e) => { e.preventDefault(); route(`/crm/contacts/${deal.contact.id}`); }}>
                            {`${deal.contact.first_name || ''} ${deal.contact.last_name || ''}`.trim() || deal.contact.email}
                          </a>
                        : '–'}
                    </span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-label">Firma</span>
                    <span class="detail-value">
                      {deal.company
                        ? <a href="#" onClick={(e) => { e.preventDefault(); route(`/crm/companies/${deal.company.id}`); }}>{deal.company.name}</a>
                        : '–'}
                    </span>
                  </div>
                  {deal.lost_reason && (
                    <div class="detail-field form-group-full">
                      <span class="detail-label">Verlustgrund</span>
                      <span class="detail-value">{deal.lost_reason}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div class="card">
              <div class="card-header"><span class="card-title">Stage aendern</span></div>
              <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
                {Object.entries(STAGES).map(([key, info]) => (
                  <button
                    key={key}
                    class={`btn btn-sm ${deal.stage === key ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => deal.stage !== key && handleStageChange(key)}
                    disabled={deal.stage === key}
                    style={deal.stage === key ? `background:${info.color}` : ''}
                  >
                    {info.label}
                  </button>
                ))}
              </div>
            </div>

            {dealInvoices.length > 0 && (
              <div class="card">
                <div class="card-header"><span class="card-title">Rechnungen / Angebote ({dealInvoices.length})</span></div>
                <div class="table-wrapper">
                  <table>
                    <thead><tr><th>Nummer</th><th>Typ</th><th>Status</th><th style="text-align:right">Betrag</th></tr></thead>
                    <tbody>
                      {dealInvoices.map(inv => (
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
              </div>
            )}

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
                <span class="detail-label">Stage geaendert am</span>
                <span class="detail-value">{formatDate(deal.stage_changed_at)}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">Erstellt am</span>
                <span class="detail-value">{formatDate(deal.created_at)}</span>
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
