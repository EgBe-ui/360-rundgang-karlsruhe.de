import { useState } from 'preact/hooks';
import { createContact } from '../hooks/useContacts.js';
import { useCompanies, createCompany } from '../hooks/useCompanies.js';
import { useToast } from '../components/Toast.jsx';
import { SOURCES } from '../lib/helpers.js';
import { route } from 'preact-router';

export function ContactForm() {
  const toast = useToast();
  const { companies } = useCompanies();
  const [loading, setLoading] = useState(false);
  const [companyMode, setCompanyMode] = useState('none'); // none | existing | new
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    source: 'manual',
    source_detail: '',
    company_id: '',
    new_company_name: '',
    gdpr_consent: false,
  });

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let company_id = null;

      if (companyMode === 'existing' && form.company_id) {
        company_id = form.company_id;
      } else if (companyMode === 'new' && form.new_company_name.trim()) {
        const { data: company, error: companyError } = await createCompany({
          name: form.new_company_name.trim(),
        });
        if (companyError) throw companyError;
        company_id = company.id;
      }

      const { data, error } = await createContact({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || null,
        position: form.position || null,
        source: form.source,
        source_detail: form.source_detail || null,
        company_id,
        gdpr_consent: form.gdpr_consent,
        gdpr_consent_at: form.gdpr_consent ? new Date().toISOString() : null,
      });

      if (error) throw error;
      toast.success('Kontakt erstellt');
      route(`/crm/contacts/${data.id}`);
    } catch (err) {
      toast.error(err.message || 'Fehler beim Erstellen');
    }

    setLoading(false);
  }

  return (
    <>
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <button class="btn btn-secondary btn-sm" onClick={() => route('/crm/contacts')}>←</button>
          <h1 class="page-title">Neuer Kontakt</h1>
        </div>
      </div>

      <div class="page-body">
        <div class="card" style="max-width: 640px">
          <form onSubmit={handleSubmit}>
            <div class="form-grid">
              <div class="form-group">
                <label>Vorname</label>
                <input value={form.first_name} onInput={e => setField('first_name', e.target.value)} />
              </div>
              <div class="form-group">
                <label>Nachname</label>
                <input value={form.last_name} onInput={e => setField('last_name', e.target.value)} />
              </div>
              <div class="form-group">
                <label>E-Mail *</label>
                <input type="email" required value={form.email} onInput={e => setField('email', e.target.value)} />
              </div>
              <div class="form-group">
                <label>Telefon</label>
                <input type="tel" value={form.phone} onInput={e => setField('phone', e.target.value)} />
              </div>
              <div class="form-group">
                <label>Position</label>
                <input value={form.position} onInput={e => setField('position', e.target.value)} placeholder="z.B. Geschaeftsfuehrer" />
              </div>
              <div class="form-group">
                <label>Firma</label>
                <div style="display:flex;gap:0.25rem;margin-bottom:0.5rem">
                  <button type="button" class={`filter-pill ${companyMode === 'none' ? 'active' : ''}`} onClick={() => setCompanyMode('none')}>Keine</button>
                  <button type="button" class={`filter-pill ${companyMode === 'existing' ? 'active' : ''}`} onClick={() => setCompanyMode('existing')}>Bestehende</button>
                  <button type="button" class={`filter-pill ${companyMode === 'new' ? 'active' : ''}`} onClick={() => setCompanyMode('new')}>Neue</button>
                </div>
                {companyMode === 'existing' && (
                  <select value={form.company_id} onChange={e => setField('company_id', e.target.value)}>
                    <option value="">– Firma waehlen –</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                {companyMode === 'new' && (
                  <input value={form.new_company_name} onInput={e => setField('new_company_name', e.target.value)} placeholder="Neuer Firmenname" />
                )}
              </div>
              <div class="form-group">
                <label>Quelle</label>
                <select value={form.source} onChange={e => setField('source', e.target.value)}>
                  {Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div class="form-group">
                <label>Quelle (Detail)</label>
                <input value={form.source_detail} onInput={e => setField('source_detail', e.target.value)} placeholder="z.B. Blog: Hotels" />
              </div>
              <div class="form-group form-group-full">
                <label style="display:flex;align-items:center;gap:0.5rem;text-transform:none;font-size:0.85rem;cursor:pointer">
                  <input type="checkbox" checked={form.gdpr_consent} onChange={e => setField('gdpr_consent', e.target.checked)} style="width:auto" />
                  DSGVO-Einwilligung erteilt
                </label>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onClick={() => route('/crm/contacts')}>Abbrechen</button>
              <button type="submit" class="btn btn-primary" disabled={loading}>
                {loading ? 'Erstelle...' : 'Kontakt erstellen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
