import { useState, useRef } from 'preact/hooks';
import { Modal } from './Modal.jsx';
import { useImportContacts } from '../hooks/useImportContacts.js';

export function ImportModal({ onClose, onSuccess }) {
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const { parseCSV, importContacts, parsed, importing, progress, results, reset } = useImportContacts();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => parseCSV(ev.target.result);
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    const res = await importContacts();
    if (res && res.errors.length === 0) {
      onSuccess?.();
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const footer = results ? (
    <button class="btn btn-primary btn-sm" onClick={handleClose}>Schliessen</button>
  ) : (
    <>
      <button class="btn btn-secondary btn-sm" onClick={handleClose} disabled={importing}>Abbrechen</button>
      {parsed && (
        <button class="btn btn-primary btn-sm" onClick={handleImport} disabled={importing}>
          {importing ? 'Importiere...' : 'Importieren'}
        </button>
      )}
    </>
  );

  return (
    <Modal title="CSV Import" onClose={handleClose} footer={footer} className="modal-wide">
      {!parsed && !results && (
        <div>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1rem">
            CSV-Datei mit Semikolon- oder Komma-Trennung hochladen. Erwartete Spalten: Firma, Ansprechpartner Vorname/Nachname, Strasse, PLZ, Stadt, Branche, Notiz.
          </p>
          <label class="import-file-label" style="display:flex;align-items:center;justify-content:center;gap:0.5rem;padding:2rem;border:2px dashed var(--border);border-radius:var(--radius-lg);cursor:pointer;color:var(--text-muted);font-size:0.85rem;transition:border-color 0.15s">
            <span>{fileName || 'CSV-Datei auswaehlen...'}</span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFile}
              style="display:none"
            />
          </label>
        </div>
      )}

      {parsed && !results && (
        <div>
          <div style="display:flex;gap:1rem;margin-bottom:1rem">
            <div class="card" style="flex:1;padding:0.75rem;text-align:center">
              <div style="font-size:1.25rem;font-weight:700;color:var(--primary)">{parsed.companyNames.length}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">Firmen</div>
            </div>
            <div class="card" style="flex:1;padding:0.75rem;text-align:center">
              <div style="font-size:1.25rem;font-weight:700;color:var(--primary)">{parsed.contactCount}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">Kontakte</div>
            </div>
          </div>

          {importing && (
            <div style="margin-bottom:1rem">
              <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem">
                <span>Importiere...</span>
                <span>{progress.current}/{progress.total}</span>
              </div>
              <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
                <div style={`height:100%;background:var(--primary);border-radius:3px;transition:width 0.2s;width:${progress.total ? (progress.current / progress.total * 100) : 0}%`} />
              </div>
            </div>
          )}

          <div class="card" style="padding:0;max-height:240px;overflow-y:auto">
            <table style="font-size:0.8rem">
              <thead>
                <tr>
                  <th style="padding:0.5rem 0.6rem">Firma</th>
                  <th style="padding:0.5rem 0.6rem">Vorname</th>
                  <th style="padding:0.5rem 0.6rem">Nachname</th>
                  <th style="padding:0.5rem 0.6rem">Stadt</th>
                  <th style="padding:0.5rem 0.6rem">Branche</th>
                </tr>
              </thead>
              <tbody>
                {parsed.rows.map((r, i) => (
                  <tr key={i}>
                    <td style="padding:0.4rem 0.6rem">{r.companyName}</td>
                    <td style="padding:0.4rem 0.6rem">{r.firstName || '–'}</td>
                    <td style="padding:0.4rem 0.6rem">{r.lastName || '–'}</td>
                    <td style="padding:0.4rem 0.6rem">{r.city}</td>
                    <td style="padding:0.4rem 0.6rem">{r.industry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {results && (
        <div>
          <div style="display:flex;gap:1rem;margin-bottom:1rem">
            <div class="card" style="flex:1;padding:0.75rem;text-align:center">
              <div style="font-size:1.25rem;font-weight:700;color:var(--success)">{results.created.companies}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">Firmen erstellt</div>
            </div>
            <div class="card" style="flex:1;padding:0.75rem;text-align:center">
              <div style="font-size:1.25rem;font-weight:700;color:var(--success)">{results.created.contacts}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">Kontakte erstellt</div>
            </div>
          </div>
          {(results.skipped.companies > 0 || results.skipped.contacts > 0) && (
            <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem">
              {[
                results.skipped.companies > 0 && `${results.skipped.companies} Firma(en)`,
                results.skipped.contacts > 0 && `${results.skipped.contacts} Kontakt(e)`,
              ].filter(Boolean).join(' und ')} bereits vorhanden (uebersprungen)
            </p>
          )}
          {results.errors.length > 0 && (
            <div style="margin-top:0.75rem">
              <p style="font-size:0.8rem;color:var(--error);font-weight:600;margin-bottom:0.25rem">Fehler:</p>
              {results.errors.map((err, i) => (
                <p key={i} style="font-size:0.8rem;color:var(--error)">{err}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
