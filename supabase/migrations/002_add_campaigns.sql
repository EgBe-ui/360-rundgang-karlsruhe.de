-- Beck360 CRM — Migration 002: Email Campaigns
-- Adds campaigns + campaign_recipients tables for Brevo-based email marketing

-- ============================================================
-- 1. CAMPAIGNS
-- ============================================================
CREATE TABLE campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id),

  name            TEXT NOT NULL,
  subject         TEXT NOT NULL,
  body_html       TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'sending', 'sent')),
  filters         JSONB,

  total_sent      INTEGER DEFAULT 0,
  total_opened    INTEGER DEFAULT 0,
  total_clicked   INTEGER DEFAULT 0,

  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created ON campaigns(created_at DESC);

-- ============================================================
-- 2. CAMPAIGN RECIPIENTS
-- ============================================================
CREATE TABLE campaign_recipients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES contacts(id),
  email           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  brevo_message_id TEXT,
  sent_at         TIMESTAMPTZ,
  opened_at       TIMESTAMPTZ,
  clicked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_contact ON campaign_recipients(contact_id);
CREATE INDEX idx_campaign_recipients_brevo ON campaign_recipients(brevo_message_id);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON campaigns
  FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON campaign_recipients
  FOR ALL USING (
    campaign_id IN (SELECT id FROM campaigns WHERE owner_id = auth.uid())
  );

-- ============================================================
-- 4. AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
