export function formatDate(dateStr) {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(value) {
  if (value == null) return '–';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes} Min.`;
  if (hours < 24) return `vor ${hours} Std.`;
  if (days < 7) return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
  return formatDate(dateStr);
}

export const STAGES = {
  new: { label: 'Neu', color: '#6366f1' },
  contacted: { label: 'Kontaktiert', color: '#f59e0b' },
  qualified: { label: 'Qualifiziert', color: '#3b82f6' },
  proposal: { label: 'Angebot', color: '#8b5cf6' },
  won: { label: 'Gewonnen', color: '#10b981' },
  lost: { label: 'Verloren', color: '#ef4444' },
};

export const SERVICE_TYPES = {
  '360-tour': '360° Rundgang',
  'drone-photo': 'Drohnenfoto',
  'drone-video': 'Drohnenvideo',
  'drone-inspection': 'PV-Inspektion',
  'streetview': 'Google Street View',
  'bundle': 'Paket',
  'other': 'Sonstiges',
};

export const SOURCES = {
  '360-rundgang': '360-Rundgang',
  'firmenrundgang': 'Firmenrundgang',
  'manual': 'Manuell',
  'referral': 'Empfehlung',
  'other': 'Sonstiges',
};

export const ACTIVITY_TYPES = {
  note: { label: 'Notiz', icon: '📝' },
  call: { label: 'Anruf', icon: '📞' },
  email: { label: 'E-Mail', icon: '📧' },
  meeting: { label: 'Treffen', icon: '🤝' },
  form_submission: { label: 'Formular', icon: '📋' },
  stage_change: { label: 'Stage', icon: '🔄' },
  created: { label: 'Erstellt', icon: '✨' },
  task: { label: 'Aufgabe', icon: '✅' },
  invoice_created: { label: 'Rechnung', icon: '📄' },
  invoice_sent: { label: 'Rechnung versendet', icon: '📨' },
  quote_created: { label: 'Angebot', icon: '📋' },
  quote_converted: { label: 'Angebot umgewandelt', icon: '🔄' },
  edited: { label: 'Bearbeitet', icon: '✏️' },
};

// Field labels for change tracking (German)
export const FIELD_LABELS = {
  first_name: 'Vorname',
  last_name: 'Nachname',
  email: 'E-Mail',
  phone: 'Telefon',
  position: 'Position',
  company_id: 'Firma',
  source: 'Quelle',
  source_detail: 'Quelle Detail',
  gdpr_consent: 'DSGVO-Einwilligung',
  title: 'Titel',
  value: 'Wert',
  service_type: 'Service-Typ',
  expected_close: 'Erwarteter Abschluss',
  lost_reason: 'Verlustgrund',
  stage: 'Stage',
  name: 'Name',
  industry: 'Branche',
  website: 'Website',
  address: 'Adresse',
  city: 'Stadt',
};

export const CAMPAIGN_STATUS = {
  draft: { label: 'Entwurf', color: '#6366f1' },
  sending: { label: 'Wird gesendet', color: '#f59e0b' },
  sent: { label: 'Versendet', color: '#10b981' },
};

export const EMAIL_TEMPLATES = [
  {
    id: 'follow-up',
    name: 'Angebot nachfassen',
    icon: '\u{1F4E9}',
    preview: 'Offenes Angebot freundlich nachfassen',
    subject: 'Ihr 360\u00b0-Rundgang \u2013 Noch Fragen offen?',
    body: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f0f4f8;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a5c6b 0%,#237a8c 100%);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
    <h1 style="color:#ffffff;margin:0 0 4px 0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Beck360</h1>
    <p style="color:rgba(255,255,255,0.7);margin:0;font-size:13px;">360\u00b0 Rundg\u00e4nge & Drohnenaufnahmen</p>
  </div>
  <!-- Body -->
  <div style="background:#ffffff;padding:36px 32px;line-height:1.7;color:#334155;font-size:15px;">
    <p style="margin:0 0 16px 0;">Hallo {{vorname}},</p>
    <p style="margin:0 0 16px 0;">vor Kurzem haben wir \u00fcber einen <strong>360\u00b0-Rundgang</strong> f\u00fcr {{firma}} gesprochen. Haben Sie noch Fragen zu unserem Angebot?</p>
    <p style="margin:0 0 24px 0;">Gerne stehe ich Ihnen f\u00fcr ein kurzes Gespr\u00e4ch zur Verf\u00fcgung \u2013 unverbindlich und unkompliziert.</p>
    <!-- CTA -->
    <div style="text-align:center;margin:32px 0;">
      <a href="https://360-rundgang-karlsruhe.de" style="background:linear-gradient(135deg,#1a5c6b,#237a8c);color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(26,92,107,0.3);">Termin vereinbaren</a>
    </div>
    <!-- Signature -->
    <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:28px;">
      <p style="margin:0;font-size:14px;color:#475569;">Beste Gr\u00fc\u00dfe<br><strong style="color:#1a5c6b;">Eugen Beck</strong></p>
      <p style="margin:4px 0 0 0;font-size:12px;color:#94a3b8;">Beck360 \u2013 360\u00b0 Rundg\u00e4nge & Drohnenaufnahmen<br>\u260e +49 173 468 2501 &nbsp;\u00b7&nbsp; \u2709 rundgang@beck360.de</p>
    </div>
  </div>
  <!-- Footer -->
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;text-align:center;padding:16px 24px;">
    <p style="margin:0;font-size:11px;color:#94a3b8;">Beck360 &nbsp;\u00b7&nbsp; Eichenweg 1, 76275 Ettlingen &nbsp;\u00b7&nbsp; <a href="https://360-rundgang-karlsruhe.de/impressum/" style="color:#64748b;">Impressum</a></p>
  </div>
</div>
</body></html>`,
  },
  {
    id: 'new-service',
    name: 'Neue Dienstleistung',
    icon: '\u{1F680}',
    preview: 'Neues Angebot oder Service vorstellen',
    subject: 'Neu bei Beck360: Erweiterte 360\u00b0-L\u00f6sungen f\u00fcr {{firma}}',
    body: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f0f4f8;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a5c6b 0%,#237a8c 100%);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
    <h1 style="color:#ffffff;margin:0 0 4px 0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Beck360</h1>
    <p style="color:rgba(255,255,255,0.7);margin:0;font-size:13px;">360\u00b0 Rundg\u00e4nge & Drohnenaufnahmen</p>
  </div>
  <!-- Body -->
  <div style="background:#ffffff;padding:36px 32px;line-height:1.7;color:#334155;font-size:15px;">
    <p style="margin:0 0 16px 0;">Hallo {{vorname}},</p>
    <p style="margin:0 0 24px 0;">wir haben unser Angebot f\u00fcr Sie erweitert! Entdecken Sie unsere neuen M\u00f6glichkeiten:</p>
    <!-- Feature Cards -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
      <tr>
        <td style="padding:8px 8px 8px 0;width:33%;vertical-align:top;">
          <div style="background:#f0f9ff;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">\u{1F3E0}</div>
            <p style="margin:0;font-size:13px;font-weight:600;color:#1a5c6b;">360\u00b0 Rundg\u00e4nge</p>
            <p style="margin:4px 0 0 0;font-size:11px;color:#64748b;">Interaktive Touren f\u00fcr Ihre R\u00e4ume</p>
          </div>
        </td>
        <td style="padding:8px;width:33%;vertical-align:top;">
          <div style="background:#f0f9ff;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">\u{1F681}</div>
            <p style="margin:0;font-size:13px;font-weight:600;color:#1a5c6b;">Drohnenaufnahmen</p>
            <p style="margin:4px 0 0 0;font-size:11px;color:#64748b;">Luftbilder & Videos</p>
          </div>
        </td>
        <td style="padding:8px 0 8px 8px;width:33%;vertical-align:top;">
          <div style="background:#f0f9ff;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">\u{1F4CD}</div>
            <p style="margin:0;font-size:13px;font-weight:600;color:#1a5c6b;">Google Street View</p>
            <p style="margin:4px 0 0 0;font-size:11px;color:#64748b;">Direkt auf Google Maps</p>
          </div>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px 0;">Alle Leistungen aus einer Hand \u2013 professionell, schnell und zu fairen Preisen.</p>
    <!-- CTA -->
    <div style="text-align:center;margin:32px 0;">
      <a href="https://360-rundgang-karlsruhe.de" style="background:linear-gradient(135deg,#1a5c6b,#237a8c);color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(26,92,107,0.3);">Mehr erfahren</a>
    </div>
    <!-- Signature -->
    <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:28px;">
      <p style="margin:0;font-size:14px;color:#475569;">Beste Gr\u00fc\u00dfe<br><strong style="color:#1a5c6b;">Eugen Beck</strong></p>
      <p style="margin:4px 0 0 0;font-size:12px;color:#94a3b8;">Beck360 \u2013 360\u00b0 Rundg\u00e4nge & Drohnenaufnahmen<br>\u260e +49 173 468 2501 &nbsp;\u00b7&nbsp; \u2709 rundgang@beck360.de</p>
    </div>
  </div>
  <!-- Footer -->
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;text-align:center;padding:16px 24px;">
    <p style="margin:0;font-size:11px;color:#94a3b8;">Beck360 &nbsp;\u00b7&nbsp; Eichenweg 1, 76275 Ettlingen &nbsp;\u00b7&nbsp; <a href="https://360-rundgang-karlsruhe.de/impressum/" style="color:#64748b;">Impressum</a></p>
  </div>
</div>
</body></html>`,
  },
  {
    id: 'review',
    name: 'Um Bewertung bitten',
    icon: '\u2B50',
    preview: 'Kunden um Google-Bewertung bitten',
    subject: 'Wie war Ihre Erfahrung mit Beck360, {{vorname}}?',
    body: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f0f4f8;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a5c6b 0%,#237a8c 100%);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
    <h1 style="color:#ffffff;margin:0 0 4px 0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Beck360</h1>
    <p style="color:rgba(255,255,255,0.7);margin:0;font-size:13px;">360\u00b0 Rundg\u00e4nge & Drohnenaufnahmen</p>
  </div>
  <!-- Body -->
  <div style="background:#ffffff;padding:36px 32px;line-height:1.7;color:#334155;font-size:15px;">
    <p style="margin:0 0 16px 0;">Hallo {{vorname}},</p>
    <p style="margin:0 0 16px 0;">vielen Dank, dass Sie sich f\u00fcr Beck360 entschieden haben! Wir hoffen, Sie sind mit dem Ergebnis begeistert.</p>
    <!-- Stars -->
    <div style="text-align:center;margin:28px 0;">
      <div style="background:linear-gradient(135deg,#fefce8,#fef9c3);border:1px solid #fde68a;border-radius:12px;padding:24px;display:inline-block;">
        <p style="font-size:36px;margin:0 0 8px 0;letter-spacing:4px;">\u2B50\u2B50\u2B50\u2B50\u2B50</p>
        <p style="font-size:15px;font-weight:600;color:#92400e;margin:0 0 4px 0;">Ihre Meinung z\u00e4hlt!</p>
        <p style="font-size:13px;color:#a16207;margin:0;">Eine Bewertung dauert nur 1 Minute</p>
      </div>
    </div>
    <p style="margin:0 0 24px 0;text-align:center;">W\u00fcrden Sie uns mit einer kurzen Google-Bewertung unterst\u00fctzen? Das hilft anderen Kunden bei ihrer Entscheidung.</p>
    <!-- CTA -->
    <div style="text-align:center;margin:32px 0;">
      <a href="https://www.google.com/maps/place/Beck360/@48.9408,8.4072,17z/?entry=ttu&action=write-review" style="background:linear-gradient(135deg,#1a5c6b,#237a8c);color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(26,92,107,0.3);">Jetzt bewerten</a>
    </div>
    <!-- Signature -->
    <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:28px;">
      <p style="margin:0;font-size:14px;color:#475569;">Herzlichen Dank!<br><strong style="color:#1a5c6b;">Eugen Beck</strong></p>
      <p style="margin:4px 0 0 0;font-size:12px;color:#94a3b8;">Beck360 \u2013 360\u00b0 Rundg\u00e4nge & Drohnenaufnahmen<br>\u260e +49 173 468 2501 &nbsp;\u00b7&nbsp; \u2709 rundgang@beck360.de</p>
    </div>
  </div>
  <!-- Footer -->
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;text-align:center;padding:16px 24px;">
    <p style="margin:0;font-size:11px;color:#94a3b8;">Beck360 &nbsp;\u00b7&nbsp; Eichenweg 1, 76275 Ettlingen &nbsp;\u00b7&nbsp; <a href="https://360-rundgang-karlsruhe.de/impressum/" style="color:#64748b;">Impressum</a></p>
  </div>
</div>
</body></html>`,
  },
  {
    id: 'seasonal',
    name: 'Saisonales Angebot',
    icon: '\u{1F381}',
    preview: 'Zeitlich begrenztes Angebot bewerben',
    subject: 'Exklusiv f\u00fcr {{firma}}: 360\u00b0-Rundgang zum Sonderpreis',
    body: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f0f4f8;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a5c6b 0%,#237a8c 100%);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
    <h1 style="color:#ffffff;margin:0 0 4px 0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Beck360</h1>
    <p style="color:rgba(255,255,255,0.7);margin:0;font-size:13px;">360\u00b0 Rundg\u00e4nge & Drohnenaufnahmen</p>
  </div>
  <!-- Body -->
  <div style="background:#ffffff;padding:36px 32px;line-height:1.7;color:#334155;font-size:15px;">
    <p style="margin:0 0 16px 0;">Hallo {{vorname}},</p>
    <p style="margin:0 0 20px 0;">wir haben ein exklusives Angebot f\u00fcr {{firma}}:</p>
    <!-- Offer Box -->
    <div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:2px solid #6ee7b7;border-radius:12px;padding:28px;margin:20px 0;text-align:center;">
      <p style="font-size:12px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Limitiertes Angebot</p>
      <p style="font-size:22px;font-weight:700;color:#065f46;margin:0 0 8px 0;">Fr\u00fchlings-Aktion 2026</p>
      <p style="font-size:14px;color:#047857;margin:0;">360\u00b0-Rundgang zum Sonderpreis \u2013 nur bis Ende des Monats!</p>
    </div>
    <p style="margin:20px 0 8px 0;font-weight:600;color:#1e293b;">Das ist enthalten:</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 0;font-size:14px;color:#475569;">\u2705 Professioneller 360\u00b0-Rundgang</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#475569;">\u2705 Hosting auf Matterport f\u00fcr 12 Monate</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#475569;">\u2705 Einbettung auf Ihrer Website</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#475569;">\u2705 Google Street View Integration</td></tr>
    </table>
    <!-- CTA -->
    <div style="text-align:center;margin:32px 0;">
      <a href="https://360-rundgang-karlsruhe.de" style="background:linear-gradient(135deg,#059669,#047857);color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(5,150,105,0.3);">Jetzt Angebot sichern</a>
    </div>
    <!-- Signature -->
    <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:28px;">
      <p style="margin:0;font-size:14px;color:#475569;">Beste Gr\u00fc\u00dfe<br><strong style="color:#1a5c6b;">Eugen Beck</strong></p>
      <p style="margin:4px 0 0 0;font-size:12px;color:#94a3b8;">Beck360 \u2013 360\u00b0 Rundg\u00e4nge & Drohnenaufnahmen<br>\u260e +49 173 468 2501 &nbsp;\u00b7&nbsp; \u2709 rundgang@beck360.de</p>
    </div>
  </div>
  <!-- Footer -->
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;text-align:center;padding:16px 24px;">
    <p style="margin:0;font-size:11px;color:#94a3b8;">Beck360 &nbsp;\u00b7&nbsp; Eichenweg 1, 76275 Ettlingen &nbsp;\u00b7&nbsp; <a href="https://360-rundgang-karlsruhe.de/impressum/" style="color:#64748b;">Impressum</a></p>
  </div>
</div>
</body></html>`,
  },
  {
    id: 'blank',
    name: 'Leere Vorlage',
    icon: '\u{1F4DD}',
    preview: 'Leeres Template mit Beck360-Layout',
    subject: '',
    body: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f0f4f8;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a5c6b 0%,#237a8c 100%);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center;">
    <h1 style="color:#ffffff;margin:0 0 4px 0;font-size:24px;font-weight:700;letter-spacing:0.5px;">Beck360</h1>
    <p style="color:rgba(255,255,255,0.7);margin:0;font-size:13px;">360\u00b0 Rundg\u00e4nge & Drohnenaufnahmen</p>
  </div>
  <!-- Body -->
  <div style="background:#ffffff;padding:36px 32px;line-height:1.7;color:#334155;font-size:15px;">
    <p style="margin:0 0 16px 0;">Hallo {{vorname}},</p>
    <p style="margin:0 0 16px 0;"><!-- Ihr Inhalt hier --></p>
    <!-- CTA -->
    <div style="text-align:center;margin:32px 0;">
      <a href="https://360-rundgang-karlsruhe.de" style="background:linear-gradient(135deg,#1a5c6b,#237a8c);color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(26,92,107,0.3);">Mehr erfahren</a>
    </div>
    <!-- Signature -->
    <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:28px;">
      <p style="margin:0;font-size:14px;color:#475569;">Beste Gr\u00fc\u00dfe<br><strong style="color:#1a5c6b;">Eugen Beck</strong></p>
      <p style="margin:4px 0 0 0;font-size:12px;color:#94a3b8;">Beck360 \u2013 360\u00b0 Rundg\u00e4nge & Drohnenaufnahmen<br>\u260e +49 173 468 2501 &nbsp;\u00b7&nbsp; \u2709 rundgang@beck360.de</p>
    </div>
  </div>
  <!-- Footer -->
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 16px 16px;text-align:center;padding:16px 24px;">
    <p style="margin:0;font-size:11px;color:#94a3b8;">Beck360 &nbsp;\u00b7&nbsp; Eichenweg 1, 76275 Ettlingen &nbsp;\u00b7&nbsp; <a href="https://360-rundgang-karlsruhe.de/impressum/" style="color:#64748b;">Impressum</a></p>
  </div>
</div>
</body></html>`,
  },
];

export const EXPENSE_CATEGORIES = {
  'office': 'Buero & Ausstattung',
  'software': 'Software & Lizenzen',
  'marketing': 'Marketing & Werbung',
  'travel': 'Reise & Fahrtkosten',
  'equipment': 'Geraete & Technik',
  'insurance': 'Versicherungen',
  'telecom': 'Telefon & Internet',
  'professional': 'Beratung & Dienstleistung',
  'vehicle': 'Fahrzeug',
  'training': 'Weiterbildung',
  'other': 'Sonstiges',
};

export const PAYMENT_METHODS = {
  'bank_transfer': 'Ueberweisung',
  'cash': 'Bar',
  'credit_card': 'Kreditkarte',
  'paypal': 'PayPal',
  'direct_debit': 'Lastschrift',
};

export const MONTHS = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export const INDUSTRIES = [
  'Hotel / Pension',
  'Gastronomie',
  'Fitnessstudio',
  'Einzelhandel',
  'Autohaus',
  'Gesundheit / Arztpraxis',
  'Eventlocation',
  'Coworking',
  'Immobilien',
  'Handwerk',
  'Bildung',
  'Sonstige',
];
