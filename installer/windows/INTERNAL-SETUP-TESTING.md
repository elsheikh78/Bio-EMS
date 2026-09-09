# BIO-EMS Signed BIO EGYPT Pilot Setup — Clean-Machine Test

This artifact is for controlled qualification on a disposable clean Windows 10/11
x64 computer or virtual machine. It has an internal pilot Authenticode signature,
not a publicly trusted production code-signing signature.

## Safety boundary

- Do not run this Setup on the development workstation or a machine that already
  has Mosquitto or BIO-EMS installed.
- Use an Administrator account on an isolated test machine.
- Do not enter production Email, Telegram, WhatsApp, SMS or licensing secrets.
- Keep the Setup, certificate, thumbprint, build evidence and SHA-256 files together.

## Before installation

1. Confirm Windows is 64-bit and apply current Windows updates.
2. Extract the downloaded GitHub Actions artifact ZIP.
3. Open PowerShell in the extracted directory and verify the Setup hash:

   ```powershell
   Get-FileHash -Algorithm SHA256 .\BIO-EMS-Setup-*-x64.exe
   Get-Content .\SHA256SUMS.txt
   ```

4. Confirm the two SHA-256 values match exactly.
5. Install the BIO-EMS pilot signing certificate from an elevated PowerShell:

   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass
   .\Install-PilotSigningCertificate.ps1
   Get-AuthenticodeSignature .\BIO-EMS-Setup-*-x64.exe | Format-List Status,SignerCertificate
   ```

   Continue only when the status is `Valid` and the displayed certificate thumbprint
   matches `CERTIFICATE-THUMBPRINT.txt`.

6. Confirm no conflicting services exist:

   ```powershell
   Get-Service mosquitto,BIOEMS-* -ErrorAction SilentlyContinue
   ```

   The command must return no services before the fresh-install test.

## Fresh-install test

1. Right-click the Setup executable and choose **Run as administrator**.
2. Keep the default installation path and desktop shortcut enabled.
3. Allow Setup to finish its integrated health verification.
4. Open `https://localhost/` from the BIO-EMS shortcut.
5. Verify the three services and the secret-free health evidence:

   ```powershell
   Get-Service BIOEMS-Backend,BIOEMS-MQTT,BIOEMS-InfluxDB
   Get-Content "C:\ProgramData\BIO-EMS\logs\post-install-health.json"
   ```

All three services and every health check must report `Running` / `true` / `PASS`.

## Reboot and retention test

1. Restart Windows.
2. Repeat the service, browser and health-evidence checks.
3. Uninstall BIO-EMS from Windows Apps.
4. Confirm the application is removed while retained customer data remains under
   `C:\ProgramData\BIO-EMS`.
5. Confirm this evidence exists:

   ```powershell
   Get-Content "C:\ProgramData\BIO-EMS\logs\uninstall-retention.json"
   ```

Record screenshots and the non-secret JSON evidence for the qualification report.
Never share `backend.env`, InfluxDB tokens, MQTT passwords, private keys, installation
identity contents or activation receipts.
