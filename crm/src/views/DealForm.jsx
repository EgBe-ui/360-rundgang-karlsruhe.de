import { useState, useEffect } from 'preact/hooks';
import { createDeal } from '../hooks/useDeals.js';
import { useContacts } from '../hooks/useContacts.js';
import { useToast } from '../components/Toast.jsx';
import { SERVICE_TYPES } from '../lib/helpers.js';
import { route } from 'preact-router';

export function DealForm() {
  const toast = useToast();
  const { contacts } = useContacts();
  const [loading, setLoading] = useState(false);

  // Pre-fill contact_id from URL params
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const prefilledContactId = params.get('contact_id') || '';

  const [form, setForm] = useState({
    title: '',
    contact_id: prefilledContactId,
    service_type: '',
    value: '',
    expected_close: '',
  });

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // Get company_id from selected contact
      let company_id = null;
      if (form.contact_id) {
        const contact = contacts.find(c => c.id === form.contact_id);
        company_id = contact?.company_id || null;
      }

      const { data, error } = await createDeal({
        title: form.title,
        contact_id: form.contact_id || null,
        company_id,
        service_type: form.service_type || null,
        value: form.value ? parseFloat(form.value) : null,
        expected_close: form.expected_close || null,
      });

      if (error) throw error;
      toast.success('Deal erstellt');
      route(`/crm/deals/${data.id}`);
    } catch (err) {
      toast.error(err.message || 'Fehler beim Erstellen');
    }

    setLoading(false);
  }

  return (
    <>
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <button class="btn btn-secondary btn-sm" onClick={() => route('/crm/pipeline')}>←</button>
          <h1 class="page-title">Neuer Deal</h1>
        </div>
      </div>

      <div class="page-body">
        <div class="card" style="max-width: 640px">
          <form onSubmit={handleSubmit}>
            <div class="form-grid">
              <div class="form-group form-group-full">
                <label>Titel *</label>
                <input
                  required
                  value={form.title}
                  onInput={e => setField('title', e.target.value)}
                  placeholder="z.B. 360-Tour Restaurant Bellini"
                />
              </div>
              <div class="form-group">
                <label>Kontakt</label>
                <select value={form.contact_id} onChange={e => setField('contact_id', e.target.value)}>
                  <option value="">– Auswaehlen –</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {`${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email}
                    </option>
                  ))}
                </select>
              </div>
              <div class="form-group">
                <label>Service-Typ</label>
                <select value={form.service_type} onChange={e => setField('service_type', e.target.value)}>
                  <option value="">– Auswaehlen –</option>
                  {Object.entries(SERVICE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div class="form-group">
                <label>Wert (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.value}
                  onInput={e => setField('value', e.target.value)}
                  placeholder="z.B. 1200"
                />
              </div>
              <div class="form-group">
                <label>Erwarteter Abschluss</label>
                <input
                  type="date"
                  value={form.expected_close}
                  onInput={e => setField('expected_close', e.target.value)}
                />
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onClick={() => route('/crm/pipeline')}>Abbrechen</button>
              <button type="submit" class="btn btn-primary" disabled={loading}>
                {loading ? 'Erstelle...' : 'Deal erstellen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
