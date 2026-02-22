import { useState } from 'preact/hooks';
import { useRevenueStats } from '../hooks/useRevenueStats.js';
import { useBusinessSettings } from '../hooks/useInvoices.js';
import { formatCurrency, EXPENSE_CATEGORIES, MONTHS } from '../lib/helpers.js';
import { generateEuerPdf } from '../lib/generateEuerPdf.js';
import { useToast } from '../components/Toast.jsx';

export function RevenueReports() {
  const toast = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  const { stats, monthlyData, quarterlyData, expensesByCategory, loading } = useRevenueStats({ year });
  const { settings } = useBusinessSettings();

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) years.push(y);

  function handlePdfExport() {
    if (!stats) return;
    generateEuerPdf({ year, monthlyData, quarterlyData, stats, settings });
    toast.success('PDF erstellt');
  }

  function handleCsvExport() {
    if (!monthlyData.length) return;

    const header = 'Monat,Einnahmen Brutto,Einnahmen Netto,MwSt erhalten,Ausgaben Brutto,Ausgaben Netto,MwSt gezahlt,Gewinn';
    const rows = monthlyData.map(m =>
      [
        MONTHS[m.month - 1],
        m.incomeBrutto.toFixed(2).replace('.', ','),
        m.incomeNetto.toFixed(2).replace('.', ','),
        m.vatCollected.toFixed(2).replace('.', ','),
        m.expensesBrutto.toFixed(2).replace('.', ','),
        m.expensesNetto.toFixed(2).replace('.', ','),
        m.vatPaid.toFixed(2).replace('.', ','),
        m.profit.toFixed(2).replace('.', ','),
      ]
        .map(v => `"${v}"`)
        .join(';')
    );

    // Totals row
    const t = monthlyData.reduce(
      (acc, m) => ({
        ib: acc.ib + m.incomeBrutto,
        in_: acc.in_ + m.incomeNetto,
        vc: acc.vc + m.vatCollected,
        eb: acc.eb + m.expensesBrutto,
        en: acc.en + m.expensesNetto,
        vp: acc.vp + m.vatPaid,
        p: acc.p + m.profit,
      }),
      { ib: 0, in_: 0, vc: 0, eb: 0, en: 0, vp: 0, p: 0 }
    );
    rows.push(
      [
        'Summe',
        t.ib.toFixed(2).replace('.', ','),
        t.in_.toFixed(2).replace('.', ','),
        t.vc.toFixed(2).replace('.', ','),
        t.eb.toFixed(2).replace('.', ','),
        t.en.toFixed(2).replace('.', ','),
        t.vp.toFixed(2).replace('.', ','),
        t.p.toFixed(2).replace('.', ','),
      ]
        .map(v => `"${v}"`)
        .join(';')
    );

    const csv = [header.split(',').map(h => `"${h}"`).join(';'), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EUER-${year}-Beck360.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV erstellt');
  }

  const totalExpenses = Object.values(expensesByCategory).reduce((s, v) => s + v, 0);

  return (
    <>
      <div class="page-header">
        <h1 class="page-title">Berichte</h1>
        <div style="display:flex;gap:0.5rem;align-items:center">
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            style="min-width:100px"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button class="btn btn-primary btn-sm" onClick={handlePdfExport} disabled={loading}>
            PDF Export
          </button>
          <button class="btn btn-secondary btn-sm" onClick={handleCsvExport} disabled={loading}>
            CSV Export
          </button>
        </div>
      </div>

      <div class="page-body">
        {loading ? (
          <div class="loading-center"><div class="spinner" /></div>
        ) : !stats ? (
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-text">Keine Daten verfuegbar</div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div class="grid-4" style="margin-bottom:1.5rem">
              <div class="card" style="text-align:center;padding:1.25rem">
                <div style="font-size:0.8rem;color:var(--text-dim);margin-bottom:0.25rem">Jahresumsatz brutto</div>
                <div style="font-size:1.5rem;font-weight:700;color:#10b981">{formatCurrency(stats.yearRevenue)}</div>
              </div>
              <div class="card" style="text-align:center;padding:1.25rem">
                <div style="font-size:0.8rem;color:var(--text-dim);margin-bottom:0.25rem">Ausgaben gesamt</div>
                <div style="font-size:1.5rem;font-weight:700;color:#ef4444">{formatCurrency(stats.yearExpenses)}</div>
              </div>
              <div class="card" style="text-align:center;padding:1.25rem">
                <div style="font-size:0.8rem;color:var(--text-dim);margin-bottom:0.25rem">Gewinn (netto)</div>
                <div style="font-size:1.5rem;font-weight:700;color:var(--brand)">{formatCurrency(stats.yearProfit)}</div>
              </div>
              <div class="card" style="text-align:center;padding:1.25rem">
                <div style="font-size:0.8rem;color:var(--text-dim);margin-bottom:0.25rem">Offene Rechnungen</div>
                <div style="font-size:1.5rem;font-weight:700;color:#f59e0b">{formatCurrency(stats.openInvoices)}</div>
              </div>
            </div>

            {/* Monthly Overview */}
            <div class="card" style="margin-bottom:1.5rem">
              <div class="card-header"><span class="card-title">Monatsuebersicht {year}</span></div>
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Monat</th>
                      <th style="text-align:right">Einnahmen brutto</th>
                      <th style="text-align:right">Einnahmen netto</th>
                      <th style="text-align:right">Ausgaben brutto</th>
                      <th style="text-align:right">MwSt erh.</th>
                      <th style="text-align:right">MwSt gez.</th>
                      <th style="text-align:right">Gewinn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map(m => (
                      <tr key={m.month}>
                        <td>{MONTHS[m.month - 1]}</td>
                        <td style="text-align:right">{formatCurrency(m.incomeBrutto)}</td>
                        <td style="text-align:right">{formatCurrency(m.incomeNetto)}</td>
                        <td style="text-align:right">{formatCurrency(m.expensesBrutto)}</td>
                        <td style="text-align:right">{formatCurrency(m.vatCollected)}</td>
                        <td style="text-align:right">{formatCurrency(m.vatPaid)}</td>
                        <td style={`text-align:right;font-weight:600;color:${m.profit >= 0 ? '#10b981' : '#ef4444'}`}>
                          {formatCurrency(m.profit)}
                        </td>
                      </tr>
                    ))}
                    <tr style="font-weight:700;border-top:2px solid var(--border)">
                      <td>Summe</td>
                      <td style="text-align:right">{formatCurrency(monthlyData.reduce((s, m) => s + m.incomeBrutto, 0))}</td>
                      <td style="text-align:right">{formatCurrency(monthlyData.reduce((s, m) => s + m.incomeNetto, 0))}</td>
                      <td style="text-align:right">{formatCurrency(monthlyData.reduce((s, m) => s + m.expensesBrutto, 0))}</td>
                      <td style="text-align:right">{formatCurrency(monthlyData.reduce((s, m) => s + m.vatCollected, 0))}</td>
                      <td style="text-align:right">{formatCurrency(monthlyData.reduce((s, m) => s + m.vatPaid, 0))}</td>
                      <td style={`text-align:right;color:${stats.yearProfit >= 0 ? '#10b981' : '#ef4444'}`}>
                        {formatCurrency(stats.yearProfit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quarterly Overview */}
            <div class="card" style="margin-bottom:1.5rem">
              <div class="card-header"><span class="card-title">Quartalsuebersicht {year}</span></div>
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Quartal</th>
                      <th style="text-align:right">Einnahmen brutto</th>
                      <th style="text-align:right">Einnahmen netto</th>
                      <th style="text-align:right">Ausgaben brutto</th>
                      <th style="text-align:right">MwSt erh.</th>
                      <th style="text-align:right">MwSt gez.</th>
                      <th style="text-align:right">Gewinn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quarterlyData.map(q => (
                      <tr key={q.quarter}>
                        <td>Q{q.quarter}</td>
                        <td style="text-align:right">{formatCurrency(q.incomeBrutto)}</td>
                        <td style="text-align:right">{formatCurrency(q.incomeNetto)}</td>
                        <td style="text-align:right">{formatCurrency(q.expensesBrutto)}</td>
                        <td style="text-align:right">{formatCurrency(q.vatCollected)}</td>
                        <td style="text-align:right">{formatCurrency(q.vatPaid)}</td>
                        <td style={`text-align:right;font-weight:600;color:${q.profit >= 0 ? '#10b981' : '#ef4444'}`}>
                          {formatCurrency(q.profit)}
                        </td>
                      </tr>
                    ))}
                    <tr style="font-weight:700;border-top:2px solid var(--border)">
                      <td>Summe</td>
                      <td style="text-align:right">{formatCurrency(stats.yearRevenue)}</td>
                      <td style="text-align:right">{formatCurrency(stats.yearRevenueNetto)}</td>
                      <td style="text-align:right">{formatCurrency(stats.yearExpenses)}</td>
                      <td style="text-align:right">{formatCurrency(stats.vatCollected)}</td>
                      <td style="text-align:right">{formatCurrency(stats.vatPaid)}</td>
                      <td style={`text-align:right;color:${stats.yearProfit >= 0 ? '#10b981' : '#ef4444'}`}>
                        {formatCurrency(stats.yearProfit)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expenses by Category */}
            {Object.keys(expensesByCategory).length > 0 && (
              <div class="card" style="margin-bottom:1.5rem">
                <div class="card-header"><span class="card-title">Ausgaben nach Kategorie</span></div>
                <div class="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Kategorie</th>
                        <th style="text-align:right">Betrag</th>
                        <th style="text-align:right">Anteil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(expensesByCategory)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cat, amount]) => (
                          <tr key={cat}>
                            <td>{EXPENSE_CATEGORIES[cat] || cat}</td>
                            <td style="text-align:right">{formatCurrency(amount)}</td>
                            <td style="text-align:right">
                              {totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : 0} %
                            </td>
                          </tr>
                        ))}
                      <tr style="font-weight:700;border-top:2px solid var(--border)">
                        <td>Gesamt</td>
                        <td style="text-align:right">{formatCurrency(totalExpenses)}</td>
                        <td style="text-align:right">100 %</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* EUER Summary */}
            <div class="card" style="margin-bottom:1.5rem">
              <div class="card-header"><span class="card-title">EUER-Zusammenfassung {year}</span></div>
              <div style="padding:0.5rem 0">
                <div style="display:flex;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--border)">
                  <span>Betriebseinnahmen (netto)</span>
                  <span style="font-weight:600">{formatCurrency(stats.yearRevenueNetto)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--border)">
                  <span>Betriebsausgaben (netto)</span>
                  <span style="font-weight:600;color:#ef4444">{formatCurrency(stats.yearExpensesNetto)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:0.75rem 0;border-bottom:2px solid var(--border);font-weight:700;font-size:1.1rem">
                  <span>Gewinn vor Steuern</span>
                  <span style={`color:${stats.yearProfit >= 0 ? '#10b981' : '#ef4444'}`}>{formatCurrency(stats.yearProfit)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--border);margin-top:0.5rem">
                  <span>MwSt. erhalten</span>
                  <span>{formatCurrency(stats.vatCollected)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--border)">
                  <span>MwSt. gezahlt (Vorsteuer)</span>
                  <span>{formatCurrency(stats.vatPaid)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:0.75rem 0;font-weight:700">
                  <span>MwSt.-Zahllast</span>
                  <span>{formatCurrency(stats.vatPayable)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
