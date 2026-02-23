import { useState, useEffect, useCallback } from 'preact/hooks';
import DOMPurify from 'dompurify';
import { createCampaign, fetchFilteredRecipients, saveCampaignRecipients, sendCampaign } from '../hooks/useCampaigns.js';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { SOURCES, STAGES, INDUSTRIES, EMAIL_TEMPLATES } from '../lib/helpers.js';
import { route } from 'preact-router';

export function CampaignForm() {
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    subject: '',
    body_html: '',
  });
  const [filters, setFilters] = useState({
    source: '',
    stage: '',
    industry: '',
  });
  const [recipientCount, setRecipientCount] = useState(0);
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function setFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
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

  // Fetch recipients when filters change
  const loadRecipients = useCallback(async () => {
    setLoadingRecipients(true);
    const { data } = await fetchFilteredRecipients({
      source: filters.source || null,
      stage: filters.stage || null,
      industry: filters.industry || null,
    });
    setRecipients(data);
    setRecipientCount(data.length);
    setLoadingRecipients(false);
  }, [filters.source, filters.stage, filters.industry]);

  useEffect(() => { loadRecipients(); }, [loadRecipients]);

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
        filters: filters,
      });
      if (error) throw error;

      // Save recipients
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
    if (recipientCount === 0) {
      toast.error('Keine Empfaenger ausgewaehlt');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await createCampaign({
        name: form.name,
        subject: form.subject,
        body_html: form.body_html,
        filters: filters,
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
      // Save draft first, then send test
      const { data, error } = await createCampaign({
        name: form.name || 'Test-Kampagne',
        subject: form.subject,
        body_html: form.body_html,
        filters: filters,
      });
      if (error) throw error;

      await sendCampaign(data.id, { testEmail });
      toast.success(`Test-Mail an ${testEmail} gesendet`);
    } catch (err) {
      toast.error(err.message || 'Test-Mail fehlgeschlagen');
    }
    setSendingTest(false);
  }

  // Simple HTML preview with placeholder replacement
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

          {/* Sidebar: filters + recipients */}
          <div class="detail-sidebar">
            <div class="card">
              <div class="card-header"><span class="card-title">Empfaenger-Filter</span></div>

              <div class="form-group">
                <label>Quelle</label>
                <select value={filters.source} onChange={e => setFilter('source', e.target.value)}>
                  <option value="">Alle Quellen</option>
                  {Object.entries(SOURCES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div class="form-group">
                <label>Deal-Stage</label>
                <select value={filters.stage} onChange={e => setFilter('stage', e.target.value)}>
                  <option value="">Alle Stages</option>
                  {Object.entries(STAGES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div class="form-group">
                <label>Branche</label>
                <select value={filters.industry} onChange={e => setFilter('industry', e.target.value)}>
                  <option value="">Alle Branchen</option>
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div style="margin-top:1rem;padding:0.75rem;background:var(--bg-subtle,#f1f5f9);border-radius:8px;text-align:center;">
                {loadingRecipients ? (
                  <span style="color:var(--text-dim);font-size:0.85rem">Lade...</span>
                ) : (
                  <>
                    <div style="font-size:1.5rem;font-weight:700;">{recipientCount}</div>
                    <div style="font-size:0.75rem;color:var(--text-dim)">Empfaenger (nur mit DSGVO-Einwilligung)</div>
                  </>
                )}
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
                  disabled={saving || recipientCount === 0}
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
            Die Kampagne "<strong>{form.name}</strong>" wird an <strong>{recipientCount} Empfaenger</strong> gesendet. Dieser Vorgang kann nicht rueckgaengig gemacht werden.
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
