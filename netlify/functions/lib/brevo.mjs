const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_BASE_URL = 'https://api.brevo.com/v3';

const SENDER = {
  name: 'Eugen Beck – Beck360',
  email: 'rundgang@beck360.de',
};

export async function sendTransactionalEmail({ to, subject, htmlContent, params = {}, tags = [] }) {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY not configured');
  }

  const response = await fetch(`${BREVO_BASE_URL}/smtp/email`, {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: to.email, name: to.name || to.email }],
      subject,
      htmlContent,
      params,
      tags,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Brevo API error ${response.status}: ${err.message || response.statusText}`);
  }

  return response.json();
}

export function personalize(html, contact) {
  return html
    .replace(/\{\{vorname\}\}/gi, contact.first_name || '')
    .replace(/\{\{nachname\}\}/gi, contact.last_name || '')
    .replace(/\{\{firma\}\}/gi, contact.company_name || '')
    .replace(/\{\{email\}\}/gi, contact.email || '');
}
