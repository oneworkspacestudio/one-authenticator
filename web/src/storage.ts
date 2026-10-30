import type { Vault } from './crypto';
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => { const r = indexedDB.open('one-authenticator', 1); r.onupgradeneeded = () => r.result.createObjectStore('vault'); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(Error('Private device storage is unavailable.')); });
}
export async function storage(operation: 'get' | 'put' | 'delete', value?: Vault): Promise<Vault | undefined> {
  const db = await database();
  try { return await new Promise((resolve, reject) => { const tx = db.transaction('vault', operation === 'get' ? 'readonly' : 'readwrite'); const store = tx.objectStore('vault'); const request = operation === 'get' ? store.get('account') : operation === 'put' ? store.put(value, 'account') : store.delete('account'); tx.oncomplete = () => resolve(operation === 'get' ? request.result : undefined); tx.onerror = () => reject(Error('The vault could not be saved. Check available storage.')); tx.onabort = tx.onerror; }); } finally { db.close(); }
}
