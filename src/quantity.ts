export const MIN_SCAN_QUANTITY = 1;
export const MAX_SCAN_QUANTITY = 9999;

export function validScanQuantity(value: number): boolean {
  return Number.isSafeInteger(value) && value >= MIN_SCAN_QUANTITY && value <= MAX_SCAN_QUANTITY;
}
