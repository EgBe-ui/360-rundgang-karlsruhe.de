import { supabase } from './lib/supabase.mjs';

// Brevo webhook events → recipient status mapping
const EVENT_MAP = {
  delivered: 'sent',
  opened: 'opened',
  click: 'clicked',
  hard_bounce: 'bounced',
  soft_bounce: null, // ignore soft bounces
  unsubscribe: 'unsubscribed',
};

export default async (request) => {
  // Brevo sends POST requests with webhook events
  if (request.method !== 'POST') {
    return new Response('OK', { status: 200 });
  }

  try {
    const body = await request.json();

    // Brevo sends a single event object or an array
    const events = Array.isArray(body) ? body : [body];

    for (const event of events) {
      const eventType = event.event;
      const messageId = event['message-id'] || event.messageId;

      if (!eventType || !messageId) continue;

      const newStatus = EVENT_MAP[eventType];
      if (!newStatus) continue;

      // Find recipient by brevo_message_id
      const { data: recipient } = await supabase
        .from('campaign_recipients')
        .select('id, campaign_id, contact_id, status')
        .eq('brevo_message_id', messageId)
        .maybeSingle();

      if (!recipient) continue;

      // Only upgrade status (don't downgrade opened → sent)
      const statusOrder = ['pending', 'sent', 'opened', 'clicked'];
      const currentIdx = statusOrder.indexOf(recipient.status);
      const newIdx = statusOrder.indexOf(newStatus);

      // Bounced and unsubscribed always apply; otherwise only upgrade
      if (newStatus === 'bounced' || newStatus === 'unsubscribed' || newIdx > currentIdx) {
        const updates = { status: newStatus };

        if (newStatus === 'opened' && !recipient.opened_at) {
          updates.opened_at = new Date().toISOString();
        }
        if (newStatus === 'clicked' && !recipient.clicked_at) {
          updates.clicked_at = new Date().toISOString();
        }

        await supabase
          .from('campaign_recipients')
          .update(updates)
          .eq('id', recipient.id);

        // Update campaign aggregate stats
        if (newStatus === 'opened') {
          const { count } = await supabase
            .from('campaign_recipients')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', recipient.campaign_id)
            .in('status', ['opened', 'clicked']);

          await supabase
            .from('campaigns')
            .update({ total_opened: count || 0 })
            .eq('id', recipient.campaign_id);
        }

        if (newStatus === 'clicked') {
          const { count } = await supabase
            .from('campaign_recipients')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', recipient.campaign_id)
            .eq('status', 'clicked');

          await supabase
            .from('campaigns')
            .update({ total_clicked: count || 0 })
            .eq('id', recipient.campaign_id);
        }

        // Unsubscribe: revoke GDPR consent on the contact
        if (newStatus === 'unsubscribed') {
          await supabase
            .from('contacts')
            .update({ gdpr_consent: false })
            .eq('id', recipient.contact_id);
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('campaign-webhook error:', err);
    // Always return 200 to Brevo so it doesn't retry forever
    return new Response('OK', { status: 200 });
  }
};
