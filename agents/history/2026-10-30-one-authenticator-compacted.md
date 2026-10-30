# One Authenticator — implementation in progress

User authorized implementing the October30 brief, push, release and installation.
No agents or GitHub Actions. The supplied outer workspace is unborn and contains
stale checkouts; do not stage it. Actual provider is oneworkspacestudio/myaccounts.

Canonical new app I:/Projects/one-authenticator. Isolated Workspace clone and
provider worktree are I:/Projects/tooling/one-authenticator-20261030/{workspace,accounts}.
Both branches codex/one-authenticator; provider base f631efc, Workspace f8d91d5.
Preserve unrelated original checkout edits. No new commits/push/releases yet.

PWA: React/TS/Vite, generated AUI screen, only OneAccount provisioning, Web Crypto
RFC6238, Argon2id64MiB/3passes/1lane + AES256GCM, encrypted IndexedDB, independent
passphrase, QR camera/manual fallback, background/idle lock, scoped offline shell.
Go portable loopback host embeds all assets, CSP/Host checks, public health/version.
Source docs describe limitations and supported recovery. Existing MyAccounts
implements pending server enrolment, separate DPAPI-protected envelope key,
account-bound encrypted seeds, ten HMAC recovery digests, atomic replay/challenge,
account-wide throttling, step-up settings and central JWT/API/session enforcement.
One seed/account is an existing schema constraint, explicitly documented.

PASS: PWA crypto vectors/rollover/encryption/tampering; own dependency audit after
Vite7.3.7 patch; native host tests; isolated Chrome offline reload/reopen, vault
storage/wrong phrase/background lock/no cached seeds/no third-party requests;
desktop/phone screenshots visually reviewed. Offline reload initially failed
because Go redirected index.html; fixed by directly serving that shell.

PASS: provider focused object tests; native build tests/vet and UI typecheck/build;
actual native MFA2 plus broadened MFA3 HTTP/OIDC cases and encrypted backup/restore.
The first throttle assertion expected an unmasked message; provider correctly
masked it. A safe authenticated mfa_rate_limited response code now exposes retry
guidance. Broadened synthetic tests cover pending/challenge expiry, normalized
concurrent recovery, regeneration and persistent rate protection. Test-only SQLite
expiry/window edits model elapsed time in the fresh fixture; no production override.

Workspace catalog/distribution/suite tests pass. Source registers public static
allowlist, baseport+37, runtime/private storage, update/recovery/category/branding,
provider introspection of existing hub sessions and installer integration6. Normal
managed builder extended for Authenticator and account-component replacement.
Actual full candidate fresh/upgrade/rollback acceptance remains pending.

Artifacts/logs are task tooling on I. Only C:/Projects/.cache/one-authenticator-20261030
is task-owned NTFS build/test scratch; never use C:/tmp/workspace owner as a fixture.
Owner runtime currently lives C:/tmp/workspace, unlike stale history paths.
Test Go toolchain is C:/Projects/.cache/workspace-categories-20261028/toolchain/go
(Go1.27.3, pre-existing, do not remove). Own module/build caches are inside named C
scratch. I: exFAT module-file reads were very slow. Local file Go proxy populated
the C cache from verified I module archives. Removed only completed task download
caches when C space ran low; NTFS-compressed task modules preserve exact bytes.
Chrome profile data is synthetic/ephemeral. Preview host PID tracked in host.pid.

Next: finish latest native build; real settings UI→offline PWA→server acceptance;
final exact builds/package/licences, complete managed catalog and protected fresh
install/upgrade/recovery, then commits/push/releases/channel and owner deployment.
Current prospective versions app0.1.0-preview.1, provider preview-20261030.1,
Workspace109 (recheck concurrent public releases first). Another independent task
was building Workspace108; preserve its changes/releases when merging main.

Suite signed-Android credentials are absent. Asked user asynchronously to make
the existing signing credentials available locally, never paste secrets. Repository
docs/RELEASING.md requires signed Android via publish-release.ps1. Prior107-only
exception does not authorize skipping signing here. Components can use their own
release workflows. No physical Android/iPhone, reboot or clean-host acceptance.
