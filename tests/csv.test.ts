import { describe, expect, it } from 'vitest';
import { adjustmentsCsv, parseCsv, productsFromCsv } from '../src/csv';

describe('catalog CSV', () => {
  it('parses quoted product names and common headers', () => {
    const products = productsFromCsv('SKU,Barcode,Name,Expected\nA-1,8901,"Bolt, brass",12');
    expect(products).toMatchObject([{ sku: 'A-1', barcode: '8901', name: 'Bolt, brass', expected: 12 }]);
  });

  it('rejects ambiguous identifiers', () => {
    expect(() => productsFromCsv('sku,name\nA,First\na,Second')).toThrow(/Duplicate/);
  });

  it('reports an unclosed quote', () => {
    expect(() => parseCsv('sku,name\nA,"Broken')).toThrow(/not closed/);
  });
});

describe('adjustment CSV', () => {
  it('exports touched products only and computes the delta', () => {
    const products = [
      { id: '1', sku: 'A', barcode: '100', name: 'A thing', expected: 4 },
      { id: '2', sku: 'B', barcode: '', name: 'Untouched', expected: 3 },
    ];
    const csv = adjustmentsCsv(products, { id: 's', name: 'Count', startedAt: '', updatedAt: '', counts: { '1': 6 }, unknowns: [], history: [] });
    expect(csv).toContain('A,100,A thing,4,6,2');
    expect(csv).not.toContain('Untouched');
  });

  it('@claim:formula-safe-export neutralizes every spreadsheet formula prefix in catalog text', () => {
    const products = [
      { id: '1', sku: '=2+2', barcode: '+123', name: '-Formula', expected: 4 },
      { id: '2', sku: '@SUM(A1)', barcode: '', name: 'Safe name', expected: 1 },
    ];
    const csv = adjustmentsCsv(products, { id: 's', name: 'Count', startedAt: '', updatedAt: '', counts: { '1': 2, '2': 0 }, unknowns: [], history: [] });
    expect(csv).toContain("'=2+2,'+123,'-Formula,4,2,-2");
    expect(csv).toContain("'@SUM(A1),,Safe name,1,0,-1");
    expect(csv).not.toMatch(/\r\n[=+\-@]/);
  });
});
