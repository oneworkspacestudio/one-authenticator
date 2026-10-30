# One Authenticator

Your OneAccount security code, kept on your device. Unlock your encrypted vault
and get a fresh six-digit code every 30 seconds, including without internet.
OneAccount sign-in is never required to open an enrolled authenticator.

## Set up your phone

1. Open **One Authenticator** from Workspace on a trusted HTTPS address.
2. Android Chrome: choose **Install app**. iPhone Safari: **Share → Add to Home Screen**.
3. In OneAccount/MyAccounts, open your account's **MFA → App → Setup/Edit**.
   Verify your current password and choose **Enable two-factor authentication**.
4. On your phone, choose **Add OneAccount** and scan the private QR. Manual key
   entry is available if camera permission is unavailable. Choose an independent
   vault passphrase of at least 14 characters.
5. Enter the phone's six-digit code in OneAccount and verify it. Only then is
   MFA enabled. Save all ten recovery codes separately from your phone.

The setup code is consumed: wait for the next 30-second code before signing in.
Only OneAccount provisioning URIs are supported. Each account currently supports
one independently enrolled phone; another device requires deliberate replacement.

## Everyday use and recovery

Unlock locally, then copy the code into your trusted OneAccount sign-in page.
The vault locks on backgrounding or after one minute without activity. Clipboard
clearing is attempted after 15 seconds; browsers may prevent it. Clearing site
data, browser storage eviction or uninstalling can erase the vault. It has no
cloud backup, passphrase reset, PIN bypass or biometric unlock.

If codes fail, enable automatic date/time on both devices. Do not broaden the
server's clock-skew window. A used code cannot be reused; wait for the next one.

Lost your phone/passphrase? Choose **Use a recovery code** at OneAccount sign-in.
Then open Security and verify your password. Your recent MFA sign-in supplies
factor evidence for five minutes; afterwards supply another current or recovery
code. Disable the old authenticator, sign in again, enrol the replacement and
save the new codes.
Regeneration immediately invalidates the old recovery set. If all codes are lost,
contact your Workspace administrator; there is no email-only MFA bypass.

## Windows host

The portable `one-authenticator.exe` embeds every asset. It needs no Node, Go,
Docker, database or account credentials on the host. Run `start-authenticator.cmd`
or use `config.example.ps1`. Default listener: `127.0.0.1:8798`.
`--public-origin https://your-workspace-address` trusts the existing proxy's Host;
remote HTTP, non-loopback listeners and arbitrary Hosts are rejected.

Managed delivery uses `/authenticator/`, a private port rebased to Workspace's
base port +37, ordinary supervision and release/update/rollback ownership. Its
public routes serve an allowlisted static shell, health and version only. No
account administration or seed API lives here. The service worker is scoped to
the app path; installed phones keep generating codes if the host stops.

Server MFA requires the corresponding updated MyAccounts component and Workspace
manager. Installing only this executable does not enforce MFA for Workspace.

## Build and verification

Build locally on Windows with Go 1.27 and Node 26:
`./scripts/build.ps1 -Go <go.exe>`. `-WebBuild <named-NTFS-copy>` permits a verified
frontend build copy. Locked npm dependencies and generated AUI screens are part
of source; no GitHub Actions are used. `web/acceptance.mjs` exercises encrypted
storage and offline lifecycle in synthetic Chrome. Install its development-only
Playwright dependency before running; it is absent from the shipped application.

See [security and architecture](docs/SECURITY.md) and [delivery evidence](docs/ACCEPTANCE.md).

The [Go runtime BSD notice](docs/GO-RUNTIME-LICENSE.txt) accompanies the Windows
binary as a supplemental release asset. Existing preview assets remain immutable.
