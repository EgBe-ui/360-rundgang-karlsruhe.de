import { supabase } from './lib/supabase.mjs';
import { normalizeFormData, detectSource, detectSourcePage } from './lib/normalize.mjs';
import { checkSpam } from './lib/spam-check.mjs';
import crypto from 'node:crypto';

const ALLOWED_ORIGINS = [
  'https://360-rundgang-karlsruhe.de',
  'https://www.360-rundgang-karlsruhe.de',
  'https://firmenrundgang-karlsruhe.de',
  'https://www.firmenrundgang-karlsruhe.de',
];

const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/rundgang@beck360.de';

// Supabase owner_id for Eugen Beck — set after first login
const OWNER_ID = process.env.CRM_OWNER_ID;

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Content-Type': 'application/json',
  };
}

function hashIP(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

export default async (request) => {
  const origin = request.headers.get('origin') || '';
  const headers = corsHeaders(origin);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  try {
    // Parse form data (supports both FormData and JSON)
    let rawData;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      rawData = Object.fromEntries(formData.entries());
    } else {
      rawData = await request.json();
    }

    // Spam check
    const spam = checkSpam(rawData);
    if (spam.isSpam) {
      // Silently accept to not tip off spammers
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // Normalize
    const normalized = normalizeFormData(rawData);
    const sourceSite = detectSource(rawData);
    const sourcePage = detectSourcePage(rawData);

    // IP hash for audit
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip');
    const ipHash = hashIP(clientIP);

    // Store raw submission first (always, even without OWNER_ID)
    const formSubmission = {
      source_site: sourceSite,
      source_page: sourcePage,
      form_data: rawData,
      ip_hash: ipHash,
      is_duplicate: false,
    };

    if (!supabase) {
      // Supabase not configured — just forward email
      const fsResult = await forwardToFormSubmit(rawData);
      return new Response(JSON.stringify({ success: true, formsubmit: fsResult }), { status: 200, headers });
    }

    if (!OWNER_ID) {
      // No owner configured yet — just archive and forward email
      await supabase.from('form_submissions').insert(formSubmission);
      const fsResult = await forwardToFormSubmit(rawData);
      return new Response(JSON.stringify({ success: true, formsubmit: fsResult }), { status: 200, headers });
    }

    // Check for existing contact by email
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', normalized.email)
      .eq('owner_id', OWNER_ID)
      .is('deleted_at', null)
      .maybeSingle();

    let contactId;
    let dealId;

    if (existingContact) {
      // Duplicate — attach activity to existing contact
      contactId = existingContact.id;
      formSubmission.is_duplicate = true;
      formSubmission.contact_id = contactId;
    } else {
      // New contact
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          owner_id: OWNER_ID,
          first_name: normalized.first_name,
          last_name: normalized.last_name,
          email: normalized.email,
          phone: normalized.phone || null,
          source: sourceSite === 'firmenrundgang' ? 'firmenrundgang' : '360-rundgang',
          source_detail: sourcePage,
          gdpr_consent: true,
          gdpr_consent_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (contactError) throw contactError;
      contactId = newContact.id;
      formSubmission.contact_id = contactId;

      // Create a company if provided
      let companyId = null;
      if (normalized.company) {
        const { data: newCompany } = await supabase
          .from('companies')
          .insert({
            owner_id: OWNER_ID,
            name: normalized.company,
            city: sourcePage || null,
          })
          .select('id')
          .single();
        if (newCompany) {
          companyId = newCompany.id;
          await supabase
            .from('contacts')
            .update({ company_id: companyId })
            .eq('id', contactId);
        }
      }

      // Create deal
      const { data: newDeal } = await supabase
        .from('deals')
        .insert({
          owner_id: OWNER_ID,
          title: `Anfrage: ${normalized.first_name} ${normalized.last_name}`.trim() || `Anfrage: ${normalized.email}`,
          contact_id: contactId,
          company_id: companyId,
          stage: 'new',
        })
        .select('id')
        .single();

      if (newDeal) {
        dealId = newDeal.id;
        formSubmission.deal_id = dealId;
      }

      // Activity: created
      await supabase.from('activities').insert({
        owner_id: OWNER_ID,
        contact_id: contactId,
        deal_id: dealId,
        type: 'created',
        description: `Kontakt erstellt via ${sourceSite}${sourcePage ? ' (' + sourcePage + ')' : ''}`,
      });
    }

    // Activity: form submission
    await supabase.from('activities').insert({
      owner_id: OWNER_ID,
      contact_id: contactId,
      deal_id: dealId || null,
      type: 'form_submission',
      description: normalized.message || 'Formular-Anfrage ohne Nachricht',
      metadata: { source_site: sourceSite, source_page: sourcePage },
    });

    // Store raw submission
    await supabase.from('form_submissions').insert(formSubmission);

    // Forward to FormSubmit.co (keep email notification working)
    const fsResult = await forwardToFormSubmit(rawData);

    return new Response(JSON.stringify({ success: true, formsubmit: fsResult }), { status: 200, headers });
  } catch (err) {
    console.error('form-submit error:', err);

    // Still try to forward email even if CRM insert failed
    try {
      const rawData = await request.clone().formData().then(fd => Object.fromEntries(fd.entries())).catch(() => null);
      if (rawData) await forwardToFormSubmit(rawData);
    } catch { /* ignore */ }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  }
};

async function forwardToFormSubmit(data) {
  const payload = {};
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith('_') || key === '_subject') {
      payload[key] = value;
    }
  }
  const res = await fetch(FORMSUBMIT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Referer': 'https://360-rundgang-karlsruhe.de/',
      'Origin': 'https://360-rundgang-karlsruhe.de',
    },
  });
  const result = await res.json().catch(() => ({ raw: await res.text().catch(() => 'no body') }));
  return result;
}
