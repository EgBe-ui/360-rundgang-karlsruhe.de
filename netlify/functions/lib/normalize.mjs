/**
 * Normalize form fields from German/English mixed forms
 * into a consistent contact shape.
 */
export function normalizeFormData(data) {
  const name = data.name || data.Name || '';
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  return {
    first_name: firstName,
    last_name: lastName,
    email: (data.email || data.Email || data['e-mail'] || '').trim().toLowerCase(),
    phone: (data.phone || data.telefon || data.Telefon || data.tel || '').trim(),
    company: (data.company || data.unternehmen || data.Unternehmen || data.firma || '').trim(),
    message: (data.message || data.nachricht || data.Nachricht || '').trim(),
    subject: (data._subject || '').trim(),
  };
}

/**
 * Detect which site a submission came from based on form data.
 */
export function detectSource(data) {
  const subject = data._subject || '';
  const referer = data._referer || data.referer || '';

  if (subject.includes('firmenrundgang') || subject.includes('Firmenrundgang') ||
      referer.includes('firmenrundgang')) {
    return 'firmenrundgang';
  }
  return '360-rundgang';
}

/**
 * Extract page info from the subject line or referer.
 */
export function detectSourcePage(data) {
  const subject = data._subject || '';
  const referer = data._referer || data.referer || '';

  // Try to extract city/branch from subject like "Anfrage Ettlingen - Firmenrundgang"
  const subjectMatch = subject.match(/Anfrage\s+(.+?)\s*[-–]/);
  if (subjectMatch) return subjectMatch[1];

  // Try to extract path from referer
  if (referer) {
    try {
      const url = new URL(referer);
      return url.pathname !== '/' ? url.pathname : null;
    } catch {
      return null;
    }
  }

  return null;
}
