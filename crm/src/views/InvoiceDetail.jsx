import { useInvoice, convertQuoteToInvoice, deleteInvoice, useBusinessSettings } from '../hooks/useInvoices.js';
import { INVOICE_TYPES, INVOICE_STATUS } from '../lib/invoiceHelpers.js';
import { formatDate, formatCurrency } from '../lib/helpers.js';
import { generateInvoicePdf } from '../lib/generateInvoicePdf.js';
import { useToast } from '../components/Toast.jsx';
import { route } from 'preact-router';

export function InvoiceDetail({ id }) {
  const { invoice, items, loading, update, refetch } = useInvoice(id);
  const { settings } = useBusinessSettings();
  const toast = useToast();

  if (loading) {
    return (
      <>
        <div class="page-header"><h1 class="page-title">Rechnung</h1></div>
        <div class="page-body"><div class="loading-center"><div class="spinner" /></div></div>
      </>
    );
  }

  if (!invoice) {
    return (
      <>
        <div class="page-header"><h1 class="page-title">Nicht gefunden</h1></div>
        <div class="page-body"><div class="empty-state"><div class="empty-state-text">Dokument nicht gefunden</div></div></div>
      </>
    );
  }

  const isQuote = invoice.type === 'quote';
  const typeLabel = INVOICE_TYPES[invoice.type]?.label || 'Dokument';

  async function markAsSent() {
    const { error } = await update({ status: 'sent' });
    if (error) toast.error('Fehler');
    else toast.success('Als versendet markiert');
  }

  async function markAsPaid() {
    const { error } = await update({
      status: 'paid',
      paid_date: new Date().toISOString().slice(0, 10),
      paid_amount: invoice.total_amount,
    });
    if (error) toast.error('Fehler');
    else toast.success('Als bezahlt markiert');
  }

  async function handleConvert() {
    const { data, error } = await convertQuoteToInvoice(id);
    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      toast.success('In Rechnung umgewandelt');
      route(`/crm/invoices/${data.id}`);
    }
  }

  async function handleDelete() {
    if (!confirm(`${typeLabel} "${invoice.invoice_number}" wirklich loeschen?`)) return;
    const { error } = await deleteInvoice(id);
    if (error) toast.error('Fehler');
    else {
      toast.success('Geloescht');
      route('/crm/invoices');
    }
  }

  function handleDownloadPdf() {
    generateInvoicePdf(invoice, items, settings);
  }

  function handleEdit() {
    route(`/crm/invoices/new?edit=${id}`);
  }

  return (
    <>
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <button class="btn btn-secondary btn-sm" onClick={() => route('/crm/invoices')}>←</button>
          <h1 class="page-title">{invoice.invoice_number}</h1>
          <span
            class="stage-badge"
            style={`color:${INVOICE_STATUS[invoice.status]?.color};background:${INVOICE_STATUS[invoice.status]?.color}20`}
          >
            {INVOICE_STATUS[invoice.status]?.label}
          </span>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onClick={handleDownloadPdf}>
            PDF herunterladen
          </button>
          {invoice.status === 'draft' && (
            <>
              <button class="btn btn-secondary btn-sm" onClick={handleEdit}>Bearbeiten</button>
              <button class="btn btn-secondary btn-sm" onClick={markAsSent}>Als versendet markieren</button>
              {isQuote && (
                <button class="btn btn-primary btn-sm" onClick={handleConvert}>In Rechnung umwandeln</button>
              )}
              <button class="btn btn-danger btn-sm" onClick={handleDelete}>Loeschen</button>
            </>
          )}
          {invoice.status === 'sent' && !isQuote && (
            <button class="btn btn-primary btn-sm" onClick={markAsPaid}>Als bezahlt markieren</button>
          )}
        </div>
      </div>

      <div class="page-body">
        <div class="detail-grid">
          <div class="detail-main">
            {/* Dokument-Info */}
            <div class="card">
              <div class="card-header"><span class="card-title">{typeLabel}</span></div>
              <div class="form-grid">
                <div class="detail-field">
                  <span class="detail-label">{isQuote ? 'Angebotsnr.' : 'Rechnungsnr.'}</span>
                  <span class="detail-value">{invoice.invoice_number}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Typ</span>
                  <span class="detail-value">{typeLabel}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Datum</span>
                  <span class="detail-value">{formatDate(invoice.invoice_date)}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">{isQuote ? 'Gueltig bis' : 'Faellig am'}</span>
                  <span class="detail-value">{formatDate(invoice.due_date)}</span>
                </div>
                {invoice.paid_date && (
                  <div class="detail-field">
                    <span class="detail-label">Bezahlt am</span>
                    <span class="detail-value">{formatDate(invoice.paid_date)}</span>
                  </div>
                )}
                {invoice.converted_from_quote_id && (
                  <div class="detail-field">
                    <span class="detail-label">Erstellt aus Angebot</span>
                    <span class="detail-value">
                      <a href="#" onClick={e => { e.preventDefault(); route(`/crm/invoices/${invoice.converted_from_quote_id}`); }}>
                        Angebot anzeigen
                      </a>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Kunde */}
            <div class="card">
              <div class="card-header"><span class="card-title">Kunde</span></div>
              <div class="form-grid">
                <div class="detail-field">
                  <span class="detail-label">Firma</span>
                  <span class="detail-value">
                    {invoice.company_id ? (
                      <a href="#" onClick={e => { e.preventDefault(); route(`/crm/companies/${invoice.company_id}`); }}>
                        {invoice.customer_company || '–'}
                      </a>
                    ) : (invoice.customer_company || '–')}
                  </span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Ansprechpartner</span>
                  <span class="detail-value">{invoice.customer_name || '–'}</span>
                </div>
                <div class="detail-field form-group-full">
                  <span class="detail-label">Adresse</span>
                  <span class="detail-value">
                    {[invoice.customer_street, `${invoice.customer_zip || ''} ${invoice.customer_city || ''}`.trim()].filter(Boolean).join(', ') || '–'}
                  </span>
                </div>
              </div>
            </div>

            {/* Positionen */}
            <div class="card">
              <div class="card-header"><span class="card-title">Positionen</span></div>
              <div class="table-wrapper">
                <table class="line-items-table">
                  <thead>
                    <tr>
                      <th>Bezeichnung</th>
                      <th style="text-align:right">Menge</th>
                      <th style="text-align:right">Einzelpreis</th>
                      <th style="text-align:right">Gesamt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div>{item.description}</div>
                          {item.sub_description && (
                            <div style="font-size:0.8rem;color:var(--text-muted)">{item.sub_description}</div>
                          )}
                        </td>
                        <td style="text-align:right">{item.quantity}</td>
                        <td style="text-align:right">{formatCurrency(item.unit_price)}</td>
                        <td style="text-align:right;font-weight:500">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div class="invoice-totals" style="margin-top:1rem">
                <div class="invoice-totals-row">
                  <span>Zwischensumme</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {parseFloat(invoice.discount_percent) > 0 && (
                  <div class="invoice-totals-row">
                    <span>Rabatt (-{invoice.discount_percent}%)</span>
                    <span>-{formatCurrency(invoice.subtotal - invoice.net_amount)}</span>
                  </div>
                )}
                <div class="invoice-totals-row">
                  <span>Nettobetrag</span>
                  <span>{formatCurrency(invoice.net_amount)}</span>
                </div>
                <div class="invoice-totals-row">
                  <span>{invoice.vat_rate}% MwSt.</span>
                  <span>{formatCurrency(invoice.vat_amount)}</span>
                </div>
                <div class="invoice-totals-row" style="font-weight:700;font-size:1.1rem;border-top:2px solid var(--border);padding-top:0.5rem">
                  <span>Gesamtbetrag</span>
                  <span>{formatCurrency(invoice.total_amount)}</span>
                </div>
                {invoice.status === 'paid' && (
                  <div class="invoice-totals-row" style="font-weight:700;color:var(--success)">
                    <span>Bezahlt</span>
                    <span>{formatCurrency(invoice.paid_amount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Texte */}
            {(invoice.payment_terms || invoice.closing_message) && (
              <div class="card">
                <div class="card-header"><span class="card-title">Texte</span></div>
                {invoice.payment_terms && (
                  <div class="detail-field">
                    <span class="detail-label">Zahlungsbedingungen</span>
                    <span class="detail-value" style="white-space:pre-wrap">{invoice.payment_terms}</span>
                  </div>
                )}
                {invoice.closing_message && (
                  <div class="detail-field">
                    <span class="detail-label">Schlussnachricht</span>
                    <span class="detail-value" style="white-space:pre-wrap">{invoice.closing_message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div class="detail-sidebar">
            <div class="card">
              <div class="detail-field">
                <span class="detail-label">Status</span>
                <span class="detail-value">
                  <span
                    class="stage-badge"
                    style={`color:${INVOICE_STATUS[invoice.status]?.color};background:${INVOICE_STATUS[invoice.status]?.color}20`}
                  >
                    {INVOICE_STATUS[invoice.status]?.label}
                  </span>
                </span>
              </div>
              {invoice.deal_id && (
                <div class="detail-field">
                  <span class="detail-label">Deal</span>
                  <span class="detail-value">
                    <a href="#" onClick={e => { e.preventDefault(); route(`/crm/deals/${invoice.deal_id}`); }}>
                      Deal anzeigen
                    </a>
                  </span>
                </div>
              )}
              <div class="detail-field">
                <span class="detail-label">Erstellt am</span>
                <span class="detail-value">{formatDate(invoice.created_at)}</span>
              </div>
              <div class="detail-field">
                <span class="detail-label">Aktualisiert</span>
                <span class="detail-value">{formatDate(invoice.updated_at)}</span>
              </div>
              {invoice.notes && (
                <div class="detail-field">
                  <span class="detail-label">Interne Notizen</span>
                  <span class="detail-value" style="white-space:pre-wrap;font-size:0.8rem">{invoice.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
