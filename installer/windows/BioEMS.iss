#ifndef StageRoot
  #error StageRoot must point to a validated DEP-01 staging directory
#endif
#ifndef ProductVersion
  #error ProductVersion must be supplied by the controlled build
#endif

#define ProductName "BIO-EMS"

[Setup]
AppId={{7F182A31-C831-4CCF-965B-BF40A54D14C3}
AppName={#ProductName}
AppVersion={#ProductVersion}
DefaultDirName={autopf}\BIO-EMS
DefaultGroupName=BIO-EMS
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
OutputDir={#StageRoot}\output
OutputBaseFilename=BIO-EMS-Setup-{#ProductVersion}-x64
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern dynamic windows11
UseSetupLdr=x64
RedirectionGuard=yes
Uninstallable=yes
SetupLogging=yes
CloseApplications=yes
RestartApplications=no

[Dirs]
Name: "{commonappdata}\BIO-EMS"
Name: "{commonappdata}\BIO-EMS\data"
Name: "{commonappdata}\BIO-EMS\logs"
Name: "{commonappdata}\BIO-EMS\backups"
Name: "{commonappdata}\BIO-EMS\licensing"

[Files]
Source: "{#StageRoot}\package-manifest.json"; DestDir: "{app}\manifest"; Flags: ignoreversion notimestamp
Source: "{#StageRoot}\payload\backend.zip"; Flags: dontcopy noencryption
Source: "{#StageRoot}\payload\frontend.zip"; Flags: dontcopy noencryption
Source: "{#StageRoot}\payload\node-v22.22.0-win-x64.zip"; Flags: dontcopy noencryption
Source: "{#StageRoot}\payload\influxdb2-2.9.1-windows_amd64.zip"; Flags: dontcopy noencryption
Source: "{#StageRoot}\payload\mosquitto-2.1.2-install-windows-x64.exe"; DestDir: "{app}\vendor"; Flags: ignoreversion notimestamp
Source: "{#StageRoot}\payload\WinSW-x64.exe"; DestDir: "{app}\runtime\service-wrapper"; Flags: ignoreversion notimestamp
Source: "{#SourcePath}\Install-DEP0103Services.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion notimestamp
Source: "{#SourcePath}\Invoke-BackendPreStart.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion notimestamp
Source: "{#SourcePath}\Test-PostInstallHealth.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion notimestamp
Source: "{#SourcePath}\Invoke-DEP0105Lifecycle.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion notimestamp
Source: "{#SourcePath}\Invoke-DEP0105Lifecycle.ps1"; Flags: dontcopy

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\\backend.zip' -DestinationPath '{app}\\backend' -Force"""; StatusMsg: "Extracting BIO-EMS backend..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\\frontend.zip' -DestinationPath '{app}\\frontend' -Force"""; StatusMsg: "Extracting BIO-EMS frontend..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\\node-v22.22.0-win-x64.zip' -DestinationPath '{app}\\runtime\\node' -Force"""; StatusMsg: "Extracting Node.js runtime..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\\influxdb2-2.9.1-windows_amd64.zip' -DestinationPath '{app}\\runtime\\influxdb' -Force"""; StatusMsg: "Extracting InfluxDB runtime..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""{app}\installer\Install-DEP0103Services.ps1"" -ApplicationRoot ""{app}"" -PersistentRoot ""{commonappdata}\BIO-EMS"" -ProductVersion ""{#ProductVersion}"""; StatusMsg: "Configuring protected BIO-EMS services..."; Flags: runhidden waituntilterminated; Check: IsFreshInstall
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""{app}\installer\Test-PostInstallHealth.ps1"" -ApplicationRoot ""{app}"" -PersistentRoot ""{commonappdata}\BIO-EMS"""; StatusMsg: "Verifying BIO-EMS installation health..."; Flags: runhidden waituntilterminated; Check: IsFreshInstall
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""{app}\installer\Invoke-DEP0105Lifecycle.ps1"" -Mode PostUpdate -ApplicationRoot ""{app}"" -PersistentRoot ""{commonappdata}\BIO-EMS"""; StatusMsg: "Verifying update and rollback safety..."; Flags: runhidden waituntilterminated; Check: WasExistingInstall
Filename: "https://localhost/"; Description: "Open BIO-EMS"; Flags: postinstall shellexec skipifsilent nowait

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""{app}\installer\Invoke-DEP0105Lifecycle.ps1"" -Mode Uninstall -ApplicationRoot ""{app}"" -PersistentRoot ""{commonappdata}\BIO-EMS"""; Flags: runhidden waituntilterminated; RunOnceId: "BIOEMSRetainData"

[Icons]
Name: "{group}\BIO-EMS"; Filename: "https://localhost/"
Name: "{commondesktop}\BIO-EMS"; Filename: "https://localhost/"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a BIO-EMS desktop shortcut"

[Code]
var
  ExistingInstallAtStart: Boolean;

function InitializeSetup(): Boolean;
begin
  ExistingInstallAtStart := RegKeyExists(HKLM64, 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{7F182A31-C831-4CCF-965B-BF40A54D14C3}_is1');
  Result := True;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssInstall then begin
    ExtractTemporaryFile('backend.zip');
    ExtractTemporaryFile('frontend.zip');
    ExtractTemporaryFile('node-v22.22.0-win-x64.zip');
    ExtractTemporaryFile('influxdb2-2.9.1-windows_amd64.zip');
  end;
end;

function IsFreshInstall(): Boolean;
begin
  Result := not ExistingInstallAtStart;
end;

function WasExistingInstall(): Boolean;
begin
  Result := ExistingInstallAtStart;
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
  ScriptPath: String;
begin
  Result := '';
  if ExistingInstallAtStart then begin
    ExtractTemporaryFile('Invoke-DEP0105Lifecycle.ps1');
    ScriptPath := ExpandConstant('{tmp}\Invoke-DEP0105Lifecycle.ps1');
    if not Exec('powershell.exe', '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + ScriptPath + '" -Mode PreUpdate -ApplicationRoot "' + ExpandConstant('{app}') + '" -PersistentRoot "' + ExpandConstant('{commonappdata}\BIO-EMS') + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) or (ResultCode <> 0) then
      Result := 'BIO-EMS verified pre-update backup failed.';
  end;
end;
