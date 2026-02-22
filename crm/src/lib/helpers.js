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
};

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
