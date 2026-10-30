# Architecture and threat model

Discovery: `oneworkspacestudio/myaccounts` is the existing OneAccount identity
service, a Windows portable Casdoor derivative. `object/user.go`,
`controllers/auth.go`, `controllers/mfa.go`, `object/myaccounts_factor_use.go`,
`object/token_jwt.go`, `object/token_oauth_util.go`, `routers/authz_filter.go` and
the existing SQLite/DPAPI launcher own the implementation. There is no second
identity database. The Go authenticator host owns only public application assets.

The PWA uses the Web Crypto HMAC-SHA-1 primitive for RFC6238 TOTP: six digits,
30 seconds, minimum 160-bit seed. Provisioning restricts `otpauth://totp` to
issuer OneAccount, SHA1, six digits and 30 seconds. Vault data is AES-256-GCM
authenticated ciphertext in IndexedDB. Argon2id (hash-wasm 4.12.0), 64 MiB,
three passes, one lane, random 16-byte salt derives a nonextractable AES key;
each encryption uses a fresh random 12-byte nonce and fixed version AAD. There
is no stored unlock key. Browser engines cannot guarantee erasure of JS strings.

The server uses pquerna/otp and its existing persistent SQLite atomic replay
counter. Seeds are AES-256-GCM encrypted, with account ID in AAD. The 256-bit
master key is stored separately at `secrets/oneaccount-mfa.dpapi`, using the
existing machine DPAPI + restrictive NTFS ACL mechanism. The encrypted backup
path unwraps this key only inside the passphrase-encrypted archive and rewraps
it at restore. Machine DPAPI requires ACLs; administrators/machine compromise
can recover the key. Back up the protected account data using supported tools,
never export an ordinary database/secret-key pair to cloud storage.

Pending server-side enrolments expire in five minutes. Every security change
requires a fresh password. A completed MFA sign-in supplies equivalent factor
evidence for five minutes; otherwise a fresh TOTP or unused recovery code is
required. This authenticated context does not permit reuse of a raw code.
Verification consumes the setup OTP before activation. Recovery codes contain
128 independent random bits each; only account-bound HMAC-SHA-256 digests are
stored. Single-use consumption and pre-MFA challenge completion use atomic DB
transitions. The accepted TOTP skew is current step ±1; consumed or earlier
steps are rejected. A persistent account bucket allows ten factor attempts per
five-minute wall-clock window across challenges and IP changes; the existing
global login limiter additionally bounds traffic. Fixed-window edge bursts and
account-targeted denial of service remain tradeoffs. No trusted-device cookie
bypasses OneAccount TOTP in this release.

Session proofs bind the actual server session to the current encrypted credential.
All central JWT minting, refresh and protected user APIs enforce that proof.
Legacy sessions and tokens lack it and must reauthenticate after MFA activation.
Activation and recovery-code regeneration expire prior user tokens; removal
atomically clears the credential and revokes all user tokens and sessions.
Workspace revalidates the provider token once per HTTP request and every five
seconds for proxied streams (with a five-second provider timeout), cancelling
WebSockets and event streams on revocation. Provider outages fail closed for
protected apps; the local phone vault stays independent. Independently issued
native app API credentials retain their own revocation policy. Noninteractive
user token grants cannot bypass MFA: they fail closed for TOTP-enabled accounts.

Security events persist without codes/seeds and are shown as account security
notifications. This release does not promise email/push delivery. Existing shared
email relay explicitly supports only verification/password-reset mail. A later
generic security-mail transport should consume the durable event store.

The host refuses unconfigured Hosts/non-loopback listening, uses a restrictive
CSP (including only wasm-unsafe-eval for the Argon2 WASM primitive), and has no
mutable APIs. Service-worker caching is limited to versioned build assets; no
URLs/query data or vault records enter it. HTTPS and trusted publishing still
matter: same-origin XSS, malicious browser extensions, a compromised host update,
OS administrator access and real-time phishing can defeat a software TOTP vault.
TOTP is not phishing resistant. Use the verified issuer origin; consider passkeys
as a separate future control. Browser storage is not hardware Keystore/Keychain.

## All recovery codes lost

There is deliberately no unauthenticated bypass and no admin web toggle that
silently clears another account's MFA. Escalate to the deployment owner. Confirm
ownership using two independent established channels and, where available, a
second administrator; notify existing verified contacts and allow a review delay.
Take a verified encrypted backup before a supervised maintenance recovery. Record
the reason, approvals, time and affected credential, revoke sessions/tokens, then
require fresh independent enrolment and code rotation. This release does not
automate that governance-dependent maintenance procedure.

References: [RFC6238](https://www.rfc-editor.org/rfc/rfc6238.html),
[OWASP MFA](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).
