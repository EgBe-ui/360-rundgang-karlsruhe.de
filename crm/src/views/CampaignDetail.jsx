import { useState } from 'preact/hooks';
import DOMPurify from 'dompurify';
import { useCampaign, useCampaignRecipients, sendCampaign } from '../hooks/useCampaigns.js';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { CAMPAIGN_STATUS, formatDate, formatDateTime } from '../lib/helpers.js';
import { route } from 'preact-router';

const RECIPIENT_STATUS = {
  pending: { label: 'Ausstehend', color: '#6366f1' },
  sent: { label: 'Gesendet', color: '#3b82f6' },
  opened: { label: 'Geoeffnet', color: '#10b981' },
  clicked: { label: 'Geklickt', color: '#059669' },
  bounced: { label: 'Bounce', color: '#ef4444' },
  unsubscribed: { label: 'Abgemeldet', color: '#94a3b8' },
};

export function CampaignDetail({ id }) {
  const { campaign, loading, update, refetch, remove } = useCampaign(id);
  const { recipients, loading: loadingRecipients, refetch: refetchRecipients } = useCampaignRecipients(id);
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  if (loading) {
    return (
      <>
        <div class="page-header"><h1 class="page-title">Kampagne</h1></div>
        <div class="page-body"><div class="loading-center"><div class="spinner" /></div></div>
      </>
    );
  }

  if (!campaign) {
    return (
      <>
        <div class="page-header"><h1 class="page-title">Nicht gefunden</h1></div>
        <div class="page-body"><div class="empty-state"><div class="empty-state-text">Kampagne nicht gefunden</div></div></div>
      </>
    );
  }

  function startEdit() {
    setForm({
      name: campaign.name || '',
      subject: campaign.subject || '',
      body_html: campaign.body_html || '',
    });
    setEditing(true);
  }

  async function saveEdit() {
    const { error } = await update(form);
    if (error) {
      toast.error('Fehler beim Speichern');
    } else {
      toast.success('Kampagne aktualisiert');
      setEditing(false);
    }
  }

  async function handleSend() {
    setSending(true);
    try {
      const result = await sendCampaign(campaign.id);
      toast.success(`Kampagne gesendet an ${result.total_sent} Empfaenger`);
      refetch();
      refetchRecipients();
    } catch (err) {
      toast.error(err.message || 'Senden fehlgeschlagen');
    }
    setSending(false);
    setShowSendConfirm(false);
  }

  async function handleDelete() {
    const { error } = await remove();
    if (error) {
      toast.error('Fehler beim Loeschen');
    } else {
      toast.success('Kampagne geloescht');
      route('/crm/campaigns');
    }
  }

  const openRate = campaign.total_sent > 0
    ? Math.round((campaign.total_opened / campaign.total_sent) * 100)
    : 0;
  const clickRate = campaign.total_sent > 0
    ? Math.round((campaign.total_clicked / campaign.total_sent) * 100)
    : 0;

  return (
    <>
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <button class="btn btn-secondary btn-sm" onClick={() => route('/crm/campaigns')}>←</button>
          <h1 class="page-title">{campaign.name}</h1>
          <span
            class="stage-badge"
            style={`background:${CAMPAIGN_STATUS[campaign.status]?.color || '#6366f1'}15;color:${CAMPAIGN_STATUS[campaign.status]?.color || '#6366f1'};`}
          >
            {CAMPAIGN_STATUS[campaign.status]?.label || campaign.status}
          </span>
        </div>
        <div style="display:flex;gap:0.5rem">
          {campaign.status === 'draft' && (
            <>
              {!editing && <button class="btn btn-secondary btn-sm" onClick={startEdit}>Bearbeiten</button>}
              <button class="btn btn-primary btn-sm" onClick={() => setShowSendConfirm(true)}>Senden</button>
              <button class="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>Loeschen</button>
            </>
          )}
        </div>
      </div>

      <div class="page-body">
        <div class="detail-grid">
          <div class="detail-main">
            {/* Stats (only for sent campaigns) */}
            {campaign.status === 'sent' && (
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1rem;">
                <div class="card" style="text-align:center;padding:1.25rem;">
                  <div class="kpi-value">{campaign.total_sent}</div>
                  <div class="kpi-label">Gesendet</div>
                </div>
                <div class="card" style="text-align:center;padding:1.25rem;">
                  <div class="kpi-value">{campaign.total_opened} <span style="font-size:0.85rem;color:var(--text-dim)">({openRate}%)</span></div>
                  <div class="kpi-label">Geoeffnet</div>
                </div>
                <div class="card" style="text-align:center;padding:1.25rem;">
                  <div class="kpi-value">{campaign.total_clicked} <span style="font-size:0.85rem;color:var(--text-dim)">({clickRate}%)</span></div>
                  <div class="kpi-label">Geklickt</div>
                </div>
              </div>
            )}

            {/* Campaign details */}
            <div class="card">
              <div class="card-header"><span class="card-title">Kampagnen-Details</span></div>
              {editing ? (
                <div>
                  <div class="form-grid">
                    <div class="form-group form-group-full">
                      <label>Name</label>
                      <input value={form.name} onInput={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div class="form-group form-group-full">
                      <label>Betreff</label>
                      <input value={form.subject} onInput={e => setForm({...form, subject: e.target.value})} />
                    </div>
                    <div class="form-group form-group-full">
                      <label>Inhalt (HTML)</label>
                      <textarea
                        value={form.body_html}
                        onInput={e => setForm({...form, body_html: e.target.value})}
                        style="width:100%;min-height:200px;font-family:monospace;font-size:0.8rem;"
                      />
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
                    <span class="detail-label">Betreff</span>
                    <span class="detail-value">{campaign.subject}</span>
                  </div>
                  <div class="detail-field">
                    <span class="detail-label">Erstellt am</span>
                    <span class="detail-value">{formatDateTime(campaign.created_at)}</span>
                  </div>
                  {campaign.sent_at && (
                    <div class="detail-field">
                      <span class="detail-label">Gesendet am</span>
                      <span class="detail-value">{formatDateTime(campaign.sent_at)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Email preview */}
            <div class="card">
              <div class="card-header"><span class="card-title">E-Mail-Vorschau</span></div>
              <div
                style="border:1px solid var(--border);border-radius:8px;padding:1rem;background:#fff;max-height:400px;overflow:auto;"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(campaign.body_html) }}
              />
            </div>

            {/* Recipients table */}
            <div class="card">
              <div class="card-header"><span class="card-title">Empfaenger ({recipients.length})</span></div>
              {loadingRecipients ? (
                <div class="loading-center"><div class="spinner" /></div>
              ) : recipients.length === 0 ? (
                <div style="color:var(--text-dim);font-size:0.85rem">Keine Empfaenger</div>
              ) : (
                <div class="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>E-Mail</th>
                        <th>Status</th>
                        <th>Geoeffnet</th>
                        <th>Geklickt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.map(r => (
                        <tr key={r.id}>
                          <td>
                            {r.contact
                              ? <a href="#" onClick={e => { e.preventDefault(); route(`/crm/contacts/${r.contact_id}`); }}>
                                  {`${r.contact.first_name || ''} ${r.contact.last_name || ''}`.trim() || r.email}
                                </a>
                              : r.email}
                          </td>
                          <td>{r.email}</td>
                          <td>
                            <span
                              class="stage-badge"
                              style={`background:${RECIPIENT_STATUS[r.status]?.color || '#6366f1'}15;color:${RECIPIENT_STATUS[r.status]?.color || '#6366f1'};`}
                            >
                              {RECIPIENT_STATUS[r.status]?.label || r.status}
                            </span>
                          </td>
                          <td style="color:var(--text-dim)">{r.opened_at ? formatDateTime(r.opened_at) : '–'}</td>
                          <td style="color:var(--text-dim)">{r.clicked_at ? formatDateTime(r.clicked_at) : '–'}</td>
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
                <span class="detail-label">Status</span>
                <span class="detail-value">{CAMPAIGN_STATUS[campaign.status]?.label}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">Erstellt</span>
                <span class="detail-value">{formatDate(campaign.created_at)}</span>
              </div>
              {campaign.sent_at && (
                <div class="detail-field">
                  <span class="detail-label">Gesendet</span>
                  <span class="detail-value">{formatDate(campaign.sent_at)}</span>
                </div>
              )}
              <div class="detail-field">
                <span class="detail-label">Empfaenger</span>
                <span class="detail-value">{recipients.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send confirmation */}
      {showSendConfirm && (
        <Modal title="Kampagne senden?" onClose={() => setShowSendConfirm(false)}>
          <p style="margin-bottom:1rem;">
            Die Kampagne "<strong>{campaign.name}</strong>" wird jetzt versendet. Nur Kontakte mit DSGVO-Einwilligung erhalten die E-Mail.
          </p>
          <div class="form-actions">
            <button class="btn btn-secondary" onClick={() => setShowSendConfirm(false)}>Abbrechen</button>
            <button class="btn btn-primary" onClick={handleSend} disabled={sending}>
              {sending ? 'Sende...' : 'Jetzt senden'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {showDelete && (
        <Modal title="Kampagne loeschen?" onClose={() => setShowDelete(false)}>
          <p style="margin-bottom:1rem;">
            Die Kampagne "<strong>{campaign.name}</strong>" wird unwiderruflich geloescht.
          </p>
          <div class="form-actions">
            <button class="btn btn-secondary" onClick={() => setShowDelete(false)}>Abbrechen</button>
            <button class="btn btn-danger" onClick={handleDelete}>Loeschen</button>
          </div>
        </Modal>
      )}
    </>
  );
}
