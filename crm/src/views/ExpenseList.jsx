import { useState } from 'preact/hooks';
import { useExpenses } from '../hooks/useExpenses.js';
import { formatDate, formatCurrency, EXPENSE_CATEGORIES, MONTHS } from '../lib/helpers.js';
import { route } from 'preact-router';

export function ExpenseList() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(null);
  const [category, setCategory] = useState(null);

  const { expenses, loading } = useExpenses({ year, month, category });

  const totalMonth = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const totalYear = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const count = expenses.length;

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) years.push(y);

  return (
    <>
      <div class="page-header">
        <h1 class="page-title">Ausgaben</h1>
        <button class="btn btn-primary btn-sm" onClick={() => route('/crm/expenses/new')}>
          + Ausgabe
        </button>
      </div>

      <div class="page-body">
        {/* Filters */}
        <div class="search-bar" style="flex-wrap:wrap;gap:0.75rem">
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            style="min-width:100px"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={month || ''}
            onChange={e => setMonth(e.target.value ? parseInt(e.target.value) : null)}
            style="min-width:130px"
          >
            <option value="">Alle Monate</option>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <div class="filter-pills">
            <button
              class={`filter-pill ${!category ? 'active' : ''}`}
              onClick={() => setCategory(null)}
            >
              Alle
            </button>
            {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
              <button
                key={key}
                class={`filter-pill ${category === key ? 'active' : ''}`}
                onClick={() => setCategory(category === key ? null : key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div class="grid-3" style="margin-bottom:1.5rem">
          <div class="card" style="text-align:center;padding:1.25rem">
            <div style="font-size:0.8rem;color:var(--text-dim);margin-bottom:0.25rem">
              Ausgaben {month ? MONTHS[month - 1] : 'Zeitraum'}
            </div>
            <div style="font-size:1.5rem;font-weight:700;color:#ef4444">{formatCurrency(totalMonth)}</div>
          </div>
          <div class="card" style="text-align:center;padding:1.25rem">
            <div style="font-size:0.8rem;color:var(--text-dim);margin-bottom:0.25rem">Ausgaben {year}</div>
            <div style="font-size:1.5rem;font-weight:700;color:#ef4444">{formatCurrency(totalYear)}</div>
          </div>
          <div class="card" style="text-align:center;padding:1.25rem">
            <div style="font-size:0.8rem;color:var(--text-dim);margin-bottom:0.25rem">Anzahl Belege</div>
            <div style="font-size:1.5rem;font-weight:700">{count}</div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div class="loading-center"><div class="spinner" /></div>
        ) : expenses.length === 0 ? (
          <div class="empty-state">
            <div class="empty-state-icon">💸</div>
            <div class="empty-state-text">Keine Ausgaben gefunden</div>
          </div>
        ) : (
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Kategorie</th>
                    <th>Beschreibung</th>
                    <th>Lieferant</th>
                    <th style="text-align:right">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr
                      key={exp.id}
                      class="clickable-row"
                      onClick={() => route(`/crm/expenses/new?edit=${exp.id}`)}
                    >
                      <td data-label="Datum">{formatDate(exp.date)}</td>
                      <td data-label="Kategorie">
                        <span style="font-size:0.75rem;padding:0.15rem 0.5rem;border-radius:999px;background:rgba(239,68,68,0.12);color:#ef4444">
                          {EXPENSE_CATEGORIES[exp.category] || exp.category}
                        </span>
                      </td>
                      <td data-label="Beschreibung">{exp.description}</td>
                      <td data-label="Lieferant">{exp.vendor || '–'}</td>
                      <td data-label="Betrag" style="text-align:right;font-weight:600">{formatCurrency(exp.amount)}</td>
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
