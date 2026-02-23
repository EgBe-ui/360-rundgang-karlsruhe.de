import { useState } from 'preact/hooks';
import { useContacts } from '../hooks/useContacts.js';
import { SearchBar } from '../components/SearchBar.jsx';
import { FilterBar } from '../components/FilterBar.jsx';
import { StageBadge } from '../components/StageBadge.jsx';
import { SOURCES, formatDate } from '../lib/helpers.js';
import { route } from 'preact-router';

const SOURCE_FILTERS = Object.entries(SOURCES).map(([value, label]) => ({ value, label }));

export function ContactList() {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState(null);
  const { contacts, loading } = useContacts({ search, source });

  return (
    <>
      <div class="page-header">
        <h1 class="page-title">Kontakte</h1>
        <button class="btn btn-primary btn-sm" onClick={() => route('/crm/contacts/new')}>
          + Neuer Kontakt
        </button>
      </div>

      <div class="page-body">
        <div class="search-bar">
          <SearchBar value={search} onInput={setSearch} placeholder="Name oder E-Mail suchen..." />
        </div>
        <div style="margin-bottom: 1rem">
          <FilterBar filters={SOURCE_FILTERS} active={source} onSelect={setSource} />
        </div>

        {loading ? (
          <div class="loading-center"><div class="spinner" /></div>
        ) : contacts.length === 0 ? (
          <div class="empty-state">
            <div class="empty-state-icon">👥</div>
            <div class="empty-state-text">Keine Kontakte gefunden</div>
          </div>
        ) : (
          <div class="card">
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>E-Mail</th>
                    <th>Firma</th>
                    <th>Quelle</th>
                    <th>Erstellt</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(c => (
                    <tr key={c.id} class="clickable-row" onClick={() => route(`/crm/contacts/${c.id}`)}>
                      <td data-label="Name" style="font-weight:500">
                        {c.first_name || c.last_name
                          ? `${c.first_name || ''} ${c.last_name || ''}`.trim()
                          : '–'}
                      </td>
                      <td data-label="E-Mail">{c.email}</td>
                      <td data-label="Firma">{c.company?.name || '–'}</td>
                      <td data-label="Quelle">
                        <span class="filter-pill" style="cursor:default;font-size:0.7rem;padding:0.15rem 0.5rem">
                          {SOURCES[c.source] || c.source}
                        </span>
                      </td>
                      <td data-label="Erstellt" style="color:var(--text-dim)">{formatDate(c.created_at)}</td>
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
