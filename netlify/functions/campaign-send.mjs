import { supabase } from './lib/supabase.mjs';
import { sendTransactionalEmail, personalize } from './lib/brevo.mjs';
import crypto from 'node:crypto';

const JWT_SECRET = process.env.UNSUBSCRIBE_SECRET;
if (!JWT_SECRET) {
  console.error('UNSUBSCRIBE_SECRET env var is not set — unsubscribe tokens will not work');
}
const SITE_URL = 'https://360-rundgang-karlsruhe.de';

function makeUnsubscribeToken(contactId) {
  if (!JWT_SECRET) return null;
  const payload = Buffer.from(JSON.stringify({ sub: contactId, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function appendUnsubscribeLink(html, token) {
  if (!token) return html;
  const url = `${SITE_URL}/api/unsubscribe?token=${token}`;
  const link = `<p style="text-align:center;font-size:12px;color:#888;margin-top:32px;"><a href="${url}" style="color:#888;">Abmelden</a></p>`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${link}</body>`);
  }
  return html + link;
}

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Auth: require Bearer token (Supabase access token)
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!supabase) {
    const hasUrl = !!process.env.SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    return new Response(JSON.stringify({ error: `Server misconfigured: SUPABASE_URL=${hasUrl}, SUPABASE_SERVICE_ROLE_KEY=${hasKey}` }), { status: 500 });
  }

  // Debug: log which URL and key prefix the function uses
  const debugUrl = process.env.SUPABASE_URL || 'NOT SET';
  const debugKeyPrefix = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').substring(0, 20) + '...';

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    console.error('Auth validation failed:', authError?.message || 'No user returned');
    return new Response(JSON.stringify({
      error: `Auth failed: ${authError?.message || 'Invalid token'}`,
      debug_url: debugUrl,
      debug_key_prefix: debugKeyPrefix,
    }), { status: 401 });
  }

  try {
    const { campaign_id, test_email } = await request.json();

    if (!campaign_id) {
      return new Response(JSON.stringify({ error: 'campaign_id required' }), { status: 400 });
    }

    // Load campaign
    const { data: campaign, error: campError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .eq('owner_id', user.id)
      .single();

    if (campError || !campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404 });
    }

    // Test mode: send single email to test_email
    if (test_email) {
      const testHtml = personalize(campaign.body_html, {
        first_name: 'Test',
        last_name: 'Empfaenger',
        company_name: 'Testfirma',
        email: test_email,
      });

      const token = makeUnsubscribeToken('test');
      const finalHtml = appendUnsubscribeLink(testHtml, token);

      await sendTransactionalEmail({
        to: { email: test_email, name: 'Test' },
        subject: `[TEST] ${campaign.subject}`,
        htmlContent: finalHtml,
        tags: ['campaign-test'],
      });

      return new Response(JSON.stringify({ success: true, message: 'Test-Mail gesendet' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Real send: only allow from draft status
    if (campaign.status !== 'draft') {
      return new Response(JSON.stringify({ error: 'Campaign already sent' }), { status: 400 });
    }

    // Update status to sending
    await supabase
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaign_id);

    // Load recipients with contact data — only GDPR-consented, non-deleted contacts
    const { data: recipients } = await supabase
      .from('campaign_recipients')
      .select(`
        id, email, contact_id,
        contact:contacts(first_name, last_name, email, gdpr_consent, deleted_at, company:companies(name))
      `)
      .eq('campaign_id', campaign_id)
      .eq('status', 'pending');

    let sentCount = 0;

    for (const recipient of (recipients || [])) {
      const contact = recipient.contact;

      // Skip if contact doesn't consent or is deleted
      if (!contact || !contact.gdpr_consent || contact.deleted_at) {
        await supabase
          .from('campaign_recipients')
          .update({ status: 'unsubscribed' })
          .eq('id', recipient.id);
        continue;
      }

      try {
        const html = personalize(campaign.body_html, {
          first_name: contact.first_name,
          last_name: contact.last_name,
          company_name: contact.company?.name || '',
          email: contact.email,
        });

        const unsubToken = makeUnsubscribeToken(recipient.contact_id);
        const finalHtml = appendUnsubscribeLink(html, unsubToken);

        const result = await sendTransactionalEmail({
          to: { email: recipient.email, name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() },
          subject: campaign.subject,
          htmlContent: finalHtml,
          tags: [`campaign-${campaign_id}`],
        });

        await supabase
          .from('campaign_recipients')
          .update({
            status: 'sent',
            brevo_message_id: result.messageId || null,
            sent_at: new Date().toISOString(),
          })
          .eq('id', recipient.id);

        sentCount++;

        // Log activity
        await supabase.from('activities').insert({
          owner_id: user.id,
          contact_id: recipient.contact_id,
          type: 'email',
          description: `Kampagne "${campaign.name}" gesendet`,
          metadata: { campaign_id, subject: campaign.subject },
        });
      } catch (sendErr) {
        console.error(`Failed to send to ${recipient.email}:`, sendErr.message);
        await supabase
          .from('campaign_recipients')
          .update({ status: 'bounced' })
          .eq('id', recipient.id);
      }
    }

    // Update campaign stats
    await supabase
      .from('campaigns')
      .update({
        status: 'sent',
        total_sent: sentCount,
        sent_at: new Date().toISOString(),
      })
      .eq('id', campaign_id);

    return new Response(JSON.stringify({ success: true, total_sent: sentCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('campaign-send error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
