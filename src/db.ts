import { EMPTY_DATA, type AppData } from './types';

const DB_NAME = 'scan-count-pad';
const DEMO_DB_NAME = 'demo:scan-count-pad';
const STORE_NAME = 'local-data';

function openDb(demo = false): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(demo ? DEMO_DB_NAME : DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadData(demo = false): Promise<AppData> {
  const db = await openDb(demo);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get('app');
    request.onsuccess = () => resolve(request.result ? request.result as AppData : structuredClone(EMPTY_DATA));
    request.onerror = () => reject(request.error);
  });
}

export async function saveData(data: AppData, demo = false): Promise<void> {
  const db = await openDb(demo);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(structuredClone(data), 'app');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export function clearData(demo = false): Promise<void> {
  return openDb(demo).then((db) => new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  }));
}
