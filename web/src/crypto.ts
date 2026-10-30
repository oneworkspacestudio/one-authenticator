import { argon2id } from 'hash-wasm';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(input: string): Uint8Array {
  const value = input.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
  if (!/^[A-Z2-7]{32,104}$/.test(value)) throw Error('Enter a valid OneAccount setup key (at least 160 bits).');
  let bits = 0, buffer = 0; const result: number[] = [];
  for (const char of value) { buffer = (buffer << 5) | alphabet.indexOf(char); bits += 5; if (bits >= 8) { bits -= 8; result.push((buffer >>> bits) & 255); } }
  if (bits && (buffer & ((1 << bits) - 1))) throw Error('Invalid setup key padding.');
  return new Uint8Array(result);
}
export type Account = { secret: string; label: string; device: string };
export function provision(input: string, label = 'OneAccount', device = 'My phone'): Account {
  let secret = input.trim();
  if (secret.toLowerCase().startsWith('otpauth:')) {
    const uri = new URL(secret); const p = uri.searchParams;
    if (uri.protocol !== 'otpauth:' || uri.hostname !== 'totp' || p.get('issuer') !== 'OneAccount' || (p.get('algorithm') || 'SHA1').toUpperCase() !== 'SHA1' || (p.get('digits') || '6') !== '6' || (p.get('period') || '30') !== '30' || p.getAll('secret').length !== 1) throw Error('Only OneAccount TOTP setup codes are supported.');
    label = decodeURIComponent(uri.pathname.slice(1)).replace(/^OneAccount:/, ''); secret = p.get('secret') || '';
  }
  secret = secret.toUpperCase().replace(/[\s=-]/g, ''); base32(secret);
  if (!label.trim() || label.length > 160 || device.length > 80) throw Error('Check the account and device labels.');
  return { secret, label: label.trim(), device: device.trim() || 'My phone' };
}
export async function totp(secret: string, timestamp = Date.now(), digits = 6): Promise<string> {
  if (!Number.isFinite(timestamp) || timestamp < 0) throw Error('Check the device clock.');
  const key = await crypto.subtle.importKey('raw', base32(secret) as BufferSource, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const counter = new Uint8Array(8); new DataView(counter.buffer).setBigUint64(0, BigInt(Math.floor(timestamp / 30000)));
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, counter));
  const offset = mac[19] & 15; const binary = new DataView(mac.buffer).getUint32(offset) & 0x7fffffff;
  return (binary % 10 ** digits).toString().padStart(digits, '0');
}
const enc = new TextEncoder(); const dec = new TextDecoder();
const bytes = (a: Uint8Array) => btoa(String.fromCharCode(...a));
const decode = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const parameters = { memorySize: 65536, iterations: 3, parallelism: 1, hashLength: 32 };
export type Vault = { version: 1; salt: string; iv: string; ciphertext: string };
async function derive(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const raw = await argon2id({ password: passphrase, salt, ...parameters, outputType: 'binary' });
  try { return await crypto.subtle.importKey('raw', raw as BufferSource, 'AES-GCM', false, ['encrypt', 'decrypt']); } finally { raw.fill(0); }
}
export async function seal(account: Account, passphrase: string): Promise<Vault> {
  if (passphrase.length < 14 || passphrase.length > 512) throw Error('Use a vault passphrase of at least 14 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(16)); const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(passphrase, salt); const plain = enc.encode(JSON.stringify(account));
  try { const result = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode('OneAccount vault v1') }, key, plain); return { version: 1, salt: bytes(salt), iv: bytes(iv), ciphertext: bytes(new Uint8Array(result)) }; } finally { plain.fill(0); }
}
export async function open(vault: Vault, passphrase: string): Promise<Account> {
  if (vault?.version !== 1 || typeof vault.salt !== 'string' || typeof vault.iv !== 'string' || typeof vault.ciphertext !== 'string' || vault.salt.length !== 24 || vault.iv.length !== 16 || vault.ciphertext.length > 4096) throw Error('Vault data is damaged or unsupported. Use a recovery code in OneAccount.');
  try {
    const key = await derive(passphrase, decode(vault.salt));
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(vault.iv) as BufferSource, additionalData: enc.encode('OneAccount vault v1') }, key, decode(vault.ciphertext) as BufferSource));
    try { const a = JSON.parse(dec.decode(plain)); return provision(a.secret, a.label, a.device); } finally { plain.fill(0); }
  } catch { throw Error('Could not unlock. Check the passphrase; if storage was lost, use a OneAccount recovery code.'); }
}
