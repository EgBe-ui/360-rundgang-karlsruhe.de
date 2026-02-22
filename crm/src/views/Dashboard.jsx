import { useDashboard } from '../hooks/useDashboard.js';
import { useInvoiceDashboard } from '../hooks/useInvoices.js';
import { useTasks } from '../hooks/useActivities.js';
import { KPICard } from '../components/KPICard.jsx';
import { ActivityItem } from '../components/ActivityItem.jsx';
import { StageBadge } from '../components/StageBadge.jsx';
import { formatCurrency, formatDate, STAGES } from '../lib/helpers.js';
import { route } from 'preact-router';

export function Dashboard() {
  const { stats, recentActivities, loading } = useDashboard();
  const { stats: invoiceStats } = useInvoiceDashboard();
  const { tasks, complete } = useTasks();

  if (loading) {
    return (
      <>
        <div class="page-header"><h1 class="page-title">Dashboard</h1></div>
        <div class="page-body"><div class="loading-center"><div class="spinner" /></div></div>
      </>
    );
  }

  return (
    <>
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <div style="display:flex;gap:0.5rem">
          <button class="btn btn-primary btn-sm" onClick={() => route('/crm/contacts/new')}>
            + Kontakt
          </button>
          <button class="btn btn-secondary btn-sm" onClick={() => route('/crm/deals/new')}>
            + Deal
          </button>
        </div>
      </div>

      <div class="page-body">
        <div class="grid-4" style="margin-bottom: 1.5rem">
          <KPICard label="Kontakte gesamt" value={stats.totalContacts} />
          <KPICard label="Neue Leads (Monat)" value={stats.newLeadsThisMonth} color="var(--info)" />
          <KPICard label="Pipeline-Wert" value={formatCurrency(stats.pipelineValue)} color="var(--primary-light)" />
          <KPICard label="Conversion-Rate" value={`${stats.conversionRate}%`} color="var(--success)" />
        </div>

        <div class="grid-3" style="margin-bottom: 1.5rem">
          <KPICard label="Offene Rechnungen" value={invoiceStats.openCount} color="var(--warning)" />
          <KPICard label="Offener Betrag" value={formatCurrency(invoiceStats.openAmount)} color="var(--error)" />
          <KPICard label="Umsatz (Monat)" value={formatCurrency(invoiceStats.monthRevenue)} color="var(--success)" />
        </div>

        <div class="grid-2" style="margin-bottom: 1.5rem">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Pipeline-Uebersicht</span>
              <button class="btn btn-secondary btn-sm" onClick={() => route('/crm/pipeline')}>
                Oeffnen
              </button>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.5rem">
              {Object.entries(STAGES).filter(([key]) => key !== 'won' && key !== 'lost').map(([key, info]) => (
                <div key={key} style="display:flex;align-items:center;justify-content:space-between;padding:0.4rem 0">
                  <StageBadge stage={key} />
                  <span style="font-weight:600">{stats.dealsByStage[key] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <span class="card-title">Faellige Aufgaben</span>
            </div>
            {tasks.length === 0 ? (
              <div class="empty-state" style="padding:1rem">
                <div class="empty-state-text">Keine faelligen Aufgaben</div>
              </div>
            ) : (
              <div style="display:flex;flex-direction:column;gap:0.5rem">
                {tasks.slice(0, 5).map(task => (
                  <div key={task.id} style="display:flex;align-items:center;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border)">
                    <div>
                      <div style="font-size:0.85rem">{task.description}</div>
                      <div style="font-size:0.75rem;color:var(--text-dim)">
                        Faellig: {formatDate(task.due_date)}
                        {task.contact && ` — ${task.contact.first_name} ${task.contact.last_name}`}
                      </div>
                    </div>
                    <button class="btn btn-sm btn-secondary" onClick={() => complete(task.id)}>
                      Erledigt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Letzte Aktivitaeten</span>
          </div>
          {recentActivities.length === 0 ? (
            <div class="empty-state">
              <div class="empty-state-icon">📋</div>
              <div class="empty-state-text">Noch keine Aktivitaeten</div>
            </div>
          ) : (
            <div class="timeline">
              {recentActivities.map(a => (
                <ActivityItem key={a.id} activity={a} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
