import { jsPDF } from 'jspdf';

const BRAND_COLOR = [26, 92, 107]; // #1a5c6b
const BLACK = [0, 0, 0];
const GRAY = [100, 100, 100];
const LIGHT_GRAY = [200, 200, 200];

function fmtEur(val) {
  const n = parseFloat(val) || 0;
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20ac';
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export function generateEuerPdf({ year, monthlyData, quarterlyData, stats, settings }) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = 210;
  const ml = 25;
  const mr = 25;
  const contentWidth = pw - ml - mr;

  const s = settings || {};
  const companyName = s.company_name || 'BECK360';
  const ownerName = s.owner_name || 'Eugen Beck';
  const addr1 = s.address_line1 || 'Eichenweg 1';
  const zip = s.address_zip || '76275';
  const city = s.address_city || 'Ettlingen';
  const phone = s.phone || '0173-4682501';
  const email = s.email || 'rundgang@beck360.de';
  const website = s.website || 'www.beck360.de';
  const taxId = s.tax_id || '31205/27003';
  const vatId = s.vat_id || 'DE321274049';
  const bankName = s.bank_name || 'VR Bank Suedpfalz';
  const bankIban = s.bank_iban || 'DE92 5486 2500 0001 1389 95';
  const bankBic = s.bank_bic || 'GEN0DE61SUW';

  let y = 20;

  // ===== HEADER =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BRAND_COLOR);
  doc.text('Beck360\u00b0', ml, y);

  doc.setFontSize(16);
  doc.setTextColor(...BLACK);
  doc.text('EINNAHMEN-UEBERSCHUSS-RECHNUNG', pw - mr, y, { align: 'right' });

  y += 8;
  doc.setFontSize(12);
  doc.setTextColor(...GRAY);
  doc.text(`Geschaeftsjahr ${year}`, pw - mr, y, { align: 'right' });

  y += 5;
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  const senderLine = `${companyName} - ${ownerName} - ${addr1} - ${zip} ${city}`;
  doc.text(senderLine, ml, y);
  const senderWidth = doc.getTextWidth(senderLine);
  doc.setDrawColor(...GRAY);
  doc.setLineWidth(0.2);
  doc.line(ml, y + 0.5, ml + senderWidth, y + 0.5);

  y += 12;

  // ===== MONTHLY TABLE =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_COLOR);
  doc.text('Monatsuebersicht', ml, y);
  y += 6;

  // Table columns
  const cols = [
    { label: 'Monat', x: ml, align: 'left', w: 28 },
    { label: 'Einnahmen', x: ml + 30, align: 'right' },
    { label: 'Ausg. netto', x: ml + 58, align: 'right' },
    { label: 'MwSt erh.', x: ml + 84, align: 'right' },
    { label: 'MwSt gez.', x: ml + 108, align: 'right' },
    { label: 'Gewinn', x: ml + 136, align: 'right' },
  ];

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BLACK);
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.line(ml, y, pw - mr, y);
  y += 4;
  cols.forEach(col => {
    const opts = col.align === 'right' ? { align: 'right' } : {};
    doc.text(col.label, col.x, y, opts);
  });
  y += 2;
  doc.line(ml, y, pw - mr, y);
  y += 4;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const totals = { incomeNetto: 0, expensesNetto: 0, vatCollected: 0, vatPaid: 0, profit: 0 };

  monthlyData.forEach(m => {
    doc.text(MONTH_NAMES[m.month - 1], cols[0].x, y);
    doc.text(fmtEur(m.incomeNetto), cols[1].x, y, { align: 'right' });
    doc.text(fmtEur(m.expensesNetto), cols[2].x, y, { align: 'right' });
    doc.text(fmtEur(m.vatCollected), cols[3].x, y, { align: 'right' });
    doc.text(fmtEur(m.vatPaid), cols[4].x, y, { align: 'right' });
    doc.text(fmtEur(m.profit), cols[5].x, y, { align: 'right' });
    totals.incomeNetto += m.incomeNetto;
    totals.expensesNetto += m.expensesNetto;
    totals.vatCollected += m.vatCollected;
    totals.vatPaid += m.vatPaid;
    totals.profit += m.profit;
    y += 4.5;
  });

  // Totals row
  doc.line(ml, y - 1, pw - mr, y - 1);
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.text('Summe', cols[0].x, y);
  doc.text(fmtEur(totals.incomeNetto), cols[1].x, y, { align: 'right' });
  doc.text(fmtEur(totals.expensesNetto), cols[2].x, y, { align: 'right' });
  doc.text(fmtEur(totals.vatCollected), cols[3].x, y, { align: 'right' });
  doc.text(fmtEur(totals.vatPaid), cols[4].x, y, { align: 'right' });
  doc.text(fmtEur(totals.profit), cols[5].x, y, { align: 'right' });
  y += 3;
  doc.line(ml, y, pw - mr, y);

  y += 15;

  // ===== EUER SUMMARY =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND_COLOR);
  doc.text('EUER-Zusammenfassung', ml, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(...BLACK);

  function summaryRow(label, value, opts = {}) {
    if (opts.bold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    doc.text(label, ml, y);
    doc.text(fmtEur(value), pw - mr, y, { align: 'right' });
    y += opts.spacing || 6;
  }

  summaryRow('Betriebseinnahmen (netto)', stats.yearRevenueNetto);
  summaryRow('Betriebsausgaben (netto)', stats.yearExpensesNetto);
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(ml, y - 2, pw - mr, y - 2);
  summaryRow('Gewinn vor Steuern', stats.yearProfit, { bold: true, spacing: 10 });
  summaryRow('MwSt. erhalten', stats.vatCollected);
  summaryRow('MwSt. gezahlt (Vorsteuer)', stats.vatPaid);
  doc.line(ml, y - 2, pw - mr, y - 2);
  summaryRow('MwSt.-Zahllast', stats.vatPayable, { bold: true });

  // ===== FOOTER =====
  const footerY = 270;
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(ml, footerY - 3, pw - mr, footerY - 3);

  doc.setFontSize(7);
  doc.setTextColor(...BLACK);

  const fCol1 = ml;
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, fCol1, footerY);
  doc.text(ownerName, fCol1, footerY + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(addr1, fCol1, footerY + 7);
  doc.text(`${zip} ${city}`, fCol1, footerY + 10.5);
  doc.text(website, fCol1, footerY + 14);
  doc.text(`Steuernummer: ${taxId}`, fCol1, footerY + 17.5);
  doc.text(`USt-IdNr.: ${vatId}`, fCol1, footerY + 21);

  const fCol2 = ml + 55;
  doc.setFont('helvetica', 'bold');
  doc.text('Kontakt:', fCol2, footerY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tel.: ${phone}`, fCol2, footerY + 3.5);
  doc.text(`E-Mail: ${email}`, fCol2, footerY + 7);

  const fCol3 = ml + 110;
  doc.setFont('helvetica', 'bold');
  doc.text('Zahlungsinformationen:', fCol3, footerY);
  doc.setFont('helvetica', 'normal');
  doc.text(`IBAN: ${bankIban}`, fCol3, footerY + 3.5);
  doc.text(`BIC: ${bankBic}`, fCol3, footerY + 7);
  doc.text(bankName, fCol3, footerY + 10.5);

  // ===== OUTPUT =====
  doc.save(`EUER-${year}-Beck360.pdf`);
}
