export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  expected: number;
}

export interface UnknownScan {
  id: string;
  code: string;
  quantity: number;
  createdAt: string;
  resolved: boolean;
  resolution?: string;
}

export interface CountEvent {
  id: string;
  at: string;
  type: 'scan' | 'adjust' | 'reconcile';
  productId: string;
  delta: number;
  code?: string;
}

export interface CountSession {
  id: string;
  name: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  counts: Record<string, number>;
  unknowns: UnknownScan[];
  history: CountEvent[];
}

export interface AppData {
  products: Product[];
  sessions: CountSession[];
  activeSessionId?: string;
}

export const EMPTY_DATA: AppData = { products: [], sessions: [] };
