import { Alert, Badge, Button, Card, Heading, Image, Input, Link, Metric, Page, Row, Section, Stack, Text } from "./ui"

export function Authenticator({ data, onAction }: { data: any; onAction: (name: string) => void }) {
  return (
    <Page>
      <Stack gap="lg">
        <Row>
          <Image src="./icon.svg" alt="" width={48} height={48} />
          <Stack>
            <Heading level={1}>One Authenticator</Heading>
            <Text>Your OneAccount security code</Text>
          </Stack>
        </Row>
        <Link href="../" variant="apps">Workspace</Link>
        {data.error && (
          <Alert role="alert">{data.error}</Alert>
        )}
        {data.busy && (
          <Text role="status">Securing your vault…</Text>
        )}
        {data.welcome && (
          <Card>
            <Badge>ONE ACCOUNT. YOUR DEVICE.</Badge>
            <Heading level={2}>A little code. A stronger account.</Heading>
            <Text>Keep your OneAccount sign-in code with you, even without internet. No OneAccount login is needed here.</Text>
            <Button onClick={() => onAction("setup")}>Add OneAccount</Button>
            <Button variant="secondary" onClick={() => onAction("install")}>Install on this device</Button>
            <Text>Clearing site data or uninstalling can erase your vault. Save your OneAccount recovery codes separately.</Text>
          </Card>
        )}
        {data.setup && (
          <Card>
            <Heading level={2}>Add OneAccount</Heading>
            <Text>In OneAccount, open Security → Two-factor authentication. Scan the setup QR or enter its key below.</Text>
            <Button variant="secondary" onClick={() => onAction("scan")}>Scan QR code</Button>
            {data.scanning && (
              <Section variant="camera" />
            )}
            <Input name="setupKey" label="OneAccount setup key or provisioning URI" type="password" autocomplete="off" />
            <Input name="accountLabel" label="Account label" autocomplete="off" />
            <Input name="deviceLabel" label="Device label" autocomplete="off" />
            <Input name="passphrase" label="Vault passphrase (14+ characters)" type="password" autocomplete="new-password" />
            <Input name="confirmPassphrase" label="Confirm vault passphrase" type="password" autocomplete="new-password" />
            <Text>Choose a separate, strong passphrase. It cannot be reset here. No PIN or biometric key is stored.</Text>
            <Button onClick={() => onAction("save")}>Encrypt and save</Button>
            <Button variant="secondary" onClick={() => onAction("cancel")}>Cancel</Button>
          </Card>
        )}
        {data.locked && (
          <Card>
            <Badge>ENCRYPTED ON THIS DEVICE</Badge>
            <Heading level={2}>Unlock your vault</Heading>
            <Text>Use your independent vault passphrase. Your code stays on this device.</Text>
            <Input name="unlockPassphrase" label="Vault passphrase" type="password" autocomplete="current-password" />
            <Button onClick={() => onAction("unlock")}>Unlock</Button>
            <Button variant="secondary" onClick={() => onAction("help")}>Lost device or passphrase?</Button>
          </Card>
        )}
        {data.codes && (
          <Card variant="code">
            <Badge>OneAccount</Badge>
            <Text>{data.maskedLabel}</Text>
            <Metric value={data.code} label="Current six-digit code" />
            <Section variant="countdown" value={data.remaining} />
            <Button onClick={() => onAction("copy")}>Copy code</Button>
            <Text role="status">{data.copyStatus}</Text>
            <Badge>{data.connection}</Badge>
            <Row>
              <Button variant="secondary" onClick={() => onAction("settings")}>Settings</Button>
              <Button variant="secondary" onClick={() => onAction("lock")}>Lock vault</Button>
            </Row>
          </Card>
        )}
        {data.settings && (
          <Card>
            <Heading level={2}>Your device, your vault</Heading>
            <Text>{data.device}</Text>
            <Text>The vault always locks when you leave the app. Choose an idle limit below. Codes and keys are never backed up to My Drive.</Text>
            <Button variant="secondary" onClick={() => onAction("idle1")}>Lock after one minute idle (default)</Button>
            <Button variant="secondary" onClick={() => onAction("idle5")}>Lock after five minutes idle</Button>
            <Text>Clock trouble? Enable automatic date and time in your device settings. Codes change every 30 seconds.</Text>
            <Text>One enrolled device is supported per OneAccount account in this release. Replace it in OneAccount Security.</Text>
            <Text>Version 0.1.0-preview.1 · Argon2id / AES-256-GCM</Text>
            <Button variant="secondary" onClick={() => onAction("help")}>Enrollment and recovery help</Button>
            <Button variant="danger" onClick={() => onAction("remove")}>Remove local account</Button>
            <Button variant="secondary" onClick={() => onAction("back")}>Back to code</Button>
          </Card>
        )}
        {data.removing && (
          <Card>
            <Heading level={2}>Remove this local account?</Heading>
            <Text>This erases the local code generator. It does not disable MFA in OneAccount. Make sure you have working recovery codes or another sign-in method.</Text>
            <Input name="removeConfirmation" label="Type REMOVE to confirm" autocomplete="off" />
            <Button variant="danger" onClick={() => onAction("confirmRemove")}>Erase local vault</Button>
            <Button variant="secondary" onClick={() => onAction("back")}>Keep account</Button>
          </Card>
        )}
        {data.help && (
          <Card>
            <Heading level={2}>Keep a way back in</Heading>
            <Text>Android: open this HTTPS page in Chrome and choose Install app. iPhone: use Safari → Share → Add to Home Screen. Install before enrolling.</Text>
            <Text>In OneAccount Security, enable two-factor authentication and verify the first code. Save all ten recovery codes separately from your phone.</Text>
            <Text>Lost your phone or passphrase? At OneAccount sign-in, choose Use a recovery code. Then replace your authenticator and rotate recovery codes.</Text>
            <Text>If every recovery code is lost, contact your Workspace administrator for assisted recovery. Email alone cannot bypass MFA.</Text>
            {data.hasVault && (
              <Button variant="danger" onClick={() => onAction("remove")}>Reset a lost local vault</Button>
            )}
            <Text>TOTP does not prevent phishing. Enter codes only on your trusted OneAccount address. Browser extensions and an unlocked compromised device can read codes.</Text>
            <Button variant="secondary" onClick={() => onAction("back")}>Back</Button>
          </Card>
        )}
      </Stack>
    </Page>
  )
}
