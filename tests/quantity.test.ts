import { describe, expect, it } from 'vitest';
import { validScanQuantity } from '../src/quantity';

describe('scan quantity boundary', () => {
  it.each([
    [1, true],
    [9999, true],
    [0, false],
    [10000, false],
    [1.5, false],
    [Number.NaN, false],
  ])('validates %s as %s', (value, expected) => {
    expect(validScanQuantity(value)).toBe(expected);
  });
});
