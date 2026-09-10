@echo off
setlocal EnableExtensions
cd /d "%~dp0"

fltmc >nul 2>&1
if errorlevel 1 (
  echo Requesting Administrator permission...
  powershell.exe -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo Installing the BIO-EMS pilot signing certificate...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\Install-PilotSigningCertificate.ps1"
if errorlevel 1 goto :failed

echo Verifying the signed BIO-EMS Setup...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$setup = @(Get-ChildItem -LiteralPath . -Filter 'BIO-EMS-Setup-*-x64.exe' -File); if ($setup.Count -ne 1) { Write-Error 'Expected exactly one BIO-EMS Setup executable'; exit 1 }; $signature = Get-AuthenticodeSignature -LiteralPath $setup[0].FullName; if ($signature.Status -ne 'Valid') { Write-Error ('Setup signature is not valid: ' + $signature.Status); exit 1 }; Write-Host ('Verified publisher: ' + $signature.SignerCertificate.Subject); Start-Process -FilePath $setup[0].FullName -Verb RunAs"
if errorlevel 1 goto :failed

exit /b 0

:failed
echo.
echo BIO-EMS Pilot installation could not continue safely.
echo Keep this window open and send a screenshot to support.
pause
exit /b 1
