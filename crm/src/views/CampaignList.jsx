import { useState } from 'preact/hooks';
import { useCampaigns, deleteAllCampaigns } from '../hooks/useCampaigns.js';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { FilterBar } from '../components/FilterBar.jsx';
import { CAMPAIGN_STATUS, formatDate } from '../lib/helpers.js';
import { route } from 'preact-router';

const STATUS_FILTERS = Object.entries(CAMPAIGN_STATUS).map(([value, { label }]) => ({ value, label }));

export function CampaignList() {
  const [status, setStatus] = useState(null);
  const { campaigns, loading, refetch } = useCampaigns({ status });
  const toast = useToast();
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAll() {
    setDeleting(true);
    const { error } = await deleteAllCampaigns();
    if (error) {
      toast.error('Fehler beim Loeschen');
    } else {
      toast.success('Alle Kampagnen geloescht');
      refetch();
    }
    setDeleting(false);
    setShowDeleteAll(false);
  }

  const draftCount = campaigns.filter(c => c.status === 'draft').length;
  const sentCount = campaigns.filter(c => c.status === 'sent').length;

  return (
    <>
      <div class="page-header">
        <h1 class="page-title">Kampagnen</h1>
        <div style="display:flex;gap:0.5rem">
          {campaigns.length > 0 && (
            <button class="btn btn-danger btn-sm" onClick={() => setShowDeleteAll(true)}>
              Alle loeschen
            </button>
          )}
          <button class="btn btn-primary btn-sm" onClick={() => route('/crm/campaigns/new')}>
            + Neue Kampagne
          </button>
        </div>
      </div>

      <div class="page-body">
        {/* KPI Summary */}
        {!loading && campaigns.length > 0 && (
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:1.5rem;">
            <div style="background:linear-gradient(135deg,#6358DE 0%,#7c6ff7 100%);border-radius:var(--radius-lg);padding:1.25rem;color:#fff;">
              <div style="font-size:2rem;font-weight:700;line-height:1">{campaigns.length}</div>
              <div style="font-size:0.8rem;opacity:0.85;margin-top:0.25rem">Gesamt</div>
            </div>
            <div style="background:linear-gradient(135deg,#0B996F 0%,#10b981 100%);border-radius:var(--radius-lg);padding:1.25rem;color:#fff;">
              <div style="font-size:2rem;font-weight:700;line-height:1">{sentCount}</div>
              <div style="font-size:0.8rem;opacity:0.85;margin-top:0.25rem">Versendet</div>
            </div>
            <div style="background:linear-gradient(135deg,#1a5c6b 0%,#237a8c 100%);border-radius:var(--radius-lg);padding:1.25rem;color:#fff;">
              <div style="font-size:2rem;font-weight:700;line-height:1">{draftCount}</div>
              <div style="font-size:0.8rem;opacity:0.85;margin-top:0.25rem">Entwuerfe</div>
            </div>
            <div style="background:linear-gradient(135deg,#f59e0b 0%,#fbbf24 100%);border-radius:var(--radius-lg);padding:1.25rem;color:#fff;">
              <div style="font-size:2rem;font-weight:700;line-height:1">
                {campaigns.reduce((s, c) => s + (c.total_sent || 0), 0)}
              </div>
              <div style="font-size:0.8rem;opacity:0.85;margin-top:0.25rem">Mails gesendet</div>
            </div>
          </div>
        )}

        <div style="margin-bottom:1rem">
          <FilterBar filters={STATUS_FILTERS} active={status} onSelect={setStatus} />
        </div>

        {loading ? (
          <div class="loading-center"><div class="spinner" /></div>
        ) : campaigns.length === 0 ? (
          <div class="empty-state">
            <div class="empty-state-icon">📧</div>
            <div class="empty-state-text">Keine Kampagnen gefunden</div>
            <button class="btn btn-primary" style="margin-top:1rem" onClick={() => route('/crm/campaigns/new')}>
              Erste Kampagne erstellen
            </button>
          </div>
        ) : (
          <div style="display:flex;flex-direction:column;gap:0.75rem;">
            {campaigns.map(c => {
              const statusInfo = CAMPAIGN_STATUS[c.status] || {};
              const openRate = c.total_sent > 0 ? Math.round((c.total_opened / c.total_sent) * 100) : 0;
              return (
                <div
                  key={c.id}
                  onClick={() => route(`/crm/campaigns/${c.id}`)}
                  style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem;cursor:pointer;transition:all 0.2s;box-shadow:var(--shadow);"
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.borderColor = '#6358DE'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;">
                    <div style="flex:1;min-width:200px;">
                      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.35rem;">
                        <span style="font-weight:600;font-size:1rem;">{c.name}</span>
                        <span
                          class="stage-badge"
                          style={`background:${statusInfo.color || '#6366f1'}15;color:${statusInfo.color || '#6366f1'};`}
                        >
                          {statusInfo.label || c.status}
                        </span>
                      </div>
                      <div style="font-size:0.85rem;color:var(--text-muted);">{c.subject}</div>
                    </div>
                    <div style="display:flex;gap:1.5rem;align-items:center;">
                      {c.status === 'sent' && (
                        <>
                          <div style="text-align:center;">
                            <div style="font-size:1.1rem;font-weight:700;color:#6358DE;">{c.total_sent || 0}</div>
                            <div style="font-size:0.7rem;color:var(--text-dim);">Gesendet</div>
                          </div>
                          <div style="text-align:center;">
                            <div style="font-size:1.1rem;font-weight:700;color:#0B996F;">{openRate}%</div>
                            <div style="font-size:0.7rem;color:var(--text-dim);">Geoeffnet</div>
                          </div>
                        </>
                      )}
                      <div style="font-size:0.8rem;color:var(--text-dim);">
                        {formatDate(c.sent_at || c.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showDeleteAll && (
        <Modal title="Alle Kampagnen loeschen?" onClose={() => setShowDeleteAll(false)}>
          <p style="margin-bottom:1rem;">
            <strong>{campaigns.length} Kampagne(n)</strong> werden unwiderruflich geloescht. Dieser Vorgang kann nicht rueckgaengig gemacht werden.
          </p>
          <div class="form-actions">
            <button class="btn btn-secondary" onClick={() => setShowDeleteAll(false)}>Abbrechen</button>
            <button class="btn btn-danger" onClick={handleDeleteAll} disabled={deleting}>
              {deleting ? 'Loesche...' : 'Alle loeschen'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
