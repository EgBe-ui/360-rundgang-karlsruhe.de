import { useState, useEffect, useCallback, useMemo, useRef } from 'preact/hooks';
import DOMPurify from 'dompurify';
import { createCampaign, saveCampaignRecipients, sendCampaign } from '../hooks/useCampaigns.js';
import { useContacts } from '../hooks/useContacts.js';
import { useCompanies } from '../hooks/useCompanies.js';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { EMAIL_TEMPLATES } from '../lib/helpers.js';
import { route } from 'preact-router';

const STEPS = [
  { num: 1, label: 'Empfaenger' },
  { num: 2, label: 'Inhalt' },
  { num: 3, label: 'Vorschau & Senden' },
];

const PLACEHOLDERS = [
  { tag: '{{vorname}}', label: 'Vorname' },
  { tag: '{{nachname}}', label: 'Nachname' },
  { tag: '{{firma}}', label: 'Firma' },
  { tag: '{{email}}', label: 'E-Mail' },
];

export function CampaignForm() {
  const toast = useToast();
  const { contacts: allContacts } = useContacts();
  const { companies } = useCompanies();
  const editorRef = useRef(null);

  const [step, setStep] = useState(1);
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

  function insertPlaceholder(tag) {
    const el = editorRef.current;
    if (!el) {
      setField('body_html', form.body_html + tag);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = form.body_html;
    const newText = text.substring(0, start) + tag + text.substring(end);
    setField('body_html', newText);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + tag.length;
    });
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

  function selectAll() {
    setSelectedIds(new Set(eligibleContacts.map(c => c.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  const allVisibleSelected = filteredContacts.length > 0 && filteredContacts.every(c => selectedIds.has(c.id));

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredContacts.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredContacts.forEach(c => next.add(c.id));
        return next;
      });
    }
  }

  // Build recipients array from selected IDs
  const recipients = useMemo(() =>
    eligibleContacts.filter(c => selectedIds.has(c.id)),
    [eligibleContacts, selectedIds]
  );

  // Preview with first recipient's data or defaults
  const previewData = recipients.length > 0
    ? { vorname: recipients[0].first_name || 'Max', nachname: recipients[0].last_name || 'Mustermann', firma: recipients[0].company?.name || 'Musterfirma GmbH', email: recipients[0].email }
    : { vorname: 'Max', nachname: 'Mustermann', firma: 'Musterfirma GmbH', email: 'max@example.de' };

  const previewHtml = form.body_html
    .replace(/\{\{vorname\}\}/gi, previewData.vorname)
    .replace(/\{\{nachname\}\}/gi, previewData.nachname)
    .replace(/\{\{firma\}\}/gi, previewData.firma)
    .replace(/\{\{email\}\}/gi, previewData.email);

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

  function canProceedToStep2() {
    return selectedIds.size > 0;
  }

  function canProceedToStep3() {
    return form.name && form.subject && form.body_html;
  }

  return (
    <>
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <button class="btn btn-secondary btn-sm" onClick={() => route('/crm/campaigns')}>←</button>
          <h1 class="page-title">Neue Kampagne</h1>
        </div>
      </div>

      <div class="page-body">
        {/* Stepper */}
        <div style="display:flex;align-items:center;gap:0;margin-bottom:1.5rem;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;">
          {STEPS.map((s, i) => (
            <button
              key={s.num}
              onClick={() => {
                if (s.num === 2 && !canProceedToStep2()) return;
                if (s.num === 3 && (!canProceedToStep2() || !canProceedToStep3())) return;
                setStep(s.num);
              }}
              style={`
                flex:1;padding:0.875rem 1rem;border:none;cursor:pointer;
                font-size:0.875rem;font-weight:${step === s.num ? '600' : '500'};
                background:${step === s.num ? 'var(--primary)' : step > s.num ? 'rgba(26,92,107,0.08)' : 'transparent'};
                color:${step === s.num ? '#fff' : step > s.num ? 'var(--primary)' : 'var(--text-muted)'};
                border-right:${i < STEPS.length - 1 ? '1px solid var(--border)' : 'none'};
                transition:all 0.15s;
                display:flex;align-items:center;justify-content:center;gap:0.5rem;
              `}
            >
              <span style={`
                width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;
                font-size:0.75rem;font-weight:700;
                background:${step === s.num ? 'rgba(255,255,255,0.2)' : step > s.num ? 'var(--primary)' : 'var(--border)'};
                color:${step === s.num ? '#fff' : step > s.num ? '#fff' : 'var(--text-muted)'};
              `}>
                {step > s.num ? '✓' : s.num}
              </span>
              <span class="hide-mobile-sm">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Step 1: Empfaenger */}
        {step === 1 && (
          <div class="card">
            <div class="card-header">
              <span class="card-title">Empfaenger waehlen</span>
              <span style="font-size:0.85rem;color:var(--text-muted)">
                {eligibleContacts.length} Kontakte mit DSGVO-Einwilligung
              </span>
            </div>

            {/* Search + Filter + Bulk actions */}
            <div style="display:flex;gap:0.75rem;margin-bottom:1rem;flex-wrap:wrap;align-items:end;">
              <div style="flex:1;min-width:200px;">
                <label>Suche</label>
                <input
                  value={search}
                  onInput={e => setSearch(e.target.value)}
                  placeholder="Name, E-Mail oder Firma..."
                />
              </div>
              <div style="min-width:180px;">
                <label>Firma</label>
                <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
                  <option value="">Alle Firmen</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style="display:flex;gap:0.5rem;">
                <button type="button" class="btn btn-secondary btn-sm" onClick={selectAll}>
                  Alle waehlen
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onClick={deselectAll}>
                  Keine
                </button>
              </div>
            </div>

            {/* Contacts table */}
            {filteredContacts.length === 0 ? (
              <div class="empty-state">
                <div class="empty-state-text">
                  {eligibleContacts.length === 0 ? 'Keine Kontakte mit DSGVO-Einwilligung und E-Mail' : 'Keine Treffer fuer diese Suche'}
                </div>
              </div>
            ) : (
              <div style="border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">
                <table style="margin:0;">
                  <thead>
                    <tr>
                      <th style="width:40px;padding:0.5rem 0.75rem;">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleAllVisible}
                          style="width:auto;"
                        />
                      </th>
                      <th>Name</th>
                      <th>E-Mail</th>
                      <th class="hide-mobile-sm">Firma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map(c => (
                      <tr
                        key={c.id}
                        onClick={() => toggleContact(c.id)}
                        style={`cursor:pointer;${selectedIds.has(c.id) ? 'background:rgba(26,92,107,0.06);' : ''}`}
                      >
                        <td style="width:40px;padding:0.5rem 0.75rem;" data-label="">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(c.id)}
                            onChange={() => toggleContact(c.id)}
                            onClick={e => e.stopPropagation()}
                            style="width:auto;"
                          />
                        </td>
                        <td data-label="Name">
                          <span style="font-weight:500;">
                            {`${c.first_name || ''} ${c.last_name || ''}`.trim() || '–'}
                          </span>
                        </td>
                        <td data-label="E-Mail" style="color:var(--text-muted);">{c.email}</td>
                        <td data-label="Firma" class="hide-mobile-sm" style="color:var(--text-muted);">
                          {c.company?.name || '–'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Count + Next */}
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:1rem;flex-wrap:wrap;gap:0.75rem;">
              <div style="padding:0.5rem 1rem;background:var(--bg-hover);border-radius:var(--radius);font-size:0.875rem;">
                <strong>{selectedIds.size}</strong> von {eligibleContacts.length} Empfaenger ausgewaehlt
              </div>
              <button
                class="btn btn-primary"
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2()}
              >
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Inhalt */}
        {step === 2 && (
          <div style="display:flex;flex-direction:column;gap:1.5rem;">
            {/* Campaign name */}
            <div class="card">
              <div class="card-header"><span class="card-title">Kampagne</span></div>
              <div class="form-group" style="margin:0;">
                <label>Name (intern)</label>
                <input
                  value={form.name}
                  onInput={e => setField('name', e.target.value)}
                  placeholder="z.B. Follow-up Februar 2026"
                />
              </div>
            </div>

            {/* Template selector */}
            <div class="card">
              <div class="card-header"><span class="card-title">Vorlage waehlen</span></div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:0.75rem;">
                {EMAIL_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl.id)}
                    style={`
                      display:flex;flex-direction:column;align-items:center;gap:0.5rem;
                      padding:1rem;border-radius:var(--radius);border:1px solid var(--border);
                      background:var(--bg-card);cursor:pointer;transition:all 0.15s;text-align:center;
                    `}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(26,92,107,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                  >
                    <span style="font-size:1.5rem;">{tpl.icon || '📧'}</span>
                    <span style="font-weight:600;font-size:0.85rem;color:var(--text);">{tpl.name}</span>
                    {tpl.preview && (
                      <span style="font-size:0.75rem;color:var(--text-muted);line-height:1.3;">{tpl.preview}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div class="card">
              <div class="card-header"><span class="card-title">Betreff</span></div>
              <input
                value={form.subject}
                onInput={e => setField('subject', e.target.value)}
                placeholder="Betreff der E-Mail"
              />
            </div>

            {/* HTML Editor */}
            <div class="card">
              <div class="card-header">
                <span class="card-title">Inhalt (HTML)</span>
                <button class="btn btn-secondary btn-sm" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? 'Editor' : 'Vorschau'}
                </button>
              </div>

              {/* Placeholder buttons */}
              <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem;">
                <span style="font-size:0.75rem;color:var(--text-dim);display:flex;align-items:center;">Platzhalter:</span>
                {PLACEHOLDERS.map(p => (
                  <button
                    key={p.tag}
                    type="button"
                    onClick={() => insertPlaceholder(p.tag)}
                    style="padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:500;background:rgba(26,92,107,0.08);color:var(--primary);border:1px solid rgba(26,92,107,0.2);cursor:pointer;transition:all 0.15s;"
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,92,107,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(26,92,107,0.08)'; }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {showPreview ? (
                <div
                  style="border:1px solid var(--border);border-radius:8px;padding:1rem;background:#fff;min-height:300px;"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml) }}
                />
              ) : (
                <textarea
                  ref={editorRef}
                  value={form.body_html}
                  onInput={e => setField('body_html', e.target.value)}
                  style="width:100%;min-height:350px;font-family:monospace;font-size:0.8rem;border:1px solid var(--border);border-radius:8px;padding:0.75rem;"
                  placeholder="HTML-Inhalt der E-Mail..."
                />
              )}
            </div>

            {/* Navigation */}
            <div style="display:flex;justify-content:space-between;">
              <button class="btn btn-secondary" onClick={() => setStep(1)}>
                ← Zurueck
              </button>
              <button
                class="btn btn-primary"
                onClick={() => setStep(3)}
                disabled={!canProceedToStep3()}
              >
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Vorschau & Senden */}
        {step === 3 && (
          <div style="display:flex;flex-direction:column;gap:1.5rem;">
            {/* Summary */}
            <div class="card">
              <div class="card-header"><span class="card-title">Zusammenfassung</span></div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
                <div style="padding:1rem;background:var(--bg-hover);border-radius:var(--radius);text-align:center;">
                  <div style="font-size:1.75rem;font-weight:700;">{selectedIds.size}</div>
                  <div style="font-size:0.8rem;color:var(--text-muted);">Empfaenger</div>
                </div>
                <div style="padding:1rem;background:var(--bg-hover);border-radius:var(--radius);">
                  <div style="font-size:0.7rem;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.25rem;">Kampagne</div>
                  <div style="font-weight:500;">{form.name}</div>
                </div>
                <div style="padding:1rem;background:var(--bg-hover);border-radius:var(--radius);">
                  <div style="font-size:0.7rem;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.25rem;">Betreff</div>
                  <div style="font-weight:500;">{form.subject}</div>
                </div>
              </div>
            </div>

            {/* Email preview */}
            <div class="card">
              <div class="card-header">
                <span class="card-title">E-Mail-Vorschau</span>
                {recipients.length > 0 && (
                  <span style="font-size:0.75rem;color:var(--text-dim);">
                    Personalisiert fuer: {previewData.vorname} {previewData.nachname}
                  </span>
                )}
              </div>
              <div
                style="border:1px solid var(--border);border-radius:8px;padding:1rem;background:#fff;max-height:500px;overflow:auto;"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml) }}
              />
            </div>

            {/* Test send */}
            <div class="card">
              <div class="card-header"><span class="card-title">Test-Mail senden</span></div>
              <div style="display:flex;gap:0.75rem;align-items:end;flex-wrap:wrap;">
                <div style="flex:1;min-width:200px;">
                  <label>E-Mail-Adresse</label>
                  <input
                    type="email"
                    value={testEmail}
                    onInput={e => setTestEmail(e.target.value)}
                    placeholder="rundgang@beck360.de"
                  />
                </div>
                <button
                  class="btn btn-secondary"
                  onClick={handleTestSend}
                  disabled={sendingTest}
                  style="white-space:nowrap;"
                >
                  {sendingTest ? 'Sende...' : 'Test senden'}
                </button>
              </div>
            </div>

            {/* Navigation + Actions */}
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;">
              <button class="btn btn-secondary" onClick={() => setStep(2)}>
                ← Zurueck
              </button>
              <div style="display:flex;gap:0.75rem;">
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
                  Jetzt senden
                </button>
              </div>
            </div>
          </div>
        )}
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
