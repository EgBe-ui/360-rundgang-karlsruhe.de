import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '../lib/auth.jsx';
import { supabase } from '../lib/supabase.js';
import { useBusinessSettings } from '../hooks/useInvoices.js';
import { useToast } from '../components/Toast.jsx';

export function Settings() {
  const { user } = useAuth();
  const toast = useToast();

  const { settings: bizSettings, save: saveBizSettings, loading: bizLoading } = useBusinessSettings();

  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [bizForm, setBizForm] = useState({});
  const [bizEditing, setBizEditing] = useState(false);
  const [bizSaving, setBizSaving] = useState(false);

  useEffect(() => {
    if (bizSettings) {
      setBizForm({
        company_name: bizSettings.company_name || '',
        owner_name: bizSettings.owner_name || '',
        address_line1: bizSettings.address_line1 || '',
        address_zip: bizSettings.address_zip || '',
        address_city: bizSettings.address_city || '',
        phone: bizSettings.phone || '',
        email: bizSettings.email || '',
        website: bizSettings.website || '',
        tax_id: bizSettings.tax_id || '',
        vat_id: bizSettings.vat_id || '',
        bank_name: bizSettings.bank_name || '',
        bank_iban: bizSettings.bank_iban || '',
        bank_bic: bizSettings.bank_bic || '',
        default_payment_days: bizSettings.default_payment_days || 14,
        vat_rate: bizSettings.vat_rate || 19,
        default_closing_text: bizSettings.default_closing_text || '',
      });
    }
  }, [bizSettings]);

  async function saveBizForm(e) {
    e.preventDefault();
    setBizSaving(true);
    const { error } = await saveBizSettings({
      ...bizForm,
      default_payment_days: parseInt(bizForm.default_payment_days) || 14,
      vat_rate: parseFloat(bizForm.vat_rate) || 19,
    });
    if (error) toast.error('Fehler: ' + error.message);
    else {
      toast.success('Geschaeftsdaten gespeichert');
      setBizEditing(false);
    }
    setBizSaving(false);
  }

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
            <div class="card-header">
              <span class="card-title">Geschaeftsdaten</span>
              {!bizEditing && <button class="btn btn-secondary btn-sm" onClick={() => setBizEditing(true)}>Bearbeiten</button>}
            </div>
            {bizLoading ? (
              <div class="loading-center"><div class="spinner" /></div>
            ) : bizEditing ? (
              <form onSubmit={saveBizForm}>
                <div class="form-grid">
                  <div class="form-group">
                    <label>Firmenname</label>
                    <input value={bizForm.company_name} onInput={e => setBizForm({...bizForm, company_name: e.target.value})} />
                  </div>
                  <div class="form-group">
                    <label>Inhaber</label>
                    <input value={bizForm.owner_name} onInput={e => setBizForm({...bizForm, owner_name: e.target.value})} />
                  </div>
                  <div class="form-group">
                    <label>Adresse</label>
                    <input value={bizForm.address_line1} onInput={e => setBizForm({...bizForm, address_line1: e.target.value})} />
                  </div>
                  <div class="form-group">
                    <label>PLZ</label>
                    <input value={bizForm.address_zip} onInput={e => setBizForm({...bizForm, address_zip: e.target.value})} style="max-width:120px" />
                  </div>
                  <div class="form-group">
                    <label>Stadt</label>
                    <input value={bizForm.address_city} onInput={e => setBizForm({...bizForm, address_city: e.target.value})} />
                  </div>
                  <div class="form-group">
                    <label>Telefon</label>
                    <input value={bizForm.phone} onInput={e => setBizForm({...bizForm, phone: e.target.value})} />
                  </div>
                  <div class="form-group">
                    <label>E-Mail</label>
                    <input type="email" value={bizForm.email} onInput={e => setBizForm({...bizForm, email: e.target.value})} />
                  </div>
                  <div class="form-group">
                    <label>Website</label>
                    <input value={bizForm.website} onInput={e => setBizForm({...bizForm, website: e.target.value})} />
                  </div>
                  <div class="form-group">
                    <label>Steuernummer</label>
                    <input value={bizForm.tax_id} onInput={e => setBizForm({...bizForm, tax_id: e.target.value})} />
                  </div>
                  <div class="form-group">
                    <label>USt-IdNr.</label>
                    <input value={bizForm.vat_id} onInput={e => setBizForm({...bizForm, vat_id: e.target.value})} />
                  </div>
                  <div class="form-group">
                    <label>Bank</label>
                    <input value={bizForm.bank_name} onInput={e => setBizForm({...bizForm, bank_name: e.target.value})} />
                  </div>
                  <div class="form-group">
                    <label>IBAN</label>
                    <input value={bizForm.bank_iban} onInput={e => setBizForm({...bizForm, bank_iban: e.target.value})} />
                  </div>
                  <div class="form-group">
                    <label>BIC</label>
                    <input value={bizForm.bank_bic} onInput={e => setBizForm({...bizForm, bank_bic: e.target.value})} />
                  </div>
                  <div class="form-group">
                    <label>Zahlungsziel (Tage)</label>
                    <input type="number" value={bizForm.default_payment_days} onInput={e => setBizForm({...bizForm, default_payment_days: e.target.value})} style="max-width:100px" />
                  </div>
                  <div class="form-group">
                    <label>MwSt-Satz (%)</label>
                    <input type="number" step="0.01" value={bizForm.vat_rate} onInput={e => setBizForm({...bizForm, vat_rate: e.target.value})} style="max-width:100px" />
                  </div>
                  <div class="form-group form-group-full">
                    <label>Standard-Schlusstext</label>
                    <textarea value={bizForm.default_closing_text} onInput={e => setBizForm({...bizForm, default_closing_text: e.target.value})} />
                  </div>
                </div>
                <div class="form-actions">
                  <button type="button" class="btn btn-secondary btn-sm" onClick={() => setBizEditing(false)}>Abbrechen</button>
                  <button type="submit" class="btn btn-primary btn-sm" disabled={bizSaving}>{bizSaving ? 'Speichern...' : 'Speichern'}</button>
                </div>
              </form>
            ) : (
              <div class="form-grid">
                <div class="detail-field">
                  <span class="detail-label">Firma</span>
                  <span class="detail-value">{bizSettings?.company_name || 'BECK360'}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Inhaber</span>
                  <span class="detail-value">{bizSettings?.owner_name || 'Eugen Beck'}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Adresse</span>
                  <span class="detail-value">{bizSettings?.address_line1 || 'Eichenweg 1'}, {bizSettings?.address_zip || '76275'} {bizSettings?.address_city || 'Ettlingen'}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">Telefon</span>
                  <span class="detail-value">{bizSettings?.phone || '0173-4682501'}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">IBAN</span>
                  <span class="detail-value">{bizSettings?.bank_iban || 'DE92 5486 2500 0001 1389 95'}</span>
                </div>
                <div class="detail-field">
                  <span class="detail-label">MwSt.</span>
                  <span class="detail-value">{bizSettings?.vat_rate || 19}%</span>
                </div>
              </div>
            )}
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
