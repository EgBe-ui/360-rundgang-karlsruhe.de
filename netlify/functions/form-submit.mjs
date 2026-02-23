import { checkSpam } from './lib/spam-check.mjs';

const ALLOWED_ORIGINS = [
  'https://360-rundgang-karlsruhe.de',
  'https://www.360-rundgang-karlsruhe.de',
  'https://firmenrundgang-karlsruhe.de',
  'https://www.firmenrundgang-karlsruhe.de',
];

const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/rundgang@beck360.de';

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Content-Type': 'application/json',
  };
}

export default async (request) => {
  const origin = request.headers.get('origin') || '';
  const headers = corsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  // Parse body
  let rawData;
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      rawData = Object.fromEntries(formData.entries());
    } else {
      rawData = await request.json();
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers });
  }

  // Spam check
  const spam = checkSpam(rawData);
  if (spam.isSpam) {
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  }

  // Forward email via FormSubmit.co
  try {
    await forwardToFormSubmit(rawData);
  } catch (err) {
    console.error('FormSubmit forward error:', err);
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
};

async function forwardToFormSubmit(data) {
  const payload = {};
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith('_') || key === '_subject') {
      payload[key] = value;
    }
  }
  await fetch(FORMSUBMIT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; Beck360/1.0)',
      'Referer': 'https://360-rundgang-karlsruhe.de/',
      'Origin': 'https://360-rundgang-karlsruhe.de',
    },
  });
}
