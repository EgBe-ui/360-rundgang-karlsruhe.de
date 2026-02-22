-- Beck360 CRM Database Schema
-- Migration 003: Add invoices, invoice_items, and business_settings tables

-- ============================================================
-- 1. BUSINESS SETTINGS
-- ============================================================
CREATE TABLE business_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) UNIQUE,

  company_name    TEXT DEFAULT 'BECK360',
  owner_name      TEXT DEFAULT 'Eugen Beck',
  address_line1   TEXT DEFAULT 'Eichenweg 1',
  address_zip     TEXT DEFAULT '76275',
  address_city    TEXT DEFAULT 'Ettlingen',
  phone           TEXT DEFAULT '0173-4682501',
  email           TEXT DEFAULT 'rundgang@beck360.de',
  website         TEXT DEFAULT 'www.beck360.de',
  tax_id          TEXT DEFAULT '31205/27003',
  vat_id          TEXT DEFAULT 'DE321274049',
  bank_name       TEXT DEFAULT 'VR Bank Suedpfalz',
  bank_iban       TEXT DEFAULT 'DE92 5486 2500 0001 1389 95',
  bank_bic        TEXT DEFAULT 'GEN0DE61SUW',
  default_payment_days INTEGER DEFAULT 14,
  default_closing_text TEXT DEFAULT 'Vielen Dank fuer Ihr Vertrauen und die angenehme Zusammenarbeit.',
  vat_rate        NUMERIC(5,2) DEFAULT 19.00,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. INVOICES (Rechnungen + Angebote)
-- ============================================================
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id),

  type            TEXT NOT NULL CHECK (type IN ('invoice', 'quote')),
  invoice_number  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),

  -- Verknuepfungen
  company_id      UUID REFERENCES companies(id),
  contact_id      UUID REFERENCES contacts(id),
  deal_id         UUID REFERENCES deals(id),
  converted_from_quote_id UUID REFERENCES invoices(id),

  -- Kundenadresse (Snapshot bei Erstellung)
  customer_company TEXT,
  customer_name    TEXT,
  customer_street  TEXT,
  customer_zip     TEXT,
  customer_city    TEXT,
  customer_number  TEXT,

  -- Daten
  invoice_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  paid_date       DATE,

  -- Betraege
  subtotal        NUMERIC(12,2) DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  net_amount      NUMERIC(12,2) DEFAULT 0,
  vat_rate        NUMERIC(5,2) DEFAULT 19.00,
  vat_amount      NUMERIC(12,2) DEFAULT 0,
  total_amount    NUMERIC(12,2) DEFAULT 0,
  paid_amount     NUMERIC(12,2) DEFAULT 0,

  -- Texte
  payment_terms   TEXT DEFAULT 'Diese Rechnung ist zahlbar innerhalb von 14 Tagen ohne Abzug auf das unten angegebene Bankkonto.',
  closing_message TEXT,
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_type ON invoices(type);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_deal ON invoices(deal_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);

-- ============================================================
-- 3. INVOICE ITEMS (Positionen)
-- ============================================================
CREATE TABLE invoice_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  position        INTEGER NOT NULL DEFAULT 1,
  description     TEXT NOT NULL,
  sub_description TEXT,
  quantity        NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total           NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON business_settings
  FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON invoices
  FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON invoice_items
  FOR ALL USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE owner_id = auth.uid()
    )
  );

-- ============================================================
-- 5. AUTO-UPDATE updated_at TRIGGERS
-- ============================================================
CREATE TRIGGER trg_business_settings_updated_at
  BEFORE UPDATE ON business_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
