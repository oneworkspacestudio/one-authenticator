import { test } from 'node:test';
import assert from 'node:assert/strict';
import { totp, provision, seal, open } from './crypto.ts';
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
test('RFC6238 SHA1 vectors and leading zeros', async () => {
  for (const [seconds, code] of [[59,'94287082'],[1111111109,'07081804'],[1111111111,'14050471'],[1234567890,'89005924'],[2000000000,'69279037'],[20000000000,'65353130']] as const) {
    assert.equal(await totp(secret, seconds * 1000, 8), code); assert.equal(await totp(secret, seconds * 1000), code.slice(-6));
  }
  assert.equal(await totp(secret, 59999), await totp(secret, 30000)); assert.notEqual(await totp(secret, 59999), await totp(secret, 60000));
});
test('provisioning restricts issuer and protocol parameters', () => {
  assert.equal(provision(`otpauth://totp/OneAccount:member?issuer=OneAccount&secret=${secret}`).label,'member');
  for (const uri of [`otpauth://totp/Google:test?issuer=Google&secret=${secret}`,`otpauth://hotp/test?issuer=OneAccount&secret=${secret}`,`otpauth://totp/test?issuer=OneAccount&secret=${secret}&period=60`,'INVALID','ABC1']) assert.throws(() => provision(uri));
});
test('Argon2id/AES-GCM vault: random encryption, wrong passphrase, tampering', async () => {
  const a = provision(secret, 'Synthetic account'); const p = 'independent vault test passphrase';
  const vault = await seal(a,p); assert.deepEqual(await open(vault,p), a); assert.notEqual(vault.ciphertext,(await seal(a,p)).ciphertext); assert(!JSON.stringify(vault).includes(secret));
  await assert.rejects(open(vault,'wrong passphrase')); await assert.rejects(open({...vault, ciphertext:vault.ciphertext.slice(0,-4)+'AAAA'},p)); await assert.rejects(seal(a,'1234'));
});
