import { useState, useEffect, useCallback, useMemo } from 'preact/hooks';
import DOMPurify from 'dompurify';
import { createCampaign, saveCampaignRecipients, sendCampaign } from '../hooks/useCampaigns.js';
import { useContacts } from '../hooks/useContacts.js';
import { useCompanies } from '../hooks/useCompanies.js';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { EMAIL_TEMPLATES } from '../lib/helpers.js';
import { route } from 'preact-router';

export function CampaignForm() {
  const toast = useToast();
  const { contacts: allContacts } = useContacts();
  const { companies } = useCompanies();

  const [form, setForm] = useState({
    name: '',
    subject: '',
    body_html: '',
  });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function applyTemplate(templateId) {
    const tpl = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    setForm(prev => ({
      ...prev,
      subject: tpl.subject || prev.subject,
      body_html: tpl.body,
    }));
  }

  // Only contacts with email and GDPR consent
  const eligibleContacts = useMemo(() =>
    allContacts.filter(c => c.email && c.gdpr_consent),
    [allContacts]
  );

  // Filtered view for display
  const filteredContacts = useMemo(() => {
    let list = eligibleContacts;
    if (companyFilter) {
      list = list.filter(c => c.company_id === companyFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c =>
        (c.first_name || '').toLowerCase().includes(s) ||
        (c.last_name || '').toLowerCase().includes(s) ||
        (c.email || '').toLowerCase().includes(s) ||
        (c.company?.name || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [eligibleContacts, search, companyFilter]);

  function toggleContact(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredContacts.forEach(c => next.add(c.id));
      return next;
    });
  }

  function deselectAllVisible() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredContacts.forEach(c => next.delete(c.id));
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(eligibleContacts.map(c => c.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  const allVisibleSelected = filteredContacts.length > 0 && filteredContacts.every(c => selectedIds.has(c.id));

  // Build recipients array from selected IDs
  const recipients = useMemo(() =>
    eligibleContacts.filter(c => selectedIds.has(c.id)),
    [eligibleContacts, selectedIds]
  );

  async function handleSave() {
    if (!form.name || !form.subject || !form.body_html) {
      toast.error('Name, Betreff und Inhalt sind Pflichtfelder');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await createCampaign({
        name: form.name,
        subject: form.subject,
        body_html: form.body_html,
        filters: {},
      });
      if (error) throw error;

      await saveCampaignRecipients(data.id, recipients);

      toast.success('Kampagne gespeichert');
      route(`/crm/campaigns/${data.id}`);
    } catch (err) {
      toast.error(err.message || 'Fehler beim Speichern');
    }
    setSaving(false);
  }

  async function handleSaveAndSend() {
    if (!form.name || !form.subject || !form.body_html) {
      toast.error('Name, Betreff und Inhalt sind Pflichtfelder');
      return;
    }
    if (recipients.length === 0) {
      toast.error('Keine Empfaenger ausgewaehlt');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await createCampaign({
        name: form.name,
        subject: form.subject,
        body_html: form.body_html,
        filters: {},
      });
      if (error) throw error;

      await saveCampaignRecipients(data.id, recipients);
      const result = await sendCampaign(data.id);

      toast.success(`Kampagne gesendet an ${result.total_sent} Empfaenger`);
      route(`/crm/campaigns/${data.id}`);
    } catch (err) {
      toast.error(err.message || 'Fehler beim Senden');
    }
    setSaving(false);
    setShowSendConfirm(false);
  }

  async function handleTestSend() {
    if (!testEmail) {
      toast.error('Bitte Test-E-Mail-Adresse eingeben');
      return;
    }
    if (!form.subject || !form.body_html) {
      toast.error('Betreff und Inhalt muessen ausgefuellt sein');
      return;
    }
    setSendingTest(true);
    try {
      const { data, error } = await createCampaign({
        name: form.name || 'Test-Kampagne',
        subject: form.subject,
        body_html: form.body_html,
        filters: {},
      });
      if (error) throw error;

      await sendCampaign(data.id, { testEmail });
      toast.success(`Test-Mail an ${testEmail} gesendet`);
    } catch (err) {
      toast.error(err.message || 'Test-Mail fehlgeschlagen');
    }
    setSendingTest(false);
  }

  const previewHtml = form.body_html
    .replace(/\{\{vorname\}\}/gi, 'Max')
    .replace(/\{\{nachname\}\}/gi, 'Mustermann')
    .replace(/\{\{firma\}\}/gi, 'Musterfirma GmbH')
    .replace(/\{\{email\}\}/gi, 'max@example.de');

  return (
    <>
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <button class="btn btn-secondary btn-sm" onClick={() => route('/crm/campaigns')}>←</button>
          <h1 class="page-title">Neue Kampagne</h1>
        </div>
      </div>

      <div class="page-body">
        <div class="detail-grid">
          <div class="detail-main">
            {/* Basic info */}
            <div class="card">
              <div class="card-header"><span class="card-title">Kampagne</span></div>
              <div class="form-grid">
                <div class="form-group form-group-full">
                  <label>Name (intern)</label>
                  <input
                    value={form.name}
                    onInput={e => setField('name', e.target.value)}
                    placeholder="z.B. Follow-up Februar 2026"
                  />
                </div>
                <div class="form-group form-group-full">
                  <label>Betreff</label>
                  <input
                    value={form.subject}
                    onInput={e => setField('subject', e.target.value)}
                    placeholder="Betreff der E-Mail"
                  />
                </div>
              </div>
            </div>

            {/* Template selector */}
            <div class="card">
              <div class="card-header"><span class="card-title">Vorlage waehlen</span></div>
              <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
                {EMAIL_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    class="btn btn-secondary btn-sm"
                    onClick={() => applyTemplate(tpl.id)}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* HTML editor + preview */}
            <div class="card">
              <div class="card-header">
                <span class="card-title">Inhalt (HTML)</span>
                <button class="btn btn-secondary btn-sm" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? 'Editor' : 'Vorschau'}
                </button>
              </div>
              <div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:0.5rem;">
                Platzhalter: {'{{vorname}}'}, {'{{nachname}}'}, {'{{firma}}'}, {'{{email}}'}
              </div>
              {showPreview ? (
                <div
                  style="border:1px solid var(--border);border-radius:8px;padding:1rem;background:#fff;min-height:300px;"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml) }}
                />
              ) : (
                <textarea
                  value={form.body_html}
                  onInput={e => setField('body_html', e.target.value)}
                  style="width:100%;min-height:300px;font-family:monospace;font-size:0.8rem;border:1px solid var(--border);border-radius:8px;padding:0.75rem;"
                  placeholder="HTML-Inhalt der E-Mail..."
                />
              )}
            </div>

            {/* Test send */}
            <div class="card">
              <div class="card-header"><span class="card-title">Test-Mail senden</span></div>
              <div style="display:flex;gap:0.5rem;align-items:end;">
                <div class="form-group" style="flex:1;margin:0">
                  <label>E-Mail-Adresse</label>
                  <input
                    type="email"
                    value={testEmail}
                    onInput={e => setTestEmail(e.target.value)}
                    placeholder="rundgang@beck360.de"
                  />
                </div>
                <button
                  class="btn btn-secondary btn-sm"
                  onClick={handleTestSend}
                  disabled={sendingTest}
                  style="white-space:nowrap;"
                >
                  {sendingTest ? 'Sende...' : 'Test senden'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar: manual recipient selection */}
          <div class="detail-sidebar">
            <div class="card">
              <div class="card-header"><span class="card-title">Empfaenger</span></div>

              {/* Search + company filter */}
              <div class="form-group" style="margin-bottom:0.5rem">
                <input
                  value={search}
                  onInput={e => setSearch(e.target.value)}
                  placeholder="Suche Name, E-Mail, Firma..."
                  style="font-size:0.85rem"
                />
              </div>
              <div class="form-group" style="margin-bottom:0.5rem">
                <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} style="font-size:0.85rem">
                  <option value="">Alle Firmen</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Bulk actions */}
              <div style="display:flex;gap:0.25rem;flex-wrap:wrap;margin-bottom:0.5rem">
                <button type="button" class="btn btn-secondary btn-sm" style="font-size:0.7rem;padding:0.2rem 0.4rem" onClick={selectAllVisible}>
                  Sichtbare waehlen
                </button>
                <button type="button" class="btn btn-secondary btn-sm" style="font-size:0.7rem;padding:0.2rem 0.4rem" onClick={deselectAllVisible}>
                  Sichtbare abwaehlen
                </button>
                <button type="button" class="btn btn-secondary btn-sm" style="font-size:0.7rem;padding:0.2rem 0.4rem" onClick={selectAll}>
                  Alle ({eligibleContacts.length})
                </button>
                <button type="button" class="btn btn-secondary btn-sm" style="font-size:0.7rem;padding:0.2rem 0.4rem" onClick={deselectAll}>
                  Keine
                </button>
              </div>

              {/* Contact list */}
              <div style="max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:6px;">
                {filteredContacts.length === 0 ? (
                  <div style="padding:1rem;text-align:center;color:var(--text-dim);font-size:0.8rem">
                    {eligibleContacts.length === 0 ? 'Keine Kontakte mit DSGVO-Einwilligung' : 'Keine Treffer'}
                  </div>
                ) : (
                  filteredContacts.map(c => (
                    <label
                      key={c.id}
                      style={`display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0.5rem;cursor:pointer;border-bottom:1px solid var(--border);font-size:0.8rem;${selectedIds.has(c.id) ? 'background:var(--brand-light, rgba(26,92,107,0.08))' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleContact(c.id)}
                        style="width:auto;flex-shrink:0"
                      />
                      <div style="min-width:0;overflow:hidden">
                        <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                          {`${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email}
                        </div>
                        <div style="font-size:0.7rem;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                          {c.email}{c.company ? ` · ${c.company.name}` : ''}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {/* Count */}
              <div style="margin-top:0.75rem;padding:0.75rem;background:var(--bg-subtle,#f1f5f9);border-radius:8px;text-align:center;">
                <div style="font-size:1.5rem;font-weight:700;">{selectedIds.size}</div>
                <div style="font-size:0.75rem;color:var(--text-dim)">Empfaenger ausgewaehlt</div>
              </div>
            </div>

            {/* Actions */}
            <div class="card">
              <div style="display:flex;flex-direction:column;gap:0.5rem;">
                <button
                  class="btn btn-secondary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Speichere...' : 'Als Entwurf speichern'}
                </button>
                <button
                  class="btn btn-primary"
                  onClick={() => setShowSendConfirm(true)}
                  disabled={saving || selectedIds.size === 0}
                >
                  Speichern & Senden
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send confirmation modal */}
      {showSendConfirm && (
        <Modal title="Kampagne senden?" onClose={() => setShowSendConfirm(false)}>
          <p style="margin-bottom:1rem;">
            Die Kampagne "<strong>{form.name}</strong>" wird an <strong>{selectedIds.size} Empfaenger</strong> gesendet. Dieser Vorgang kann nicht rueckgaengig gemacht werden.
          </p>
          <div class="form-actions">
            <button class="btn btn-secondary" onClick={() => setShowSendConfirm(false)}>Abbrechen</button>
            <button class="btn btn-primary" onClick={handleSaveAndSend} disabled={saving}>
              {saving ? 'Sende...' : 'Jetzt senden'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
