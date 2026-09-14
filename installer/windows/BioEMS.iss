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
Source: "{#SourcePath}\Initialize-PilotAdmin.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion notimestamp
Source: "{#SourcePath}\Invoke-DEP0105Lifecycle.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion notimestamp
Source: "{#SourcePath}\Invoke-DEP0105Lifecycle.ps1"; Flags: dontcopy

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\\backend.zip' -DestinationPath '{app}\\backend' -Force"""; StatusMsg: "Extracting BIO-EMS backend..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\\frontend.zip' -DestinationPath '{app}\\frontend' -Force"""; StatusMsg: "Extracting BIO-EMS frontend..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\\node-v22.22.0-win-x64.zip' -DestinationPath '{app}\\runtime\\node' -Force"""; StatusMsg: "Extracting Node.js runtime..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ""Expand-Archive -LiteralPath '{tmp}\\influxdb2-2.9.1-windows_amd64.zip' -DestinationPath '{app}\\runtime\\influxdb' -Force"""; StatusMsg: "Extracting InfluxDB runtime..."; Flags: runhidden waituntilterminated
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""{app}\installer\Install-DEP0103Services.ps1"" -ApplicationRoot ""{app}"" -PersistentRoot ""{commonappdata}\BIO-EMS"" -ProductVersion ""{#ProductVersion}"" -PilotMode"; StatusMsg: "Configuring protected BIO-EMS services..."; Flags: runhidden waituntilterminated; Check: IsFreshInstall
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""{app}\installer\Initialize-PilotAdmin.ps1"" -ApplicationRoot ""{app}"" -PersistentRoot ""{commonappdata}\BIO-EMS"" -CredentialFile ""{tmp}\bioems-admin-bootstrap.txt"""; StatusMsg: "Creating the customer administrator account..."; Flags: runhidden waituntilterminated; Check: ShouldInitializeAdmin; BeforeInstall: PrepareAdminBootstrap; AfterInstall: ClearAdminBootstrap
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""{app}\installer\Test-PostInstallHealth.ps1"" -ApplicationRoot ""{app}"" -PersistentRoot ""{commonappdata}\BIO-EMS"" -PilotMode"; StatusMsg: "Verifying BIO-EMS installation health..."; Flags: runhidden waituntilterminated; Check: IsFreshInstall
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
  ServicesPresentAtStart: Boolean;
  AdminPage: TInputQueryWizardPage;

function HasUppercase(const Value: String): Boolean;
var I: Integer;
begin
  Result := False;
  for I := 1 to Length(Value) do
    if (Value[I] >= 'A') and (Value[I] <= 'Z') then begin Result := True; Exit; end;
end;

function HasLowercase(const Value: String): Boolean;
var I: Integer;
begin
  Result := False;
  for I := 1 to Length(Value) do
    if (Value[I] >= 'a') and (Value[I] <= 'z') then begin Result := True; Exit; end;
end;

function HasDigit(const Value: String): Boolean;
var I: Integer;
begin
  Result := False;
  for I := 1 to Length(Value) do
    if (Value[I] >= '0') and (Value[I] <= '9') then begin Result := True; Exit; end;
end;

procedure InitializeWizard();
begin
  AdminPage := CreateInputQueryPage(wpSelectTasks, 'Customer Administrator',
    'Create the customer Admin account',
    'Enter credentials for the customer Admin. SYSTEM_OWNER is not created or displayed by this Setup.');
  AdminPage.Add('Admin username:', False);
  AdminPage.Add('Admin email (optional):', False);
  AdminPage.Add('Admin password:', True);
  AdminPage.Add('Confirm Admin password:', True);
  AdminPage.Values[0] := 'admin';
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var Password: String;
begin
  Result := True;
  if CurPageID = AdminPage.ID then begin
    Password := AdminPage.Values[2];
    if Trim(AdminPage.Values[0]) = '' then begin
      MsgBox('Admin username is required.', mbError, MB_OK); Result := False;
    end else if Password <> AdminPage.Values[3] then begin
      MsgBox('The Admin passwords do not match.', mbError, MB_OK); Result := False;
    end else if (Length(Password) < 12) or (not HasUppercase(Password)) or
      (not HasLowercase(Password)) or (not HasDigit(Password)) then begin
      MsgBox('The password must contain at least 12 characters, an uppercase letter, a lowercase letter, and a digit.', mbError, MB_OK);
      Result := False;
    end;
  end;
end;

procedure PrepareAdminBootstrap();
var Username, Password, Email: String;
begin
  if WizardSilent then begin
    Username := GetEnv('BIOEMS_CI_ADMIN_USERNAME');
    Password := GetEnv('BIOEMS_CI_ADMIN_PASSWORD');
    Email := GetEnv('BIOEMS_CI_ADMIN_EMAIL');
  end else begin
    Username := Trim(AdminPage.Values[0]);
    Email := Trim(AdminPage.Values[1]);
    Password := AdminPage.Values[2];
  end;
  SaveStringToFile(
    ExpandConstant('{tmp}\bioems-admin-bootstrap.txt'),
    Username + #13#10 + Email + #13#10 + Password,
    False
  );
end;

procedure ClearAdminBootstrap();
begin
  DeleteFile(ExpandConstant('{tmp}\bioems-admin-bootstrap.txt'));
  AdminPage.Values[2] := '';
  AdminPage.Values[3] := '';
end;

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
  Result := (not ExistingInstallAtStart) or (not ServicesPresentAtStart);
end;

function ShouldInitializeAdmin(): Boolean;
begin
  Result := IsFreshInstall() and (not WizardSilent);
end;

function WasExistingInstall(): Boolean;
begin
  Result := ExistingInstallAtStart and ServicesPresentAtStart;
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
  ScriptPath: String;
begin
  Result := '';
  if ExistingInstallAtStart and ServicesPresentAtStart then begin
    ExtractTemporaryFile('Invoke-DEP0105Lifecycle.ps1');
    ScriptPath := ExpandConstant('{tmp}\Invoke-DEP0105Lifecycle.ps1');
    if not Exec('powershell.exe', '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + ScriptPath + '" -Mode PreUpdate -ApplicationRoot "' + ExpandConstant('{app}') + '" -PersistentRoot "' + ExpandConstant('{commonappdata}\BIO-EMS') + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) or (ResultCode <> 0) then
      Result := 'BIO-EMS verified pre-update backup failed.';
  end;
end;
