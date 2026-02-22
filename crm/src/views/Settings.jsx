import { useState } from 'preact/hooks';
import { useAuth } from '../lib/auth.jsx';
import { supabase } from '../lib/supabase.js';
import { useToast } from '../components/Toast.jsx';

export function Settings() {
  const { user } = useAuth();
  const toast = useToast();

  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  async function changePassword(e) {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.confirm) {
      toast.error('Passwoerter stimmen nicht ueberein');
      return;
    }
    if (passwordForm.password.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      toast.success('Passwort geaendert');
      setPasswordForm({ password: '', confirm: '' });
    }
    setSaving(false);
  }

  async function exportContacts() {
    const { data, error } = await supabase
      .from('contacts')
      .select('first_name, last_name, email, phone, source, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Export fehlgeschlagen');
      return;
    }

    const csv = [
      'Vorname,Nachname,E-Mail,Telefon,Quelle,Erstellt',
      ...data.map(c =>
        [c.first_name, c.last_name, c.email, c.phone, c.source, c.created_at]
          .map(v => `"${(v || '').toString().replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beck360-kontakte-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export erstellt');
  }

  async function purgeDeleted() {
    if (!confirm('Alle geloeschten Kontakte endgueltig entfernen? Dies kann nicht rueckgaengig gemacht werden.')) return;

    const { error } = await supabase
      .from('contacts')
      .delete()
      .not('deleted_at', 'is', null);

    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      toast.success('Geloeschte Kontakte endgueltig entfernt');
    }
  }

  return (
    <>
      <div class="page-header">
        <h1 class="page-title">Einstellungen</h1>
      </div>

      <div class="page-body">
        <div style="display:flex;flex-direction:column;gap:1.5rem;max-width:640px">
          <div class="card">
            <div class="card-header"><span class="card-title">Konto</span></div>
            <div class="detail-field">
              <span class="detail-label">E-Mail</span>
              <span class="detail-value">{user?.email}</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">User ID</span>
              <span class="detail-value" style="font-size:0.75rem;color:var(--text-dim);word-break:break-all">{user?.id}</span>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span class="card-title">Passwort aendern</span></div>
            <form onSubmit={changePassword}>
              <div class="form-group">
                <label>Neues Passwort</label>
                <input
                  type="password"
                  value={passwordForm.password}
                  onInput={e => setPasswordForm({...passwordForm, password: e.target.value})}
                  minLength={8}
                  required
                  autocomplete="new-password"
                />
              </div>
              <div class="form-group">
                <label>Passwort bestaetigen</label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onInput={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                  minLength={8}
                  required
                  autocomplete="new-password"
                />
              </div>
              <button type="submit" class="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Speichern...' : 'Passwort aendern'}
              </button>
            </form>
          </div>

          <div class="card">
            <div class="card-header"><span class="card-title">DSGVO-Tools</span></div>
            <div style="display:flex;flex-direction:column;gap:0.75rem">
              <div>
                <div style="font-size:0.85rem;margin-bottom:0.35rem">Kontakte als CSV exportieren</div>
                <button class="btn btn-secondary btn-sm" onClick={exportContacts}>
                  CSV Export
                </button>
              </div>
              <div>
                <div style="font-size:0.85rem;margin-bottom:0.35rem">Geloeschte Kontakte endgueltig entfernen (Recht auf Loeschung)</div>
                <button class="btn btn-danger btn-sm" onClick={purgeDeleted}>
                  Endgueltig loeschen
                </button>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><span class="card-title">System-Info</span></div>
            <div class="detail-field">
              <span class="detail-label">Version</span>
              <span class="detail-value">1.0.0</span>
            </div>
            <div class="detail-field">
              <span class="detail-label">Datenbank</span>
              <span class="detail-value">Supabase (Frankfurt, EU)</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
