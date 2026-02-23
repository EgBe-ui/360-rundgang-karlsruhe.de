import { useState } from 'preact/hooks';
import { useCampaigns } from '../hooks/useCampaigns.js';
import { FilterBar } from '../components/FilterBar.jsx';
import { CAMPAIGN_STATUS, formatDate } from '../lib/helpers.js';
import { route } from 'preact-router';

const STATUS_FILTERS = Object.entries(CAMPAIGN_STATUS).map(([value, { label }]) => ({ value, label }));

export function CampaignList() {
  const [status, setStatus] = useState(null);
  const { campaigns, loading } = useCampaigns({ status });

  return (
    <>
      <div class="page-header">
        <h1 class="page-title">Kampagnen</h1>
        <button class="btn btn-primary btn-sm" onClick={() => route('/crm/campaigns/new')}>
          + Neue Kampagne
        </button>
      </div>

      <div class="page-body">
        <div style="margin-bottom: 1rem">
          <FilterBar filters={STATUS_FILTERS} active={status} onSelect={setStatus} />
        </div>

        {loading ? (
          <div class="loading-center"><div class="spinner" /></div>
        ) : campaigns.length === 0 ? (
          <div class="empty-state">
            <div class="empty-state-icon">📧</div>
            <div class="empty-state-text">Keine Kampagnen gefunden</div>
          </div>
        ) : (
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Betreff</th>
                    <th>Status</th>
                    <th>Gesendet</th>
                    <th>Geoeffnet</th>
                    <th>Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => (
                    <tr key={c.id} class="clickable-row" onClick={() => route(`/crm/campaigns/${c.id}`)}>
                      <td data-label="Name" style="font-weight:500">{c.name}</td>
                      <td data-label="Betreff">{c.subject}</td>
                      <td data-label="Status">
                        <span
                          class="stage-badge"
                          style={`background:${CAMPAIGN_STATUS[c.status]?.color || '#6366f1'}15;color:${CAMPAIGN_STATUS[c.status]?.color || '#6366f1'};`}
                        >
                          {CAMPAIGN_STATUS[c.status]?.label || c.status}
                        </span>
                      </td>
                      <td data-label="Gesendet">{c.total_sent || 0}</td>
                      <td data-label="Geoeffnet">{c.total_opened || 0}</td>
                      <td data-label="Datum" style="color:var(--text-dim)">{formatDate(c.sent_at || c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
