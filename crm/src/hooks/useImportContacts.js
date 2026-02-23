import { useState, useCallback } from 'preact/hooks';
import { supabase } from '../lib/supabase.js';
import { createCompany } from './useCompanies.js';
import { createContact } from './useContacts.js';

function parseCSVLine(line, delimiter) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function detectDelimiter(headerLine) {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semicolons >= commas ? ';' : ',';
}

function mapRow(headers, values) {
  const row = {};
  headers.forEach((h, i) => {
    row[h] = values[i] || '';
  });
  return {
    companyName: row['Firma'] || '',
    firstName: row['Ansprechpartner Vorname'] || '',
    lastName: row['Ansprechpartner Nachname'] || '',
    street: row['Strasse'] || '',
    zip: row['PLZ'] || '',
    city: row['Stadt'] || '',
    industry: row['Branche'] || '',
    vatId: row['USt-IdNr'] || '',
    notes: row['Notiz'] || '',
  };
}

export function useImportContacts() {
  const [parsed, setParsed] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState(null);

  const parseCSV = useCallback((text) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return null;

    const delimiter = detectDelimiter(lines[0]);
    const headers = parseCSVLine(lines[0], delimiter);
    const rows = lines.slice(1).map(l => mapRow(headers, parseCSVLine(l, delimiter)));

    // Deduplicate companies
    const companyNames = [...new Set(rows.map(r => r.companyName).filter(Boolean))];
    const contactRows = rows.filter(r => r.firstName || r.lastName);

    const data = { rows, companyNames, contactCount: contactRows.length };
    setParsed(data);
    setResults(null);
    return data;
  }, []);

  const importContacts = useCallback(async () => {
    if (!parsed) return;
    setImporting(true);
    setResults(null);

    const { rows, companyNames } = parsed;
    const total = companyNames.length + rows.filter(r => r.firstName || r.lastName).length;
    setProgress({ current: 0, total });

    let created = { companies: 0, contacts: 0 };
    let skipped = { companies: 0, contacts: 0 };
    let errors = [];
    let step = 0;

    // Load existing companies for duplicate check
    const { data: existing } = await supabase
      .from('companies')
      .select('id, name')
      .is('deleted_at', null);
    const existingMap = new Map((existing || []).map(c => [c.name.toLowerCase(), c.id]));

    // Create companies
    const companyIdMap = new Map();
    for (const name of companyNames) {
      const key = name.toLowerCase();
      if (existingMap.has(key)) {
        companyIdMap.set(name, existingMap.get(key));
        skipped.companies++;
      } else {
        const row = rows.find(r => r.companyName === name);
        const address = [row.street, row.zip, row.city].filter(Boolean).join(', ');
        const { data, error } = await createCompany({
          name,
          address: address || null,
          city: row.city || null,
          industry: row.industry || null,
        });
        if (error) {
          errors.push(`Firma "${name}": ${error.message}`);
        } else {
          companyIdMap.set(name, data.id);
          created.companies++;
        }
      }
      step++;
      setProgress({ current: step, total });
    }

    // Load existing contacts for duplicate check
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, company_id')
      .is('deleted_at', null);
    const contactKey = (fn, ln, cid) =>
      `${(fn || '').toLowerCase()}|${(ln || '').toLowerCase()}|${cid || ''}`;
    const existingContactSet = new Set(
      (existingContacts || []).map(c => contactKey(c.first_name, c.last_name, c.company_id))
    );

    // Create contacts
    for (const row of rows) {
      if (!row.firstName && !row.lastName) continue;
      const companyId = companyIdMap.get(row.companyName) || null;
      const key = contactKey(row.firstName, row.lastName, companyId);
      if (existingContactSet.has(key)) {
        skipped.contacts++;
        step++;
        setProgress({ current: step, total });
        continue;
      }
      const { error } = await createContact({
        first_name: row.firstName || null,
        last_name: row.lastName || null,
        company_id: companyId,
        source: 'manual',
      });
      if (error) {
        errors.push(`Kontakt "${row.firstName} ${row.lastName}": ${error.message}`);
      } else {
        created.contacts++;
        existingContactSet.add(key);
      }
      step++;
      setProgress({ current: step, total });
    }

    const res = { created, skipped, errors };
    setResults(res);
    setImporting(false);
    return res;
  }, [parsed]);

  const reset = useCallback(() => {
    setParsed(null);
    setResults(null);
    setProgress({ current: 0, total: 0 });
  }, []);

  return { parseCSV, importContacts, parsed, importing, progress, results, reset };
}
