@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "LOG=%~dp0BIO-EMS-Pilot-Install.log"

> "%LOG%" echo BIO-EMS Pilot installation log
>>"%LOG%" echo Started: %DATE% %TIME%
>>"%LOG%" echo Package directory: %CD%
>>"%LOG%" echo.

fltmc >nul 2>&1
if errorlevel 1 (
  echo Requesting Administrator permission...
  >>"%LOG%" echo Requesting Administrator permission.
  powershell.exe -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  if errorlevel 1 (
    >>"%LOG%" echo ERROR: Administrator elevation was declined or failed.
    goto :failed
  )
  exit /b
)

>>"%LOG%" echo Administrator permission confirmed.
echo Checking the BIO-EMS pilot package...
for %%F in (
  "Install-PilotSigningCertificate.ps1"
  "BIO-EMS-Pilot-Code-Signing.cer"
  "CERTIFICATE-THUMBPRINT.txt"
) do (
  if not exist "%%~F" (
    >>"%LOG%" echo ERROR: Required package file is missing: %%~F
    goto :failed
  )
)
powershell.exe -NoProfile -Command "$s=@(Get-ChildItem -LiteralPath . -Filter 'BIO-EMS-Setup-*-x64.exe' -File); if($s.Count -ne 1){Write-Error ('Expected exactly one BIO-EMS Setup executable; found '+$s.Count);exit 1};Write-Host ('Setup file: '+$s[0].Name)" >>"%LOG%" 2>&1
if errorlevel 1 goto :failed

echo Installing the BIO-EMS pilot signing certificate...
>>"%LOG%" echo Installing the pilot signing certificate.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\Install-PilotSigningCertificate.ps1" >>"%LOG%" 2>&1
if errorlevel 1 (
  >>"%LOG%" echo ERROR: Certificate installation failed.
  goto :failed
)

echo Verifying the signed BIO-EMS Setup...
>>"%LOG%" echo Verifying the Setup signature.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$setup=@(Get-ChildItem -LiteralPath . -Filter 'BIO-EMS-Setup-*-x64.exe' -File);$signature=Get-AuthenticodeSignature -LiteralPath $setup[0].FullName;Write-Host ('Signature status: '+$signature.Status);if($signature.SignerCertificate){Write-Host ('Publisher: '+$signature.SignerCertificate.Subject)};if($signature.Status -ne 'Valid'){Write-Error ('Setup signature is not valid: '+$signature.Status);exit 1};Start-Process -FilePath $setup[0].FullName -Verb RunAs" >>"%LOG%" 2>&1
if errorlevel 1 (
  >>"%LOG%" echo ERROR: Signature verification or Setup launch failed.
  goto :failed
)

>>"%LOG%" echo SUCCESS: Setup launched.
exit /b 0

:failed
echo.
echo BIO-EMS Pilot installation could not continue safely.
echo A diagnostic file was saved here:
echo %LOG%
echo Send BIO-EMS-Pilot-Install.log to support.
>>"%LOG%" echo Finished with an error: %DATE% %TIME%
pause
exit /b 1
