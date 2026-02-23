import { jsPDF } from 'jspdf';

const BRAND_COLOR = [26, 92, 107]; // #1a5c6b
const BRAND_LIGHT = [240, 247, 248]; // #f0f7f8
const BLACK = [0, 0, 0];
const GRAY = [100, 100, 100];
const LIGHT_GRAY = [200, 200, 200];
const ZEBRA_BG = [248, 249, 250]; // #f8f9fa
const WHITE = [255, 255, 255];

function fmtEur(val) {
  const n = parseFloat(val) || 0;
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20ac';
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function generateInvoicePdf(invoice, items, settings, options) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = 210; // page width
  const ph = 297; // page height
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
  const paymentRefNote = s.payment_reference_note || 'Bitte verwenden Sie die Rechnungsnummer als Verwendungszweck.';
  const defaultInvoiceIntro = s.default_invoice_intro || 'Vielen Dank fuer Ihren Auftrag. Ich berechne Ihnen fuer folgende Leistungen:';
  const defaultQuoteIntro = s.default_quote_intro || 'Vielen Dank fuer Ihr Interesse. Gerne unterbreite ich Ihnen folgendes Angebot:';

  const isQuote = invoice.type === 'quote';
  const docTitle = isQuote ? 'ANGEBOT' : 'RECHNUNG';
  const numLabel = isQuote ? 'Angebotsnr.' : 'Rechnungsnr.';
  const dateLabel = isQuote ? 'Angebotsdatum' : 'Rechnungsdatum';
  const dueLabel = isQuote ? 'Gueltig bis' : 'Faellig am';

  // ===== 1. ACCENT BAR =====
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, pw, 4, 'F');

  let y = 16;

  // ===== 2. HEADER =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BRAND_COLOR);
  doc.text('Beck360\u00b0', ml, y);

  doc.setFontSize(22);
  doc.setTextColor(...BLACK);
  doc.text(docTitle, pw - mr, y, { align: 'right' });

  y += 14;

  // ===== 3. SENDER LINE (unterstrichen) =====
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  const senderLine = `${companyName} \u2022 ${ownerName} \u2022 ${addr1} \u2022 ${zip} ${city}`;
  doc.text(senderLine, ml, y);
  const senderWidth = doc.getTextWidth(senderLine);
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.2);
  doc.line(ml, y + 1, ml + senderWidth, y + 1);

  y += 8;

  // ===== 4. CUSTOMER ADDRESS (left) =====
  const addrStartY = y;
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  if (invoice.customer_company) {
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.customer_company, ml, y);
    y += 5;
  }
  if (invoice.customer_name) {
    doc.setFont('helvetica', invoice.customer_company ? 'normal' : 'bold');
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

  // ===== 5. INFO BOX (right side, with background) =====
  const boxW = 65;
  const boxX = pw - mr - boxW;
  const boxPad = 4;
  const lineH = 5.5;

  // Build info rows
  const infoRows = [
    [numLabel, invoice.invoice_number],
    [dateLabel, fmtDate(invoice.invoice_date)],
  ];
  if (invoice.due_date) {
    infoRows.push([dueLabel, fmtDate(invoice.due_date)]);
  }
  if (invoice.customer_number) {
    infoRows.push(['Kundennr.', invoice.customer_number]);
  }
  if (invoice.service_date) {
    infoRows.push(['Leistungsdatum', fmtDate(invoice.service_date)]);
  }

  const boxH = boxPad * 2 + infoRows.length * lineH;
  const boxY = addrStartY - 2;

  // Background
  doc.setFillColor(...BRAND_LIGHT);
  doc.roundedRect(boxX, boxY, boxW, boxH, 1.5, 1.5, 'F');

  // Left border accent
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(boxX, boxY, 1, boxH, 'F');

  doc.setFontSize(8.5);
  let infoY = boxY + boxPad + 4;
  for (const [label, value] of infoRows) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(label, boxX + boxPad + 2, infoY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLACK);
    doc.text(value || '', boxX + boxW - boxPad, infoY, { align: 'right' });
    infoY += lineH;
  }

  y = Math.max(y, boxY + boxH + 8);
  y += 4;

  // ===== 6. INTRO TEXT =====
  const introText = invoice.intro_text
    || (isQuote ? defaultQuoteIntro : defaultInvoiceIntro);
  if (introText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...BLACK);
    const introLines = doc.splitTextToSize(introText, contentWidth);
    doc.text(introLines, ml, y);
    y += introLines.length * 4.5 + 6;
  }

  // ===== 7. ITEMS TABLE =====
  const colPos = ml;
  const colDesc = ml + 12;
  const colQty = ml + contentWidth * 0.58;
  const colPrice = ml + contentWidth * 0.76;
  const colTotal = pw - mr;
  const rowH = 6;

  // Table header
  const headerH = 8;
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(ml, y, contentWidth, headerH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...WHITE);
  const headerTextY = y + 5.5;
  doc.text('Pos.', colPos + 2, headerTextY);
  doc.text('Bezeichnung', colDesc, headerTextY);
  doc.text('Menge', colQty, headerTextY, { align: 'right' });
  doc.text('Einzelpreis', colPrice, headerTextY, { align: 'right' });
  doc.text('Gesamt', colTotal - 2, headerTextY, { align: 'right' });
  y += headerH;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Estimate row height
    let thisRowH = rowH;
    if (item.sub_description) thisRowH += 4.5;

    // Page break check
    if (y + thisRowH > 245) {
      drawFooter(doc, pw, ml, mr, companyName, ownerName, addr1, zip, city, phone, email, website, taxId, vatId, bankIban, bankBic, bankName);
      doc.addPage();
      // Redraw accent bar on new page
      doc.setFillColor(...BRAND_COLOR);
      doc.rect(0, 0, pw, 4, 'F');
      y = 16;
    }

    // Zebra stripe
    if (i % 2 === 1) {
      doc.setFillColor(...ZEBRA_BG);
      doc.rect(ml, y, contentWidth, thisRowH, 'F');
    }

    const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    const qtyStr = parseFloat(item.quantity) % 1 === 0
      ? `${parseInt(item.quantity)} Stk.`
      : `${parseFloat(item.quantity).toLocaleString('de-DE')}`;

    const textY = y + 4.5;
    doc.setTextColor(...BLACK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Position number
    doc.setTextColor(...GRAY);
    doc.text(`${i + 1}`, colPos + 2, textY);

    // Description
    doc.setTextColor(...BLACK);
    doc.text(item.description || '', colDesc, textY);

    // Qty, price, total
    doc.text(qtyStr, colQty, textY, { align: 'right' });
    doc.text(fmtEur(item.unit_price), colPrice, textY, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(fmtEur(lineTotal), colTotal - 2, textY, { align: 'right' });

    y += rowH;

    // Sub-description
    if (item.sub_description) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(item.sub_description, colDesc, y + 1);
      y += 4.5;
    }
  }

  // Table bottom border
  doc.setDrawColor(...BRAND_COLOR);
  doc.setLineWidth(0.4);
  doc.line(ml, y, pw - mr, y);
  y += 10;

  // ===== 8. TOTALS BLOCK (right-aligned) =====
  const totalsBlockW = 75;
  const totalsX = pw - mr - totalsBlockW;
  const labelX = totalsX + 3;
  const valX = pw - mr - 3;

  function addTotalRow(label, value, opts = {}) {
    if (opts.highlight) {
      // Highlighted row with brand color background
      doc.setFillColor(...BRAND_COLOR);
      doc.roundedRect(totalsX, y - 4, totalsBlockW, 9, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...WHITE);
      doc.text(label, labelX, y + 1);
      doc.text(value, valX, y + 1, { align: 'right' });
      y += 10;
      return;
    }

    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    if (opts.italic) doc.setFont('helvetica', 'italic');
    doc.setFontSize(opts.size || 9);
    doc.setTextColor(...(opts.color || BLACK));
    doc.text(label, labelX, y);
    doc.text(value, valX, y, { align: 'right' });
    y += opts.spacing || 6;
  }

  // Separator line above totals
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.2);

  addTotalRow('Zwischensumme', fmtEur(invoice.subtotal));

  if (parseFloat(invoice.discount_percent) > 0) {
    const discountAmt = parseFloat(invoice.subtotal) - parseFloat(invoice.net_amount);
    addTotalRow(`Rabatt (- ${invoice.discount_percent}%)`, `-${fmtEur(discountAmt)}`, { color: GRAY });
  }

  addTotalRow('Nettobetrag', fmtEur(invoice.net_amount));
  addTotalRow(`${invoice.vat_rate} % MwSt.`, fmtEur(invoice.vat_amount), { italic: true, color: GRAY });

  // Gesamtbetrag highlighted
  addTotalRow('Gesamtbetrag', fmtEur(invoice.total_amount), { highlight: true });

  if (invoice.status === 'paid') {
    addTotalRow('Bezahlt', fmtEur(invoice.paid_amount || invoice.total_amount), { bold: true, size: 10, color: [22, 163, 74] });
  }

  y += 4;

  // ===== 9. PAYMENT TERMS + REFERENCE NOTE =====
  if (invoice.payment_terms) {
    if (y > 245) {
      drawFooter(doc, pw, ml, mr, companyName, ownerName, addr1, zip, city, phone, email, website, taxId, vatId, bankIban, bankBic, bankName);
      doc.addPage();
      doc.setFillColor(...BRAND_COLOR);
      doc.rect(0, 0, pw, 4, 'F');
      y = 16;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    const lines = doc.splitTextToSize(invoice.payment_terms, contentWidth);
    doc.text(lines, ml, y);
    y += lines.length * 4.5 + 3;
  }

  if (!isQuote && paymentRefNote) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(paymentRefNote, ml, y);
    y += 8;
  }

  // ===== 10. CLOSING MESSAGE =====
  if (invoice.closing_message) {
    if (y > 250) {
      drawFooter(doc, pw, ml, mr, companyName, ownerName, addr1, zip, city, phone, email, website, taxId, vatId, bankIban, bankBic, bankName);
      doc.addPage();
      doc.setFillColor(...BRAND_COLOR);
      doc.rect(0, 0, pw, 4, 'F');
      y = 16;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    const closingLines = doc.splitTextToSize(invoice.closing_message, contentWidth);
    doc.text(closingLines, ml, y);
    y += closingLines.length * 4.5;
  }

  // ===== 11. FOOTER =====
  drawFooter(doc, pw, ml, mr, companyName, ownerName, addr1, zip, city, phone, email, website, taxId, vatId, bankIban, bankBic, bankName);

  // ===== OUTPUT =====
  if (options?.preview) {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    return;
  }

  const filename = `${invoice.invoice_number}.pdf`;
  doc.save(filename);
}

