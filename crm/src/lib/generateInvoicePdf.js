import { jsPDF } from 'jspdf';

const BRAND_COLOR = [26, 92, 107]; // #1a5c6b
const BLACK = [0, 0, 0];
const GRAY = [100, 100, 100];
const LIGHT_GRAY = [200, 200, 200];

function fmtEur(val) {
  const n = parseFloat(val) || 0;
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20ac';
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function generateInvoicePdf(invoice, items, settings) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = 210; // page width
  const ml = 25;  // margin left
  const mr = 25;  // margin right
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

  const isQuote = invoice.type === 'quote';
  const docTitle = isQuote ? 'ANGEBOT' : 'RECHNUNG';
  const numLabel = isQuote ? 'Angebotsnr.:' : 'Rechnungsnr.:';
  const dateLabel = isQuote ? 'Angebotsdatum:' : 'Rechnungsdatum:';

  let y = 20;

  // ===== HEADER =====
  // Logo text "Beck360°"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BRAND_COLOR);
  doc.text('Beck360\u00b0', ml, y);

  // Document title (right-aligned)
  doc.setFontSize(24);
  doc.setTextColor(...BLACK);
  doc.text(docTitle, pw - mr, y, { align: 'right' });

  y += 20;

  // ===== SENDER LINE (unterstrichen) =====
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  const senderLine = `${companyName} - ${addr1} - ${zip} ${city}`;
  doc.text(senderLine, ml, y);
  const senderWidth = doc.getTextWidth(senderLine);
  doc.setDrawColor(...GRAY);
  doc.setLineWidth(0.2);
  doc.line(ml, y + 0.5, ml + senderWidth, y + 0.5);

  y += 8;

  // ===== CUSTOMER ADDRESS =====
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  if (invoice.customer_company) {
    doc.text(invoice.customer_company, ml, y);
    y += 5;
  }
  if (invoice.customer_name) {
    doc.text(invoice.customer_name, ml, y);
    y += 5;
  }
  doc.setFont('helvetica', 'normal');
  if (invoice.customer_street) {
    doc.text(invoice.customer_street, ml, y);
    y += 5;
  }
  const zipCity = `${invoice.customer_zip || ''} ${invoice.customer_city || ''}`.trim();
  if (zipCity) {
    doc.text(zipCity, ml, y);
    y += 5;
  }

  // ===== INVOICE INFO BOX (right side) =====
  const boxX = 120;
  const boxY = y - 20;
  const boxW = pw - mr - boxX;
  const boxH = 18;
  doc.setDrawColor(...BRAND_COLOR);
  doc.setLineWidth(0.5);
  doc.rect(boxX, boxY, boxW, boxH);

  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text(`${numLabel} ${invoice.invoice_number}`, boxX + 4, boxY + 7);
  doc.text(`${dateLabel} ${fmtDate(invoice.invoice_date)}`, boxX + 4, boxY + 13);

  y = Math.max(y, boxY + boxH + 10);
  y += 5;

  // ===== INTRO TEXT =====
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'normal');
  doc.text('Vielen Dank fuer Ihren Auftrag. Ich berechne Ihnen fuer folgende Leistungen:', ml, y);
  y += 10;

  // ===== ITEMS TABLE =====
  const colX = {
    desc: ml,
    qty: ml + contentWidth * 0.55,
    price: ml + contentWidth * 0.70,
    total: pw - mr,
  };

  // Table header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.line(ml, y, pw - mr, y); // top border
  y += 5;
  doc.text('Bezeichnung', colX.desc, y);
  doc.text('Menge', colX.qty, y, { align: 'right' });
  doc.text('Einzelpreis', colX.price + 15, y, { align: 'right' });
  doc.text('Gesamt', colX.total, y, { align: 'right' });
  y += 2;
  doc.line(ml, y, pw - mr, y); // header bottom
  y += 5;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (const item of items) {
    // Check page break
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    const qtyStr = parseFloat(item.quantity) % 1 === 0
      ? `${parseInt(item.quantity)} Stk.`
      : `${parseFloat(item.quantity).toLocaleString('de-DE')}`;

    doc.text(item.description || '', colX.desc, y);
    doc.text(qtyStr, colX.qty, y, { align: 'right' });
    doc.text(fmtEur(item.unit_price), colX.price + 15, y, { align: 'right' });
    doc.text(fmtEur(lineTotal), colX.total, y, { align: 'right' });
    y += 5;

    if (item.sub_description) {
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(item.sub_description, colX.desc, y);
      doc.setFontSize(9);
      doc.setTextColor(...BLACK);
      y += 5;
    }
  }

  // Table bottom border
  doc.line(ml, y, pw - mr, y);
  y += 8;

  // ===== TOTALS (right-aligned) =====
  const totalsX = pw - mr - 60;
  const valX = pw - mr;

  function addTotalRow(label, value, opts = {}) {
    if (opts.bold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    if (opts.italic) doc.setFont('helvetica', 'italic');
    doc.setFontSize(opts.size || 9);
    doc.text(label, totalsX, y);
    doc.text(value, valX, y, { align: 'right' });
    y += opts.spacing || 6;
  }

  addTotalRow('Zwischensumme', fmtEur(invoice.subtotal));

  if (parseFloat(invoice.discount_percent) > 0) {
    const discountAmt = parseFloat(invoice.subtotal) - parseFloat(invoice.net_amount);
    addTotalRow(`Rabatt (- ${invoice.discount_percent}%)`, `-${fmtEur(discountAmt)}`);
  }

  addTotalRow('Nettobetrag', fmtEur(invoice.net_amount));
  addTotalRow(`${invoice.vat_rate} % MwSt.`, fmtEur(invoice.vat_amount), { italic: true });
  addTotalRow('Gesamtbetrag', fmtEur(invoice.total_amount), { bold: true, size: 10 });

  if (invoice.status === 'paid') {
    addTotalRow('Bezahlt', fmtEur(invoice.paid_amount || invoice.total_amount), { bold: true, size: 10 });
  }

  y += 8;

  // ===== PAYMENT TERMS =====
  if (invoice.payment_terms) {
    // Check page break
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    const lines = doc.splitTextToSize(invoice.payment_terms, contentWidth);
    doc.text(lines, ml, y);
    y += lines.length * 4.5 + 2;
  }

  // Verwenden Sie die Rechnungsnummer als Verwendungszweck
  if (!isQuote) {
    doc.setFontSize(9);
    doc.text('Verwenden Sie die Rechnungsnummer als Verwendungszweck.', ml, y);
    y += 8;
  }

  // ===== CLOSING MESSAGE =====
  if (invoice.closing_message) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    const closingLines = doc.splitTextToSize(invoice.closing_message, contentWidth);
    doc.text(closingLines, ml, y);
    y += closingLines.length * 4.5;
  }

  // ===== FOOTER =====
  const footerY = 270;
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(ml, footerY - 3, pw - mr, footerY - 3);

  doc.setFontSize(7);
  doc.setTextColor(...BLACK);

  // Column 1: Company
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

  // Column 2: Contact
  const fCol2 = ml + 55;
  doc.setFont('helvetica', 'bold');
  doc.text('Kontakt:', fCol2, footerY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tel.: ${phone}`, fCol2, footerY + 3.5);
  doc.text(`E-Mail: ${email}`, fCol2, footerY + 7);

  // Column 3: Bank
  const fCol3 = ml + 110;
  doc.setFont('helvetica', 'bold');
  doc.text('Zahlungsinformationen:', fCol3, footerY);
  doc.setFont('helvetica', 'normal');
  doc.text(`IBAN: ${bankIban}`, fCol3, footerY + 3.5);
  doc.text(`BIC: ${bankBic}`, fCol3, footerY + 7);
  doc.text(bankName, fCol3, footerY + 10.5);

  // ===== SAVE =====
  const filename = `${invoice.invoice_number}.pdf`;
  doc.save(filename);
}
