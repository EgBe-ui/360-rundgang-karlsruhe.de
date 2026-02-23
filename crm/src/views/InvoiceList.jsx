import { useState } from 'preact/hooks';
import { useInvoices, deleteInvoice } from '../hooks/useInvoices.js';
import { INVOICE_TYPES, INVOICE_STATUS } from '../lib/invoiceHelpers.js';
import { formatDate, formatCurrency } from '../lib/helpers.js';
import { useToast } from '../components/Toast.jsx';
import { route } from 'preact-router';

export function InvoiceList() {
  const [typeFilter, setTypeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const { invoices, loading, refetch } = useInvoices({ type: typeFilter, status: statusFilter });
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  function toggleSelect(id, e) {
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === invoices.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(invoices.map(i => i.id)));
    }
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`${selected.size} Dokument${selected.size > 1 ? 'e' : ''} wirklich loeschen?`)) return;
    setDeleting(true);
    let errors = 0;
    for (const id of selected) {
      const { error } = await deleteInvoice(id);
      if (error) errors++;
    }
    setDeleting(false);
    setSelected(new Set());
    await refetch();
    if (errors) toast.error(`${errors} Fehler beim Loeschen`);
    else toast.success(`${selected.size === 0 ? '' : 'Geloescht'}`);
  }

  return (
    <>
      <div class="page-header">
        <h1 class="page-title">Rechnungen & Angebote</h1>
        <div style="display:flex;gap:0.5rem;align-items:center">
          {selected.size > 0 && (
            <button
              class="btn btn-danger btn-sm"
              onClick={handleDeleteSelected}
              disabled={deleting}
            >
              {deleting ? 'Loesche...' : `${selected.size} loeschen`}
            </button>
          )}
          <button class="btn btn-primary btn-sm" onClick={() => route('/crm/invoices/new?type=invoice')}>
            + Rechnung
          </button>
          <button class="btn btn-secondary btn-sm" onClick={() => route('/crm/invoices/new?type=quote')}>
            + Angebot
          </button>
        </div>
      </div>

      <div class="page-body">
        <div class="search-bar">
          <div class="filter-pills">
            <button
              class={`filter-pill ${!typeFilter ? 'active' : ''}`}
              onClick={() => setTypeFilter(null)}
            >
              Alle
            </button>
            {Object.entries(INVOICE_TYPES).map(([key, info]) => (
              <button
                key={key}
                class={`filter-pill ${typeFilter === key ? 'active' : ''}`}
                onClick={() => setTypeFilter(typeFilter === key ? null : key)}
              >
                {info.label}
              </button>
            ))}
          </div>
          <div class="filter-pills">
            {Object.entries(INVOICE_STATUS).map(([key, info]) => (
              <button
                key={key}
                class={`filter-pill ${statusFilter === key ? 'active' : ''}`}
                onClick={() => setStatusFilter(statusFilter === key ? null : key)}
              >
                {info.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div class="loading-center"><div class="spinner" /></div>
        ) : invoices.length === 0 ? (
          <div class="empty-state">
            <div class="empty-state-icon">📄</div>
            <div class="empty-state-text">Keine Rechnungen oder Angebote</div>
          </div>
        ) : (
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style="width:2.5rem;padding-right:0">
                      <input
                        type="checkbox"
                        checked={selected.size === invoices.length}
                        onChange={toggleAll}
                        style="cursor:pointer"
                      />
                    </th>
                    <th>Nummer</th>
                    <th>Typ</th>
                    <th>Kunde</th>
                    <th>Datum</th>
                    <th>Status</th>
                    <th style="text-align:right">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr
                      key={inv.id}
                      class="clickable-row"
                      onClick={() => route(`/crm/invoices/${inv.id}`)}
                      style={selected.has(inv.id) ? 'background:var(--brand-light, rgba(26,92,107,0.08))' : ''}
                    >
                      <td style="padding-right:0" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(inv.id)}
                          onChange={e => toggleSelect(inv.id, e)}
                          style="cursor:pointer"
                        />
                      </td>
                      <td data-label="Nummer" style="font-weight:600">{inv.invoice_number}</td>
                      <td data-label="Typ">
                        <span style={`font-size:0.75rem;padding:0.15rem 0.5rem;border-radius:999px;background:${inv.type === 'quote' ? 'rgba(139,92,246,0.15);color:#a78bfa' : 'rgba(59,130,246,0.15);color:#60a5fa'}`}>
                          {INVOICE_TYPES[inv.type]?.label}
                        </span>
                      </td>
                      <td data-label="Kunde">{inv.customer_company || inv.customer_name || '–'}</td>
                      <td data-label="Datum">{formatDate(inv.invoice_date)}</td>
                      <td data-label="Status">
                        <span
                          class="stage-badge"
                          style={`color:${INVOICE_STATUS[inv.status]?.color};background:${INVOICE_STATUS[inv.status]?.color}20`}
                        >
                          {INVOICE_STATUS[inv.status]?.label}
                        </span>
                      </td>
                      <td data-label="Betrag" style="text-align:right;font-weight:600">{formatCurrency(inv.total_amount)}</td>
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
