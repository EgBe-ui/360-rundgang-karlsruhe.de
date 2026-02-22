import { useState } from 'preact/hooks';
import { useCompanies } from '../hooks/useCompanies.js';
import { SearchBar } from '../components/SearchBar.jsx';
import { FilterBar } from '../components/FilterBar.jsx';
import { INDUSTRIES, formatDate } from '../lib/helpers.js';
import { Modal } from '../components/Modal.jsx';
import { createCompany } from '../hooks/useCompanies.js';
import { useToast } from '../components/Toast.jsx';
import { route } from 'preact-router';

const INDUSTRY_FILTERS = INDUSTRIES.map(i => ({ value: i, label: i }));

export function CompanyList() {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState(null);
  const { companies, loading, refetch } = useCompanies({ search, industry });
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', industry: '', city: '', website: '' });
  const toast = useToast();

  async function handleCreate(e) {
    e.preventDefault();
    const { data, error } = await createCompany({
      name: newForm.name,
      industry: newForm.industry || null,
      city: newForm.city || null,
      website: newForm.website || null,
    });
    if (error) {
      toast.error('Fehler beim Erstellen');
    } else {
      toast.success('Firma erstellt');
      setShowNew(false);
      setNewForm({ name: '', industry: '', city: '', website: '' });
      refetch();
    }
  }

  return (
    <>
      <div class="page-header">
        <h1 class="page-title">Firmen</h1>
        <button class="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
          + Neue Firma
        </button>
      </div>

      <div class="page-body">
        <div class="search-bar">
          <SearchBar value={search} onInput={setSearch} placeholder="Firma oder Stadt suchen..." />
        </div>
        <div style="margin-bottom: 1rem">
          <FilterBar filters={INDUSTRY_FILTERS} active={industry} onSelect={setIndustry} />
        </div>

        {loading ? (
          <div class="loading-center"><div class="spinner" /></div>
        ) : companies.length === 0 ? (
          <div class="empty-state">
            <div class="empty-state-icon">🏢</div>
            <div class="empty-state-text">Keine Firmen gefunden</div>
          </div>
        ) : (
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Branche</th>
                    <th>Stadt</th>
                    <th>Website</th>
                    <th>Erstellt</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(c => (
                    <tr key={c.id} class="clickable-row" onClick={() => route(`/crm/companies/${c.id}`)}>
                      <td style="font-weight:500">{c.name}</td>
                      <td>{c.industry || '–'}</td>
                      <td>{c.city || '–'}</td>
                      <td>{c.website ? <a href={c.website} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}>{c.website}</a> : '–'}</td>
                      <td style="color:var(--text-dim)">{formatDate(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showNew && (
        <Modal title="Neue Firma" onClose={() => setShowNew(false)}>
          <form onSubmit={handleCreate}>
            <div class="form-group">
              <label>Firmenname *</label>
              <input required value={newForm.name} onInput={e => setNewForm({...newForm, name: e.target.value})} />
            </div>
            <div class="form-group">
              <label>Branche</label>
              <select value={newForm.industry} onChange={e => setNewForm({...newForm, industry: e.target.value})}>
                <option value="">– Auswaehlen –</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div class="form-group">
              <label>Stadt</label>
              <input value={newForm.city} onInput={e => setNewForm({...newForm, city: e.target.value})} />
            </div>
            <div class="form-group">
              <label>Website</label>
              <input value={newForm.website} onInput={e => setNewForm({...newForm, website: e.target.value})} placeholder="https://" />
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onClick={() => setShowNew(false)}>Abbrechen</button>
              <button type="submit" class="btn btn-primary">Erstellen</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
