import type { CountSession, Product } from './types';

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field.trim()); field = ''; }
    else if (char === '\n') { row.push(field.trim()); if (row.some(Boolean)) rows.push(row); row = []; field = ''; }
    else if (char !== '\r') field += char;
  }
  if (quoted) throw new Error('A quoted cell is not closed. Check the last few rows.');
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

const headerNames = {
  sku: ['sku', 'item code', 'product code', 'item_code'],
  barcode: ['barcode', 'bar code', 'upc', 'ean', 'gtin'],
  name: ['name', 'item', 'product', 'description', 'product name'],
  expected: ['expected', 'expected qty', 'on hand', 'stock', 'quantity', 'qty'],
};

function findHeader(headers: string[], aliases: string[]): number {
  return headers.findIndex((header) => aliases.includes(header.toLowerCase().trim()));
}

export function productsFromCsv(text: string): Product[] {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('Add a header row and at least one product row.');
  const headers = rows[0];
  const skuIndex = findHeader(headers, headerNames.sku);
  const barcodeIndex = findHeader(headers, headerNames.barcode);
  const nameIndex = findHeader(headers, headerNames.name);
  const expectedIndex = findHeader(headers, headerNames.expected);
  if (skuIndex < 0 || nameIndex < 0) throw new Error('The CSV needs “sku” and “name” columns. Barcode and expected are optional.');
  const products = rows.slice(1).map((cells, index) => {
    const sku = cells[skuIndex]?.trim();
    const name = cells[nameIndex]?.trim();
    const expectedText = expectedIndex >= 0 ? cells[expectedIndex] : '0';
    const expected = expectedText === '' ? 0 : Number(expectedText);
    if (!sku || !name) throw new Error(`Row ${index + 2} is missing a SKU or name.`);
    if (!Number.isFinite(expected) || expected < 0) throw new Error(`Row ${index + 2} has an invalid expected quantity.`);
    return { id: crypto.randomUUID(), sku, barcode: barcodeIndex >= 0 ? (cells[barcodeIndex] || '').trim() : '', name, expected };
  });
  const identifiers = new Set<string>();
  for (const product of products) {
    for (const value of [product.sku.toLowerCase(), product.barcode.toLowerCase()].filter(Boolean)) {
      if (identifiers.has(value)) throw new Error(`Duplicate SKU or barcode: ${value}. Each scan must identify only one product.`);
      identifiers.add(value);
    }
  }
  return products;
}

function escapeCell(value: unknown): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function adjustmentsCsv(products: Product[], session: CountSession): string {
  const header = ['sku', 'barcode', 'name', 'expected', 'counted', 'adjustment'];
  const rows = products.filter((product) => session.counts[product.id] !== undefined).map((product) => {
    const counted = session.counts[product.id] ?? 0;
    return [product.sku, product.barcode, product.name, product.expected, counted, counted - product.expected];
  });
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}
