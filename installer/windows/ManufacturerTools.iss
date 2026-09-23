#ifndef StageRoot
  #error StageRoot must point to the manufacturer tools staging directory
#endif
#ifndef ProductVersion
  #error ProductVersion must be supplied by the controlled build
#endif

#define ProductName "BIO-EMS Manufacturer Tools"

[Setup]
AppId={{DAF41B2F-793B-4D49-B746-8D1476EA3994}
AppName={#ProductName}
AppVersion={#ProductVersion}
DefaultDirName={autopf}\BIO-EMS Manufacturer Tools
DefaultGroupName=BIO-EMS Manufacturer Tools
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
OutputDir={#StageRoot}\output
OutputBaseFilename=BIO-EMS-Manufacturer-Tools-Setup-{#ProductVersion}-x64
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern dynamic windows11
UseSetupLdr=x64
Uninstallable=yes
SetupLogging=yes

[Files]
Source: "{#StageRoot}\payload\manufacturer-backend.zip"; Flags: dontcopy noencryption
Source: "{#StageRoot}\payload\node-v22.22.0-win-x64.zip"; Flags: dontcopy noencryption
Source: "{#StageRoot}\payload\Invoke-ManufacturerOwnerSigner.ps1"; DestDir: "{app}"; Flags: ignoreversion notimestamp
Source: "{#StageRoot}\payload\Start-ManufacturerOwnerSigner.ps1"; DestDir: "{app}"; Flags: ignoreversion notimestamp

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\manufacturer-backend.zip' -DestinationPath '{app}\backend' -Force"""; StatusMsg: "Installing secure signing runtime..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\node-v22.22.0-win-x64.zip' -DestinationPath '{app}\runtime' -Force"""; StatusMsg: "Installing private Node.js runtime..."; Flags: runhidden waituntilterminated

[Icons]
Name: "{group}\BIO-EMS Manufacturer Owner Signer"; Filename: "powershell.exe"; Parameters: "-NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File ""{app}\Start-ManufacturerOwnerSigner.ps1"" -ToolRoot ""{app}"""; WorkingDir: "{app}"
Name: "{commondesktop}\BIO-EMS Manufacturer Owner Signer"; Filename: "powershell.exe"; Parameters: "-NoProfile -STA -WindowStyle Hidden -ExecutionPolicy Bypass -File ""{app}\Start-ManufacturerOwnerSigner.ps1"" -ToolRoot ""{app}"""; WorkingDir: "{app}"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a Manufacturer Owner Signer desktop shortcut"

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssInstall then begin
    ExtractTemporaryFile('manufacturer-backend.zip');
    ExtractTemporaryFile('node-v22.22.0-win-x64.zip');
  end;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if (CurPageID = wpReady) and (not WizardSilent) then
    Result := MsgBox(
      'Install only on an encrypted, company-controlled offline workstation. This package does not contain the manufacturer private key.',
      mbConfirmation,
      MB_YESNO
    ) = IDYES;
end;
