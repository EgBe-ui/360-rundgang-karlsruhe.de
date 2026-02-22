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
    subject: 'Ihr 360°-Rundgang – Noch Fragen offen?',
    body: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="background:#1a5c6b;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:20px;">Beck360</h1>
  </div>
  <div style="background:#fff;padding:32px 24px;border-radius:0 0 12px 12px;line-height:1.6;color:#334155;">
    <p>Hallo {{vorname}},</p>
    <p>vor Kurzem haben wir ueber einen 360\u00b0-Rundgang fuer {{firma}} gesprochen. Haben Sie noch Fragen zu unserem Angebot?</p>
    <p>Ich stehe Ihnen gerne fuer ein kurzes Gespraech zur Verfuegung.</p>
    <p style="margin-top:24px;">
      <a href="https://360-rundgang-karlsruhe.de" style="background:#1a5c6b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Termin vereinbaren</a>
    </p>
    <p style="margin-top:24px;">Beste Gruesse<br><strong>Eugen Beck</strong><br>Beck360 – 360\u00b0 Rundgaenge & Drohnenaufnahmen<br>+49 173 468 2501</p>
  </div>
  <div style="text-align:center;padding:16px;font-size:11px;color:#94a3b8;">
    Beck360 | Eichenweg 1, 76275 Ettlingen | <a href="https://360-rundgang-karlsruhe.de/impressum/" style="color:#94a3b8;">Impressum</a>
  </div>
</div>
</body></html>`,
  },
  {
    id: 'new-service',
    name: 'Neue Dienstleistung vorstellen',
    subject: 'Neu bei Beck360: Erweiterte 360\u00b0-Loesungen',
    body: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="background:#1a5c6b;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:20px;">Beck360</h1>
  </div>
  <div style="background:#fff;padding:32px 24px;border-radius:0 0 12px 12px;line-height:1.6;color:#334155;">
    <p>Hallo {{vorname}},</p>
    <p>wir haben unser Angebot erweitert! Neben professionellen 360\u00b0-Rundgaengen bieten wir jetzt auch Drohnenaufnahmen und virtuelle Touren an.</p>
    <p><strong>Ihre Vorteile:</strong></p>
    <ul>
      <li>Interaktive 360\u00b0-Rundgaenge fuer Ihre Raeumlichkeiten</li>
      <li>Professionelle Drohnenfotos und -videos</li>
      <li>Google Street View Integration</li>
    </ul>
    <p style="margin-top:24px;">
      <a href="https://360-rundgang-karlsruhe.de" style="background:#1a5c6b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Mehr erfahren</a>
    </p>
    <p style="margin-top:24px;">Beste Gruesse<br><strong>Eugen Beck</strong><br>Beck360<br>+49 173 468 2501</p>
  </div>
  <div style="text-align:center;padding:16px;font-size:11px;color:#94a3b8;">
    Beck360 | Eichenweg 1, 76275 Ettlingen | <a href="https://360-rundgang-karlsruhe.de/impressum/" style="color:#94a3b8;">Impressum</a>
  </div>
</div>
</body></html>`,
  },
  {
    id: 'review',
    name: 'Um Bewertung bitten',
    subject: 'Wie war Ihre Erfahrung mit Beck360?',
    body: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="background:#1a5c6b;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:20px;">Beck360</h1>
  </div>
  <div style="background:#fff;padding:32px 24px;border-radius:0 0 12px 12px;line-height:1.6;color:#334155;">
    <p>Hallo {{vorname}},</p>
    <p>vielen Dank, dass Sie sich fuer Beck360 entschieden haben! Wir hoffen, Sie sind mit dem Ergebnis zufrieden.</p>
    <p>Wuerden Sie uns mit einer kurzen Google-Bewertung unterstuetzen? Das dauert nur 1 Minute und hilft uns enorm.</p>
    <p style="margin-top:24px;">
      <a href="https://g.page/r/CQyourGoogleReviewLink/review" style="background:#1a5c6b;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Jetzt bewerten</a>
    </p>
    <p style="margin-top:24px;">Herzlichen Dank!<br><strong>Eugen Beck</strong><br>Beck360<br>+49 173 468 2501</p>
  </div>
  <div style="text-align:center;padding:16px;font-size:11px;color:#94a3b8;">
    Beck360 | Eichenweg 1, 76275 Ettlingen | <a href="https://360-rundgang-karlsruhe.de/impressum/" style="color:#94a3b8;">Impressum</a>
  </div>
</div>
</body></html>`,
  },
  {
    id: 'blank',
    name: 'Leere Vorlage',
    subject: '',
    body: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="background:#1a5c6b;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:20px;">Beck360</h1>
  </div>
  <div style="background:#fff;padding:32px 24px;border-radius:0 0 12px 12px;line-height:1.6;color:#334155;">
    <p>Hallo {{vorname}},</p>
    <p><!-- Ihr Inhalt hier --></p>
    <p style="margin-top:24px;">Beste Gruesse<br><strong>Eugen Beck</strong><br>Beck360 – 360\u00b0 Rundgaenge & Drohnenaufnahmen<br>+49 173 468 2501</p>
  </div>
  <div style="text-align:center;padding:16px;font-size:11px;color:#94a3b8;">
    Beck360 | Eichenweg 1, 76275 Ettlingen | <a href="https://360-rundgang-karlsruhe.de/impressum/" style="color:#94a3b8;">Impressum</a>
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
