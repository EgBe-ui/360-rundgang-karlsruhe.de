import { useState } from 'preact/hooks';
import { useContacts } from '../hooks/useContacts.js';
import { SearchBar } from '../components/SearchBar.jsx';
import { FilterBar } from '../components/FilterBar.jsx';
import { StageBadge } from '../components/StageBadge.jsx';
import { ImportModal } from '../components/ImportModal.jsx';
import { useToast } from '../components/Toast.jsx';
import { SOURCES, formatDate } from '../lib/helpers.js';
import { supabase } from '../lib/supabase.js';
import { route } from 'preact-router';

const SOURCE_FILTERS = Object.entries(SOURCES).map(([value, label]) => ({ value, label }));

export function ContactList() {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const { contacts, loading, refetch } = useContacts({ search, source });
  const toast = useToast();

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === contacts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contacts.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    const count = selected.size;
    if (!confirm(`${count} Kontakt(e) wirklich loeschen?`)) return;
    setDeleting(true);
    const ids = [...selected];
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('contacts')
      .update({ deleted_at: now })
      .in('id', ids);
    if (error) {
      toast.error('Fehler beim Loeschen');
    } else {
      toast.success(`${count} Kontakt(e) geloescht`);
      setSelected(new Set());
      refetch();
    }
    setDeleting(false);
  };

  function exportCSV() {
    if (contacts.length === 0) return;
    const sep = ';';
    const headers = ['Vorname', 'Nachname', 'E-Mail', 'Telefon', 'Position', 'Firma', 'Quelle', 'Erstellt'];
    const rows = contacts.map(c => [
      c.first_name || '',
      c.last_name || '',
      c.email || '',
      c.phone || '',
      c.position || '',
      c.company?.name || '',
      SOURCES[c.source] || c.source || '',
      c.created_at ? c.created_at.slice(0, 10) : '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(sep));

    const csv = '\ufeff' + [headers.join(sep), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kontakte-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div class="page-header">
        <h1 class="page-title">Kontakte</h1>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;justify-content:flex-end">
          {selected.size > 0 && (
            <button class="btn btn-danger btn-sm" onClick={handleBulkDelete} disabled={deleting}>
              {deleting ? 'Loesche...' : `${selected.size} loeschen`}
            </button>
          )}
          <button class="btn btn-secondary btn-sm hide-mobile-sm" onClick={exportCSV} disabled={contacts.length === 0}>
            CSV Export
          </button>
          <button class="btn btn-secondary btn-sm" onClick={() => setShowImport(true)}>
            Import
          </button>
          <button class="btn btn-primary btn-sm" onClick={() => route('/crm/contacts/new')}>
            + Neu
          </button>
        </div>
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
                    <th style="width:40px">
                      <input
                        type="checkbox"
                        checked={selected.size === contacts.length && contacts.length > 0}
                        onChange={toggleAll}
                        style="width:16px;height:16px;cursor:pointer"
                      />
                    </th>
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
                      <td data-label="" onClick={e => e.stopPropagation()} style="width:40px">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={e => toggleSelect(c.id, e)}
                          style="width:16px;height:16px;cursor:pointer"
                        />
                      </td>
                      <td data-label="Name" style="font-weight:500">
                        {c.first_name || c.last_name
                          ? `${c.first_name || ''} ${c.last_name || ''}`.trim()
                          : '–'}
                      </td>
                      <td data-label="E-Mail">
                        {c.email?.endsWith('@platzhalter.de')
                          ? <span style="color:var(--text-dim);font-style:italic">{c.email}</span>
                          : c.email}
                      </td>
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

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            toast.success('Import abgeschlossen');
            refetch();
          }}
        />
      )}
    </>
  );
}
