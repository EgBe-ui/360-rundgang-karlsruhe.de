-- Beck360 CRM Database Schema
-- Migration 001: Create all tables, indexes, RLS policies, and triggers

-- ============================================================
-- 1. COMPANIES
-- ============================================================
CREATE TABLE companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id),

  name            TEXT NOT NULL,
  industry        TEXT,
  website         TEXT,
  address         TEXT,
  city            TEXT,
  notes           TEXT,

  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_industry ON companies(industry);

-- ============================================================
-- 2. CONTACTS
-- ============================================================
CREATE TABLE contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id),

  first_name      TEXT,
  last_name       TEXT,
  email           TEXT NOT NULL,
  phone           TEXT,
  position        TEXT,

  company_id      UUID REFERENCES companies(id),

  source          TEXT NOT NULL DEFAULT 'manual'
                  CHECK (source IN ('360-rundgang', 'firmenrundgang', 'manual', 'referral', 'other')),
  source_detail   TEXT,

  gdpr_consent    BOOLEAN DEFAULT false,
  gdpr_consent_at TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_contacts_email ON contacts(email, owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_source ON contacts(source);
CREATE INDEX idx_contacts_created ON contacts(created_at DESC);

-- ============================================================
-- 3. DEALS
-- ============================================================
CREATE TABLE deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id),

  title           TEXT NOT NULL,
  contact_id      UUID REFERENCES contacts(id),
  company_id      UUID REFERENCES companies(id),

  stage           TEXT NOT NULL DEFAULT 'new'
                  CHECK (stage IN ('new','contacted','qualified','proposal','won','lost')),
  service_type    TEXT CHECK (service_type IN (
    '360-tour', 'drone-photo', 'drone-video', 'drone-inspection',
    'streetview', 'bundle', 'other'
  )),
  value           NUMERIC(10,2),
  lost_reason     TEXT,

  stage_changed_at TIMESTAMPTZ DEFAULT NOW(),
  expected_close   DATE,

  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deals_stage ON deals(stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_company ON deals(company_id);
CREATE INDEX idx_deals_created ON deals(created_at DESC);

-- ============================================================
-- 4. ACTIVITIES
-- ============================================================
CREATE TABLE activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id),

  contact_id      UUID REFERENCES contacts(id),
  deal_id         UUID REFERENCES deals(id),
  company_id      UUID REFERENCES companies(id),

  type            TEXT NOT NULL CHECK (type IN (
    'note', 'call', 'email', 'meeting', 'form_submission',
    'stage_change', 'created', 'task'
  )),
  description     TEXT NOT NULL,
  metadata        JSONB,

  due_date        DATE,
  completed       BOOLEAN DEFAULT false,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_contact ON activities(contact_id, created_at DESC);
CREATE INDEX idx_activities_deal ON activities(deal_id, created_at DESC);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_due ON activities(due_date) WHERE NOT completed AND due_date IS NOT NULL;

-- ============================================================
-- 5. FORM SUBMISSIONS (raw archive)
-- ============================================================
CREATE TABLE form_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID REFERENCES contacts(id),
  deal_id         UUID REFERENCES deals(id),
  source_site     TEXT NOT NULL,
  source_page     TEXT,
  form_data       JSONB NOT NULL,
  ip_hash         TEXT,
  is_duplicate    BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON companies
  FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON contacts
  FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON deals
  FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON activities
  FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_only" ON form_submissions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 7. AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
