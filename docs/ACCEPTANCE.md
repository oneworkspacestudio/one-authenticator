# Delivery evidence

Work in progress. A release and owner installation must not be claimed from
source changes or a standalone Windows preview alone.

Passed so far: RFC6238 SHA1 reference vectors, leading zeros, rollover,
provisioning restrictions, vault authenticated encryption, wrong passphrase and
tampering; portable host HTTP boundary tests; production PWA build and npm audit
(zero known findings at verification); synthetic Chrome phone/desktop layout,
genuine offline unlock/code generation after reload and reopening, encrypted
IndexedDB, background lock, no third-party requests and no cached vault secrets.

Passed against the final native identity server: genuine QR/manual enrolment,
server-held pending secret and expiry, ten independent recovery codes, password
then limited MFA challenge, signed OIDC/PKCE flow and userinfo, rejection of old
sessions/access/refresh tokens and password grants, atomic OTP/recovery replay
defences, persistent cross-flow rate limits, regeneration and authenticated
removal, encrypted backup/restore preserving identity and signing keys. Actual
OneAccount settings UI provisioned an independent phone browser vault; a code
generated after stopping its host enabled MFA on the server. Synthetic Workspace
HTTP/WebSocket/event-stream tests verify central revocation.

Passed: complete35-app catalog, actual fresh managed setup and protected
Workspace108→109 upgrade, preserved identity/selection/files, old-controller
rejection, central old-hub-session revocation and TOTP SSO to Drive/Docs/Photos;
supported rollback/reapply with original-password SSO. Real PWA1→2 worker update
preserved the encrypted vault and offline unlock. QR recognition and manual-save
camera track shutdown passed with a synthetic camera.

Pending: physical Android Chrome and iPhone
Safari PWA; signed suite publication/channel; protected owner installation.

Physical phone, reboot, clean-host and production security certification are not
established by browser emulation. Record completed evidence and limitations here
before publication.
