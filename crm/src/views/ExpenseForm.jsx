import { useState, useEffect } from 'preact/hooks';
import { createExpense, updateExpense, deleteExpense, useExpense } from '../hooks/useExpenses.js';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, formatCurrency } from '../lib/helpers.js';
import { useToast } from '../components/Toast.jsx';
import { route } from 'preact-router';

export function ExpenseForm() {
  const toast = useToast();

  const params = new URLSearchParams(window.location.search);
  const editId = params.get('edit');

  const { expense: editExpense, loading: editLoading } = useExpense(editId);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'other',
    description: '',
    amount: '',
    vat_rate: 19,
    vendor: '',
    receipt_ref: '',
    payment_method: 'bank_transfer',
    notes: '',
  });

  // Pre-fill from edit
  useEffect(() => {
    if (!editId || editLoading || !editExpense) return;
    setForm({
      date: editExpense.date || '',
      category: editExpense.category || 'other',
      description: editExpense.description || '',
      amount: editExpense.amount || '',
      vat_rate: editExpense.vat_rate != null ? editExpense.vat_rate : 19,
      vendor: editExpense.vendor || '',
      receipt_ref: editExpense.receipt_ref || '',
      payment_method: editExpense.payment_method || 'bank_transfer',
      notes: editExpense.notes || '',
    });
  }, [editId, editLoading, editExpense]);

  // Auto-calculate netto + vat
  const brutto = parseFloat(form.amount) || 0;
  const vatRate = parseFloat(form.vat_rate) || 0;
  const netAmount = vatRate > 0 ? brutto / (1 + vatRate / 100) : brutto;
  const vatAmount = brutto - netAmount;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description || !form.amount) {
      toast.error('Beschreibung und Betrag sind Pflichtfelder');
      return;
    }

    setSaving(true);
    const data = {
      date: form.date,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
      net_amount: Math.round(netAmount * 100) / 100,
      vat_amount: Math.round(vatAmount * 100) / 100,
      vat_rate: parseFloat(form.vat_rate) || 0,
      vendor: form.vendor || null,
      receipt_ref: form.receipt_ref || null,
      payment_method: form.payment_method,
      notes: form.notes || null,
    };

    let result;
    if (editId) {
      result = await updateExpense(editId, data);
      if (!result.error) {
        toast.success('Ausgabe gespeichert');
        route('/crm/expenses');
      }
    } else {
      result = await createExpense(data);
      if (!result.error) {
        toast.success('Ausgabe erstellt');
        route('/crm/expenses');
      }
    }

    if (result.error) {
      toast.error('Fehler: ' + result.error.message);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm('Ausgabe wirklich loeschen?')) return;
    const { error } = await deleteExpense(editId);
    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      toast.success('Ausgabe geloescht');
      route('/crm/expenses');
    }
  }

  if (editId && editLoading) {
    return (
      <>
        <div class="page-header"><h1 class="page-title">Laden...</h1></div>
        <div class="page-body"><div class="loading-center"><div class="spinner" /></div></div>
      </>
    );
  }

  return (
    <>
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <button class="btn btn-secondary btn-sm" onClick={() => route('/crm/expenses')}>←</button>
          <h1 class="page-title">{editId ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'}</h1>
        </div>
        {editId && (
          <button class="btn btn-danger btn-sm" onClick={handleDelete}>Loeschen</button>
        )}
      </div>

      <div class="page-body">
        <form onSubmit={handleSubmit} style="max-width:640px">
          <div class="card" style="margin-bottom:1.5rem">
            <div class="card-header"><span class="card-title">Ausgabe</span></div>
            <div class="form-grid">
              <div class="form-group">
                <label>Datum</label>
                <input
                  type="date"
                  value={form.date}
                  onInput={e => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div class="form-group">
                <label>Kategorie</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div class="form-group form-group-full">
                <label>Beschreibung</label>
                <input
                  value={form.description}
                  onInput={e => setForm({ ...form, description: e.target.value })}
                  required
                  placeholder="z.B. Matterport-Lizenz, Bueroeinrichtung..."
                />
              </div>
              <div class="form-group">
                <label>Betrag brutto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onInput={e => setForm({ ...form, amount: e.target.value })}
                  required
                  style="text-align:right"
                />
              </div>
              <div class="form-group">
                <label>MwSt-Satz (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.vat_rate}
                  onInput={e => setForm({ ...form, vat_rate: e.target.value })}
                  style="max-width:100px;text-align:right"
                />
              </div>
              <div class="form-group">
                <label>Lieferant</label>
                <input
                  value={form.vendor}
                  onInput={e => setForm({ ...form, vendor: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div class="form-group">
                <label>Belegnummer</label>
                <input
                  value={form.receipt_ref}
                  onInput={e => setForm({ ...form, receipt_ref: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div class="form-group">
                <label>Zahlungsart</label>
                <select
                  value={form.payment_method}
                  onChange={e => setForm({ ...form, payment_method: e.target.value })}
                >
                  {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div class="form-group form-group-full">
                <label>Notizen</label>
                <textarea
                  value={form.notes}
                  onInput={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Auto-calculated preview */}
            {brutto > 0 && (
              <div style="margin-top:1rem;padding:1rem;background:var(--bg-secondary);border-radius:8px">
                <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:0.25rem">
                  <span>Nettobetrag</span>
                  <span>{formatCurrency(netAmount)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:0.25rem">
                  <span>{form.vat_rate}% MwSt.</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:0.95rem;font-weight:700;border-top:1px solid var(--border);padding-top:0.5rem;margin-top:0.25rem">
                  <span>Bruttobetrag</span>
                  <span>{formatCurrency(brutto)}</span>
                </div>
              </div>
            )}
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onClick={() => route('/crm/expenses')}>
              Abbrechen
            </button>
            <button type="submit" class="btn btn-primary" disabled={saving}>
              {saving ? 'Speichern...' : (editId ? 'Speichern' : 'Erstellen')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
