export const INVOICE_TYPES = {
  invoice: { label: 'Rechnung', prefix: 'R' },
  quote: { label: 'Angebot', prefix: 'A' },
};

export const INVOICE_STATUS = {
  draft: { label: 'Entwurf', color: '#6366f1' },
  sent: { label: 'Versendet', color: '#f59e0b' },
  paid: { label: 'Bezahlt', color: '#10b981' },
  overdue: { label: 'Ueberfaellig', color: '#ef4444' },
  cancelled: { label: 'Storniert', color: '#64748b' },
};

export function generateInvoiceNumber(type, companyName, customerName) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const prefix = INVOICE_TYPES[type]?.prefix || 'R';
  const abbr = makeAbbreviation(companyName) || makeAbbreviation(customerName) || 'XX';
  return `${prefix}-${y}-${m}-${d}-${abbr}`;
}

function makeAbbreviation(name) {
  if (!name || !name.trim()) return '';
  const cleaned = name.trim();
  const words = cleaned.split(/\s+/);
  if (words.length >= 2) {
    return words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
  }
  return cleaned.slice(0, 3).toUpperCase();
}

export function calculateTotals(items, discountPercent = 0, vatRate = 19) {
  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
  }, 0);

  const discountAmount = subtotal * (parseFloat(discountPercent) || 0) / 100;
  const netAmount = subtotal - discountAmount;
  const vatAmount = netAmount * (parseFloat(vatRate) || 0) / 100;
  const totalAmount = netAmount + vatAmount;

  return {
    subtotal: round2(subtotal),
    discount_amount: round2(discountAmount),
    net_amount: round2(netAmount),
    vat_amount: round2(vatAmount),
    total_amount: round2(totalAmount),
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
