import { supabase } from './lib/supabase.mjs';
import crypto from 'node:crypto';

const JWT_SECRET = process.env.UNSUBSCRIBE_SECRET || 'beck360-unsub-default';

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;

  const [payload, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');

  if (sig !== expectedSig) return null;

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return null;
  }
}

const HTML_SUCCESS = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abgemeldet – Beck360</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #334155; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1rem; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 2.5rem; max-width: 480px; text-align: center; }
    h1 { font-size: 1.25rem; margin-bottom: 0.75rem; }
    p { color: #64748b; line-height: 1.6; }
    .icon { font-size: 2.5rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Erfolgreich abgemeldet</h1>
    <p>Sie erhalten keine weiteren E-Mails von Beck360. Falls dies ein Versehen war, kontaktieren Sie uns unter <a href="mailto:rundgang@beck360.de">rundgang@beck360.de</a>.</p>
  </div>
</body>
</html>`;

const HTML_ERROR = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fehler – Beck360</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #334155; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1rem; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 2.5rem; max-width: 480px; text-align: center; }
    h1 { font-size: 1.25rem; margin-bottom: 0.75rem; }
    p { color: #64748b; line-height: 1.6; }
    .icon { font-size: 2.5rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>Ungueltiger Link</h1>
    <p>Der Abmelde-Link ist ungueltig oder abgelaufen. Kontaktieren Sie uns unter <a href="mailto:rundgang@beck360.de">rundgang@beck360.de</a> um sich abzumelden.</p>
  </div>
</body>
</html>`;

export default async (request) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8' };

  const decoded = verifyToken(token);
  if (!decoded || !decoded.sub) {
    return new Response(HTML_ERROR, { status: 400, headers: htmlHeaders });
  }

  // Skip DB update for test tokens
  if (decoded.sub === 'test') {
    return new Response(HTML_SUCCESS, { status: 200, headers: htmlHeaders });
  }

  // Revoke GDPR consent
  const { error } = await supabase
    .from('contacts')
    .update({ gdpr_consent: false })
    .eq('id', decoded.sub);

  if (error) {
    console.error('unsubscribe error:', error);
    return new Response(HTML_ERROR, { status: 500, headers: htmlHeaders });
  }

  return new Response(HTML_SUCCESS, { status: 200, headers: htmlHeaders });
};