function drawFooter(doc, pw, ml, mr, companyName, ownerName, addr1, zip, city, phone, email, website, taxId, vatId, bankIban, bankBic, bankName) {
  const footerY = 272;

  // Thin brand-color line
  doc.setDrawColor(...BRAND_COLOR);
  doc.setLineWidth(0.3);
  doc.line(ml, footerY - 4, pw - mr, footerY - 4);

  doc.setFontSize(7);

  // Column 1: Company
  const fCol1 = ml;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND_COLOR);
  doc.text(companyName, fCol1, footerY);
  doc.setTextColor(...BLACK);
  doc.text(ownerName, fCol1, footerY + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(addr1, fCol1, footerY + 7);
  doc.text(`${zip} ${city}`, fCol1, footerY + 10.5);
  doc.text(website, fCol1, footerY + 14);
  doc.text(`St.-Nr.: ${taxId}`, fCol1, footerY + 17.5);

  // Column 2: Contact
  const fCol2 = ml + 55;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text('Kontakt', fCol2, footerY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`Tel.: ${phone}`, fCol2, footerY + 3.5);
  doc.text(`E-Mail: ${email}`, fCol2, footerY + 7);
  doc.text(`USt-IdNr.: ${vatId}`, fCol2, footerY + 10.5);

  // Column 3: Bank
  const fCol3 = ml + 110;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text('Bankverbindung', fCol3, footerY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(bankName, fCol3, footerY + 3.5);
  doc.text(`IBAN: ${bankIban}`, fCol3, footerY + 7);
  doc.text(`BIC: ${bankBic}`, fCol3, footerY + 10.5);
}
